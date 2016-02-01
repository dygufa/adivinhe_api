<?php require 'header.php'; ?>

<?php
$category_names = array();
foreach($categories as $category) {
	$category_names[(string)$category['_id']] = $category['name'];
}
?>

<div class="span8">
	<h2><?php if($add): ?>Adicionar<?php else: ?>Editar<?php endif; ?> sala</h2>
	<br/>
	<?php if(get('msg') == 15): ?>
	<div class="alert alert-success">
		<a class="close" data-dismiss="alert" href="#">×</a>
		Sala adicionada com sucesso. <a href="/adm/?m=rooms&a=add">Clique aqui</a> caso deseje adicionar outra.
	</div>
	<?php endif; ?>
	<?php if(isset($errors) && count($errors)): ?>	
	<div class="alert alert-error">
		<button class="close" data-dismiss="alert">×</button>
		<?php foreach($errors as $error): ?>
		<?php echo $error; ?>
		<br/>
		<?php endforeach; ?>
	</div>
	<?php endif; ?>
	
	<form class="form-horizontal" action="<?php echo $_SERVER['REQUEST_URI']; ?>" method="POST">
		<fieldset>
			<div class="control-group">
				<label class="control-label" for="name">Sala</label>
				<div class="controls">
					<input type="text" class="input-xlarge" id="name" name="name" value="<?php echo $d_name; ?>"> 
					<p class="help-block">Escreva o nome da sala.</p>
				</div>
			</div>

			<div class="control-group">
				<label class="control-label" for="slug">Apelido</label>
				<div class="controls">
					<input type="text" class="input-xlarge" id="slug" name="slug" value="<?php echo $d_slug; ?>"> 
					<p class="help-block">Uma palavra de referência (sem acentos, minúscula) para a sala.</p>
				</div>
			</div>

			<div class="control-group">
				<label class="control-label" for="duration">Duração da rodada</label>
				<div class="controls">
					<input type="number" class="input-xlarge" id="duration" name="duration" value="<?php echo $d_duration; ?>"> 
					<p class="help-block">Duração da rodada em segundos. No mínimo 20.</p>
				</div>
			</div>

			<div class="control-group">
				<label class="control-label" for="capacity">Lotação</label>
				<div class="controls">
					<input type="number" class="input-xlarge" id="capacity" name="capacity" value="<?php echo $d_capacity; ?>"> 
					<p class="help-block">Número máximo de jogadores por rodada. No mínimo 2.</p>
				</div>
			</div>

			<div class="control-group">
				<label class="control-label">Sala aberta</label>
				<div class="controls">
					<div class="btn-group" data-toggle="buttons-radio">
						<input type="hidden" name="available" id="inp-ec" value="<?php echo $d_available; ?>">
						<button type="button" class="btn-ec btn <?php if($d_available == 1): ?>active<?php endif; ?>">Sim</button>
						<button type="button" class="btn-ec btn <?php if($d_available == 0): ?>active<?php endif; ?>">Não</button>
					</div>
				</div>
			</div>

			<div class="control-group">
				<label class="control-label" for="input01">Categorias</label>
				<div class="controls">
					<input type="hidden" name="categories" id="inp-categories" value="<?php echo implode(',', $d_categories); ?>">
					<ul class="nav" id="palavras-categorias-escolhidas">
					<?php if(count($d_categories)): ?>
						<?php foreach($d_categories as $d_category): ?>
						<li id="sel-cat-<?php echo $d_category; ?>"><span><?php echo $category_names[$d_category]; ?></span><i class="rmv-category icon-remove pull-right"></i></li>
						<?php endforeach; ?>
					<?php else: ?>
						<li class="dgoff" id="pce-alert">Arraste as categorias para esta área.</li>
					<?php endif; ?>
					</ul>
				</div>
			</div>
			<div class="form-actions">
				<button class="btn btn-primary" type="submit" name="submit" value="submit"><?php if($add): ?>Adicionar<?php else: ?>Editar<?php endif; ?> sala</button>
				<a href="/adm/?m=words" class="btn">Cancelar</a>
			</div>
		</fieldset>
	</form>
</div>
<div class="span4">	
	<div class="well">
		<ul class="nav nav-pills nav-stacked" id="categorias">
			<li class="nav-header">Categorias</li>
			<?php foreach($categories as $category): ?>
			<li id="category-<?php echo $category['_id']; ?>" class="<?php echo (in_array((string)$category['_id'], $d_categories) ? 'dgoff' : '')?>"><a href="#"><span><?php echo $category['name']; ?> (<?php echo $category['associated_words']; ?>)</span></a></li>
			<?php endforeach; ?>
		</ul>
	</div>
</div>

<script>
$('.btn').button();

$('.btn-diff').click(function() {
	var value = $(this).attr('value');
	$('#inp-diff').val(value);
});

startDrag = function() {
	$('#categorias li[class!=dgoff][class!=nav-header]').draggable({
		appendTo: 'body',		
		helper:	'clone'
	});
};

startRemoveItem = function() {
	$('.rmv-category').click(function() {
		var item = $(this).parents('li');
		var rmv_id = item.attr('id').replace('sel-cat-', '');
		item.remove();
		
		for(var i = 0, t = categories.length; i < t; i++) {
			if(categories[i] == rmv_id) {
				categories.splice(i, 1);
				if(categories.length == 0) {
					$('#palavras-categorias-escolhidas').html('<li class="dgoff" id="pce-alert">Arraste as categorias para esta área.</li>');
				}
				break;
			}
		}
		$('#category-' + rmv_id).draggable({disabled: false});
		startDrop();
		startDrag();
		updateInputCategories();
	});
}

startDrop = function() {
	$('#palavras-categorias-escolhidas').droppable({
		activeClass: 'ui-state-default',
		hoverClass: 'ui-state-hover',
		accept: ':not(.ui-sortable-helper)',
		drop: function(event, ui) {
			var cat_id = ui.draggable.attr('id').replace('category-', '');
			$('#pce-alert').remove();
			$(this).find('.placeholder').remove();
			//ui.draggable.addClass('dgoff');
			ui.draggable.draggable({disabled: true});			
			$('<li id="sel-cat-' + cat_id + '"><span>' + ui.draggable.text() + '</span><i class="rmv-category icon-remove pull-right"></i></li>').appendTo(this);
			categories.push(cat_id);
			updateInputCategories();
			startDrag();
			startRemoveItem();
		}
	}).sortable({
		items: "li[class!=dgoff]:not(.placeholder)",
		sort: function() {
			$(this).removeClass("ui-state-default");
		}
	});
};

categories = <?php echo json_encode($d_categories); ?>;

updateInputCategories = function() {
	$('#inp-categories').val(categories.join(','));
};

$(function() {	
	startDrag();
	startDrop();	
	startRemoveItem();
});
</script>

<?php require 'footer.php'; ?>
