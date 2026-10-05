# Noble Group of Institutes — College ERP

Production PHP/MySQL rebuild requested for the final ERP.

Stack: PHP 8.2+, MySQL 8+, PDO, Bootstrap 5, Bootstrap Icons, Chart.js, Dompdf and PhpSpreadsheet.

Setup:
1. Create a MySQL 8 database.
2. Import database/schema.sql.
3. Run database/seed.sql.
4. Run database/seed.php once with PHP CLI to create hashed role accounts.
5. Configure config/config.php.
6. Run composer install from php-erp.
7. Point the web server document root at php-erp/public.

Dashboard figures and module data are database-backed; the rebuild does not use fake UI data.
