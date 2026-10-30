// Shared helpers for both apps.
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const peso = (n) => '₱' + Number(n || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const kg = (n) => Number(n || 0).toFixed(1) + ' kg';
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* private mode: keep working in memory */ } },
};

const ICONS = {
  back: '<path d="M15 18l-6-6 6-6"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  warn: '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18h.01"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  qr: '<path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 18h2v2h-2zM14 18h2v2h-2zM18 14h2v2h-2z"/>',
  chat: '<path d="M21 12a8 8 0 0 1-12 7l-5 1 1-5a8 8 0 1 1 16-3z"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17h.01"/>',
  coin: '<circle cx="12" cy="12" r="9"/><path d="M15 9.5C14 8 10 8 10 10.5s5 2 5 4.5-4 2.5-5.5 1M12 6v12"/>',
  eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  eyeoff: '<path d="M3 3l18 18"/><path d="M10 5.2A10 10 0 0 1 22 12a17 17 0 0 1-3 3.7M6.5 6.7A17 17 0 0 0 2 12s4 7 10 7a10 10 0 0 0 4-.8"/>',
  sound: '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12"/>',
  scale: '<path d="M4 20h16"/><rect x="5" y="12" width="14" height="8" rx="1.5"/><path d="M12 12V8M8 4h8l-1 4H9z"/>',
  camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="4"/>',
  phone: '<path d="M5 3h4l2 5-3 2a12 12 0 0 0 6 6l2-3 5 2v4a2 2 0 0 1-2 2A17 17 0 0 1 3 5a2 2 0 0 1 2-2z"/>',
  cloud: '<path d="M7 18a4.5 4.5 0 0 1-.6-9 6 6 0 0 1 11.4 1.6A3.8 3.8 0 0 1 17.5 18z"/>',
  nosignal: '<path d="M3 3l18 18"/><path d="M8.5 16.5a5 5 0 0 1 7 0M5 12.9a10 10 0 0 1 4-2.4M2 9.3a15 15 0 0 1 4.3-2.8M12 20h.01"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  truck: '<path d="M2 6h12v11H2zM14 10h4l4 4v3h-8z"/><circle cx="7" cy="18" r="2"/><circle cx="18" cy="18" r="2"/>',
  crate: '<path d="M3 8h18v12H3zM3 8l2-4h14l2 4M9 12h6"/>',
  print: '<path d="M6 9V3h12v6M6 17H3V9h18v8h-3"/><path d="M6 14h12v7H6z"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-5-5"/>',
  plastic: '<path d="M9 3h6v3l2 3v12H7V9l2-3z"/>',
  mixed: '<path d="M4 7h16l-2 14H6zM9 7V4h6v3"/>',
  spoiled: '<path d="M12 3s7 7 7 12a7 7 0 0 1-14 0c0-5 7-12 7-12z"/>',
  sellable: '<path d="M4 13a8 8 0 0 1 16 0c0 4-3 8-8 8s-8-4-8-8zM12 5c0-1 1-2 3-2"/>',
  other: '<circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>',
  logout: '<path d="M10 4H4v16h6M14 8l4 4-4 4M18 12H9"/>',
};
const icon = (name, size = 26) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;

// A sample pattern seeded from the ID. It looks like a QR but is not scannable; replace with a real QR library.
function qrSvg(seedText) {
  const N = 21;
  let seed = 7;
  for (const ch of String(seedText)) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
  const next = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed; };
  const finder = (x, y) => x < 7 && y < 7 && (x === 0 || x === 6 || y === 0 || y === 6 || (x > 1 && x < 5 && y > 1 && y < 5));
  let rects = '';
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const inTL = x < 8 && y < 8, inTR = x > N - 9 && y < 8, inBL = x < 8 && y > N - 9;
      let on;
      if (inTL) on = finder(x, y);
      else if (inTR) on = finder(x - (N - 7), y);
      else if (inBL) on = finder(x, y - (N - 7));
      else on = next() % 2 === 0;
      if (on) rects += `<rect x="${x}" y="${y}" width="1.02" height="1.02"/>`;
    }
  }
  return `<svg viewBox="0 0 ${N} ${N}" fill="#142823" role="img" aria-label="QR ${esc(seedText)}">${rects}</svg>`;
}

async function api(endpoint, action, data) {
  const res = await fetch(`../api/${endpoint}.php?action=${encodeURIComponent(action)}`, {
    method: data === undefined ? 'GET' : 'POST',
    credentials: 'same-origin',
    headers: data === undefined ? {} : { 'Content-Type': 'application/json' },
    body: data === undefined ? undefined : JSON.stringify(data),
  });
  const json = await res.json();
  if (!json.ok) {
    const err = new Error(json.error || 'server_error');
    err.code = json.error;
    err.status = res.status;
    throw err;
  }
  return json;
}

const SPEECH_LANG = { fil: 'fil-PH', ilo: 'fil-PH', en: 'en-PH' };
function speak(text, lang) {
  if (!('speechSynthesis' in window) || !text) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = SPEECH_LANG[lang] || 'en-PH';
  u.rate = 0.9;
  speechSynthesis.speak(u);
}

function toast(text) {
  document.querySelector('.toast')?.remove();
  const el = document.createElement('div');
  el.className = 'toast';
  el.setAttribute('role', 'status');
  el.textContent = text;
  document.querySelector('.phone').appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

const pad2 = (n) => String(n).padStart(2, '0');
const localDateTime = (d = new Date()) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
const fmtDate = (s, lang) => new Date(String(s).replace(' ', 'T')).toLocaleDateString(lang === 'en' ? 'en-PH' : 'fil-PH', { month: 'short', day: 'numeric' });
const fmtTime = (s) => new Date(String(s).replace(' ', 'T')).toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' });
const initials = (name) => String(name).split('·')[0].trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
function uuid() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = crypto.getRandomValues(new Uint8Array(1))[0] & 15;
    return (c === 'x' ? r : (r & 3) | 8).toString(16);
  });
}
