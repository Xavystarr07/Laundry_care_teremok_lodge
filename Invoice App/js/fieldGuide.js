// fieldGuide.js — Assistance tool (regular invoice page)
// Guide order: invoice number → date (calendar opens) → hotel → unit → code → quantity.
// After the quantity the item is complete; you can add another item or finish.
// Exit any time: Exit guide / ✕ / Esc.

(function () {

const style = document.createElement('style');
style.textContent = `
  #fieldGuide {
    --fg-bg:#ffffff; --fg-text:#1f2937; --fg-muted:#6b7280; --fg-line:#e5e7eb; --fg-soft:#f3f4f6;
    --fg-accent:#2563eb; --fg-accent-soft:#dbeafe;
    position: fixed; left: 24px; bottom: 250px;
    width: 380px; max-width: calc(100vw - 48px); max-height: calc(100vh - 280px);
    background: var(--fg-bg); color: var(--fg-text);
    border: 1px solid var(--fg-line); border-radius: 20px;
    box-shadow: 0 20px 50px rgba(15,23,42,0.22);
    font-family: 'Segoe UI', Arial, sans-serif; font-size: 14px;
    z-index: 99998; overflow-x: hidden; overflow-y: auto;
    opacity: 0; transform: translateY(10px); pointer-events: none;
    transition: opacity 0.25s ease, transform 0.25s ease;
  }
  #fieldGuide.fg-show { opacity: 1; transform: none; pointer-events: all; }
  body.dark-mode #fieldGuide {
    --fg-bg:#171a2b; --fg-text:#f1f2fa; --fg-muted:#a6a9c4; --fg-line:#2b2f4d; --fg-soft:#20243c;
    --fg-accent:#7aa2ff; --fg-accent-soft:rgba(122,162,255,0.16);
    box-shadow: 0 20px 50px rgba(0,0,0,0.6);
  }
  #fieldGuide.fg-error   { --fg-accent:#e11d48; --fg-accent-soft:#ffe4e6; }
  #fieldGuide.fg-success { --fg-accent:#16a34a; --fg-accent-soft:#dcfce7; }
  #fieldGuide.fg-guide   { --fg-accent:#d97706; --fg-accent-soft:#fef3c7; }
  body.dark-mode #fieldGuide.fg-error   { --fg-accent:#fb7185; --fg-accent-soft:rgba(251,113,133,0.16); }
  body.dark-mode #fieldGuide.fg-success { --fg-accent:#4ade80; --fg-accent-soft:rgba(74,222,128,0.16); }
  body.dark-mode #fieldGuide.fg-guide   { --fg-accent:#fbbf24; --fg-accent-soft:rgba(251,191,36,0.16); }

  #fgHeader { display:flex; align-items:center; gap:14px; padding:20px 20px 12px; }
  #fgIcon { width:44px; height:44px; flex-shrink:0; border-radius:14px; background:var(--fg-accent-soft);
            display:flex; align-items:center; justify-content:center; font-size:22px; }
  #fgTitleWrap { flex:1; min-width:0; }
  #fgHeaderText { font-size:17px; font-weight:700; line-height:1.25; color:var(--fg-text); }
  #fgSub { margin-top:2px; font-size:12.5px; font-weight:600; color:var(--fg-accent); }
  #fgClose { width:32px; height:32px; flex-shrink:0; border-radius:50%; border:none;
             background:var(--fg-soft); color:var(--fg-muted); font-size:14px; cursor:pointer; line-height:1;
             margin:0 !important; padding:0 !important; box-shadow:none !important; transition:background .2s,color .2s; }
  #fgClose:hover { background:var(--fg-accent-soft); color:var(--fg-accent); transform:none; }

  #fgBody { padding:4px 20px 6px; }
  #fgMsg { font-size:15px; line-height:1.6; font-weight:500; color:var(--fg-text); }
  #fgStep { margin-top:14px; padding:12px 14px; display:none; background:var(--fg-soft);
            border-left:4px solid var(--fg-accent); border-radius:12px; font-size:13.5px; line-height:1.55; color:var(--fg-text); }

  #fgProgressWrap { padding:16px 20px 0; display:none; }
  #fgProgress { height:6px; background:var(--fg-soft); border-radius:6px; overflow:hidden; }
  #fgProgressBar { height:100%; width:0; background:var(--fg-accent); border-radius:6px; transition:width .4s ease; }
  #fgProgressText { margin-top:6px; font-size:12px; font-weight:600; color:var(--fg-muted); }

  #fgActions { display:flex; flex-wrap:wrap; gap:10px; padding:18px 20px 20px; }
  .fg-btn { border:none; border-radius:12px; padding:11px 18px; font-size:14px; font-weight:700; font-family:inherit;
            cursor:pointer; margin:0 !important; box-shadow:none !important; transition:filter .15s; }
  .fg-btn:hover { filter:brightness(1.08); transform:none; }
  .fg-btn.primary { background:var(--fg-accent); color:#fff; }
  body.dark-mode .fg-btn.primary { color:#0b1020; }
  .fg-btn.ghost { background:var(--fg-soft); color:var(--fg-text); }
  .fg-btn.exit { background:transparent; color:var(--fg-muted); border:1.5px solid var(--fg-line) !important; margin-left:auto !important; }
  .fg-btn.exit:hover { color:#e11d48; border-color:#e11d48 !important; }

  .fg-target { outline:3px solid #f59e0b !important; outline-offset:2px; animation:fgRing 1.4s ease-in-out infinite; }
  @keyframes fgRing { 0%,100% { box-shadow:0 0 0 0 rgba(245,158,11,.55); } 50% { box-shadow:0 0 0 9px rgba(245,158,11,0); } }

  /* Help button — blue neon, bottom-left above Switch Mode */
  #fgTinker {
    position:fixed; left:24px; bottom:192px;
    height:44px; min-width:44px; max-width:44px; padding:0 12px;
    display:flex; flex-direction:row; align-items:center; justify-content:flex-start;
    border-radius:22px; overflow:hidden; cursor:pointer;
    background:linear-gradient(135deg,#021a3a,#0a4a9e); color:#4dc3ff;
    border:1.5px solid #22b8ff;
    box-shadow:0 0 10px rgba(34,184,255,.55), inset 0 0 8px rgba(34,184,255,.15);
    z-index:99998; margin:0 !important;
    transition:max-width .35s ease, box-shadow .3s;
  }
  #fgTinker svg { width:20px; height:20px; flex-shrink:0; }
  #fgTinkerLabel { max-width:0; opacity:0; overflow:hidden; white-space:nowrap; font-size:13px; font-weight:700;
                   font-family:'Segoe UI',Arial,sans-serif; margin-left:0;
                   transition:max-width .35s ease, opacity .25s ease, margin .35s ease; }
  #fgTinker:hover, #fgTinker:focus-visible { max-width:240px; transform:none;
                   box-shadow:0 0 18px rgba(34,184,255,.9), inset 0 0 10px rgba(34,184,255,.25); }
  #fgTinker:hover #fgTinkerLabel, #fgTinker:focus-visible #fgTinkerLabel { max-width:170px; opacity:1; margin-left:10px; }
  #fgTinker .fg-badge { position:absolute; top:4px; right:4px; width:10px; height:10px; background:#ef4444;
                        border:2px solid #021a3a; border-radius:50%; display:none; }
  #fgTinker.has-errors { animation:fgNeon 2s ease-in-out infinite; }
  #fgTinker.has-errors .fg-badge { display:block; }
  @keyframes fgNeon { 0%,100% { box-shadow:0 0 10px rgba(34,184,255,.55); } 50% { box-shadow:0 0 24px rgba(34,184,255,1); } }
`;
document.head.appendChild(style);

// ── DOM ──────────────────────────────────────────────────────────────────────
const guide = document.createElement('div');
guide.id = 'fieldGuide';
guide.setAttribute('role', 'dialog');
guide.setAttribute('aria-label', 'Assistance tool');
guide.innerHTML = `
  <div id="fgHeader">
    <div id="fgIcon">🧾</div>
    <div id="fgTitleWrap"><div id="fgHeaderText">Assistance tool</div><div id="fgSub"></div></div>
    <button id="fgClose" type="button" title="Close">✕</button>
  </div>
  <div id="fgBody"><div id="fgMsg"></div><div id="fgStep"></div></div>
  <div id="fgProgressWrap">
    <div id="fgProgress"><div id="fgProgressBar"></div></div>
    <div id="fgProgressText"></div>
  </div>
  <div id="fgActions">
    <button type="button" class="fg-btn primary" id="fgStart">Guide me</button>
    <button type="button" class="fg-btn primary" id="fgNext">Looks right — Next</button>
    <button type="button" class="fg-btn primary" id="fgAdd">+ Add another item</button>
    <button type="button" class="fg-btn primary" id="fgDone">Got it</button>
    <button type="button" class="fg-btn ghost" id="fgSkip">Skip</button>
    <button type="button" class="fg-btn exit" id="fgExit">Exit guide</button>
  </div>
`;
document.body.appendChild(guide);

const tinker = document.createElement('button');
tinker.id = 'fgTinker';
tinker.type = 'button';
tinker.setAttribute('aria-label', 'Assistance tool');
tinker.innerHTML = `
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/>
    <line x1="4.93" y1="4.93" x2="9.17" y2="9.17"/><line x1="14.83" y1="14.83" x2="19.07" y2="19.07"/>
    <line x1="14.83" y1="9.17" x2="19.07" y2="4.93"/><line x1="4.93" y1="19.07" x2="9.17" y2="14.83"/>
  </svg>
  <span id="fgTinkerLabel">Assistance tool</span>
  <span class="fg-badge"></span>
`;
document.body.appendChild(tinker);

// ── Refs / state ─────────────────────────────────────────────────────────────
const q = s => guide.querySelector(s);
const fgIcon = q('#fgIcon'), fgTitle = q('#fgHeaderText'), fgSub = q('#fgSub');
const fgMsg = q('#fgMsg'), fgStep = q('#fgStep');
const fgProgWrap = q('#fgProgressWrap'), fgBar = q('#fgProgressBar'), fgBarText = q('#fgProgressText');
const btn = { start: q('#fgStart'), next: q('#fgNext'), add: q('#fgAdd'), done: q('#fgDone'), skip: q('#fgSkip'), exit: q('#fgExit') };

let guiding = false, userHasInteracted = false;
let current = null, stopWatch = null, closeTimer = null, doneCount = 0;
const skipped = new Set();
const confirmed = new Set();     // 'date' / 'hotel' already confirmed this session

// ── Helpers ──────────────────────────────────────────────────────────────────
function fgFlash(el) { el.classList.add('field-ok'); setTimeout(() => el.classList.remove('field-ok'), 2000); }
function fgIsCustom(row) { const p = row?.querySelector('.price'); return !!p && !p.hasAttribute('readonly'); }
function fgCodeValid(code) {
    if (typeof priceList === 'undefined') return true;
    const t = (code || '').trim().toUpperCase();
    return priceList.some(i => i.code.toUpperCase() === t);
}
function clearTarget() { document.querySelectorAll('.fg-target').forEach(e => e.classList.remove('fg-target')); }

const GUIDANCE = {
    invoice:        { icon:'🔢', msg:'Type the 5-digit number from the invoice slip.',  step:'Example: 10042' },
    date:           { icon:'📅', msg:'Choose the day the laundry was received.',        step:'Pick a day on the calendar — or press Next if the date shown is right.' },
    hotel:          { icon:'🏨', msg:'Choose the hotel for this invoice.',              step:'Pick it from the list — or press Next if it is already right.' },
    unit:           { icon:'🔑', msg:'Enter the unit number.',                          step:'Pick a number from the list or type it.' },
    code:           { icon:'🏷️', msg:'Enter the item code.',                            step:'Type a few letters (e.g. TWL), then pick the item from the list.' },
    'code-invalid': { icon:'⚠️', msg:"That code isn't on the price list.",              step:'Clear it, type a few letters again and pick one from the list.' },
    description:    { icon:'📝', msg:'Describe this custom item.',                      step:'Type a short name, then press Tab.' },
    price:          { icon:'💰', msg:'Enter the price for one item.',                   step:'Type it in Rands (e.g. 25.50), then press Tab.' },
    quantity:       { icon:'🔢', msg:'How many of this item?',                          step:'Type a number (e.g. 2), then press Tab.' }
};

// ── Panel ────────────────────────────────────────────────────────────────────
function show(o) {
    if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; }
    guide.className = 'fg-show fg-' + (o.type || 'info');
    fgIcon.textContent  = o.icon  || '🧾';
    fgTitle.textContent = o.title || 'Assistance tool';
    fgSub.textContent   = o.sub   || '';
    fgSub.style.display = o.sub ? 'block' : 'none';
    fgMsg.textContent   = o.msg   || '';
    fgStep.textContent  = o.step  || '';
    fgStep.style.display = o.step ? 'block' : 'none';

    if (o.progress == null) fgProgWrap.style.display = 'none';
    else { fgProgWrap.style.display = 'block'; fgBar.style.width = o.progress + '%'; fgBarText.textContent = o.progressText || ''; }

    const b = o.buttons || [];
    Object.keys(btn).forEach(k => btn[k].style.display = b.includes(k) ? '' : 'none');
    btn.start.textContent = o.startText || 'Guide me';
    btn.done.textContent  = o.doneText  || 'Got it';
    btn.done.className = 'fg-btn ' + (b.includes('add') ? 'ghost' : 'primary');

    if (o.autoDismiss > 0) closeTimer = setTimeout(() => { if (!guiding) hidePanel(); }, o.autoDismiss);
}
function hidePanel() { guide.classList.remove('fg-show'); clearTarget(); }

function exitGuide() {
    guiding = false; current = null; doneCount = 0;
    if (stopWatch) { stopWatch(); stopWatch = null; }
    skipped.clear(); confirmed.clear();
    hidePanel();
}

// ── What's missing ───────────────────────────────────────────────────────────
function findErrors() {
    const out = [];
    const inv = document.getElementById('invoice_number');
    if (inv && inv.value.replace(/\D/g, '').length < 5) out.push({ el: inv, field: 'invoice', label: 'Invoice number' });

    const rows = Array.from(document.querySelectorAll('#invoiceTable tr'));
    const multi = rows.length > 1;
    rows.forEach((row, i) => {
        const tag = multi ? ` (row ${i + 1})` : '';
        const add = (el, field, label) => out.push({ el, field, label: label + tag });

        if (i === 0) { const d = row.querySelector('.date-received'); if (d && !d.value) add(d, 'date', 'Date received'); }
        const hotel = row.querySelector('.hotel');
        if (hotel && !hotel.disabled && !hotel.value) add(hotel, 'hotel', 'Hotel');
        const unit = row.querySelector('.unit-number');
        if (unit && !unit.hasAttribute('readonly') && !unit.value.trim()) add(unit, 'unit', 'Unit number');

        const code = row.querySelector('.code');
        if (code) {
            if (!code.value.trim()) add(code, 'code', 'Item code');
            else if (!fgIsCustom(row) && !fgCodeValid(code.value)) add(code, 'code-invalid', 'Invalid item code');
        }
        if (fgIsCustom(row)) {
            const desc = row.querySelector('.description');
            if (desc && !desc.value.trim()) add(desc, 'description', 'Description');
            const price = row.querySelector('.price');
            if (price && (!price.value || parseFloat(price.value) <= 0)) add(price, 'price', 'Unit price');
        }
        const qty = row.querySelector('.quantity');
        if (qty && !qty.value.trim()) add(qty, 'quantity', 'Quantity');
    });
    return out;
}

function isFixed(e) {
    if (e.confirm) return true;                 // date / hotel: any change counts
    const v = e.el.value || '';
    switch (e.field) {
        case 'invoice':      return v.replace(/\D/g, '').length === 5;
        case 'date': case 'hotel': return !!v;
        case 'unit': case 'code': case 'description': return !!v.trim();
        case 'code-invalid': return fgCodeValid(v);
        case 'price':        return parseFloat(v) > 0;
        case 'quantity':     return parseInt(v) > 0;
    }
    return false;
}

// Ordered steps still to do: invoice → date → hotel → everything else
function pendingSteps() {
    const errs = findErrors().filter(e => !skipped.has(e.el));
    const list = [];
    const inv = errs.find(e => e.field === 'invoice');
    if (inv) list.push(inv);

    const row1 = document.querySelector('#invoiceTable tr');
    [['date', '.date-received', 'Date received'], ['hotel', '.hotel', 'Hotel']].forEach(([field, sel, label]) => {
        const el = row1?.querySelector(sel);
        if (el && !confirmed.has(field) && !skipped.has(el)) list.push({ field, el, label, confirm: true });
    });
    errs.forEach(e => { if (!list.some(x => x.el === e.el)) list.push(e); });
    return list;
}

const pct = left => { const t = doneCount + left; return t ? Math.round((doneCount / t) * 100) : 100; };

// ── Guided walkthrough ───────────────────────────────────────────────────────
function watch(e, onFixed) {
    let fired = false;
    const evs = (e.field === 'date' || e.field === 'hotel') ? ['change'] : ['blur', 'change'];
    const handler = () => { if (fired || !isFixed(e)) return; fired = true; stop(); onFixed(); };
    const stop = () => evs.forEach(n => e.el.removeEventListener(n, handler));
    evs.forEach(n => e.el.addEventListener(n, handler));
    return stop;
}

function startGuide() { guiding = true; doneCount = 0; skipped.clear(); nextStep(); }

function nextStep() {
    if (stopWatch) { stopWatch(); stopWatch = null; }
    clearTarget();

    const pending = pendingSteps();
    if (!pending.length) { finishGuide(); return; }

    const cur = pending[0];
    current = cur;
    const total = doneCount + pending.length;
    const g = GUIDANCE[cur.field] || { icon: '❓', msg: 'This field needs attention.', step: 'Fill it in.' };

    show({
        type: 'guide', icon: g.icon, title: cur.label,
        sub: `Step ${doneCount + 1} of ${total}`,
        msg: g.msg, step: g.step,
        progress: pct(pending.length), progressText: `${pending.length} left`,
        buttons: cur.confirm ? ['next', 'exit'] : ['skip', 'exit']
    });

    cur.el.classList.add('fg-target');
    cur.el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => {
        if (!guiding || current !== cur) return;
        cur.el.focus({ preventScroll: true });
        if (cur.confirm) { try { cur.el.showPicker && cur.el.showPicker(); } catch (e) {} }   // opens calendar / list
    }, 400);

    stopWatch = watch(cur, () => completeStep(cur));
}

function completeStep(cur) {
    if (!guiding || current !== cur) return;
    if (stopWatch) { stopWatch(); stopWatch = null; }
    if (cur.confirm) confirmed.add(cur.field);
    doneCount++;
    fgFlash(cur.el);
    cur.el.classList.remove('fg-target');
    const left = pendingSteps().length;
    show({
        type: 'success', icon: '✅', title: 'Nice!',
        msg: left ? 'Done. Moving to the next step…' : 'Done.',
        progress: pct(left), progressText: `${left} left`, buttons: ['exit']
    });
    setTimeout(() => { if (guiding) nextStep(); }, 600);
}

function finishGuide() {
    clearTarget(); current = null; guiding = false;
    const stillMissing = findErrors().length;
    if (stillMissing) {
        show({
            type: 'guide', icon: '⏭️', title: 'Almost there',
            msg: `${stillMissing} field${stillMissing === 1 ? ' is' : 's are'} still empty (you skipped them). They are needed before you can save.`,
            buttons: ['start', 'done'], startText: 'Guide me again', doneText: 'Close'
        });
        return;
    }
    show({
        type: 'success', icon: '🎉', title: 'Item complete',
        msg: 'This item is filled in.',
        step: 'Need another item? Add it and I will guide you through it. Otherwise press Finish, then Save Invoice.',
        progress: 100, progressText: 'All steps done',
        buttons: ['add', 'done'], doneText: 'Finish'
    });
}

// ── Home screen (opened from the help button) ────────────────────────────────
function openHome() {
    const errs = findErrors();
    if (errs.length) {
        show({
            type: 'info', icon: '🧭', title: 'Need a hand?',
            msg: `${errs.length} field${errs.length === 1 ? '' : 's'} still to fill in on this invoice.`,
            step: 'Press Guide me and I will take you through it step by step.',
            buttons: ['start', 'done'], doneText: 'Close'
        });
    } else {
        show({
            type: 'success', icon: '🎉', title: 'All good!',
            msg: 'Every required field is filled in.',
            step: 'Add another item, or press Close and save the invoice.',
            buttons: ['add', 'done'], doneText: 'Close'
        });
    }
}

// ── Wiring ───────────────────────────────────────────────────────────────────
btn.start.addEventListener('click', startGuide);
btn.next.addEventListener('click', () => { if (current) completeStep(current); });
btn.skip.addEventListener('click', () => { if (current) { skipped.add(current.el); doneCount++; } nextStep(); });
btn.add.addEventListener('click', () => {
    document.querySelector('.add-item')?.click();
    setTimeout(startGuide, 150);
});
btn.exit.addEventListener('click', exitGuide);
btn.done.addEventListener('click', exitGuide);
q('#fgClose').addEventListener('click', exitGuide);

tinker.addEventListener('click', () => { guide.classList.contains('fg-show') ? exitGuide() : openHome(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && guide.classList.contains('fg-show')) exitGuide(); });

['input', 'change'].forEach(ev => document.addEventListener(ev, () => { userHasInteracted = true; }));
document.addEventListener('blur', () => { userHasInteracted = true; }, true);

setInterval(() => {
    if (guiding && current && !current.el.isConnected) { nextStep(); return; }   // row was rebuilt
    if (!userHasInteracted || guiding) return;
    tinker.classList.toggle('has-errors', findErrors().length > 0);
}, 400);

// Used by comboModal.js
window.showFieldGuide = function (type, icon, title, msg, step, showAssist, autoDismiss) {
    userHasInteracted = true;
    const withGuide = showAssist !== false;
    show({ type: type || 'info', icon, title, msg, step,
           buttons: withGuide ? ['start', 'done'] : ['done'],
           doneText: withGuide ? 'Close' : 'Got it', autoDismiss: autoDismiss || 0 });
};
window.hideFieldGuide = exitGuide;

})();