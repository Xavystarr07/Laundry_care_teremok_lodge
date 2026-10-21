// checklist.js — Laundry Care Checklist
// Matches PDF layout exactly + auto-fills invoice table rows

(function () {

// ── Item map: checklist label → priceList code ────────────────────────────────
const CHECKLIST_DATA = [
    // LEFT COLUMN
    {
        section: "SHEETS",
        items: [
            { label: "King",   code: "KSFITSHT"  },
            { label: "Queen",  code: "QSFITSHT"  },
            { label: "Double", code: "DOFITSHT"  },
            { label: "3/4",    code: "3/4FITSHT" },
            { label: "Single", code: "SIFITSHT"  },
        ]
    },
    {
        section: "PILLOW CASES",
        items: [
            { label: "Standard",              code: "PILLCASE"   },
            { label: "Continental",           code: "CONTPCASE"  },
            { label: "Standard Protector",    code: "PILLPROSTD" },
            { label: "Continental Protector", code: "PILLPRO"    },
        ]
    },
    {
        section: "NIGHT FRILLS",
        items: [
            { label: "King",   code: "NGTFRILKS"  },
            { label: "Queen",  code: "NGTFRILQS"  },
            { label: "Double", code: "NGTFRILDO"  },
            { label: "3/4",    code: "NGTFRIL3/4" },
            { label: "Single", code: "NGTFRILSI"  },
        ]
    },
    {
        section: "MATTRESS PROTECTOR",
        items: [
            { label: "King",   code: "MATPRO/K/Q" },
            { label: "Queen",  code: "MATPRO/K/Q" },
            { label: "Double", code: "MATPRODO"   },
            { label: "3/4",    code: "MATPRO3/4"  },
            { label: "Single", code: "MATPROS"    },
        ]
    },
    // RIGHT COLUMN
    {
        section: "DUVET COVERS",
        items: [
            { label: "King",   code: "DUVCOVKS"  },
            { label: "Queen",  code: "DUVCOVQU"  },
            { label: "Double", code: "DUVCOVDO"  },
            { label: "3/4",    code: "DUVCOV3/4" },
            { label: "Single", code: "DUVCOVSI"  },
        ]
    },
    {
        section: "TOWELS",
        items: [
            { label: "Hand Towel", code: "TWLHAND" },
            { label: "Bath Towel", code: "BATHTWL" },
            { label: "Bath Sheet", code: "BATHSH"  },
            { label: "Bath Mat",   code: "BATHMA"  },
        ]
    },
    {
        section: "MATS",
        items: [
            { label: "Rectangular Bath Mat", code: "BATHMATREC" },
            { label: "Toilet Mat",           code: "MATTOI"     },
            { label: "Toilet Seat Cover",    code: "MATTSC"     },
            { label: "Carpet",               code: "CARMED"     },
        ]
    },
    {
        section: "BLANKETS / THROWS",
        items: [
            { label: "King",   code: "BLANKK"   },
            { label: "Queen",  code: "BLANKQ"   },
            { label: "Double", code: "BLANKDBL" },
            { label: "Single", code: "BLANKS"   },
        ]
    },
    {
        section: "COMFORTERS",
        items: [
            { label: "King",   code: "COMFKS"  },
            { label: "Queen",  code: "COMFQUE" },
            { label: "Double", code: "COMFDBL" },
            { label: "Single", code: "COMFSI"  },
        ]
    },
];

// ── Styles ────────────────────────────────────────────────────────────────────
const style = document.createElement('style');
style.textContent = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700;800&display=swap');

#monthlyStatsFab {
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 9000;
    background: linear-gradient(135deg, #11998e, #38ef7d);
    color: #fff;
    border: none;
    border-radius: 28px;
    padding: 13px 20px;
    font-family: 'Segoe UI', Arial, sans-serif;
    font-weight: 700;
    font-size: 14px;
    cursor: pointer;
    box-shadow: 0 6px 24px rgba(17,153,142,0.5);
    display: flex;
    align-items: center;
    gap: 8px;
    transition: transform 0.2s, box-shadow 0.2s, filter 0.2s;
    white-space: nowrap;
    margin: 0 !important;
}
#monthlyStatsFab:hover {
    transform: translateY(-2px) scale(1.04);
    box-shadow: 0 10px 32px rgba(17,153,142,0.6);
    filter: brightness(1.08);
}
#monthlyStatsFab:active { transform: scale(0.97); }

#clOverlay {
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.6);
    backdrop-filter: blur(5px);
    z-index: 99998;
    align-items: center;
    justify-content: center;
    padding: 12px;
}
#clOverlay.cl-active { display: flex; }

#clModal {
    background: #fff;
    border-radius: 18px;
    width: 100%;
    max-width: 680px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 28px 80px rgba(0,0,0,0.35);
    font-family: 'Space Grotesk', 'Segoe UI', Arial, sans-serif;
    overflow: hidden;
    animation: clPop 0.2s cubic-bezier(.34,1.56,.64,1);
    color-scheme: light !important;
}
body.dark-mode #clModal {
    background: #13111f;
    box-shadow: 0 28px 80px rgba(0,0,0,0.7);
}
@keyframes clPop {
    from { transform: scale(0.88); opacity: 0; }
    to   { transform: scale(1);    opacity: 1; }
}

#clHeader {
    background: linear-gradient(120deg, #1e3a8a 0%, #1d4ed8 60%, #3b82f6 100%);
    padding: 14px 18px;
    display: flex;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;
    position: relative;
    overflow: hidden;
}
#clHeader::before {
    content: '';
    position: absolute;
    top: -20px; right: -20px;
    width: 80px; height: 80px;
    background: rgba(255,255,255,0.1);
    border-radius: 50%;
    pointer-events: none;
}
#clHeaderTitle {
    flex: 1;
    font-size: 15px;
    font-weight: 800;
    color: #fff;
    letter-spacing: 0.4px;
    position: relative; z-index: 1;
    line-height: 1.3;
}
#clHeaderSub { font-size: 11px; color: rgba(255,255,255,0.75); font-weight: 500; }
#clCloseBtn {
    background: rgba(255,255,255,0.18);
    border: 1px solid rgba(255,255,255,0.3);
    color: #fff;
    border-radius: 50%;
    width: 28px; height: 28px;
    cursor: pointer;
    font-size: 14px;
    display: flex; align-items: center; justify-content: center;
    margin: 0 !important; box-shadow: none !important;
    transition: all 0.2s;
    position: relative; z-index: 1;
    flex-shrink: 0;
}
#clCloseBtn:hover { background: rgba(255,255,255,0.35); transform: rotate(90deg); }

#clSubHeader {
    background: #eff6ff;
    border-bottom: 1.5px solid #dbeafe;
    padding: 7px 18px;
    display: flex;
    gap: 18px;
    align-items: center;
    flex-shrink: 0;
    font-size: 11.5px;
    font-weight: 700;
    color: #1e3a8a;
    font-family: 'Space Grotesk', 'Segoe UI', Arial, sans-serif;
}
body.dark-mode #clSubHeader { background: #0f172a; border-color: #1e3a8a; color: #93c5fd; }

#clBody {
    flex: 1;
    overflow-y: auto;
    padding: 14px 16px 10px;
    scrollbar-width: thin;
    scrollbar-color: rgba(29,78,216,0.3) transparent;
}
#clBody::-webkit-scrollbar { width: 4px; }
#clBody::-webkit-scrollbar-thumb { background: rgba(29,78,216,0.3); border-radius: 4px; }

#clColumns {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0 28px;
    align-items: start;
}

.cl-section { margin-bottom: 16px; }
.cl-section-title {
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 1.2px;
    text-transform: uppercase;
    color: #111827;
    border-bottom: 2px solid #111827;
    padding-bottom: 3px;
    margin-bottom: 7px;
    font-family: 'Space Grotesk', 'Segoe UI', Arial, sans-serif;
}
body.dark-mode .cl-section-title { color: #e6edf3; border-color: #e6edf3; }

.cl-item {
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 4px 6px;
    border-radius: 7px;
    cursor: pointer;
    transition: background 0.12s;
    user-select: none;
    margin-bottom: 1px;
}
.cl-item:hover { background: rgba(29,78,216,0.07); }
body.dark-mode .cl-item:hover { background: rgba(59,130,246,0.08); }
.cl-item.cl-selected { background: rgba(29,78,216,0.09); }
body.dark-mode .cl-item.cl-selected { background: rgba(59,130,246,0.12); }

.cl-box {
    width: 15px; height: 15px;
    border: 1.5px solid #9ca3af;
    border-radius: 3px;
    flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    background: #fff;
    transition: all 0.15s;
}
body.dark-mode .cl-box { background: #1e1e3a; border-color: #4a4a7a; }
.cl-item.cl-selected .cl-box { background: #1d4ed8; border-color: #1d4ed8; }
.cl-box-tick { color: #fff; font-size: 9px; font-weight: 900; display: none; line-height: 1; }
.cl-item.cl-selected .cl-box-tick { display: block; }

.cl-item-text {
    font-size: 12px;
    font-weight: 500;
    color: #374151;
    letter-spacing: 0.5px;
    line-height: 1;
}
body.dark-mode .cl-item-text { color: #c9d1d9; }
.cl-item.cl-selected .cl-item-text { color: #1d4ed8; font-weight: 700; }
body.dark-mode .cl-item.cl-selected .cl-item-text { color: #93c5fd; }

.cl-other-section {
    margin-top: 10px;
    padding-top: 10px;
    border-top: 1.5px dashed #dbeafe;
    grid-column: 1 / -1;
}
body.dark-mode .cl-other-section { border-color: #1e3a8a; }
.cl-other-line {
    border-bottom: 1px solid #d1d5db;
    margin-top: 4px;
    height: 20px;
}
body.dark-mode .cl-other-line { border-color: #3a3a5e; }

#clFooter {
    padding: 11px 16px;
    background: #eff6ff;
    border-top: 1.5px solid #dbeafe;
    display: flex;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;
}
body.dark-mode #clFooter { background: #0f172a; border-color: #1e3a8a; }
#clCount { flex: 1; font-size: 12px; font-weight: 700; color: #1e3a8a; }
body.dark-mode #clCount { color: #93c5fd; }

#clClearBtn {
    background: none;
    border: 1.5px solid #fca5a5;
    border-radius: 20px;
    color: #ef4444;
    font-size: 12px; font-weight: 700;
    padding: 7px 14px;
    cursor: pointer;
    margin: 0 !important; box-shadow: none !important;
    transition: all 0.15s;
    font-family: 'Space Grotesk', 'Segoe UI', Arial, sans-serif;
}
#clClearBtn:hover { background: #ef4444; color: #fff; border-color: #ef4444; }

#clConfirmBtn {
    background: linear-gradient(135deg, #1e3a8a, #1d4ed8);
    color: #fff; border: none;
    border-radius: 20px;
    font-size: 13px; font-weight: 800;
    padding: 9px 20px;
    cursor: pointer;
    margin: 0 !important;
    box-shadow: 0 4px 14px rgba(29,78,216,0.4);
    transition: all 0.18s;
    font-family: 'Space Grotesk', 'Segoe UI', Arial, sans-serif;
}
#clConfirmBtn:hover { filter: brightness(1.1); transform: translateY(-1px); }
#clConfirmBtn:disabled { opacity: 0.4; cursor: default; transform: none; filter: none; }

/* NUMPAD */
#clNpOverlay {
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.65);
    backdrop-filter: blur(5px);
    z-index: 99999;
    align-items: center;
    justify-content: center;
}
#clNpOverlay.clnp-on { display: flex; }

#clNumpad {
    background: #fff;
    border-radius: 20px;
    width: 320px;
    overflow: hidden;
    box-shadow: 0 28px 70px rgba(0,0,0,0.35);
    font-family: 'Space Grotesk', 'Segoe UI', Arial, sans-serif;
    animation: clPop 0.18s cubic-bezier(.34,1.56,.64,1);
}
body.dark-mode #clNumpad { background: #1e1228; box-shadow: 0 28px 70px rgba(0,0,0,0.7); }

#clNpBar {
    background: linear-gradient(120deg, #1e3a8a, #1d4ed8);
    padding: 14px 18px 12px;
    position: relative; overflow: hidden;
}
#clNpBar::after {
    content: '';
    position: absolute; top: -15px; right: -15px;
    width: 60px; height: 60px;
    background: rgba(255,255,255,0.1);
    border-radius: 50%; pointer-events: none;
}
#clNpProg { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: rgba(255,255,255,0.7); margin-bottom: 2px; }
#clNpName { font-size: 14px; font-weight: 800; color: #fff; }

#clNpDisplay {
    margin: 14px 16px 10px;
    background: #eff6ff;
    border: 2px solid #dbeafe;
    border-radius: 12px;
    height: 52px;
    display: flex; align-items: center; justify-content: center;
    font-size: 28px; font-weight: 800;
    color: #1d4ed8; letter-spacing: 2px;
    transition: color 0.2s;
}
body.dark-mode #clNpDisplay { background: #0f172a; border-color: #1e3a8a; color: #93c5fd; }

#clNpGrid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 6px;
    padding: 0 16px 16px;
}
.clnp-btn {
    background: #eff6ff;
    border: 1.5px solid #dbeafe;
    border-radius: 10px;
    padding: 10px 4px;
    font-size: 14px; font-weight: 700;
    color: #1d4ed8;
    cursor: pointer; text-align: center;
    transition: background 0.12s, transform 0.1s;
    user-select: none;
    margin: 0 !important; box-shadow: none !important;
    font-family: 'Space Grotesk', 'Segoe UI', Arial, sans-serif;
}
.clnp-btn:hover { background: linear-gradient(135deg, #1e3a8a, #1d4ed8); color: #fff; border-color: transparent; transform: scale(1.08); }
.clnp-btn:active { transform: scale(0.95); }
body.dark-mode .clnp-btn { background: #0f172a; border-color: #1e3a8a; color: #93c5fd; }
body.dark-mode .clnp-btn:hover { background: linear-gradient(135deg, #1e3a8a, #1d4ed8); color: #fff; border-color: transparent; }

/* SUMMARY */
#clSumWrap { display: none; flex-direction: column; overflow: hidden; }
#clSumWrap.clsum-on { display: flex; }

#clSumHeader {
    background: linear-gradient(120deg, #4c1d95, #7c3aed);
    padding: 13px 18px;
    font-size: 13px; font-weight: 800;
    color: #fff; letter-spacing: 0.8px;
    text-transform: uppercase;
    display: flex; align-items: center;
    position: relative; overflow: hidden;
}
#clSumHeader::after { content: ''; position: absolute; top: -15px; right: -15px; width: 60px; height: 60px; background: rgba(255,255,255,0.08); border-radius: 50%; pointer-events: none; }
#clSumEditHint { font-size: 10px; color: rgba(255,255,255,0.6); font-weight: 600; margin-left: auto; background: rgba(255,255,255,0.12); padding: 3px 9px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.18); position: relative; z-index: 1; white-space: nowrap; }

#clSumList { max-height: 300px; overflow-y: auto; scrollbar-width: thin; scrollbar-color: rgba(124,58,237,0.3) transparent; }
#clSumList::-webkit-scrollbar { width: 4px; }
#clSumList::-webkit-scrollbar-thumb { background: rgba(124,58,237,0.3); border-radius: 4px; }

.clsr {
    display: grid; grid-template-columns: 1fr auto auto;
    align-items: center; gap: 10px;
    padding: 9px 16px;
    border-top: 1px solid rgba(109,40,217,0.08);
    background: #fdfcff;
    transition: background 0.15s;
    position: relative;
}
.clsr::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 3px; background: linear-gradient(180deg, #1d4ed8, #3b82f6); opacity: 0; transition: opacity 0.15s; }
.clsr:first-child { border-top: none; }
.clsr:hover { background: #eff6ff; }
.clsr:hover::before { opacity: 1; }
body.dark-mode .clsr { background: #16101f; border-color: rgba(124,58,237,0.12); }
body.dark-mode .clsr:hover { background: #1f0f20; }
.clsr-desc { font-size: 12px; font-weight: 600; color: #374151; line-height: 1.3; }
body.dark-mode .clsr-desc { color: #f9a8d4; }
.clsr-qty { font-family: 'Space Grotesk', monospace; font-weight: 800; font-size: 16px; color: #fff; min-width: 36px; text-align: center; background: linear-gradient(135deg, #1e3a8a, #1d4ed8); border-radius: 9px; padding: 4px 9px; box-shadow: 0 3px 10px rgba(29,78,216,0.35); }
.clsr-edit { background: rgba(29,78,216,0.08); border: 1.5px solid rgba(29,78,216,0.25); border-radius: 8px; color: #1d4ed8; cursor: pointer; font-size: 12px; padding: 4px 9px; transition: all 0.18s cubic-bezier(.34,1.56,.64,1); margin: 0 !important; box-shadow: none !important; font-weight: 700; font-family: 'Space Grotesk', 'Segoe UI', Arial, sans-serif; }
.clsr-edit:hover { background: linear-gradient(135deg, #1e3a8a, #1d4ed8); border-color: transparent; color: #fff; transform: scale(1.08); box-shadow: 0 4px 12px rgba(29,78,216,0.4) !important; }
body.dark-mode .clsr-edit { background: rgba(59,130,246,0.1); border-color: rgba(59,130,246,0.3); color: #93c5fd; }
.clsr-qty-input { font-family: 'Space Grotesk', monospace; font-weight: 800; font-size: 15px; color: #fff; width: 50px; text-align: center; background: linear-gradient(135deg, #1e3a8a, #1d4ed8); border-radius: 9px; padding: 4px 6px; border: 2px solid #93c5fd; outline: none; box-sizing: border-box; margin: 0; display: block; box-shadow: 0 0 0 3px rgba(59,130,246,0.25); }
.clsr-qty-input::-webkit-inner-spin-button, .clsr-qty-input::-webkit-outer-spin-button { -webkit-appearance: none; }

#clDoneBtn { width: 100%; padding: 15px; background: linear-gradient(120deg, #16a34a, #15803d); color: #fff; border: none; font-size: 14px; font-weight: 800; cursor: pointer; letter-spacing: 1px; text-transform: uppercase; font-family: 'Space Grotesk', 'Segoe UI', Arial, sans-serif; transition: filter 0.18s, box-shadow 0.18s; position: relative; overflow: hidden; }
#clDoneBtn::before { content: ''; position: absolute; inset: 0; background: linear-gradient(120deg, rgba(255,255,255,0.1) 0%, transparent 60%); pointer-events: none; }
#clDoneBtn:hover { filter: brightness(1.1); box-shadow: 0 6px 24px rgba(22,163,74,0.4); }
`;
document.head.appendChild(style);

// ── Monthly Statements FAB ────────────────────────────────────────────────────
document.querySelectorAll('.monthly-statements-btn').forEach(el => el.remove());
const fab = document.createElement('button');
fab.id = 'monthlyStatsFab'; fab.type = 'button';
fab.innerHTML = `<svg width="16" height="16" viewBox="0 0 20 10" fill="white"><path d="M14.84 0l-1.08 1.06 3.3 3.2H0v1.49h17.05l-3.3 3.2L14.84 10 20 5l-5.16-5z"/></svg> Monthly Statements`;
fab.addEventListener('click', () => {
    if (typeof navigateToMonthlyStatement === 'function') navigateToMonthlyStatement();
});
document.body.appendChild(fab);

// ── Build checklist modal ─────────────────────────────────────────────────────
const clOverlayEl = document.createElement('div');
clOverlayEl.id = 'clOverlay';
clOverlayEl.innerHTML = `
    <div id="clModal">
        <div id="clHeader">
            <span style="font-size:22px;position:relative;z-index:1;">📋</span>
            <div style="flex:1;position:relative;z-index:1;">
                <div id="clHeaderTitle">LAUNDRY CARE — Checklist</div>
                <div id="clHeaderSub">Tick items then enter quantities</div>
            </div>
            <button id="clCloseBtn" type="button">✕</button>
        </div>
        <div id="clSubHeader">
            <span>🏨 Hotel: <strong id="clHotelVal">—</strong></span>
            <span>🔑 Unit: <strong id="clUnitVal">—</strong></span>
            <span>📅 Date: <strong id="clDateVal">—</strong></span>
        </div>
        <div id="clBody">
            <div id="clColumns"></div>
            <div class="cl-other-section">
                <div class="cl-section-title">OTHER ITEMS:</div>
                <div class="cl-other-line"></div>
            </div>
        </div>
        <div id="clFooter">
            <span id="clCount">0 items selected</span>
            <button id="clClearBtn" type="button">Clear All</button>
            <button id="clConfirmBtn" type="button" disabled>Enter Quantities →</button>
        </div>
    </div>
`;
document.body.appendChild(clOverlayEl);

// ── Build numpad modal ────────────────────────────────────────────────────────
const npOverlayEl = document.createElement('div');
npOverlayEl.id = 'clNpOverlay';
npOverlayEl.innerHTML = `
    <div id="clNumpad">
        <div id="clNpBar">
            <div id="clNpProg"></div>
            <div id="clNpName"></div>
        </div>
        <div id="clNpDisplay">—</div>
        <div id="clNpGrid"></div>
        <div id="clSumWrap">
            <div id="clSumHeader">✅ Checklist Summary <span id="clSumEditHint">tap ✏️ to edit</span></div>
            <div id="clSumList"></div>
            <button id="clDoneBtn" type="button">✔ Done — Fill Invoice</button>
        </div>
    </div>
`;
document.body.appendChild(npOverlayEl);

const npGrid = npOverlayEl.querySelector('#clNpGrid');
for (let i = 1; i <= 20; i++) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'clnp-btn';
    b.textContent = i; b.dataset.val = i;
    npGrid.appendChild(b);
}

// ── Render two-column PDF layout ──────────────────────────────────────────────
const colContainer = clOverlayEl.querySelector('#clColumns');
const leftSections  = CHECKLIST_DATA.slice(0, 4);
const rightSections = CHECKLIST_DATA.slice(4);

function buildColumn(sections) {
    const col = document.createElement('div');
    sections.forEach(sec => {
        const secDiv = document.createElement('div');
        secDiv.className = 'cl-section';
        secDiv.innerHTML = `<div class="cl-section-title">${sec.section}</div>`;
        sec.items.forEach(item => {
            const row = document.createElement('div');
            row.className = 'cl-item';
            row.dataset.key = `${sec.section}::${item.label}::${item.code}`;
            row.innerHTML = `<div class="cl-box"><span class="cl-box-tick">✓</span></div><span class="cl-item-text">${item.label}</span>`;
            row.addEventListener('click', () => toggleItem(row));
            secDiv.appendChild(row);
        });
        col.appendChild(secDiv);
    });
    return col;
}

colContainer.appendChild(buildColumn(leftSections));
colContainer.appendChild(buildColumn(rightSections));

// ── State ─────────────────────────────────────────────────────────────────────
let selectedKeys = new Set();

function toggleItem(row) {
    const key = row.dataset.key;
    if (selectedKeys.has(key)) { selectedKeys.delete(key); row.classList.remove('cl-selected'); }
    else { selectedKeys.add(key); row.classList.add('cl-selected'); }
    updateCount();
}

function updateCount() {
    const n = selectedKeys.size;
    document.getElementById('clCount').textContent = `${n} item${n !== 1 ? 's' : ''} selected`;
    document.getElementById('clConfirmBtn').disabled = n === 0;
}

function openChecklist() {
    const invoiceVal = document.getElementById('invoice_number')?.value?.replace(/\D/g,'') || '';
    const row1       = document.querySelector('#invoiceTable tr');
    const hotel      = row1?.querySelector('.hotel')?.value?.trim() || '';
    const unit       = row1?.querySelector('.unit-number')?.value?.trim() || '';
    const date       = row1?.querySelector('.date-received')?.value || '';

    // Guard: all four fields required
    if (invoiceVal.length < 5) {
        if (typeof showPopup === 'function')
            showPopup('warning', 'Invoice number needed first!', '💡 Enter a 5-digit invoice number before opening the checklist.', 0);
        document.getElementById('invoice_number')?.focus();
        return;
    }
    if (!date) {
        if (typeof showPopup === 'function')
            showPopup('warning', 'Date needed!', '💡 Pick a date received before opening the checklist.', 0);
        return;
    }
    if (!hotel) {
        if (typeof showPopup === 'function')
            showPopup('warning', 'Hotel needed!', '💡 Select a hotel before opening the checklist.', 0);
        return;
    }
    if (!unit) {
        if (typeof showPopup === 'function')
            showPopup('warning', 'Unit number needed!', '💡 Enter the unit number before opening the checklist.', 0);
        return;
    }

    document.getElementById('clHotelVal').textContent = hotel;
    document.getElementById('clUnitVal').textContent  = unit;
    document.getElementById('clDateVal').textContent  = date;
    selectedKeys.clear();
    clOverlayEl.querySelectorAll('.cl-item').forEach(r => r.classList.remove('cl-selected'));
    updateCount();
    clOverlayEl.classList.add('cl-active');
}

function closeChecklist() { clOverlayEl.classList.remove('cl-active'); }

document.getElementById('clCloseBtn').addEventListener('click', closeChecklist);
clOverlayEl.addEventListener('click', e => { if (e.target === clOverlayEl) closeChecklist(); });
document.getElementById('clClearBtn').addEventListener('click', () => {
    selectedKeys.clear();
    clOverlayEl.querySelectorAll('.cl-item').forEach(r => r.classList.remove('cl-selected'));
    updateCount();
});
document.getElementById('clConfirmBtn').addEventListener('click', () => {
    closeChecklist();
    startNumpad();
});

// ── Numpad flow ───────────────────────────────────────────────────────────────
function startNumpad() {
    const items = Array.from(selectedKeys).map(key => {
        const parts = key.split('::');
        return { section: parts[0], label: parts[1], code: parts[2], qty: null };
    });

    document.getElementById('clSumWrap').classList.remove('clsum-on');
    document.getElementById('clSumList').innerHTML = '';
    npGrid.style.display = '';
    document.getElementById('clNpBar').style.display = '';
    document.getElementById('clNpDisplay').style.display = '';
    npOverlayEl.classList.add('clnp-on');

    let idx = 0;

    function showItem(i) {
        if (i >= items.length) { showSummary(items); return; }
        document.getElementById('clNpProg').textContent = `Item ${i + 1} of ${items.length}`;
        document.getElementById('clNpName').textContent = `${items[i].label} — ${items[i].section}`;
        const d = document.getElementById('clNpDisplay');
        d.textContent = '—'; d.style.color = '';
    }

    npGrid.onclick = function(e) {
        const btn = e.target.closest('.clnp-btn');
        if (!btn) return;
        const val = parseInt(btn.dataset.val);
        items[idx].qty = val;
        const d = document.getElementById('clNpDisplay');
        d.textContent = val; d.style.color = '#1d4ed8';
        setTimeout(() => { idx++; showItem(idx); }, 280);
    };

    function onKey(e) {
        if (!npOverlayEl.classList.contains('clnp-on')) return;
        const n = parseInt(e.key);
        if (!isNaN(n) && n >= 1 && n <= 9) {
            items[idx].qty = n;
            const d = document.getElementById('clNpDisplay');
            d.textContent = n; d.style.color = '#be185d';
            setTimeout(() => { idx++; showItem(idx); }, 280);
        }
        if (e.key === 'Enter') document.getElementById('clDoneBtn').click();
    }
    document.addEventListener('keydown', onKey);
    document.getElementById('clDoneBtn').addEventListener('click',
        () => document.removeEventListener('keydown', onKey), { once: true });

    showItem(0);
}

// ── Summary ───────────────────────────────────────────────────────────────────
function showSummary(items) {
    npGrid.style.display = 'none';
    document.getElementById('clNpBar').style.display = 'none';
    document.getElementById('clNpDisplay').style.display = 'none';
    const list = document.getElementById('clSumList');
    list.innerHTML = '';

    items.forEach((entry) => {
        const row = document.createElement('div');
        row.className = 'clsr';
        const desc = document.createElement('span');
        desc.className = 'clsr-desc';
        desc.textContent = `${entry.label} (${entry.section})`;
        const qtyEl = document.createElement('span');
        qtyEl.className = 'clsr-qty';
        qtyEl.textContent = entry.qty ?? '—';
        const editBtn = document.createElement('button');
        editBtn.type = 'button'; editBtn.className = 'clsr-edit'; editBtn.textContent = '✏️';

        function wireEdit() {
            editBtn.onclick = () => {
                const input = document.createElement('input');
                input.type = 'number'; input.className = 'clsr-qty-input';
                input.min = 1; input.max = 20; input.value = entry.qty ?? 1;
                qtyEl.replaceWith(input); editBtn.textContent = '✔';
                input.focus(); input.select();
                function confirm() {
                    const v = Math.min(20, Math.max(1, parseInt(input.value) || 1));
                    entry.qty = v;
                    const nd = document.createElement('span');
                    nd.className = 'clsr-qty'; nd.textContent = v;
                    input.replaceWith(nd); editBtn.textContent = '✏️'; wireEdit();
                }
                editBtn.onclick = confirm;
                input.addEventListener('keydown', e => {
                    if (e.key === 'Enter') confirm();
                    if (e.key === 'Escape') {
                        const rd = document.createElement('span');
                        rd.className = 'clsr-qty'; rd.textContent = entry.qty ?? '—';
                        input.replaceWith(rd); editBtn.textContent = '✏️'; wireEdit();
                    }
                });
            };
        }
        wireEdit();
        row.appendChild(desc); row.appendChild(qtyEl); row.appendChild(editBtn);
        list.appendChild(row);
    });

    document.getElementById('clSumWrap').classList.add('clsum-on');
    document.getElementById('clDoneBtn').onclick = () => {
        fillInvoice(items);
        npOverlayEl.classList.remove('clnp-on');
        npGrid.style.display = '';
        document.getElementById('clNpBar').style.display = '';
        document.getElementById('clNpDisplay').style.display = '';
        document.getElementById('clSumWrap').classList.remove('clsum-on');
    };
}

// ── Fill invoice table ────────────────────────────────────────────────────────
function fillInvoice(items) {
    const table = document.getElementById('invoiceTable');
    if (!table) return;
    const row1  = table.rows[0];
    const hotel = row1?.querySelector('.hotel')?.value || '';
    const unit  = row1?.querySelector('.unit-number')?.value || '';
    const date  = row1?.querySelector('.date-received')?.value || new Date().toISOString().split('T')[0];
    const r1empty = !row1?.querySelector('.code')?.value && !row1?.querySelector('.quantity')?.value;

    items.forEach((entry, i) => {
        const priceItem = (typeof priceList !== 'undefined')
            ? priceList.find(p => p.code === entry.code) : null;
        const desc  = priceItem?.description || entry.label;
        const price = priceItem?.price ?? 0;
        const qty   = entry.qty || 1;
        const total = (price * qty).toFixed(2);

        let row;
        if (i === 0 && r1empty) { row = row1; }
        else { row = table.insertRow(); }

        const isFirst = row === row1;
        const hotelOpts = (typeof getHotelOptionsHTML === 'function')
            ? getHotelOptionsHTML(hotel) : `<option value="${hotel}">${hotel}</option>`;

        row.innerHTML = isFirst ? `
            <td><select class="hotel" name="hotel" id="hotelSelect" onchange="updateUnitDatalist(this)">${hotelOpts}</select></td>
            <td><input type="number" name="unit-number" class="unit-number" value="${unit}" placeholder="Unit Number"></td>
            <td><input type="text" class="code" value="${entry.code}"></td>
            <td><input type="text" class="description" readonly value="${desc}"></td>
            <td><input type="number" class="price" readonly value="${price.toFixed(2)}"></td>
            <td><input type="number" class="quantity" min="1" value="${qty}"></td>
            <td><input type="number" class="total" readonly value="${total}"></td>
            <td><input type="date" class="date-received" name="date_received" value="${date}" required></td>
        ` : `
            <td><select class="hotel" name="hotel" disabled>${hotelOpts}</select><input type="hidden" name="hotel" value="${hotel}"></td>
            <td><input type="number" name="unit-number" class="unit-number" value="${unit}" readonly></td>
            <td><input type="text" class="code" value="${entry.code}"></td>
            <td><input type="text" class="description" readonly value="${desc}"></td>
            <td><input type="number" class="price" readonly value="${price.toFixed(2)}"></td>
            <td><input type="number" class="quantity" min="1" value="${qty}"></td>
            <td><input type="number" class="total" readonly value="${total}"></td>
            <td><input type="date" class="date-received" name="date_received" value="${date}" readonly></td>
        `;

        const qtyInp = row.querySelector('.quantity');
        if (qtyInp && typeof calculateTotal === 'function') {
            qtyInp.addEventListener('input', () => calculateTotal(qtyInp));
        }
        row.querySelectorAll('input, select').forEach(el => {
            el.addEventListener('focus', () => el.setAttribute('data-touched', 'true'));
            if (typeof checkInputs === 'function') el.addEventListener('blur', checkInputs);
        });
    });

    if (typeof updateGrandTotal === 'function') updateGrandTotal();
    if (typeof showPopup === 'function') {
        showPopup('success',
            `✅ ${items.length} checklist item${items.length !== 1 ? 's' : ''} added to invoice!`,
            '💡 Review the table then save or print.', 5000);
    }
}

// ── Wire button ───────────────────────────────────────────────────────────────
function wireButton() {
    document.getElementById('checklistBtn')?.addEventListener('click', openChecklist);
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wireButton);
else wireButton();

})();
