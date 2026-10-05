<?php
declare(strict_types=1);
require __DIR__.'/../config/bootstrap.php';
$u=auth_user();if($u){$pdo->prepare("INSERT INTO audit_logs(user_id,action,module,ip_address) VALUES(?,?,?,?)")->execute([$u['id'],'LOGOUT','AUTH',$_SERVER['REMOTE_ADDR']??null]);}
$_SESSION=[];session_destroy();redirect('/login.php');