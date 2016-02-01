<?php require 'header.php'; ?>
<?php
	$categories = array('1' => 'Sugestão', '2' => 'Denúncia', '3' => 'Erro', '4' => 'Reclamação', '5' => 'Publicidade', '6' => 'Interesse profissional', '7' => 'Outra coisa');
?>
<div class="span8">
	<div class="row-fluid">
		<h2 class="span6">Lista de mensagens</h2>
		<form class="form-search pull-right">
			<input type="text" class="input-medium search-query">
			<button type="submit" class="btn">Procurar</button>
		</form>
	</div>

	<div class="row-fluid">
		<a href="?m=words&a=add" class="btn btn-success"><i class="icon-plus icon-white"></i> Enviar mensagem</a>
		<br/><br/>		
		<?php if($amount == 0): ?>
		Nenhum resultado encontrado.
		<br/>
		<?php else: ?>
		<table class="table table-striped">
			<thead>
				<tr>
					<th>Assunto</th>
					<th>Autor</th>
					<th>Enviado</th>
					<th>Status</th>
					<th colspan="2" width="15%">Ações</th>
				</tr>
			</thead>
			<tbody>
			<?php
			foreach($find_contacts as $contact): 
			$user_info = db()->mongo_users->findOne(array('_id' => new MongoID($contact['author'])), array('nick' => 1));
			?>
				<tr id="contact-<?php echo $contact['_id']; ?>">
					<td class="p_subject"><?php echo $categories[$contact['subject']]; ?></td>
					<td class="p_author"><?php echo ($user_info['nick'] ? $user_info['nick'] : 'Desconhecido'); ?></td>
					<td><?php echo date('d/m/y H:i', $contact['created_at']); ?></td>
					<td>Lido</td>
					<td><a href="?m=contacts&a=view&id=<?php echo $contact['_id']; ?>" class="btn btn-warning inline"><i class="icon-file icon-white"></i></a></td>
					<td><a data-toggle="modal" href="#deleteWord" class="btn btn-danger inline actiondel"><i class="icon-remove icon-white"></i></a></td>
				</tr>
			<?php endforeach; ?>			
			</tbody>
		</table>
		<?php endif; ?>
		<br/>
		<a href="?m=words&a=add" class="btn btn-success"><i class="icon-plus icon-white"></i> Enviar mensagem</a>
		
		<?php pagination(false, $amount, $start, $per_page); ?>
	</div>
</div>

<div class="span4">
	<form action="./" method="GET" class="well">
		<input type="hidden" name="m" value="contacts" />
		<button class="btn btn-primary"><i class="icon-filter icon-white"></i> Filtrar dados</button>
		<br/><br/>
		<ul class="nav nav-list">
			<li class="nav-header">Assunto</li>
			<?php foreach($categories as $id => $name): ?>
			<li><input type="checkbox" <?php if(!isset($_GET['s']) || in_array($id, $_GET['s'])): ?>checked="checked"<?php endif; ?> name="s[]" value="<?php echo $id; ?>"> <?php echo $name; ?></li>
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
    <p>Você tem certeza que deseja excluir a mensagem cujo assunto é "<span id="r_subject"></span>" enviada por "<span id="r_author"></span>"?</p>
  </div>
  <div class="modal-footer">
    <a href="#" class="btn" data-dismiss="modal">Cancelar</a>
    <a href="#" class="btn btn-primary">Sim, tenho!</a>
  </div>
</div>

<script>
$('.actiondel').click(function() {
	var tr = $(this).parents('tr');
	$('#r_subject').html(tr.find('.p_subject').html());
	$('#r_author').html(tr.find('.p_author').html());
});
</script>

<?php require 'footer.php'; ?>
