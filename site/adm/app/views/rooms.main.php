<?php require 'header.php'; ?>

<div class="span12">
	<div class="row-fluid">
		<h2>Gerenciar salas oficiais</h2>
	</div>
	<br/>
	<?php if(get('msg') == 10): ?>
	<div class="alert alert-error">
		<a class="close" data-dismiss="alert" href="#">×</a>
		Sala removida com sucesso. Por segurança, registrei seu nome nos meus logs.
	</div>
	<?php endif; ?>
	<div class="row-fluid">
		<a href="?m=rooms&a=add" class="btn btn-success"><i class="icon-plus icon-white"></i> Adicionar sala</a>	
		<?php if(!$amount): ?>
		<br/><br/>
		Não foram encontrados resultados.
		<br/><br/>
		<?php else: ?>
		<table class="table table-striped" id="t_rooms">
			<thead>
				<tr>
					<th>Ordem</th>
					<th>Nome</th>
					<th>Slug</th>
					<th>Lotação máxima</th>
					<th>Lotação agora</th>
					<th>Duração da rodada</th>					
					<th>Criada em</th>
					<th colspan="2" width="15%">Ações</th>
				</tr>
			</thead>
			<tbody>	
				<?php $i = 0; ?>			
				<?php foreach($find_rooms as $room): ?>
				<?php $i++; ?>
				<tr id="room-<?php echo $room['_id']; ?>">
					<td class="order"><?php echo $i; ?></td>
					<td class="r_name"><?php echo $room['name']; ?></td>
					<td class="r_slug"><?php echo $room['slug']; ?></td>
					<td><?php echo $room['capacity']; ?></td>
					<td>?</td>
					<td><?php echo $room['duration']; ?></td>
					<td><?php echo date('d/m/Y H:i:s', $room['created_at']); ?></td>
					<td><a href="?m=rooms&a=edit&id=<?php echo $room['_id']; ?>" class="btn btn-warning inline"><i class="icon-pencil icon-white"></i></a></td>
					<td><a data-toggle="modal" href="#deleteRoom" class="delete-button btn btn-danger inline"><i class="icon-remove icon-white"></i></a></td>
				</tr>
				<?php endforeach; ?>
			</tbody>
		</table>
		<?php endif; ?>
		<a href="?m=rooms&a=add" class="btn btn-success"><i class="icon-plus icon-white"></i> Adicionar sala</a>
	</div>
	<br/>
</div>

<div class="modal hide" id="deleteRoom">
  <div class="modal-header">
    <button type="button" class="close" data-dismiss="modal">×</button>
    <h3>Excluir sala</h3>
  </div>
  <div class="modal-body">
    <p>Você tem certeza que deseja excluir a sala "<span id="f_d_name"></span> (<span id="f_d_slug"></span>)"?</p>
  </div>
  <div class="modal-footer">
    <a href="#" class="btn" data-dismiss="modal">Cancelar</a>
    <a href="#" id="f_d_b" class="btn btn-primary">Sim, tenho!</a>
  </div>
</div>

<script>
$('.delete-button').click(function() {
	var item = $(this).parents('tr'),
		id = item.attr('id').replace('room-', '');
		name = item.find('.r_name').text(),
		slug = item.find('.r_slug').text();
	$('#f_d_name').html(name);
	$('#f_d_slug').html(slug);
	$('#f_d_b').attr('href', '?m=rooms&a=del&id=' + id);
});

var fixHelper = function(e, ui) {
	ui.children().each(function() {
		$(this).width($(this).width());
	});
	return ui;
};

$("#t_rooms tbody").sortable({
	helper: fixHelper,
	update: function() {
		var n_rooms = [];
		$('#t_rooms tbody tr').each(function(index) {
			$(this).find('.order').html(index + 1);
			n_rooms.push($(this).attr('id').replace('room-', ''));
		});
		$.ajax({
			type: 'POST',
			url: '/adm/?m=rooms&a=updatesort', 
			data: {'rooms': JSON.stringify(n_rooms)},
			beforeSend: function() {
				$('#s_updating').fadeIn(250);
			},
			success: function() {
				setTimeout(function() { $('#s_updating').fadeOut(250); }, 500);
			}
		});
	}
}).disableSelection();
</script>

<?php require 'footer.php'; ?>
