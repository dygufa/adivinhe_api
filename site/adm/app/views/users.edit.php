<?php require 'header.php'; ?>

<div class="span8">
	<h2>Gerenciar usuário</h2>
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
	<form action="<?php echo $_SERVER['REQUEST_URI']; ?>" method="POST" class="form-horizontal">
		<fieldset>
			<div class="control-group">
				<label class="control-label" for="input01">Nome</label>
				<div class="controls">
					<input type="text" class="input-xlarge" id="input01" name="name" value="<?php echo $name; ?>">
				</div>
			</div>
			
			<div class="control-group">
				<label class="control-label" for="input02">Nick</label>
				<div class="controls">
					<input type="text" class="input-xlarge" id="input02" name="nick" value="<?php echo $nick; ?>">
				</div>
			</div>
			
			<div class="control-group">
				<label class="control-label">Registrado em</label>
				<div class="controls">
					<?php echo date('d/m/Y H:i:s', $created_at); ?>
				</div>
			</div>

			<div class="control-group">
				<label class="control-label">Último acesso</label>
				<div class="controls">
					<?php echo date('d/m/Y H:i:s', $last_visit); ?>
				</div>
			</div>

			<div class="control-group">
				<label class="control-label">Tipo de registro</label>
				<div class="controls">
					<?php echo self::$register_types[$register_type]; ?>
				</div>
			</div>

			<div class="control-group">
				<label class="control-label" for="input04">Email</label>
				<div class="controls">
					<input type="text" class="input-xlarge" id="input04" name="email" value="<?php echo $email; ?>">
				</div>
			</div>
			
			<div class="control-group">
				<label class="control-label">Email verificado</label>
				<div class="controls">
					<div class="btn-group" data-toggle="buttons-radio">
						<input type="hidden" name="email_checked" id="inp-ec" value="<?php echo $email_checked; ?>">
						<button type="button" class="btn-ec btn <?php if($email_checked == 1): ?>active<?php endif; ?>">Sim</button>
						<button type="button" class="btn-ec btn <?php if($email_checked == 0): ?>active<?php endif; ?>">Não</button>
					</div>
				</div>
			</div>

			<div class="control-group">
				<label class="control-label">Privilégio</label>
				<div class="controls">
					<?php if(isDygu()): // checa se é o dygu?>
						<select name="privilege" class="input-xlarge">
							<?php foreach(self::$privileges as $p_slug => $p_privilege): ?>
							<option value="<?php echo $p_slug; ?>" <?php if($privilege == $p_slug): ?>selected="selected"<?php endif; ?>><?php echo $p_privilege; ?></option>
							<?php endforeach; ?>
						</select>
					<?php else: ?>
						<input type="text" disabled="disabled" value="<?php echo self::$privileges[$privilege]; ?>">
						<p class="help-block">O privilégio só pode ser alterado pelo dygu.</p>
					<?php endif; ?>
				</div>
			</div>
			
			<div class="form-actions">
				<button class="btn btn-primary" type="submit" name="submit" value="submit">Editar usuário</button>
				<a href="/adm/?m=users" class="btn">Cancelar</a>
			</div>
		</fieldset>
	</form>
</div>
<div class="span4">
	<div class="well">
		<h4>Ultimos banimentos<?php if(($data_bans_count = $data_bans->count()) > 0): ?> <a href="?m=users&a=ban&id=<?php echo $user_id; ?>"><span class="badge"><?php echo $data_bans_count; ?><span></a><?php endif; ?></h4>
		<br/>
		<?php if($data_bans_count == 0): ?>
		Nunca foi banido.
		<br/>
		<?php else: ?>
		<ul>
		<?php foreach($data_bans as $ban): ?>
			<li><?php echo $ban['reason']; ?></li>
		<?php endforeach; ?>
		</ul>
		<?php endif; ?>
		<br/>
		<a href="?m=users&a=ban&id=<?php echo $user_id; ?>" class="btn btn-danger"><i class="icon-ban-circle icon-white"></i> Banir usuário</a>	
	</div>
	
	<div class="well">
		<h4>Últimas rodadas</h4>
		<br/>
		<?php if(($data_rounds_count = $data_rounds->count()) == 0): ?>
		Não há registros.
		<br/>
		<?php else: ?>

		<?php endif; ?>
	</div>

	<div class="well">
		<h4>Pontuação</h4>
		<br/>
		?
	</div>
</div>

<div class="modal hide" id="addCategory">
	<div class="modal-header">
		<button type="button" class="close" data-dismiss="modal">×</button>
		<h3>Adicionar categoria</h3>
	</div>
	<div class="modal-body">
		<form class="form-horizontal">
			<fieldset>
				<div class="control-group">
					<label class="control-label" for="input01">Categoria</label>
					<div class="controls">
						<input type="text" class="input-xlarge" id="input01">
						<p class="help-block">Escreva o nome da categoria desejada.</p>
					</div>
				</div>
			</fieldset>
		</form>
	</div>
	<div class="modal-footer">
		<a href="#" class="btn" data-dismiss="modal">Cancelar</a>
		<a href="#" class="btn btn-primary">Adicionar</a>
	</div>
</div>

<script>
$('.btn').button();

$('.btn-ec').click(function() {
	var value = $(this).attr('value');
	$('#inp-ec').val(value);
});
</script>

<?php require 'footer.php'; ?>
