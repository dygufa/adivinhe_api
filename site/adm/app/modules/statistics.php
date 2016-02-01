<?php
class statistics {
	function main() {		
		require 'app/views/statistics.main.php';
	}

	private function getMonthData($start, $end) {
		db()->mongo_resource_logs->find();
	}
}
?>
