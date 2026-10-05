<?php
declare(strict_types=1);
function require_login():void{if(empty($_SESSION['user']))redirect('/login.php');}
function user():?array{return $_SESSION['user']??null;}
function has_role(string|array $roles):bool{$u=user();return $u?in_array($u['role'],(array)$roles,true):false;}
function require_role(string|array $roles):void{require_login();if(!has_role($roles)){http_response_code(403);require __DIR__.'/../views/errors/403.php';exit;}}
function login_user(array $u):void{session_regenerate_id(true);$_SESSION['user']=['id'=>(int)$u['id'],'username'=>$u['username'],'name'=>$u['name'],'role'=>$u['role'],'department_id'=>$u['department_id']??null];}
function logout_user():void{$_SESSION=[];session_destroy();}
