// invoiceFormat.js
// Digits only, max 5 chars, max value 50000
// NO auto-padding — user must type all 5 digits themselves
// saveInvoice.js enforces the 5-digit rule on submit

function formatInvoiceNumber(input) {
    let value = input.value.replace(/\D/g, '');
    if (value.length > 5) value = value.slice(0, 5);
    const num = parseInt(value, 10);
    if (!isNaN(num) && num > 50000) value = '50000';
    input.value = value;
}
