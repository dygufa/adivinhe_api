<?php require 'header.php'; ?>
<h2>Mensagem</h2>
<br/>
<p>
	<b>Enviada por:</b> <?php echo ($author_info['nick'] ? $author_info['nick'] : 'Desconhecido'); ?> (<?php echo ($author_info['email'] ? $author_info['email'] : 'Desconhecido'); ?>)
	<br/>
	<b>Assunto:</b> <?php echo self::$categories[$contact['subject']]; ?>
	<br/>
	<b>Em:</b> <?php echo date('d/m/y H:i:s', $contact['created_at']); ?>
	<br/>
	<br/>
	<?php echo $contact['content']; ?>
</p>

<?php require 'footer.php'; ?>
