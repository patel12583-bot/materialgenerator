<?php
declare(strict_types=1);
require __DIR__.'/../config/bootstrap.php';
redirect(auth_user()?'/dashboard.php':'/login.php');