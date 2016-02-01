<?php
class rooms {
	function main() {		
		$find_rooms = db()->mongo_rooms->find()->sort(array('sort' => 1));
		$amount = $find_rooms->count();
		require 'app/views/rooms.main.php';
	}
	
	function add() {
		self::edit(true);
	}
	
	function edit($add = false) {
		$room_id = get('id');

		$data_room = db()->mongo_rooms->findOne(array('_id' => new MongoID($room_id)));

		if(!$data_room && !$add) {
			error404('Ops!', 'Sala não encontrada.');
			exit;
		}		

		$d_name = '';
		$d_slug = '';
		$d_duration = 120;
		$d_capacity = 20;
		$d_available = 1;
		$d_categories = array();
		$errors = array();

		if(post('submit')) {
			$f_name = post('name');
			$f_slug = strtolower(post('slug'));
			$f_duration = post('duration');
			$f_capacity = post('capacity');
			$f_available = post('available');
			$f_categories = (post('categories') == "" ? array() : explode(',', post('categories')));

			if(empty($f_name)) {
				$errors[] = 'Dê um nome para a sala.';
			}
			if(empty($f_slug)) {
				$errors[] = 'A sala precisa de um apelido, o campo "slug" está vazio.';
			} else {
				if(!preg_match('/^([a-z0-9]+)$/', $f_slug)) {
					$errors[] = 'O slug só pode conter letras e números';
				} else {
					if($data_room['slug'] != $f_slug && self::isThereRoom($f_slug)) {
						$errors[] = 'Já existe uma sala com esse apelido (slug). Apelidos devem ser únicos.';
					}
				}
			}
			if(!ctype_digit($f_duration) || $f_duration < 20) {
				$errors[] = 'A duração da rodada deve ser expressa em segundos e deve ser de no mínimo 20.';
			}
			if(!ctype_digit($f_capacity) || $f_duration < 2) {
				$errors[] = 'A capacidade deve ser um valor inteiro com valor de no mínimo 2.';
			}
			if(!is_array($f_categories) || @count($f_categories) <= 0) {
				$errors[] = 'Adicione alguma categoria para a palavra.';
			}
			if(count($errors) == 0) {
				if($add) {
					$sort_room = (db()->mongo_rooms->find()->count() + 1);
					$new_room = array('name' => $f_name, 'slug' => $f_slug, 'duration' => $f_duration, 'capacity' => $f_capacity, 'available' => $f_available, 'categories' => $f_categories, 'created_at' => time(), 'official' => 1, 'sort' => $sort_room);
					db()->mongo_rooms->insert($new_room);
					addLog('Adicionou sala : ' . $f_name . ' (' . $f_slug . '), id: ' . $new_room['_id']);
					header('Location: /adm/?m=rooms&a=edit&id=' . $new_room['_id'] . '&msg=15');
				} else {
					db()->mongo_rooms->update(array('_id' => new MongoID($room_id)), array('$set' => array('name' => $f_name, 'f_slug' => $f_slug, 'duration' => $f_duration, 'capacity' => $f_capacity, 'categories' => $f_categories, 'modified' => time())));
					addLog('Editou sala : ' . $f_name . ' (' . $f_slug . '), id: ' . $room_id);
				}
			} else {
				$d_name = $f_name;
				$d_slug = $f_slug;
				$d_duration = $f_duration;
				$d_capacity = $f_capacity;
				$d_available = $f_available;
				$d_categories = $f_categories;
			} 
		}

		if(count($errors) == 0 && !$add) {
			$data_room = db()->mongo_rooms->findOne(array('_id' => new MongoID($room_id)));	
			$d_name = $data_room['name'];
			$d_slug = $data_room['slug'];
			$d_duration = $data_room['duration'];
			$d_capacity = $data_room['capacity'];
			$d_available = $data_room['available'];
			$d_categories = $data_room['categories'];
		}

		$categories = db()->mongo_words_categories->find()->sort(array('name'));
		require 'app/views/rooms.edit.php';
	}

	function del() {
		$id_room = get('id');
		if($room_info = db()->mongo_rooms->findOne(array('_id' => new MongoID($id_room)))) {
			addLog(sprintf('%s (%s) excluiu a sala %s', userInfo('nick'), userInfo('_id'), $room_info['word']));
			db()->mongo_rooms->remove(array('_id' => new MongoID($id_room)));

			if(isset($_SERVER['HTTP_REFERER'])) {
				header('Location: ' . $_SERVER['HTTP_REFERER'] . '&msg=10');
			} else {
				error404('Sucesso!', 'Sala removida com sucesso.');
				exit;
			}
		} 

		error404('Ops!', 'Sala inexistente.');
		exit;
	}

	function updatesort() {
		$sort_rooms = json_decode(post('rooms', false, false, false));
		foreach($sort_rooms as $index => $room_id) {
			db()->mongo_rooms->update(array('_id' => new MongoID($room_id)), array('$set' => array('sort' => ($index+1))));
		}
	}

	private function isThereRoom($slug, $id = false) {
		return (bool) db()->mongo_rooms->find(array('slug' => $slug))->count();
	}
}
?>
