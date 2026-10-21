<?php
// ============================================================
//  invoice_generator.php — Main entry point
//  Edit CSS links below to add/remove stylesheets
//  Edit JS links at the bottom to add/remove scripts
// ============================================================
session_start();

// No mode chosen yet this session → ask first
if (!isset($_SESSION['mode'])) {
    header('Location: welcome.php');
    exit;
}
$_SESSION['mode'] = 'regular';

require_once 'php/undo_helper.php';
$undo  = undoAvailable();
$popup = null;
if (isset($_SESSION['popup'])) {
    $popup = $_SESSION['popup'];
    unset($_SESSION['popup']);
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Laundry Care Invoice</title>

    <!-- ── CSS files — edit individual files for each concern ── -->
    <link rel="stylesheet" href="html_css/base.css">     <!-- body, fonts             -->
    <link rel="stylesheet" href="html_css/header.css">   <!-- top header layout       -->
    <link rel="stylesheet" href="html_css/table.css">    <!-- invoice table           -->
    <link rel="stylesheet" href="html_css/inputs.css">   <!-- fields, selects         -->
    <link rel="stylesheet" href="html_css/buttons.css">  <!-- all buttons             -->
    <link rel="stylesheet" href="html_css/image.css">    <!-- image preview bar       -->
    <link rel="stylesheet" href="html_css/print.css">
    <link rel="stylesheet" href="html_css/combo.css">    <!-- print / light mode fix  -->
</head>
<body>

<?php if ($undo): ?>
<script>window._undoAvail = <?php echo json_encode($undo); ?>;</script>
<?php endif; ?>
<?php if ($popup): ?>
<script>
// Show popup once page has loaded and JS is ready
window._pendingPopup = <?php echo json_encode($popup); ?>;
</script>
<?php endif; ?>

<!-- Business header: edit partials/header.html -->
<?php include 'partials/header.html'; ?>

<form id="invoiceForm" method="post" action="php/invoice_handler.php">

    <table>
        <div class="center">
            <h2>
                Invoice no:
                <input
                    type="text"
                    id="invoice_number"
                    name="invoice_number"
                    class="invoice-input"
                    required
                    maxlength="5"
                    placeholder="00000"
                    oninput="formatInvoiceNumber(this)"
                    autocomplete="off"
                />
            </h2>
        </div>
        <thead>
            <tr>
                <th>Hotel</th>
                <th>Unit Number</th>
                <th>Code</th>
                <th>Description</th>
                <th>Unit Price (R)</th>
                <th>Quantity</th>
                <th>Total Price (R)</th>
                <th>Date Received</th>
            </tr>
        </thead>
        <tbody id="invoiceTable">
            <tr>
                <td>
                    <!-- Hotel list: edit partials/hotel_select.html -->
                    <?php include 'partials/hotel_select.html'; ?>
                </td>
                <td>
                    <input type="number" name="unit-number" class="unit-number" placeholder="Unit Number">
                </td>
                <td>
                    <input type="text" class="code" oninput="suggestCode(this)" list="suggestions">
                    <datalist id="suggestions"></datalist>
                </td>
                <td><input type="text" name="description" class="description" readonly></td>
                <td><input type="number" name="price" class="price" readonly></td>
                <td>
                    <input type="number" name="quantity" class="quantity" min="1" list="quantity-list" oninput="calculateTotal(this)">
                    <datalist id="quantity-list">
                        <option value="1"> <option value="2"> <option value="3"> <option value="4">
                        <option value="5"> <option value="6"> <option value="7"> <option value="8">
                        <option value="9"> <option value="10"> <option value="11"> <option value="12">
                        <option value="13"> <option value="14"> <option value="15"> <option value="16">
                        <option value="17"> <option value="18"> <option value="19"> <option value="20">
                    </datalist>
                </td>
                <td><input type="number" name="total" class="total" readonly></td>
                <td>
                    <input type="date" name="date_received" class="date-received" required>
                </td>
            </tr>
        </tbody>
    </table>

    <!-- ── Action buttons row ── -->




    <div class="btn-row">

        <!-- Add Item — green + icon -->
        <button type="button" class="uv-btn add-item">
            <svg class="uv-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            <span>Add Item</span>
        </button>

        <!-- Print — blue + printer icon -->
        <button type="button" class="uv-btn print-btn" onclick="printInvoice()">
            <svg class="uv-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>
            </svg>
            <span>Print</span>
        </button>

        <!-- Custom — amber + pencil icon -->
        <button type="button" class="uv-btn custom-item" onclick="addCustomItem()">
            <svg class="uv-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            <span>Custom</span>
        </button>

        <!-- Add Combo — indigo + grid icon -->
        <button type="button" class="uv-btn" id="comboAddBtn">
            <svg class="uv-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
            </svg>
            <span>Add Combo</span>
        </button>

        <!-- Insert Image — teal + image icon -->
        <button type="button" class="uv-btn" id="insertImageBtn">
            <svg class="uv-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
            </svg>
            <span>Insert Image</span>
        </button>



        <!-- Checklist -->
        <button type="button" class="uv-btn" id="checklistBtn">
            <svg class="uv-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
            </svg>
            <span>Checklist</span>
        </button>
    </div>

    <!-- ── Save Invoice centred row ── -->
    <div class="save-row">
        <button type="submit" name="save_invoice" class="uv-btn" id="saveInvoiceBtn">
            <svg class="uv-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
            </svg>
            <span>Save Invoice</span>
        </button>
    </div>

    <!-- ── Combo Modal ── -->
    <div id="comboModal">
      <div class="cm-box">
        <div class="cm-head">
          <div class="cm-icon">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
          </div>
          <div>
            <h3>Add Combo</h3>
            <p>Tick one or more combos, then press Enter</p>
          </div>
        </div>
        <div id="categoryContainer"></div>
        <div class="cm-foot">
          <span id="comboCount">Nothing selected yet</span>
          <div>
            <button id="comboCancelBtn" type="button" class="cm-btn cm-cancel">Cancel</button>
            <button id="comboConfirmBtn" type="button" class="cm-btn cm-confirm">Enter</button>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Grand Total — centred, well below save button ── -->
    <div class="grand-total-row">
        <h3>Grand Total: R<span id="grandTotal">0.00</span></h3>
        <input type="hidden" name="grandTotal" id="grandTotalInput" value="0.00">
    </div>

    <!-- ── Image Preview — left-aligned, below grand total ── -->
    <div class="image-preview-anchor">
        <!-- imageInsert.js injects #imagePreviewBar here -->
    </div>

</form>


<!-- ── JS files — edit individual files for each concern ── -->
<script src="js/priceList.js"></script>       <!-- item price data             -->
<script src="js/hotelData.js"></script>       <!-- hotel/unit data             -->
<script src="js/comboData.js"></script>       <!-- combo preset data           -->
<script src="js/popupNotify.js"></script>     <!-- success/error popups        -->
<script src="js/fieldGuide.js"></script>      <!-- field highlight guide       -->
<script src="js/grandTotal.js"></script>      <!-- grand total calculator      -->
<script src="js/rowManager.js"></script>
<script src="js/rowRemove.js"></script>      <!-- add/remove table rows       -->
<script src="js/comboModal.js"></script>      <!-- combo selection modal       -->
<script src="js/codeSearch.js"></script>      <!-- item code autocomplete      -->
<script src="js/printInvoice.js"></script>    <!-- print function              -->
<script src="js/navigation.js"></script>      <!-- page navigation + guard     -->
<script src="js/focusFlow.js"></script>       <!-- tab/enter focus flow        -->
<script src="js/scrollObserver.js"></script>  <!-- scroll behaviour            -->
<script src="js/invoiceFormat.js"></script>   <!-- invoice number formatting   -->
<script src="js/saveInvoice.js"></script>     <!-- save button behaviour       -->
<script src="js/imageInsert.js"></script>     <!-- image insert feature        -->
<script src="js/themeSearch.js"></script>     <!-- theme/search feature        -->
<script src="js/checklist.js"></script>
<script src="js/undoSave.js"></script>       <!-- checklist feature           -->

</body>
</html>
