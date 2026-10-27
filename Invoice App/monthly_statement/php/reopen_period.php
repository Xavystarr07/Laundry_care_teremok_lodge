<?php
require_once __DIR__ . '/db.php';
header('Content-Type: application/json');
try {
    $id = (int)($_POST['id'] ?? 0);
    $pdo->beginTransaction();
    $last = $pdo->query('SELECT id FROM teremok_periods WHERE is_closed = TRUE ORDER BY id DESC LIMIT 1 FOR UPDATE')->fetchColumn();
    if (!$last || (int)$last !== $id) throw new Exception('Only the most recent closed statement can be reopened.');
    $open = $pdo->query('SELECT id FROM teremok_periods WHERE is_closed = FALSE ORDER BY id LIMIT 1')->fetchColumn();
    if ($open) {
        $pdo->prepare('UPDATE teremok_invoices SET period_id = ? WHERE period_id = ?')->execute([$id, $open]);
        $pdo->prepare('DELETE FROM teremok_periods WHERE id = ?')->execute([$open]);
    }
    $pdo->prepare('UPDATE teremok_periods SET is_closed = FALSE, closed_at = NULL, end_date = NULL WHERE id = ?')->execute([$id]);
    $pdo->commit();
    echo json_encode(['ok' => true]);
} catch (Exception $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    echo json_encode(['ok' => false, 'msg' => $e->getMessage()]);
}