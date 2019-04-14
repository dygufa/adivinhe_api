// url = require('url'),
var f = require('./lib/functions'),
    sessions = require('./lib/sessions'),
    env = require('./lib/env');

require('./model/db');
require('./model/resource_logs');
var mongoUsers = require('./model/users'),
    mongoWords = require('./model/words'),
    mongoContacts = require('./model/contacts'),
    mongoBans = require('./model/bans');

var resourceManager = require('./lib/resource_manager');
const recaptchalib = require('./lib/recaptcha');

var PORT = process.env.PORT || 5089;
const RAM_LIMIT = 300;

const jwt = require('jwt-simple');
const jwtSecret = process.env.ADIVINHE_SALTING;


const express = require('express');
const app = express();
const cors = require('cors');

const bodyParser = require('body-parser');


/**
 *	Routes
 */


function routeRecebe(req, res) {
    sessions.start(req, res, function (sess) {
        var last = req.query.ultimo;
        Users.logged(req, res, sess, function (success, status) {
            if (!success) {
                res.json(200, [status]);
                return;
            }
            var user = sess.get('user_id');
            Game.getData(last, user, function (status, data) {
                res.json(200, [status, data]);
            });
        });
    });
}

function routeEnvia(req, res) {
    sessions.start(req, res, function (sess) {
        var new_data = req.body.dados;
        Users.logged(req, res, sess, function (success, status) {
            if (!success) {
                res.json(200, [status]);
                return;
            }
            var user = sess.get('user_id');
            Game.processData(new_data, user, function (status, data) {
                res.json(200, [status, data]);
            });
        });
    });
}

function routeSair(req, res) {
    sessions.start(req, res, function (sess) {
        const user_id = sess.get('user_id');
        if (user_id && Users.list[user_id]) {
            Game.exitRoom(user_id, true);
        }
    });
    res.json(200, []);
}

function routeLogin(req, res) {
    sessions.start(req, res, function (sess) {
        var action = req.query.modo;
        switch (action) {
            case 'normal':
                if (resourceManager.mem_mb > RAM_LIMIT) {
                    console.log('[LOTADO NORMAL]');
                    res.json(200, [false, ['crowded']]);
                } else {
                    Users.normal_login(req, res, sess, function (success, data) {
                        res.json(200, [success, data]);
                    });
                }
                break;
            case 'dados_incompletos':
                //console.log('1');
                var user_id = sess.get('user_id'),
                    nick = req.body.nick,
                    email = req.body.email,
                    check_nick = false;
                // check_email = false;
                if (email) {
                    email = email.toLowerCase();
                }
                mongoUsers.find({
                    '_id': user_id
                }, function (err, results) {
                    if (err || results.length == 0) {
                        return;
                    }
                    var erros = [],
                        er_nick = new RegExp(/^[A-Za-z0-9_\-.]+$/),
                        er_email = new RegExp(/^[A-Za-z0-9_\-.]+@[A-Za-z0-9_\-.]{2,}\.[A-Za-z0-9]{2,}(\.[A-Za-z0-9])?/);
                    var endChecking = function () {
                        if (erros.length) {
                            res.json(200, ['error', erros[0]]);
                        } else {
                            // var data_update = {};
                            if (check_nick) {
                                results[0].nick = nick;
                                results[0].nick_lower = nick.toLowerCase();
                            }
                            if (check_email) {
                                results[0].email = email;
                            }
                            results[0].save(function (err) {
                                if (err) {
                                    console.log('[MongoDB - /login?modo=dados_incompleto] ' + err);
                                    res.json(200, ['error', 'Erro de atualização no banco de dados.']);
                                } else {
                                    Users.enter_game(String(user_id), sess, function (success, data) {
                                        res.json(200, [(success ? 'success' : 'error'), data]);
                                    });
                                }
                            });
                        }
                    };
                    var check_email = function () {
                        if (results[0]['email']) {
                            endChecking();
                        } else {
                            if (!er_email.test(email)) {
                                erros.push('Não vale colocar email de mentirinha.');
                                endChecking();
                            } else {
                                mongoUsers.count({
                                    email: email,
                                    register_type: 0
                                }, function (err, count) {
                                    var checking_email = count > 1;
                                    if (checking_email) {
                                        erros.push('Alguém já está usando este email.');
                                    } else {
                                        check_email = true;
                                    }
                                    endChecking();
                                });
                            }
                        }
                    };
                    if (results[0]['nick']) {
                        check_email();
                    } else {
                        if (nick.length < 4 || nick.length > 15) {
                            erros.push('Seu nick deve ter entre 4 e 15 caracteres.');
                        } else if (!er_nick.test(nick)) {
                            erros.push('Seu nick só pode ter letras e números.');
                        }
                        if (erros.length) {
                            check_email();
                        } else {
                            mongoUsers.count({
                                nick_lower: nick.toLowerCase()
                            }, function (err, count) {
                                if (count != 0) {
                                    erros.push('Já tem gente usando este nick. Tenta outro.');
                                } else {
                                    check_nick = true;
                                }
                                check_email();
                            });
                        }
                    }
                });
                break;
            case 'recupera':
                var user_id = sess.get('user_id');
                if (user_id) {
                    mongoUsers.find({
                        '_id': user_id
                    }, function (err, results) {
                        if (err || results.length == 0) {
                            res.json(200, ['error', []]);
                        } else if (!results[0]['nick'] || !results[0]['email']) {
                            var incompletes = [];
                            if (!results[0]['email']) {
                                incompletes.push(['email']);
                            }
                            if (!results[0]['nick']) {
                                let sugestions = [];
                                if (results[0]['email']) {
                                    var email = results[0]['email'].split('@'),
                                        prefix_email = email[0];
                                    mongoUsers.count({
                                        nick: prefix_email
                                    }, function (err, count) {
                                        if (count == 0) {
                                            sugestions.push(prefix_email);
                                        }
                                        incompletes.push(['nick', sugestions]);
                                        res.json(200, ['incomplete', results[0]['name'], incompletes]);
                                    });
                                } else {
                                    res.json(200, ['incomplete', results[0]['name'], incompletes]);
                                }
                            }
                        } else {
                            //console.log(JSON.stringify(results[0]));
                            Users.enter_game(String(user_id), sess, function (success, data) {
                                res.json(200, [(success ? 'success' : 'error'), data]);
                            });
                        }
                    });
                } else {
                    res.json(200, ['error', []]);
                }
                break;
            case 'facebook':
                var app_id = env.FACEBOOK_ID;
                var app_secret = env.FACEBOOK_CLIENTSECRET;
                var app_url = 'https://api.adivinhe.com' + env.NODEPATH + '/login?modo=facebook';

                var code = req.query.code;
                //console.log('[DEBUG] ' + code + ' - ' + sess.get('state'));
                if (typeof (code) == 'undefined') {
                    if (resourceManager.mem_mb > 300) {
                        console.log('[LOTADO FACEBOOK]');
                        res.simpleText(200, 'Pedimos mil desculpas! O jogo está lotado. Tente mais tarde. Estamos trabalhando para aumentar a capacidade de jogadores.');
                    } else {
                        var state = f.genToken(15);
                        sess.set('state', state);
                        res.writeHead(302, {
                            'Location': 'https://www.facebook.com/dialog/oauth?display=popup&client_id=' + app_id + '&scope=email&redirect_uri=' + f.urlencode(app_url) + '&state=' + state
                        });
                        res.end();
                    }
                } else if (req.query.state == sess.get('state')) {
                    var url = 'https://graph.facebook.com/oauth/access_token?client_id=' + f.urlencode(app_id) + '&redirect_uri=' + f.urlencode(app_url) + '&client_secret=' + f.urlencode(app_secret) + '&code=' + f.urlencode(code);
                    f.file_get_contents(url, function (data) {
                        var params = {};
                        f.parse_str(data, params);
                        var graph_url = 'https://graph.facebook.com/me?access_token=' + f.urlencode(params['access_token']);
                        f.file_get_contents(graph_url, function (data_user) {
                            data_user = f.json_decode(data_user);
                            console.log('2: ' + JSON.stringify(data_user));
                            var user_image = 'http://graph.facebook.com/' + data_user.id + '/picture';
                            if (data_user.email) {
                                console.log('3: ' + data_user.email);
                                data_user.email = data_user.email.toLowerCase();
                                console.log('4: ' + data_user.email);
                            }
                            Users.social_login(data_user.name, data_user.id, data_user.email, 1, user_image, function (success, data) {
                                if (success) {
                                    sess.set('user_id', data);
                                    res.end('<script>window.close();</script>');
                                } else {
                                    res.simpleText(200, 'Erro: ' + data);
                                }
                            });
                        });
                    });
                } else {
                    res.simpleText(200, 'Erro, tente novamente mais tarde.');
                }

                break;
            case 'twitter':
                break;
        }
    });
}

function routeRegistrar(req, res) {
    sessions.start(req, res, function () {
        var register = function () {
            // Atenção, linha abaixo é de DEBUG, >>>>RETIRAR<<<<
            code_recaptcha = 'valid';
            Users.register(nick, password, email, function (success, data) {
                res.json(200, [success, data]);
            }, false, code_recaptcha);
        };
        var nick = req.body.nick,
            password = req.body.senha,
            email = req.body.email,
            ip = f.getIp(req),
            recaptcha_status = req.body.recaptcha_status,
            recaptcha_challenge = req.body.recaptcha_challenge,
            recaptcha_response = req.body.recaptcha_response,
            code_recaptcha = 'valid';
        if (email) {
            email = email.toLowerCase();
        }
        if (recaptcha_status == 'true') {
            recaptchalib.verify(ip, recaptcha_challenge, recaptcha_response, function (data) {
                var status = data.split('\n');
                if (status[0] == 'false') {
                    code_recaptcha = 'invalid';
                }
                register();
            });
        } else {
            code_recaptcha = 'empty';
            register();
        }
    });
}

function routeEditar(req, res) {
    sessions.start(req, res, function (sess) {
        Users.logged(req, res, sess, function (success, status) {
            if (!success) {
                res.json(200, [status]);
                return;
            }
            var sess_user_id = sess.get('user_id');
            if (Users.list[sess_user_id].tipo_registro != 0) {
                res.json(200, [false, 'Ação inválida.']);
                return;
            }
            var nick = req.body.nick,
                id = req.body.id;
            var new_password = req.body.nova_senha,
                old_password = req.body.atual_senha,
                email = req.body.email;
            if (email) {
                email = email.toLowerCase();
            }
            if (sess_user_id != id) {
                res.json(200, [false, 'Ação inválida.']);
            } else {
                Users.edit(id, nick, new_password, email, old_password, function (success, data) {
                    res.json(200, [success, data]);
                });
            }
        });
    });
}

function routeContato(req, res) {
    sessions.start(req, res, function (sess) {
        var user = sess.get('user_id');
        Users.logged(req, res, sess, function (success, status) {
            if (!success) {
                res.json(200, [status]);
                return;
            }
            var erros = [],
                subject = req.body.assunto,
                text = req.body.texto,
                subjects = {
                    1: 'Sugestão',
                    2: 'Denúncia',
                    3: 'Erro',
                    4: 'Reclamação',
                    5: 'Publicidade',
                    6: 'Interese profissional',
                    7: 'Outra coisa'
                };
            if (!subjects[subject]) {
                erros.push('Motivo de contato desconhecido.');
            }
            if (text == '' || text.length > 5000) {
                erros.push('Seu texto deve ter entre 1 e 5000 caracteres.');
            }
            if (erros.length) {
                res.json(200, [false, erros[0]]);
            } else {
                var newContact = new mongoContacts();
                newContact.author = user;
                newContact.subject = subject;
                newContact.content = text;
                newContact.created_at = f.time();
                newContact.save(function (err) {
                    if (err) {
                        res.json(200, [false, 'Erro ao acessar banco de dados.']);
                    } else {
                        res.json(200, [true, 'Mensagem enviada!']);
                    }
                });
            }
        });
    });
}




var Users = {
    list: {},
    away: {},
    login_error: {},
    timeout_request: 15000,
    timeout_action: 240000,
    register: function (nick, password, email, callback, editing, recaptcha) {
        recaptcha = 'valid'; // DISABLING CAPTCHA
        var endChecking = function () {
            if (erros.length) {
                var plural = (erros.length > 1 ? 's' : '');
                var text = 'Corrija o' + plural + ' seguinte' + plural + ' erro' + plural + ':<ul style="margin-left: 30px;">';
                for (var i = 0, t = erros.length; i < t; i++) {
                    text += '<li>' + erros[i] + '</li>';
                }
                text += '</ul>';
                callback(false, text);
            } else {
                if (recaptcha == 'empty') {
                    callback(true, 1);
                    return;
                }
                var agora = f.time();
                if (editing) {
                    var spassword = f.sha1(password + env.SALTING);
                    mongoUsers.update({
                        nick: nick
                    }, {
                            $set: {
                                email: email,
                                password: spassword,
                                updated_at: agora
                            }
                        }, function (err, numAffected) {
                            if (err) {
                                callback(false, 'Erro na atualização.');
                            } else {
                                callback(true, 'Prontinho, atualizei que foi uma beleza.');
                            }
                        });
                } else {
                    var newUser = new mongoUsers();
                    newUser.nick = nick;
                    newUser.nick_lower = nick.toLowerCase();
                    newUser.password = f.sha1(password + env.SALTING);
                    newUser.email = email;
                    newUser.register_type = 0;
                    newUser.updated_at = agora;
                    newUser.created_at = agora;
                    newUser.score = 0;
                    newUser.first_hit = 0;
                    newUser.save(function (err) {
                        if (err) {
                            console.log('[Erro de registro] ' + err);
                            callback(false, 'Não consigo falar com o banco de dados, tente novamente mais tarde.');
                        } else {
                            callback(true, 2);
                        }
                    });
                }
            }
        };
        if (typeof (editing) == 'undefined') {
            editing = false;
        }
        var erros = [];
        if (recaptcha == 'invalid') {
            erros.push('O que você digitou não é igual ao que está na imagem.');
            endChecking();
        } else {
            // Checa campos em branco
            if (email == '' || password == '' || nick == '') {
                erros.push('Não deixe nada vazio!');
                endChecking();
            } else {
                // Checa senha
                if (password.length < 6 || password.length > 30) {
                    erros.push('Sua senha deve ter entre 6 e 30 caracteres.');
                }
                // Checa nick
                if ((nick.length < 4 || nick.length > 15) && !editing) {
                    erros.push('Seu nick deve ter entre 4 e 15 caracteres.');
                }
                var er_nick = new RegExp(/^[A-Za-z0-9_\-\.]+$/);
                if (!er_nick.test(nick) && !editing) {
                    erros.push('Seu nick só pode ter letras e números.');
                }
                if (erros.length) {
                    endChecking();
                } else {
                    // Checa email
                    var check_email = function () {
                        var er_email = new RegExp(/^[A-Za-z0-9_\-\.]+@[A-Za-z0-9_\-\.]{2,}\.[A-Za-z0-9]{2,}(\.[A-Za-z0-9])?/);
                        if (!er_email.test(email)) {
                            erros.push('Não vale colocar email de mentirinha.');
                            endChecking();
                        } else {
                            mongoUsers.count({
                                email: email,
                                register_type: 0
                            }, function (err, count) {
                                var checking_email = (editing ? (count > 1) : (count != 0));
                                if (checking_email) {
                                    erros.push('Alguém já está usando este email.');
                                }
                                endChecking();
                            });
                        }
                    };
                    if (editing) {
                        check_email();
                    } else {
                        mongoUsers.count({
                            nick_lower: nick.toLowerCase()
                        }, function (err, count) {
                            if (count != 0) {
                                erros.push('Já tem gente usando este nick. Tenta outro.');
                            }
                            check_email();
                        });
                    }
                }
            }
        }
    },
    edit: function (id, nick, nova_senha, email, atual_senha, callback) {
        var salt_senha = f.sha1(atual_senha + env.SALTING);
        mongoUsers.find({
            _id: id,
            nick: nick,
            password: salt_senha
        }, function (err, results) {
            if (err || results.length == 0) {
                // 1 = senha antiga incorreta
                callback(false, 'Sua senha atual está incorreta.');
                return;
            } else {
                if (nova_senha == '') {
                    nova_senha = atual_senha;
                }
                Users.register(results[0].nick, nova_senha, email, function (success, data) {
                    callback(success, data);
                }, true);
            }
        });
    },
    enter_game: function (data_or_id, sess, callback) {
        var enter = function (data_user) {
            mongoBans.find({
                receiver: data_user._id
            }, function (err, results) {
                if (!err && results.length != 0) {
                    var last_ban = results[results.length - 1],
                        seconds_duration = last_ban.duration * 3600;
                    if ((last_ban.created_at + seconds_duration) > f.time()) {
                        // Está banido
                        var wait_time = ((last_ban.created_at + seconds_duration) - f.time()) / 3600;
                        callback(false, ['banned', 'Você foi banido por ' + last_ban.duration + ' hora(s), falta(m) ' + wait_time.toFixed(2) + ' hora(s) para o fim da punição. Motivo: ' + last_ban.reason]);
                        return;
                    }
                }
                if (Users.list[data_user._id]) {
                    Game.exitRoom(data_user._id);
                }
                var agora = f.milliTime(),
                    sala = Game.chooseRoom(data_user._id),
                    token = f.genToken(10),
                    ultimo_dado = (Game.rooms[sala] ? Game.rooms[sala].ultimo_dado : 0);

                //console.log('AUIII: ' + data_user.privilege);
                Users.list[data_user._id] = {
                    'id': data_user._id,
                    'nick': data_user.nick,
                    'tipo_registro': data_user.register_type,
                    'email': data_user.email,
                    'nome': data_user.name,
                    'privilegio': data_user.privilege,
                    'imagem': data_user.photo,
                    'criado': data_user.created_at,
                    'pontos': 0,
                    'sala': sala,
                    'modo': 0,
                    'tempo_desenhista': agora,
                    'ultimo_dado': ultimo_dado,
                    'ultima_acao': agora,
                    'modificado': agora,
                    'banido': false,
                    'token': token
                };
                resourceManager.count_online_users++;
                const jwtToken = jwt.encode({
                    user_id: data_user._id,
                    token
                }, jwtSecret);

                console.log('[JOGO] ' + data_user.nick + ' (ID #' + data_user._id + ') entrou');
                Users.updateStatus(data_user._id, true);
                var info_user = f.object_filter(Users.list[data_user._id], ['id', 'nick', 'nome', 'imagem', 'pontos', 'modo', 'token', 'email', 'tipo_registro', 'privilegio']);
                callback(true, [{ ...info_user, jwtToken }, Game.intoRoom(data_user._id, sala)]);
            });
        };
        if (typeof (data_or_id) == 'object') {
            enter(data_or_id);
        } else {
            mongoUsers.find({
                '_id': data_or_id
            }, function (err, results) {
                if (err || results.length == 0) {
                    callback(false, 'Erro ao acessar banco de dados.');
                } else {
                    //console.log(JSON.stringify(results));
                    enter(results[0]);
                }
            });
        }
    },
    social_login: function (name, client_id, email, register_type, image, callback) {
        mongoUsers.find({
            'client_id': client_id,
            'register_type': register_type
        }, function (err, results) {
            var agora = f.time();
            if (err) {
                callback(false, 'Falha no banco de dados.');
            } else if (results.length == 0) {
                var newUser = new mongoUsers();
                newUser.name = name;
                newUser.client_id = client_id;
                newUser.email = email;
                newUser.photo = image;
                newUser.register_type = register_type;
                newUser.updated_at = agora;
                newUser.created_at = agora;
                newUser.score = 0;
                newUser.first_hit = 0;
                newUser.save(function (err, result) {
                    if (err) {
                        callback(false, 'Falha ao registra-lo no banco de dados.');
                    } else {
                        callback(true, result._id);
                    }
                });
            } else if (results.length > 0) {
                //console.log('_id: ' + results[0]._id);
                results[0].name = name;
                results[0].email = email;
                results[0].photo = image;
                results[0].updated_at = agora;
                results[0].save(function (err) {
                    if (err) {
                        callback(false, ['error_db']);
                        console.error(err);
                    } else {
                        callback(true, results[0]._id);
                    }
                });
            }
        });
    },
    normal_login: function (req, res, sess, callback) {
        var nick = f.htmlspecialchars(req.body.nick, 'ENT_QUOTES').toLowerCase(),
            ip = f.getIp(req),
            senha = req.body.senha,
            recaptcha_status = req.body.recaptcha_status,
            recaptcha_challenge = req.body.recaptcha_challenge,
            recaptcha_response = req.body.recaptcha_response,
            salt_senha = f.sha1(senha + env.SALTING);
        var checkLogin = function () {
            mongoUsers.find({
                nick_lower: nick.toLowerCase(),
                password: salt_senha,
                register_type: 0
            }, function (err, results) {
                //console.log('RESULTS: ' + JSON.stringify(results));
                if (err || results.length == 0) {
                    Users.login_error[ip] = (Users.login_error[ip] ? ++Users.login_error[ip] : 1);
                    Users.login_error[nick] = (Users.login_error[nick] ? ++Users.login_error[nick] : 1);
                    // Coloca a partir do 4° erro para na quinta tentativa já aparecer o recaptcha pro usuário
                    active_recaptcha = (Users.login_error[ip] >= 4 || Users.login_error[nick] >= 4);
                    callback(false, ['invalid_user', active_recaptcha]);
                    return;
                } else {
                    Users.login_error[ip] = 0;
                    Users.login_error[nick] = 0;
                    Users.enter_game(results[0], sess, function (success, data) {
                        callback(success, data);
                    });

                }
            });
        };
        // DISABLING CAPTCHA
        // if (Users.login_error[ip] >= 5 || Users.login_error[nick] >= 5) {
        //     if (recaptcha_status) {
        //         recaptchalib.verify(ip, recaptcha_challenge, recaptcha_response, function (data) {
        //             var status = data.split('\n');
        //             if (status[0] == 'false') {
        //                 callback(false, ['invalid_recaptcha']);
        //             } else {
        //                 checkLogin();
        //             }
        //         });
        //     } else {
        //         callback(false, ['active_recaptcha']);
        //     }
        // } else {
        // }
        checkLogin();
    },
    logged: function (req, res, sess, callback) {
        var token = req.query.token;
        // Checa se existe sessão ativa
        if (user_id = sess.get('user_id')) {
            // Checa se usuário está logado
            if ((u = Users.list[user_id])) {
                // Checa token
                if (u.token == token && sess.get('token') == token) {
                    // Checa ban
                    if (Users.list[user_id].banido) {
                        // Checa no banco de dados e retorna dados sobre banimento
                        mongoBans.find({
                            receiver: user_id
                        }, function (err, results) {
                            if (err || results.length == 0) {
                                callback(true, 'success');
                            } else {
                                callback(false, ['banned', results[results.length - 1].duration, results[results.length - 1].reason]);
                            }
                        });
                    } else {
                        callback(true, 'success');
                    }
                } else {
                    callback(false, 'invalid_token');
                }
            } else {
                callback(false, 'invalid_user');
            }
        } else {
            callback(false, 'invalid_session');
        }
    },
    exit: function (user_id) {
        // Limpa comandos de ausência remanescentes
        Users.updateStatus(user_id, false, true);
        delete Users.list[user_id];
        resourceManager.count_online_users--;
    },
    updateStatus: function (user_id, action, clear) {
        var u = Users.list[user_id];
        if (!u) {
            return;
        }
        if (typeof (action) == 'undefined') {
            action = false;
        }
        if (typeof (clear) == 'undefined') {
            clear = false;
        }
        var d = Users.away[user_id];
        if (d) {
            clearTimeout(d.modificado);
            if (clear !== true) {
                u.modificado = f.milliTime();
                d.modificado = setTimeout(function () {
                    Game.exitRoom(user_id, true);
                }, Users.timeout_request);
            }
            if (action || clear) {
                clearTimeout(d.ultima_acao);
                if (clear !== true) {
                    console.log('# ' + Users.list[user_id].nick + ' fez alguma ação.');
                    u.ultima_acao = f.milliTime();
                    d.ultima_acao = setTimeout(function () {
                        Game.exitRoom(user_id, true);
                    }, Users.timeout_action);
                }
            }
        } else if (clear !== true) {
            Users.away[user_id] = {
                'modificado': setTimeout(function () {
                    Game.exitRoom(user_id, true);
                }, Users.timeout_request),
                'ultima_acao': setTimeout(function () {
                    Game.exitRoom(user_id, true);
                }, Users.timeout_action)
            };
            u.modificado = f.milliTime();
            u.ultima_acao = f.milliTime();
        }
    },
    ban: function (receiver, reason, duration, author, receiver_nick, callback) {
        newBan = new mongoBans();
        newBan.author = author;
        newBan.receiver = receiver;
        newBan.reason = reason;
        newBan.duration = duration;
        newBan.created_at = f.time();
        newBan.save(function (err) {
            if (err) {
                callback(false, 'Erro ao salvar informação no banco de dados.');
            } else {
                if (Users.list[receiver]) {
                    Game.putData(Users.list[receiver].sala, [1, 'Moderador', receiver_nick + ' foi banido por ' + duration + ' hora(s). Motivo: ' + reason, 'mod'], 'Server');
                    Users.list[receiver].banido = true;
                    if (duration != 0) {
                        Game.putData(Users.list[receiver].sala, [51, receiver], 'Server', false);
                    }
                }
                callback(true, (duration == 0 ? 'Desb' : 'B') + 'anido com sucesso.');
            }
        });
    }
};

/**
 *	Jogo
 */

var Game = {
    words: [],
    rooms: {},
    // Número de salas oficiais
    oficial_rooms: 20,
    // Número minimo de denúncias para anular desenho
    needed_reports: 7,
    // Número minimo de pessoas na sala para contar pontos
    needed_persons: 7,
    // tempo da rodada
    time_round: 74000,
    // tempo que o desenhista pode ficar sem fazer ação no inicio da rodada
    time_drawer: 25000,
    timeout_round: {},
    colors: ['#000000', '#000', '#7f7f7f', '#880015', '#ed1c24', '#ff7f27', '#fff200', '#22b14c', '#00a2e8', '#3f48cc', '#a349a4', '#ffffff', '#fff', '#c3c3c3', '#b97a57', '#ffaec9', '#ffc90e', '#efe4b0', '#b5e61d', '#99d9ea', '#7092be', '#c8bfe7'],
    // n = nome
    // npr = número de parametros recebidos
    // cms = carregar no modo sala
    // sd = somente desenhista
    // pvl = privilégio
    actionTypes: {
        1: {
            'n': 'Resposta',
            'npr': 2,
            'cms': false,
            'sd': false
        },
        2: {
            'n': 'Linha',
            'npr': 5,
            'cms': true,
            'sd': true
        },
        3: {
            'n': 'Quadrado vazio',
            'npr': 5,
            'cms': true,
            'sd': true
        },
        4: {
            'n': 'Quadrado cheio',
            'npr': 5,
            'cms': true,
            'sd': true
        },
        5: {
            'n': 'Balde',
            'npr': 3,
            'cms': true,
            'sd': true
        },
        6: {
            'n': 'Elipse vazia',
            'npr': 5,
            'cms': true,
            'sd': true
        },
        7: {
            'n': 'Elipse cheia',
            'npr': 5,
            'cms': true,
            'sd': true
        },
        8: {
            'n': 'Mudança de cor',
            'npr': 2,
            'cms': true,
            'sd': true
        },
        9: {
            'n': 'Desfaz',
            'npr': 1,
            'cms': true,
            'sd': true
        },
        10: {
            'n': 'Limpa',
            'npr': 1,
            'cms': true,
            'sd': true
        },
        11: {
            'n': 'Pincel',
            'npr': 2,
            'cms': true,
            'sd': true
        },
        12: {
            'n': 'Borracha',
            'npr': 2,
            'cms': true,
            'sd': true
        },
        13: {
            'n': 'Conversa',
            'npr': 2,
            'cms': false,
            'sd': false
        },
        14: {
            'n': 'Pular',
            'npr': 1,
            'cms': false,
            'sd': true
        },
        15: {
            'n': 'Dica',
            'npr': 1,
            'cms': false,
            'sd': true
        },
        16: {
            'n': 'Desconsiderar desenho',
            'npr': 1,
            'cms': false,
            'sd': false
        },
        49: {
            'n': 'Palavra da dica',
            'npr': 0,
            'cms': false
        },
        50: {
            'n': 'Entra na sala',
            'npr': 0,
            'cms': false
        },
        51: {
            'n': 'Sai da sala',
            'npr': 0,
            'cms': false
        },
        52: {
            'n': 'Nova rodada',
            'npr': 0,
            'cms': false
        },
        53: {
            'n': 'Modo de espera',
            'npr': 0,
            'cms': false
        },
        54: {
            'n': 'Palavra para o desenhista',
            'npr': 0,
            'cms': false
        },
        55: {
            'n': 'Alterar sala',
            'npr': 0,
            'cms': false
        },
        56: {
            'n': 'Acertou palavra',
            'npr': 0,
            'cms': false
        },
        80: {
            'n': 'Console',
            'npr': 2,
            'cms': false,
            'sd': false
        },
        99: {
            'n': 'Banir usuário',
            'npr': 6,
            'cms': false,
            'pvl': ['mod', 'adm']
        },
        100: {
            'n': 'Editar usuário',
            'npr': 6,
            'cms': false,
            'pvl': ['mod', 'adm']
        },
        101: {
            'n': 'Gerenciar usuário',
            'npr': 2,
            'cms': false,
            'pvl': ['mod', 'adm']
        },
        102: {
            'n': 'Histórico de sala',
            'npr': 2,
            'cms': false,
            'pvl': ['mod', 'adm']
        },
        103: {
            'n': 'Histórico de rodada',
            'npr': 2,
            'cms': false,
            'pvl': ['mod', 'adm']
        },
        104: {
            'n': 'Adicionar/Editar palavra',
            'npr': 6,
            'cms': false,
            'pvl': ['adm']
        },
        105: {
            'n': 'Gerenciar palavra',
            'npr': 2,
            'cms': false,
            'pvl': ['adm']
        }
    },
    putData: function (room, data, sender, receiver) {
        if (!Game.rooms[room]) {
            return;
        }
        if (typeof (receiver) == 'undefined') {
            receiver = false;
        }
        var agora = f.milliTime();
        var new_data = [{
            'sender': sender,
            'receiver': receiver,
            'created': agora
        }, data];
        //console.log('[Descrição de ação]: ' + JSON.stringify(new_data));
        Game.rooms[room].dados.push(new_data);
        Users.updateStatus(sender, true);
    },
    processData: function (array, user_id, callback) {
        if (!Users.list[user_id]) {
            callback('success', [0]);
            return;
        }
        var room = Users.list[user_id].sala;
        if (!Game.rooms[room] || !array) {
            callback('success', [0]);
            return;
        }
        /* Resolvido no lado do cliente através de dupla limpeza com intervalo de 2s
        var game_data = Game.rooms[room];
        var time_left = (parseInt(game_data.inicio) + Game.time_round) - parseInt(f.milliTime());
        if(user_id == game_data.desenhista && time_left <= 1000) {
        	callback('success', [0]);
        	return;
        }*/
        var array = f.json_decode(array);
        if (!array || typeof (array) != 'object') {
            callback('success', [0]);
            return;
        }
        var stop_return = false;
        for (var i = 0, j = array.length; i < j; i++) {
            var type = parseInt(array[i][0]);
            if (Game.actionTypes[type] && (!Game.actionTypes[type].sd || (Game.actionTypes[type].sd && user_id == Game.rooms[room].desenhista)) && (npr = Game.actionTypes[type].npr) > 0) {
                var action = array[i].slice(0, npr);
                for (var o = 0, l = action.length; o < l && o < 20; o++) {
                    if (typeof (action[o]) != 'number' && action[o] != null) {
                        action[o] = f.htmlspecialchars(action[o], 'ENT_QUOTES');
                    }
                }
                var receiver = false;
                if (type == 80) {
                    if (!f.in_array(Users.list[user_id].privilegio, ['adm', 'mod'])) {
                        //console.log('> ' + Users.list[user_id].privilegio);
                        callback('success', [1, [
                            [80, 'Você não tem privilégios para usar este terminal.']
                        ]]);
                        return;
                    }
                    stop_return = true;
                    var msg = action[1],
                        back = 'Sem dados de retorno.',
                        start_return = function () {
                            console.log('[Terminal usado por #' + user_id + '] ' + msg);
                            callback('success', [1, [
                                [80, back]
                            ]]);
                            return;
                        };
                    if (match = msg.match(/^help/)) {
                        back = '> Banir: ban [nome] [duração (em horas)] [motivo] / Ex: ban [dygu] [48] [Ser muito lindo]';
                        back += '<br/>> Adicionar palavra: aword [palavra] [dificuldade (de 1 a 5)] / Ex: aword [gato] [2]';
                        back += '<br/>> Remover palavra: rword [palavra] / Ex: rword [deus]';
                        back += '<br/>> Informações: info';
                        start_return();
                    } else if (match = msg.match(/^aword \[(.*)\]\s\[([\d]+)\]/)) {
                        var word = match[1].toLowerCase();
                        if (word == '') {
                            back = 'Escreva alguma coisa, né.';
                            start_return();
                        } else {
                            mongoWords.find({
                                word: word
                            }, function (err, results) {
                                if (results.length != 0) {
                                    back = 'Esta palavra já havia sido adicionada.';
                                    start_return();
                                } else {
                                    var newWord = new mongoWords();
                                    newWord.word = word;
                                    newWord.difficulty = match[2];
                                    newWord.used_at = 0;
                                    newWord.created_at = f.time();
                                    newWord.save(function (err) {
                                        if (err) {
                                            back = 'Houve algum erro com o banco de dados.';
                                        } else {
                                            back = 'A palavra "' + word + '" foi adicionada com sucesso.';
                                        }
                                        start_return();
                                    });
                                }
                            });
                        }
                    } else if (match = msg.match(/^info/)) {
                        back = 'Consumo de memória: ' + resourceManager.mem_mb + 'MB, usuário(s) online: ' + resourceManager.count_online_users + '.';
                        start_return();
                    } else if (match = msg.match(/^rword \[(.*)\]/)) {
                        var word = match[1].toLowerCase();
                        mongoWords.remove({
                            word: word
                        }, function (err, numAffected) {
                            if (err) {
                                back = 'Ocorreu algum erro.';
                            } else {
                                if (numAffected >= 1) {
                                    back = 'Removida com sucesso.';
                                } else {
                                    back = 'Palavra não encontrada.';
                                }
                            }
                            start_return();
                        });
                    } else if (match = msg.match(/^ban \[([\w]+)\]\s\[([\d]+)\]\s\[(.*)\]/)) {
                        //console.log(JSON.stringify(match));
                        if (f.in_array(match[1].toLowerCase(), ['dygu', 'ghs'])) {
                            back = 'HAHAHA! Que piada, banir DEUS é mais fácil. ;)';
                            start_return();
                            return;
                        }
                        mongoUsers.find({
                            nick_lower: match[1].toLowerCase()
                        }, function (user_err, user_results) {
                            if (user_err || user_results.length == 0) {
                                back = 'Usuário não encontrado.';
                                start_return();
                            } else {
                                var ban_user_id = user_results[0]._id;
                                Users.ban(ban_user_id, match[3], match[2], user_id, user_results[0].nick, function (success, data) {
                                    back = data;
                                    start_return();
                                });
                            }
                        });
                    } else {
                        back = 'Comando desconhecido.';
                        start_return();
                    }

                } else if (type == 1 || type == 13) {
                    var msg = action[1];
                    var checkword = Game.checkWord(action[1], room);
                    // Se for desenhista impede que se comunique
                    if (user_id == Game.rooms[room].desenhista && type == 1) {
                        callback('success', [0]);
                        return;
                    }
                    if (match = msg.match(/^\/friend ([\w]+)/)) {
                        //console.log('match:' +JSON.stringify(match));
                        callback('success', [0]);
                        return;
                    } else if (match = msg.match(/^\/(sala|room) ([\w]+)/)) {
                        var new_room = match[2],
                            er_room = new RegExp(/^[A-Za-z0-9_\-\.]+$/);
                        if (!er_room.test(new_room)) {
                            callback('success', [1, [
                                [type, 'Server', 'O nome da sala deve conter somente letras e números.', 'server']
                            ]]);
                        } else {
                            var new_room_members = (Game.rooms[new_room] ? Game.rooms[new_room].membros.length : 0);
                            if (new_room_members >= 25 && !in_array(Users.list[user_id].privilegio, ['adm', 'mod'])) {
                                callback('success', [1, [
                                    [type, 'Server', 'A sala "' + new_room + '" está lotada!', 'server']
                                ]]);
                            } else {
                                Game.exitRoom(user_id);
                                var data_room = Game.intoRoom(user_id, new_room);
                                Users.updateStatus(user_id, true);
                                console.log('[JOGO] ' + Users.list[user_id].nick + ' trocou para sala ' + new_room);
                                callback('success', [1, [
                                    [55, data_room],
                                    [type, 'Server', 'Você está em "' + new_room + '" agora!', 'server']
                                ]]);
                            }
                        }
                        return;
                    } else if (type == 1) {
                        for (var p = 0, t = Game.rooms[room].rank.length; p < t; p++) {
                            if (Game.rooms[room].rank[p][0] == user_id) {
                                callback('success', [0]);
                                return;
                            }
                        }
                        // O cara acertou a palavra
                        if (checkword == 2) {
                            var count_winners = Game.rooms[room].rank.length,
                                wpoints = (count_winners == 0 ? 15 : (count_winners == 1 ? 14 : (count_winners == 2 ? 13 : 10))),
                                wtime = ((f.milliTime() - Game.rooms[room].inicio) / 1000).toFixed(1),
                                wdata = [Users.list[user_id].id, wpoints, wtime];
                            Users.list[user_id].pontos += wpoints;
                            Game.putData(room, [56, wdata], 'Server', false);
                            var new_count_winners = Game.rooms[room].rank.push(wdata);
                            // Se todos acertaram / "+1" = desenhista
                            if ((new_count_winners + 1) == Game.rooms[room].membros.length) {
                                clearTimeout(Game.timeout_round[room]);
                                Game.managerRoom(room);
                            }
                            callback('success', [0]);
                            return;
                            // O cara falou uma palavra parecida
                        } else if (checkword == 3) {
                            Game.putData(room, [1, 'Server', 'Você está perto!', 'server'], 'Server', user_id);
                            callback('success', [0]);
                            return;
                        }
                        // Se o cara falou a palavra certa ou parecida no chat de conversa
                    } else if (type == 13 && (checkword == 2 || checkword == 3)) {
                        Game.putData(room, [13, 'Server', 'Mensagem bloqueada!', 'server'], 'Server', user_id);
                        callback('success', [0]);
                        return;
                    }
                    action = [type, Users.list[user_id].nick, action[1]];
                    // Se uma cor inválida for enviada, então paramos a execução para que ela não seja processada
                } else if (type == 8 && !f.in_array(action[1], Game.colors)) {
                    callback('success', [0]);
                    return;
                } else if (type == 14) {
                    var t = Game.rooms[room].membros.length;
                    Game.startRound(room, (t == 1));
                    Game.putData(room, [13, 'Moderador', Users.list[user_id].nick + ' pulou a vez.', 'mod'], 'Server');
                } else if (type == 15) {
                    var max_clue = 1,
                        actions = Game.rooms[room].clue_word[0],
                        original_word = Game.rooms[room].palavra[0],
                        len_word = original_word.length;
                    if (len_word >= 3) {
                        max_clue = 1;
                    }
                    if (len_word >= 4) {
                        max_clue = 2;
                    }
                    if (len_word >= 5) {
                        max_clue = 3;
                    }
                    if (len_word >= 7) {
                        max_clue = 4;
                    }
                    if (len_word >= 11) {
                        max_clue = 5;
                    }
                    if (len_word >= 13) {
                        max_clue = 6;
                    }
                    //console.log('AAA: ' +original_word + ' - ' + len_word + ' - ' + max_clue);
                    if (actions < max_clue) {
                        //console.log('ACTIONS: ' + actions);
                        var clue = '';
                        if (actions == 0) {
                            for (var o = 0; o < len_word; o++) {
                                clue += '_ ';
                            }
                            Game.rooms[room].clue_word = [1, []];
                            //console.log('1 - ' + clue + ' - ' + JSON.stringify(Game.rooms[room].clue_word));
                        } else if (actions == 1) {
                            clue += original_word[0] + ' ';
                            for (var o = 0; o < (len_word - 1); o++) {
                                clue += '_ ';
                            }
                            Game.rooms[room].clue_word = [2, [1]];
                            //console.log('2 - ' + clue + ' - ' + JSON.stringify(Game.rooms[room].clue_word));
                        } else if (actions > 1) {
                            available_letters = [];
                            for (var o = 0; o < len_word; o++) {
                                var p = (o + 1);
                                if (!f.in_array(p, Game.rooms[room].clue_word[1])) {
                                    available_letters.push(p);
                                }
                            }
                            var letter_position = available_letters[f.rand(0, (available_letters.length - 1))];
                            Game.rooms[room].clue_word[0] = (actions + 1);
                            Game.rooms[room].clue_word[1].push(letter_position);
                            //console.log('AQUI: ' + JSON.stringify(available_letters) + ' - ' + letter_position + ' - ' + JSON.stringify(Game.rooms[room].clue_word));
                            for (var o = 0; o < len_word; o++) {
                                var p = (o + 1);
                                if (f.in_array(p, Game.rooms[room].clue_word[1])) {
                                    clue += original_word[o];
                                } else {
                                    clue += '_';
                                }
                                clue += ' ';
                            }
                            //console.log('3 - ' + clue + ' - ' + JSON.stringify(Game.rooms[room].clue_word));
                        }
                        Game.putData(room, [49, clue], 'Server');
                    }
                    callback('success', [0]);
                    Users.updateStatus(user_id, true);
                    return;
                } else if (type == 16) {
                    var current_reports = Game.rooms[room].reports[0];
                    if (!f.in_array(user_id, Game.rooms[room].reports[1])) {
                        Game.rooms[room].reports[1].push(user_id);
                        if ((current_reports + 1) == Game.needed_reports) {
                            Game.startRound(room, false, true);
                        } else {
                            Game.rooms[room].reports[0]++;
                        }
                        Game.putData(room, [13, 'Moderador', Users.list[user_id].nick + ' denúnciou (' + (current_reports + 1) + '/7) o desenho.', 'mod'], 'Server');
                    }
                    callback('success', [0]);
                    return;
                }
                if (!stop_return) {
                    Game.putData(room, action, user_id, receiver);
                }
            }
        }
        if (!stop_return) {
            callback('success', [0]);
        }
    },
    getData: function (last, user_id, callback, running) {
        if (!Users.list[user_id]) {
            callback('invalid_user', []);
            return;
        }
        var last = Users.list[user_id].ultimo_dado;
        var room = Users.list[user_id].sala;
        if (!Game.rooms[room]) {
            callback('invalid_room', []);
            return;
        }
        if (typeof (running) == 'undefined') {
            var running = 0;
            Users.updateStatus(user_id, false);
        } else {
            running = parseInt(running) + 250;
        }
        var return_data = [];
        var amount = (Game.rooms[room] ? (Game.rooms[room].dados.length ? Game.rooms[room].dados.length : 0) : 0);
        var last_data_round = parseInt(Game.rooms[room].ultimo_dado);
        var last_temp = parseInt(last) - last_data_round;
        var amount_temp = parseInt(Game.rooms[room].ultimo_dado) + amount;
        var add_return = function (action) {
            var type = action[1][0];
            var author = action[0].sender;
            var receiver = action[0].receiver;
            if ((receiver == false && (user_id != author || type == 1 || type == 13)) || receiver == user_id) {
                return_data.push(action[1]);
            }
        };
        if (last < last_data_round) {
            offset_round_amount = Game.rooms[room].offset_round.length;
            offset_real = last_data_round - last;
            offset_data = Game.rooms[room].offset_round.slice((offset_real > offset_round_amount ? offset_round_amount : offset_real) * -1);
            for (var i = 0, t = offset_data.length; i <= t; i++) {
                if (offset_data[i]) {
                    add_return(offset_data[i]);
                }
            }
            last_temp = 0;
        }
        if (amount != 0) {
            for (var i = last_temp; i <= amount; i++) {
                if (Game.rooms[room].dados[i]) {
                    add_return(Game.rooms[room].dados[i]);
                }
            }
        }

        if (return_data.length || running > 10000 || callback == false) {
            var temp_data = [return_data, amount_temp, resourceManager.mem_mb];
            Users.list[user_id].ultimo_dado = amount_temp;
            if (!callback) {
                return temp_data;
            }
            callback('success', temp_data);
        } else {
            setTimeout(function () {
                Game.getData(null, user_id, callback, running);
            }, 250);
        }
    },
    checkWord: function (str, room) {
        str.toLowerCase();
        if (Game.rooms[room].palavra == null) {
            return 1;
        } else if (str == Game.rooms[room].palavra[0]) {
            return 2;
        } else {
            var answer = Game.rooms[room].palavra[0],
                words = str.split(' '),
                phonebr_answer = f.phonebr(answer),
                radial_answer = f.radical_word(answer);
            for (var i = 0, t = words.length; i < t; i++) {
                var similar_normal = f.similar_text(words[i], answer, true),
                    phone = f.phonebr(words[i]),
                    radical = f.radical_word(words[i]);
                if (similar_normal > 70 || phone == phonebr_answer || radical == radial_answer) {
                    return 3;
                }
                if (i == t) {
                    return 4;
                }
            }
        }
    },
    // Chamada quando o jogador faz login, deve escolher uma sala com jogabilidade garantida
    chooseRoom: function (user_id) {
        var crowded = function (room) {
            if (Game.rooms[room]) {
                return (Game.rooms[room].membros.length >= 15);
            }
            return false;
        },
            choose_room = function (room) {
                if (crowded(room)) {
                    return choose_room((room + 1));
                } else {
                    return room;
                }

            };

        return choose_room(1);

        /*var nice_rooms = [];
        var empty_rooms = [];
        var enough_rooms = [];
        for(i = 1; i <= Game.oficial_rooms; i++) {
        	var n_members = Game.rooms[i].membros.length;
        	if(n_members >= 8 && n_members <= 14) {
        		nice_rooms.push({'n_members': n_members, 'room': i});
        	} else if (n_members < 8) {
        		empty_rooms.push({'n_members': n_members, 'room': i});
        	} else if(n_members > 14 && n_members <= 20) {
        		enough_rooms.push({'n_members': n_members, 'room': i});
        	}
        }
        if(nice_rooms.length) {

        } else if(empty_rooms.length) {

        } else if(enough_rooms.length) {

        } else {
        	// aumenta o número de salas oficiais e chama a função novamente
        	Game.oficial_rooms += 5;
        	Game.chooseRoom(user_id);
        }*/
    },
    // Chamada quando o usuário entra em uma sala
    intoRoom: function (user_id, room) {
        if (!Game.rooms[room]) {
            Game.startRoom(room);
        }
        if ((user_data = Users.list[user_id])) {
            Users.list[user_id].sala = room;
            Users.list[user_id].ultimo_dado = Game.rooms[room].ultimo_dado;
            Game.putData(room, [50, f.object_filter(user_data, ['id', 'nick', 'nome', 'imagem', 'pontos', 'modo'])], 'Server', false);
            // Começa a rodada se tem 2 guris na sala
            if (Game.rooms[room].membros.push(user_data) == 2) {
                Game.startRound(room);
            }

            var data = Game.getData(Game.rooms[room].ultimo_dado, user_id, false, false);
            var filter_data = [];
            if (data[0].length) {
                for (var i = 0, t = data[0].length; i < t; i++) {
                    // Se for tipo 10 (ferramenta limpar) limpa a array
                    if (data[0][i][0] == 10) {
                        filter_data = [];
                    }
                    // Checa se deve ser carregado
                    else if (Game.actionTypes[data[0][i][0]] && Game.actionTypes[data[0][i][0]].cms) {
                        filter_data.push(data[0][i]);
                    }
                }
            }
            data[0] = filter_data;
            var game_data = Game.rooms[room],
                members = game_data.membros,
                filter_members = [],
                public_info = ['id', 'nick', 'nome', 'imagem', 'pontos', 'modo'];
            for (var i = 0, t = members.length; i < t; i++) {
                filter_members.push(f.object_filter(members[i], public_info));
            }
            var time_left = Math.floor(((parseInt(game_data.inicio) + Game.time_round) - parseInt(f.milliTime())) / 1000);
            return {
                sala: room,
                membros: filter_members,
                rank: game_data.rank,
                time_left: time_left,
                desenhista: game_data.desenhista,
                dados: data,
                esperando: game_data.esperando
            };

        }
        return false;
    },
    exitRoom: function (user_id, exit) {
        if (u = Users.list[user_id]) {
            var room = u.sala;
            console.log('[JOGO] ' + u.nick + ' saiu.');
            // Tira usuário da sala
            if (Game.rooms[room]) {
                var winners = Game.rooms[room].rank.length;
                for (var i = 0, t = Game.rooms[room].membros.length; i < t; i++) {
                    if (Game.rooms[room].membros[i].id == user_id) {
                        Game.rooms[room].membros.splice(i, 1);
                        if ((t - 1) > 1 && (Game.rooms[room].desenhista == user_id || (t - 2) == winners)) {
                            Game.startRound(room);
                        } else if ((t - 1) == 1) {
                            Game.startRound(room, true);
                        }
                        break;
                    }
                }
                Game.putData(room, [51, user_id], 'Server', false);
            }
            if (exit === true) {
                Users.exit(user_id);
            }
        }
    },
    kickAwayDrawer: function (user_id, room) {
        var room_data = null,
            user_data = null;
        if (room_data = Game.rooms[room]) {
            if (user_data = Users.list[user_id]) {
                if (room_data.desenhista == user_id && (f.milliTime() - user_data.ultima_acao) >= Game.time_drawer) {
                    Game.putData(room, [1, 'Server', user_data.nick + ' perdeu a vez!', 'server'], 'Server', false);
                    Game.managerRoom(room);
                }
            }
        }
    },
    startRound: function (room, waiting, disconsidered) {
        if (typeof (waiting) == 'undefined') {
            waiting = false;
        }
        if (Game.rooms[room]) {
            var timeout_round = Game.timeout_round[room];
            if (timeout_round) {
                clearTimeout(timeout_round);
            }
            var desenhista = Game.rooms[room].desenhista,
                len_members = Game.rooms[room].membros.length,
                trank = Game.rooms[room].rank.slice(0),
                len_trank = trank.length;
            if (len_trank > 0) {
                var msg = ((len_members - 1) == len_trank ? 'Todos acertaram! ' : '') + 'A palavra era: ' + Game.rooms[room].palavra[0];
                Game.putData(room, [13, 'Moderador', msg, 'mod'], 'Server', false);
            }
            if (desenhista != null) {
                Users.list[desenhista].pontos = len_trank;
            }
            var pre_point_drawer = len_trank - (Game.rooms[room].clue_word[0] * 2),
                point_drawer = (pre_point_drawer > 0 ? pre_point_drawer : 0);
            // Registra os pontos
            if (disconsidered !== true && len_members >= Game.needed_persons) {
                //console.log('Registra pontos:');
                if (desenhista != null && point_drawer > 0) {
                    trank.push([desenhista, len_trank, 'drawer']);
                }
                for (var a = 0; a < trank.length; a++) {
                    var user_id = trank[a][0],
                        points = trank[a][1],
                        object = {};
                    object.score = points;
                    object.rounds = 1;
                    if (a == 0 && trank[a][2] != 'drawer') {
                        object.first_hit = 1;
                    }
                    //console.log('Registro: ' + user_id + ' - ' + points);
                    mongoUsers.update({
                        _id: user_id
                    }, {
                            '$inc': object
                        }, function (err) {
                            if (err) {
                                console.log('Erro de registro (' + user_id + ', ' + points + ') de pontos: ' + err);
                            }
                        });
                }
            }
            // Define palavra da rodada
            var word = function () {
                var len_words = Game.words.length;
                // Pede mais palavras caso existam poucas
                if (len_words < 100) {
                    Game.loadWords();
                } else if (len_words == 0) {
                    // Caso as palavras ainda não tenham sido carregadas
                    return ['macaco'];
                }
                var rand_word = f.rand(0, (len_words - 1)),
                    new_word = Game.words[rand_word].slice(0);
                Game.words.splice(rand_word, 1);
                return new_word;
            };
            // Define desenhista da rodada (com mais pontos)
            var drawer = function () {
                var jogadores = Game.rooms[room].membros.slice(0);
                var sortNumberDesc = function (a, b) {
                    return b.pontos - a.pontos;
                };
                var sortNumberAsc = function (a, b) {
                    return a.tempo_desenhista - b.tempo_desenhista;
                };
                jogadores.sort(sortNumberDesc);
                //console.log(JSON.stringify(jogadores));
                var selected = [];
                var max = 0;
                for (var s = 0, t = jogadores.length; s < t; s++) {
                    var points = jogadores[s].pontos;
                    if (points > max) {
                        selected = [jogadores[s]];
                        max = points;
                    } else if (max == points) {
                        selected.push(jogadores[s]);
                    }
                }
                selected.sort(sortNumberAsc);
                var user = selected.shift().id;
                Users.list[user].tempo_desenhista = f.milliTime() + 10;
                return user;
            };
            var data_length = Game.rooms[room].dados.length;
            var offset_round = (data_length < 20 ? data_length : 20);
            var desenhista = (waiting ? null : drawer());
            var palavra = (waiting ? null : word());
            var ultimo_dado = Game.rooms[room].ultimo_dado + data_length;
            // Atualiza configurações
            Game.rooms[room].ultimo_dado = ultimo_dado;
            Game.rooms[room].offset_round = Game.rooms[room].dados.slice(offset_round * -1);
            Game.rooms[room].dados = [];
            Game.rooms[room].rank = [];
            Game.rooms[room].palavra = palavra;
            Game.rooms[room].clue_word = [0, []];
            Game.rooms[room].reports = [0, []];
            Game.rooms[room].desenhista = desenhista;
            Game.rooms[room].esperando = waiting;
            Game.rooms[room].inicio = f.milliTime();
            if (waiting) {
                Game.putData(room, [53], 'Server', false);
            } else {
                Game.putData(room, [52, (Game.time_round / 1000), desenhista, point_drawer], 'Server', false);
                Game.putData(room, [54, palavra[0]], 'Server', desenhista);
                Game.putData(room, [8, '#000'], 'Server', false);
                Game.putData(room, [1, 'Server', Users.list[desenhista].nick + ' é o novo desenhista.', 'server'], 'Server', false);
                Game.timeout_round[room] = setTimeout(function () {
                    Game.managerRoom(room);
                }, Game.time_round);
                setTimeout(function () {
                    Game.kickAwayDrawer(desenhista, room);
                }, Game.time_drawer);
            }
        }
    },
    // Chamada para criar uma sala com todas condições favoraveis ao jogo
    startRoom: function (room) {
        if (!Game.rooms[room]) {
            Game.rooms[room] = {
                membros: [],
                rank: [],
                inicio: f.milliTime(),
                desenhista: null,
                palavra: null,
                ultimo_dado: 0,
                offset_round: [],
                dados: [],
                esperando: true,
                clue_word: [0, []],
                reports: [0, []]
            };
        }
    },
    // Chamada quando existirem poucas palavras, pega mais no banco de dados
    loadWords: function () {
        var agora = f.time();
        var query = mongoWords.find({});
        query.select('word');
        query.sort('used_at');
        query.limit(200);
        query.exec(function (err, results) {
            results.forEach(function (result) {
                Game.words.push([result.word]);
                result.used_at = agora;
                result.save();
            });
        });
    },
    // Gerencia o jogo
    managerRoom: function (room) {
        if ((d = Game.rooms[room])) {
            users_amount = d.membros.length;
            if (users_amount >= 2) {
                Game.startRound(room);
            } else if (users_amount == 1) {
                Game.startRound(room, true);
            } else {
                delete Game.rooms[room];
            }
        }
    }
};

function verifyJWT(req, res, next) {
    if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
        const token = req.headers.authorization.split(' ')[1];
        console.log(token);
        req.user = jwt.decode(token, jwtSecret);
        next();
    } else {
        res.json(200, [false, 'Você não está autenticado.']);
    }
}

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());

app.get(env.NODEPATH + '/recebe', verifyJWT, routeRecebe);
app.post(env.NODEPATH + '/envia', verifyJWT, routeEnvia);
app.get(env.NODEPATH + '/sair', verifyJWT, routeSair);
app.post(env.NODEPATH + '/login', routeLogin);
app.post(env.NODEPATH + '/registrar', routeRegistrar);
app.post(env.NODEPATH + '/editar', verifyJWT, routeEditar);
app.post(env.NODEPATH + '/contato', verifyJWT, routeContato);

app.listen(PORT, () => console.log(`Adivinhe listening on port ${PORT}!`));


//Chama carregador de palavras
Game.loadWords();
