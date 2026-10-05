<?php
declare(strict_types=1);
return [
 'app_name'=>'Noble Group of Institutes ERP',
 'timezone'=>'Asia/Kolkata',
 'session_name'=>'noble_erp_session',
 'db'=>[
  'host'=>getenv('DB_HOST')?:'127.0.0.1','port'=>getenv('DB_PORT')?:'3306',
  'name'=>getenv('DB_NAME')?:'noble_erp','user'=>getenv('DB_USER')?:'root',
  'pass'=>getenv('DB_PASS')?:'','charset'=>'utf8mb4'
 ],
];