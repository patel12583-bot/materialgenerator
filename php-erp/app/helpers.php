<?php
declare(strict_types=1);
function e(mixed $v):string{return htmlspecialchars((string)$v,ENT_QUOTES,'UTF-8');}
function redirect(string $p):never{header('Location: '.$GLOBALS['config']['base_url'].$p);exit;}
function csrf_token():string{if(empty($_SESSION['_csrf']))$_SESSION['_csrf']=bin2hex(random_bytes(32));return $_SESSION['_csrf'];}
function verify_csrf(?string $t):void{if(!$t||!hash_equals($_SESSION['_csrf']??'',$t)){http_response_code(419);exit('Invalid request token.');}}
function flash(string $t,string $m):void{$_SESSION['_flash']=[$t,$m];}
function take_flash():?array{$f=$_SESSION['_flash']??null;unset($_SESSION['_flash']);return $f;}
