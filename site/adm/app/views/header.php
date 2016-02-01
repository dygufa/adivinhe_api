<!DOCTYPE html>
<html>
<head>
	<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
	<title>Área restrita - Adivinhe</title>
	<link type="text/css" rel="stylesheet" href="media/css/bootstrap.min.css"/>
	<script src="media/js/jquery1.7.2.min.js" type="text/javascript"></script>
	<script src="media/js/jquery-ui-1.8.21.custom.min.js" type="text/javascript"></script>
	<script src="media/js/bootstrap.min.js" type="text/javascript"></script>	
	<style type="text/css">
	body {
		padding-top: 60px;
		padding-bottom: 40px;
	}
	.sidebar-nav {
		padding: 9px 0;
	}
	#palavras-categorias-escolhidas {
		/*min-height: 105px;*/
		width: 270px;
		padding: 5px 0;
	}	
	#palavras-categorias-escolhidas li, .ui-draggable-dragging {
		padding: 8px;
		border-radius: 5px;
		background: #f0f0f0;
		margin-bottom: 3px;
		width: 270px;
		list-style-type: none;
	}
	#palavras-categorias-escolhidas li i {
		cursor: pointer;
		margin-top: 2px;
	}
	.align-center {
		text-align: center;
	}
	.ui-draggable-dragging a {
		color: #000;
	}
	.ui-draggable-dragging .edt-category {
		display: none;
	}
	#s_updating {
		background: #f9f9f9;
		border: 1px solid #dddddd;
		border-top: 0;
		position: absolute;
		left: 50%;
		width: 100px;
		margin: -20px 0 0 -50px;
		padding: 7px;
		border-radius: 0 0 5px 5px;
		text-align: center;
		font-weight: bold;
		display: none;
	}
	.input-big {
		width: 400px;
		height: 200px;
	}

	#main_graph {
		height: 400px;
	}
	</style>
</head>
<body>
	<div class="navbar navbar-fixed-top">
      <div class="navbar-inner">
        <div class="container">        
          <a class="brand" href="#">Adivinhe</a>
          <div class="btn-group pull-right">
            <a class="btn dropdown-toggle" data-toggle="dropdown" href="#">
              <i class="icon-user"></i> <?php echo (isset($_SESSION['usr_data']['name']) ? $_SESSION['usr_data']['name'] : $_SESSION['usr_data']['nick']); ?>
              <span class="caret"></span>
            </a>
            <ul class="dropdown-menu">
              <li><a href="/adm/?m=users&a=edit&id=<?php echo userInfo('_id'); ?>">Perfil</a></li>
              <li class="divider"></li>
              <li><a href="/adm/?logout">Sair</a></li>
            </ul>
          </div>
          <div class="nav-collapse">
            <ul class="nav">
              <li class="<?php active_menu('home'); ?>"><a href="?m=home">Home</a></li>
              <li class="<?php active_menu('users'); ?>"><a href="?m=users">Usuários</a></li>
              <li class="<?php active_menu('words'); ?>"><a href="?m=words">Palavras</a></li>
              <li class="<?php active_menu('rooms'); ?>"><a href="?m=rooms">Salas</a></li>
              <li class="<?php active_menu('rounds'); ?>"><a href="?m=rounds">Partidas</a></li>
              <li class="<?php active_menu('contacts'); ?>"><a href="?m=contacts">Contato</a></li>
              <li class="<?php active_menu('posts'); ?>"><a href="?m=posts">Postagens</a></li>
              <li class="<?php active_menu('statistics'); ?>"><a href="?m=statistics">Estatística</a></li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <div id="s_updating">Atualizando...</div>
	
	<div class="container">
		<div class="row-fluid">
