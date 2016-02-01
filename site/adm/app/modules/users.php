<?php
class users {
	static $register_types = array(0 => 'Normal', 1 => 'Facebook');
	static $privileges = array('usu' => 'Usuário', 'mod' => 'Moderador', 'adm' => 'Administrador');
	static $punishments = array('selecione' => 'Selecione', 0 => 'Advertir', 3600 => '1 hora', 7200 => '2 horas', 86400 => '24 horas', 172800 => '48 horas', 345600 => '4 dias', 604800 => '1 semana', 1209600 => '2 semanas', 2419200 => '1 mês', 4838400 => '2 meses', 14515200 => '6 meses', 29030400 => '1 ano', 145152000 => '5 anos');

	function main() {
		$title = '';
		$per_page = 12;
		$page = (isset($_GET['p']) ? $_GET['p'] : 1);	
		$start = ($page*$per_page) - $per_page;	
		$condictions = array();
		if(isset($_GET['s'])) {
			$findu = array();
			$findu[] = array('nick_lower' => new MongoRegex("/" . get('s') . "/i"));
			$findu[] = array('name' => new MongoRegex("/" .get('s') . "/i"));
			$condictions['$or'] = $findu;
		}
		
		$find_users = db()->mongo_users->find($condictions)->sort(array('created_at' => -1))->limit($per_page)->skip($start);
		$amount = db()->mongo_users->find($condictions)->count();
		require 'app/views/users.main.php';
	}
	
	function edit() {
		$user_id = get('id');	
		$data_user = db()->mongo_users->findOne(array('_id' => new MongoID($user_id)));

		if(!$data_user) {
			error404('Ops!', 'Usuário não encontrado.');
			exit;
		}
		/**
		* Editando usuário
		**/		
		$originnal_nick = $data_user['nick_lower'];

		if(post('submit')) {
			$name = post('name');
			$nick = post('nick');
			$email = post('email');
			$email_checked = post('email_checked');
			$errors = array();
			if(empty($nick)) {
				if($data_user['register_type'] == 0) {
					$errors[] = 'É obrigatório um nick para usuários não oriundos de login externo.';
				}				
			} else if(self::isThereUser($nick) && $originnal_nick != strtolower($nick)) {
				$errors[] = 'Este nick já está em uso.';
			}
			if(!in_array($email_checked, array(0, 1))) {
				$errors[] = 'Informe se o email é confirmado ou não.';
			}
			if(!count($errors)) {
				$changes = array('nick' => $nick, 'nick_lower' => strtolower($nick), 'name' => $name, 'email' => $email, 'email_checked' => $email_checked);
				if(isDygu()) {
					$changes['privilege'] = post('privilege');
				}
				db()->mongo_users->update(array('_id' => new MongoID($user_id)), array('$set' => $changes));
			}
		}

		/**
		* Dados do usuário 
		**/
		$data_user = db()->mongo_users->findOne(array('_id' => new MongoID($user_id)));
		$name = (isset($data_user['name']) ? $data_user['name'] : '');
		$nick = (isset($data_user['nick']) ? $data_user['nick'] : '');
		$email = (isset($data_user['email']) ? $data_user['email'] : '');
		$created_at = $data_user['created_at'];
		$last_visit = (isset($data_user['last_visit']) ? $data_user['last_visit'] : $created_at);
		$email_checked = (isset($data_user['email_checked']) ? $data_user['email_checked'] : 0);		
		$register_type = (isset($data_user['register_type']) ? $data_user['register_type'] : false); // 0 = normal/ 1 = facebook
		$privilege = (isset($data_user['privilege']) ? $data_user['privilege'] : 'usu');

		/**
		* Bans 
		**/
		$data_bans = db()->mongo_bans->find(array('receiver' => $user_id))->limit(5)->sort(array('created_at' => -1));

		/**
		* Rodadas
		**/
		$data_rounds = db()->mongo_rounds->find(array('players' => array($user_id)));

		require 'app/views/users.edit.php';
	}

	function ban() {
		$user_id = get('id');	
		$data_user = db()->mongo_users->findOne(array('_id' => new MongoID($user_id)));

		if(!$data_user) {
			error404('Ops!', 'Usuário não encontrado.');
			exit;
		}

		$f_reason = $f_note = '';
		$f_punishment = 'selecione';

		if(post('submit')) {
			$punishment = post('punishment');
			$reason = post('reason');
			$note = post('note');
			$errors = array();
			if(empty($reason)) {
				$errors[] = 'Você não informou o motivo.';
			}
			if(!array_key_exists($punishment, self::$punishments) || $punishment == 'selecione') {
				$errors[] = 'Selecione uma punição.';
			}
			if(!count($errors)) {
				$new_ban = array('author' => userInfo('_id'), 'receiver' => $user_id, 'reason' => $reason, 'note' => $note, 'duration' => $punishment, 'created_at' => time());
				db()->mongo_bans->insert($new_ban);
			} else {
				$f_reason = $reason;
				$f_note = $note;
				$f_punishment = $punishment;
			}
		}

		$nick = $data_user['nick'];
		
		$data_bans = db()->mongo_bans->find(array('receiver' => $user_id))->sort(array('created_at' => -1));

		require 'app/views/users.ban.php';
	}

	function ban_status() {
		$ban_id = get('id');
		$acao = (int) get('c'); 

		$data_ban = db()->mongo_bans->findOne(array('_id' => new MongoID($ban_id)));

		if(!$data_ban) {
			error404('Ops!', 'Referência de banimento inválida.');
			exit;
		}

		if($acao == 1) {
			db()->mongo_bans->update(array('_id' => new MongoID($ban_id)), array('$unset' => array('disabled' => 1)));
			
		} else if($acao == 0) {
			db()->mongo_bans->update(array('_id' => new MongoID($ban_id)), array('$set' => array('disabled' => 1)));
		}

		if(isset($_SERVER['HTTP_REFERER'])) {
			$url_data = parse_url($_SERVER['HTTP_REFERER']);
			parse_str($url_data['query'], $url_data_query);
			header('Location: ' . $_SERVER['HTTP_REFERER'] . (isset($url_data_query['t']) ? '' : '&t=2'));
		} else {
			error404('Sucesso!', 'Atualização de status de banimento concluída.');
			exit;
		}
		
	}

	private function isThereUser($data, $use_id = false) {
		$condiction = array(($use_id ? '_id' : 'nick_lower') => ($use_id ? new MongoID($data) : strtolower($data)));
		//var_dump($condiction);
		return (bool) db()->mongo_users->find($condiction)->count();
	}
}
?>
