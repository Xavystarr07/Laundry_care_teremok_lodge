<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Price list — Laundry Care</title>
<link rel="stylesheet" href="monthly_statement/css/statement.css">
<link rel="stylesheet" href="html_css/manage.css">
</head>
<body>
<main class="wide">
    <nav class="nav2"><a class="back" href="invoice_generator.php">⟵ Back to invoice</a><a href="saved.php">Saved invoices</a><a href="monthly_statement/monthly_statement.php">Statements</a></nav>
    <h1>Price list <span>Changes apply to new invoices only</span></h1>
    <div class="tools">
        <input class="in" id="q" placeholder="Search code or description…" autocomplete="off">
        <button type="button" class="btn" id="addBtn">+ Add item</button>
    </div>
    <section class="panel" id="addBox" hidden>
        <div class="mrow3">
            <input class="in" id="aCode" placeholder="CODE" autocomplete="off">
            <input class="in" id="aDesc" placeholder="Description" autocomplete="off">
            <input class="in" id="aPrice" type="number" step="0.01" min="0" placeholder="Price">
            <button type="button" class="btn green" id="aGo">Add</button>
        </div>
    </section>
    <div class="panel"><table class="mt" id="tb"></table></div>
</main>
<div class="modal" id="hm" hidden><div class="mcard"><h2 id="hTitle"></h2><div id="hBody"></div><div class="mfoot"><button type="button" class="btn ghost" id="hClose">Close</button></div></div></div>
<script src="js/prices.js"></script>
</body>
</html>