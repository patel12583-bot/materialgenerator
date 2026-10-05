<?php
declare(strict_types=1);
$config=require __DIR__.'/config.php';
date_default_timezone_set($config['timezone']);
ini_set('session.use_strict_mode','1');ini_set('session.cookie_httponly','1');ini_set('session.cookie_samesite','Lax');
session_name($config['session_name']);session_start();
$dsn="mysql:host={$config['db']['host']};port={$config['db']['port']};dbname={$config['db']['name']};charset={$config['db']['charset']}";
try{$pdo=new PDO($dsn,$config['db']['user'],$config['db']['pass'],[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC,PDO::ATTR_EMULATE_PREPARES=>false]);}catch(Throwable $e){error_log($e->getMessage());http_response_code(503);exit('Database service is temporarily unavailable.');}
function e(?string $v):string{return htmlspecialchars($v??'',ENT_QUOTES,'UTF-8');}
function csrf_token():string{return $_SESSION['_csrf']??=bin2hex(random_bytes(32));}
function verify_csrf():void{if(!hash_equals($_SESSION['_csrf']??'',$_POST['_csrf']??'')){http_response_code(419);exit('Security validation failed.');}}
function redirect(string $p):never{header('Location: '.$p);exit;}
function auth_user():?array{return $_SESSION['auth_user']??null;}
function require_auth():array{$u=auth_user();if(!$u)redirect('/login.php');return $u;}
function require_role(array $roles):array{$u=require_auth();if(!in_array($u['role'],$roles,true)){http_response_code(403);exit('You are not authorized to access this page.');}return $u;}