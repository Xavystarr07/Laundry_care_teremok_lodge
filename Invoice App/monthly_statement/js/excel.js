function exportExcel() {
    const rows = [
        ['Laundry Care: Teremok Lodge'],
        [document.getElementById('statementDates')?.value || ''],
        [],
        ['Date', 'Invoice No', 'Amount (R)']
    ];
    let total = 0;
    document.querySelectorAll('#statementTable tbody tr').forEach(tr => {
        const td = tr.querySelectorAll('td');
        if (td.length !== 3 || tr.classList.contains('grand-total-row')) return;
        const amt = parseFloat(td[2].textContent.replace(/[^0-9.]/g, '')) || 0;
        total += amt;
        rows.push([td[0].textContent.trim(), Number(td[1].textContent.trim()), amt]);
    });
    rows.push([], ['Grand Total', '', total]);
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 16 }, { wch: 14 }, { wch: 16 }];
    Object.keys(ws).forEach(k => { if (k[0] === 'C' && ws[k].t === 'n') ws[k].z = '#,##0.00'; });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Statement');
    XLSX.writeFile(wb, 'Teremok_Statement.xlsx');
}