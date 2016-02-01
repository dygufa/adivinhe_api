<?php
/*if(count($_POST) && isset($_SERVER['HTTP_REFERER'])) {
	$url = parse_url($_SERVER['HTTP_REFERER']);
	if(strtolower($url['host']) != strtolower($_SERVER["SERVER_NAME"])) {
		if(isset($_SESSION['usr_id'])) {
			addLog(sprintf('CSRF: usuário %s (id: %s, ip: %s), url de referência: %s', userInfo('nick'), userInfo('_id'), $_SERVER['REMOTE_ADDR'], $_SERVER['HTTP_REFERER']), 3);
		} else {
			addLog(sprintf('CSRF: usuário sem autenticação (ip: %s), url de referência: %s', $_SERVER['REMOTE_ADDR'], $_SERVER['HTTP_REFERER']), 3);
		}
		header('Location: ' . $_SERVER['REQUEST_URI']);	
		exit;
	}
}*/

if(isset($_POST['login'])) {
	$nick = post('nick');
	$passwd = post('passwd');
	if($usr_data = db()->mongo_users->findOne(array('nick_lower' => strtolower($nick), 'password' => sha1($passwd . SALTING)))) {
		if(in_array($usr_data['privilege'], array('adm', 'mod'))) {
			$_SESSION['usr_id'] = $usr_data['_id'];
			$_SESSION['usr_data'] = $usr_data;
		} else {
			$login_error = 'Você não tem privilégios para isso.';
		}		
	} else {
		$login_error = 'Nick e senha não correspondem.';
	}
}

if(isset($_GET['logout'])) {
	unset($_SESSION['usr_id']);
	header('Location: /adm');
}

if(!isset($_SESSION['usr_id'])) {
	require 'app/views/login.php';
	exit;
}
?>
