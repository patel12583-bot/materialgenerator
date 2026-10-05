<?php
declare(strict_types=1);
require __DIR__.'/../bootstrap.php';$pdo=Database::connection();$pdo->beginTransaction();
try{$pdo->exec("INSERT INTO institutions(name,academic_year,minimum_attendance) VALUES('Noble Group of Institutes','2026-27',75)");$iid=(int)$pdo->lastInsertId();
$accounts=[['superadmin','Super Administrator','SUPER_ADMIN'],['admin','College Administrator','ADMIN'],['hod','Head of Department','HOD'],['faculty','Prof. Patel','FACULTY'],['student','Student User','STUDENT'],['parent','Parent User','PARENT']];
foreach($accounts as [$username,$name,$role]){$st=$pdo->prepare('INSERT INTO users(institution_id,username,name,role,password_hash,active) VALUES(?,?,?,?,?,1)');$st->execute([$iid,$username,$name,$role,password_hash('Noble@2026',PASSWORD_DEFAULT)]);}
$pdo->commit();echo "Seed complete. Initial password: Noble@2026
";}catch(Throwable $e){$pdo->rollBack();fwrite(STDERR,$e->getMessage()."
");exit(1);}