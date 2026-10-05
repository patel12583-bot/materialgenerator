<?php
declare(strict_types=1);
$GLOBALS['config']=require __DIR__.'/config/config.php';
date_default_timezone_set($GLOBALS['config']['timezone']);session_name($GLOBALS['config']['session_name']);session_set_cookie_params(['httponly'=>true,'secure'=>!empty($_SERVER['HTTPS'])&&$_SERVER['HTTPS']!=='off','samesite'=>'Lax']);session_start();
if (is_file(__DIR__.'/../vendor/autoload.php')) require __DIR__.'/../vendor/autoload.php';
require __DIR__.'/app/Database.php';require __DIR__.'/app/helpers.php';require __DIR__.'/app/auth.php';
