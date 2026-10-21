// ============================================================
//  js/print.js — Opens a clean dedicated print window
//  Edit the HTML template below to change print layout
// ============================================================

function printStatement() {
    // ── Collect data from the visible table ──
    const table = document.getElementById('statementTable');
    if (!table) { alert('No statement to print.'); return; }

    const tableHTML = table.outerHTML;

    // ── Collect statement period if typed ──
    const dateInput = document.getElementById('statementDates');
    const period    = dateInput ? dateInput.value.trim() : '';

    // ── Build clean print page ──
    const win = window.open('', '_blank', 'width=900,height=700');
    win.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Laundry Care — Monthly Statement</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }

                body {
                    font-family: Arial, sans-serif;
                    padding: 30px;
                    color: white;
                    background: linear-gradient(to right, #4b6cb7, #182848);
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }

                /* ── Header ── */
                .print-header {
                    display: grid;
                    grid-template-columns: 1fr 1fr 1fr;
                    align-items: flex-start;
                    margin-bottom: 20px;
                    
                }

                .print-business {
                    grid-column: 2;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    text-align: center !important;
                }

                .print-business h1 {
                    font-size: 1.6em;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                    margin-bottom: 4px;
                    color: white;
                    text-shadow: 2px 2px 5px rgba(0,0,0,0.3);
                    text-align: center !important;
                    width: 100%;
                }

                .print-business p {
                    font-size: 13px;
                    line-height: 1.6;
                    color: white;
                    text-align: center !important;
                    width: 100%;
                }

                .print-business p {
                    font-size: 13px;
                    line-height: 1.6;
                    color: white;
                    text-align: center;
                }

                .print-contact {
                    grid-column: 3;
                    text-align: right;
                }

                .print-contact p {
                    font-size: 13px;
                    line-height: 1.6;
                    color: white;
                }

                /* ── Recipient ── */
                .print-recipient {
                    margin: 16px 0;
                    font-size: 13px;
                    line-height: 1.8;
                    color: white;
                }

                /* ── Title ── */
                .print-title {
                    text-align: center;
                    font-size: 1.3em;
                    font-weight: bold;
                    text-decoration: underline;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                    margin: 10px 0 4px;
                    color: white;
                    text-shadow: 2px 2px 5px rgba(0,0,0,0.3);
                }

                .print-tagline {
                    text-align: center;
                    font-style: italic;
                    font-size: 13px;
                    margin-bottom: 6px;
                    color: white;
                }

                .print-period {
                    text-align: center;
                    font-size: 16px;
                    font-weight: bold;
                    margin: 10px auto 16px;
                    color: white;
                    background: rgba(255,255,255,0.1);
                    padding: 10px 20px;
                    border-radius: 10px;
                    border: 1px solid rgba(255,255,255,0.3);
                    display: inline-block;
                    width: 100%;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }

                /* ── Table ── */
                #statementTable {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 0 auto 20px;
                    background: white;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }

                #statementTable thead {
                    background: linear-gradient(to right, #6a11cb, #2575fc);
                    color: white;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }

                #statementTable th {
                    padding: 10px 12px;
                    text-align: left;
                    color: white;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }

                #statementTable td {
                    padding: 9px 12px;
                    border: 1px solid #ddd;
                    color: black;
                }

                #statementTable tbody tr:nth-child(even):not(.grand-total-row) {
                    background: #f9f9f9;
                }

                /* ── Grand Total ── */
                .grand-total-row td {
                    background: linear-gradient(to right, #6a11cb, #2575fc) !important;
                    color: white !important;
                    font-weight: bold !important;
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                }

                /* ── Banking ── */
                .banking-title {
                    text-align: center !important;
                    font-weight: bold !important;
                    padding-top: 16px !important;
                    color: black !important;
                }

                .banking-detail {
                    text-align: center !important;
                    color: black !important;
                }

                /* ── Hide fuel row & hidden elements ── */
                #fuelCostRow { display: none !important; }
                #baseTotalValue { display: none !important; }

                @media print {
                    body {
                        background: linear-gradient(to right, #4b6cb7, #182848) !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                }
                /* ── Less blue: black for names, titles and table header ── */
                .brand h1 { color: #111; }
                .brand p, .contact { color: #222; }
                .title-row { border-bottom: 2px solid #111; }
                .title-row h2, .inv-no strong { color: #111; }
                .meta div { background: #F3F3F3; }
                th { background: #111 !important; }
                tbody tr:nth-child(even) td { background: #F7F7F7 !important; }
                td.c-code { color: #111; }
                .totals-box { border-color: #111; }
                .footer strong { color: #111; }
            </style>
        </head>
        <body>

            <div class="print-header">
                <div class="print-business">
                    <h1>Laundry Care</h1>
                    <p>2 Tottenham Road</p>
                    <p>Parkgate</p>
                    <p>Cornubia</p>
                </div>
                <div class="print-contact">
                    <p>Email: donovanmark14@gmail.com</p>
                    <p>Cell: 062 283 9374</p>
                    <p>Cell: 069 780 0340</p>
                </div>
            </div>

            <div class="print-recipient">
                <p><strong>To:</strong> Umhlanga Accommodation,</p>
                <p>Penny Underwood</p>
                <p>Shop 14, Chartwell Centre</p>
                <p>Umhlanga Rocks</p>
            </div>

            <div class="print-title">Monthly Statement</div>
            <div class="print-tagline">"A FRESH START IN EVERY WASH"</div>
            ${period ? `<div class="print-period">${period}</div>` : ''}

            ${tableHTML}

            <script>
                window.addEventListener('load', function() {
                    setTimeout(function() {
                        window.print();
                        window.onafterprint = function() { window.close(); };
                    }, 500);
                });
            <\/script>
        </body>
        </html>
    `);
    win.document.close();
}