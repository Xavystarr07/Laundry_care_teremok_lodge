// comboModal.js - Combo selection modal: render, navigate, and insert rows

let selectedCombos = new Set();
let currentCategoryIndex = 0;
const categoryNames = Object.keys(categories);
let isAddingCombo = false;

function openComboModal() {
    // Block if unit number not filled
    const unitVal = document.querySelector('#invoiceTable .unit-number')?.value?.trim();
    if (!unitVal) {
        showPopup('warning',
            'Unit number is required before adding a combo.',
            '💡 Fill in the Hotel and Unit Number first, then add your combo.',
            0
        );
        if (typeof showFieldGuide === 'function') {
            showFieldGuide('guide', '🔑', 'Unit Number Needed',
                'You need to enter a unit number before adding a combo.',
                'Fill in the Unit Number field for this hotel, then click Add Combo again.',
                false, 0
            );
        }
        return;
    }

    selectedCombos.clear();
    currentCategoryIndex = 0;
    renderCategories();
    document.getElementById("comboModal").style.display = "block";
}

function closeComboModal() {
    document.getElementById("comboModal").style.display = "none";
}

function toggleCombo(code) {
    if (selectedCombos.has(code)) {
        selectedCombos.delete(code);
    } else {
        selectedCombos.add(code);
    }
}

function renderCategories() {
    const container = document.getElementById("categoryContainer");
    container.innerHTML = "";

    const categoryName = categoryNames[currentCategoryIndex];
    const combos = categories[categoryName];

    const navHTML = `
        <div style="display:flex; justify-content:space-between; margin-bottom:15px;">
            <button type="button" onclick="prevCategory()" ${currentCategoryIndex === 0 ? "disabled" : ""}>⟵ Previous</button>
            <strong>${categoryName}</strong>
            <button type="button" onclick="nextCategory()" ${currentCategoryIndex === categoryNames.length - 1 ? "disabled" : ""}>Next ⟶</button>
        </div>
    `;

    const checkboxes = combos.map(combo => `
        <label style="
            display: grid;
            grid-template-columns: 1fr auto;
            align-items: start;
            margin-bottom: 10px;
            padding: 8px 12px;
            border: 1px solid #eee;
            border-radius: 6px;
            background: #f9f9f9;
            font-family: 'Segoe UI', sans-serif;
            font-size: 14px;
            line-height: 1.4;
        ">
            <span>${comboDetails[combo].name}</span>
            <input type="checkbox" value="${combo}" onchange="toggleCombo('${combo}')" style="margin-left: 10px;">
        </label>
    `).join('');

    container.innerHTML = navHTML + checkboxes;
}

function prevCategory() {
    if (currentCategoryIndex > 0) { currentCategoryIndex--; renderCategories(); }
}

function nextCategory() {
    if (currentCategoryIndex < categoryNames.length - 1) { currentCategoryIndex++; renderCategories(); }
}

function insertSelectedCombos(e) {
    e.preventDefault();

    if (selectedCombos.size === 0) { closeComboModal(); return; }

    isAddingCombo = true;

    const { hotel, unit, date } = getRow1Values();
    const table    = document.getElementById("invoiceTable");
    const firstRow = table.rows[0];

    let firstQty        = firstRow.querySelector(".quantity");
    let isFirstRowEmpty = !firstQty || firstQty.value === "";

    const insertedQuantities = [];

    selectedCombos.forEach(combo => {
        const codes = comboDetails[combo]?.codes || [];

        codes.forEach(code => {
            const item = priceList.find(i => i.code === code);
            if (!item) return;

            let row;
            if (isFirstRowEmpty) {
                row = firstRow;
                isFirstRowEmpty = false;
            } else {
                row = table.insertRow();
            }

            const isFirst = (row === firstRow);

            row.innerHTML = isFirst ? `
                <td>
                    <select class="hotel" name="hotel" id="hotelSelect" onchange="updateUnitDatalist(this)">
                        ${getHotelOptionsHTML(hotel)}
                    </select>
                </td>
                <td><input type="number" name="unit-number" class="unit-number" value="${unit}" placeholder="Unit Number"></td>
                <td><input type="text" class="code" value="${item.code}"></td>
                <td><input type="text" class="description" readonly value="${item.description}"></td>
                <td><input type="number" class="price" readonly value="${item.price.toFixed(2)}"></td>
                <td>
                    <input type="number" class="quantity" min="1" list="quantity-list">
                    <datalist id="quantity-list">
                        ${Array.from({ length: 20 }, (_, i) => `<option value="${i + 1}">`).join('')}
                    </datalist>
                </td>
                <td><input type="number" class="total" readonly></td>
                <td><input type="date" class="date-received" name="date_received" value="${date}" required></td>
            ` : `
                <td>
                    <select class="hotel" name="hotel" disabled>
                        ${getHotelOptionsHTML(hotel)}
                    </select>
                    <input type="hidden" name="hotel" value="${hotel}">
                </td>
                <td><input type="number" class="unit-number" name="unit-number" value="${unit}" readonly></td>
                <td><input type="text" class="code" value="${item.code}"></td>
                <td><input type="text" class="description" readonly value="${item.description}"></td>
                <td><input type="number" class="price" readonly value="${item.price.toFixed(2)}"></td>
                <td>
                    <input type="number" class="quantity" min="1" list="quantity-list">
                    <datalist id="quantity-list">
                        ${Array.from({ length: 20 }, (_, i) => `<option value="${i + 1}">`).join('')}
                    </datalist>
                </td>
                <td><input type="number" class="total" readonly></td>
                <td><input type="date" class="date-received" name="date_received" value="${date}" readonly></td>
            `;

            row.querySelectorAll('input, select').forEach(el => {
                el.addEventListener('focus', () => el.setAttribute('data-touched', true));
                el.addEventListener('blur', checkInputs);
            });

            // Attach quantity → total calculation
            const qtyInput = row.querySelector('.quantity');
            if (qtyInput) {
                qtyInput.addEventListener('input', () => calculateTotal(qtyInput));
                insertedQuantities.push(qtyInput);
            }
        });
    });

    closeComboModal();
    isAddingCombo = false;

    // Walk through ALL inserted quantities in order, first row first
    if (insertedQuantities.length > 0) {
        setTimeout(() => walkComboQuantities(insertedQuantities), 80);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("comboAddBtn")?.addEventListener("click", openComboModal);
    document.getElementById("comboCancelBtn")?.addEventListener("click", closeComboModal);
    document.getElementById("comboConfirmBtn")?.addEventListener("click", insertSelectedCombos);

    document.getElementById("comboModal")?.addEventListener("keydown", function (e) {
        if (e.key === "Enter") { e.preventDefault(); insertSelectedCombos(e); }
    });
});

// ── New combo modal rendering (tabs, cards, live count) ─────────────────────
function buildTabs() {
    return categoryNames.map((name, i) => {
        const n = categories[name].filter(c => selectedCombos.has(c)).length;
        return `<button type="button" class="cm-tab${i === currentCategoryIndex ? ' active' : ''}" onclick="goCategory(${i})">${name}${n ? `<span class="cm-n">${n}</span>` : ''}</button>`;
    }).join('');
}

function renderCategories() {
    const container = document.getElementById("categoryContainer");
    const cards = categories[categoryNames[currentCategoryIndex]].map(combo => {
        const d = comboDetails[combo];
        return `
        <label class="cm-card">
            <input type="checkbox" value="${combo}" ${selectedCombos.has(combo) ? 'checked' : ''}
                   onchange="toggleCombo('${combo}'); updateComboCount();">
            <span class="cm-check"></span>
            <span class="cm-info">
                <span class="cm-name">${d.name}</span>
                <span class="cm-codes">${d.codes.join(' · ')}</span>
            </span>
            <span class="cm-badge">${combo}</span>
        </label>`;
    }).join('');
    container.innerHTML = `<div class="cm-tabs">${buildTabs()}</div><div class="cm-list">${cards}</div>`;
    updateComboCount();
}

function goCategory(i) {
    currentCategoryIndex = i;
    renderCategories();
}

function updateComboCount() {
    const n = selectedCombos.size;
    const el = document.getElementById('comboCount');
    if (el) el.textContent = n ? `${n} combo${n === 1 ? '' : 's'} selected` : 'Nothing selected yet';
    const tabs = document.querySelector('#categoryContainer .cm-tabs');
    if (tabs) tabs.innerHTML = buildTabs();
}

document.addEventListener('DOMContentLoaded', () => {
    const m = document.getElementById('comboModal');
    m?.addEventListener('click', e => { if (e.target === m) closeComboModal(); });
});
document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && document.getElementById('comboModal')?.style.display === 'block') closeComboModal();
});