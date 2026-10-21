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

            // All good — let the form submit normally (page refresh)
        });
    }

});
