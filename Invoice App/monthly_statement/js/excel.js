
(function () {
    if (window.__fuelInit) return;
    window.__fuelInit = true;
    document.addEventListener('click', e => {
        if (!e.target.closest('#fuelBtn')) return;
        const F = window.FUEL;
        if (!F) { alert('Fuel data missing. Run the teremok_periods SQL and reload.'); return; }
        document.getElementById('fuelOv')?.remove();
        const o = document.createElement('div');
        o.id = 'fuelOv';
        const inp = 'width:100%;box-sizing:border-box;padding:9px;margin:4px 0 12px;border:1.5px solid #d1d5db;border-radius:10px;font-size:15px';
        const bt = 'border:none;border-radius:20px;padding:10px 18px;font-weight:700;color:#fff;cursor:pointer;margin-right:8px;';
        o.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:99999;display:flex;align-items:center;justify-content:center;padding:12px';
        o.innerHTML = `<div style="background:#fff;color:#1f2937;border-radius:18px;padding:24px;width:320px;max-width:100%;font:14px 'Segoe UI',Arial,sans-serif;text-align:left">
            <b style="font-size:18px">⛽ Fuel levy</b><br><br>
            Days<input id="fuD" type="number" min="0" step="1" value="${F.days}" style="${inp}">
            Rate per day (R)<input id="fuR" type="number" min="0" step="0.01" value="${F.rate}" style="${inp}">
            <div id="fuT" style="font-weight:700;margin-bottom:14px"></div>
            <button type="button" id="fuS" style="${bt}background:#16a34a">Save</button>
            <button type="button" id="fuC" style="${bt}background:#6b7280">Cancel</button></div>`;
        document.body.appendChild(o);
        const d = o.querySelector('#fuD'), r = o.querySelector('#fuR'), t = o.querySelector('#fuT');
        const calc = () => t.textContent = 'Total: R ' + ((parseInt(d.value) || 0) * (parseFloat(r.value) || 0)).toFixed(2);
        d.oninput = r.oninput = calc; calc();
        o.querySelector('#fuC').onclick = () => o.remove();
        o.querySelector('#fuS').onclick = () => {
            fetch('php/save_fuel.php', { method: 'POST', body: new URLSearchParams({ id: F.id, days: d.value || 0, rate: r.value || 0 }) })
                .then(x => x.text())
                .then(s => { let j; try { j = JSON.parse(s); } catch (_) { alert('Server error: ' + s.slice(0, 200)); return; } j.ok ? location.reload() : alert(j.msg); })
                .catch(() => alert('Could not save fuel. Check your connection.'));
        };
    });
})();

const SEND = { email: '', whatsapp: '' };   // whatsapp like 27821234567 (no + or spaces)

async function exportExcel(mode) {
    const S = window.STMT;
    const long = s => new Date(s + 'T00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
    const msg = `Hi, please find the Laundry Care statement for ${long(S.start)} to ${long(S.end)}. Total: R ${Number(S.total).toFixed(2)}.`;
    if (mode === 'wa') { window.open('https://wa.me/' + SEND.whatsapp + '?text=' + encodeURIComponent(msg), '_blank'); return; }
    if (mode === 'mail') { location.href = 'mailto:' + SEND.email + '?subject=' + encodeURIComponent('Laundry Care Statement') + '&body=' + encodeURIComponent(msg); return; }
    if (typeof ExcelJS === 'undefined') { alert('Excel library did not load. Check your internet connection and refresh.'); return; }

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Statement', { views: [{ showGridLines: false }], pageSetup: { paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 0 } });
    ws.columns = [{ width: 24 }, { width: 22 }, { width: 24 }];
    const fill = c => ({ type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + c } });
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
    line(5, 'Sent to: Teremok Lodge & Spa, 49 Marine Drive, Umhlanga Rocks', { size: 12, color: { argb: 'FF111111' } });
    line(6, 'VAT # 4470205669', { size: 12, color: { argb: 'FF111111' } });
    line(7, 'Teremok Lodge & Spa', { bold: true, size: 14, color: { argb: 'FFFFFFFF' } }, '0D47A1');

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

    if (S.fuel && S.fuel.amount > 0) {
        ws.mergeCells(r, 1, r, 2);
        const fl = ws.getCell(r, 1), fa = ws.getCell(r, 3);
        fl.value = `Fuel (${S.fuel.days} days × R ${Number(S.fuel.rate).toFixed(2)})`;
        fa.value = Number(S.fuel.amount); fa.numFmt = '#,##0.00'; fa.alignment = { horizontal: 'right' };
        [fl, ws.getCell(r, 2), fa].forEach(c => { c.font = { size: 11, bold: true }; c.border = { bottom: { style: 'thin', color: { argb: 'FFC9D6E6' } } }; c.fill = fill('E8F1FB'); });
        r++;
    }

    const gt = r + 1;
    ws.mergeCells(gt, 1, gt, 2);
    ws.getCell(gt, 1).value = 'GRAND TOTAL';
    ws.getCell(gt, 3).value = (S.rows.length || (S.fuel && S.fuel.amount > 0)) ? { formula: `SUM(C9:C${r - 1})`, result: Number(S.total) } : 0;
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
    ws.getRow(6).height = 20;

    const buf = await wb.xlsx.writeBuffer();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
    a.download = `Teremok_Lodge_Statement_${S.start}_to_${S.end}.xlsx`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
const go = m => () => exportExcel(m);
document.getElementById('xl')?.addEventListener('click', go());
document.getElementById('xlMail')?.addEventListener('click', go('mail'));
document.getElementById('xlWa')?.addEventListener('click', go('wa'));