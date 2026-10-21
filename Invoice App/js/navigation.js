// navigation.js - Page navigation with unsaved-data guard + invoice clipboard copy

function navigateToMonthlyStatement() {
    event.preventDefault();

    // Check if invoice has any data filled in
    const invoiceNum = document.getElementById('invoice_number')?.value?.trim();
    const hasRows    = document.querySelectorAll('#invoiceTable tr').length > 0;
    const anyData    = invoiceNum || (() => {
        for (const row of document.querySelectorAll('#invoiceTable tr')) {
            if (row.querySelector('.code')?.value.trim())     return true;
            if (row.querySelector('.quantity')?.value.trim()) return true;
        }
        return false;
    })();

    if (anyData) {
        showConfirmDialog(
            '⚠️ Unsaved Invoice',
            'This invoice hasn\'t been saved yet. If you leave now, all data will be lost.',
            'Yes, leave anyway',
            'Stay here',
            () => { window.location.href = 'monthly_statement/monthly_statement.php'; }
        );
    } else {
        window.location.href = 'monthly_statement/monthly_statement.php';
    }
}

// ── Reusable centred confirm dialog ──────────────────────────────────────────
function navigateToWelcome() {
    const invoiceNum = document.getElementById('invoice_number')?.value?.trim();
    let anyData = !!invoiceNum;
    if (!anyData) {
        for (const row of document.querySelectorAll('#invoiceTable tr')) {
            if (row.querySelector('.code')?.value.trim() || row.querySelector('.quantity')?.value.trim()) {
                anyData = true;
                break;
            }
        }
    }
    const go = () => { window.location.href = 'welcome.php'; };
    if (anyData) {
        showConfirmDialog(
            '⚠️ Unsaved Invoice',
            "This invoice hasn't been saved yet. If you switch mode now, all data will be lost.",
            'Yes, switch anyway',
            'Stay here',
            go
        );
    } else {
        go();
    }
}

function showConfirmDialog(title, message, confirmText, cancelText, onConfirm) {
    // Remove any existing dialog
    document.getElementById('confirmDialog')?.remove();
    document.getElementById('confirmOverlay')?.remove();

    const overlay = document.createElement('div');
    overlay.id = 'confirmOverlay';
    overlay.style.cssText = `
        position:fixed; inset:0; background:rgba(0,0,0,0.45);
        z-index:999999; display:flex; align-items:center; justify-content:center;
        animation: fadeInOverlay 0.2s ease;
    `;

    const box = document.createElement('div');
    box.id = 'confirmDialog';
    box.style.cssText = `
        background:#fff; border-radius:20px; padding:32px 36px;
        max-width:400px; width:90%; text-align:center;
        box-shadow:0 16px 48px rgba(0,0,0,0.22);
        font-family:'Segoe UI',Arial,sans-serif;
        animation: popIn 0.25s cubic-bezier(.34,1.56,.64,1);
    `;

    box.innerHTML = `
        <div style="font-size:42px; margin-bottom:12px;">⚠️</div>
        <h3 style="margin:0 0 10px; font-size:18px; color:#222;">${title}</h3>
        <p style="margin:0 0 24px; color:#666; font-size:14px; line-height:1.5;">${message}</p>
        <div style="display:flex; gap:12px; justify-content:center; flex-wrap:wrap;">
            <button id="confirmYes" style="
                background:linear-gradient(135deg,#e74c3c,#c0392b);
                color:white; border:none; border-radius:20px;
                padding:10px 24px; font-size:14px; font-weight:700;
                cursor:pointer; font-family:'Segoe UI',Arial,sans-serif;
                box-shadow:0 4px 12px rgba(231,76,60,0.3); margin:0;
                transition:transform 0.15s;
            ">${confirmText}</button>
            <button id="confirmNo" style="
                background:#f0f0f0; color:#444; border:none; border-radius:20px;
                padding:10px 24px; font-size:14px; font-weight:700;
                cursor:pointer; font-family:'Segoe UI',Arial,sans-serif;
                margin:0; box-shadow:none; transition:transform 0.15s;
            ">${cancelText}</button>
        </div>
    `;

    // Inject keyframe animations
    if (!document.getElementById('confirmDialogStyle')) {
        const s = document.createElement('style');
        s.id = 'confirmDialogStyle';
        s.textContent = `
            @keyframes fadeInOverlay { from{opacity:0} to{opacity:1} }
            @keyframes popIn { from{transform:scale(0.8);opacity:0} to{transform:scale(1);opacity:1} }
            #confirmYes:hover { transform:scale(1.05) !important; }
            #confirmNo:hover  { transform:scale(1.05) !important; background:#e0e0e0 !important; }
            #confirmDialog h3 { color:#222 !important; }
            #confirmDialog p  { color:#666 !important; }
            body.dark-mode #confirmDialog {
                background:linear-gradient(145deg,#1a1a2e,#241b3d) !important;
                border:1px solid rgba(139,92,246,0.35);
                box-shadow:0 16px 48px rgba(0,0,0,0.6) !important;
            }
            body.dark-mode #confirmDialog h3 { color:#fff !important; }
            body.dark-mode #confirmDialog p  { color:#b8b8d4 !important; }
            body.dark-mode #confirmNo { background:#2a2a4a !important; color:#e0e0f0 !important; }
            body.dark-mode #confirmNo:hover { background:#36365e !important; }
        `;
        document.head.appendChild(s);
    }

    overlay.appendChild(box);
    document.body.appendChild(overlay);

    document.getElementById('confirmYes').addEventListener('click', () => {
        overlay.remove();
        onConfirm();
    });
    document.getElementById('confirmNo').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}

// ── Invoice number clipboard copy on blur ────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {
    const invoiceInput = document.getElementById('invoice_number');
    if (invoiceInput) {
        invoiceInput.addEventListener('blur', function () {
            const val = this.value;
            if (val && val.replace(/^0+/, '')) {
                navigator.clipboard.writeText(val).catch(() => {});
            }
        });
    }
});
