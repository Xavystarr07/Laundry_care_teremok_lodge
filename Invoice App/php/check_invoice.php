<?php
// php/check_invoice.php — Returns JSON: exists true/false for a given invoice number

require_once __DIR__ . '/../config.php';

header('Content-Type: application/json');

$raw    = trim($_GET['invoice_number'] ?? '');
$number = intval(preg_replace('/\D/', '', $raw));

if ($number < 1 || $number > 50000) {
    echo json_encode(['exists' => false]);
    exit;
}

try {
    $dsn = "pgsql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME;
    $pdo = new PDO($dsn, DB_USER, DB_PASS, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);

    $stmt = $pdo->prepare('SELECT COUNT(*) FROM invoices WHERE "InvoiceNumber" = :num');
    $stmt->execute([':num' => $number]);
    $count = (int) $stmt->fetchColumn();

    echo json_encode(['exists' => $count > 0]);

} catch (Exception $e) {
    echo json_encode(['exists' => false, 'error' => $e->getMessage()]);
}
