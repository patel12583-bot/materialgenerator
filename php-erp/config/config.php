<?php
return [
    'app_name' => 'Noble Group of Institutes', 'base_url'=>'', 'timezone'=>'Asia/Kolkata',
    'db'=>['host'=>getenv('DB_HOST')?:'127.0.0.1','port'=>getenv('DB_PORT')?:'3306','name'=>getenv('DB_NAME')?:'noble_erp','user'=>getenv('DB_USER')?:'root','pass'=>getenv('DB_PASS')?:'','charset'=>'utf8mb4'],
    'session_name'=>'noble_erp_session',
];
