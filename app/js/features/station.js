// Station staff app. Loads are saved on the phone first, then uploaded (FR24).
const S = {
  lang: store.get('st_lang', 'fil'),
  demoOffline: store.get('st_offline', false),
  cache: store.get('st_cache', null),
  queue: store.get('st_queue', []),
  today: store.get('st_today', []),
  pin: '', error: '', flow: null, last: null, showCrates: false, syncing: false, manifests: null,
};
const app = document.getElementById('app');
const T = () => ST_L[S.lang];
const isOffline = () => S.demoOffline || !navigator.onLine;
const go = (h) => { if (location.hash === '#' + h) render(); else location.hash = h; };
const route = () => { const [name, arg] = location.hash.slice(1).split('/'); return { name: name || 'home', arg }; };
const errText = (e) => T().e[e?.code] || T().e[e instanceof TypeError ? 'network' : 'server_error'];
const supplierById = (id) => S.cache?.suppliers.find((x) => x.id === id);
const errorLine = () => (S.error ? `<p class="error" role="alert">${icon('warn', 22)}<span>${esc(S.error)}</span></p>` : '');
const FLOW = ['scan', 'weigh', 'photo', 'grade', 'confirm'];

function netChip() {
  const t = T(), n = S.queue.length;
  const label = isOffline() ? t.offline : t.online;
  return `<button class="chip" data-act="toggle-net" aria-pressed="${isOffline()}">${icon(isOffline() ? 'nosignal' : 'cloud', 20)}${esc(label)}${n ? ` · ${esc(t.waiting(n))}` : ''}</button>`;
}
function flowTop(backTo) {
  const t = T(), idx = FLOW.indexOf(route().name);
  return `<div class="top"><button class="pill" data-go="${backTo}">${icon('back')}<span>${esc(t.back)}</span></button><span class="grow"></span>${isOffline() ? `<span class="badge minor">${icon('nosignal', 18)}${esc(t.offline)}</span>` : ''}</div>
  <div class="stepper">${t.steps.map((s, i) => `<div class="${i <= idx ? 'on' : ''} ${i === idx ? 'cur' : ''}" ${i === idx ? 'aria-current="step"' : ''}><i></i>${esc(s)}</div>`).join('')}</div>`;
}
const toolTop = (backTo) => `<div class="top"><button class="pill" data-go="${backTo}">${icon('back')}<span>${esc(T().back)}</span></button><span class="grow"></span></div>`;
const whoCard = () => {
  const s = S.flow.supplier;
  return `<div class="note row"><span class="avatar" aria-hidden="true">${esc(initials(s.name))}</span><span class="grow"><b>${esc(s.name)}</b><br><span class="small">${esc(s.id)} · ${esc(T().balance)} ${esc(peso(s.balance))}</span></span>${icon('check')}</div>`;
};
const keypad = (act, dot) => `<div class="keys">${['1', '2', '3', '4', '5', '6', '7', '8', '9', dot ? '.' : '', '0', 'del'].map((k) => (k === '' ? '<span></span>'
  : `<button class="key" data-act="${act}" data-k="${k}" aria-label="${k === 'del' ? 'Delete' : k}">${k === 'del' ? '⌫' : k}</button>`)).join('')}</div>`;

// Same logic as the server, so the amount is right offline too. The server recalculates on upload.
function previewPay(supplier, grade, net) {
  if (grade === 'rejected') return { note: 'rejected', amount: 0 };
  if (S.cache.baseline) return { note: 'baseline', amount: 0 };
  const r = S.cache.rates;
  const rate = supplier.tag === 'existing' ? (grade === 'clean' ? r.existing_bonus : null) : (grade === 'clean' ? r.clean : r.minor);
  if (rate === null) return { note: 'tbd', amount: 0 };
  return { note: 'paid', amount: Math.round(net * rate * 100) / 100, rate };
}
const payLabel = (p) => (p.note === 'tbd' ? 'Rate [TBD]' : p.note === 'baseline' ? 'Baseline' : peso(p.amount));

const SCREENS = {
  login() {
    const t = T();
    return `<div class="screen"><div class="scroll">
      <img src="${APP_ROOT}assets/images/logo.png" alt="WasteLedger PH" width="84" height="84" class="logo">
      <h1 class="center">${esc(t.loginTitle)}</h1>
      <div class="display" data-announce="${S.pin.length ? esc(t.pinCount(S.pin.length)) : ''}">${'•'.repeat(S.pin.length) || '<small>PIN</small>'}</div>
      ${errorLine()}${keypad('pin-key', false)}
      <div class="note small">Demo PINs: 1234 (Kuya Jun), 5678 (Ate Carmen), 2468 (Kuya Dante)</div>
    </div><div class="foot"><button class="btn big" data-act="login" ${S.pin.length ? '' : 'disabled'}>${esc(t.login)}</button></div></div>`;
  },
  home() {
    const t = T(), c = S.cache;
    const queued = S.queue.map((q) => ({ name: supplierById(q.supplier_id)?.name, net_kg: q.preview_net, grade: q.grade, occurred_at: q.occurred_at, q: true, err: q.error }));
    const loads = [...queued, ...S.today];
    const totalKg = loads.filter((l) => l.grade !== 'rejected').reduce((a, l) => a + Number(l.corrected_kg ?? l.net_kg), 0);
    return `<div class="screen"><div class="hero">
      <div class="row"><span class="avatar" aria-hidden="true">${icon('scale')}</span>
        <div class="grow"><h1 class="hero-title">${esc(t.stationTitle)}</h1><span class="small">${esc(c.staff.station)} · ${esc(c.staff.name)}</span></div>
        <button class="ghost" data-act="cycle-lang" aria-label="${esc(t.language)}: ${esc(t.code)}">${esc(t.code)}</button></div>
      <div class="row">${netChip()}</div>
      <div class="tiles"><div class="stat"><span>${esc(t.today)}</span><b>${totalKg.toFixed(1)} kg</b></div><div class="stat"><span>${esc(t.loadsL)}</span><b>${loads.length}</b></div></div>
    </div>
    <div class="scroll">
      ${c.baseline ? `<div class="note warn">${esc(t.baseline)}</div>` : ''}
      <h2>${esc(t.todayLoads)}</h2>
      ${loads.length ? loads.map((l) => `<${l.id ? `button data-go="correct/${l.id}"` : 'div'} class="card">
        <span class="spread"><b>${esc(l.name)}</b><b class="nowrap">${kg(l.corrected_kg ?? l.net_kg)}</b></span>
        <span class="spread small"><span class="sub">${esc(fmtTime(l.occurred_at))} · ${esc(t.g[l.grade])}</span><span class="row">${icon(l.q ? 'clock' : 'check', 18)}${esc(l.err ? t.failedSync : l.q ? t.queued : t.synced)}</span></span>
        ${l.flags ? `<span class="badge minor">${icon('warn', 16)}${esc(t.forReview)}</span>` : ''}
      </${l.id ? 'button' : 'div'}>`).join('') : `<p class="sub">${esc(t.noLoads)}</p>`}
    </div>
    <div class="foot">
      <button class="btn big" data-act="start">${icon('scale', 32)}${esc(t.weighBtn)}</button>
      <button class="btn outline" data-go="tools">${esc(t.more)}${c.pending.length ? ` <span class="badge minor">${c.pending.length}</span>` : ''}</button>
    </div></div>`;
  },
  scan() {
    const t = T();
    const crates = S.cache.suppliers.flatMap((s) => s.crates.map((c) => ({ s, c })));
    return `<div class="screen">${flowTop('home')}<div class="scroll">
      <h1>${esc(t.scanTitle)}</h1><p class="sub">${esc(t.scanSub)}</p>
      ${S.showCrates ? `<h2>${esc(t.pickCrate)}</h2>${crates.map(({ s, c }) => `<button class="card" data-act="pick-crate" data-s="${esc(s.id)}" data-c="${esc(c.code)}"><b>${esc(c.code)}</b><span class="small sub">${esc(s.name)}</span></button>`).join('')}`
        : `<button class="scanner" data-act="show-crates"><span class="frame" aria-hidden="true"></span>${esc(t.tapScan)}</button>`}
      <label class="field">${esc(t.search)}<input id="sup-search" autocomplete="off"></label>
      <div id="sup-results" class="results"></div>
    </div></div>`;
  },
  weigh() {
    const t = T(), f = S.flow, c = f.crate;
    const gross = parseFloat(f.gross) || 0;
    const net = Math.round((gross - c.tare_kg) * 10) / 10;
    const neg = f.gross !== '' && net <= 0;
    const over = net > Number(c.capacity_kg);
    const canNext = gross > 0 && !neg && (!over || f.overOk);
    return `<div class="screen">${flowTop('scan')}<div class="scroll">
      ${whoCard()}
      ${f.supplier.crates.length > 1 ? `<div class="chips">${f.supplier.crates.map((x) => `<button class="chip" data-act="set-crate" data-c="${esc(x.code)}" aria-pressed="${x.code === c.code}">${esc(x.code)}</button>`).join('')}</div>` : ''}
      ${f.supplier.members.length ? `<label class="field">${esc(t.member)}<select id="member"><option value="">${esc(t.memberNone)}</option>${f.supplier.members.map((m) => `<option value="${m.id}" ${String(f.member) === String(m.id) ? 'selected' : ''}>${esc(m.name)}</option>`).join('')}</select></label>` : ''}
      <h1>${esc(t.weighTitle)}</h1><p class="sub small">${esc(t.weighSub)}</p>
    </div><div class="foot entry">
      <div class="display" data-announce="${esc(f.gross || '0')} kg">${esc(f.gross || '0')} <small>kg</small></div>
      <div class="totals"><span>${esc(t.tare)}: − ${kg(c.tare_kg)}</span><b>${esc(t.net)}: ${gross ? kg(net) : '—'}</b></div>
      ${neg ? `<p class="error small" role="alert">${icon('warn', 22)}<span>${esc(t.negWeight)}</span></p>` : ''}
      ${over ? `<label class="check note warn"><input type="checkbox" data-act="over-ok" ${f.overOk ? 'checked' : ''}><span>${esc(t.overCap(c.capacity_kg))} ${esc(t.confirmWeight)}</span></label>` : ''}
      ${keypad('weight-key', true)}
      <button class="btn" data-go="photo" ${canNext ? '' : 'disabled'}>${esc(t.next)}</button>
    </div></div>`;
  },
  photo() {
    const t = T(), f = S.flow;
    return `<div class="screen">${flowTop('weigh')}<div class="scroll">
      <h1>${esc(t.photoTitle)}</h1><p class="sub">${esc(t.photoSub)}</p>
      ${f.photo ? `<img class="photo-img" src="${APP_ROOT}assets/images/placeholder-photo.svg" alt="${esc(t.photoAlt)}"><button class="btn outline" data-act="retake">${icon('camera')}${esc(t.retake)}</button>`
        : `<button class="scanner" data-act="capture">${icon('camera', 56)}${esc(t.capture)}</button>`}
    </div><div class="foot"><button class="btn big" data-go="grade" ${f.photo ? '' : 'disabled'}>${esc(t.next)}</button></div></div>`;
  },
  grade() {
    const t = T(), f = S.flow;
    const gBtn = (g, ic) => `<button class="card grade-card" data-act="set-grade" data-g="${g}" aria-pressed="${f.grade === g}">
      <span class="row"><span class="dot grade-${g}">${icon(ic, 20)}</span><span class="grow"><b class="grade-name">${esc(t.g[g])}</b><br><span class="small sub">${esc(t.gs[g])}</span></span>${f.grade === g ? icon('check') : ''}</span></button>`;
    const needs = f.grade && f.grade !== 'clean';
    return `<div class="screen">${flowTop('photo')}<div class="scroll">
      <h1>${esc(t.gradeTitle)}</h1>
      ${gBtn('clean', 'check')}${gBtn('minor', 'warn')}${gBtn('rejected', 'x')}
      ${needs ? `<h2>${esc(t.reasonT)}</h2><div class="tiles">${Object.entries(t.reasons).map(([k, label]) => `<button class="tile" data-act="set-reason" data-r="${k}" aria-pressed="${f.reason === k}">${icon(k, 30)}${esc(label)}</button>`).join('')}</div>` : ''}
    </div><div class="foot"><button class="btn big" data-go="confirm" ${f.grade && (!needs || f.reason) ? '' : 'disabled'}>${esc(t.next)}</button></div></div>`;
  },
  confirm() {
    const t = T(), f = S.flow;
    const net = Math.round((parseFloat(f.gross) - f.crate.tare_kg) * 10) / 10;
    const p = previewPay(f.supplier, f.grade, net);
    return `<div class="screen">${flowTop('grade')}<div class="scroll">
      <h1>${esc(t.confirmTitle)}</h1>${whoCard()}
      <div class="card">
        <div class="kv"><span>${esc(t.crate)}</span><span>${esc(f.crate.code)}</span></div>
        <div class="kv"><span>${esc(t.gross)}</span><span>${kg(f.gross)}</span></div>
        <div class="kv"><span>${esc(t.tare)}</span><span>− ${kg(f.crate.tare_kg)}</span></div>
        <div class="kv"><span class="bold">${esc(t.net)}</span><span>${kg(net)}</span></div>
        <div class="kv"><span>${esc(t.gradeTitle)}</span><span>${esc(t.g[f.grade])}</span></div>
        ${f.reason ? `<div class="kv"><span>${esc(t.reasonT)}</span><span>${esc(t.reasons[f.reason])}</span></div>` : ''}
        <div class="kv"><span>${esc(t.pay)}</span><span class="amount">${esc(payLabel(p))}</span></div>
      </div>
      <label class="check"><input type="checkbox" data-act="checked" ${f.checked ? 'checked' : ''}><span>${esc(t.check)}</span></label>
    </div><div class="foot"><button class="btn big" data-act="save" ${f.checked ? '' : 'disabled'}>${esc(t.save)}</button></div></div>`;
  },
  done() {
    const t = T(), r = S.last;
    if (!r) return SCREENS.home();
    const title = r.error ? t.errTitle : r.queued ? t.savedTitle : t.doneTitle;
    const sub = r.error ? (t.e[r.error] || r.error) : r.queued ? t.savedSub : t.doneSub;
    return `<div class="screen"><div class="scroll center result">
      <span class="avatar result-icon ${r.error ? 'is-error' : r.queued ? 'is-queued' : 'is-done'}" aria-hidden="true">${icon(r.error ? 'warn' : r.queued ? 'clock' : 'check', 46)}</span>
      <h1>${esc(title)}</h1><p class="sub">${esc(sub)}</p>
      <div class="money">${kg(r.net)}</div>
      <p class="bold">${esc(r.name)} · ${esc(t.g[r.grade])} · ${esc(payLabel(r.pay))}</p>
      ${r.record_no ? `<p class="small sub">${esc(r.record_no)}</p>` : ''}
    </div><div class="foot">
      <button class="btn big" data-act="start">${icon('scale', 28)}${esc(t.another)}</button>
      ${r.error ? '' : `<button class="btn outline" data-act="same-supplier">${icon('plus')}${esc(t.sameSupplier)}</button>`}
      <button class="btn outline" data-go="home">${esc(t.home)}</button>
    </div></div>`;
  },
  tools() {
    const t = T(), c = S.cache;
    const row = (to, ic, label, n) => `<button class="tile" data-go="${to}">${icon(ic, 34)}${esc(label)}${n ? ` <span class="badge minor">${n}</span>` : ''}</button>`;
    return `<div class="screen">${toolTop('home')}<div class="scroll">
      <h1>${esc(t.toolsTitle)}</h1>
      <div class="tiles">${row('apps', 'list', t.tApps, c.pending.length)}${row('register', 'plus', t.tRegister)}${row('crates', 'crate', t.tCrates)}${row('calib', 'scale', t.tCalib)}${row('manifest', 'truck', t.tManifest)}</div>
      <button class="btn outline" data-act="logout">${icon('logout')}${esc(t.logout)}</button>
    </div></div>`;
  },
  apps() {
    const t = T(), list = S.cache.pending;
    return `<div class="screen">${toolTop('tools')}<div class="scroll"><h1>${esc(t.appsTitle)}</h1>
      ${list.length ? list.map((a) => `<button class="card" data-go="app/${esc(a.id)}"><b>${esc(a.name)}</b><span class="small sub">${esc(a.section)} · ${esc(a.mobile)}</span><span class="badge minor">${esc(t.review)}</span></button>`).join('') : `<p class="sub">${esc(t.noApps)}</p>`}
    </div></div>`;
  },
  app(id) {
    const t = T(), a = S.cache.pending.find((x) => x.id === id);
    if (!a) return SCREENS.apps();
    return `<div class="screen">${toolTop('apps')}<form class="scroll" id="activate-form" data-id="${esc(a.id)}">
      <h1>${esc(a.name)}</h1>
      <div class="card">
        <div class="kv"><span>${esc(t.type)}</span><span>${esc(t[a.type] || a.type)}</span></div>
        <div class="kv"><span>${esc(t.section)}</span><span>${esc(a.section)}</span></div>
        <div class="kv"><span>${esc(t.mobile)}</span><span>${esc(a.mobile)}</span></div>
        <div class="kv"><span>${esc(t.account)}</span><span>${esc(t[a.payout_channel])} ${esc(a.payout_account)}</span></div>
      </div>
      <label class="check"><input type="checkbox" name="in_person"><span>${esc(t.inPerson)}</span></label>
      ${activationFields(a.type)}
      ${errorLine()}
      <button class="btn big" type="submit">${esc(t.activate)}</button>
      <label class="field">${esc(t.rejectReason)}<input id="reject-reason"></label>
      <button class="btn outline" type="button" data-act="reject" data-id="${esc(a.id)}">${icon('x')}${esc(t.reject)}</button>
    </form></div>`;
  },
  register() {
    const t = T();
    return `<div class="screen">${toolTop('tools')}<form class="scroll" id="register-form">
      <h1>${esc(t.tRegister)}</h1>
      <label class="field">${esc(t.name)}<input name="name" required></label>
      <label class="field">${esc(t.type)}<select name="type"><option value="vendor">${esc(t.vendor)}</option><option value="coop">${esc(t.coop)}</option></select></label>
      <label class="field">${esc(t.section)}<input name="section" required></label>
      <label class="field">${esc(t.mobile)}<input name="mobile" inputmode="numeric" maxlength="11" placeholder="09XXXXXXXXX" required></label>
      <label class="field">${esc(t.channel)}<select name="channel"><option value="gcash">${esc(t.gcash)}</option><option value="bank">${esc(t.bank)}</option></select></label>
      <label class="field">${esc(t.account)}<input name="account" inputmode="numeric" required></label>
      ${activationFields('coop')}
      ${errorLine()}
      <button class="btn big" type="submit">${esc(t.register)}</button>
    </form></div>`;
  },
  card(id) {
    const t = T(), s = supplierById(id);
    if (!s) return SCREENS.tools();
    return `<div class="screen">${toolTop('tools')}<div class="scroll"><h1>${esc(t.cardTitle)}</h1>
      <div class="qr-card print-area"><div class="qr-box">${qrSvg(s.id)}</div><div class="center"><div class="qr-id">${esc(s.id)}</div><div>${esc(s.name)}</div><div class="small">${esc(s.section)}</div></div></div>
      <div class="note small">${s.crates.map((c) => esc(c.code)).join(', ')}</div>
    </div><div class="foot"><button class="btn big" data-act="print">${icon('print')}${esc(t.print)}</button></div></div>`;
  },
  crates() {
    const t = T(), c = S.cache;
    return `<div class="screen">${toolTop('tools')}<div class="scroll"><h1>${esc(t.cratesTitle)}</h1>
      ${errorLine()}
      ${c.crates.map((x) => `<div class="card"><div class="spread"><b>${esc(x.code)}</b><span class="badge ${x.status === 'active' ? '' : 'minor'}">${esc(t.st[x.status])}</span></div>
        <span class="small sub">${esc(supplierById(x.supplier_id)?.name || t.unassigned)} · ${kg(x.tare_kg)}</span>
        <select aria-label="${esc(t.chooseSup)}" data-crate-target="${esc(x.code)}" class="inline-select"><option value="">${esc(t.chooseSup)}</option>${c.suppliers.map((s) => `<option value="${esc(s.id)}">${esc(s.name)}</option>`).join('')}</select>
        <div class="chips"><button class="chip" data-act="crate-op" data-op="reassign" data-c="${esc(x.code)}">${esc(t.reassign)}</button>
        ${x.status === 'active' ? `<button class="chip" data-act="crate-op" data-op="retire" data-c="${esc(x.code)}">${esc(t.retire)}</button><button class="chip" data-act="crate-op" data-op="lost" data-c="${esc(x.code)}">${esc(t.lost)}</button>` : ''}</div></div>`).join('')}
    </div></div>`;
  },
  calib() {
    const t = T(), l = S.cache.last_calibration;
    return `<div class="screen">${toolTop('tools')}<form class="scroll" id="calib-form">
      <h1>${esc(t.calibTitle)}</h1><p class="sub">${esc(t.calibSub)}</p>
      ${l ? `<div class="note small">${esc(t.lastCalib)}: ${esc(fmtDate(l.created_at, S.lang))} · ${kg(l.reference_kg)} / ${kg(l.reading_kg)} · ${esc(l.result === 'pass' ? t.pass : t.fail)}</div>` : ''}
      <label class="field">${esc(t.refKg)}<input name="reference_kg" type="number" step="0.1" min="0.1" inputmode="decimal" required></label>
      <label class="field">${esc(t.readKg)}<input name="reading_kg" type="number" step="0.1" min="0.1" inputmode="decimal" required></label>
      <label class="check"><input type="radio" name="result" value="pass" required><span>${esc(t.pass)}</span></label>
      <label class="check"><input type="radio" name="result" value="fail"><span>${esc(t.fail)}</span></label>
      ${errorLine()}
      <button class="btn big" type="submit">${esc(t.saveCalib)}</button>
    </form></div>`;
  },
  manifest() {
    const t = T(), m = S.manifests;
    if (!m) { loadManifests(); return `<div class="screen">${toolTop('tools')}<div class="scroll"><h1>${esc(t.manTitle)}</h1></div></div>`; }
    return `<div class="screen">${toolTop('tools')}<div class="scroll"><h1>${esc(t.manTitle)}</h1>
      <div class="card"><b>${esc(t.manOpen)}</b><div class="kv"><span>${kg(m.open.kg)}</span><span>${esc(m.open.crates)} ${esc(t.crates)}</span></div></div>
      ${errorLine()}
      <button class="btn big" data-act="make-manifest" ${Number(m.open.crates) ? '' : 'disabled'}>${icon('truck')}${esc(t.makeMan)}</button>
      ${m.manifests.map((x) => `<div class="card"><div class="spread"><b>#${esc(x.id)} · ${kg(x.total_kg)}</b><span class="small sub">${esc(x.crate_count)} ${esc(t.crates)}</span></div>
        <div class="spread small"><span class="sub">${esc(fmtDate(x.time_out, S.lang))} ${esc(fmtTime(x.time_out))}</span><span class="row">${icon(x.status === 'confirmed' ? 'check' : 'clock', 18)}${esc(x.status === 'confirmed' ? t.manOk : t.manWait)}</span></div></div>`).join('') || `<p class="sub">${esc(t.noMan)}</p>`}
    </div></div>`;
  },
  correct(id) {
    const t = T(), l = S.today.find((x) => String(x.id) === String(id));
    if (!l) return SCREENS.home();
    return `<div class="screen">${toolTop('home')}<form class="scroll" id="correct-form" data-id="${esc(l.id)}">
      <h1>${esc(t.corrTitle)}</h1><p class="sub">${esc(t.corrSub)}</p>
      <div class="card"><b>${esc(l.name)}</b><span>${esc(l.record_no)} · ${kg(l.corrected_kg ?? l.net_kg)} · ${esc(t.g[l.grade])}</span></div>
      <label class="field">${esc(t.newNet)}<input name="new_net_kg" type="number" step="0.1" min="0.1" inputmode="decimal" required></label>
      <label class="field">${esc(t.corrReason)}<input name="reason" required></label>
      ${errorLine()}
      <button class="btn big" type="submit">${esc(t.corrSave)}</button>
    </form></div>`;
  },
};

function activationFields(type) {
  const t = T();
  return `<div class="card"><h2>${esc(t.consentT)}</h2><p class="small">${esc(t.consentFil)}</p><p class="small">${esc(t.consentEn)}</p>
    <label class="check"><input type="checkbox" name="consent"><span>${esc(t.consentCheck)}</span></label></div>
    <div class="card"><h2>${esc(t.tagT)}</h2>
      <label class="check"><input type="radio" name="tag" value="additional"><span>${esc(t.tagAdd)}</span></label>
      <label class="check"><input type="radio" name="tag" value="existing"><span>${esc(t.tagEx)}</span></label></div>
    <label class="check"><input type="checkbox" name="ubak"><span>${esc(t.ubak)}</span></label>
    <label class="field">${esc(t.tareIn)}<input name="tare_kg" type="number" step="0.1" min="0.1" inputmode="decimal" required></label>
    <label class="field">${esc(t.capIn)}<input name="capacity_kg" type="number" step="0.1" min="0.1" inputmode="decimal" required></label>
    ${type === 'coop' ? `<label class="field">${esc(t.members)}<textarea name="members" rows="3"></textarea></label>` : ''}`;
}

function render() {
  const { name, arg } = route();
  if (!S.cache) { paint(app, SCREENS.login(), 'login'); return; }
  if (FLOW.includes(name) && !S.flow) { location.hash = 'home'; return; }
  paint(app, (SCREENS[name] || SCREENS.home)(arg), location.hash || '#home');
}

function saveState() {
  store.set('st_queue', S.queue);
  store.set('st_today', S.today);
  store.set('st_cache', S.cache);
}

async function refresh() {
  if (isOffline()) return;
  try {
    const [boot, today] = await Promise.all([api('station', 'bootstrap'), api('dropoffs', 'today')]);
    S.cache = boot;
    S.today = today.loads;
    saveState();
  } catch (e) {
    if (e.status === 401) { S.cache = null; saveState(); }
  }
}

// Uploads the queue. Anything the server confirms leaves the queue; a retry can never double count.
async function sync() {
  if (S.syncing || isOffline() || !S.queue.length) return;
  S.syncing = true;
  try {
    const { results } = await api('dropoffs', 'sync', { records: S.queue });
    const byId = Object.fromEntries(results.map((r) => [r.client_uuid, r]));
    S.queue = S.queue.flatMap((q) => {
      const r = byId[q.client_uuid];
      if (!r) return [q];
      if (r.status === 'error') return [{ ...q, error: r.error }];
      return [];
    });
    if (S.last) {
      const r = byId[S.last.client_uuid];
      if (r) {
        S.last.queued = false;
        S.last.error = r.status === 'error' ? r.error : null;
        S.last.record_no = r.record_no;
      }
    }
    saveState();
  } catch (e) {
    /* Still offline or the server is down: the queue stays and retries later. */
  } finally {
    S.syncing = false;
  }
  await refresh();
}

function beginFlow(supplier, crate) {
  S.flow = { supplier, crate, gross: '', member: '', overOk: false, photo: false, grade: '', reason: '', checked: false };
}

const ACTIONS = {
  'pin-key'(el) { S.error = ''; S.pin = el.dataset.k === 'del' ? S.pin.slice(0, -1) : (S.pin + el.dataset.k).slice(0, 6); render(); },
  async login() {
    S.error = '';
    try {
      await api('auth', 'staff_login', { pin: S.pin });
      S.pin = '';
      S.cache = await api('station', 'bootstrap');
      S.today = (await api('dropoffs', 'today')).loads;
      saveState();
      await sync();
      go('home');
      render();
    } catch (e) { S.pin = ''; S.error = errText(e); render(); }
  },
  async logout() {
    await api('auth', 'logout', { who: 'staff' }).catch(() => {});
    S.cache = null;
    saveState();
    go('home');
    render();
  },
  'cycle-lang'() {
    const order = ['fil', 'ilo', 'en'];
    S.lang = order[(order.indexOf(S.lang) + 1) % 3];
    store.set('st_lang', S.lang);
    setPageLang(S.lang);
    render();
  },
  async 'toggle-net'() {
    S.demoOffline = !S.demoOffline;
    store.set('st_offline', S.demoOffline);
    render();
    await sync();
    render();
  },
  start() { S.flow = null; S.showCrates = false; S.flow = { pending: true }; go('scan'); },
  'show-crates'() { S.showCrates = true; render(); },
  'pick-crate'(el) {
    const s = supplierById(el.dataset.s);
    beginFlow(s, s.crates.find((c) => c.code === el.dataset.c));
    go('weigh');
  },
  'pick-supplier'(el) {
    const s = supplierById(el.dataset.s);
    beginFlow(s, s.crates[0]);
    go('weigh');
  },
  'set-crate'(el) { S.flow.crate = S.flow.supplier.crates.find((c) => c.code === el.dataset.c); S.flow.overOk = false; render(); },
  'weight-key'(el) {
    const f = S.flow, k = el.dataset.k;
    if (k === 'del') f.gross = f.gross.slice(0, -1);
    else if (k === '.') { if (!f.gross.includes('.') && f.gross) f.gross += '.'; } else if (f.gross.length < 5 && !(f.gross.includes('.') && f.gross.split('.')[1].length >= 1)) f.gross += k;
    f.overOk = false;
    render();
  },
  capture() { S.flow.photo = true; render(); },
  retake() { S.flow.photo = false; render(); },
  'set-grade'(el) { S.flow.grade = el.dataset.g; if (el.dataset.g === 'clean') S.flow.reason = ''; render(); },
  'set-reason'(el) { S.flow.reason = el.dataset.r; render(); },
  async save() {
    const f = S.flow;
    const net = Math.round((parseFloat(f.gross) - f.crate.tare_kg) * 10) / 10;
    const record = {
      client_uuid: uuid(), supplier_id: f.supplier.id, crate_code: f.crate.code, member_id: f.member || null, gross_kg: parseFloat(f.gross),
      grade: f.grade, reason: f.reason || null, photo_name: 'placeholder-photo.svg', device: 'Station phone 1', occurred_at: localDateTime(), preview_net: net,
    };
    S.queue.push(record);
    S.last = { client_uuid: record.client_uuid, net, name: f.supplier.name, grade: f.grade, pay: previewPay(f.supplier, f.grade, net), queued: true, supplier: f.supplier.id };
    saveState();
    S.flow = null;
    await sync();
    go('done');
    render();
  },
  'same-supplier'() {
    const s = supplierById(S.last.supplier);
    beginFlow(s, s.crates[0]);
    go('weigh');
  },
  async reject(el) {
    S.error = '';
    try {
      await api('applications', 'reject', { id: el.dataset.id, reason: document.getElementById('reject-reason').value });
      await refresh();
      go('apps');
    } catch (e) { S.error = errText(e); render(); }
  },
  print() { window.print(); },
  async 'crate-op'(el) {
    S.error = '';
    const data = { code: el.dataset.c, op: el.dataset.op };
    if (data.op === 'reassign') data.supplier_id = document.querySelector(`[data-crate-target="${CSS.escape(el.dataset.c)}"]`).value;
    try {
      await api('station', 'crate', data);
      await refresh();
      toast(T().saved);
    } catch (e) { S.error = errText(e); }
    render();
  },
  async 'make-manifest'() {
    S.error = '';
    try {
      await api('station', 'create_manifest', {});
      await refresh();
      await loadManifests();
    } catch (e) { S.error = errText(e); render(); }
  },
};

async function loadManifests() {
  try {
    S.manifests = await api('station', 'manifests');
  } catch (e) {
    S.manifests = { open: { kg: 0, crates: 0 }, manifests: [] };
    S.error = T().needOnline;
  }
  if (route().name === 'manifest') render();
}

function showSearch(q) {
  const t = T(), box = document.getElementById('sup-results');
  q = q.trim().toLowerCase();
  if (!q) { box.innerHTML = ''; return; }
  const hits = S.cache.suppliers.filter((s) => s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q));
  box.innerHTML = hits.length ? hits.map((s) => `<button class="card" data-act="pick-supplier" data-s="${esc(s.id)}" ${s.crates.length ? '' : 'disabled'}><b>${esc(s.name)}</b><span class="small sub">${esc(s.id)}${s.crates.length ? '' : ' · ' + esc(t.noCrate)}</span></button>`).join('') : `<p class="sub">${esc(t.noResult)}</p>`;
}

function formData(form) {
  const d = Object.fromEntries(new FormData(form));
  for (const key of ['consent', 'ubak', 'in_person']) d[key] = d[key] === 'on';
  return d;
}

const FORMS = {
  async 'activate-form'(form) {
    const r = await api('applications', 'activate', { ...formData(form), id: form.dataset.id });
    await refresh();
    go('card/' + r.id);
  },
  async 'register-form'(form) {
    const r = await api('applications', 'register', { ...formData(form), lang: S.lang });
    await refresh();
    go('card/' + r.id);
  },
  async 'calib-form'(form) {
    await api('station', 'calibration', Object.fromEntries(new FormData(form)));
    await refresh();
    toast(T().saved);
    go('tools');
  },
  async 'correct-form'(form) {
    const d = Object.fromEntries(new FormData(form));
    await api('dropoffs', 'correct', { ...d, dropoff_id: form.dataset.id });
    await refresh();
    toast(T().saved);
    go('home');
  },
};

document.addEventListener('click', (ev) => {
  const nav = ev.target.closest('[data-go]');
  if (nav && !nav.disabled) { S.error = ''; go(nav.dataset.go); return; }
  const el = ev.target.closest('button[data-act]');
  if (el && !el.disabled) ACTIONS[el.dataset.act]?.(el);
});
document.addEventListener('change', (ev) => {
  const el = ev.target;
  if (el.id === 'member') S.flow.member = el.value;
  if (el.dataset.act === 'over-ok') { S.flow.overOk = el.checked; render(); }
  if (el.dataset.act === 'checked') { S.flow.checked = el.checked; render(); }
});
document.addEventListener('input', (ev) => {
  if (ev.target.id === 'sup-search') showSearch(ev.target.value);
});
document.addEventListener('submit', async (ev) => {
  const handler = FORMS[ev.target.id];
  if (!handler) return;
  ev.preventDefault();
  try {
    await handler(ev.target);
  } catch (e) {
    const box = ev.target.querySelector('.error') || document.createElement('p');
    box.className = 'error';
    box.setAttribute('role', 'alert');
    box.textContent = errText(e);
    ev.target.querySelector('button[type=submit]').before(box);
    box.scrollIntoView({ block: 'center' });
  }
});
window.addEventListener('hashchange', async () => {
  const { name } = route();
  if (name === 'manifest') S.manifests = null;
  if (name === 'home' || name === 'tools' || name === 'apps') { render(); await refresh(); }
  render();
});
window.addEventListener('online', async () => { await sync(); render(); });
window.addEventListener('offline', render);

(async function startApp() {
  setPageLang(S.lang);
  render();
  await refresh();
  await sync();
  render();
  setInterval(() => sync().then(() => { if (route().name === 'home') render(); }), 30000);
})();
