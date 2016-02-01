<?php
class contacts {
	private static $categories = array('1' => 'Sugestão', '2' => 'Denúncia', '3' => 'Erro', '4' => 'Reclamação', '5' => 'Publicidade', '6' => 'Interesse profissional', '7' => 'Outra coisa');
	
	function main() {
		$title = '';
		$per_page = 10;
		$page = (isset($_GET['p']) ? $_GET['p'] : 1);	
		$start = ($page*$per_page) - $per_page;	
		$condictions = array();
		if(isset($_GET['s']) && is_array($_GET['s'])) {
			$c_s = array();
			foreach($_GET['s'] as $id) {
				$c_s[] = array("subject" => (int) $id);
			}
			$condictions['$or'] = $c_s;
		}

		$find_contacts = db()->mongo_contacts->find($condictions)->sort(array('created_at' => -1))->limit($per_page)->skip($start);
		$amount = db()->mongo_contacts->find($condictions)->count();
		require 'app/views/contacts.main.php';
	}
	
	function add() {
		self::edit(true);
	}
	
	function edit($add = false) {
		require 'app/views/words.edit.php';
	}
	
	function view() {
		$id = $_GET['id'];
		$contact = db()->mongo_contacts->findOne(array('_id' => new MongoID($id)));
		$author_info = db()->mongo_users->findOne(array('_id' => new MongoID($contact['author'])));
		require 'app/views/contacts.view.php';
	}
}
?>
