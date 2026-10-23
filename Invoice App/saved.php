<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Saved invoices — Laundry Care</title>
<link rel="stylesheet" href="monthly_statement/css/statement.css">
<link rel="stylesheet" href="html_css/manage.css">
<link rel="manifest" href="manifest.json">
<meta name="theme-color" content="#0f0f1a">
</head>
<body>
<main class="wide">
    <nav class="nav2"><a class="back" href="invoice_generator.php">⟵ Back to invoice</a><a href="monthly_statement/monthly_statement.php">Statements</a><a href="prices.php">Price list</a></nav>
    <h1>Saved invoices <span id="cnt">Loading…</span></h1>
    <div class="tools">
        <input class="in" id="q" placeholder="Search invoice no, date, amount or item…" autocomplete="off">
        <select class="in" id="per" style="width:auto"><option value="0">All periods</option></select>
    </div>
    <div class="panel"><table class="mt" id="tb"></table></div>
</main>
<div class="modal" id="m" hidden><div class="mcard"><h2 id="mTitle"></h2><div id="mBody"></div><div class="mfoot" id="mFoot"></div></div></div>
<script src="js/priceList.php"></script>
<script src="js/saved.js"></script>
<script>if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');</script>
</body>
</html>