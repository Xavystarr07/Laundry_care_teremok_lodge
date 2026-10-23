(function () {
const $ = s => document.querySelector(s);
const api = (a, d = {}) => fetch('php/prices_api.php', { method: 'POST', body: new URLSearchParams({ a, ...d }) }).then(r => r.json());
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const S = p => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
const eye = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/>';
const IC = { save: S('<path d="M5 12.5l4.5 4.5L19 7"/>'), clock: S('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'), on: S(eye), off: S(eye + '<path d="M3 3l18 18"/>') };
let items = [];

function toast(m, bad) {
    const t = document.createElement('div');
    t.className = 'toast' + (bad ? ' bad' : ''); t.textContent = m;
    document.body.appendChild(t); setTimeout(() => t.remove(), 3500);
}

async function load() { const r = await api('list'); items = r.rows || []; render(); }

function render() {
    const q = $('#q').value.trim().toLowerCase();
    const rows = items.filter(i => !q || i.code.toLowerCase().includes(q) || i.description.toLowerCase().includes(q));
    $('#tb').innerHTML = '<thead><tr><th>Code</th><th>Description</th><th class="n">Price (R)</th><th></th></tr></thead><tbody>' +
        (rows.length ? rows.map(i => `<tr class="${i.active ? '' : 'off'}" data-c="${esc(i.code)}">
            <td><b>${esc(i.code)}</b></td>
            <td><input class="in d" value="${esc(i.description)}"></td>
            <td><input class="in p n" type="number" step="0.01" min="0" value="${Number(i.price).toFixed(2)}" style="max-width:110px"></td>
            <td class="acts">
                <button type="button" class="ib" data-a="save" title="Save changes">${IC.save}</button>
                <button type="button" class="ib" data-a="hist" title="Price history">${IC.clock}</button>
                <button type="button" class="ib" data-a="tog" title="${i.active ? 'Hide from invoices' : 'Show on invoices again'}">${i.active ? IC.on : IC.off}</button>
            </td></tr>`).join('') : '<tr><td colspan="4" class="empty">No items found</td></tr>') + '</tbody>';
}

$('#q').addEventListener('input', render);
$('#tb').addEventListener('input', e => e.target.closest('tr')?.classList.add('dirty'));
$('#tb').addEventListener('click', async e => {
    const b = e.target.closest('[data-a]'); if (!b) return;
    const tr = b.closest('tr'), code = tr.dataset.c;
    if (b.dataset.a === 'save') {
        const r = await api('save', { code, description: tr.querySelector('.d').value, price: tr.querySelector('.p').value });
        r.ok ? (toast('Saved'), load()) : toast(r.msg, true);
    } else if (b.dataset.a === 'tog') {
        const r = await api('toggle', { code }); r.ok ? load() : toast(r.msg, true);
    } else {
        const r = await api('history', { code });
        $('#hTitle').textContent = 'Price history — ' + code;
        $('#hBody').innerHTML = r.rows.length
            ? '<table class="mt"><thead><tr><th>Date</th><th class="n">Old</th><th class="n">New</th></tr></thead><tbody>' + r.rows.map(h => `<tr><td>${esc(h.changed_at.slice(0, 16))}</td><td class="n">${h.old_price == null ? '—' : Number(h.old_price).toFixed(2)}</td><td class="n">${Number(h.new_price).toFixed(2)}</td></tr>`).join('') + '</tbody></table>'
            : '<p style="color:#a5a3c9">No price changes recorded yet.</p>';
        $('#hm').hidden = false;
    }
});

$('#addBtn').onclick = () => { $('#addBox').hidden = !$('#addBox').hidden; $('#aCode').focus(); };
$('#aGo').onclick = async () => {
    const r = await api('add', { code: $('#aCode').value, description: $('#aDesc').value, price: $('#aPrice').value });
    if (!r.ok) return toast(r.msg, true);
    ['#aCode', '#aDesc', '#aPrice'].forEach(s => $(s).value = '');
    toast('Item added'); load();
};
$('#hClose').onclick = () => $('#hm').hidden = true;
$('#hm').addEventListener('click', e => { if (e.target.id === 'hm') $('#hm').hidden = true; });
load();
})();