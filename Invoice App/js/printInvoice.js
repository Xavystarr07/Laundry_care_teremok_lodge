// ============================================================
//  js/printInvoice.js — Validates then opens a clean print window
//  White background always (print-safe), blue theme.
// ============================================================

function printInvoice() {
    if (typeof event !== 'undefined' && event) event.preventDefault();

    // ── 1. Check invoice number ───────────────────────────────────────────────
    const invoiceInput = document.getElementById('invoice_number');
    const invoiceVal   = (invoiceInput?.value || '').replace(/\D/g, '');

    if (invoiceVal.length === 0) {
        showPopup('error', 'No invoice number entered!', 'Enter a 5-digit invoice number (e.g. 10042) before printing.', 0);
        invoiceInput?.classList.add('invalid');
        invoiceInput?.focus();
        return;
    }
    if (invoiceVal.length < 5) {
        showPopup('error', `Invoice number "${invoiceVal}" is too short — needs to be exactly 5 digits.`, `For example: ${invoiceVal.padStart(5, '0')}`, 0);
        invoiceInput?.classList.add('invalid');
        invoiceInput?.focus();
        return;
    }
    const numVal = parseInt(invoiceVal, 10);
    if (numVal < 1 || numVal > 50000) {
        showPopup('error', `Invoice #${invoiceVal} is out of range.`, 'Invoice numbers must be between 00001 and 50000.', 0);
        invoiceInput?.classList.add('invalid');
        invoiceInput?.focus();
        return;
    }

    // ── 2. Check all rows are filled ─────────────────────────────────────────
    const rows = document.querySelectorAll('#invoiceTable tr');
    let allFilled = true;
    rows.forEach(row => {
        if (
            !row.querySelector('.hotel')?.value.trim()       ||
            !row.querySelector('.unit-number')?.value.trim() ||
            !row.querySelector('.code')?.value.trim()        ||
            !row.querySelector('.description')?.value.trim() ||
            !row.querySelector('.price')?.value.trim()       ||
            !row.querySelector('.quantity')?.value.trim()    ||
            !row.querySelector('.total')?.value.trim()       ||
            !row.querySelector('.date-received')?.value.trim()
        ) allFilled = false;
    });
    if (!allFilled) {
        showPopup('error', 'Some row fields are still empty.', 'Fill in all items completely before printing.', 0, () => typeof checkInputs === 'function' && checkInputs());
        return;
    }

    // ── 3. Collect row data ──────────────────────────────────────────────────
    const esc = s => String(s).replace(/[&<>"']/g, c =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

    const rowsData = [];
    rows.forEach(row => {
        rowsData.push({
            hotel:       row.querySelector('.hotel')?.value         || '',
            unit:        row.querySelector('.unit-number')?.value   || '',
            code:        row.querySelector('.code')?.value          || '',
            description: row.querySelector('.description')?.value   || '',
            price:       row.querySelector('.price')?.value         || '',
            quantity:    row.querySelector('.quantity')?.value      || '',
            total:       row.querySelector('.total')?.value         || '',
            date:        row.querySelector('.date-received')?.value || ''
        });
    });

    const grandTotal = parseFloat((document.getElementById('grandTotal')?.innerText || '0').replace(/[^0-9.]/g, '')) || 0;
    const uniq = key => [...new Set(rowsData.map(r => r[key]).filter(Boolean))];
    const hotels = uniq('hotel').join(', ');
    const units  = uniq('unit').join(', ');
    const dates  = uniq('date').join(', ');
    const itemCount = rowsData.reduce((s, r) => s + (parseInt(r.quantity) || 0), 0);

    const tableRows = rowsData.map(r => `
        <tr>
            <td class="c-code">${esc(r.code)}</td>
            <td>${esc(r.description)}</td>
            <td class="num">R ${(parseFloat(r.price) || 0).toFixed(2)}</td>
            <td class="num">${esc(r.quantity)}</td>
            <td class="num strong">R ${(parseFloat(r.total) || 0).toFixed(2)}</td>
        </tr>
    `).join('');

    // ── 4. Open clean white print window ─────────────────────────────────────
    const win = window.open('', '_blank', 'width=1000,height=800');
    if (!win) {
        showPopup('warning', 'The print window was blocked.', 'Allow pop-ups for this site and try again.', 0);
        return;
    }

    win.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>${invoiceVal}</title>
            <style>
                @page { size: A4; margin: 12mm; }
                * { margin: 0; padding: 0; box-sizing: border-box; color-scheme: light !important; }
                :root { --blue: #1565C0; --blue-dark: #0D47A1; --blue-soft: #E8F1FB; --line: #C9D6E6; --ink: #1B2533; --muted: #5B6B7F; }

                body {
                    font-family: 'Segoe UI', Arial, sans-serif;
                    background: #fff !important; color: var(--ink) !important;
                    padding: 8px 10px; font-size: 13px;
                    -webkit-print-color-adjust: exact; print-color-adjust: exact;
                }

                /* ── Top accent bar ── */
                .bar { height: 8px; background: linear-gradient(90deg, var(--blue-dark), #2196F3); border-radius: 4px; margin-bottom: 22px; }

                /* ── Header ── */
                .header { display: flex; justify-content: space-between; align-items: flex-start; }
                .brand h1 { font-size: 28px; letter-spacing: 3px; text-transform: uppercase; color: var(--blue-dark); font-weight: 800; }
                .brand .tag { margin-top: 2px; font-size: 10.5px; letter-spacing: 2px; color: var(--blue); font-weight: 700; }
                .brand p { margin-top: 10px; font-size: 12.5px; line-height: 1.55; color: var(--muted); }
                .contact { text-align: right; font-size: 12.5px; line-height: 1.7; color: var(--muted); }
                .contact .web { color: var(--blue); font-weight: 700; }

                /* ── Invoice title + meta ── */
                .title-row { display: flex; justify-content: space-between; align-items: flex-end; margin: 26px 0 14px; padding-bottom: 10px; border-bottom: 2px solid var(--blue); }
                .title-row h2 { font-size: 26px; letter-spacing: 6px; color: var(--blue); font-weight: 300; text-transform: uppercase; }
                .inv-no { text-align: right; }
                .inv-no span { display: block; font-size: 10.5px; letter-spacing: 1.5px; color: var(--muted); text-transform: uppercase; }
                .inv-no strong { font-size: 24px; letter-spacing: 3px; color: var(--blue-dark); }

                .meta { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 18px; }
                .meta div { background: var(--blue-soft); border-left: 4px solid var(--blue); border-radius: 6px; padding: 9px 12px; }
                .meta span { display: block; font-size: 10px; letter-spacing: 1.3px; text-transform: uppercase; color: var(--muted); font-weight: 700; }
                .meta strong { display: block; margin-top: 3px; font-size: 14px; color: var(--ink); }

                /* ── Table ── */
                table { width: 100%; border-collapse: collapse; }
                thead { display: table-header-group; }
                th {
                    background: var(--blue-dark) !important; color: #fff !important;
                    padding: 10px 12px; text-align: left; font-size: 11.5px;
                    letter-spacing: 1px; text-transform: uppercase; font-weight: 700;
                    -webkit-print-color-adjust: exact; print-color-adjust: exact;
                }
                th.num, td.num { text-align: right; }
                td { padding: 9px 12px; border-bottom: 1px solid var(--line); font-size: 13px; }
                tbody tr:nth-child(even) td { background: #F4F8FD !important; }
                tr { page-break-inside: avoid; }
                td.c-code { font-family: Consolas, 'Courier New', monospace; font-size: 12px; color: var(--blue-dark); font-weight: 700; }
                td.strong { font-weight: 700; }

                /* ── Totals ── */
                .totals { display: flex; justify-content: flex-end; margin-top: 18px; page-break-inside: avoid; }
                .totals-box { min-width: 280px; border: 2px solid var(--blue-dark); border-radius: 10px; overflow: hidden; }
                .totals-row { display: flex; justify-content: space-between; padding: 8px 16px; font-size: 13px; color: var(--muted); }
                .totals-grand {
                    display: flex; justify-content: space-between; align-items: center;
                    padding: 13px 16px; background: var(--blue-dark) !important; color: #fff !important;
                    -webkit-print-color-adjust: exact; print-color-adjust: exact;
                }
                .totals-grand span { font-size: 12px; letter-spacing: 2px; text-transform: uppercase; font-weight: 700; }
                .totals-grand strong { font-size: 22px; }

                /* ── Footer ── */
                .footer { margin-top: 34px; padding-top: 12px; border-top: 1px solid var(--line); text-align: center; color: var(--muted); font-size: 12px; page-break-inside: avoid; }
                .footer strong { display: block; color: var(--blue-dark); font-size: 13px; margin-bottom: 3px; }
                .footer em { letter-spacing: 2px; font-size: 10.5px; color: var(--blue); font-style: normal; font-weight: 700; }
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

            <div class="bar"></div>

            <div class="header">
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
            </div>

            <div class="title-row">
                <h2>Invoice</h2>
                <div class="inv-no"><span>Invoice no</span><strong>${invoiceVal}</strong></div>
            </div>

            <div class="meta">
                <div><span>Hotel</span><strong>${esc(hotels)}</strong></div>
                <div><span>Unit</span><strong>${esc(units)}</strong></div>
                <div><span>Date received</span><strong>${esc(dates)}</strong></div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>Code</th>
                        <th>Description</th>
                        <th class="num">Unit Price</th>
                        <th class="num">Qty</th>
                        <th class="num">Total</th>
                    </tr>
                </thead>
                <tbody>${tableRows}</tbody>
            </table>

            <div class="totals">
                <div class="totals-box">
                    <div class="totals-row"><span>Total items</span><span>${itemCount}</span></div>
                    <div class="totals-grand"><span>Grand Total</span><strong>R ${grandTotal.toFixed(2)}</strong></div>
                </div>
            </div>

            <div class="footer">
                <strong>Thank you for your business</strong>
                <em>LAUNDRY CARE</em>
            </div>

            <script>
                window.addEventListener('load', function () {
                    setTimeout(function () {
                        window.onafterprint = function () { window.close(); };
                        window.print();
                    }, 500);
                });
            <\/script>
        </body>
        </html>
    `);
    win.document.close();
}