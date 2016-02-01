<?php
class words {	
	function main() {
		/* Exclusão de palavra */
		if(post('delete-submit')) {
			$d_id_word = post('delete-id');
			if($word_info = db()->mongo_words->findOne(array('_id' => new MongoID($d_id_word)))) {
				addLog(sprintf('%s (%s) excluiu a palavra %s', userInfo('nick'), userInfo('_id'), $word_info['word']));
				db()->mongo_words->remove(array('_id' => new MongoID($d_id_word)));
				self::updateWordsPerCategory();
			}
		}

		/* Dados da página */
		$per_page = 10;
		$page = (isset($_GET['p']) ? $_GET['p'] : 1);	
		$start = ($page*$per_page) - $per_page;	
		$condictions = array();
		if(isset($_GET['d']) && is_array($_GET['d'])) {	
			//  Gambiarra pra ignorar se é "int" ou "string"
			$condictions['difficulty'] = array('$in' => array_merge($_GET['d'], array_map('intval', $_GET['d'])));
		}
		if(isset($_GET['c']) && is_array($_GET['c'])) {
			$condictions['categories'] = array('$in' => $_GET['c']);
		}
		if(isset($_GET['s'])) {
			$condictions['word'] = new MongoRegex("/" . get('s') . "/");
		}
		//var_dump($condictions);

		$find_words = db()->mongo_words->find($condictions)->sort(array('created_at' => -1))->limit($per_page)->skip($start);
		$amount = db()->mongo_words->find($condictions)->count();
		$categories = db()->mongo_words_categories->find();
		require 'app/views/words.main.php';
	}
	
	function add() {
		self::edit(true);
	}
	
	function edit($add = false) {
		if (!$add) {
			$id = get('id');	
			$data_word = db()->mongo_words->findOne(array('_id' => new MongoID($id)));
			if (!$data_word) {
				error404('Ops!', 'Palavra não encontrada.');
				exit;
			}
		}	
		
		if(post('submit')) {
			$f_word = strtolower(post('word'));
			$f_difficulty = post('difficulty');
			$f_categories = (post('categories') == "" ? array() : explode(',', post('categories')));	
			$errors = array();
			if(empty($f_word)) {
				$errors[] = 'Você não escreveu palavra alguma.';
			} else if($add) {		
				if(self::isThereWord($f_word)) {
					$errors[] = 'Esta palavra já foi adicionada.';
				}
			}
			if(!in_array($f_difficulty, array(1, 2, 3, 4, 5))) {
				$errors[] = 'Selecione uma dificuldade válida!';
			}
			if(!is_array($f_categories) || @count($f_categories) <= 0) {
				$errors[] = 'Adicione alguma categoria para a palavra.';
			}
			
			if(count($errors) == 0) {
				if($add) {
					$new_word = array('word' => $f_word, 'difficulty' => $f_difficulty, 'categories' => $f_categories, 'created_at' => time());
					db()->mongo_words->insert($new_word);
					header('Location: /adm/?m=words&a=edit&id=' . $new_word['_id'] . '&msg=15');
				} else {
					db()->mongo_words->update(array('_id' => new MongoID($id)), array('$set' => array('word' => $f_word, 'difficulty' => $f_difficulty, 'categories' => $f_categories)));
				}
				self::updateWordsPerCategory();
			}
		}
		
		if (!$add) {
			$data_word = db()->mongo_words->findOne(array('_id' => new MongoID($id)));	
			$d_word = $data_word['word'];
			$d_diff = $data_word['difficulty'];
		}
		
		$d_categories = (isset($data_word['categories']) ? $data_word['categories'] : array());
		$categories = db()->mongo_words_categories->find()->sort(array('name'));
		
		//var_dump($data_word);
		//echo '<br/><br/>';
		//var_dump($categories);
		require 'app/views/words.edit.php';
	}
	
	function addcategory() {
		$category = (post('category') ? ucwords(strtolower(post('category'))) : post('category'));
		if(!self::isThereCategory($category)) {
			$data_category = array('name' => $category, 'created_at' => time());
			$add_category = db()->mongo_words_categories->insert($data_category);
			if($add_category) {
				echo '["' . $data_category['_id'] . '", "' . $category . '"]';
			} else {
				echo '[false, "Erro ao tentar salvar valor no banco de dados."]';
			}
			
		} else {
			echo '[false, "Essa categoria já existe."]';
		}
		exit();
	}
	
	function editcategory() {
		$id_category = post('id_category');

		$data_category = db()->mongo_words_categories->findOne(array('_id' => new MongoID($id_category)));
		if(!$data_category) {
			echo '[false, "Categoria inexistente, pode ter sido excluída."]';
			exit();
		}

		$name_category = (post('name_category') ? ucwords(strtolower(post('name_category'))) : post('name_category'));
		if(!self::isThereCategory($name_category)) {
			if($name_category != '') {
				$edit_category = db()->mongo_words_categories->update(array('_id' => new MongoID($id_category)), array('$set' => array('name' => $name_category)));
				if($edit_category) {
					echo '[true, "' . $name_category . '"]';
				} else {
					echo '[false, "Erro ao tentar alterar valor no banco de dados."]';
				}				
			} else {
				echo '[false, "Você deixou o campo em branco."]';
			}			
		} else {
			echo '[false, "Essa categoria já existe."]';
		}
		exit;		
	}
	
	private function isThereWord($word) {
		return (bool) db()->mongo_words->find(array('word' => $word))->count();
	}
	
	private function isThereCategory($category) {
		return (bool) db()->mongo_words_categories->find(array('name' => $category))->count();
	}

	private function updateWordsPerCategory() {
		$categories = db()->mongo_words_categories->find();
		foreach($categories as $category) {
			$category_id = (string) $category['_id'];
			$associated_words = db()->mongo_words->find(array('categories' => $category_id))->count();
			db()->mongo_words_categories->update(array('_id' => new MongoID($category_id)), array('$set' => array('associated_words' => $associated_words)));
		}
	}
}
?>
