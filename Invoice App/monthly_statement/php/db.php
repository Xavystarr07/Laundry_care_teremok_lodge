<?php
// ============================================================
//  monthly_statement/php/db.php — Monthly Statement DB connection
//  Reads credentials from Invoice App/config.php
//  DO NOT edit credentials here — edit config.php instead
// ============================================================

require_once __DIR__ . '/../../config.php';

try {
    $pdo = new PDO(
        "pgsql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME,
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
} catch (Exception $e) {
    die("❌ Database connection failed: " . $e->getMessage());
}
