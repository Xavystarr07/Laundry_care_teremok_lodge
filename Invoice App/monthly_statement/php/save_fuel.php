<?php
require_once __DIR__ . '/db.php';
header('Content-Type: application/json');
try {
    $id = (int)($_POST['id'] ?? 0); $days = (int)($_POST['days'] ?? 0); $rate = round((float)($_POST['rate'] ?? 0), 2);
    if ($id < 1 || $days < 0 || $days > 366 || $rate < 0) throw new Exception('Invalid fuel values.');
    $pdo->prepare('UPDATE teremok_periods SET fuel_days = ?, fuel_rate = ? WHERE id = ?')->execute([$days, $rate, $id]);
    echo json_encode(['ok' => true]);
} catch (Exception $e) {
    echo json_encode(['ok' => false, 'msg' => $e->getMessage()]);
}