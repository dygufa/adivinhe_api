<?php
function active_menu($page) {
	$current_page = (isset($_GET['m']) ? $_GET['m'] : 'home');
	echo ($current_page == $page ? 'active' : '');
}

function pagination($url, $amount, $start, $per_page) {
	if($url === false) {
		$url = $_SERVER['QUERY_STRING'];
		parse_str($url, $url);
		if(isset($url['p'])) {
			unset($url['p']);
		}
		$url = '?' . http_build_query($url);
	}
	$pages	= ceil($amount/$per_page);
	$currently = (($start+$per_page)/$per_page);
	$text = '<div class="pagination pull-right">';
		$text .= '<ul>';
			if($currently != 1 && $currently > 2):
			$text .= '<li><a href="' . $url . sprintf('&p=%u', 1) . '">Primeira</a></li>';
			endif;
			if($currently != 1):
			$text .= '<li><a href="' . $url . sprintf('&p=%u', $currently-1) . '">Anterior</a></li>';
			endif;
			for($i = $currently-($currently == $pages ? 2 : 1); $i <= $currently+($currently == 1 ? 2 : 1); $i++):
				if($i > 0 && $i <= $pages):
					$text .= '<li ' . ($currently == $i ? 'class="active"' : '') . '><a href="' . $url . sprintf('&p=%u', $i) . '">' . $i . '</a></li>';
				endif;
			endfor;			
			if($currently != $pages && $pages > 0):
			$text .= '<li><a href="' . $url . sprintf('&p=%u', $currently+1) . '">Próxima</a></li>';
			endif;
			if($currently != $pages && $pages != $currently+1):
			$text .= '<li><a href="' . $url . sprintf('&p=%u', $pages) . '">Última</a></li>';
			endif;
		$text .= '</ul>';
	$text .= '</div>';
	echo $text;
}

function get($var, $default = false, $htmlspecialchars = true) {
	if (isset($_GET[$var])) {
		$value = $_GET[$var];
		if ($htmlspecialchars) {
			$value = htmlspecialchars($value, ENT_QUOTES);
		} else {
			$value = addslashes($value);
		}
		$value = trim($value);
		return $value;
	} else {
		return $default;
	}
}

function post($var, $default = false, $htmlspecialchars = true, $addslashes = true) {
	if (isset($_POST[$var])) {
		$value = $_POST[$var];
		if (is_array($value)) {
			return $default;
		}		
		if ($htmlspecialchars) {
			$value = htmlspecialchars($value, ENT_QUOTES);
		} else {
			$value = ($addslashes ? addslashes($value) : $value);
		}
		$value = trim($value);
		return $value;
	} else {
		return $default;
	}
}

function userInfo($row) {
	return (isset($_SESSION['usr_data'][$row]) ? $_SESSION['usr_data'][$row] : null);
}

function addLog($content, $type = 1) {
	// types: 1 = aviso, 2 = erro, 3 = segurança
	$newlog = array('created_at' => time(), 'content' => $content, 'user_id' => (string) userInfo('_id'), 'type' => $type, 'ip' => $_SERVER['REMOTE_ADDR']);
	db()->logs->insert($newlog);
}

function isDygu() {
	return (userInfo('_id') == '56a46d02235f5ddf05473b0b');
}

function error404($title, $content) {
	require 'app/views/error.404.php';
}
?>
