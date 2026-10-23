<?php
require_once __DIR__ . '/db.php';
header('Content-Type: application/json');
$a = $_POST['a'] ?? '';
try {
    switch ($a) {
        case 'list':
            echo json_encode(['ok' => true, 'rows' => $pdo->query('SELECT code, description, price, active FROM teremok_prices ORDER BY code')->fetchAll(PDO::FETCH_ASSOC)]);
            break;
        case 'save':
            $code = trim($_POST['code'] ?? ''); $desc = trim($_POST['description'] ?? ''); $price = round((float)($_POST['price'] ?? -1), 2);
            if ($desc === '' || $price < 0) throw new Exception('Enter a description and a valid price.');
            $o = $pdo->prepare('SELECT price FROM teremok_prices WHERE code = ?'); $o->execute([$code]);
            $old = $o->fetchColumn();
            if ($old === false) throw new Exception('Item not found.');
            $pdo->beginTransaction();
            $pdo->prepare('UPDATE teremok_prices SET description = ?, price = ? WHERE code = ?')->execute([$desc, $price, $code]);
            if (abs((float)$old - $price) > 0.001) $pdo->prepare('INSERT INTO teremok_price_history (code, old_price, new_price) VALUES (?, ?, ?)')->execute([$code, $old, $price]);
            $pdo->commit();
            echo json_encode(['ok' => true]);
            break;
        case 'add':
            $code = strtoupper(trim($_POST['code'] ?? '')); $desc = trim($_POST['description'] ?? ''); $price = round((float)($_POST['price'] ?? -1), 2);
            if (!preg_match('/^[A-Z0-9\/]{3,20}$/', $code)) throw new Exception('Code must be 3-20 letters/numbers.');
            if ($desc === '' || $price < 0) throw new Exception('Enter a description and a valid price.');
            $pdo->beginTransaction();
            $pdo->prepare('INSERT INTO teremok_prices (code, description, price) VALUES (?, ?, ?)')->execute([$code, $desc, $price]);
            $pdo->prepare('INSERT INTO teremok_price_history (code, old_price, new_price) VALUES (?, NULL, ?)')->execute([$code, $price]);
            $pdo->commit();
            echo json_encode(['ok' => true]);
            break;
        case 'toggle':
            $pdo->prepare('UPDATE teremok_prices SET active = NOT active WHERE code = ?')->execute([$_POST['code'] ?? '']);
            echo json_encode(['ok' => true]);
            break;
        case 'history':
            $s = $pdo->prepare('SELECT old_price, new_price, changed_at FROM teremok_price_history WHERE code = ? ORDER BY id DESC');
            $s->execute([$_POST['code'] ?? '']);
            echo json_encode(['ok' => true, 'rows' => $s->fetchAll(PDO::FETCH_ASSOC)]);
            break;
        default: throw new Exception('Unknown action.');
    }
} catch (Exception $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    $m = $e->getMessage();
    echo json_encode(['ok' => false, 'msg' => strpos($m, 'duplicate key') !== false ? 'That code already exists.' : $m]);
}