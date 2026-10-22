// saveInvoice.js
// - Enforces exactly 5 digits on save attempt (popup if not)
// - Checks for duplicate invoice number live after 5 digits typed
// - On valid save: normal form submit → page refresh → popup shown from session

document.addEventListener('DOMContentLoaded', function () {

    const invoiceInput = document.getElementById('invoice_number');
    const form         = document.getElementById('invoiceForm');
    const saveBtn      = document.getElementById('saveInvoiceBtn');
    let lastCheckedVal = '';
    let isDuplicate    = false;
document.getElementById('invoiceTable')?.addEventListener('input', () => { window._printed = false; });

        if (location.search.includes('undone=1')) {
        history.replaceState(null, '', location.pathname);
        setTimeout(() => showPopup('success', 'Invoice undone.', 'The saved invoice was removed from the database.', 5000), 400);
    }
    // ── Show any pending session popup (after page refresh) ───────────────────
    if (window._pendingPopup) {
        const p = window._pendingPopup;
        // Small delay so popup system is fully ready
        setTimeout(() => showPopup(p.type, p.msg, p.tip || '', p.type === 'success' ? 7000 : 0), 400);
    }

    // ── Live duplicate check: fires once after 5th digit typed ────────────────
    if (invoiceInput) {
        invoiceInput.addEventListener('input', function () {
            const val = this.value.replace(/\D/g, '');
            isDuplicate = false;
            invoiceInput.classList.remove('invalid');

            if (val.length === 5 && val !== lastCheckedVal) {
                lastCheckedVal = val;
                checkInvoiceExists(val);
            }
        });
    }

    function checkInvoiceExists(number) {
        fetch(`php/check_invoice.php?invoice_number=${encodeURIComponent(number)}`)
            .then(r => r.json())
            .then(data => {
                if (data.exists) {
                    isDuplicate = true;
                    invoiceInput.classList.add('invalid');
                    showPopup(
                        'dupe',
                        `Beep boop! Invoice #${number} already exists in the database 🤖`,
                        '💡 Try a different invoice number before saving.',
                        0
                    );
                }
            })
            .catch(() => { /* silent — don't block workflow */ });
    }

    // ── Intercept form submit for client-side validation ──────────────────────
    if (form) {
        form.addEventListener('submit', function (e) {
            const val    = (invoiceInput?.value || '').replace(/\D/g, '');
            const numVal = parseInt(val, 10);

            // Must be exactly 5 digits (or fewer but > 0 — up to 50000)
            if (val.length === 0) {
                e.preventDefault();
                showPopup('error',
                    'Invoice number is empty! 😟',
                    '💡 Enter a number between 1 and 50000 (up to 5 digits).',
                    0);
                invoiceInput?.focus();
                return;
            }

            if (val.length < 5) {
                e.preventDefault();
                showPopup('error',
                    `"${val}" is too short — invoice numbers must be exactly 5 digits.`,
                    `💡 For example, if your number is ${val}, enter it as ${val.padStart(5,'0')}.`,
                    0);
                invoiceInput?.classList.add('invalid');
                invoiceInput?.focus();
                return;
            }

            if (numVal < 1 || numVal > 50000) {
                e.preventDefault();
                showPopup('error',
                    `Invoice #${val} is out of range.`,
                    '💡 Invoice numbers must be between 00001 and 50000.',
                    0);
                invoiceInput?.classList.add('invalid');
                invoiceInput?.focus();
                return;
            }

            if (isDuplicate) {
                e.preventDefault();
                showPopup('dupe',
                    `Invoice #${val} already exists in the database.`,
                    '💡 Choose a different invoice number.',
                    0);
                invoiceInput?.focus();
                return;
            }

            const rows = Array.from(document.querySelectorAll('#invoiceTable tr'));
const rowOk = r => ['.code', '.description', '.price', '.quantity', '.total']
    .every(s => (r?.querySelector(s)?.value || '').trim() !== '');
const badIdx = rows.findIndex(r => !rowOk(r));
if (badIdx !== -1) {
    e.preventDefault();
    const bad = rows[badIdx];
    const nm = {'.code':'item code','.price':'price','.quantity':'quantity'};
    const miss = Object.keys(nm).filter(s => !(bad.querySelector(s)?.value || '').trim()).map(s => nm[s]);
    showPopup('error',
        `Row ${badIdx + 1}: missing ${miss.join(' and ') || 'details'}.`,
        `Fill in the ${miss.join(' and ') || 'row'}, or remove the row with the ✕.`,
        0,
        () => rowOk(document.querySelectorAll('#invoiceTable tr')[badIdx]));
    const empty = ['.code', '.price', '.quantity'].map(s => bad.querySelector(s)).find(el => el && !el.value.trim());
    empty?.focus();
    return;
}
if ((parseFloat(document.getElementById('grandTotalInput')?.value) || 0) <= 0) {
    e.preventDefault();
    showPopup('error', 'Grand total is 0.', 'Add at least one item with a quantity.', 0,
        () => (parseFloat(document.getElementById('grandTotalInput')?.value) || 0) > 0);
    return;
}

const badCode = rows.findIndex(r => {
    const c = (r.querySelector('.code')?.value || '').trim();
    return c && !isCustomRow(r) && !isCodeInPriceList(c);
});
if (badCode !== -1) {
    e.preventDefault();
    const el = rows[badCode].querySelector('.code');
    showPopup('error', `Row ${badCode + 1}: "${el.value}" is not a valid item code.`,
        'Pick a code from the price list, or use Custom for other items.', 0,
        () => !el.isConnected || isCodeInPriceList(el.value));
    el.focus();
    return;
}
if (!window._printed) {
    e.preventDefault();
    showPopup('warning', 'Print the invoice first.',
        'Click Print and save the PDF, then press Save Invoice.', 0, () => window._printed);
    return;
}

const items = [];
document.querySelectorAll('#invoiceTable tr').forEach(r => items.push({
    code: r.querySelector('.code')?.value || '',
    description: r.querySelector('.description')?.value || '',
    price: r.querySelector('.price')?.value || 0,
    quantity: r.querySelector('.quantity')?.value || 0,
    total: r.querySelector('.total')?.value || 0
}));
document.getElementById('itemsJson').value = JSON.stringify(items);
        });
    }

});
