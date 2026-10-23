<?php
require_once 'php/db.php';
require_once 'php/queries.php';

function h($s) { return htmlspecialchars((string)$s); }
function d($s) { return $s ? date('d M Y', strtotime($s)) : ''; }

$periods = getPeriods($pdo);
$open = $cur = null;
$pid = (int)($_GET['p'] ?? 0);
foreach ($periods as $p) {
    if (!$p['is_closed']) $open = $p;
    if ($p['id'] == $pid) $cur = $p;
}
$openRows = $open ? getInvoices($pdo, $open['id']) : [];
$rows  = $cur ? getInvoices($pdo, $cur['id']) : [];
$total = array_sum(array_column($rows, 'Total'));
$end   = $cur ? ($cur['end_date'] ?: date('Y-m-d')) : '';
$data  = $cur ? ['name' => $cur['name'], 'start' => $cur['start_date'], 'end' => $end, 'rows' => $rows, 'total' => $total] : null;
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Statements — Laundry Care</title>
<link rel="stylesheet" href="css/statement.css">
<link rel="manifest" href="manifest.json">
<meta name="theme-color" content="#0f0f1a">
</head>
<body>

<?php if (!$cur): ?>
<main class="home">
    <a class="back" href="../invoice_generator.php">⟵ Back to invoice</a>
    <h1>Teremok Lodge <span>Statements</span></h1>

    <?php if ($open): ?>
    <p class="now">Current period: <b><?= h($open['name']) ?></b> · from <?= d($open['start_date']) ?> · <?= count($openRows) ?> invoice<?= count($openRows) == 1 ? '' : 's' ?> · <b>R <?= number_format(array_sum(array_column($openRows, 'Total')), 2) ?></b></p>
    <?php endif; ?>

    <div class="cards">
        <button type="button" class="card" data-panel="existing">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/></svg>
            <b>Show existing statement</b><small>Choose a month</small>
        </button>
        <?php if ($open): ?>
        <button type="button" class="card" data-panel="capture">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M9 16l2 2 4-4"/></svg>
            <b>Capture bill</b><small>Pick the cut-off date</small>
        </button>
        <?php endif; ?>
    </div>

    <section class="panel" id="existing" hidden>
        <?php foreach ($periods as $p): ?>
        <a class="prow" href="?p=<?= (int)$p['id'] ?>">
            <b><?= h($p['name']) ?></b>
            <span><?= d($p['start_date']) ?> — <?= $p['end_date'] ? d($p['end_date']) : 'ongoing' ?></span>
            <em class="chip <?= $p['is_closed'] ? 'closed' : 'open' ?>"><?= $p['is_closed'] ? 'Closed' : 'Open' ?></em>
        </a>
        <?php endforeach; ?>
    </section>

    <?php if ($open): ?>
    <section class="panel" id="capture" hidden>
        <div class="cap">
            <div>
                <p class="lbl">Period starts</p>
                <p class="big"><?= $open['start_date'] ? d($open['start_date']) : 'First invoice' ?></p>
                <p class="lbl">Cut-off date</p>
                <p class="big" id="cutLbl">Pick a date</p>
                <div id="capInfo"></div>
                <button type="button" class="btn" id="capGo" disabled style="margin-top:16px">Close period &amp; start next</button>
            </div>
            <div id="cal"></div>
        </div>
    </section>
    <script>
    window.CAP = <?= json_encode([
        'start' => $open['start_date'],
        'rows'  => array_map(fn($r) => ['d' => $r['DateReceived'], 't' => (float)$r['Total']], $openRows)
    ], JSON_HEX_TAG) ?>;
    </script>
    <?php endif; ?>
</main>
<script src="js/statement.js"></script>

<?php else: ?>
<main class="view">
    <div class="bar noprint">
        <a class="btn ghost" href="monthly_statement.php">⟵ Statements</a>
        <a class="btn ghost" href="../invoice_generator.php">Invoice</a>
        <?php if (!$cur['is_closed']): ?><em class="chip open">Period still open</em><?php endif; ?>
        <span class="sp"></span>
        <button type="button" class="act pdf" onclick="window.print()">
            <i><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12m0 0-4-4m4 4 4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/></svg></i>
            Print / Save PDF
        </button>
        
        <button type="button" class="act mail" id="xlMail">
            <i><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg></i>
            Email
        </button>
        <button type="button" class="act wa" id="xlWa">
            <i><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.7 7L4 20l1.1-4.9A8 8 0 1 1 21 12z"/></svg></i>
            WhatsApp
        </button>
        <button type="button" class="act xls" id="xl">
            <i><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M3 15h18M9 4v16"/></svg></i>
            Download Excel
        </button>
    </div>

    <article id="paper">
        <div class="bar2"></div>
        <header class="ph">
            <div class="brand">
                <h1>Laundry Care</h1>
                <div class="tag">A FRESH START IN EVERY WASH</div>
                <p>2 Tottenham Road<br>Parkgate<br>Cornubia</p>
            </div>
            <div class="contact">
                <div class="web">www.laundrycare.co.za</div>
                <div>donovanmark14@gmail.com</div>
                <div>laundry_care@outlook.com</div>
                <div>062 283 9374</div>
                <div>069 780 0340</div>
            </div>
        </header>

        <div class="title">
            <h2>Statement</h2>
            <div class="pno"><span>Month</span><strong><?= h($cur['name']) ?></strong></div>
        </div>

        <div class="meta">
            <div><span>To</span><strong>Teremok Lodge</strong><em>49 Marine Dr, Umhlanga, 4319</em></div>
            <div><span>Period</span><strong><?= d($cur['start_date']) ?> — <?= d($end) ?></strong></div>
            <div><span>Invoices</span><strong><?= count($rows) ?></strong></div>
        </div>

        <table>
            <thead><tr><th>Date</th><th>Invoice No</th><th class="n">Amount</th></tr></thead>
            <tbody>
            <?php if ($rows): foreach ($rows as $r): ?>
                <tr>
                    <td><?= date('d/m/Y', strtotime($r['DateReceived'])) ?></td>
                    <td><?= h($r['InvoiceNumber']) ?></td>
                    <td class="n">R <?= number_format($r['Total'], 2) ?></td>
                </tr>
            <?php endforeach; else: ?>
                <tr><td colspan="3">No invoices in this period.</td></tr>
            <?php endif; ?>
            </tbody>
        </table>

        <div class="tot"><div class="tbox">
            <div class="trow"><span>Total invoices</span><span><?= count($rows) ?></span></div>
            <div class="tgrand"><span>Grand Total</span><strong>R <?= number_format($total, 2) ?></strong></div>
        </div></div>

        <div class="bank">
            <b>Banking details</b>
            FNB · Laundry Care · Cheque<br>Account: 63179920872
        </div>
        <div class="foot"><strong>Thank you for your business</strong></div>
    </article>
</main>
<script>window.STMT = <?= json_encode($data, JSON_HEX_TAG) ?>;</script>
<script src="https://cdn.jsdelivr.net/npm/exceljs@4.4.0/dist/exceljs.min.js"></script>
<script src="js/excel.js"></script>
<?php endif; ?>

<script>if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');</script>
</body>
</html>