<?php
declare(strict_types=1);
require __DIR__.'/../bootstrap.php';$pdo=Database::connection();$pdo->beginTransaction();
try{$pdo->exec("INSERT INTO institutions(name,academic_year,minimum_attendance) VALUES('Noble Group of Institutes','2026-27',75)");$iid=(int)$pdo->lastInsertId();
$pdo->prepare("INSERT INTO departments(institution_id,name,code) VALUES(?,?,?)")->execute([$iid,'Computer Science','CSE']);$dept=(int)$pdo->lastInsertId();
$pdo->prepare("INSERT INTO programs(department_id,code,name,duration_years,degree_type) VALUES(?,?,?,?,?)")->execute([$dept,'BCA','Bachelor of Computer Applications',3,'Bachelor']);$program=(int)$pdo->lastInsertId();
$pdo->prepare("INSERT INTO semesters(program_id,number,academic_year) VALUES(?,?,?)")->execute([$program,3,'2026-27']);$sem=(int)$pdo->lastInsertId();
$pdo->prepare("INSERT INTO divisions(semester_id,name,capacity) VALUES(?,?,?)")->execute([$sem,'A',60]);$div=(int)$pdo->lastInsertId();
$accounts=[['superadmin','Super Administrator','SUPER_ADMIN'],['admin','College Administrator','ADMIN'],['hod','Head of Department','HOD'],['faculty','Prof. Patel','FACULTY'],['student','Student User','STUDENT'],['parent','Parent User','PARENT']];
foreach($accounts as [$username,$name,$role]){$st=$pdo->prepare('INSERT INTO users(institution_id,username,name,role,password_hash,active) VALUES(?,?,?,?,?,1)');$st->execute([$iid,$username,$name,$role,password_hash('Noble@2026',PASSWORD_DEFAULT)]);}
$pdo->commit();echo "Seed complete. Initial password: Noble@2026
";}catch(Throwable $e){$pdo->rollBack();fwrite(STDERR,$e->getMessage()."
");exit(1);}