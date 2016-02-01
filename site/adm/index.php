<?php
session_start();
header('Content-Type: text/html; charset=utf-8');
date_default_timezone_set('America/Sao_Paulo');
define('SALTING', $_ENV["ADIVINHE_SALTING"]); 
/* Chama mongo */
require 'lib/db.php';
/* Funções */
require 'lib/functions.php';
/* Chama rotina presente em todas páginas */
require 'lib/common.php';
/* URL */
$m = (isset($_GET['m']) ? $_GET['m'] : 'home');
$a = (isset($_GET['a']) ? $_GET['a'] : 'main');
$mod_file = 'app/modules/' . $m . '.php';
if(file_exists($mod_file)) {
	require $mod_file;
	if(class_exists($m)) {
		$mod = new $m;
		if(is_callable(array($m, $a))) {
			$mod->$a();
		}
	}
}
?>
