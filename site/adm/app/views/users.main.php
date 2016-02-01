<?php require 'header.php'; ?>
<div class="span12">
	<div class="row-fluid">
		<h2 class="span6">Lista de usuários</h2>
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
	<div class="row-fluid">
		<?php if(!$amount): ?>
		Não foram encontrados resultados.
		<br/><br/>
		<?php else: ?>
		<table class="table table-striped">
			<thead>
				<tr>
					<th>Nick</th>
					<th>Nome</th>
					<th>Criado em</th>
					<th>Pontos</th>
					<th colspan="2" width="15%">Ações</th>
				</tr>
			</thead>
			<tbody>				
				<?php foreach($find_users as $user): ?>
				<tr id="users-<?php echo $user['_id']; ?>">
					<td><?php echo (isset($user['nick']) ? $user['nick'] : '<b>Indefinido</b>'); ?></td>
					<td><?php echo (isset($user['name']) ? $user['name'] : '<b>Desconhecido</b>'); ?></td>
					<td><?php echo date('d/m/y H:i', $user['created_at']); ?></td>
					<td><?php echo $user['score']; ?></td>
					<td><a href="?m=users&a=edit&id=<?php echo $user['_id']; ?>" class="btn btn-warning inline"><i class="icon-pencil icon-white"></i></a></td>
					<td><a data-toggle="modal" href="#deleteUser" class="btn btn-danger inline"><i class="icon-remove icon-white"></i></a></td>
				</tr>
				<?php endforeach; ?>
			</tbody>
		</table>
		<?php pagination(false, $amount, $start, $per_page); ?>
		<?php endif; ?>
	</div>
</div>

<div class="modal hide" id="deleteUser">
  <div class="modal-header">
    <button type="button" class="close" data-dismiss="modal">×</button>
    <h3>Excluir usuário</h3>
  </div>
  <div class="modal-body">
    <p>Você tem certeza que deseja excluir o usuário "dygu"?</p>
  </div>
  <div class="modal-footer">
    <a href="#" class="btn" data-dismiss="modal">Cancelar</a>
    <a href="#" class="btn btn-primary">Sim, tenho!</a>
  </div>
</div>
<?php require 'footer.php'; ?>
