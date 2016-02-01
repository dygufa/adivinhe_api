var palco = function() {
    var _self = this;

    // Configurações
    var cor = '#000';
    var tamanho = 2.7;
    var desenhou = false;
    var desenho = [];

    // Auxiliar da ferraenta desfazer
    var frames = [];

    // Ferramentas
    var ferramentas = {};
    var ferramenta = 'pincel';

    // Informações de comunicação	
    var cronometro = false;
    var cronometro_tempo = false;
    //var ultimoDado = 0;
    //var dados_fila = []; 
    //var dados_fila_tempo = false;
    // Número de mensagens exibidas (utilidade: apagar antigas) / Últimas mensagens (anti-flood) / modo alt
    var dados_chat = [1, 1, null, null, false, false];
    var dados_usuario = false;
    var tela = 'login';
    var jogadores = {};
    var rank = [];
    var desenhista = false;
    var palco_foco = false;
    var click_active = false;
    var acertou = false;

    this.inicia = function() {
        document.onselectstart = function() {
            if (tela == 'jogo' && desenhista == dados_usuario.id) {
                return false;
            }
        };
        if (debug) {
            dados_usuario = {
                id: 1,
                nick: 'dygu',
                email: 'dygu@adivinhe.com'
            };
        }
        // Gera objeto
        ferramentaObj = new ferramentas[ferramenta]();
        // Palco 1
        canvas = document.getElementById('canvas');
        context = canvas.getContext('2d');
        context.fillStyle = '#fff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        desenho = context.getImageData(0, 0, canvas.width, canvas.height);

        // Palco 2
        canvas2 = document.getElementById('canvas2');
        context2 = canvas2.getContext('2d');

        // Valores padrão
        context.strokeStyle = context2.strokeStyle = cor;
        context.fillStyle = context2.fillStyle = cor;
        context.lineWidth = context2.lineWidth = tamanho;

        // Indexa eventos
        $('#canvas, #canvas2').hover(function() {
            palco_foco = true;
        }, function() {
            palco_foco = false;
        });
        document.addEventListener('click', _self.gerenciador, false);
        document.addEventListener('mousedown', _self.gerenciador, false);
        document.addEventListener('mousemove', _self.gerenciador, false);
        document.addEventListener('mouseup', _self.gerenciador, false);
        //document.addEventListener('mouseout',		_self.gerenciador, false);		

        /**
         * SCROLL
         **/
        $('#mensagens-resposta').tinyscrollbar();
        $('#mensagens-conversa').tinyscrollbar();
        $('#placar_rodada').tinyscrollbar();
        $('#placar_geral').tinyscrollbar();
        $('#c_t_cj').tinyscrollbar();
        $('#c_cs_tela').tinyscrollbar();

        /**
         *	ENVIA MENSAGENS
         **/
        $('#form-chat-resposta').submit(function() {
            var msg = $('#input-mensagem-resposta').val();
            if (msg.match(/^\/staf/)) {
                $('#c_cs').css('visibility', 'visible');
                $('#input-mensagem-resposta').val('');
                return false;
            }
            if (msg == '' /*|| msg == dados_chat[2]*/ ) {
                return false;
            }
            dados_chat[2] = msg;
            _self.enviaDados([
                [1, msg]
            ]);
            $('#input-mensagem-resposta').val('');
            return false;
        });

        $('#form-chat-conversa').submit(function() {
            var msg = $('#input-mensagem-conversa').val();
            if (msg.match(/^\/staf/)) {
                $('#c_cs').css('visibility', 'visible');
                $('#input-mensagem-conversa').val('');
                return false;
            }
            if (msg == '' /*|| msg == dados_chat[3]*/ ) {
                return false;
            }
            dados_chat[3] = msg;
            _self.enviaDados([
                [13, msg]
            ]);
            $('#input-mensagem-conversa').val('');
            return false;
        });

        /**
         * FERRAMENTAS
         **/

        $('#g_ferramentas li').hover(
            function() {
                if ($(this).attr('class').indexOf('selecionada') != '-1') {
                    return;
                }
                var position = $(this).css('background-position').replace('px', '').split(' ');
                $(this).css({
                    'background-position': (parseInt(position[0]) - 80) + 'px ' + position[1]
                }).data('hover', 's');
            },
            function() {
                if ($(this).attr('class').indexOf('selecionada') != '-1') {
                    return;
                }
                var position = $(this).css('background-position').replace('px', '').split(' ');
                $(this).css({
                    'background-position': (parseInt(position[0]) + 80) + 'px ' + position[1]
                }).data('hover', 'n');
            }
        );

        $('#g_ferramentas li').click(function() {
            var new_ferramenta = $(this).attr('id').replace('f_', '');

            if (new_ferramenta == 'limpar') {
                if (confirm('Vou apagar tudo que estiver na tela, ok?')) {
                    _self.limpa();
                }
            } else if (new_ferramenta == 'desfazer') {
                _self.desfaz();
            } else {
                //var abc = $(this).attr('class').indexOf('selecionada');
                //alert(ferramenta + ' - ' + abc + ': ' + $(this).attr('class'));
                //antes = new_ferramenta + ' - ' + ferramenta;
                if (new_ferramenta == ferramenta) {
                    return;
                }
                var nohover = ($(this).data('hover') == 'n' || typeof($(this).data('hover')) == 'undefined');
                //alert($(this).data('hover') + ' - ' + (nohover ? '1' : '0'));
                var position = $('.selecionada').css('background-position').replace('px', '').split(' ');
                $('.selecionada').css({
                    'background-position': (parseInt(position[0]) + 163) + 'px ' + position[1]
                });
                $('#g_ferramentas li').removeClass('selecionada');
                $(this).addClass('selecionada');
                var position = $(this).css('background-position').replace('px', '').split(' ');
                $(this).css({
                    'background-position': (parseInt(position[0]) - (nohover ? 163 : 83)) + 'px ' + position[1]
                });
                _self.defineFerramenta(new_ferramenta);
                //alert('antes: ' + antes + ' depois: ' + ferramenta);
            }
        });

        $('#g_cores li').click(function() {
            var cor = $(this).attr('id').replace('c_', '');
            _self.defineCor('#' + cor);

            $('#g_cores li').removeClass('selecionada');
            $(this).addClass('selecionada');
        });

        /**
         * REGISTRO	
         **/
        current_recaptcha = 0;
        registrando = false;
        register_recaptcha = false;
        $('#b_registrar').click(function() {
            $('#c_registro').css('visibility', 'visible');
        });

        $('#r_form, #c_rc_f').submit(function() {
            if (current_recaptcha != 1 && $(this).attr('id') == 'c_rc_f') {
                return false;
            }
            if (register_recaptcha && $('#c_rc').css('visibility') == 'hidden') {
                $('#c_rc').css({
                    'visibility': 'visible'
                });
                $('#malha').css({
                    'display': 'block'
                });
                return false;
            }
            if (registrando) {
                return false;
            }
            registrando = true;
            var email = $('#r_email').val();
            var password = $('#r_password').val();
            var nick = $('#r_nick').val();
            var erros = [];
            // Checa campos em branco
            if (email == '' || password == '' || nick == '') {
                erros.push('Não deixe nada vazio!');
            } else {
                // Checa nick
                var er_nick = new RegExp(/^[A-Za-z0-9_\-\.]+$/);
                if (!er_nick.test(nick)) {
                    erros.push('Seu nome só pode ter letras e números.');
                }
                // Checa email
                var er_email = new RegExp(/^[A-Za-z0-9_\-\.]+@[A-Za-z0-9_\-\.]{2,}\.[A-Za-z0-9]{2,}(\.[A-Za-z0-9])?/);
                if (!er_email.test(email)) {
                    erros.push('Não vale colocar email de mentirinha.');
                }
            }
            if (erros.length) {
                var plural = (erros.length > 1 ? 's' : '');
                var text = 'Corrija o' + plural + ' seguinte' + plural + ' erro' + plural + ':<ul style="margin-left: 30px;">';
                for (var i = 0, t = erros.length; i < t; i++) {
                    text += '<li>' + erros[i] + '</li>';
                }
                text += '</ul>';
                _self.newPopup('Conserte isso!', text, true);
                $('#r_password').val('');
                registrando = false;
                return false;
            }
            $.ajax({
                type: 'POST',
                url: '/dados/registrar',
                data: {
                    nick: nick,
                    senha: password,
                    email: email,
                    recaptcha_status: register_recaptcha,
                    recaptcha_challenge: $('#recaptcha_challenge_field').val(),
                    recaptcha_response: $('#recaptcha_response_field').val()
                },
                complete: function() {
                    registrando = false;
                },
                error: function() {
                    _self.newPopup('Falha de conexão!', 'Por favor, tente novamente mais tarde. Não consigo, no momento, manter contato com o servidor, este erro pode ocorrer por uma interrupção na sua internet ou por uma falha no nosso sistema. Desculpe-me.', true);
                },
                dataType: 'json',
                success: function(res) {
                    if (!res[0] || res[1] == 2) {
                        var title = 'Prontinho';
                        var msg = 'Acabei de te registrar!';
                        if (!res[0]) {
                            title = 'Ops!';
                            msg = res[1];
                        } else {
                            register_recaptcha = false;
                            $('#c_rc').css({
                                'visibility': 'hidden'
                            });
                            $('#r_email, #r_nick').val('');
                        }
                        if (!register_recaptcha) {
                            $('#r_password').val('');
                        }
                        _self.newPopup(title, msg, true);
                    } else {
                        current_recaptcha = 1;
                        register_recaptcha = true;
                        Recaptcha.reload();
                        $('#c_rc').css({
                            'visibility': 'visible'
                        });
                        $('#malha').css({
                            'display': 'block'
                        });
                    }
                }
            });
            return false;
        });

        /**
         *	LOGIN
         **/
        login = function(res, normal) {
            if (res[0]) {
                if (normal) {
                    login_recaptcha = false;
                }
                //Dados do usuário
                _self.dadosUsuario(res[1][0]);
                if (res[1][0].tipo_registro == 0) {
                    $('#m_cf').css('display', 'block');
                } else {
                    $('#m_cf').css('display', 'none');
                }
                // Dados da sala
                var obj = res[1][1];
                //ultimoDado = obj.dados[1];
                $('#info_sala span').html(obj.sala);
                desenhista = obj.desenhista;
                if (obj.desenhista == dados_usuario.id) {
                    $('.ndes').css('display', 'none');
                    $('.sodes').css('display', 'block');
                    $('#input-mensagem-resposta').attr('disabled', 'disabled').val('Desenhistas não respondem. ;)');
                } else {
                    $('.sodes').css('display', 'none');
                }
                if (obj.esperando == false) {
                    $('.ndes').css('display', 'block');
                    _self.cronometro(obj.time_left);
                    _self.executaAcoes(obj.dados[0]);
                } else {
                    $('#status').css({
                        'font-size': '30px',
                        'display': 'block'
                    }).html('Esperando outros jogadores...');
                }
                for (var j = 0, t = obj.membros.length; j < t; j++) {
                    var info_j = obj.membros[j];
                    jogadores[info_j.id] = info_j;
                }
                _self.geraListaJogadores();
                palco.adicionaMensagem('Server', 'Bem vindo! Use /room [sala] para trocar de sala.', false, 'server');
                palco.adicionaMensagem('Moderador', 'Este jogo está em fase BETA, recomendamos o uso do navegador Google Chrome. Página sem compatibilidade com Internet Explore e compatibilidade parcial com o Firefox (depende da versão). Estamos trabalhando para torná-lo universal.', false, 'mod');
                // Configurações adicionais
                _self.defineTela('jogo');
                _self.recebeDados();
            } else {
                var switch_error = (typeof(res[1]) == 'object' ? res[1][0] : res[1]);
                switch (switch_error) {
                    case 'crowded':
                        _self.newPopup('Lotado!', 'Pedimos mil desculpas! O jogo está lotado. Tente mais tarde. Estamos trabalhando para aumentar a capacidade de jogadores. <b>:(</b>', true);
                        break;
                    case 'banned':
                        _self.newPopup('Parado ai!', res[1][1], true);
                        break;
                    case 'invalid_user':
                        _self.newPopup('Ops!', 'Não há ninguém com este nome e senha. <b>:(</b>', true);
                        if (normal) {
                            login_recaptcha = res[1][1];
                            if (res[1][1] == true) {
                                current_recaptcha = 2;
                            }
                        }
                        break;
                    case 'invalid_recaptcha':
                        Recaptcha.reload();
                        _self.newPopup('Ops!', 'As letrinhas estão incorretas. <b>:(</b>', true);
                        break;
                    case 'active_recaptcha':
                        Recaptcha.reload();
                        $('#c_rc').css({
                            'visibility': 'visible'
                        });
                        $('#malha').css({
                            'display': 'block'
                        });
                        return false;
                        break;
                }
            }
        };

        logando = false;
        login_recaptcha = false;
        // Normal 
        $('#l_form, #c_rc_f').submit(function() {
            if (current_recaptcha != 2 && $(this).attr('id') == 'c_rc_f') {
                return false;
            }
            if (login_recaptcha && $('#c_rc').css('visibility') == 'hidden') {
                $('#c_rc').css({
                    'visibility': 'visible'
                });
                $('#malha').css({
                    'display': 'block'
                });
                return false;
            }
            if (logando) {
                return false;
            }
            logando = true;
            $.ajax({
                type: 'POST',
                url: '/dados/login?modo=normal',
                data: {
                    nick: $('#l_nick').val(),
                    senha: $('#l_password').val(),
                    recaptcha_status: login_recaptcha,
                    recaptcha_challenge: $('#recaptcha_challenge_field').val(),
                    recaptcha_response: $('#recaptcha_response_field').val()
                },
                dataType: 'json',
                beforeSend: function() {
                    $('#l_password').val('');
                },
                complete: function() {
                    logando = false;
                },
                error: function() {
                    _self.newPopup('Falha de conexão!', 'Por favor, tente novamente mais tarde. Não consigo, no momento, manter contato com o servidor, este erro pode ocorrer por uma interrupção na sua internet ou por uma falha no nosso sistema. Desculpe-me.', true);
                },
                success: function(res) {
                    login(res, true);
                }
            });
            return false;
        });

        de_enviando = false;
        // Dados extras
        $('#f_i_l').live('submit', function() {
            if (de_enviando) {
                return false;
            }
            de_enviando = true;
            $.ajax({
                type: 'POST',
                url: '/dados/login?modo=dados_incompletos',
                data: {
                    nick: ($('#fil_nick') ? $('#fil_nick').val() : ''),
                    email: ($('#fil_email') ? $('#fil_email').val() : '')
                },
                dataType: 'json',
                beforeSend: function() {
                    $('#fil_status').css('display', 'block').html('Verificando...');
                },
                complete: function() {
                    de_enviando = false;
                },
                success: function(res) {
                    if (res[0] == 'error') {
                        $('#fil_status').html((typeof(res[1]) == 'object' ? res[1][1] : res[1]));
                    } else if (res[0] == 'success') {
                        $('#malha').css('display', 'none');
                        $('#c_social').css({
                            'visibility': 'hidden'
                        });
                        login([true, res[1]]);
                    }
                }
            });
            return false;
        });

        // Redes sociais
        $('#login #external li').click(function() {
            var modo = $(this).attr('id').replace('e_', '');
            var dimensoes = (modo == 'msn' ? [465, 375] : [640, 420]);
            var url = 'http://adivinhe.com/dados/login?modo=' + modo;
            popupLogin = window.open(url, "Login Adivinhe", "width=" + dimensoes[0] + ",height=" + dimensoes[1] + ",status=yes,toolbar=no,menubar=no,location=yes,resizable=yes,scrollbars=yes");
            $('#malha').css('display', 'block');
            $('#c_social').css({
                'visibility': 'visible'
            });
            $('#social_titulo').html('Facebook');
            $('#social_conteudo').css({
                'text-align': 'center',
                'font-size': '18px'
            }).html('Aguardando...');
            var checkpopupLogin = setInterval(
                function() {
                    if (popupLogin.closed || !popupLogin || typeof popupLogin.closed == 'undefined') {
                        clearInterval(checkpopupLogin);
                        $.ajax({
                            type: 'GET',
                            url: '/dados/login?modo=recupera',
                            dataType: 'json',
                            beforeSend: function() {
                                $('#social_conteudo').html('Processando...');
                            },
                            error: function() {
                                $('#social_conteudo').html('Falha de conexão. "/');
                            },
                            success: function(res) {
                                $('#social_conteudo').css({
                                    'text-align': 'left',
                                    'font-size': '14px'
                                });
                                switch (res[0]) {
                                    case 'error':
                                        $('#social_conteudo').html((typeof(res[1]) == 'object' ? res[1][1] : res[1]));
                                        break;
                                    case 'success':
                                        $('#malha').css('display', 'none');
                                        $('#c_social').css({
                                            'visibility': 'hidden'
                                        });
                                        login([true, res[1]]);
                                        break;
                                    case 'incomplete':
                                        var html = '<div id="fil_status"></div>';
                                        html += 'Olá, ' + res[1] + '. Eu preciso de mais informações:';
                                        html += '<br/><br/>';
                                        html += '<form id="f_i_l">';
                                        for (var i = 0, t = res[2].length; i < t; i++) {
                                            if (res[2][i][0] == 'nick') {
                                                html += '<label>Um apelido:</label>';
                                                html += '<input type="text" id="fil_nick"/>';
                                                html += '<br/>';
                                                html += 'Obs.: O nick <b>' + res[2][i][1][0] + '</b> está disponível!';
                                                html += '<br/>';
                                            }
                                            if (res[2][i][0] == 'email') {
                                                html += '<label>Seu email:</label>';
                                                html += '<input type="text" id="fil_email"/>';
                                                html += '<br/>';
                                            }
                                        }
                                        html += '<br/>';
                                        html += '<button type="submit" id="fil_button">Enviar</button>';
                                        html += '</form>';
                                        $('#social_conteudo').html(html);
                                        break;
                                }
                            }
                        });
                    }
                }, 500
            );
            return false;
        });

        /**
         * Console administrativo
         **/

        $('#c_cs_f').submit(function() {
            var msg = $('#c_cs_texto').val();
            if (msg != '') {
                $('#c_cs_tela ul').append('<li class="comando">> ' + msg + '</li>');
                $('#c_cs_tela').tinyscrollbar_update('bottom');
                _self.enviaDados([
                    [80, msg]
                ]);
                $('#c_cs_texto').val('');
            }
            return false;
        });

        /**
         * TOOLTIPI
         **/
        //$('#menu li').colorTip({color:'blue',timeout:50});

        /**
         * MENU
         **/

        /*$('#menu li').mouseover(function()
		{
			$(this).animate({'margin-top': '-7px'}, 250);
		}).mouseout(function()
		{
			$(this).animate({'margin-top': '0'}, 250);
		});*/

        $('#menu li').click(function() {
            var key = $(this).attr('id').replace('m_', '');
            if (key == 'cf') {
                $('#c_cf_nick').val(dados_usuario.nick);
                $('#c_cf_email').val(dados_usuario.email);
            }
            $('#c_' + key).css({
                'visibility': 'visible'
            });
        });

        $('.c_fechar').click(function() {
            $(this).closest('.flying_box').css({
                'visibility': 'hidden'
            });
            if ($(this).attr('id') != 'c_e' && $('#c_rc').css('visibility') == 'hidden') {
                $('#malha').css({
                    'display': 'none'
                });
            }
        });

        $('.flutuante').draggable({
            handle: 'h2'
        });

        // Configurações
        editando = false;
        $('#c_cf_f').submit(function() {
            if (editando) {
                return false;
            }
            editando = true;
            $.ajax({
                type: 'POST',
                url: '/dados/editar?token=' + dados_usuario.token,
                data: {
                    id: dados_usuario.id,
                    nick: $('#c_cf_nick').val(),
                    email: $('#c_cf_email').val(),
                    nova_senha: $('#c_cf_newpw').val(),
                    atual_senha: $('#c_cf_oldpw').val()
                },
                dataType: 'json',
                beforeSend: function() {
                    $('#c_cf_button').val('Atualizando...');
                },
                complete: function() {
                    $('#c_cf_newpw, #c_cf_oldpw').val('');
                    editando = false;
                    $('#c_cf_button').val('Atualizar');
                },
                error: function() {
                    _self.newPopup('Falha de conexão!', 'Por favor, tente novamente mais tarde. Não consigo, no momento, manter contato com o servidor, este erro pode ocorrer por uma interrupção na sua internet ou por uma falha no nosso sistema. Desculpe-me.', true);
                },
                success: function(res) {
                    if (res.length == 1) {
                        _self.executaErros(res[0]);
                    } else {
                        var title = 'Ops!';
                        if (res[0]) {
                            title = 'Aewww!';
                            dados_usuario.email = $('#c_cf_email').val();
                        }
                        _self.newPopup(title, res[1]);
                    }
                }
            });
            return false;
        });

        // Contato
        contatando = false;
        $('#c_ct_f').submit(function() {
            if (contatando) {
                return false;
            }
            contatando = true;
            $.ajax({
                type: 'POST',
                url: '/dados/contato?token=' + dados_usuario.token,
                data: {
                    assunto: $('#c_ct_motivo').val(),
                    texto: $('#c_ct_texto').val()
                },
                dataType: 'json',
                beforeSend: function() {
                    $('#c_ct_button').val('Enviando...');
                },
                complete: function() {
                    $('#c_ct').css({
                        'visibility': 'hidden'
                    });
                    $('#c_ct_texto').val('');
                    contatando = false;
                    $('#c_ct_button').val('Enviar');
                },
                error: function() {
                    _self.newPopup('Falha de conexão!', 'Por favor, tente novamente mais tarde. Não consigo, no momento, manter contato com o servidor, este erro pode ocorrer por uma interrupção na sua internet ou por uma falha no nosso sistema. Desculpe-me.', true);
                },
                success: function(res) {
                    if (res.length == 1) {
                        _self.executaErros(res[0]);
                    } else {
                        var title = 'Ops!';
                        if (res[0]) {
                            title = 'Aewww!';
                        }
                        _self.newPopup(title, res[1]);
                    }
                }
            });
            return false;
        });

        // Atalhos
        /*
        $('body').bind('keydown', function(e) {
            var keycode = e.which;
            if (keycode == 8) {
                return false;
            }

            if (keycode == 9 && tela == 'jogo') {
                if (desenhista == dados_usuario.id) {
                    return;
                }
                if (acertou) {
                    $('#input-mensagem-conversa').focus().data('focus', true);
                }
                var focus_conversa = $('#input-mensagem-conversa').data('focus');
                var focus_resposta = $('#input-mensagem-resposta').data('focus');
                if (focus_resposta == null || focus_conversa == true) {
                    $('#input-mensagem-resposta').focus().data('focus', true);
                    $('#input-mensagem-conversa').data('focus', false);
                } else {
                    $('#input-mensagem-conversa').focus().data('focus', true);
                    $('#input-mensagem-resposta').data('focus', false);
                }
                return false;
            }
            //console.log(e.which);
        });
		*/

        // Comandos
        $('#o_pular').click(function() {
            _self.enviaDados([
                [14]
            ]);
        });

        $('#o_dica').click(function() {
            _self.enviaDados([
                [15]
            ]);
        });

        $('#o_denunciar').click(function() {
            _self.enviaDados([
                [16]
            ]);
        });
    };

    this.newPopup = function(titulo, texto, escurecer) {
        $('#e_titulo').html(titulo);
        $('#e_descricao').html(texto);
        $('#c_e').css({
            'visibility': 'visible'
        });
        if (escurecer) {
            $('#malha').css({
                'display': 'block'
            });
        }
    };

    this.defineTela = function(nova_tela) {
        if (tela == nova_tela) {
            return;
        }

        if (nova_tela == 'jogo') {
            $('#game').removeClass('escondida');
            $('#home, #intermediate').addClass('escondida');
            $('body').css({
                'background': '#000 url(/media/img/bg_game.png) center -25px no-repeat'
            });
            $('#menu').css({
                'display': 'block'
            });
            //$('.botao_jogo').fadeIn(0);
            //$('.caixa_incial').css('visibility', 'hidden');
            tela = 'jogo';
        } else if (nova_tela == 'login') {
            $('#home').removeClass('escondida');
            $('#game, #intermediate').addClass('escondida');
            $('body').css({
                'background': '#000 url(/media/img/bg_home.png) center -25px no-repeat'
            });
            $('#menu').css({
                'display': 'none'
            });
            //$('.botao_jogo').fadeOut(0);
            //$('.caixa_jogo').css('visibility', 'hidden');
            tela = 'login';
        } else if (nova_tela == 'intermediaria') {
            $('#intermediate').removeClass('escondida');
            $('#game, #home').addClass('escondida');
            $('body').css({
                'background': '#000 url(/media/img/bg_game.png) center -25px no-repeat'
            });
            $('#menu').css({
                'display': 'block'
            });
            tela = 'intermediaria';
        }
    };

    this.dadosUsuario = function(obj) {
        dados_usuario = obj;
    };

    this.geraListaJogadores = function() {
        arrJogadores = [];
        for (var i in jogadores) {
            arrJogadores.push(jogadores[i]);
        }
        var sortNumber = function(a, b) {
            return b.pontos - a.pontos;
        };
        arrJogadores.sort(sortNumber);
        html = '';
        alt = false;
        for (var i = 0, t = arrJogadores.length; i < t; i++) {
            if (typeof(arrJogadores[i]) !== 'object') continue;
            var jogador = arrJogadores[i];
            html += '<div class="jogador ' + (alt ? 'alt' : '') + ' ' + (desenhista == jogador.id ? 'desenhando' : '') + '">';
            html += '<div class="avatar" ' + (jogador.imagem ? 'style="background-image: url(' + jogador.imagem + ');"' : '') + '></div>';
            html += '<div class="info">';
            html += '<b>' + jogador.nick + '</b><br/>';
            //html += 'Iniciante<br/>';
            html += 'Tem ' + jogador.pontos + ' pontos';
            html += '</div></div>';
            alt = !alt;
        }
        $('#placar_geral ul').html(html + '<div class="clear"></div>');
        $('#n_jogadores').html(t);
        html = '';
        alt = false;
        for (var i = 0, t = rank.length; i < t; i++) {
            var info_rank = rank[i];
            var info_jogador = jogadores[info_rank[0]];
            if (typeof(info_jogador) !== 'object') continue;
            html += '<div class="jogador ' + (alt ? 'alt' : '') + '">';
            html += '<div class="avatar" ' + (info_jogador.imagem ? 'style="background-image: url(' + info_jogador.imagem + ');"' : '') + '></div>';
            html += '<div class="info">';
            html += '<b>' + info_jogador.nick + '</b>';
            html += '<br/>';
            html += 'Acertou em ' + (i + 1) + '° lugar';
            html += '<br/>';
            html += 'Demorou ' + info_rank[2] + 's';
            html += '</div>';
            html += '</div>';
            alt = !alt;
        }
        $('#placar_rodada ul').html(html);

        $('#placar_rodada').tinyscrollbar_update();
        $('#placar_geral').tinyscrollbar_update();
    };
    // crir = contagem regrssiva para inicio de rodada
    this.cronometro = function(restante, crir) {
        if (cronometro !== false) {
            clearInterval(cronometro);
        }
        tempo_original = restante;
        cronometro_tempo = restante;
        cronometro = setInterval(function() {
            if (crir === true) {
                var regressiva = (cronometro_tempo - tempo_original) + 3;
                if (regressiva > 0) {
                    $('#status').css({
                        'font-size': '70px',
                        'display': 'block'
                    }).html(regressiva);
                } else if (regressiva == 0) {
                    $('#status').css({
                        'display': 'none'
                    }).html('');
                }
            }
            cronometro_tempo--;
            $('#info_tempo span').html(cronometro_tempo + 's');
            if (cronometro_tempo <= 0) {
                clearInterval(cronometro);
            }
        }, 1000);
    };

    this.executaErros = function(erro) {
        var switch_erro = (typeof(erro) == 'object' ? erro[0] : erro);
        switch (switch_erro) {
            case 'invalid_token':
                $('#e_titulo').html('Isso não vale!');
                $('#e_descricao').html('Só é permitida uma janela com o jogo aberto. Caso não tenha aberto outra janela é possível que sua conta esteja sendo acessada de outro local.');
                break;
            case 'banned':
                $('#e_titulo').html('Parado ai!');
                $('#e_descricao').html('Você foi banido por ' + erro[1] + ' hora(s). Motivo: ' + erro[2]);
                break;
            case 'invalid_user':
                $('#e_titulo').html('Desconectado!');
                $('#e_descricao').html('Talvez tenha ficado muito tempo ausente. <b>:(</b>');
                break;
            case 'invalid_session':
                $('#e_titulo').html('Desconectado!');
                $('#e_descricao').html('Sessão desconhecida, tente entrar novamente por favor.');
                break;
            case 'invalid_room':
                $('#e_titulo').html('Ops!');
                $('#e_descricao').html('Tivemos um problema com essa sala, tente entrar novamente. <b>:(</b>');
                break;
            case 'disconnected':
                $('#e_titulo').html('Falha de conexão!');
                $('#e_descricao').html('Por favor, tente novamente mais tarde. Não consigui, nos ultimos 20s, manter contato com o servidor, este erro pode ocorrer por uma interrupção na sua internet ou por uma falha no nosso sistema. Desculpe-me.');
                break;
        }
        $('#c_e').css({
            'visibility': 'visible'
        });
        $('#malha').css({
            'display': 'block'
        });

        // Cofigurações de reiicialização
        $('#input-mensagem-resposta, #input-mensagem-conversa').removeAttr('disabled').val('');
        $('.ingame').css({
            'visibility': 'hidden'
        });
        $('#status').css({
            'display': 'none'
        }).html('');
        $('#mensagens-conversa ul').html('');
        $('#mensagens-resposta ul').html('');
        $('#placar_rodada ul').html('');
        $('#placar_geral ul').html('');
        clearInterval(cronometro);
        $('#info_tempo span').html(0);
        cronometro_tempo = 0;
        dados_chat = [1, 1, null, null, false, false];
        dados_usuario = false;
        jogadores = {};
        rank = [];
        desenhista = false;
        acertou = false;
        _self.limpa(false);
        _self.limpa2();
        // Defie tela de login para a exibição do erro
        _self.defineTela('login');
    };

    this.executaAcoes = function(data) {
        if ((j = data.length)) {
            for (var a = 0; a <= j; a++) {
                if ((q = data[a])) {
                    var tipo = parseInt(q[0]);
                    switch (tipo) {
                        case 1:
                            _self.adicionaMensagem(q[1], q[2], false, (q[3] ? q[3] : false));
                            break;
                        case 13:
                            _self.adicionaMensagem(q[1], q[2], true, (q[3] ? q[3] : false));
                            break;
                        case 2:
                            _self.linha(q[1], q[2], q[3], q[4], true, false);
                            break;
                        case 3:
                            _self.quadrado_vazio(q[1], q[2], q[3], q[4], false);
                            break;
                        case 4:
                            _self.quadrado_cheio(q[1], q[2], q[3], q[4], true, false);
                            break;
                        case 5:
                            _self.balde(q[1], q[2], false);
                            break;
                        case 6:
                            _self.elipse_vazia(q[1], q[2], q[3], q[4], false);
                            break;
                        case 7:
                            _self.elipse_cheia(q[1], q[2], q[3], q[4], false);
                            break;
                        case 8:
                            _self.defineCor(q[1], false);
                            break;
                        case 9:
                            _self.desfaz(false);
                            break;
                        case 10:
                            _self.limpa(false);
                            break;
                        case 11:
                            var dados = q[1].split('@');
                            var total_parametros = dados.length;
                            var ultimo = false;
                            for (var b = 0; b <= total_parametros; b++) {
                                if (dados[b] != undefined) {
                                    var parte = dados[b].split('-');
                                    if (ultimo) {
                                        _self.linha(ultimo[0], ultimo[1], parseInt(parte[0]), parseInt(parte[1]), false, false);
                                    }
                                    ultimo = [parseInt(parte[0]), parseInt(parte[1])];
                                }
                            }
                            _self.atualizaDesenho();
                            break;
                        case 12:
                            var dados = q[1].split('@');
                            var total_parametros = dados.length;
                            for (var c = 0; c <= total_parametros; c++) {
                                if (dados[c] != undefined) {
                                    var parte = dados[c].split('-');
                                    _self.quadrado_cheio(parte[0], parte[1], 30, 30, false, false);
                                }
                            }
                            _self.revisaDesenho();
                            break;
                        case 49:
                            _self.adicionaMensagem('Moderador', 'Nova dica da palavra: ' + q[1], true, 'mod');
                            if (desenhista != dados_usuario.id) {
                                $('#info_palavra span').html(q[1]);
                            }
                            break;
                        case 50:
                            jogadores[q[1].id] = q[1];
                            _self.geraListaJogadores();
                            break;
                        case 51:
                            delete jogadores[q[1]];
                            _self.geraListaJogadores();
                            break;
                        case 52:
                            if (desenhista) {
                                jogadores[desenhista].pontos = q[3];
                            }
                            _self.defineCor('#000', false);
                            //_self.defineFerramenta('pincel');
                            acertou = false;
                            $('#input-mensagem-resposta').removeAttr('disabled').val('');
                            rank = [];
                            _self.limpa(false);
                            _self.limpa2();
                            _self.cronometro(q[1], true);
                            desenhista = q[2];
                            if (q[2] == dados_usuario.id) {
                                $('#f_pincel').click();
                                $('.ndes').css('display', 'none');
                                $('.sodes').css('display', 'block');
                                $('#input-mensagem-resposta').attr('disabled', 'disabled').val('Desenhistas não respondem. ;)');
                            } else {
                                $('.ndes').css('display', 'block');
                                $('.sodes').css('display', 'none');
                            }
                            $('#info_palavra span').html('?');
                            _self.geraListaJogadores();
                            // Apaga novamente para garantir que estará vazia!
                            /*setTimeout(function() {
                            	_self.limpa(false);
                            }, 2000);*/
                            break;
                        case 53:
                            acertou = false;
                            $('#status').css({
                                'font-size': '30px',
                                'display': 'block'
                            }).html('Esperando outros jogadores...');
                            $('#input-mensagem-resposta').removeAttr('disabled').val('');
                            rank = [];
                            desenhista = false;
                            _self.limpa(false);
                            _self.limpa2();
                            $('#info_palavra span').html('?');
                            clearInterval(cronometro);
                            $('#info_tempo span').html(0);
                            $('.sodes, #o_denunciar').css('display', 'none');
                            _self.geraListaJogadores();
                            break;
                        case 54:
                            $('#info_palavra span').html(q[1]);
                            _self.adicionaMensagem('Moderador', 'Você tem 20 segundos para começar a desenhar: ' + q[1] + '.', false, 'mod');
                            break;
                        case 55:
                            acertou = false;
                            _self.limpa(false);
                            _self.limpa2();
                            $('#input-mensagem-resposta').removeAttr('disabled').val('');
                            var obj = q[1];
                            rank = obj.rank;
                            //ultimoDado = obj.dados[1];
                            $('#info_sala span').html(obj.sala);
                            desenhista = obj.desenhista;
                            if (obj.desenhista == dados_usuario.id) {
                                $('.sodes').css('display', 'block');
                                $('#input-mensagem-resposta').attr('disabled', 'disabled').val('Desenhistas não respondem. ;)');
                            } else {
                                $('.sodes').css('display', 'none');
                            }
                            if (obj.esperando == false) {
                                $('#status').css({
                                    'display': 'none'
                                }).html('');
                                _self.cronometro(obj.time_left);
                                _self.executaAcoes(obj.dados[0]);
                            } else {
                                clearInterval(cronometro);
                                $('#info_tempo span').html(0);
                                $('#status').css({
                                    'font-size': '30px',
                                    'display': 'block'
                                }).html('Esperando outros jogadores...');
                            }
                            jogadores = {};
                            for (var j = 0, t = obj.membros.length; j < t; j++) {
                                var info_j = obj.membros[j];
                                jogadores[info_j.id] = info_j;
                            }
                            _self.geraListaJogadores();
                            break;
                        case 56:
                            rank.push(q[1]);
                            jogadores[q[1][0]].pontos += q[1][1];
                            _self.geraListaJogadores();
                            if (q[1][0] == dados_usuario.id) {
                                $('#input-mensagem-resposta').attr('disabled', 'disabled').val('Você acertou!');
                                _self.adicionaMensagem('Server', 'Parabéns, você adivinhou!', false, 'server');
                                acertou = true;
                            } else {
                                _self.adicionaMensagem('Server', jogadores[q[1][0]].nick + ' acertou!', false, 'server');
                            }
                            break;
                        case 80:
                            $('#c_cs_tela ul').append('<li class="resposta">' + q[1] + '</li>');
                            $('#c_cs_tela').tinyscrollbar_update('bottom');
                            break;
                    }
                }
            }
        }
    };

    this.adicionaMensagem = function(nome, texto, conversa, especial) {
        var new_id = 0,
            mod_alt = null;
        if (conversa == true) {
            var element = $('#mensagens-conversa');
            mod_alt = dados_chat[5];
            dados_chat[5] = !dados_chat[5];
            if ((new_id = dados_chat[1]++) > 50) {
                $('#c_c_' + (dados_chat[1] - 50)).remove();
            }
        } else {
            var element = $('#mensagens-resposta');
            mod_alt = dados_chat[4];
            dados_chat[4] = !dados_chat[4];
            if ((new_id = dados_chat[0]++) > 50) {
                $('#c_r_' + (dados_chat[0] - 50)).remove();
            }
        }
        element.find('ul').append('<li class="' + (mod_alt ? 'alt' : '') + ' ' + (especial ? 'e_' + especial : '') + '" id="c_' + (conversa ? 'c' : 'r') + '_' + new_id + '"><span>[' + nome + ']</span> ' + texto + '</li>');
        element.tinyscrollbar_update('bottom');
    };

    this.tentaReconectar = function() {
        // numero de tentativas com erro
        nte = (typeof(nte) == 'number' ? nte + 1 : 1);
        if (nte == 4) {
            _self.executaErros('disconnected');
            return false;
        }
        setTimeout(function() {
            _self.recebeDados();
        }, 5000);
    };

    this.recebeDados = function() {
        if (tela != 'jogo') {
            return;
        }

        $.ajax({
            type: 'GET',
            url: '/dados/recebe?token=' + dados_usuario.token,
            dataType: 'json',
            error: function() {
                _self.tentaReconectar();
            },
            success: function(res) {
                var status = (res[0] ? res[0] : false);
                switch (status) {
                    case 'success':
                        _self.executaAcoes(res[1][0]);
                        break;
                    default:
                        _self.executaErros(status);
                        break;
                }
                /*if(res[1] && res[1][1]) {
                	//ultimoDado = res[1][1];
                }*/
                _self.recebeDados();
            }
        });
    };

    /*this.enviaDadosFila = function(dados)
    {
    	if(dados) {
    		dados_fila = dados_fila.concat(dados);			
    	}
    	
    	if(dados_fila_tempo == false)
    	{
    		dados_fila_tempo = true;
    		setTimeout(function(){
    			var max = 2;		
    			var n_fila = dados_fila.length;	
    			var divide = (n_fila >= max);
    			var envia = (divide ? dados_fila.slice(0, n_fila) : dados_fila);				
    			_self.enviaDados(envia);
    			dados_fila = (divide ? dados_fila.slice(n_fila) : []);
    			dados_fila_tempo = false;
    			if(divide && dados_fila.length) {
    				_self.enviaDadosFila();
    			}
    		}, 500);	
    	}	
    };*/

    this.enviaDados = function(dados) {
        if (debug) {
            console.log(JSON.stringify(dados));
            return;
        }
        if (tela != 'jogo') {
            return;
        }

        $.ajax({
            type: 'POST',
            url: '/dados/envia?token=' + dados_usuario.token,
            data: {
                'dados': JSON.stringify(dados)
            },
            dataType: 'json',
            success: function(res) {
                var status = res[0];
                switch (status) {
                    case 'success':
                        if (res[1][0] == 1) {
                            _self.executaAcoes(res[1][1]);
                        }
                        break;
                    default:
                        _self.executaErros(status);
                        break;
                }
            }
        });
    };

    this.gerenciador = function(ev) {
        if (typeof(dados_usuario['id']) == 'undefined' || desenhista != dados_usuario.id || (ev.type == 'mousedown' && !palco_foco)) {
            return;
        }
        if (ev.type == 'mousedown') {
            click_active = true;
        }
        if (ev.type == 'mouseup') {
            if (!click_active) {
                return;
            }
            click_active = false;
        }
        var cord_palco = $('#canvas').offset();
        var stop = false;
        var max_x = 490,
            max_y = 245;

        ev._x = ((ev.clientX + $(document.body).scrollLeft()) - cord_palco.left);
        ev._y = ((ev.clientY + $(document.body).scrollTop()) - cord_palco.top) - 5;

        var ifClickOutStop = function() {
            if (ev.type == 'mousedown') {
                stop = true;
            }
        };
        if (ev._x <= 1) {
            ev._x = 1;
            ifClickOutStop();
        } else if (ev._x > (max_x - 2)) {
            ev._x = (max_x - 2);
            ifClickOutStop();
        }
        if (ev._y <= 1) {
            ev._y = 1;
            ifClickOutStop();
        } else if (ev._y > (max_y - 1)) {
            ev._y = (max_y - 1);
            ifClickOutStop();
        }

        //console.log(ev._x + 'x' + ev._y);
        if (!stop) {
            var func = ferramentaObj[ev.type];
            if (func) func(ev);
        }
    };

    this.limpa = function(envia) {
        desenhou = false;
        context.save();
        context.fillStyle = '#fff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        _self.revisaDesenho();
        context.restore();
        frames = [];
        if (envia !== false) {
            _self.enviaDados([
                [10]
            ]);
        }
    };

    this.limpa2 = function() {
        context2.save();
        context2.clearRect(0, 0, canvas.width, canvas.height);
        context2.restore();
    };

    this.desfaz = function(envia) {
        if (frames.length > 0) {
            var img = new Image();

            var atual = canvas.toDataURL('image/png');
            var ultima = frames[frames.length - 1];

            if (atual == ultima) {
                frames.length = frames.length - 1;
            }

            img.src = frames.pop();

            img.onload = function() {
                context.save();
                context.fillStyle = '#fff';
                context.fillRect(0, 0, canvas.width, canvas.height);
                context.restore();
                context.drawImage(img, 0, 0);
                _self.revisaDesenho();
            };

            if (envia !== false) {
                _self.enviaDados([
                    [9]
                ]);
            }
        }
    };

    this.salvaFrame = function() {
        desenhou = true;

        if (frames.length > 0) {
            var ultima = frames[frames.length - 1];
            var nova = canvas.toDataURL('image/png');

            if (ultima != nova) {
                frames.push(nova);
            }
        } else {
            frames.push(canvas.toDataURL('image/png'));
        }
    };

    this.dadosPixel = function(x, y) {
        var inicio = (y * (canvas.width * 4)) + (((x + 1) * 4) - 4);
        return {
            r: desenho.data[inicio],
            g: desenho.data[inicio + 1],
            b: desenho.data[inicio + 2],
            a: desenho.data[inicio + 3]
        };
    };

    this.pintaPixel = function(x, y) {
    	console.log(canvas.width, x, y);
        var inicio = (y * (canvas.width * 4)) + (((x + 1) * 4) - 4);
        var corAtual = _self.hex2rgb(cor);
        desenho.data[inicio] = corAtual.r;
        desenho.data[inicio + 1] = corAtual.g;
        desenho.data[inicio + 2] = corAtual.b;
    };

    this.revisaDesenho = function() {
        desenho = context.getImageData(0, 0, canvas.width, canvas.height);
        _self.salvaFrame();
    };

    this.atualizaDesenho = function() {
        context.putImageData(desenho, 0, 0);
        _self.salvaFrame();
    };

    this.borracha = function(pontos) {
        var total_pontos, dados, a;
        total_pontos = pontos.length;

        var parametros = 0;
        var pilha = '';
        for (var a = 0; a <= total_pontos; a++) {
            dados = pontos[a];

            if (dados != undefined) {
                parametros++;
                pilha += ((pilha == '' ? '' : '@') + dados[0] + '-' + dados[1]);
                if (parametros >= 200) {
                    _self.enviaDados([
                        [8, "#fff"],
                        [12, pilha],
                        [8, cor]
                    ]);
                    pilha = '';
                    parametros = 0;
                }
            } else {
                continue;
            }
        }

        if (pilha.length) {
            _self.enviaDados([
                [8, "#fff"],
                [12, pilha],
                [8, cor]
            ]);
        }
    };

    this.pincel = function(pontos) {
        var total_pontos, ultima, dados, a;
        total_pontos = pontos.length;
        ultima = false;

        var parametros = 0;
        var pilha = '';
        for (var a = 0; a <= total_pontos; a++) {
            dados = pontos[a];

            if (dados != undefined) {
                parametros++;
                pilha += ((pilha == '' ? '' : '@') + dados[0] + '-' + dados[1]);
                if (parametros >= 200) {
                    _self.enviaDados([
                        [11, pilha]
                    ]);
                    pilha = '';
                    parametros = 0;
                }
                if (ultima) {
                    _self.linha(ultima[0], ultima[1], dados[0], dados[1], false);
                }
                ultima = dados;
            } else {
                continue;
            }
        }

        if (pilha.length) {
            _self.enviaDados([
                [11, pilha]
            ]);
        }
        _self.atualizaDesenho();
    };

    this.linha = function(x, y, xo, yo, atualiza, envia) {
        var x, y, xo, yo, xr, yr, n, m, xt, xt, ym;

        xr = x;
        yr = y;
        xor = xo;
        yor = yo;

        if (x > xo) {
            x = xo;
            xo = xr;
            y = yo;
            yo = yr;
        }

        y = canvas.height - y;
        yo = canvas.height - yo;
        n = ((y * xo) - (x * yo)) / ((-1 * x) + xo);
        m = (y - n) / x;
        xt = x;

        while (xt <= xo && x != xo) {
            yt = canvas.height - Math.round((m * xt) + n);
            _self.pintaPixel(xt, yt);
            _self.pintaPixel(xt + 1, yt);
            _self.pintaPixel(xt, yt + 1);
            _self.pintaPixel(xt - 1, yt);
            _self.pintaPixel(xt, yt - 1);
            _self.pintaPixel(xt, yt - 2);
            xt++;
        }

        xt = x;
        yt = Math.min(y, yo);
        ym = Math.max(y, yo);

        while (yt <= ym) {
            var yt2 = canvas.height - yt;

            if (x != xo) {
                xt = Math.round((yt - n) / m);
            }

            _self.pintaPixel(xt, yt2);
            _self.pintaPixel(xt + 1, yt2);
            _self.pintaPixel(xt, yt2 + 1);
            _self.pintaPixel(xt - 1, yt2);
            _self.pintaPixel(xt, yt2 - 1);
            _self.pintaPixel(xt, yt2 - 2);
            yt++;
        }

        if (atualiza !== false) {
            _self.atualizaDesenho();

            if (envia !== false) {
                _self.enviaDados([
                    [2, xr, yr, xor, yor]
                ]);
            }
        }
    };

    this.elipse_vazia = function(centro_x, centro_y, raio_x, raio_y, envia) {
        if (raio_x < 0) {
            raio_x = raio_x * (-1);
        }

        if (raio_y < 0) {
            raio_y = raio_y * (-1);
        }

        for (var atual_x = (centro_x - raio_x); atual_x <= (centro_x + raio_x); atual_x++) {
            var x = (atual_x - centro_x);
            var y = Math.ceil(Math.sqrt(((raio_x * raio_x * raio_y * raio_y) - (x * x * raio_y * raio_y)) / (raio_x * raio_x)));

            // Baixo
            _self.pintaPixel(atual_x, (y + centro_y));
            _self.pintaPixel(atual_x, ((y + centro_y) + 1));
            _self.pintaPixel(atual_x, ((y + centro_y) - 1));

            // Cima
            _self.pintaPixel(atual_x, (centro_y - y));
            _self.pintaPixel(atual_x, ((centro_y - y) + 1));
            _self.pintaPixel(atual_x, ((centro_y - y) - 1));
        }

        for (var atual_y = (centro_y - raio_y); atual_y <= (centro_y + raio_y); atual_y++) {
            var y = (atual_y - centro_y);
            var x = Math.ceil(Math.sqrt(((raio_x * raio_x * raio_y * raio_y) - (y * y * raio_x * raio_x)) / (raio_y * raio_y)));

            // Direita
            _self.pintaPixel((x + centro_x), atual_y);
            _self.pintaPixel(((x + centro_x) + 1), atual_y);
            _self.pintaPixel(((x + centro_x) - 1), atual_y);

            // Esquerda
            _self.pintaPixel((centro_x - x), atual_y);
            _self.pintaPixel(((centro_x - x) + 1), atual_y);
            _self.pintaPixel(((centro_x - x) - 1), atual_y);
        }

        _self.atualizaDesenho();
        if (envia !== false) {
            _self.enviaDados([
                [6, centro_x, centro_y, raio_x, raio_y]
            ]);
        }
    };

    this.elipse_cheia = function(centro_x, centro_y, raio_x, raio_y, envia) {
        if (raio_x < 0) {
            raio_x = raio_x * (-1);
        }

        if (raio_y < 0) {
            raio_y = raio_y * (-1);
        }

        for (var atual_x = (centro_x - raio_x); atual_x <= (centro_x + raio_x); atual_x++) {
            var x = (atual_x - centro_x);
            var y = Math.ceil(Math.sqrt(((raio_x * raio_x * raio_y * raio_y) - (x * x * raio_y * raio_y)) / (raio_x * raio_x)));

            // Baixo
            for (var sub_atual_y = (y + centro_y); sub_atual_y >= centro_y; sub_atual_y--) {
                _self.pintaPixel(atual_x, sub_atual_y);
            }

            // Cima
            for (var sub_atual_y = (centro_y - y); sub_atual_y <= centro_y; sub_atual_y++) {
                _self.pintaPixel(atual_x, sub_atual_y);
            }
        }

        for (var atual_y = (centro_y - raio_y); atual_y <= (centro_y + raio_y); atual_y++) {
            var y = (atual_y - centro_y);
            var x = Math.ceil(Math.sqrt(((raio_x * raio_x * raio_y * raio_y) - (y * y * raio_x * raio_x)) / (raio_y * raio_y)));

            // Direita
            _self.pintaPixel((x + centro_x), atual_y);
            _self.pintaPixel(((x + centro_x) + 1), atual_y);
            _self.pintaPixel(((x + centro_x) - 1), atual_y);

            // Esquerda
            _self.pintaPixel((centro_x - x), atual_y);
            _self.pintaPixel(((centro_x - x) + 1), atual_y);
            _self.pintaPixel(((centro_x - x) - 1), atual_y);
        }

        _self.atualizaDesenho();
        if (envia !== false) {
            _self.enviaDados([
                [7, centro_x, centro_y, raio_x, raio_y]
            ]);
        }
    };

    this.quadrado_vazio = function(x, y, w, h, envia) {
        var atual_x = x - 1;
        var atual_y = y - 1;

        while (atual_x <= w + x) {
            _self.pintaPixel(atual_x, atual_y);
            _self.pintaPixel(atual_x, atual_y + 1);
            _self.pintaPixel(atual_x, atual_y + 2);
            _self.pintaPixel(atual_x, atual_y + (h - 1));
            _self.pintaPixel(atual_x, atual_y + h);
            _self.pintaPixel(atual_x, atual_y + h + 1);
            atual_x++;
        }

        var atual_x = x - 1;
        var atual_y = y - 1;

        while (atual_y <= y + h) {
            _self.pintaPixel(atual_x, atual_y);
            _self.pintaPixel(atual_x + 1, atual_y);
            _self.pintaPixel(atual_x + 2, atual_y);
            _self.pintaPixel(atual_x + (w - 1), atual_y);
            _self.pintaPixel(atual_x + w, atual_y);
            _self.pintaPixel(atual_x + w + 1, atual_y);
            atual_y++;
        }

        _self.atualizaDesenho();

        if (envia !== false) {
            _self.enviaDados([
                [3, x, y, w, h]
            ]);
        }
    };

    this.quadrado_cheio = function(x, y, w, h, atualiza, envia) {
        context.fillRect(x, y, w, h);

        if (atualiza !== false) {
            _self.revisaDesenho();
        }

        if (envia !== false) {
            _self.enviaDados([
                [4, x, y, w, h]
            ]);
        }
    };

    this.balde = function(x, y, envia) {
        var __self = this;
        __self.pixelSelecionado = _self.dadosPixel(x, y);

        this.pixelValido = function(x, y) {
            var selecionado = __self.pixelSelecionado;
            var checado = _self.dadosPixel(x, y);

            return (selecionado.r == checado.r && selecionado.g == checado.g && selecionado.b == checado.b);
        };

        this.esquerda = function(x, y) {
            for (var atual_x = x; atual_x >= 0; atual_x--) {
                if (__self.pixelValido(atual_x, (y - 1))) {
                    __self.cima(atual_x, (y - 1));
                }

                if (__self.pixelValido(atual_x, (y + 1))) {
                    __self.baixo(atual_x, (y + 1));
                }

                if (__self.pixelValido(atual_x, y)) {
                    _self.pintaPixel(atual_x, y);
                } else {
                    break;
                }
            }
        };

        this.direita = function(x, y) {
            for (var atual_x = x; atual_x <= canvas.width; atual_x++) {
                if (__self.pixelValido(atual_x, (y - 1))) {
                    __self.cima(atual_x, (y - 1));
                }

                if (__self.pixelValido(atual_x, (y + 1))) {
                    __self.baixo(atual_x, (y + 1));
                }

                if (__self.pixelValido(atual_x, y)) {
                    _self.pintaPixel(atual_x, y);
                } else {
                    break;
                }
            }
        };

        this.cima = function(x, y) {
            var obstaculo_esquerda = false;
            var obstaculo_direita = false;

            if (__self.pixelValido((x - 1), (y + 1)) == false) {
                var obstaculo_esquerda = true;
            }

            if (__self.pixelValido((x + 1), (y + 1)) == false) {
                var obstaculo_direita = true;
            }

            for (var atual_y = y; atual_y >= 0; atual_y--) {
                // Obstáculo esquerda
                if (obstaculo_esquerda == false) {
                    if (__self.pixelValido((x - 1), atual_y) == false) {
                        obstaculo_esquerda = true;
                    }
                } else {
                    if (__self.pixelValido((x - 1), atual_y)) {
                        __self.esquerda((x - 1), atual_y);
                        obstaculo_esquerda = false;
                    }
                }

                // Obstáculo direita
                if (obstaculo_direita == false) {
                    if (__self.pixelValido((x + 1), atual_y) == false) {
                        obstaculo_direita = true;
                    }
                } else {
                    if (__self.pixelValido((x + 1), atual_y)) {
                        __self.direita((x + 1), atual_y);
                        obstaculo_direita = false;
                    }
                }

                // Pixel atual			
                if (__self.pixelValido(x, atual_y)) {
                    _self.pintaPixel(x, atual_y);
                } else {
                    break;
                }
            }
        };

        this.baixo = function(x, y) {
            var obstaculo_esquerda = false;
            var obstaculo_direita = false;

            if (__self.pixelValido((x - 1), (y - 1)) == false) {
                var obstaculo_esquerda = true;
            }

            if (__self.pixelValido((x + 1), (y - 1)) == false) {
                var obstaculo_direita = true;
            }

            for (var atual_y = y; atual_y <= canvas.height; atual_y++) {
                // Obstáculo esquerda
                if (obstaculo_esquerda == false) {
                    if (__self.pixelValido((x - 1), atual_y) == false) {
                        obstaculo_esquerda = true;
                    }
                } else {
                    if (__self.pixelValido((x - 1), atual_y)) {
                        __self.esquerda((x - 1), atual_y);
                        obstaculo_esquerda = false;
                    }
                }

                // Obstáculo direita
                if (obstaculo_direita == false) {
                    if (__self.pixelValido((x + 1), atual_y) == false) {
                        obstaculo_direita = true;
                    }
                } else {
                    if (__self.pixelValido((x + 1), atual_y)) {
                        __self.direita((x + 1), atual_y);
                        obstaculo_direita = false;
                    }
                }

                if (__self.pixelValido(x, atual_y)) {
                    _self.pintaPixel(x, atual_y);
                } else {
                    break;
                }
            }
        };

        var p_n = _self.dadosPixel(x, y),
            p_v = _self.hex2rgb(cor);

        if (p_n.r != p_v.r || p_n.g != p_v.g || p_n.b != p_v.b) {
            if (desenhou == true) {
                __self.esquerda(x, y);
                __self.direita(x + 1, y);
                _self.atualizaDesenho();
            } else {
                context.fillRect(0, 0, canvas.width, canvas.height);
                _self.revisaDesenho();
            }

            if (envia !== false) {
                _self.enviaDados([
                    [5, x, y]
                ]);
            }
        }
    };

    ferramentas.balde = function() {
        this.mousedown = function(ev) {
            _self.balde(ev._x, ev._y);
        };
    };

    ferramentas.seletor = function() {
        this.mousedown = function(ev) {
            var dados = context.getImageData(0, 0, canvas.width, canvas.height).data;
            var inicio = (ev._y * (canvas.width * 4)) + (((ev._x + 1) * 4) - 4);
            alert('r: ' + dados[inicio] + ', g: ' + dados[inicio + 1] + ', b: ' + dados[inicio + 2] + ', a: ' + dados[inicio + 3]);
        };
    };

    ferramentas.pincel = function() {
        var __self = this;
        __self.pontos = [];
        __self.clicando = false;

        this.mousedown = function(ev) {
            __self.clicando = true;
            __self.pontos = [];

            if (__self.clicando) {
                context2.beginPath();
                context2.moveTo(ev._x, ev._y);
                context2.fillRect(ev._x, ev._y, 2, 2);
                __self.pontos.push([ev._x, ev._y]);
                __self.pontos.push([ev._x + 1, ev._y + 1]);
            }
        };

        this.mousemove = function(ev) {
            if (__self.clicando) {
                context2.lineTo(ev._x, ev._y);
                context2.stroke();
                __self.pontos.push([ev._x, ev._y]);
            }
        };

        this.mouseup = function(ev) {
            __self.clicando = false;
            _self.limpa2();
            _self.pincel(__self.pontos);
            __self.pontos = [];
        };

        this.mouseout = function(ev) {
            __self.clicando = false;
        };
    };

    ferramentas.borracha = function() {
        var __self = this;
        __self.pontos = [];
        __self.clicando = false;
        __self.corOriginal = false;

        this.mousedown = function(ev) {
            __self.clicando = true;
            __self.corOriginal = context.strokeStyle;
            _self.defineCor('#fff', false);

            if (__self.clicando) {
                __self.pontos.push([ev._x - 15, ev._y - 15]);
                _self.quadrado_cheio(ev._x - 15, ev._y - 15, 30, 30, false, false);
            }
        };

        this.mousemove = function(ev) {
            _self.limpa2();
            context2.beginPath();
            context2.rect(ev._x - 15, ev._y - 15, 30, 30);
            context2.strokeStyle = '#000';
            context2.fillStyle = '#fff';
            context2.lineWidth = 1;
            context2.fill();
            context2.stroke();

            context2.strokeStyle = context2.fillStyle = cor;
            context2.lineWidth = tamanho;

            if (__self.clicando) {
                __self.pontos.push([ev._x - 15, ev._y - 15]);
                _self.quadrado_cheio(ev._x - 15, ev._y - 15, 30, 30, false, false);
            }
        };

        this.mouseup = function(ev) {
            _self.defineCor(__self.corOriginal, false);
            __self.clicando = false;
            _self.revisaDesenho();
            _self.borracha(__self.pontos);
            __self.pontos = [];
        };

        this.mouseout = function(ev) {
            _self.defineCor(__self.corOriginal, false);
            __self.clicando = false;
            _self.revisaDesenho();
            _self.borracha(__self.pontos);
            __self.pontos = [];
        };

        this.changetool = function() {
            _self.limpa2();
        };
    };

    ferramentas.linha = function() {
        var __self = this;
        __self.clicando = false;

        this.mousedown = function(ev) {
            __self.clicando = true;
            __self.x0 = ev._x;
            __self.y0 = ev._y;

            context2.beginPath();
            context2.moveTo(ev._x, ev._y);
        };

        this.mousemove = function(ev) {
            if (__self.clicando) {
                _self.limpa2();
                context2.beginPath();
                context2.moveTo(__self.x0, __self.y0);
                context2.lineTo(ev._x, ev._y);
                context2.stroke();
            }
        };

        this.mouseup = function(ev) {
            __self.clicando = false;
            _self.limpa2();
            _self.linha(__self.x0, __self.y0, ev._x, ev._y);
        };

        this.mouseout = function(ev) {
            __self.clicando = false;
        };
    };

    ferramentas.elipse_vazia = function() {
        var __self = this;

        this.mousedown = function(ev) {
            __self.clicando = true;
            __self.x0 = ev._x;
            __self.y0 = ev._y;
        };

        this.mousemove = function(ev) {
            _self.limpa2();

            if (__self.clicando) {
                var kappa = .5522848;
                var x = __self.x0;
                var y = __self.y0;
                var w = ev._x - __self.x0;
                var h = ev._y - __self.y0;
                var ox = (w / 2) * kappa; // control point offset horizontal
                var oy = (h / 2) * kappa; // control point offset vertical
                var xe = x + w; // x-end
                var ye = y + h; // y-end
                var xm = x + w / 2; // x-middle
                var ym = y + h / 2; // y-middle

                context2.beginPath();
                context2.moveTo(x, ym);
                context2.bezierCurveTo(x, ym - oy, xm - ox, y, xm, y);
                context2.bezierCurveTo(xm + ox, y, xe, ym - oy, xe, ym);
                context2.bezierCurveTo(xe, ym + oy, xm + ox, ye, xm, ye);
                context2.bezierCurveTo(xm - ox, ye, x, ym + oy, x, ym);
                context2.closePath();
                context2.stroke();
            }
        };

        this.mouseup = function(ev) {
            _self.limpa2();
            __self.clicando = false;

            // Desenha circulo real
            var raio_x = Math.ceil((ev._x - __self.x0) / 2);
            var raio_y = Math.ceil((ev._y - __self.y0) / 2);
            var center_x = __self.x0 + raio_x;
            var center_y = __self.y0 + raio_y;
            _self.elipse_vazia(center_x, center_y, raio_x, raio_y);
        };

        this.mouseout = function(ev) {
            __self.clicando = false;
        };
    };

    ferramentas.elipse_cheia = function() {
        var __self = this;

        this.mousedown = function(ev) {
            __self.clicando = true;
            __self.x0 = ev._x;
            __self.y0 = ev._y;
        };

        this.mousemove = function(ev) {
            _self.limpa2();

            if (__self.clicando) {
                // Desenha circulo virtual
                var kappa = .5522848;
                var x = __self.x0;
                var y = __self.y0;
                var w = (ev._x - __self.x0);
                var h = (ev._y - __self.y0);
                var ox = (w / 2) * kappa;
                var oy = (h / 2) * kappa;
                var xe = x + w;
                var ye = y + h;
                var xm = x + w / 2;
                var ym = y + h / 2;

                context2.beginPath();
                context2.moveTo(x, ym);
                context2.bezierCurveTo(x, ym - oy, xm - ox, y, xm, y);
                context2.bezierCurveTo(xm + ox, y, xe, ym - oy, xe, ym);
                context2.bezierCurveTo(xe, ym + oy, xm + ox, ye, xm, ye);
                context2.bezierCurveTo(xm - ox, ye, x, ym + oy, x, ym);
                context2.closePath();
                context2.fill();
            }
        };

        this.mouseup = function(ev) {
            _self.limpa2();
            __self.clicando = false;

            // Desenha circulo real			
            var raio_x = Math.ceil((ev._x - __self.x0) / 2);
            var raio_y = Math.ceil((ev._y - __self.y0) / 2);
            var center_x = __self.x0 + raio_x;
            var center_y = __self.y0 + raio_y;

            _self.elipse_cheia(center_x, center_y, raio_x, raio_y);
        };

        this.mouseout = function(ev) {
            __self.clicando = false;
        };
    };

    ferramentas.quadrado_vazio = function() {
        var __self = this;

        this.mousedown = function(ev) {
            __self.clicando = true;
            __self.x0 = ev._x;
            __self.y0 = ev._y;
        };

        this.mousemove = function(ev) {
            _self.limpa2();

            if (__self.clicando) {
                context2.strokeRect(Math.min(ev._x, __self.x0), Math.min(ev._y, __self.y0), Math.abs(ev._x - __self.x0), Math.abs(ev._y - __self.y0));
            }
        };

        this.mouseup = function(ev) {
            __self.clicando = false;
            _self.quadrado_vazio(Math.min(ev._x, __self.x0), Math.min(ev._y, __self.y0), Math.abs(ev._x - __self.x0), Math.abs(ev._y - __self.y0));
        };

        this.mouseout = function(ev) {
            __self.clicando = false;
        };
    };

    ferramentas.quadrado_cheio = function() {
        this.mousedown = function(ev) {
            this.clicando = true;
            this.x0 = ev._x;
            this.y0 = ev._y;
        };

        this.mousemove = function(ev) {
            _self.limpa2();

            if (this.clicando) {
                context2.fillRect(Math.min(ev._x, this.x0), Math.min(ev._y, this.y0), Math.abs(ev._x - this.x0), Math.abs(ev._y - this.y0));
            }
        };

        this.mouseup = function(ev) {
            this.clicando = false;
            _self.quadrado_cheio(Math.min(ev._x, this.x0), Math.min(ev._y, this.y0), Math.abs(ev._x - this.x0), Math.abs(ev._y - this.y0));
        };

        this.mouseout = function(ev) {
            this.clicando = false;
        };
    };

    this.rgb2hex = function(r, g, b) {
        var rgb = [r.toString(16), g.toString(16), b.toString(16)];

        for (var i = 0; i < 3; i++) {
            if (rgb[i].length == 1) rgb[i] = rgb[i] + rgb[i];
        }

        if (rgb[0][0] == rgb[0][1] && rgb[1][0] == rgb[1][1] && rgb[2][0] == rgb[2][1])
            return '#' + rgb[0][0] + rgb[1][0] + rgb[2][0];
        return '#' + rgb[0] + rgb[1] + rgb[2];
    };

    this.hex2rgb = function(shex) {
        if (shex[0] == "#") hex = shex.substr(1);
        if (hex.length == 3) {
            var temp = hex;
            hex = '';
            temp = /^([a-f0-9])([a-f0-9])([a-f0-9])$/i.exec(temp).slice(1);
            for (var i = 0; i < 3; i++) hex += temp[i] + temp[i];
        }
        var triplets = /^([a-f0-9]{2})([a-f0-9]{2})([a-f0-9]{2})$/i.exec(hex).slice(1);
        return {
            r: parseInt(triplets[0], 16),
            g: parseInt(triplets[1], 16),
            b: parseInt(triplets[2], 16)
        };
    };

    this.defineCor = function(value, envia) {
        if (context.strokeStyle == value) {
            return;
        }
        context.strokeStyle = context2.strokeStyle = value;
        context.fillStyle = context2.fillStyle = value;
        cor = value;
        if (envia !== false) {
            _self.enviaDados([
                [8, value]
            ]);
        }
    };

    this.defineTamanho = function(value) {
        if (value > 0 && value <= 20) {
            context.lineWidth = value;
            tamanho = value;
        }
    };

    this.defineFerramenta = function(value) {
        if (ferramentas[value]) {
            var func = ferramentaObj['changetool'];
            if (func) func();

            ferramenta = value;
            ferramentaObj = new ferramentas[ferramenta]();
        }
    };
};

RecaptchaOptions = {
    theme: 'custom',
    custom_theme_widget: 'recaptcha_widget'
};

debug = false;

$('document').ready(function() {

    palco = new palco();
    palco.inicia();
    //palco.defineTela('intermediaria');
    if (debug) {
        palco.defineTela('jogo');
        palco.executaAcoes([
            [50, {
                "id": 1,
                "nick": "dygu",
                "nome": "Rodrigo Fernandes",
                "imagem": "",
                "criado": 1321984832,
                "pontos": 0,
                "sala": 1,
                "modo": 0,
                "tempo_desenhista": 1327375006032,
                "ultimo_dado": 0,
                "ultima_acao": 1327375006032,
                "modificado": 1327375006032,
                "token": "4d9449694208974f21040fbc4cdd16"
            }],
            [50, {
                "id": 2,
                "nick": "ghsehn",
                "nome": "Guilherme",
                "imagem": "",
                "pontos": 0,
                "sala": 1
            }],
            [50, {
                "id": 3,
                "nick": "3",
                "nome": "3",
                "imagem": "",
                "pontos": 0,
                "sala": 1
            }],
            [50, {
                "id": 4,
                "nick": "4",
                "nome": "4",
                "imagem": "",
                "pontos": 0,
                "sala": 1
            }],
            [50, {
                "id": 5,
                "nick": "5",
                "nome": "5",
                "imagem": "",
                "pontos": 0,
                "sala": 1
            }],
            [50, {
                "id": 6,
                "nick": "6",
                "nome": "6",
                "imagem": "",
                "pontos": 0,
                "sala": 1
            }],
            [52, 70, 1],
            [54, "carro"]
        ]);
        palco.adicionaMensagem('Server', 'Bem vindo! Use /room [sala] para trocar de sala.', false, 'server');
        palco.adicionaMensagem('dygu', 'Oi Guilherme!');
        palco.adicionaMensagem('ghsehn', 'Oi, sabia que eu sou um idiota?');
        palco.adicionaMensagem('Server', 'Unforgettable02 é o novo desenhista.', false, 'server');
        palco.adicionaMensagem('dygu', 'Sim, todos sabem, menos o claudio.');
        palco.adicionaMensagem('Unforgettable02', 'Claro que eu sei.');
        palco.adicionaMensagem('dygu', 'Mas não precisa você ficar se humilhando assim, Guilherme.');
        palco.adicionaMensagem('ghsehn', 'Eu só estava falando a verdade, Deus castiga quem mente. :(');
        palco.adicionaMensagem('Moderador', 'ghsehn banido por 45454 horas. Causa: Idiotice.', false, 'mod');
        palco.adicionaMensagem('dygu', 'Sou uma bicha louca. :-)');
    }
    //$('#lista_salas').tinyscrollbar();
    //$('#lista_ranking').tinyscrollbar();	
    //$('#lista_posts').tinyscrollbar();	
});

window.onbeforeunload = function() {
    $.ajax({
        url: '/dados/sair',
        async: false
    });
};