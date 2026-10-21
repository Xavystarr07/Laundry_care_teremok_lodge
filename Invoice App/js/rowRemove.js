// rowRemove.js — one-click ✕ beside every invoice row (self-contained)
(function () {
    const body = document.getElementById('invoiceTable');   // the <tbody>
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
        const left = Math.min(t.right + 10, window.innerWidth - 44);   // never off-screen

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
    setInterval(schedule, 500);      // safety net for layout shifts
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
            resetRow1ToStandard();                 // row 1 keeps hotel / unit / date
            showPopup('info', 'Row 1 was cleared.', 'Hotel, unit and date were kept.', 3000);
        } else {
            body.deleteRow(i);
            showPopup('success', 'Row ' + (i + 1) + ' removed.', '', 2500);
        }
        updateGrandTotal();
        schedule();
    });
})();