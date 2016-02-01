
<?php require 'header.php'; ?>

<?php
$convert_diff = array(1 => 'Muito fácil', 2 => 'Fácil', 3 => 'Mediana', 4 => 'Difícil', 5 => 'Muito difícil');
?>

<div class="span8">
	<div class="row-fluid">
		<h2 class="span6">Lista de palavras</h2>
		<form method="GET" action="./" class="form-search pull-right">
			<?php foreach (explode('&', $_SERVER['QUERY_STRING']) as $query_string):
			list($key, $value) = explode('=', urldecode($query_string));
			if($key == 's' || $key == 'p') {
				continue;
			}
			?>
				<input type="hidden" name="<?php echo $key; ?>" value="<?php echo $value; ?>">
			<?php endforeach; ?>
			<input type="text" name="s" class="input-medium search-query" value="<?php echo (isset($_GET['s']) ? $_GET['s'] : ''); ?>">
			<button type="submit" class="btn">Procurar</button>
		</form>
	</div>

	<?php if(get('msg') == 10): ?>
	<div class="alert alert-error">
		<a class="close" data-dismiss="alert" href="#">×</a>
		Palavra removida com sucesso. Por segurança, registrei seu nome nos meus logs.
	</div>
	<?php endif; ?>

	<div class="row-fluid">
		<a href="?m=words&a=add" class="btn btn-success"><i class="icon-plus icon-white"></i> Adicionar palavra</a>	
		<?php if(!$amount): ?>
		<br/><br/><div>Nenhum resultado encontrado.</div><br/>
		<?php else: ?>
		<table class="table table-striped">
			<thead>
				<tr>
					<th>Palavra</th>
					<th>Dificuldade</th>
					<th colspan="2" width="15%">Ações</th>
				</tr>
			</thead>
			<tbody>
				<?php foreach($find_words as $word): ?>
				<tr id="word-<?php echo $word['_id']; ?>">
					<td class="t-word"><?php echo ucwords($word['word']); ?></td>
					<td><?php echo $convert_diff[$word['difficulty']]; ?></td>
					<td><a href="?m=words&a=edit&id=<?php echo $word['_id']; ?>" class="btn btn-warning inline"><i class="icon-pencil icon-white"></i></a></td>
					<td><a data-toggle="modal" href="#deleteWord" class="delete-button btn btn-danger inline"><i class="icon-remove icon-white"></i></a></td>
				</tr>
				<?php endforeach; ?>
			</tbody>
		</table>
		<?php pagination(false, $amount, $start, $per_page); ?>
		<?php endif; ?>
		<a href="?m=words&a=add" class="btn btn-success"><i class="icon-plus icon-white"></i> Adicionar palavra</a>		
	</div>
</div>

<div class="span4">
	<form action="./" method="GET" class="well">
		<input type="hidden" name="m" value="words" />
		<button class="btn btn-primary"><i class="icon-filter icon-white"></i> Filtrar dados</button>
		<br/><br/>
		<ul class="nav nav-list">
			<li class="nav-header">Dificuldade</li>
			<?php foreach($convert_diff as $d_id => $d_diff): ?>
			<li><input type="checkbox" <?php if(!isset($_GET['d']) || in_array($d_id, $_GET['d'])): ?>checked="checked"<?php endif; ?> name="d[]" value="<?php echo $d_id; ?>"> <?php echo $d_diff; ?></li>
			<?php endforeach; ?>
			<li class="nav-header">Categorias</li>
			<?php foreach($categories as $category): ?>
			<li><input type="checkbox" <?php if(!isset($_GET['c']) || in_array($category['_id'], $_GET['c'])): ?>checked="checked"<?php endif; ?> name="c[]" value="<?php echo $category['_id']; ?>"> <?php echo $category['name']; ?> (<?php echo $category['associated_words']; ?>)</li>
			<?php endforeach; ?>
		</ul>
		<br/>
		<button class="btn btn-primary"><i class="icon-filter icon-white"></i> Filtrar dados</button>
	</form>
</div>

<div class="modal hide" id="deleteWord">
  <div class="modal-header">
    <button type="button" class="close" data-dismiss="modal">×</button>
    <h3>Excluir palavra</h3>
  </div>
  <div class="modal-body">
    <p>Você tem certeza que deseja excluir a palavra "<span id="check-word">cachorro</span>"?</p>
  </div>
  <div class="modal-footer">
  	<form action="<?php echo $_SERVER['REQUEST_URI']; ?>&msg=10" method="POST">
    	<a href="#" class="btn" data-dismiss="modal">Cancelar</a>
    	<input type="hidden" name="delete-id" id="delete-id" value="">
    	<button type="submit" name="delete-submit" value="1" class="btn btn-primary">Sim, tenho!</button>
	</form>
  </div>
</div>

<script>
$('.delete-button').click(function() {
	var item = $(this).parents('tr'),
		id = item.attr('id').replace('word-', '');
		word = item.find('.t-word').text();
	$('#check-word').html(word);
	$('#delete-id').val(id);
});
</script>

<?php require 'footer.php'; ?>
