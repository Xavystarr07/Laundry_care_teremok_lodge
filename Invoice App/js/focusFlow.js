// focusFlow.js — focus flow, date limits, validation guards, green flash
// isCustomRow and isCodeInPriceList are global so fieldGuide.js can use them

// ── Global helpers used by both focusFlow and fieldGuide ──────────────────────
function isCustomRow(tr) {
    const price = tr?.querySelector('.price');
    return price && !price.hasAttribute('readonly');
}

function isCodeInPriceList(code) {
    if (typeof priceList === 'undefined') return false;
    return priceList.some(item => item.code === (code || '').trim().toUpperCase());
}

// cached-hotel datalist fix, custom row flow, and combo walkthrough

let isComboNavigating = false;

function flashGreen(el) {
    if (!el) return;
    el.classList.remove('invalid');
    el.classList.add('field-ok');
    setTimeout(() => el.classList.remove('field-ok'), 2000);
}

// ── Utility: block advancement — show popup and refocus ───────────────────────
function blockAndWarn(msg, solution, el) {
    showPopup('warning', msg, solution, 0);
    setTimeout(() => el?.focus(), 80);
}

document.addEventListener('DOMContentLoaded', () => {

    const invoiceInput = document.getElementById('invoice_number');
    const table        = document.getElementById('invoiceTable');
    const row1         = table?.querySelector('tr');
    if (!invoiceInput || !row1) return;

    const getR1 = cls => row1.querySelector(cls);

    // ═══════════════════════════════════════════════════
    // DATE LIMITS — today back to 2 months ago
    // ═══════════════════════════════════════════════════
    function applyDateLimits(input) {
        const today        = new Date();
        const twoMonthsAgo = new Date();
        twoMonthsAgo.setMonth(today.getMonth() - 2);
        const fmt = d => d.toISOString().split('T')[0];
        input.max = fmt(today);
        input.min = fmt(twoMonthsAgo);
        if (!input.value) input.value = fmt(today);
    }

    document.querySelectorAll('.date-received').forEach(applyDateLimits);
    new MutationObserver(() => {
        document.querySelectorAll('.date-received:not([data-limited])').forEach(inp => {
            applyDateLimits(inp);
            inp.setAttribute('data-limited', '1');
        });
    }).observe(table, { childList: true, subtree: true });

    // ═══════════════════════════════════════════════════
    // STEP 1 — Invoice number on load
    // ═══════════════════════════════════════════════════
    setTimeout(() => invoiceInput.focus(), 100);

    invoiceInput.addEventListener('input', () => {
        const val = invoiceInput.value.replace(/\D/g, '');
        if (val.length === 5) {
            flashGreen(invoiceInput);
            setTimeout(() => openCalendar(getR1('.date-received')), 80);
        }
    });

    // ═══════════════════════════════════════════════════
    // STEP 2 — Date → Hotel
    // ═══════════════════════════════════════════════════
    document.addEventListener('change', e => {
        if (!e.target.classList.contains('date-received')) return;
        if (e.target.closest('tr') !== row1) return;

        // Block if invoice not filled
        if (invoiceInput.value.replace(/\D/g,'').length < 5) {
            blockAndWarn(
                'Invoice number needed first!',
                '💡 Fill in all 5 digits of the invoice number before picking a date.',
                invoiceInput
            );
            return;
        }
        flashGreen(e.target);
        setTimeout(() => getR1('.hotel')?.focus(), 80);
    });

    // ═══════════════════════════════════════════════════
    // STEP 3 — Hotel → Unit# (always show datalist, even cached hotel)
    // ═══════════════════════════════════════════════════

    // When hotel SELECT gains focus, always rebuild & show its datalist
    document.addEventListener('focus', e => {
        if (!e.target.classList.contains('hotel')) return;
        const tr = e.target.closest('tr');
        if (tr !== row1) return;
        // Always refresh datalist so cached hotel still shows its list
        updateUnitDatalist(e.target);
    }, true);

    document.addEventListener('change', e => {
        if (!e.target.classList.contains('hotel')) return;
        const tr      = e.target.closest('tr');
        const unitInp = tr?.querySelector('.unit-number');
        if (!unitInp) return;

        // Block if date not filled
        if (tr === row1 && !getR1('.date-received')?.value) {
            blockAndWarn(
                'Date needed first!',
                '💡 Pick a date before choosing the hotel.',
                getR1('.date-received')
            );
            return;
        }

        updateUnitDatalist(e.target);
        flashGreen(e.target);

        if (tr === row1) {
            setTimeout(() => {
                unitInp.focus();
                // Force-open the datalist dropdown by triggering input event
                unitInp.dispatchEvent(new Event('input', { bubbles: true }));
                unitInp.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
            }, 100);
        }
    });

    // Also show datalist when unit input is focused (handles cached hotel case)
    document.addEventListener('focus', e => {
        if (!e.target.classList.contains('unit-number')) return;
        const tr = e.target.closest('tr');
        if (tr !== row1) return;
        const hotelSel = getR1('.hotel');
        if (hotelSel) {
            updateUnitDatalist(hotelSel);
            // Trigger input to make browser show the datalist
            setTimeout(() => {
                e.target.dispatchEvent(new Event('input', { bubbles: true }));
            }, 50);
        }
    }, true);

    // ═══════════════════════════════════════════════════
    // STEP 4 — Unit# → Code
    // ═══════════════════════════════════════════════════
    document.addEventListener('blur', e => {
        if (!e.target.classList.contains('unit-number')) return;
        if (isComboNavigating) return;
        const tr  = e.target.closest('tr');
        const val = e.target.value.trim();

        if (!val) {
            if (tr === row1) {
                blockAndWarn(
                    'Unit number is empty!',
                    '💡 Enter the unit number for this hotel before moving on.',
                    e.target
                );
            }
            return;
        }
        flashGreen(e.target);
        const codeInp = tr?.querySelector('.code');
        if (codeInp) setTimeout(() => codeInp.focus(), 60);
    }, true);

    // ═══════════════════════════════════════════════════
    // STEP 5 — Code → next field
    // Standard rows: only advance if code is valid in priceList
    // Custom rows: code→description→price→quantity (all manual)
    // ═══════════════════════════════════════════════════
    document.addEventListener('blur', e => {
        if (!e.target.classList.contains('code')) return;
        if (isComboNavigating) return;
        const tr  = e.target.closest('tr');
        const val = e.target.value.trim();

        if (!val) return; // empty — just leave it, don't advance

        if (isCustomRow(tr)) {
            // Custom: code can be anything, move to description
            flashGreen(e.target);
            const desc = tr.querySelector('.description');
            if (desc) setTimeout(() => desc.focus(), 60);
            return;
        }

        // Standard row: must be a valid priceList code
        if (!isCodeInPriceList(val)) {
            blockAndWarn(
                `"${val}" is not a valid item code.`,
                '💡 Type a few letters to see suggestions, then pick one from the list.',
                e.target
            );
            e.target.classList.add('invalid');
            return;
        }

        flashGreen(e.target);
        const qty = tr?.querySelector('.quantity');
        if (qty) setTimeout(() => qty.focus(), 60);
    }, true);

    // Also catch datalist selection (fires 'change' not 'blur')
    document.addEventListener('change', e => {
        if (!e.target.classList.contains('code')) return;
        if (isComboNavigating) return;
        const tr  = e.target.closest('tr');
        const val = e.target.value.trim();
        if (!val) return;

        if (isCustomRow(tr)) {
            flashGreen(e.target);
            setTimeout(() => tr.querySelector('.description')?.focus(), 60);
            return;
        }

        if (!isCodeInPriceList(val)) {
            blockAndWarn(
                `"${val}" is not a valid item code.`,
                '💡 Pick a code from the suggestions list.',
                e.target
            );
            e.target.classList.add('invalid');
            return;
        }
        flashGreen(e.target);
        setTimeout(() => tr.querySelector('.quantity')?.focus(), 60);
    });

    // ═══════════════════════════════════════════════════
    // CUSTOM ROW: Description → Price → Quantity
    // ═══════════════════════════════════════════════════
    document.addEventListener('blur', e => {
        if (!e.target.classList.contains('description')) return;
        if (isComboNavigating) return;
        const tr  = e.target.closest('tr');
        if (!isCustomRow(tr)) return;
        const val = e.target.value.trim();
        if (!val) return;
        flashGreen(e.target);
        setTimeout(() => tr.querySelector('.price')?.focus(), 60);
    }, true);

    document.addEventListener('blur', e => {
        if (!e.target.classList.contains('price')) return;
        if (isComboNavigating) return;
        const tr  = e.target.closest('tr');
        if (!isCustomRow(tr)) return;
        const val = e.target.value.trim();
        if (!val || parseFloat(val) <= 0) {
            if (val !== '') blockAndWarn(
                'Price must be greater than zero.',
                '💡 Enter the unit price for this custom item.',
                e.target
            );
            return;
        }
        flashGreen(e.target);
        setTimeout(() => tr.querySelector('.quantity')?.focus(), 60);
    }, true);

    // ═══════════════════════════════════════════════════
    // Quantity flash green when filled
    // ═══════════════════════════════════════════════════
    document.addEventListener('input', e => {
        if (!e.target.classList.contains('quantity')) return;
        const val = e.target.value.trim();
        if (val && parseInt(val) > 0) {
            setTimeout(() => flashGreen(e.target), 300);
        }
    });

    // ═══════════════════════════════════════════════════
    // Add Item button — focus code on new last row
    // ═══════════════════════════════════════════════════
    document.querySelector('.add-item')?.addEventListener('click', () => {
        setTimeout(() => {
            const codes = document.querySelectorAll('.code');
            codes[codes.length - 1]?.focus();
        }, 60);
    });

});

// ═══════════════════════════════════════════════════
// COMBO QUANTITY WALKTHROUGH — called by comboModal.js
// ═══════════════════════════════════════════════════
function walkComboQuantities(quantityInputs) {
    isComboNavigating = true;

    // ── Build numpad modal once ──────────────────────────────────────────────
    if (!document.getElementById('comboNumpadOverlay')) {
        const style = document.createElement('style');
        style.textContent = `
            #comboNumpadOverlay {
                display: none;
                position: fixed;
                inset: 0;
                background: rgba(0,0,0,0.6);
                backdrop-filter: blur(4px);
                z-index: 99999;
                align-items: center;
                justify-content: center;
            }
            #comboNumpadOverlay.cnp-active { display: flex; }

            #comboNumpad {
                background: #fff;
                border-radius: 18px;
                padding: 22px 20px 18px;
                width: 320px;
                box-shadow: 0 24px 64px rgba(0,0,0,0.3);
                font-family: 'Segoe UI', Arial, sans-serif;
                animation: cnpPop 0.18s cubic-bezier(.34,1.56,.64,1);
            }
            @keyframes cnpPop {
                from { transform: scale(0.85); opacity: 0; }
                to   { transform: scale(1);    opacity: 1; }
            }
            body.dark-mode #comboNumpad {
                background: #1e2229;
                color: #e6edf3;
                box-shadow: 0 24px 64px rgba(0,0,0,0.6);
            }

            #cnpHeader {
                margin-bottom: 12px;
            }
            #cnpProgress {
                font-size: 11px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.8px;
                color: #8b5cf6;
                margin-bottom: 4px;
            }
            body.dark-mode #cnpProgress { color: #a78bfa; }

            #cnpItemName {
                font-size: 15px;
                font-weight: 700;
                color: #1a1f2e;
                margin-bottom: 2px;
            }
            body.dark-mode #cnpItemName { color: #e6edf3; }

            #cnpSubtext {
                font-size: 12px;
                color: #888;
            }
            body.dark-mode #cnpSubtext { color: #aaa; }

            #cnpDisplay {
                background: #f3f6fa;
                border: 2px solid #c8d1dc;
                border-radius: 12px;
                padding: 10px 16px;
                font-size: 28px;
                font-weight: 800;
                text-align: center;
                color: #1a1f2e;
                margin-bottom: 14px;
                letter-spacing: 2px;
                min-height: 54px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            body.dark-mode #cnpDisplay {
                background: #13161c;
                border-color: #3a3f4a;
                color: #e6edf3;
            }

            #cnpGrid {
                display: grid;
                grid-template-columns: repeat(5, 1fr);
                gap: 6px;
                margin-bottom: 12px;
            }
            .cnp-num {
                background: #eaf0fb;
                border: 1.5px solid #c2d0e8;
                border-radius: 10px;
                padding: 10px 4px;
                font-size: 14px;
                font-weight: 700;
                color: #1a4aad;
                cursor: pointer;
                text-align: center;
                transition: background 0.12s, transform 0.1s, border-color 0.12s;
                user-select: none;
            }
            .cnp-num:hover {
                background: #1a4aad;
                color: #fff;
                border-color: #1a4aad;
                transform: scale(1.08);
            }
            .cnp-num:active { transform: scale(0.95); }
            body.dark-mode .cnp-num {
                background: #1c2840;
                border-color: #2d4270;
                color: #6aa0f5;
            }
            body.dark-mode .cnp-num:hover {
                background: #2563eb;
                color: #fff;
                border-color: #2563eb;
            }

            #cnpSummaryWrap {
                display: none;
                flex-direction: column;
                gap: 0;
                border-radius: 12px;
                overflow: hidden;
                border: 1.5px solid #e2e8f0;
                margin-bottom: 14px;
            }
            body.dark-mode #cnpSummaryWrap { border-color: #2d3340; }
            #cnpSummaryWrap.visible { display: flex; }

            @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700;800&display=swap');

            #cnpSummaryWrap {
                border-radius: 14px;
                overflow: hidden;
                border: none !important;
                box-shadow: 0 4px 24px rgba(109,40,217,0.13);
                margin-bottom: 0;
            }

            #cnpSummaryTitle {
                background: linear-gradient(120deg, #4c1d95 0%, #6d28d9 50%, #7c3aed 100%);
                color: #fff;
                font-size: 13px;
                font-weight: 800;
                padding: 13px 16px;
                letter-spacing: 1px;
                text-transform: uppercase;
                display: flex;
                align-items: center;
                gap: 10px;
                position: relative;
                overflow: hidden;
            }
            #cnpSummaryTitle::after {
                content: '';
                position: absolute;
                top: -18px; right: -18px;
                width: 60px; height: 60px;
                background: rgba(255,255,255,0.08);
                border-radius: 50%;
            }
            #cnpSummaryTitle::before {
                content: '';
                position: absolute;
                bottom: -24px; left: 40%;
                width: 80px; height: 80px;
                background: rgba(255,255,255,0.05);
                border-radius: 50%;
            }
            #cnpSummarySubtext {
                font-size: 10px;
                color: rgba(255,255,255,0.6);
                font-weight: 600;
                margin-left: auto;
                letter-spacing: 0.5px;
                background: rgba(255,255,255,0.12);
                padding: 3px 9px;
                border-radius: 20px;
                border: 1px solid rgba(255,255,255,0.18);
                position: relative;
                z-index: 1;
            }

            .cnp-summary-row {
                display: grid;
                grid-template-columns: 1fr auto auto;
                align-items: center;
                gap: 12px;
                padding: 11px 16px;
                border-top: 1px solid rgba(109,40,217,0.08);
                background: #fdfcff;
                transition: background 0.15s, transform 0.1s;
                position: relative;
            }
            .cnp-summary-row::before {
                content: '';
                position: absolute;
                left: 0; top: 0; bottom: 0;
                width: 3px;
                background: linear-gradient(180deg, #7c3aed, #a78bfa);
                opacity: 0;
                transition: opacity 0.15s;
            }
            .cnp-summary-row:hover { background: #f5f0ff; }
            .cnp-summary-row:hover::before { opacity: 1; }
            body.dark-mode .cnp-summary-row {
                background: #16101f;
                border-color: rgba(124,58,237,0.15);
            }
            body.dark-mode .cnp-summary-row:hover { background: #1c1230; }
            .cnp-summary-row:first-of-type { border-top: none; }

            .cnp-summary-desc {
                color: #374151;
                font-size: 12.5px;
                font-weight: 600;
                line-height: 1.3;
                font-family: 'Segoe UI', Arial, sans-serif;
                letter-spacing: 0.1px;
            }
            body.dark-mode .cnp-summary-desc { color: #c4b5fd; }

            .cnp-summary-qty-display {
                font-family: 'Space Grotesk', 'Segoe UI', Arial, sans-serif;
                font-weight: 800;
                font-size: 17px;
                color: #fff;
                min-width: 40px;
                text-align: center;
                background: linear-gradient(135deg, #16a34a, #15803d);
                border-radius: 10px;
                padding: 5px 10px;
                border: none;
                line-height: 1.3;
                box-shadow: 0 3px 10px rgba(22,163,74,0.35);
                letter-spacing: 0.5px;
            }
            body.dark-mode .cnp-summary-qty-display {
                background: linear-gradient(135deg, #166534, #15803d);
                box-shadow: 0 3px 12px rgba(74,222,128,0.25);
                color: #d1fae5;
            }

            .cnp-edit-btn {
                background: rgba(124,58,237,0.08);
                border: 1.5px solid rgba(124,58,237,0.25);
                border-radius: 9px;
                color: #7c3aed;
                cursor: pointer;
                font-size: 12px;
                padding: 5px 10px;
                transition: all 0.18s cubic-bezier(.34,1.56,.64,1);
                margin: 0 !important;
                box-shadow: none !important;
                white-space: nowrap;
                font-weight: 700;
                letter-spacing: 0.2px;
                font-family: 'Segoe UI', Arial, sans-serif;
            }
            .cnp-edit-btn:hover {
                background: linear-gradient(135deg, #7c3aed, #6d28d9);
                border-color: transparent;
                color: #fff;
                transform: scale(1.08);
                box-shadow: 0 4px 12px rgba(124,58,237,0.4) !important;
            }
            body.dark-mode .cnp-edit-btn {
                background: rgba(167,139,250,0.1);
                border-color: rgba(167,139,250,0.3);
                color: #a78bfa;
            }
            body.dark-mode .cnp-edit-btn:hover {
                background: linear-gradient(135deg, #7c3aed, #6d28d9);
                border-color: transparent;
                color: #fff;
            }

            /* Inline edit mode */
            .cnp-qty-input {
                font-family: 'Space Grotesk', 'Segoe UI', Arial, sans-serif;
                font-weight: 800;
                font-size: 16px;
                color: #fff;
                width: 54px;
                text-align: center;
                background: linear-gradient(135deg, #16a34a, #15803d);
                border-radius: 10px;
                padding: 5px 8px;
                border: 2px solid #4ade80;
                outline: none;
                box-sizing: border-box;
                margin: 0;
                display: block;
                box-shadow: 0 0 0 3px rgba(74,222,128,0.25);
            }
            .cnp-qty-input::-webkit-inner-spin-button,
            .cnp-qty-input::-webkit-outer-spin-button { -webkit-appearance: none; }
            body.dark-mode .cnp-qty-input {
                background: linear-gradient(135deg, #166534, #15803d);
                border-color: #4ade80;
                color: #d1fae5;
            }

            #cnpDoneBtn {
                width: 100%;
                padding: 16px;
                background: linear-gradient(120deg, #16a34a 0%, #15803d 50%, #166534 100%);
                color: #fff;
                border: none;
                border-radius: 0 0 16px 16px;
                font-size: 15px;
                font-weight: 800;
                cursor: pointer;
                letter-spacing: 1px;
                text-transform: uppercase;
                transition: filter 0.18s, transform 0.12s, box-shadow 0.18s;
                display: none;
                font-family: 'Space Grotesk', 'Segoe UI', Arial, sans-serif;
                position: relative;
                overflow: hidden;
            }
            #cnpDoneBtn::before {
                content: '';
                position: absolute;
                inset: 0;
                background: linear-gradient(120deg, rgba(255,255,255,0.12) 0%, transparent 60%);
                pointer-events: none;
            }
            #cnpDoneBtn::after {
                content: '';
                position: absolute;
                top: -40px; right: -40px;
                width: 90px; height: 90px;
                background: rgba(255,255,255,0.07);
                border-radius: 50%;
                pointer-events: none;
            }
            #cnpDoneBtn:hover {
                filter: brightness(1.1);
                box-shadow: 0 6px 24px rgba(22,163,74,0.45);
            }
            #cnpDoneBtn:active { transform: scale(0.99); }
            #cnpDoneBtn.visible { display: block; }
        `;
        document.head.appendChild(style);

        const overlay = document.createElement('div');
        overlay.id = 'comboNumpadOverlay';
        overlay.innerHTML = `
            <div id="comboNumpad">
                <div id="cnpHeader">
                    <div id="cnpProgress"></div>
                    <div id="cnpItemName"></div>
                    <div id="cnpSubtext">Select quantity (1–20)</div>
                </div>
                <div id="cnpDisplay">—</div>
                <div id="cnpGrid"></div>
                <div id="cnpSummaryWrap">
                    <div id="cnpSummaryTitle">✅ Quantities Summary</div>
                </div>
                <button id="cnpDoneBtn">✔ Done — View Invoice</button>
            </div>
        `;
        document.body.appendChild(overlay);

        // Build number grid 1–20
        const grid = overlay.querySelector('#cnpGrid');
        for (let i = 1; i <= 20; i++) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'cnp-num';
            btn.textContent = i;
            btn.dataset.val = i;
            grid.appendChild(btn);
        }
    }

    // ── Refs ─────────────────────────────────────────────────────────────────
    const overlay     = document.getElementById('comboNumpadOverlay');
    const cnpProgress = document.getElementById('cnpProgress');
    const cnpItemName = document.getElementById('cnpItemName');
    const cnpDisplay  = document.getElementById('cnpDisplay');
    const cnpGrid     = document.getElementById('cnpGrid');
    const summaryWrap = document.getElementById('cnpSummaryWrap');
    const doneBtn     = document.getElementById('cnpDoneBtn');

    const summaryEntries = []; // {desc, qty} for each field filled

    // ── Open overlay ─────────────────────────────────────────────────────────
    overlay.classList.add('cnp-active');
    summaryWrap.classList.remove('visible');
    doneBtn.classList.remove('visible');
    // Remove old summary rows
    overlay.querySelectorAll('.cnp-summary-row').forEach(r => r.remove());
    summaryEntries.length = 0;

    let currentIndex = 0;

    function showField(index) {
        if (index >= quantityInputs.length) {
            // All done — show summary
            showSummary();
            return;
        }

        const qtyInput = quantityInputs[index];
        const row      = qtyInput.closest('tr');
        const descEl   = row?.querySelector('.description');
        const desc     = descEl?.value || `Item ${index + 1}`;

        cnpProgress.textContent = `Item ${index + 1} of ${quantityInputs.length}`;
        cnpItemName.textContent = desc;
        cnpDisplay.textContent  = '—';

        // Highlight active number buttons (clear previous selection)
        cnpGrid.querySelectorAll('.cnp-num').forEach(b => {
            b.style.background = '';
            b.style.color = '';
            b.style.borderColor = '';
        });
    }

    function selectNumber(val, index) {
        const qtyInput = quantityInputs[index];
        qtyInput.value = val;
        qtyInput.dispatchEvent(new Event('input', { bubbles: true }));
        qtyInput.dispatchEvent(new Event('change', { bubbles: true }));
        flashGreen(qtyInput);

        // Record for summary
        const row    = qtyInput.closest('tr');
        const descEl = row?.querySelector('.description');
        summaryEntries.push({ desc: descEl?.value || `Item ${index + 1}`, qty: val });

        // Briefly show selected number
        cnpDisplay.textContent = val;
        cnpDisplay.style.color = '#16a34a';
        setTimeout(() => {
            cnpDisplay.style.color = '';
            currentIndex++;
            showField(currentIndex);
        }, 300);
    }

    function showSummary() {
        isComboNavigating = false;

        // Hide grid and header, show summary
        cnpGrid.style.display = 'none';
        document.getElementById('cnpHeader').style.display = 'none';
        cnpDisplay.style.display = 'none';

        // Update summary title to include hint
        const titleEl = document.getElementById('cnpSummaryTitle');
        titleEl.innerHTML = `✅ Quantities Summary <span id="cnpSummarySubtext">tap ✏️ to edit</span>`;

        summaryWrap.classList.add('visible');
        doneBtn.classList.add('visible');

        // Build summary rows with edit capability
        summaryEntries.forEach((entry, i) => {
            const row = document.createElement('div');
            row.className = 'cnp-summary-row';
            row.dataset.index = i;

            const qtyDisplay = document.createElement('span');
            qtyDisplay.className = 'cnp-summary-qty-display';
            qtyDisplay.textContent = entry.qty;

            const descEl = document.createElement('span');
            descEl.className = 'cnp-summary-desc';
            descEl.textContent = entry.desc;

            const editBtn = document.createElement('button');
            editBtn.type = 'button';
            editBtn.className = 'cnp-edit-btn';
            editBtn.textContent = '✏️';
            editBtn.title = 'Edit quantity';

            editBtn.addEventListener('click', () => {
                // Replace qty display with inline input
                const input = document.createElement('input');
                input.type = 'number';
                input.className = 'cnp-qty-input';
                input.min = 1;
                input.max = 20;
                input.value = entry.qty;

                qtyDisplay.replaceWith(input);
                editBtn.textContent = '✔';
                editBtn.title = 'Confirm';
                input.focus();
                input.select();

                function confirmEdit() {
                    const newVal = Math.min(20, Math.max(1, parseInt(input.value) || 1));
                    entry.qty = newVal;

                    // Update the actual quantity input in the table
                    const qtyInput = quantityInputs[i];
                    if (qtyInput) {
                        qtyInput.value = newVal;
                        qtyInput.dispatchEvent(new Event('input', { bubbles: true }));
                        qtyInput.dispatchEvent(new Event('change', { bubbles: true }));
                        flashGreen(qtyInput);
                    }

                    // Restore display
                    const newDisplay = document.createElement('span');
                    newDisplay.className = 'cnp-summary-qty-display';
                    newDisplay.textContent = newVal;
                    input.replaceWith(newDisplay);
                    editBtn.textContent = '✏️';
                    editBtn.title = 'Edit quantity';

                    // Re-wire edit for this entry
                    editBtn.onclick = null;
                    editBtn.addEventListener('click', arguments.callee.bind(null), { once: true });
                }

                editBtn.addEventListener('click', confirmEdit, { once: true });
                input.addEventListener('keydown', e => {
                    if (e.key === 'Enter') confirmEdit();
                    if (e.key === 'Escape') {
                        const cancelDisplay = document.createElement('span');
                        cancelDisplay.className = 'cnp-summary-qty-display';
                        cancelDisplay.textContent = entry.qty;
                        input.replaceWith(cancelDisplay);
                        editBtn.textContent = '✏️';
                        editBtn.title = 'Edit quantity';
                    }
                });
            });

            row.appendChild(descEl);
            row.appendChild(qtyDisplay);
            row.appendChild(editBtn);
            summaryWrap.appendChild(row);
        });
    }

    // ── Done button ───────────────────────────────────────────────────────────
    doneBtn.addEventListener('click', function handler() {
        overlay.classList.remove('cnp-active');
        // Reset display for next time
        cnpGrid.style.display = '';
        document.getElementById('cnpHeader').style.display = '';
        cnpDisplay.style.display = '';
        doneBtn.removeEventListener('click', handler);
        showPopup('success', 'All combo quantities filled! 🎉', '✅ Looking good — ready to save or add more.', 4000);
    });

    // ── Number button click handler ───────────────────────────────────────────
    // Remove old listeners by replacing grid content approach — use delegation
    cnpGrid.onclick = function(e) {
        const btn = e.target.closest('.cnp-num');
        if (!btn) return;
        selectNumber(parseInt(btn.dataset.val), currentIndex);
    };

    // ── Keyboard support ──────────────────────────────────────────────────────
    function onKey(e) {
        if (!overlay.classList.contains('cnp-active')) return;
        const n = parseInt(e.key);
        if (!isNaN(n) && n >= 1 && n <= 9) {
            selectNumber(n, currentIndex);
        }
        if (e.key === 'Enter' && doneBtn.classList.contains('visible')) {
            doneBtn.click();
        }
    }
    document.addEventListener('keydown', onKey);
    doneBtn.addEventListener('click', () => document.removeEventListener('keydown', onKey), { once: true });

    // ── Start ─────────────────────────────────────────────────────────────────
    showField(0);
}

// Opens browser date picker
function openCalendar(input) {
    if (!input) return;
    input.focus();
    try { input.showPicker(); } catch(e) {}
}
