// themeSearch.js — Dark/Light mode toggle + item search panel
// Bottom-left: small circular toggle, sun/moon icons in a mini arc
// Search panel slides up when search icon is clicked

(function () {

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────
const style = document.createElement('style');
style.textContent = `
  /* ── Theme toggle container ── */
  #themeToggleWrap {
    position: fixed;
    bottom: 24px;
    left: 24px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    z-index: 9000;
  }

  /* ── Shared small FAB style ── */
  .theme-fab {
    width: 44px; height: 44px;
    border-radius: 50%;
    border: none;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    font-size: 20px;
    transition: transform 0.3s cubic-bezier(.34,1.56,.64,1), box-shadow 0.3s, background 0.4s;
    margin: 0 !important;
    box-shadow: 0 4px 14px rgba(0,0,0,0.25);
    outline: none;
    position: relative;
    overflow: hidden;
  }
  .theme-fab:active { transform: scale(0.92) !important; }

  /* Theme icon button */
  #themeBtn {
    background: linear-gradient(135deg, #1a1a3e, #2d2d6b);
    color: #f0e68c;
  }
  body.dark-mode #themeBtn {
    background: linear-gradient(135deg, #ffd700, #ff8c00);
    color: #1a1a3e;
  }
  #themeBtn:hover {
    transform: scale(1.15) rotate(20deg);
    box-shadow: 0 6px 20px rgba(100,100,255,0.45);
  }
  body.dark-mode #themeBtn:hover {
    box-shadow: 0 6px 20px rgba(255,200,0,0.45);
  }

  /* Switch mode button */
  #switchModeFab {
    background: linear-gradient(135deg, #04210f, #075e3a);
    color: #3dffa0;
    border: 1.5px solid #22ff88;
    box-shadow: 0 0 10px rgba(34,255,136,0.5), inset 0 0 8px rgba(34,255,136,0.15);
  }
  #switchModeFab:hover {
    box-shadow: 0 0 18px rgba(34,255,136,0.85), inset 0 0 10px rgba(34,255,136,0.25);
  }

  /* Search icon button */
  #searchFab {
    background: linear-gradient(135deg, #0f3460, #533483);
    color: #a8d8ff;
  }
  body.dark-mode #searchFab {
    background: linear-gradient(135deg, #533483, #c471ed);
    color: white;
  }
  #searchFab:hover {
    transform: scale(1.15) rotate(-15deg);
    box-shadow: 0 6px 20px rgba(83,52,131,0.5);
  }

  body #searchFab, body.dark-mode #searchFab {
    background: linear-gradient(135deg, #1a0533, #4c1391);
    color: #d9a3ff;
    border: 1.5px solid #b45cff;
    box-shadow: 0 0 10px rgba(180,92,255,0.55), inset 0 0 8px rgba(180,92,255,0.18);
  }
  body #searchFab:hover, body.dark-mode #searchFab:hover {
    box-shadow: 0 0 18px rgba(180,92,255,0.9), inset 0 0 10px rgba(180,92,255,0.28);
  }

  /* Stars animation around moon */
  #themeBtn .star1, #themeBtn .star2, #themeBtn .star3 {
    position: absolute;
    width: 4px; height: 4px;
    background: #f0e68c;
    border-radius: 50%;
    opacity: 0;
    transition: opacity 0.3s;
  }
  #themeBtn .star1 { top: 6px; right: 8px; }
  #themeBtn .star2 { bottom: 8px; left: 7px; }
  #themeBtn .star3 { top: 10px; left: 6px; width: 3px; height: 3px; }
  body:not(.dark-mode) #themeBtn:hover .star1,
  body:not(.dark-mode) #themeBtn:hover .star2,
  body:not(.dark-mode) #themeBtn:hover .star3 { opacity: 1; }

  /* Tooltip labels */
  .theme-fab::after {
    content: attr(data-tip);
    position: absolute;
    left: calc(100% + 10px);
    top: 50%;
    transform: translateY(-50%);
    background: rgba(0,0,0,0.75);
    color: white;
    font-size: 11px;
    font-family: 'Segoe UI', Arial, sans-serif;
    font-weight: 600;
    padding: 4px 9px;
    border-radius: 8px;
    white-space: nowrap;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.2s;
  }
  .theme-fab:hover::after { opacity: 1; }

  /* ── Search panel ── */
  #searchPanel {
    position: fixed;
    bottom: 84px;
    left: 24px;
    width: 280px;
    background: linear-gradient(145deg, #0f0c29, #302b63 80%, #24243e);
    border-radius: 16px;
    box-shadow: 0 12px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.07);
    font-family: 'Segoe UI', Arial, sans-serif;
    z-index: 8999;
    overflow: hidden;
    opacity: 0;
    transform: translateY(12px) scale(0.96);
    pointer-events: none;
    transition: opacity 0.28s ease, transform 0.28s ease;
  }
  #searchPanel.sp-open {
    opacity: 1;
    transform: translateY(0) scale(1);
    pointer-events: all;
  }

  #searchPanelHeader {
    display: flex; align-items: center; gap: 8px;
    padding: 12px 14px 10px;
    background: rgba(255,255,255,0.05);
    border-bottom: 1px solid rgba(255,255,255,0.07);
  }
  #searchPanelTitle {
    flex: 1;
    font-size: 13px; font-weight: 700;
    color: #fff;
    text-shadow: 0 1px 4px rgba(0,0,0,0.5);
  }
  #searchPanelClose {
    background: rgba(255,255,255,0.1);
    border: 1px solid rgba(255,255,255,0.15);
    color: rgba(255,255,255,0.6);
    border-radius: 50%; width: 24px; height: 24px;
    cursor: pointer; font-size: 12px;
    display: flex; align-items: center; justify-content: center;
    margin: 0 !important; box-shadow: none !important;
    transition: all 0.2s;
  }
  #searchPanelClose:hover { background: rgba(255,80,80,0.4); color: white; transform: rotate(90deg); }

  #searchInputWrap {
    padding: 10px 12px 8px;
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }
  #searchInput {
    width: 100%;
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.15);
    border-radius: 10px;
    padding: 8px 12px;
    font-size: 13px;
    color: white;
    font-family: 'Segoe UI', Arial, sans-serif;
    outline: none;
    transition: border-color 0.2s, background 0.2s;
    box-sizing: border-box;
    margin: 0;
    display: block;
  }
  #searchInput::placeholder { color: rgba(255,255,255,0.35); }
  #searchInput:focus {
    border-color: rgba(124,58,237,0.7);
    background: rgba(255,255,255,0.12);
  }

  #searchResults {
    max-height: 220px;
    overflow-y: auto;
    padding: 6px 0;
  }
  #searchResults::-webkit-scrollbar { width: 4px; }
  #searchResults::-webkit-scrollbar-track { background: transparent; }
  #searchResults::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 4px; }

  .sr-item {
    display: flex; align-items: center; gap: 10px;
    padding: 8px 14px;
    border-bottom: 1px solid rgba(255,255,255,0.04);
    transition: background 0.15s;
    cursor: default;
  }
  .sr-item:hover { background: rgba(255,255,255,0.07); }
  .sr-item:last-child { border-bottom: none; }

  .sr-code {
    font-size: 11px; font-weight: 700;
    color: #a78bfa;
    background: rgba(124,58,237,0.2);
    padding: 2px 7px; border-radius: 6px;
    flex-shrink: 0; letter-spacing: 0.3px;
    font-family: 'Courier New', monospace;
  }
  .sr-desc {
    font-size: 12.5px; color: rgba(255,255,255,0.85);
    flex: 1; line-height: 1.3;
  }
  .sr-price {
    font-size: 12px; font-weight: 700;
    color: #34d399; flex-shrink: 0;
  }
  .sr-empty {
    padding: 18px 14px; text-align: center;
    color: rgba(255,255,255,0.4); font-size: 13px;
  }
  .sr-count {
    padding: 5px 14px 4px;
    font-size: 11px; color: rgba(255,255,255,0.3);
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }
  em.sr-match { background: rgba(167,139,250,0.3); border-radius: 3px; font-style: normal; padding: 0 2px; }

  /* ── Roomier search panel, lifted above the 3 buttons ── */
  #searchPanel { bottom: 250px; width: 400px; max-width: calc(100vw - 48px); border-radius: 20px; }
  #searchPanelHeader { padding: 16px 18px 12px; gap: 10px; }
  #searchPanelTitle { font-size: 15px; }
  #searchInputWrap { padding: 14px 16px 12px; }
  #searchInput { padding: 12px 16px; font-size: 14.5px; border-radius: 12px; }
  #searchResults { max-height: 340px; padding: 8px 0; }
  .sr-item { padding: 11px 18px; gap: 12px; }
  .sr-code { font-size: 12px; padding: 3px 9px; }
  .sr-desc { font-size: 14px; line-height: 1.4; }
  .sr-price { font-size: 13.5px; }
  .sr-empty { padding: 26px 18px; font-size: 14px; }
  .sr-count { padding: 8px 18px 6px; font-size: 12px; }

  /* ── Pill buttons that widen to the right to show their label ── */
  #themeToggleWrap { align-items: flex-start; gap: 12px; }
  .theme-fab {
    width: auto; min-width: 44px; max-width: 44px;
    padding: 0 12px; border-radius: 22px;
    justify-content: flex-start; gap: 0;
    transition: max-width 0.35s ease, box-shadow 0.3s, background 0.4s;
  }
  .theme-fab > svg, .theme-fab > span { flex-shrink: 0; }
  #themeIcon {
    display: inline-flex; width: 20px; height: 20px;
    align-items: center; justify-content: center;
    font-size: 18px; line-height: 1;
  }
  .theme-fab::after {
    position: static; transform: none; background: none; border-radius: 0;
    padding: 0 6px 0 10px; font-size: 13px; font-weight: 700;
    color: inherit; opacity: 0;
    transition: opacity 0.25s ease 0.1s;
  }
  .theme-fab:hover { max-width: 260px; transform: none !important; }
  .theme-fab:hover::after { opacity: 1; }

  /* ── DARK MODE theme vars ── */
  body.dark-mode {
    background: #0f0f1a !important;
    color: #e0e0f0 !important;
  }
  body.dark-mode table      { background: #1a1a2e !important; color: #e0e0f0 !important; }
  body.dark-mode th         { background: #2d2d5e !important; color: #c0c0f0 !important; }
  body.dark-mode td         { border-color: #3a3a5e !important; }
  body.dark-mode tr:hover   { background: #22224a !important; }
  body.dark-mode input, body.dark-mode select {
    background: #1e1e3a !important; color: #e0e0f0 !important;
    border-color: #3a3a6a !important;
  }
  body.dark-mode input[readonly], body.dark-mode select:disabled {
    background: #1a1a32 !important;
    color: #c9d1d9 !important;
    -webkit-text-fill-color: #c9d1d9 !important;
    opacity: 1 !important;
  }
  body.dark-mode .header    { color: #e0e0f0 !important; }
  body.dark-mode h1, body.dark-mode h2, body.dark-mode h3,
  body.dark-mode p          { color: #e0e0f0 !important; }

  /* Dark mode — uv-btn adjustments (borders visible on dark bg) */
  body.dark-mode .uv-btn    { opacity: 0.92; }

  /* Invoice number input dark mode */
  body.dark-mode h2 input#invoice_number.invoice-input {
    color: #e6edf3 !important;
    -webkit-text-fill-color: #e6edf3 !important;
  }

  /* Print ALWAYS uses light mode regardless */
  @media print {
    body { background: white !important; color: black !important; }
    table { background: white !important; color: black !important; }
    th    { background: #2196F3 !important; color: black !important; }
    td    { border-color: black !important; }
    input, select { background: white !important; color: black !important; }
    h1, h2, h3, p { color: black !important; }
    #themeToggleWrap, #searchPanel { display: none !important; }
  }
`;
document.head.appendChild(style);

// ─────────────────────────────────────────────────────────────────────────────
// DOM
// ─────────────────────────────────────────────────────────────────────────────
const wrap = document.createElement('div');
wrap.id = 'themeToggleWrap';
wrap.innerHTML = `
  <button class="theme-fab" id="switchModeFab" data-tip="Switch mode">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/>
      <polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
    </svg>
  </button>
  <button class="theme-fab" id="searchFab" data-tip="Search items">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  </button>
  <button class="theme-fab" id="themeBtn" data-tip="Switch to dark mode">
    <span class="star1"></span><span class="star2"></span><span class="star3"></span>
    <span id="themeIcon">🌙</span>
  </button>
`;
document.body.appendChild(wrap);

// Search panel
const panel = document.createElement('div');
panel.id = 'searchPanel';
panel.innerHTML = `
  <div id="searchPanelHeader">
    <span>🔎</span>
    <span id="searchPanelTitle">Search Price List</span>
    <button id="searchPanelClose">✕</button>
  </div>
  <div id="searchInputWrap">
    <input type="text" id="searchInput" placeholder="Type code or description…" autocomplete="off" spellcheck="false">
  </div>
  <div id="searchResults"><div class="sr-empty">Start typing to search items</div></div>
`;
document.body.appendChild(panel);

// ─────────────────────────────────────────────────────────────────────────────
// THEME
// ─────────────────────────────────────────────────────────────────────────────

const themeBtn  = document.getElementById('themeBtn');
const themeIcon = document.getElementById('themeIcon');
let darkMode = localStorage.getItem('lcDarkMode') === 'true';

function applyTheme(dark) {
    darkMode = dark;
    document.body.classList.toggle('dark-mode', dark);
    themeIcon.textContent = dark ? '☀️' : '🌙';
    themeBtn.setAttribute('data-tip', dark ? 'Switch to light mode' : 'Switch to dark mode');
    localStorage.setItem('lcDarkMode', dark);
}

applyTheme(darkMode);

themeBtn.addEventListener('click', () => applyTheme(!darkMode));

// ─────────────────────────────────────────────────────────────────────────────
// SEARCH PANEL
// ─────────────────────────────────────────────────────────────────────────────
const searchFab   = document.getElementById('searchFab');
const searchPanel = document.getElementById('searchPanel');
const searchInput = document.getElementById('searchInput');
const resultsDiv  = document.getElementById('searchResults');

function openSearch() {
    searchPanel.classList.add('sp-open');
    setTimeout(() => searchInput.focus(), 80);
    searchFab.setAttribute('data-tip', 'Close search');
}

function closeSearch() {
    searchPanel.classList.remove('sp-open');
    searchInput.value = '';
    renderResults('');
    searchFab.setAttribute('data-tip', 'Search items');
}

searchFab.addEventListener('click', () => {
    searchPanel.classList.contains('sp-open') ? closeSearch() : openSearch();
});

document.getElementById('searchPanelClose').addEventListener('click', closeSearch);

// Close on Escape
document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && searchPanel.classList.contains('sp-open')) closeSearch();
});

// Live search
searchInput.addEventListener('input', () => renderResults(searchInput.value.trim()));

function highlight(text, query) {
    if (!query) return text;
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return text.replace(new RegExp(`(${escaped})`, 'gi'), '<em class="sr-match">$1</em>');
}

function renderResults(query) {
    if (typeof priceList === 'undefined') {
        resultsDiv.innerHTML = '<div class="sr-empty">Price list not loaded</div>';
        return;
    }

    if (!query) {
        resultsDiv.innerHTML = '<div class="sr-empty">Start typing to search items</div>';
        return;
    }

    const q = query.toLowerCase();
    const matches = priceList.filter(item =>
        item.code.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q)
    );

    if (matches.length === 0) {
        resultsDiv.innerHTML = `<div class="sr-empty">No items found for "<strong style="color:rgba(255,255,255,0.6)">${query}</strong>"</div>`;
        return;
    }

    const countHtml = `<div class="sr-count">${matches.length} result${matches.length !== 1 ? 's' : ''}</div>`;
    const itemsHtml = matches.slice(0, 40).map(item => `
        <div class="sr-item">
            <span class="sr-code">${highlight(item.code, query)}</span>
            <span class="sr-desc">${highlight(item.description, query)}</span>
            <span class="sr-price">R${item.price.toFixed(2)}</span>
        </div>
    `).join('');

    resultsDiv.innerHTML = countHtml + itemsHtml;
}

})();
