// scrollObserver.js - Automatically scrolls the page when new rows are added to the table

document.addEventListener('DOMContentLoaded', function () {
    const tableBody = document.querySelector('#invoiceTable tbody');

    if (!tableBody) return;

    const observer = new MutationObserver(() => {
        const lastRow = document.querySelector('#invoiceTable tbody tr:last-child');
        if (lastRow) {
            const rect = lastRow.getBoundingClientRect();
            if (rect.bottom > window.innerHeight - 50) {
                window.scrollBy({ top: 150, behavior: 'smooth' });
            }
        }
    });

    observer.observe(tableBody, { childList: true });
});
