<?php
require_once __DIR__ . '/db.php';
header('Content-Type: application/json');
$a = $_POST['a'] ?? '';

function checkOpen($pdo, $id) {
    $s = $pdo->prepare('SELECT p.is_closed FROM teremok_invoices i JOIN teremok_periods p ON p.id = i.period_id WHERE i.id = ?');
    $s->execute([$id]);
    $r = $s->fetch(PDO::FETCH_ASSOC);
    if (!$r) throw new Exception('Invoice not found.');
    if ($r['is_closed']) throw new Exception('This invoice is in a closed period and cannot be changed.');
}

try {
    switch ($a) {
        case 'list':
            $w = []; $p = [];
            $per = (int)($_POST['per'] ?? 0); $q = trim($_POST['q'] ?? '');
            if ($per) { $w[] = 'i.period_id = ?'; $p[] = $per; }
            if ($q !== '') {
                $w[] = '(CAST(i."InvoiceNumber" AS TEXT) LIKE ? OR TO_CHAR(i."DateReceived", \'YYYY-MM-DD\') LIKE ? OR CAST(i."Total" AS TEXT) LIKE ? OR EXISTS (SELECT 1 FROM teremok_invoice_items t WHERE t.invoice_id = i.id AND (t."Code" ILIKE ? OR t."Description" ILIKE ?)))';
                array_push($p, "%$q%", "%$q%", "%$q%", "%$q%", "%$q%");
            }
            $sql = 'SELECT i.id, i."InvoiceNumber" AS num, i."DateReceived" AS dt, i."Total" AS total, p.name AS period, p.is_closed AS closed,
                    (SELECT COUNT(*) FROM teremok_invoice_items t WHERE t.invoice_id = i.id) AS items
                    FROM teremok_invoices i JOIN teremok_periods p ON p.id = i.period_id'
                 . ($w ? ' WHERE ' . implode(' AND ', $w) : '') . ' ORDER BY i."InvoiceNumber" DESC LIMIT 300';
            $s = $pdo->prepare($sql); $s->execute($p);
            echo json_encode(['ok' => true, 'rows' => $s->fetchAll(PDO::FETCH_ASSOC),
                'periods' => $pdo->query('SELECT id, name FROM teremok_periods ORDER BY id DESC')->fetchAll(PDO::FETCH_ASSOC)]);
            break;

        case 'get':
            $s = $pdo->prepare('SELECT i.id, i."InvoiceNumber" AS num, i."DateReceived" AS dt, p.is_closed AS closed FROM teremok_invoices i JOIN teremok_periods p ON p.id = i.period_id WHERE i.id = ?');
            $s->execute([(int)($_POST['id'] ?? 0)]);
            $inv = $s->fetch(PDO::FETCH_ASSOC);
            if (!$inv) throw new Exception('Invoice not found.');
            $t = $pdo->prepare('SELECT "Code" AS code, "Description" AS description, "Price" AS price, "Quantity" AS qty FROM teremok_invoice_items WHERE invoice_id = ? ORDER BY id');
            $t->execute([$inv['id']]);
            echo json_encode(['ok' => true, 'inv' => $inv, 'items' => $t->fetchAll(PDO::FETCH_ASSOC)]);
            break;

        case 'update':
            $id = (int)($_POST['id'] ?? 0); checkOpen($pdo, $id);
            $num = (int)preg_replace('/\D/', '', $_POST['num'] ?? '');
            $date = $_POST['date'] ?? '';
            $items = json_decode($_POST['items'] ?? '[]', true) ?: [];
            if ($num < 1 || $num > 50000) throw new Exception('Invoice number must be between 1 and 50000.');
            if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) throw new Exception('Pick a valid date.');
            if (!$items) throw new Exception('An invoice needs at least one item.');
            $c = $pdo->prepare('SELECT COUNT(*) FROM teremok_invoices WHERE "InvoiceNumber" = ? AND id <> ?');
            $c->execute([$num, $id]);
            if ($c->fetchColumn() > 0) throw new Exception("Invoice #$num already exists.");
            $total = 0;
            foreach ($items as &$it) {
                $it['qty'] = max(1, (int)$it['qty']); $it['price'] = round((float)$it['price'], 2);
                $it['line'] = round($it['price'] * $it['qty'], 2); $total += $it['line'];
            }
            unset($it);
            $pdo->beginTransaction();
            $pdo->prepare('UPDATE teremok_invoices SET "InvoiceNumber" = ?, "DateReceived" = ?, "Total" = ? WHERE id = ?')->execute([$num, $date, round($total, 2), $id]);
            $pdo->prepare('DELETE FROM teremok_invoice_items WHERE invoice_id = ?')->execute([$id]);
            $ins = $pdo->prepare('INSERT INTO teremok_invoice_items (invoice_id, "Code", "Description", "Price", "Quantity", "LineTotal") VALUES (?,?,?,?,?,?)');
            foreach ($items as $it) $ins->execute([$id, $it['code'], $it['description'], $it['price'], $it['qty'], $it['line']]);
            $pdo->commit();
            echo json_encode(['ok' => true]);
            break;

        case 'delete':
            $id = (int)($_POST['id'] ?? 0); checkOpen($pdo, $id);
            $pdo->prepare('DELETE FROM teremok_invoices WHERE id = ?')->execute([$id]);
            echo json_encode(['ok' => true]);
            break;

        default: throw new Exception('Unknown action.');
    }
} catch (Exception $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    echo json_encode(['ok' => false, 'msg' => $e->getMessage()]);
}