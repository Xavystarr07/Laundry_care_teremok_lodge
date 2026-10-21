// rowManager.js - Adding, removing, and managing invoice rows

function isValidCode(code) {
    return /^[a-zA-Z0-9]{3,}$/.test(code);
}

// ─── Get locked values from row 1 ────────────────────────────────────────────
function getRow1Values() {
    const table = document.getElementById("invoiceTable");
    const firstRow = table.rows[0];
    return {
        hotel: firstRow?.querySelector(".hotel")?.value || "",
        unit:  firstRow?.querySelector(".unit-number")?.value || "",
        date:  firstRow?.querySelector(".date-received")?.value || new Date().toISOString().split("T")[0]
    };
}

// ─── Validation: check all visible, editable required fields ──────────────────
function checkInputs() {
    const rows = document.querySelectorAll('#invoiceTable tr');
    let allFilled = true;

    rows.forEach(row => {
        const fields = [
            row.querySelector('.hotel'),
            row.querySelector('.unit-number'),
            row.querySelector('.code'),
            row.querySelector('.description'),
            row.querySelector('.price'),
            row.querySelector('.quantity'),
            row.querySelector('.total'),
            row.querySelector('.date-received')
        ];
        fields.forEach(f => {
            if (!f) return;
            if (!f.value || /^\s*$/.test(f.value)) {
                if (f.hasAttribute('data-touched')) f.classList.add('invalid');
                allFilled = false;
            } else {
                f.classList.remove('invalid');
            }
        });
    });

    const invoiceNum = document.getElementById('invoice_number');
    if (!invoiceNum?.value) allFilled = false;

    const submitBtn = document.querySelector('.submit-btn');
    if (submitBtn) submitBtn.disabled = !allFilled;

    return allFilled;
}

// ─── Build locked hotel/unit cells for non-first rows ─────────────────────────
function buildLockedRowHTML(hotel, unit, date) {
    return `
        <td>
            <select class="hotel" name="hotel" disabled>
                ${getHotelOptionsHTML(hotel)}
            </select>
            <input type="hidden" name="hotel" value="${hotel}">
        </td>
        <td><input type="number" name="unit-number" class="unit-number" value="${unit}" readonly></td>
    `;
}

// ─── Add a standard item row ──────────────────────────────────────────────────
function addRow(isCombo = false) {
    const { hotel, unit, date } = getRow1Values();
    const table = document.getElementById("invoiceTable");
    const newRow = table.insertRow();
    if (isCombo) newRow.dataset.combo = "true";

    newRow.innerHTML = `
        ${buildLockedRowHTML(hotel, unit, date)}
        <td>
            <input type="text" class="code" oninput="suggestCode(this)" list="suggestions">
            <datalist id="suggestions"></datalist>
        </td>
        <td><input type="text" name="description" class="description" readonly></td>
        <td><input type="number" name="price" class="price" readonly></td>
        <td>
            <input type="number" name="quantity" class="quantity" min="1" list="quantity-list" oninput="calculateTotal(this)">
            <datalist id="quantity-list">
                ${Array.from({ length: 20 }, (_, i) => `<option value="${i + 1}">`).join("")}
            </datalist>
        </td>
        <td><input type="number" name="total" class="total" readonly></td>
        <td><input type="date" name="date_received" class="date-received" value="${date}" readonly></td>
    `;

    const codeInput     = newRow.querySelector(".code");
    const quantityInput = newRow.querySelector(".quantity");

    codeInput.addEventListener("blur", () => {
        if (newRow.dataset.combo === "true") return;
        if (isValidCode(codeInput.value.trim())) quantityInput.focus();
    });

    newRow.querySelectorAll('input, select').forEach(el => {
        el.addEventListener('focus', () => el.setAttribute('data-touched', true));
        el.addEventListener('blur', checkInputs);
    });

    updateGrandTotal();
}

// ─── Reset row 1 back to standard (non-custom) state ─────────────────────────
function resetRow1ToStandard() {
    const table    = document.getElementById("invoiceTable");
    const firstRow = table.rows[0];
    if (!firstRow) return;

    const hotel = firstRow.querySelector('.hotel')?.value || '';
    const unit  = firstRow.querySelector('.unit-number')?.value || '';
    const date  = firstRow.querySelector('.date-received')?.value || new Date().toISOString().split('T')[0];

    firstRow.innerHTML = `
        <td>
            <select class="hotel" name="hotel" id="hotelSelect" onchange="updateUnitDatalist(this)">
                ${getHotelOptionsHTML(hotel)}
            </select>
        </td>
        <td><input type="number" name="unit-number" class="unit-number" value="${unit}" placeholder="Unit Number"></td>
        <td>
            <input type="text" class="code" oninput="suggestCode(this)" list="suggestions">
            <datalist id="suggestions"></datalist>
        </td>
        <td><input type="text" name="description" class="description" readonly></td>
        <td><input type="number" name="price" class="price" readonly></td>
        <td>
            <input type="number" name="quantity" class="quantity" min="1" list="quantity-list" oninput="calculateTotal(this)">
            <datalist id="quantity-list">
                ${Array.from({ length: 20 }, (_, i) => `<option value="${i + 1}">`).join('')}
            </datalist>
        </td>
        <td><input type="number" name="total" class="total" readonly></td>
        <td><input type="date" name="date_received" class="date-received" value="${date}"></td>
    `;

    firstRow.querySelectorAll('input, select').forEach(el => {
        el.addEventListener('focus', () => el.setAttribute('data-touched', true));
        el.addEventListener('blur', checkInputs);
    });
}

// ─── Remove a row ─────────────────────────────────────────────────────────────
function removeRow() {
    const table    = document.getElementById("invoiceTable");
    const rowCount = table.rows.length;

    if (rowCount === 0) {
        showPopup('info', 'There are no rows to remove.', '', 4000);
        return;
    }

    // Only one row — reset row 1 to standard state (removes custom mode)
    if (rowCount === 1) {
        resetRow1ToStandard();
        updateGrandTotal();
        showPopup('info', 'Row 1 cleared.', '💡 Hotel, unit and date are kept.', 3000);
        return;
    }

    const rowNumber = prompt(`Enter the row number to remove (1-${rowCount}):`);
    if (rowNumber === null || rowNumber === "") return;

    const rowIndex = parseInt(rowNumber, 10);
    if (isNaN(rowIndex) || rowIndex < 1 || rowIndex > rowCount) {
        showPopup('error', `"${rowNumber}" is not a valid row number.`, `💡 Enter a number between 1 and ${rowCount}.`, 5000);
        return;
    }

    if (rowIndex === 1) {
        resetRow1ToStandard();
        showPopup('info', 'Row 1 item fields cleared.', '💡 Hotel, unit and date are kept.', 3000);
    } else {
        table.deleteRow(rowIndex - 1);
        showPopup('success', `Row ${rowIndex} removed.`, '', 2500);
    }

    updateGrandTotal();
}

// ─── Add a custom (free-form price) item row ──────────────────────────────────
// If the first row's item fields are all empty, reuse it instead of inserting new row
function addCustomItem() {
    const { hotel, unit, date } = getRow1Values();
    const table = document.getElementById("invoiceTable");

    // Check if row 1 item fields are all empty — if so, fill it in place
    let targetRow = null;
    if (table.rows.length >= 1) {
        const r1 = table.rows[0];
        const code  = r1.querySelector('.code')?.value.trim();
        const desc  = r1.querySelector('.description')?.value.trim();
        const price = r1.querySelector('.price')?.value;
        const qty   = r1.querySelector('.quantity')?.value;
        if (!code && !desc && (!price || price == 0) && (!qty || qty == 0)) {
            targetRow = r1;
        }
    }

    const customHTML = (isFirstRow) => `
        ${isFirstRow ? `
        <td>
            <select class="hotel" name="hotel" id="hotelSelect" onchange="updateUnitDatalist(this)">
                ${getHotelOptionsHTML(hotel)}
            </select>
        </td>
        <td><input type="number" name="unit-number" class="unit-number" value="${unit}" placeholder="Unit Number"></td>
        ` : buildLockedRowHTML(hotel, unit, date)}
        <td><input type="text" class="code" placeholder="Custom Code"></td>
        <td><input type="text" class="description" placeholder="Description"></td>
        <td><input type="number" class="price" placeholder="Unit Price" oninput="calculateCustomTotal(this)"></td>
        <td>
            <input type="number" class="quantity" min="1" list="quantity-list" oninput="calculateCustomTotal(this)">
            <datalist id="quantity-list">
                ${Array.from({ length: 20 }, (_, i) => `<option value="${i + 1}">`).join('')}
            </datalist>
        </td>
        <td><input type="text" class="total" readonly></td>
        <td><input type="date" name="date_received" class="date-received" value="${date}" ${isFirstRow ? '' : 'readonly'}></td>
    `;

    if (targetRow) {
        targetRow.innerHTML = customHTML(true);
    } else {
        const newRow = table.insertRow();
        newRow.innerHTML = customHTML(false);
        targetRow = newRow;
    }

    targetRow.querySelectorAll('input, select').forEach(el => {
        el.addEventListener('focus', () => el.setAttribute('data-touched', true));
        el.addEventListener('blur', checkInputs);
    });

    // Focus the code field
    setTimeout(() => targetRow.querySelector('.code')?.focus(), 50);
    updateGrandTotal();
}

// ─── Wire everything up on DOM ready ─────────────────────────────────────────
document.addEventListener("DOMContentLoaded", function () {

    // Remove row button
    document.getElementById("removeRowBtn")?.addEventListener("click", function (e) {
        e.preventDefault();
        removeRow();
    });

    // Add Item button — listener only, no onclick in HTML
    document.querySelector('.add-item')?.addEventListener("click", function (e) {
        e.preventDefault();
        addRow();
    });

    // Touch-tracking on initial inputs
    document.querySelectorAll('input, select').forEach(input => {
        input.addEventListener('focus', () => input.setAttribute('data-touched', true));
        input.addEventListener('blur', checkInputs);
    });

    // ── Sync all non-first rows when row 1 hotel/unit/date changes ────────────
    const firstRow = document.querySelector('#invoiceTable tr');
    if (firstRow) {
        const hotelSel = firstRow.querySelector('.hotel');
        const unitInp  = firstRow.querySelector('.unit-number');
        const dateInp  = firstRow.querySelector('.date-received');

        function syncLockedRows() {
            const hotel = hotelSel?.value || "";
            const unit  = unitInp?.value  || "";
            const date  = dateInp?.value  || "";
            const allRows = document.querySelectorAll('#invoiceTable tr');
            Array.from(allRows).slice(1).forEach(row => {
                const rHotel  = row.querySelector('.hotel');
                const rHidden = row.querySelector('input[type="hidden"][name="hotel"]');
                const rUnit   = row.querySelector('.unit-number');
                const rDate   = row.querySelector('.date-received');
                if (rHotel)  rHotel.value  = hotel;
                if (rHidden) rHidden.value = hotel;
                if (rUnit)   rUnit.value   = unit;
                if (rDate)   rDate.value   = date;
            });
        }

        hotelSel?.addEventListener('change', syncLockedRows);
        unitInp?.addEventListener('input',  syncLockedRows);
        dateInp?.addEventListener('change', syncLockedRows);
    }
});

// ── One-click ✕ beside every invoice row ─────────────────────────────────────
(function () {
    function init() {
        if (document.getElementById('rowRail')) return;          // already running
        const body = document.getElementById('invoiceTable');    // the <tbody>
        if (!body) return;
        const tbl = body.closest('table');

        const style = document.createElement('style');
        style.textContent = `
          #rowRail { position: fixed; top: 0; left: 0; width: 0; height: 0; z-index: 9000; }
          .rr-btn {
            position: fixed; width: 34px; height: 34px; margin: 0 !important; padding: 0 !important;
            display: flex; align-items: center; justify-content: center;
            border-radius: 50%; border: 1.5px solid #f44336; background: #fff; color: #f44336;
            cursor: pointer; box-shadow: 0 2px 8px rgba(244,67,54,.25);
            transition: background .15s, color .15s, transform .15s;
          }
          .rr-btn svg { width: 16px; height: 16px; pointer-events: none; }
          .rr-btn:hover { background: #f44336; color: #fff; transform: scale(1.12); }
          body.dark-mode .rr-btn { background: #1a0d14; box-shadow: 0 0 10px rgba(244,67,54,.45); }
          body.dark-mode .rr-btn:hover { background: #f44336; color: #fff; }
          #invoiceTable tr.row-danger td { background: rgba(244,67,54,.12) !important; }
          @media print { #rowRail { display: none !important; } }
        `;
        document.head.appendChild(style);

        const rail = document.createElement('div');
        rail.id = 'rowRail';
        document.body.appendChild(rail);

        const ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
        let queued = false;

        function place() {
            queued = false;
            const rows = Array.from(body.rows);
            const t = tbl.getBoundingClientRect();
            const left = Math.min(t.right + 10, window.innerWidth - 44);
            while (rail.children.length > rows.length) rail.lastChild.remove();
            while (rail.children.length < rows.length) {
                const b = document.createElement('button');
                b.type = 'button';
                b.className = 'rr-btn';
                b.innerHTML = ICON;
                rail.appendChild(b);
            }
            rows.forEach((row, i) => {
                const b = rail.children[i];
                const r = row.getBoundingClientRect();
                b.style.top  = (r.top + r.height / 2 - 17) + 'px';
                b.style.left = left + 'px';
                b.dataset.i  = i;
                b.title = i === 0 ? 'Clear row 1' : 'Remove row ' + (i + 1);
            });
        }
        const schedule = () => { if (!queued) { queued = true; requestAnimationFrame(place); } };

        new MutationObserver(schedule).observe(body, { childList: true, subtree: true });
        if (window.ResizeObserver) new ResizeObserver(schedule).observe(tbl);
        window.addEventListener('resize', schedule);
        window.addEventListener('scroll', schedule, { passive: true });
        window.addEventListener('load', schedule);
        setInterval(schedule, 500);
        schedule();

        rail.addEventListener('mouseover', e => {
            const b = e.target.closest('.rr-btn');
            if (b) body.rows[b.dataset.i]?.classList.add('row-danger');
        });
        rail.addEventListener('mouseout', e => {
            const b = e.target.closest('.rr-btn');
            if (b) body.rows[b.dataset.i]?.classList.remove('row-danger');
        });
        rail.addEventListener('click', e => {
            const b = e.target.closest('.rr-btn');
            if (!b) return;
            const i = Number(b.dataset.i);
            const row = body.rows[i];
            if (!row) return;
            row.classList.remove('row-danger');
            if (i === 0) {
                resetRow1ToStandard();                       // keeps hotel / unit / date
                showPopup('info', 'Row 1 was cleared.', 'Hotel, unit and date were kept.', 3000);
            } else {
                body.deleteRow(i);
                showPopup('success', 'Row ' + (i + 1) + ' removed.', '', 2500);
            }
            updateGrandTotal();
            schedule();
        });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();