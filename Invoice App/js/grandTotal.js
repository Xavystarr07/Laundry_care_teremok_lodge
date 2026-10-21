// grandTotal.js - Grand total and per-row total calculation

function calculateGrandTotal() {
    updateGrandTotal();
}

function updateGrandTotal() {
    let grandTotal = 0;
    document.querySelectorAll('#invoiceTable .total').forEach(input => {
        grandTotal += parseFloat(input.value) || 0;
    });
    document.getElementById('grandTotal').textContent = grandTotal.toFixed(2);
    document.getElementById('grandTotalInput').value = grandTotal.toFixed(2);
}

function calculateTotal(input) {
    const row = input.closest('tr');
    const price = parseFloat(row.querySelector('.price')?.value);
    const qtyInput = row.querySelector('.quantity');
    const quantity = parseInt(qtyInput?.value);

    if (!price || !quantity) {
        row.querySelector('.total').value = "";
        updateGrandTotal();
        return;
    }

    const total = price * quantity;
    row.querySelector('.total').value = total.toFixed(2);
    updateGrandTotal();
}

function calculateCustomTotal(input) {
    const row = input.closest("tr");
    const price = parseFloat(row.querySelector(".price").value);
    const quantity = parseInt(row.querySelector(".quantity").value);

    if (!price || !quantity) {
        row.querySelector(".total").value = "";
        updateGrandTotal();
        return;
    }

    row.querySelector(".total").value = (price * quantity).toFixed(2);
    updateGrandTotal();
}

// Use event delegation so dynamically added rows are covered
document.addEventListener('DOMContentLoaded', function () {
    const invoiceTable = document.getElementById('invoiceTable');
    if (invoiceTable) {
        invoiceTable.addEventListener('input', function (e) {
            if (e.target.classList.contains('quantity')) {
                calculateTotal(e.target);
            }
        });
    }
});
