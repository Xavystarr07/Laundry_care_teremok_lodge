// Forces unit = "All" on every row, including rows built later
(function () {
    function fix() {
        document.querySelectorAll('#invoiceTable .unit-number').forEach(el => {
            if (el.type !== 'text') el.type = 'text';
            if (el.value !== 'All') el.value = 'All';
            el.readOnly = true;
        });
    }
    document.addEventListener('DOMContentLoaded', () => {
        fix();
        const t = document.getElementById('invoiceTable');
        if (t) new MutationObserver(fix).observe(t, { childList: true, subtree: true });
    });
})();