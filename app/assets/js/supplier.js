// Supplier app. Hash-based screens, so the phone's Back button works.
const S = {
  lang: store.get('wl_lang', null),
  tts: store.get('wl_tts', true),
  hidden: store.get('wl_hidden', false),
  phone: '', otp: '', demoCode: '', error: '', filter: 'all', data: null, say: '',
};
const app = document.getElementById('app');
const T = () => WL_L[S.lang || 'fil'];
const go = (h) => { if (location.hash === '#' + h) render(); else location.hash = h; };
const route = () => { const [name, arg] = location.hash.slice(1).split('/'); return { name: name || (S.data ? 'home' : 'lang'), arg }; };
const PUBLIC = ['lang', 'phone', 'otp', 'apply', 'applied'];
const errText = (e) => T().e[e?.code] || T().e[e instanceof TypeError ? 'network' : 'server_error'];
const unread = () => (S.data ? S.data.messages.filter((m) => m.direction === 'out' && !m.read_at).length : 0);

const topBar = (backTo) => `<div class="top">
  ${backTo ? `<button class="pill" data-go="${backTo}">${icon('back')}<span>${esc(T().back)}</span></button>` : ''}
  <span class="grow"></span>
  ${S.tts ? `<button class="pill plain" data-act="listen">${icon('sound', 22)}<span>${esc(T().listen)}</span></button>` : ''}
</div>`;

const navBar = (cur) => {
  const t = T();
  const item = (name, ic, label) => `<button data-go="${name}" ${cur === name ? 'aria-current="page"' : ''}>${name === 'inbox' && unread() ? `<span class="count">${unread()}<span hidden> unread</span></span>` : ''}${icon(ic)}<span>${esc(label)}</span></button>`;
  return `<nav class="nav" aria-label="Main">
    ${item('home', 'home', t.nHome)}${item('history', 'list', t.nHist)}
    <button class="qr" data-go="qr" ${cur === 'qr' ? 'aria-current="page"' : ''}><span class="fab">${icon('qr', 34)}</span><span>${esc(t.nQr)}</span></button>
    ${item('inbox', 'chat', t.nInbox)}${item('me', 'user', t.nMe)}
  </nav>`;
};

const keypad = (act) => `<div class="keys">${['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'].map((k) => (k === '' ? '<span></span>'
  : `<button class="key" data-act="${act}" data-k="${k}" aria-label="${k === 'del' ? 'Delete' : k}">${k === 'del' ? '⌫' : k}</button>`)).join('')}</div>`;

const payTag = (d) => {
  if (d.pay_note === 'tbd') return 'Rate [TBD]';
  if (d.pay_note === 'baseline') return 'Baseline';
  return (d.amount_now > 0 ? '+' : '') + peso(d.amount_now);
};
const gradeBadge = (g) => `<span class="badge ${g}">${icon(g === 'clean' ? 'check' : g === 'minor' ? 'warn' : 'x', 16)}${esc(T().g[g])}</span>`;

const loadRow = (d) => `<button class="card" data-go="receipt/${d.id}">
  <span class="spread"><span class="bold">${esc(fmtDate(d.occurred_at, S.lang))} · ${kg(d.net_now)}</span><span class="bold">${esc(payTag(d))}</span></span>
  <span class="spread">${gradeBadge(d.grade)}<span class="small sub">${esc(fmtTime(d.occurred_at))}</span></span>
</button>`;

const SCREENS = {
  lang() {
    const t = T();
    S.say = t.chooseLang;
    const opt = (code, name) => `<button class="btn ${S.lang === code ? '' : 'outline'}" data-act="pick-lang" data-lang="${code}" aria-pressed="${S.lang === code}">${S.lang === code ? icon('check') : ''}${name}</button>`;
    return `<div class="screen"><div class="scroll">
      <img src="../assets/img/placeholder-logo.svg" alt="Logo placeholder" width="96" height="96" style="align-self:center;margin-top:16px">
      <h1 class="center">WasteLedger PH</h1><p class="center sub">${esc(t.tagline)}</p>
      <h2 class="center">${esc(t.chooseLang)}</h2>
      ${opt('fil', 'Filipino')}${opt('ilo', 'Ilokano')}${opt('en', 'English')}
      <p class="center sub small">${esc(t.chooseLangSub)}</p>
    </div><div class="foot"><button class="btn big" data-go="phone" ${S.lang ? '' : 'disabled'}>${esc(t.cont)}</button></div></div>`;
  },
  phone() {
    const t = T();
    S.say = t.signTitle + '. ' + t.signSub;
    const d = S.phone.padEnd(11, ' ');
    const shown = `${d.slice(0, 4)} ${d.slice(4, 7)} ${d.slice(7)}`.trim();
    return `<div class="screen">${topBar('lang')}<div class="scroll">
      <h1>${esc(t.signTitle)}</h1><p class="sub">${esc(t.signSub)}</p>
      <div class="display" aria-label="${esc(t.mobile)}" aria-live="polite" style="font-size:32px">${esc(shown) || '<small>09__ ___ ____</small>'}</div>
      ${S.error ? `<p class="error" role="alert">${icon('warn', 22)}<span>${esc(S.error)}</span></p>` : ''}
      ${keypad('phone-key')}
      <p class="sub small">${esc(t.privacy)}</p>
      <button class="btn outline" data-go="apply">${esc(t.noAccount)}</button>
      <div class="note small">Demo: 0917 000 0207 (Ben) · 0917 000 0112 (Nena) · 0917 000 0145 (Luz)</div>
    </div><div class="foot"><button class="btn big" data-act="send-code" ${S.phone.length === 11 ? '' : 'disabled'}>${esc(t.sendCode)}</button></div></div>`;
  },
  otp() {
    const t = T();
    S.say = t.otpTitle;
    const cells = Array.from({ length: 6 }, (_, i) => `<span>${esc(S.otp[i] || '')}</span>`).join('');
    return `<div class="screen">${topBar('phone')}<div class="scroll">
      <h1>${esc(t.otpTitle)}</h1><p class="sub">${esc(t.otpSub)} ${esc(S.phone)}</p>
      <div class="otp" aria-label="${esc(t.otpTitle)}" aria-live="polite">${cells}</div>
      ${S.error ? `<p class="error" role="alert">${icon('warn', 22)}<span>${esc(S.error)}</span></p>` : ''}
      <button class="card" data-act="fill-otp"><span class="spread"><span><span class="small sub">${esc(t.autofill)}</span><br><b>${esc(S.demoCode)}</b></span><span class="badge">${esc(t.tapFill)}</span></span></button>
      ${keypad('otp-key')}
    </div></div>`;
  },
  home() {
    const t = T(), d = S.data, s = d.supplier;
    const pct = Math.min(100, Math.round((d.balance / d.threshold) * 100));
    const left = Math.max(0, d.threshold - d.balance);
    const line = d.balance >= d.threshold ? t.ready : t.more(peso(left));
    S.say = t.sayBal(peso(d.balance), line);
    const last = d.history[0];
    return `<div class="screen"><div class="hero">
      <div class="row">
        <span class="avatar" aria-hidden="true">${esc(initials(s.name))}</span>
        <span class="grow"><span class="small">${esc(t.greet)},</span><br><b>${esc(s.name.split('·')[0].trim())}</b></span>
        <button class="ghost" data-act="cycle-lang" aria-label="${esc(t.language)}">${esc(t.code)}</button>
        ${S.tts ? `<button class="ghost" data-act="listen" aria-label="${esc(t.listen)}">${icon('sound', 22)}</button>` : ''}
      </div>
      <div class="spread"><span>${esc(t.balance)}</span>
        <button class="ghost" data-act="toggle-hide">${icon(S.hidden ? 'eye' : 'eyeoff', 20)}${esc(S.hidden ? t.show : t.hide)}</button></div>
      <div class="money" aria-live="polite">${S.hidden ? '₱ ••••' : esc(peso(d.balance))}</div>
      <div class="track" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><span style="width:${pct}%"></span></div>
      <div class="small"><b>${esc(line)}</b><br>${esc(t.keep)}</div>
    </div>
    <div class="scroll">
      <div class="tiles">
        <button class="tile" data-go="qr">${icon('qr', 34)}${esc(t.aQr)}</button>
        <button class="tile" data-go="history">${icon('list', 34)}${esc(t.aHist)}</button>
        <button class="tile" data-go="payout">${icon('coin', 34)}${esc(t.aPay)}</button>
        <button class="tile" data-go="help">${icon('help', 34)}${esc(t.aHelp)}</button>
      </div>
      ${last ? `<div class="spread"><h2>${esc(t.last)}</h2><button class="chip" data-go="history">${esc(t.seeAll)}</button></div>${loadRow(last)}${miniTracker(last)}` : ''}
      <div class="card"><h2>${esc(t.impactT)}</h2>
        <div class="kv"><span>${esc(t.accepted)}</span><span>${kg(d.month.kg)}</span></div>
        <div class="kv"><span>${esc(t.composted)}</span><span>${kg(d.month.composted)}</span></div>
        <div class="kv"><span>${esc(t.earned)}</span><span>${esc(peso(d.month.earned))}</span></div>
      </div>
    </div>${navBar('home')}</div>`;
  },
  qr() {
    const t = T(), s = S.data.supplier;
    S.say = t.qrTitle + '. ' + t.qrSub;
    return `<div class="screen">${topBar('home')}<div class="scroll">
      <div class="qr-card"><b style="font-size:21px">${esc(t.qrSub)}</b>
        <div class="qr-box">${qrSvg(s.id)}</div>
        <div class="center"><div class="small">${esc(t.supplierId)}</div><div style="font-size:30px;font-weight:700">${esc(s.id)}</div><div>${esc(s.name)}</div></div></div>
      <div class="note small">${esc(t.qrTip)}<br>${esc(t.qrSample)}</div>
    </div>${navBar('qr')}</div>`;
  },
  history() {
    const t = T(), d = S.data;
    S.say = t.histTitle;
    const rows = d.history.filter((h) => S.filter === 'all' || h.grade === S.filter);
    const chip = (k, label) => `<button class="chip" data-act="filter" data-f="${k}" aria-pressed="${S.filter === k}">${esc(label)}</button>`;
    const members = Object.entries(d.members);
    return `<div class="screen">${topBar()}<div class="scroll">
      <h1>${esc(t.histTitle)}</h1>
      <div class="chips">${chip('all', t.all)}${chip('clean', t.g.clean)}${chip('minor', t.g.minor)}${chip('rejected', t.g.rejected)}</div>
      ${rows.length ? rows.map(loadRow).join('') : `<p class="sub">${esc(t.noHist)}</p>`}
      ${d.carried > 0 && S.filter === 'all' ? `<div class="card"><div class="spread"><span>${esc(t.carried)}</span><b>${esc(peso(d.carried))}</b></div></div>` : ''}
      ${members.length ? `<div class="card"><h2>${esc(t.byMember)}</h2>${members.map(([n, a]) => `<div class="kv"><span>${esc(n)}</span><span>${esc(peso(a))}</span></div>`).join('')}</div>` : ''}
    </div>${navBar('history')}</div>`;
  },
  receipt(id) {
    const t = T();
    const d = S.data.history.find((h) => String(h.id) === String(id));
    if (!d) return SCREENS.history();
    S.say = `${kg(d.net_now)}. ${t.g[d.grade]}. ${payTag(d)}.`;
    return `<div class="screen">${topBar('history')}<div class="scroll">
      <h1>${esc(t.recTitle)}</h1>
      ${tracker(d)}
      <img class="photo-img" src="../assets/img/placeholder-photo.svg" alt="${esc(t.photoAlt)}">
      <div class="card">
        <div class="kv"><span>${esc(t.weight)}</span><span>${kg(d.net_now)}</span></div>
        ${d.corrected_kg ? `<div class="kv"><span>${esc(t.corrected)}</span><span>${kg(d.net_kg)} → ${kg(d.corrected_kg)}</span></div>` : ''}
        <div class="kv"><span>${esc(t.grade)}</span><span>${esc(t.g[d.grade])}</span></div>
        ${d.reason ? `<div class="kv"><span>${esc(t.reasonL)}</span><span>${esc(t.reasons[d.reason])}</span></div>` : ''}
        <div class="kv"><span>${esc(t.rate)}</span><span>${d.rate_applied ? esc(peso(d.rate_applied)) : d.pay_note === 'tbd' ? '[TBD]' : '—'}</span></div>
        <div class="kv"><span>${esc(t.kita)}</span><span>${esc(payTag(d))}</span></div>
        ${d.member ? `<div class="kv"><span>${esc(t.member)}</span><span>${esc(d.member)}</span></div>` : ''}
        <div class="kv"><span>${esc(t.station)}</span><span>${esc(d.station)}</span></div>
        <div class="kv"><span>${esc(t.recId)}</span><span>${esc(d.record_no)}</span></div>
      </div>
    </div></div>`;
  },
  payout() {
    const t = T(), d = S.data, p = d.payout;
    const thr = peso(d.threshold);
    const reached = p.state !== 'below';
    const approved = p.state === 'sending';
    S.say = p.state === 'below' ? t.payBelow(thr) : t.payWait;
    const acct = `${d.supplier.channel === 'gcash' ? t.gcash : t.bank} ${d.supplier.account}`;
    const step = (cls, ic, title, sub) => `<div class="step ${cls}"><span class="dot">${icon(ic, 18)}</span><div><b>${esc(title)}</b>${sub ? `<br><span class="small sub">${esc(sub)}</span>` : ''}</div></div>`;
    const amount = p.latest && p.latest.status === 'pending' ? p.latest.amount : d.balance;
    return `<div class="screen">${topBar('home')}<div class="scroll">
      <h1>${esc(t.payTitle)}</h1>
      <div class="card"><div class="kv"><span>${esc(t.payAmount)}</span><span style="font-size:24px">${esc(peso(amount))}</span></div>
        <div class="kv"><span>${esc(t.payAccount)}</span><span>${esc(acct)}</span></div></div>
      <div class="card"><div class="steps">
        ${step(reached ? 'done' : 'now', reached ? 'check' : 'clock', t.tReached(thr), reached ? '' : t.more(peso(Math.max(0, d.threshold - d.balance))))}
        ${step(approved ? 'done' : (p.state === 'approving' || p.state === 'reached') ? 'now' : '', approved ? 'check' : 'clock', t.tApprove, '')}
        ${step(approved ? 'now' : '', approved ? 'clock' : 'coin', `${t.tSent} ${acct}`, '')}
      </div></div>
      <div class="note">${esc(p.state === 'below' ? t.payBelow(thr) : t.payWait)}</div>
      <p class="sub small">${esc(t.fee)}</p>
      <h2>${esc(t.payPast)}</h2>
      ${p.all.filter((x) => x.status !== 'pending').map((x) => `<div class="card"><div class="spread"><b>${esc(peso(x.amount))}</b><span class="small sub">${esc(fmtDate(x.updated_at, S.lang))}</span></div>
        <div class="row small">${icon(x.status === 'sent' ? 'check' : 'warn', 20)}<span>${esc(t.st[x.status])}</span></div><div class="small sub">${esc(t.ref)} ${esc(x.ref)}</div></div>`).join('') || `<p class="sub">${esc(t.payNone)}</p>`}
    </div></div>`;
  },
  inbox() {
    const t = T(), d = S.data;
    S.say = t.inboxTitle;
    const last = d.messages[d.messages.length - 1];
    return `<div class="screen">${topBar()}<div class="scroll">
      <h1>${esc(t.inboxTitle)}</h1>
      ${last ? `<button class="card" data-go="chat"><span class="row"><span class="avatar" aria-hidden="true">${icon('scale', 24)}</span>
        <span class="grow"><b>${esc(t.stationName)}</b><br><span class="small sub">${esc(last.body)}</span></span>
        ${unread() ? `<span class="badge minor">${unread()}</span>` : ''}</span></button>` : `<p class="sub">${esc(t.noMsg)}</p>`}
    </div>${navBar('inbox')}</div>`;
  },
  chat() {
    const t = T(), d = S.data;
    const lastOut = [...d.messages].reverse().find((m) => m.direction === 'out');
    S.say = lastOut ? lastOut.body : t.noMsg;
    return `<div class="screen">${topBar('inbox')}<div class="scroll" id="thread">
      ${d.messages.map((m) => `<div class="bubble ${m.direction === 'in' ? 'me' : ''}">${esc(m.body)}<time>${esc(fmtDate(m.created_at, S.lang))} ${esc(fmtTime(m.created_at))}</time></div>`).join('')}
    </div><div class="foot"><div class="chips">
      <button class="chip" data-act="quick" data-text="${esc(t.q1)}">${esc(t.q1)}</button>
      <button class="chip" data-act="quick" data-text="${esc(t.q2)}" data-call="1">${icon('phone', 18)}${esc(t.q2)}</button>
      <button class="chip" data-act="quick" data-text="${esc(t.qBal)}" data-kw="balance">${icon('coin', 18)}${esc(t.qBal)}</button>
    </div></div></div>`;
  },
  help() {
    const t = T();
    S.say = [t.helpTitle, t.h1, t.h2, t.h3, t.h4].join('. ');
    const h = (n, text) => `<div class="row"><span class="avatar">${n}</span><b>${esc(text)}</b></div>`;
    const li = (ic, text) => `<div class="row">${icon(ic, 24)}<span>${esc(text)}</span></div>`;
    return `<div class="screen">${topBar('home')}<div class="scroll">
      <h1>${esc(t.helpTitle)}</h1>
      ${h(1, t.h1)}${h(2, t.h2)}${h(3, t.h3)}${h(4, t.h4)}
      <div class="card"><h2>${esc(t.okT)}</h2>${li('check', t.ok1)}${li('check', t.ok2)}${li('check', t.ok3)}</div>
      <div class="card"><h2>${esc(t.noT)}</h2>${li('x', t.no1)}${li('x', t.no2)}${li('x', t.no3)}</div>
      <div class="note warn"><b>${esc(t.call)}</b><br>${esc(S.data.hotline)}</div>
    </div></div>`;
  },
  me() {
    const t = T(), s = S.data.supplier;
    S.say = t.meTitle;
    const opt = (code, name) => `<button class="chip" data-act="pick-lang" data-lang="${code}" aria-pressed="${S.lang === code}">${S.lang === code ? icon('check', 18) : ''}${name}</button>`;
    return `<div class="screen">${topBar()}<div class="scroll">
      <h1>${esc(t.meTitle)}</h1>
      <div class="card"><b>${esc(s.name)}</b><span class="small sub">${esc(s.id)} · ${esc(s.section)}</span></div>
      <div class="card"><h2>${esc(t.language)}</h2><div class="chips">${opt('fil', 'Filipino')}${opt('ilo', 'Ilokano')}${opt('en', 'English')}</div></div>
      <label class="check"><input type="checkbox" data-act="toggle-tts" ${S.tts ? 'checked' : ''}><span><b>${esc(t.readAloud)}</b><br><span class="small sub">${esc(t.readAloudSub)}</span></span></label>
      <button class="btn outline" data-go="help">${icon('help')}${esc(t.helpRow)}</button>
      <button class="btn outline" data-act="logout">${icon('logout')}${esc(t.logout)}</button>
    </div>${navBar('me')}</div>`;
  },
  apply() {
    const t = T();
    S.say = t.applyTitle + '. ' + t.applySub;
    return `<div class="screen">${topBar('phone')}<form class="scroll" id="apply-form">
      <h1>${esc(t.applyTitle)}</h1><p class="sub">${esc(t.applySub)}</p>
      <label class="field">${esc(t.name)}<input name="name" required autocomplete="name"></label>
      <label class="field">${esc(t.type)}<select name="type"><option value="vendor">${esc(t.vendor)}</option><option value="coop">${esc(t.coop)}</option></select></label>
      <label class="field">${esc(t.section)}<input name="section" required></label>
      <label class="field">${esc(t.mobile)}<input name="mobile" inputmode="numeric" maxlength="11" placeholder="09XXXXXXXXX" required></label>
      <label class="field">${esc(t.channel)}<select name="channel"><option value="gcash">${esc(t.gcash)}</option><option value="bank">${esc(t.bank)}</option></select></label>
      <label class="field">${esc(t.account)}<input name="account" inputmode="numeric" maxlength="40" required></label>
      <p class="sub small">${esc(t.noGovId)}</p>
      ${S.error ? `<p class="error" role="alert">${icon('warn', 22)}<span>${esc(S.error)}</span></p>` : ''}
      <button class="btn big" type="submit">${esc(t.submit)}</button>
    </form></div>`;
  },
  applied(id) {
    const t = T();
    S.say = t.appliedTitle + ' ' + t.appliedSub;
    return `<div class="screen"><div class="scroll center" style="justify-content:center;align-items:center">
      <span class="avatar" style="width:80px;height:80px;border-radius:40px;background:var(--forest);color:var(--cream)">${icon('check', 44)}</span>
      <h1>${esc(t.appliedTitle)}</h1><p class="sub">${esc(t.appliedSub)}</p><div class="money">${esc(id)}</div>
    </div><div class="foot"><button class="btn big" data-go="phone">${esc(t.goHome)}</button></div></div>`;
  },
};

function miniTracker(d) {
  const t = T();
  const parts = [[t.stWeighed, true], [t.stBal, d.pay_note === 'paid'], [t.stCompost, !!Number(d.composted)]];
  return `<div class="mini">${parts.map(([label, on]) => `<div class="${on ? 'on' : ''}"><i></i>${on ? icon('check', 16) : ''}<span>${esc(label)}</span></div>`).join('')}</div>`;
}

function tracker(d) {
  const t = T();
  const paidTitle = { paid: t.sPaid, tbd: t.sTbd, baseline: t.sBase, rejected: t.sNotPaid }[d.pay_note];
  const steps = [[d.grade === 'rejected' ? 'bad' : 'done', d.grade === 'rejected' ? 'x' : 'check', t.sWeighed, fmtTime(d.occurred_at)], ['done', 'check', t.sPhoto, '']];
  steps.push([d.pay_note === 'paid' ? 'done' : d.pay_note === 'rejected' ? 'bad' : 'now', d.pay_note === 'paid' ? 'check' : d.pay_note === 'rejected' ? 'x' : 'clock', paidTitle, d.pay_note === 'paid' ? peso(d.amount_now) : '']);
  if (d.grade !== 'rejected') steps.push([d.composted ? 'done' : 'now', d.composted ? 'check' : 'clock', d.composted ? t.sComp : t.sPend, '']);
  return `<div class="card"><div class="steps">${steps.map(([c, ic, a, b]) => `<div class="step ${c}"><span class="dot">${icon(ic, 18)}</span><div><b>${esc(a)}</b>${b ? `<br><span class="small sub">${esc(b)}</span>` : ''}</div></div>`).join('')}</div></div>`;
}

async function load() {
  try {
    const res = await api('supplier', 'summary');
    S.data = res;
    if (S.data.supplier.lang && !S.lang) setLang(S.data.supplier.lang);
    return true;
  } catch (e) {
    S.data = null;
    return false;
  }
}
function setLang(l) {
  S.lang = l;
  store.set('wl_lang', l);
  document.documentElement.lang = l === 'en' ? 'en' : 'fil';
}

function render() {
  const { name, arg } = route();
  if (!PUBLIC.includes(name) && !S.data) { location.hash = S.lang ? 'phone' : 'lang'; return; }
  if (PUBLIC.includes(name) && S.data && name !== 'lang') { location.hash = 'home'; return; }
  const fn = SCREENS[name] || SCREENS.home;
  app.innerHTML = fn(arg);
  const scroller = document.getElementById('thread');
  if (scroller) scroller.scrollTop = scroller.scrollHeight;
  document.querySelector('h1')?.setAttribute('tabindex', '-1');
}

const ACTIONS = {
  async 'pick-lang'(el) {
    setLang(el.dataset.lang);
    if (S.data) await api('supplier', 'set_lang', { lang: S.lang }).catch(() => {});
    render();
  },
  async 'cycle-lang'() {
    const order = ['fil', 'ilo', 'en'];
    setLang(order[(order.indexOf(S.lang) + 1) % 3]);
    await api('supplier', 'set_lang', { lang: S.lang }).catch(() => {});
    render();
  },
  listen() { speak(S.say, S.lang); },
  'toggle-hide'() { S.hidden = !S.hidden; store.set('wl_hidden', S.hidden); render(); },
  'toggle-tts'(el) { S.tts = el.checked; store.set('wl_tts', S.tts); render(); },
  filter(el) { S.filter = el.dataset.f; render(); },
  'phone-key'(el) {
    S.error = '';
    S.phone = el.dataset.k === 'del' ? S.phone.slice(0, -1) : (S.phone + el.dataset.k).slice(0, 11);
    render();
  },
  async 'send-code'() {
    S.error = '';
    try {
      const r = await api('auth', 'request_code', { mobile: S.phone });
      S.demoCode = r.demo_code;
      S.otp = '';
      go('otp');
    } catch (e) { S.error = errText(e); render(); }
  },
  'otp-key'(el) {
    S.error = '';
    S.otp = el.dataset.k === 'del' ? S.otp.slice(0, -1) : (S.otp + el.dataset.k).slice(0, 6);
    if (S.otp.length === 6) verify(); else render();
  },
  'fill-otp'() { S.otp = S.demoCode; verify(); },
  async quick(el) {
    await api('supplier', 'send_message', { text: el.dataset.text, keyword: el.dataset.kw || '', wants_call: el.dataset.call === '1' });
    await load();
    await api('supplier', 'mark_read', {});
    await load();
    render();
  },
  async logout() {
    await api('auth', 'logout', { who: 'supplier' });
    S.data = null; S.phone = ''; S.otp = '';
    go('phone');
  },
};

async function verify() {
  try {
    await api('auth', 'verify_code', { mobile: S.phone, code: S.otp });
    await load();
    if (S.lang) await api('supplier', 'set_lang', { lang: S.lang }).catch(() => {});
    await load();
    go('home');
  } catch (e) {
    S.otp = '';
    S.error = errText(e);
    render();
  }
}

document.addEventListener('click', (ev) => {
  const nav = ev.target.closest('[data-go]');
  if (nav && !nav.disabled) { go(nav.dataset.go); return; }
  const el = ev.target.closest('button[data-act]');
  if (el && !el.disabled) ACTIONS[el.dataset.act]?.(el);
});
document.addEventListener('change', (ev) => {
  if (ev.target.matches('input[data-act]')) ACTIONS[ev.target.dataset.act]?.(ev.target);
});
document.addEventListener('submit', async (ev) => {
  if (ev.target.id !== 'apply-form') return;
  ev.preventDefault();
  S.error = '';
  const form = Object.fromEntries(new FormData(ev.target));
  try {
    const r = await api('applications', 'apply', { ...form, lang: S.lang });
    go('applied/' + r.id);
  } catch (e) {
    const box = ev.target.querySelector('.error') || document.createElement('p');
    box.className = 'error';
    box.setAttribute('role', 'alert');
    box.textContent = errText(e);
    ev.target.querySelector('button[type=submit]').before(box);
  }
});
window.addEventListener('hashchange', async () => {
  const { name } = route();
  if (S.data && name !== 'phone') await load();
  if (S.data && name === 'chat') { await api('supplier', 'mark_read', {}).catch(() => {}); }
  render();
  if (S.data && name === 'chat') { await load(); }
});

(async function start() {
  if (S.lang) setLang(S.lang);
  await load();
  if (!location.hash) location.hash = S.data ? 'home' : 'lang';
  else render();
})();
