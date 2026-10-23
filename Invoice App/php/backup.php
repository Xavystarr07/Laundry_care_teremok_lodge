<?php
// Daily backup of all Teremok tables → backups/teremok_DATE.json (command line only)
if (php_sapi_name() !== 'cli') { http_response_code(403); exit; }
require_once __DIR__ . '/db.php';
$dir = __DIR__ . '/../backups';
if (!is_dir($dir)) { mkdir($dir, 0775, true); file_put_contents("$dir/.htaccess", "Require all denied\n"); }
$data = [];
foreach (['teremok_periods', 'teremok_invoices', 'teremok_invoice_items', 'teremok_prices', 'teremok_price_history'] as $t) {
    $data[$t] = $pdo->query("SELECT * FROM $t ORDER BY 1")->fetchAll(PDO::FETCH_ASSOC);
}
$file = $dir . '/teremok_' . date('Y-m-d_His') . '.json';
file_put_contents($file, json_encode($data, JSON_PRETTY_PRINT));
$all = glob($dir . '/teremok_*.json'); sort($all);
foreach (array_slice($all, 0, max(0, count($all) - 30)) as $old) unlink($old);
echo "Backup saved: $file\n";