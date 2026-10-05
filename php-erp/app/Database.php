<?php
declare(strict_types=1);
final class Database {
 private static ?PDO $pdo=null;
 public static function connection():PDO { if(self::$pdo)return self::$pdo; $c=$GLOBALS['config']['db']; $dsn="mysql:host={$c['host']};port={$c['port']};dbname={$c['name']};charset={$c['charset']}"; self::$pdo=new PDO($dsn,$c['user'],$c['pass'],[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC,PDO::ATTR_EMULATE_PREPARES=>false]); return self::$pdo; }
}
