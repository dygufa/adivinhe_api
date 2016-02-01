<!DOCTYPE html>
<html>
<head>
	<title>Área restrita - Adivinhe</title>
	<link type="text/css" rel="stylesheet" href="media/css/bootstrap.min.css"/>
	<script src="media/js/jquery1.7.2.min.js" type="text/javascript"></script>
	<script src="media/js/jquery-ui-1.8.21.custom.min.js" type="text/javascript"></script>
	<script src="media/js/bootstrap.min.js" type="text/javascript"></script>	
	<style type="text/css">
	#site {
		width: 260px;
		margin: 200px auto;
	}
	button {
		width: 220px;
	}
	h1 {
		width: 200px;
		height: 69px;
		background: url(/adm/media/img/logo.png);
		text-indent: -9999px;
		margin: 0 auto 10px auto;
	}
	.alert {
		margin: 0 0 10px 0;
		text-align: center;
	}
	</style>
</head>
<body>
	<div id="site">
		<h1>Adivinhe</h1>
		<?php if(isset($login_error)): ?>
		<div class="alert alert-error"><?php echo $login_error; ?></div>
		<?php endif; ?>
		<form action="<?php echo $_SERVER['REQUEST_URI']; ?>" method="POST" class="well">
			<label>Nick:</label>
			<input type="text" name="nick">
			<br/>
			<label>Senha:</label>
			<input type="password" name="passwd">
			<br/>
			<button type="submit" name="login" value="entrar" class="btn btn-primary">Entrar!</button>
		</form>
	</div>
</body>
</html>
