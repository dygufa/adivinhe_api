<?php
class posts {
	function main() {
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
		
		$find_posts = db()->mongo_posts->find($condictions)->sort(array('created_at' => -1))->limit($per_page)->skip($start);
		$amount = db()->mongo_posts->find($condictions)->count();
		require 'app/views/posts.main.php';
	}
	
	function add() {
		self::edit(true);
	}

	function edit($add = false) {
		$post_id = get('id');	

		if(!$add && !$data_post = db()->mongo_posts->findOne(array('_id' => new MongoID($post_id)))) {
			error404('Ops!', 'Artigo não encontrado.');
			exit;
		}
		/**
		* Editando postagem
		**/	
		$errors = array();
		if(post('submit')) {
			$title = post('title');
			$available = post('available');
			$article = post('article');
			if(empty($title)) {
				$errors[] = 'Cadê o título? Parece que ficou vazio.';	
			} 
			if(!in_array($available, array(1, 2))) {
				$errors[] = 'Não detectei se você quer que o artigo seja exibido. Esse é um erro estranho.';	
			}
			if(empty($article)) {
				$errors[] = 'Escreva alguma coisa! Não posso postar um artigo em branco.';	
			} 
			if(!count($errors)) {
				$data_post = array('title' => $title, 'available' => $available, 'article' => $article);
				if($add) {
					$data_post['created_at'] = time();
					db()->mongo_posts->insert($data_post);
					header('Location: /adm/?m=posts&a=edit&id=' . $data_post['_id'] . '&msg=15');
				} else {
					$data_post['modified_at'] = time();
					db()->mongo_posts->update(array('_id' => new MongoID($post_id)), array('$set' => $data_post));
				}				
			} else {
				$title = post('title');
				$available = post('available');
				$article = post('article');
			}
		}

		/**
		* Dados do artigo
		**/
		if(!count($errors)) {
			$data_post = db()->mongo_posts->findOne(array('_id' => new MongoID($post_id)));
			$title = $data_post['title'];
			$available = ($add ? 1 : $data_post['available']);
			$article = $data_post['article'];
			$created_at = $data_post['created_at'];
		}

		require 'app/views/posts.edit.php';
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
