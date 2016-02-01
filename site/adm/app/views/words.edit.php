<?php require 'header.php'; ?>

<?php
$convert_diff = array(1 => 'Muito fácil', 2 => 'Fácil', 3 => 'Mediana', 4 => 'Difícil', 5 => 'Muito difícil');
$category_names = array();
foreach($categories as $category) {
	$category_names[(string)$category['_id']] = $category['name'];
}
?>
<div class="span8">
	<h2><?php if($add): ?>Adicionar<?php else: ?>Editar<?php endif; ?> palavra</h2>
	<br/>
	<?php if($add): ?>
	<div class="alert alert-info">
		<a class="close" data-dismiss="alert" href="#">×</a>
		<b>Atenção!</b>
		<ul>
			<li>Se a palavra for genérica: adicionar obrigatoriamente na categoria Geral.</li>
			<li>Avaliar todas possibilidades de desenho ao definir a dificuldade, em casos estratosféricos, e tão somente nestes casos, definir a dificuldade para "Muito díficil". 
		</ul>
	</div>
	<?php endif; ?>
	<?php if(get('msg') == 15): ?>
	<div class="alert alert-success">
		<a class="close" data-dismiss="alert" href="#">×</a>
		Palavra adicionada com sucesso. <a href="/adm/?m=words&a=add">Clique aqui</a> caso deseje adicionar outra.
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
				<label class="control-label" for="word">Palavra</label>
				<div class="controls">
					<input type="text" class="input-xlarge" id="word" name="word" value="<?php if (isset($d_word)) { echo $d_word; } ?>"> 
					<p class="help-block">Escreva a palavra ou expressão desejada.</p>
				</div>
			</div>
				
			<div class="control-group">
				<label class="control-label">Dificuldade</label>
				<div class="controls">
					<div class="btn-group" data-toggle="buttons-radio"> 
						<input type="hidden" name="difficulty" id="inp-diff" value="<?php echo $d_diff; ?>">
						<?php foreach($convert_diff as $btn_id => $btn_diff): ?>
						<button type="button" value="<?php echo $btn_id; ?>" class="btn-diff btn <?php echo ($d_diff == $btn_id ? 'active' : ''); ?>"><?php echo $btn_diff; ?></button>
						<?php endforeach; ?>
					</div>
					<p class="help-block">Escolha a dificuldade da palavra.</p>
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
				<button class="btn btn-primary" type="submit" name="submit" value="submit"><?php if($add): ?>Adicionar<?php else: ?>Editar<?php endif; ?> palavra</button>
				<a href="/adm/?m=words" class="btn">Cancelar</a>
			</div>
		</fieldset>
	</form>
</div>
<div class="span4">	
	<div class="well">
		<a data-toggle="modal" href="#addCategory" class="btn btn-success"><i class="icon-plus icon-white"></i> Adicionar categoria</a>
		<br/><br/>
		<ul class="nav nav-pills nav-stacked" id="categorias">
			<li class="nav-header">Categorias</li>
			<?php foreach($categories as $category): ?>
			<li id="category-<?php echo $category['_id']; ?>" class="<?php echo (in_array((string)$category['_id'], $d_categories) ? 'dgoff' : '')?>"><a href="#"><span><?php echo $category['name']; ?> (<?php echo $category['associated_words']; ?>)</span><i class="pull-right edt-category icon-pencil"></i></a></li>
			<?php endforeach; ?>
		</ul>
		<br/>
		<a data-toggle="modal" href="#addCategory" class="btn btn-success"><i class="icon-plus icon-white"></i> Adicionar categoria</a>
	</div>
</div>

<div class="modal hide" id="addCategory">
	<div class="modal-header">
		<button type="button" class="close" data-dismiss="modal">×</button>
		<h3>Adicionar categoria</h3>
	</div>
	<div class="modal-body">
		<form class="form-horizontal" id="form-add-category">
			<fieldset>
				<div class="control-group">
					<label class="control-label" for="input01">Categoria</label>
					<div class="controls">
						<input type="text" class="input-xlarge" id="inp-category">
						<p class="help-block">Escreva o nome da categoria desejada.</p>
					</div>
				</div>
			</fieldset>
		</form>
	</div>
	<div class="modal-footer">
		<a href="#" class="btn" type="button" data-dismiss="modal">Cancelar</a>
		<a href="#" id="btn-add-category"  type="submit" class="btn btn-primary">Adicionar</a>
	</div>
</div>

<div class="modal hide" id="editCategory">
	<div class="modal-header">
		<button type="button" class="close" data-dismiss="modal">×</button>
		<h3>Editar categoria</h3>
	</div>
	<div class="modal-body">
		<form class="form-horizontal" id="form-edit-category">
			<fieldset>
				<div class="control-group">
					<label class="control-label">Categoria</label>
					<div class="controls">
						<input type="hidden" id="id-edit-category">
						<input type="text" class="input-xlarge" id="inp-edit-category">
						<p class="help-block">Escreva o novo nome para essa categoria.</p>
					</div>
				</div>
			</fieldset>
		</form>
	</div>
	<div class="modal-footer">
		<a href="#" class="btn" type="button" data-dismiss="modal">Cancelar</a>
		<a href="#" id="btn-edit-category"  type="submit" class="btn btn-primary">Editar</a>
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

addCategory = function() {
	var category = $('#inp-category').val();
	$.ajax({
		url: '/adm/?m=words&a=addcategory',
		type:	'POST',
		dataType:	'json',
		data:	{'category': category},
		success:	function(rtn) {
			if(rtn[0] == false) {
				alert(rtn[1]);
			} else {
				$('#categorias').append('<li id="category-' + rtn[0] + '"><a href="#">' + rtn[1] + '</a></li>');
				$('#addCategory').modal('hide');
				startDrag();
			}
			$('#inp-category').val('');
		}
	});
	
	return false;
};

$('#form-add-category').submit(addCategory);
$('#btn-add-category').click(addCategory);

$('.edt-category').live('click', function() {
	var item = $(this).parents('li'),
		id_cat = item.attr('id').replace('category-', ''),
		name_cat = item.find('a').text();
	$('#inp-edit-category').val(name_cat);
	$('#id-edit-category').val(id_cat);
	$('#editCategory').modal('show');
	return false;
});

editCategory = function() {
	var category_name = $('#inp-edit-category').val(),
		category_id = $('#id-edit-category').val();
	$.ajax({
		url: '/adm/?m=words&a=editcategory',
		type:	'POST',
		dataType:	'json',
		data:	{'id_category': category_id, 'name_category': category_name},
		success:	function(rtn) {
			if(rtn[0] == false) {
				alert(rtn[1]);
			} else {
				$('#category-' + category_id + ' span, #sel-cat-' + category_id + ' span').text(rtn[1]);
				$('#editCategory').modal('hide');
			}
		}
	});
	
	return false;
}

$('#form-edit-category').submit(editCategory);
$('#btn-edit-category').click(editCategory);
</script>

<?php require 'footer.php'; ?>
