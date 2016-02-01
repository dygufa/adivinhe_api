<?php require 'header.php'; ?>


<div class="row12">
	<div class="span12" id="main_graph">

	</div>
</div>

<div class="row12">	
	<div class="span6">2</div>
	<div class="span6">3</div>
</div>

<script type="text/javascript" src="https://www.google.com/jsapi"></script>
<script type="text/javascript">
  google.load("visualization", "1", {packages:["corechart"]});
  google.setOnLoadCallback(drawChart);
  function drawChart() {
    var data = google.visualization.arrayToDataTable([
      ['Year', 'Usuários online', 'Gasto de memória'],
      ['2004',  1000,      400],
      ['2005',  1170,      460],
      ['2006',  660,       1120],
      ['2007',  1030,      540],
      ['2008',  1030,      540],
      ['2009',  1030,      540],
      ['2010',  1030,      540]
    ]);

    var options = {
      title: 'Registros de acessos'
    };

    var chart = new google.visualization.LineChart(document.getElementById('main_graph'));
    chart.draw(data, options);
  }
</script>

<?php require 'footer.php'; ?>
