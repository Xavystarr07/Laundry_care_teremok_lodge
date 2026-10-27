(function () {
const $ = s => document.querySelector(s);
const api = (a, d = {}) => fetch('php/saved_api.php', { method: 'POST', body: new URLSearchParams({ a, ...d }) }).then(r => r.json());
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const money = n => 'R ' + Number(n).toFixed(2);
const S = p => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
const IC = {
    edit: S('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>'),
    eye: S('<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/>'),
    trash: S('<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/>')
};
let cur = null, timer, filled = false;

function toast(m, bad) {
    const t = document.createElement('div');
    t.className = 'toast' + (bad ? ' bad' : ''); t.textContent = m;
    document.body.appendChild(t); setTimeout(() => t.remove(), 3500);
}

async function load() {
    const r = await api('list', { q: $('#q').value.trim(), per: $('#per').value });
    if (!r.ok) return toast(r.msg, true);
    if (!filled) { filled = true; $('#per').insertAdjacentHTML('beforeend', r.periods.map(p => `<option value="${p.id}">${esc(p.name)}</option>`).join('')); }
    $('#cnt').textContent = r.rows.length + ' invoice' + (r.rows.length === 1 ? '' : 's');
    $('#tb').innerHTML = r.rows.length
        ? '<thead><tr><th>Invoice</th><th>Date</th><th>Items</th><th class="n">Total</th><th>Period</th><th></th></tr></thead><tbody>' +
          r.rows.map(x => `<tr data-id="${x.id}"><td><b>#${x.num}</b></td><td>${x.dt.split('-').reverse().join('/')}</td><td>${x.items}</td><td class="n">${money(x.total)}</td>
            <td><em class="chip ${x.closed ? 'closed' : 'open'}">${esc(x.period)}</em></td>
            <td class="acts"><button type="button" class="ib" data-a="edit" title="${x.closed ? 'View' : 'Edit'}">${x.closed ? IC.eye : IC.edit}</button>${x.closed ? '' : `<button type="button" class="ib del" data-a="del" title="Delete">${IC.trash}</button>`}</td></tr>`).join('') + '</tbody>'
        : '<tbody><tr><td class="empty">No invoices found</td></tr></tbody>';
}

async function del(id) {
    if (!confirm('Delete this invoice permanently?')) return false;
    const r = await api('delete', { id });
    if (!r.ok) { toast(r.msg, true); return false; }
    toast('Invoice deleted'); load(); return true;
}

$('#tb').addEventListener('click', async e => {
    const b = e.target.closest('[data-a]'); if (!b) return;
    const id = b.closest('tr').dataset.id;
    if (b.dataset.a === 'del') return del(id);
    const r = await api('get', { id });
    if (!r.ok) return toast(r.msg, true);
    cur = { id: r.inv.id, orig: r.inv.num, num: String(r.inv.num), date: r.inv.dt, closed: !!r.inv.closed,
            items: r.items.map(i => ({ code: i.code, description: i.description, price: Number(i.price), qty: Number(i.qty) })) };
    $('#m').hidden = false; draw();
});

function draw() {
    const ro = cur.closed, tot = cur.items.reduce((s, i) => s + i.price * i.qty, 0);
    $('#mTitle').textContent = (ro ? 'Invoice #' : 'Edit invoice #') + cur.orig;
    const rows = cur.items.map((i, k) => `<tr data-k="${k}"><td><b>${esc(i.code)}</b><small>${esc(i.description)}</small></td><td class="n">${i.price.toFixed(2)}</td>
        <td><span class="q">${ro ? i.qty : `<button type="button" class="ib" data-q="-1">−</button>${i.qty}<button type="button" class="ib" data-q="1">+</button>`}</span></td>
        <td class="n">${(i.price * i.qty).toFixed(2)}</td><td class="acts">${ro ? '' : `<button type="button" class="ib del" data-q="x">${IC.trash}</button>`}</td></tr>`).join('');
    const add = ro ? '' : `<div class="addrow"><input class="in" id="eAdd" list="pl" placeholder="Add an item: type a code" autocomplete="off">
        <datalist id="pl">${priceList.map(p => `<option value="${esc(p.code)}">${esc(p.description)}</option>`).join('')}</datalist>
        <button type="button" class="btn" id="eAddBtn">Add</button></div>`;
    $('#mBody').innerHTML = (ro ? '<p class="note">This invoice is in a closed period, so it cannot be changed.</p>' : '') +
        `<div class="mrow"><label>Invoice no<input class="in" id="eNum" maxlength="5" value="${esc(cur.num)}" ${ro ? 'disabled' : ''}></label>
         <label>Date received<input class="in" id="eDate" type="date" value="${cur.date}" ${ro ? 'disabled' : ''}></label></div>
         <table class="mt"><thead><tr><th>Item</th><th class="n">Price</th><th>Qty</th><th class="n">Total</th><th></th></tr></thead><tbody>${rows}</tbody></table>
         ${add}<div class="mtot"><span>Total</span><b>${money(tot)}</b></div>`;
    $('#mFoot').innerHTML = ro ? '<button type="button" class="btn ghost" data-m="print">🖨️ Print</button><button type="button" class="btn ghost" data-m="close">Close</button>'
        : '<button type="button" class="btn red" data-m="del">Delete</button><button type="button" class="btn ghost" data-m="print">🖨️ Print</button><button type="button" class="btn ghost" data-m="close">Cancel</button><button type="button" class="btn" data-m="save">Save changes</button>';
}

function printSaved() {
    const tot = cur.items.reduce((s, i) => s + i.price * i.qty, 0);
    const n = cur.items.reduce((s, i) => s + i.qty, 0);
    const rows = cur.items.map(i => `<tr><td class="c">${esc(i.code)}</td><td>${esc(i.description)}</td><td class="n">R ${i.price.toFixed(2)}</td><td class="n">${i.qty}</td><td class="n"><b>R ${(i.price * i.qty).toFixed(2)}</b></td></tr>`).join('');
    const w = window.open('', '_blank', 'width=1000,height=800');
    if (!w) return toast('Allow pop-ups to print', true);
    w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${cur.orig}</title><style>
@page{size:A4;margin:12mm}*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',Arial,sans-serif;color:#1B2533;font-size:13px;padding:8px 10px;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.bar{height:8px;background:linear-gradient(90deg,#0D47A1,#2196F3);border-radius:4px;margin-bottom:22px}
.h{display:flex;justify-content:space-between}h1{font-size:28px;letter-spacing:3px;text-transform:uppercase;color:#111}
.tag{font-size:10.5px;letter-spacing:2px;color:#1565C0;font-weight:700}p,.ct{line-height:1.6;color:#222;margin-top:8px}.ct{text-align:right;margin:0}
.t{display:flex;justify-content:space-between;align-items:flex-end;margin:26px 0 14px;padding-bottom:10px;border-bottom:2px solid #111}
h2{font-size:26px;letter-spacing:6px;font-weight:300;text-transform:uppercase}.no{font-size:24px;font-weight:700;letter-spacing:3px}
.m{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:18px}.m div{background:#F3F3F3;border-left:4px solid #1565C0;border-radius:6px;padding:9px 12px}
.m span{display:block;font-size:10px;letter-spacing:1.3px;text-transform:uppercase;color:#5B6B7F;font-weight:700}.m strong{display:block;font-size:14px}.m em{display:block;font-style:normal;font-size:12px;color:#5B6B7F;margin-top:2px}
table{width:100%;border-collapse:collapse}th{background:#111;color:#fff;padding:10px 12px;text-align:left;font-size:11.5px;letter-spacing:1px;text-transform:uppercase}
td{padding:9px 12px;border-bottom:1px solid #C9D6E6}tbody tr:nth-child(even) td{background:#F7F7F7}.n{text-align:right}th.n{text-align:right}.c{font-family:Consolas,monospace;font-weight:700}
.g{display:flex;justify-content:flex-end;margin-top:18px}.b{min-width:280px;border:2px solid #111;border-radius:10px;overflow:hidden}
.b div{display:flex;justify-content:space-between;padding:8px 16px;color:#5B6B7F}.b .gt{background:#0D47A1;color:#fff;padding:13px 16px;font-weight:700}.gt strong{font-size:22px}
.f{margin-top:34px;padding-top:12px;border-top:1px solid #C9D6E6;text-align:center;color:#5B6B7F}
</style><link rel="manifest" href="manifest.json">
<meta name="theme-color" content="#0f0f1a">
</head><body><div class="bar"></div>
<div class="h"><div><h1>Laundry Care</h1><div class="tag">A FRESH START IN EVERY WASH</div><p>2 Tottenham Road<br>Parkgate<br>Cornubia</p></div>
<div class="ct"><b style="color:#1565C0">www.laundrycare.co.za</b><br>donovanmark14@gmail.com<br>laundry_care@outlook.com<br>062 283 9374<br>069 780 0340</div></div>
<div class="t"><h2>Invoice</h2><div class="no">${cur.orig}</div></div>
<div class="m"><div><span>Hotel</span><strong>Teremok Lodge &amp; Spa</strong><em>49 Marine Drive, Umhlanga Rocks<br>VAT # 4470205669</em></div><div><span>Unit</span><strong>All</strong></div><div><span>Date received</span><strong>${cur.date}</strong></div></div>
<table><thead><tr><th>Code</th><th>Description</th><th class="n">Unit Price</th><th class="n">Qty</th><th class="n">Total</th></tr></thead><tbody>${rows}</tbody></table>
<div class="g"><div class="b"><div><span>Total items</span><span>${n}</span></div><div class="gt"><span>GRAND TOTAL</span><strong>R ${tot.toFixed(2)}</strong></div></div></div>
<div class="f"><b>Thank you for your business</b></div>
<script>addEventListener('load',()=>setTimeout(()=>{onafterprint=()=>close();print()},400))<\/script><script>if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');</script>
</body></html>`);
    w.document.close();
}

function addItem() {
    const code = $('#eAdd').value.trim().toUpperCase(), p = priceList.find(x => x.code === code);
    if (!p) return toast('Pick a valid code from the list', true);
    const ex = cur.items.find(i => i.code === code);
    if (ex) ex.qty = Math.min(99, ex.qty + 1); else cur.items.push({ code, description: p.description, price: p.price, qty: 1 });
    draw();
}

$('#mBody').addEventListener('input', e => {
    if (e.target.id === 'eNum') { e.target.value = e.target.value.replace(/\D/g, '').slice(0, 5); cur.num = e.target.value; }
    if (e.target.id === 'eDate') cur.date = e.target.value;
});
$('#mBody').addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.id === 'eAdd') { e.preventDefault(); addItem(); } });
$('#mBody').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.id === 'eAddBtn') return addItem();
    const q = b.dataset.q; if (q === undefined) return;
    const k = +b.closest('tr').dataset.k;
    if (q === 'x') cur.items.splice(k, 1); else cur.items[k].qty = Math.min(99, Math.max(1, cur.items[k].qty + +q));
    draw();
});
$('#mFoot').addEventListener('click', async e => {
    const m = e.target.closest('[data-m]')?.dataset.m; if (!m) return;
    if (m === 'close') $('#m').hidden = true;
    if (m === 'print') printSaved();
    if (m === 'del' && await del(cur.id)) $('#m').hidden = true;
    if (m === 'save') {
        const r = await api('update', { id: cur.id, num: cur.num, date: cur.date, items: JSON.stringify(cur.items) });
        if (!r.ok) return toast(r.msg, true);
        $('#m').hidden = true; toast('Invoice saved'); load();
    }
});
$('#m').addEventListener('click', e => { if (e.target.id === 'm') $('#m').hidden = true; });
document.addEventListener('keydown', e => { if (e.key === 'Escape') $('#m').hidden = true; });
$('#q').addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(load, 250); });
$('#per').addEventListener('change', load);
load();
})();