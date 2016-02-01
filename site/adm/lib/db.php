<?php
function db() { 	
	static $db;  	
	if ($db === null) 	{ 		
		$mongo = new Mongo(); 		
		$db = $mongo->mydb; 	
	}  	
	return $db; 
}
?>
