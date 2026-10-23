<?php
require_once __DIR__ . '/db.php';
header('Content-Type: application/json');
$end = $_POST['end'] ?? '';
try {
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $end)) throw new Exception('Pick a cut-off date.');
    $pdo->beginTransaction();
    $p = $pdo->query('SELECT id, start_date FROM teremok_periods WHERE is_closed = FALSE ORDER BY id LIMIT 1 FOR UPDATE')->fetch(PDO::FETCH_ASSOC);
    if (!$p) throw new Exception('No open period.');
    if ($end < $p['start_date'] || $end > date('Y-m-d')) throw new Exception('Date must be between the period start and today.');
    $next = (new DateTime($end))->modify('+1 day')->format('Y-m-d');
    $name = (new DateTime($end))->modify('first day of next month')->format('F Y');
    $pdo->prepare('UPDATE teremok_periods SET is_closed = TRUE, closed_at = now(), end_date = ? WHERE id = ?')->execute([$end, $p['id']]);
    $n = $pdo->prepare('INSERT INTO teremok_periods (name, start_date) VALUES (?, ?) RETURNING id');
    $n->execute([$name, $next]);
    $nid = $n->fetchColumn();
    $pdo->prepare('UPDATE teremok_invoices SET period_id = ? WHERE period_id = ? AND "DateReceived" > ?')->execute([$nid, $p['id'], $end]);
    $pdo->commit();
    echo json_encode(['ok' => true, 'id' => $p['id']]);
} catch (Exception $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    echo json_encode(['ok' => false, 'msg' => $e->getMessage()]);
}