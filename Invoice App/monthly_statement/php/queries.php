<?php
function getPeriods($pdo) {
    return $pdo->query('SELECT id, name, start_date, end_date, is_closed, fuel_days, fuel_rate FROM teremok_periods ORDER BY id DESC')->fetchAll(PDO::FETCH_ASSOC);
}
function getInvoices($pdo, $pid) {
    $s = $pdo->prepare('SELECT "InvoiceNumber", "DateReceived", "Total" FROM teremok_invoices WHERE period_id = ? ORDER BY "DateReceived", "InvoiceNumber"');
    $s->execute([$pid]);
    return $s->fetchAll(PDO::FETCH_ASSOC);
}