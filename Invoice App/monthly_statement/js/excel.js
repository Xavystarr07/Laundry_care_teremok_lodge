const SEND = { email: '', whatsapp: '' };   // whatsapp like 27821234567 (no + or spaces)

async function exportExcel(mode) {
    const w = mode === 'wa' ? window.open('', '_blank') : null;
    const S = window.STMT, wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Statement', { views: [{ showGridLines: false }], pageSetup: { paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 0 } });
    ws.columns = [{ width: 24 }, { width: 22 }, { width: 24 }];
    const fill = c => ({ type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + c } });
    const long = s => new Date(s + 'T00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
    const utc = s => { const [y, m, d] = s.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)); };
    const line = (r, text, font, bg) => {
        ws.mergeCells(r, 1, r, 3);
        const c = ws.getCell(r, 1);
        c.value = text; c.font = font;
        if (bg) for (let i = 1; i <= 3; i++) ws.getCell(r, i).fill = fill(bg);
    };

    line(1, 'Laundry Care Statement', { bold: true, size: 20, color: { argb: 'FF111111' } });
    line(2, '"A fresh start in every wash"', { bold: true, size: 10.5, color: { argb: 'FF1565C0' } });
    line(4, `Statement for period: ${long(S.start)} — ${long(S.end)}`, { bold: true, size: 12, color: { argb: 'FF111111' } });
    line(5, 'Sent to: Teremok Lodge', { size: 12, color: { argb: 'FF111111' } });
    line(7, 'Teremok Lodge', { bold: true, size: 14, color: { argb: 'FFFFFFFF' } }, '0D47A1');

    ['Date', 'Invoice No', 'Amount'].forEach((h, i) => {
        const c = ws.getCell(8, i + 1);
        c.value = h; c.font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } }; c.fill = fill('111111');
        c.alignment = { horizontal: i === 2 ? 'right' : 'left' };
    });

    let r = 9;
    S.rows.forEach((row, i) => {
        const cells = [ws.getCell(r, 1), ws.getCell(r, 2), ws.getCell(r, 3)];
        cells[0].value = utc(row.DateReceived); cells[0].numFmt = 'dd/mm/yyyy'; cells[0].alignment = { horizontal: 'left' };
        cells[1].value = Number(row.InvoiceNumber); cells[1].numFmt = '0'; cells[1].alignment = { horizontal: 'left' };
        cells[2].value = Number(row.Total); cells[2].numFmt = '#,##0.00'; cells[2].alignment = { horizontal: 'right' };
        cells.forEach(c => {
            c.font = { size: 11, bold: c === cells[2] };
            c.border = { bottom: { style: 'thin', color: { argb: 'FFC9D6E6' } } };
            if (i % 2) c.fill = fill('F7F7F7');
        });
        r++;
    });

    const gt = r + 1;
    ws.mergeCells(gt, 1, gt, 2);
    ws.getCell(gt, 1).value = 'GRAND TOTAL';
    ws.getCell(gt, 3).value = S.rows.length ? { formula: `SUM(C9:C${r - 1})`, result: Number(S.total) } : 0;
    ws.getCell(gt, 3).numFmt = '"R" #,##0.00';
    for (let i = 1; i <= 3; i++) {
        const c = ws.getCell(gt, i);
        c.fill = fill('0D47A1'); c.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
    }
    ws.getCell(gt, 3).alignment = { horizontal: 'right' };

    ws.eachRow((row, n) => {
        row.height = n === 1 ? 34 : n === 7 ? 30 : n >= 8 ? 26 : 20;
        row.eachCell(c => {
            c.alignment = { horizontal: 'left', ...c.alignment, vertical: 'middle', indent: 1 };
        });
    });
    ws.getRow(3).height = 10;
    ws.getRow(6).height = 14;

    const buf = await wb.xlsx.writeBuffer();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
    a.download = `Teremok_Lodge_Statement_${S.start}_to_${S.end}.xlsx`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    const msg = `Hi, please find the Laundry Care statement for ${long(S.start)} to ${long(S.end)}. Total: R ${Number(S.total).toFixed(2)}.`;
    if (w) w.location = 'https://wa.me/' + SEND.whatsapp + '?text=' + encodeURIComponent(msg);
    else if (mode === 'mail') location.href = 'mailto:' + SEND.email + '?subject=' + encodeURIComponent('Laundry Care Statement') + '&body=' + encodeURIComponent(msg + '\n\nPlease attach the downloaded Excel file.');
}
const go = m => () => exportExcel(m);
document.getElementById('xl')?.addEventListener('click', go());
document.getElementById('xlMail')?.addEventListener('click', go('mail'));
document.getElementById('xlWa')?.addEventListener('click', go('wa'));