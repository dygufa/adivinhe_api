<?php require 'header.php'; ?>

<div class="span12">
	<h2><?php if($add): ?>Adicionar<?php else: ?>Editar<?php endif; ?> artigo</h2>
	<br/>
	<?php if(isset($errors) && count($errors)): ?>	
	<div class="alert alert-error">
		<button class="close" data-dismiss="alert">×</button>
		<?php foreach($errors as $error): ?>
		<?php echo $error; ?>
		<br/>
		<?php endforeach; ?>
	</div>
	<?php endif; ?>
	<?php if(get('msg') == 15): ?>
	<div class="alert alert-success">
		<a class="close" data-dismiss="alert" href="#">×</a>
		Artigo adicionado com sucesso. <a href="/adm/?m=posts&a=add">Clique aqui</a> caso deseje adicionar outro.
	</div>
	<?php endif; ?>
	<form action="<?php echo $_SERVER['REQUEST_URI']; ?>" method="POST" class="form-horizontal">
		<fieldset>
			<div class="control-group">
				<label class="control-label" for="input01">Título</label>
				<div class="controls">
					<input type="text" class="input-xlarge" id="input01" name="title" value="<?php echo $title; ?>">
					<p class="help-block">Qualquer coisa!</p>
				</div>
			</div>

			<div class="control-group">
				<label class="control-label" for="input01">Autor</label>
				<div class="controls">
					<input type="text" class="input-xlarge" id="input01" disabled="disabled" value="<?php echo userInfo('nick'); ?>">
				</div>
			</div>

			<?php if(!$add): ?>
			<div class="control-group">
				<label class="control-label">Postado em</label>
				<div class="controls">
					<?php echo date('d/m/Y H:i:s', $created_at); ?>
				</div>
			</div>
			<?php endif; ?>

			<div class="control-group">
				<label class="control-label">Ativo</label>
				<div class="controls">
					<div class="btn-group" data-toggle="buttons-radio">
						<input type="hidden" name="available" id="inp-ec" value="<?php echo $available; ?>">
						<button type="button" class="btn-ec btn <?php if($available == 1): ?>active<?php endif; ?>">Sim</button>
						<button type="button" class="btn-ec btn <?php if($available == 0): ?>active<?php endif; ?>">Não</button>
					</div>
				</div>
			</div>

			<div class="control-group">
				<label class="control-label" for="input04">Artigo</label>
				<div class="controls">
					<textarea class="input-big" id="input04" name="article"><?php echo $article; ?></textarea>
				</div>
			</div>			
			
			<div class="form-actions">
				<button class="btn btn-primary" type="submit" name="submit" value="submit"><?php if($add): ?>Adicionar<?php else: ?>Editar<?php endif; ?> artigo</button>
				<a href="/adm/?m=posts" class="btn">Cancelar</a>
			</div>
		</fieldset>
	</form>
</div>

<script>
$('.btn').button();

$('.btn-ec').click(function() {
	var value = $(this).attr('value');
	$('#inp-ec').val(value);
});
</script>

<?php require 'footer.php'; ?>
