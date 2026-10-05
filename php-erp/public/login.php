<?php
require __DIR__.'/../bootstrap.php';
if(user()) redirect('/dashboard.php');
$error=null;
if($_SERVER['REQUEST_METHOD']==='POST'){
 verify_csrf($_POST['_csrf']??null);
 $identity=trim((string)($_POST['identity']??''));$password=(string)($_POST['password']??'');
 if($identity===''||$password==='')$error='Enter your login ID and password.';
 else{ $pdo=Database::connection();$st=$pdo->prepare('SELECT id,username,name,role,department_id,password_hash,active FROM users WHERE username=:i OR email=:i OR student_id=:i OR faculty_id=:i LIMIT 1');$st->execute(['i'=>$identity]);$u=$st->fetch();
  if(!$u||!$u['active']||!password_verify($password,$u['password_hash']))$error='Invalid credentials or inactive account.';
  else{login_user($u);$pdo->prepare('UPDATE users SET last_login_at=NOW() WHERE id=?')->execute([$u['id']]);$pdo->prepare('INSERT INTO audit_logs(user_id,action,module,record_id,ip_address) VALUES(?,?,?,?,?)')->execute([$u['id'],'LOGIN','AUTH',$u['id'],$_SERVER['REMOTE_ADDR']??null]);redirect('/dashboard.php');}
 }
}
?><!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sign in · Noble ERP</title><link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet"><link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" rel="stylesheet"><link rel="stylesheet" href="/assets/css/app.css"></head><body class="login-page"><div class="login-card"><div class="brand-lockup"><div class="brand-mark">N</div><div><b>Noble</b><span>Group of Institutes</span></div></div><div class="eyebrow">COLLEGE ERP · SECURE ACCESS</div><h1>Welcome back.</h1><p class="muted">Sign in to your institutional workspace.</p><?php if($error):?><div class="alert alert-danger"><?=e($error)?></div><?php endif;?><form method="post" autocomplete="off"><input type="hidden" name="_csrf" value="<?=e(csrf_token())?>"><div class="mb-3"><label>Username / Student ID / Faculty ID / Email</label><input class="form-control form-control-lg" name="identity" required autofocus></div><div class="mb-3"><label>Password</label><input class="form-control form-control-lg" type="password" name="password" required></div><button class="btn btn-noble btn-lg w-100">Sign in <i class="bi bi-arrow-right"></i></button></form><div class="login-foot">Noble Group of Institutes · Academic Year 2026–27</div></div></body></html>