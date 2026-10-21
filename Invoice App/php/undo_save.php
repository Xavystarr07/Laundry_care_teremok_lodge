<?php
// Deletes ONLY the rows saved in this session's last save, within 30 seconds.
session_start();
header('Content-Type: application/json');
require_once __DIR__ . '/../config.php';

$ls = $_SESSION['last_save'] ?? null;
if ($_SERVER['REQUEST_METHOD'] !== 'POST' || !$ls || empty($ls['ids']) || time() - $ls['time'] > 30) {
    echo json_encode(['ok' => false, 'msg' => 'Too late to undo. This save can no longer be undone.']);
    exit;
}

try {
    $pdo = new PDO("pgsql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME,
        DB_USER, DB_PASS, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);

    $ids = array_map('intval', $ls['ids']);
    $ph  = implode(',', array_fill(0, count($ids), '?'));
    $del = $pdo->prepare("DELETE FROM teremok_invoices WHERE id IN ($ph)");
    $del->execute($ids);
} catch (Exception $e) {
    error_log('undo_save: ' . $e->getMessage());
    echo json_encode(['ok' => false, 'msg' => 'Could not undo. Nothing was changed.']);
    exit;
}
unset($_SESSION['last_save']);
echo json_encode(['ok' => true, 'redirect' => 'invoice_generator.php']);