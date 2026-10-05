<?php
declare(strict_types=1);
require __DIR__.'/../config/bootstrap.php';
foreach(['SUPER_ADMIN','ADMIN','HOD','FACULTY','STUDENT','PARENT'] as $role){$s=$pdo->prepare('INSERT IGNORE INTO roles(name) VALUES(?)');$s->execute([$role]);}
$roles=$pdo->query('SELECT id,name FROM roles')->fetchAll(PDO::FETCH_KEY_PAIR);
$hash=password_hash((string)(getenv('SEED_PASSWORD')?:'ChangeMe@2026'),PASSWORD_DEFAULT);
foreach([['superadmin','superadmin@noble.edu.in','SUPER_ADMIN'],['admin','admin@noble.edu.in','ADMIN']] as [$username,$email,$role]){$s=$pdo->prepare('INSERT INTO users(role_id,username,email,password_hash) VALUES(?,?,?,?) ON DUPLICATE KEY UPDATE role_id=VALUES(role_id),email=VALUES(email),active=1');$s->execute([$roles[$role],$username,$email,$hash]);}
foreach([['CSE','Computer Science & Engineering'],['IT','Information Technology'],['BCA','Bachelor of Computer Applications']] as $d){$s=$pdo->prepare('INSERT IGNORE INTO departments(code,name) VALUES(?,?)');$s->execute($d);}
echo "Seed complete. Delete this file after running it.";