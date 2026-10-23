<?php
require_once __DIR__ . '/../php/db.php';
header('Content-Type: application/javascript');
header('Cache-Control: no-store');
$r = $pdo->query('SELECT code, description, price FROM teremok_prices WHERE active ORDER BY code')->fetchAll(PDO::FETCH_ASSOC);
echo 'const priceList = ' . json_encode(array_map(fn($x) => ['code' => $x['code'], 'description' => $x['description'], 'price' => (float)$x['price']], $r)) . ';';