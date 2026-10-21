<?php
// ============================================================
//  monthly_statement.php — Main entry point
//  Loads all includes and renders the correct statement section
//  Add new statement sections at the bottom of <body>
// ============================================================

session_start();

require_once 'php/db.php';
require_once 'php/actions.php';
require_once 'php/queries.php';

handlePostActions();

$action    = $_SESSION['action']    ?? '';
$hotelName = $_SESSION['hotelName'] ?? '';
$startDate = $_SESSION['startDate'] ?? '';
$endDate   = $_SESSION['endDate']   ?? '';

$unitData      = null;
$monthlyData   = null;
$weeklyData    = null;
$weeklyAllData = null;

if ($action === 'viewStatement' && $hotelName) {
    $unitData = getUnitStatement($pdo, $hotelName);
}
if ($action === 'monthlyStatement') {
    $monthlyData = getMonthlyStatement($pdo);
}
if ($action === 'weeklyStatement' && $hotelName && $startDate && $endDate) {
    $weeklyData = getWeeklyStatement($pdo, $hotelName, $startDate, $endDate);
}
if ($action === 'weeklyAll' && $startDate && $endDate) {
    $weeklyAllData = getWeeklyAllStatement($pdo, $startDate, $endDate);
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Monthly Statement — Laundry Care</title>

    <!-- ── CSS files — edit individual files for each concern ── -->
    <link rel="stylesheet" href="css/base.css">       <!-- body, fonts, headings     -->
    <link rel="stylesheet" href="css/header.css">     <!-- top header layout         -->
    <link rel="stylesheet" href="css/table.css">      <!-- statement table           -->
    <link rel="stylesheet" href="css/buttons.css">    <!-- all buttons               -->
    <link rel="stylesheet" href="css/forms.css">      <!-- dropdowns, date inputs    -->
    <link rel="stylesheet" href="css/print.css">
    <link rel="stylesheet" href="css/statement_buttons.css">
    <style>
        #db-toast {
            position: fixed; top: 20px; right: 20px;
            background: #2ecc71; color: white;
            padding: 12px 24px; border-radius: 10px;
            font-weight: bold; font-size: 15px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            z-index: 9999; opacity: 1;
            transition: opacity 1s ease;
        }
    </style>      <!-- print-only styles         -->
</head>
<body>

    <!-- Business header: edit partials/header.html -->
    <?php include 'partials/header.html'; ?>

    <!-- Hotel form + buttons: edit partials/hotel_form.html -->
    <?php include 'partials/hotel_form.html'; ?>


    <!-- ══════════════════════════════════════════════════════
         UNIT STATEMENT — selected hotel, grouped by unit
         ══════════════════════════════════════════════════════ -->
    <?php if ($action === 'viewStatement' && $unitData): ?>
        <table id="statementTable">
            <thead>
                <tr>
                    <th>Hotel Name</th>
                    <th>Hotel Unit</th>
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>
                <?php if (!empty($unitData['rows'])): ?>
                    <?php foreach ($unitData['rows'] as $row): ?>
                        <tr>
                            <td><?= htmlspecialchars($hotelName) ?></td>
                            <td><?= htmlspecialchars($row['HotelNumber']) ?></td>
                            <td>R <?= number_format($row['UnitTotal'], 2) ?></td>
                        </tr>
                    <?php endforeach; ?>
                    <tr class="grand-total-row">
                        <td><strong>Grand Total</strong></td>
                        <td></td>
                        <td><strong>R <?= number_format($unitData['total'], 2) ?></strong></td>
                    </tr>
                    <?php include 'partials/banking.html'; ?>
                <?php else: ?>
                    <tr><td colspan="3">No invoices found for this hotel.</td></tr>
                <?php endif; ?>
            </tbody>
        </table>
        <input type="button" value="🖨️ Print Statement" onclick="printStatement()" class="print-btn">
    <?php endif; ?>


    <!-- ══════════════════════════════════════════════════════
         MONTHLY STATEMENT — all hotels grouped
         ══════════════════════════════════════════════════════ -->
    <?php if ($action === 'monthlyStatement' && $monthlyData): ?>
        <table id="statementTable">
            <thead>
                <tr>
                    <th>Hotel Name</th>
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>
                <?php if (!empty($monthlyData['rows'])): ?>
                    <?php foreach ($monthlyData['rows'] as $row): ?>
                        <tr>
                            <td><?= htmlspecialchars($row['HotelName']) ?></td>
                            <td>R <?= number_format($row['HotelTotal'], 2) ?></td>
                        </tr>
                    <?php endforeach; ?>

                    <!-- Hidden base total value for grandTotal.js to read -->
                    <tr style="display:none;">
                        <td id="baseTotalValue" data-value="<?= $monthlyData['total'] ?>"></td>
                    </tr>

                    <!-- Fuel Levy Row 
                    <tr id="fuelCostRow">
                        <td><strong>Standard Fuel Levy</strong></td>
                        <td>R <input type="number" id="fuelCost" value="0.00" step="0.01" oninput="updateGrandTotal()"></td>
                    </tr> -->

                    <!-- Grand Total Row (updated by grandTotal.js) -->
                    <tr class="grand-total-row">
                        <td><strong>Grand Total</strong></td>
                        <td id="grandTotalCell"><strong>R <?= number_format($monthlyData['total'], 2) ?></strong></td>
                    </tr>

                    <?php include 'partials/banking.html'; ?>
                <?php else: ?>
                    <tr><td colspan="2">No invoices found.</td></tr>
                <?php endif; ?>
            </tbody>
        </table>
        <input type="button" value="🖨️ Print Statement" onclick="printStatement()" class="print-btn">
    <?php endif; ?>


    <!-- ══════════════════════════════════════════════════════
         WEEKLY STATEMENT — selected hotel, date range
         ══════════════════════════════════════════════════════ -->
    <?php if ($action === 'weeklyStatement' && $weeklyData): ?>
        <h3>Weekly Statement — <?= htmlspecialchars($hotelName) ?> (<?= $startDate ?> to <?= $endDate ?>)</h3>
        <table id="statementTable">
            <thead>
                <tr>
                    <th>Hotel Name</th>
                    <th>Hotel Unit</th>
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>
                <?php if (!empty($weeklyData['rows'])): ?>
                    <?php foreach ($weeklyData['rows'] as $row): ?>
                        <tr>
                            <td><?= htmlspecialchars($hotelName) ?></td>
                            <td><?= htmlspecialchars($row['HotelNumber']) ?></td>
                            <td>R <?= number_format($row['UnitTotal'], 2) ?></td>
                        </tr>
                    <?php endforeach; ?>
                    <tr class="grand-total-row">
                        <td><strong>Grand Total</strong></td>
                        <td></td>
                        <td><strong>R <?= number_format($weeklyData['total'], 2) ?></strong></td>
                    </tr>
                <?php else: ?>
                    <tr><td colspan="3">No invoices found for this period.</td></tr>
                <?php endif; ?>
            </tbody>
        </table>
        <input type="button" value="🖨️ Print Statement" onclick="printStatement()" class="print-btn">
    <?php endif; ?>


    <!-- ══════════════════════════════════════════════════════
         WEEKLY STATEMENT — all hotels, date range
         ══════════════════════════════════════════════════════ -->
    <?php if ($action === 'weeklyAll' && $weeklyAllData): ?>
        <h3>Weekly Statement — All Hotels (<?= $startDate ?> to <?= $endDate ?>)</h3>
        <table id="statementTable">
            <thead>
                <tr>
                    <th>Hotel Name</th>
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>
                <?php if (!empty($weeklyAllData['rows'])): ?>
                    <?php foreach ($weeklyAllData['rows'] as $row): ?>
                        <tr>
                            <td><?= htmlspecialchars($row['HotelName']) ?></td>
                            <td>R <?= number_format($row['HotelTotal'], 2) ?></td>
                        </tr>
                    <?php endforeach; ?>
                    <tr class="grand-total-row">
                        <td><strong>Grand Total</strong></td>
                        <td><strong>R <?= number_format($weeklyAllData['total'], 2) ?></strong></td>
                    </tr>
                <?php else: ?>
                    <tr><td colspan="2">No invoices found for this period.</td></tr>
                <?php endif; ?>
            </tbody>
        </table>
        <input type="button" value="🖨️ Print Statement" onclick="printStatement()" class="print-btn">
    <?php endif; ?>


    <br>
   
    <!-- ── JS files — edit individual files for each concern ── -->
    <script src="js/grandTotal.js"></script>
    <script>
        window.addEventListener('DOMContentLoaded', function() {
            const toast = document.createElement('div');
            toast.id = 'db-toast';
            toast.innerText = '✅ Connected to database';
            document.body.appendChild(toast);
            setTimeout(() => { toast.style.opacity = '0'; }, 2000);
            setTimeout(() => { toast.remove(); }, 3000);
        });
    </script>    <!-- fuel levy calculator    -->
    <script src="js/print.js"></script>         <!-- print function          -->
    <script src="js/navigation.js"></script>    <!-- back button navigation  -->

</body>
</html>
