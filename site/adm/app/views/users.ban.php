<?php require 'header.php'; ?>
<?php $data_bans_count = $data_bans->count(); ?>

<?php
function active_tab($slug) {
	if((isset($_GET['t']) && $slug == $_GET['t']) || (!isset($_GET['t']) && $slug == '1')) {
		echo 'active';
	}
}
?>

<div class="row-fluid">
	<h2 class="pull-left">Gerenciar banimento</h2>
	<a href="/adm/?m=users&a=edit&id=<?php echo $user_id; ?>" class="btn btn-primary pull-right"><i class="icon-user icon-white"></i> Voltar ao perfil</a>
</div>
<br/>
<div>
	<ul class="nav nav-tabs">
		<li class="<?php active_tab('1'); ?>"><a href="#tabs1-pane1" data-toggle="tab">Punição</a></li>
		<li class="<?php active_tab('2'); ?>"><a href="#tabs1-pane2" data-toggle="tab">Histórico de punições <span class="badge"><?php echo $data_bans_count; ?><span></a></li>
	</ul>
	<div class="tab-content">
		<div class="tab-pane <?php active_tab('1'); ?>" id="tabs1-pane1">
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
						<label class="control-label">Nick</label>
						<div class="controls">
							<input type="text" class="input-xlarge" disabled="disabled" value="<?php echo $nick; ?>">
						</div>
					</div>

					<div class="control-group">
						<label class="control-label">Puniçao</label>
						<div class="controls">
							<select name="punishment" class="input-xlarge">
								<?php foreach(self::$punishments as $p_val => $p_punishment): ?>
								<option value="<?php echo $p_val; ?>" <?php if($p_val === $f_punishment): ?>selected="selected"<?php endif; ?>><?php echo $p_punishment; ?></option>
								<?php endforeach; ?>
							</select>
						</div>
					</div>

					<div class="control-group">
						<label class="control-label" for="input03">Motivo</label>
						<div class="controls">
							<textarea class="input-xlarge" id="input03" name="reason"><?php echo $f_reason; ?></textarea>
							<p class="help-block">Motivo para a punição, será exibido ao usuário. <br/><i>Ex.: Jogando coletivamente. O jogo é individual e as respostas não devem ser compartilhadas.</i></p>
						</div>
					</div>

					<div class="control-group">
						<label class="control-label" for="input04">Observação</label>
						<div class="controls">
							<textarea class="input-xlarge" id="input04" name="note"><?php echo $f_note; ?></textarea>
							<p class="help-block">Observação sobre a punição, acessível somente para a equipe. <br/><i>Ex.: Estava jogando em dupla com Killer (fdfg54fd57fdd) na rodada #14545665fdfd.</i></p>
						</div>
					</div>
					
					<div class="form-actions">
						<button class="btn btn-primary" type="submit" name="submit" value="submit">Punir usuário</button>
						<a href="/adm/?m=users&a=edit&id=<?php echo $user_id; ?>" class="btn">Cancelar</a>
					</div>
				</fieldset>
			</form>
		</div>
		<div class="tab-pane <?php active_tab('2'); ?>" id="tabs1-pane2">
			<h3>Histórico de punições</h3>
			<br/>
			<?php if($data_bans_count == 0): ?>
			Não há registro de punições para este usuário
			<?php else: ?>
			<table class="table table-striped">
				<thead>
					<tr>
						<th width="50%">Motivação</th>
						<th width="10%">Ínicio</th>
						<th width="10%" width="10%">Término</th>
						<th width="10%">Status</th>
						<th  width="10%" colspan="2">Ações</th>
					</tr>
				</thead>
				<tbody>					
					<?php foreach($data_bans as $d_ban): ?>
					<?php 
					//var_dump($d_ban);
					$status = 'Cumprido';
					$status_cod = 1;
					if(isset($d_ban['disabled'])) {
						$status = '<span style="color:#940101;">Desativado</span>';
						$status_cod = 3;
					} else if(($d_ban['created_at'] + $d_ban['duration']) > time()) {
						$status = '<span style="color:#056919;">Ativo</span>';
						$status_cod = 2;
					}
					?>
					<tr>
						<td>
						<b>Motivo:</b> <?php echo $d_ban['reason']; ?>
						<?php if(isset($d_ban['note'])): ?>
						<br/>
						<b>Observação:</b> <?php echo $d_ban['note']; ?>
						<?php endif; ?>
						</td>
						<td><?php echo date('d/m/Y H:i:s', $d_ban['created_at']); ?></td>
						<td><?php echo date('d/m/Y H:i:s', $d_ban['created_at'] + $d_ban['duration']); ?></td>
						<td><b><?php echo $status; ?></b></td>
						<td><?php if($status_cod == 1): ?>Indisponível<?php else: ?><?php if($status_cod == 3): ?><a class="btn btn-success" href="?m=users&a=ban_status&id=<?php echo $d_ban['_id']; ?>&c=1">Ativar</a><?php else: ?><a class="btn btn-danger" href="?m=users&a=ban_status&id=<?php echo $d_ban['_id']; ?>&c=0">Desativar</a><?php endif; ?><?php endif; ?></td>
					</tr>
					<?php endforeach; ?>
				</tbody>
			</table>
			<?php endif; ?>
		</div>
	</div>
</div>

<br/><br/>

<?php require 'footer.php'; ?>
