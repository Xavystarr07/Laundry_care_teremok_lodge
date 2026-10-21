// ============================================================
//  js/grandTotal.js — Fuel levy calculator
//  Updates the grand total live when fuel levy amount changes
//  Edit here if you want to add more levy types
// ============================================================

function updateGrandTotal() {
    const fuelInput = document.getElementById('fuelCost');
    const totalCell = document.getElementById('grandTotalCell');
    const baseEl    = document.getElementById('baseTotalValue');

    if (!fuelInput || !totalCell || !baseEl) return;

    const baseTotal   = parseFloat(baseEl.dataset.value) || 0;
    const fuelCost    = parseFloat(fuelInput.value)      || 0;
    const newTotal    = baseTotal + fuelCost;

    totalCell.innerHTML = '<strong>R ' + newTotal.toFixed(2) + '</strong>';
}

window.addEventListener('DOMContentLoaded', updateGrandTotal);

// Mirror typed date into print-visible div
const dateInput = document.getElementById('statementDates');
const datePrint = document.getElementById('statementDatesPrint');
if (dateInput && datePrint) {
    dateInput.addEventListener('input', function() {
        datePrint.textContent = this.value;
    });
}
