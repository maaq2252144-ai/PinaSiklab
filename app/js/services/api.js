// Static (Netlify) version of the API. Each action from the PHP files in the main branch's api/ folder
// is rebuilt here and runs in the browser against js/services/local-db.js.
// The screens call api(endpoint, action, data) exactly as before and get the same replies and error codes.

// ---------------------------------------------------------------------------
// Helpers (ports of api/_shared/bootstrap.php)
// ---------------------------------------------------------------------------
class ApiFail extends Error {
  constructor(code, status = 422) { super(code); this.code = code; this.status = status; }
}
const fail = (code, status = 422) => { throw new ApiFail(code, status); };
const cleanText = (v, max = 100) => String(v ?? '').trim().slice(0, max);
const validMobile = (m) => /^09\d{9}$/.test(m);
const round1 = (n) => Math.round(Number(n) * 10) / 10;
const round2 = (n) => Math.round(Number(n) * 100) / 100;
const ymd = (dt) => dt.slice(2, 4) + dt.slice(5, 7) + dt.slice(8, 10);
const pad4 = (n) => String(n).padStart(4, '0');
// Same output as PHP number_format: thousands separated by commas.
const nf = (n, d) => Number(n).toFixed(d).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

function nextId(db, table) { db.seq[table] = (db.seq[table] || 0) + 1; return db.seq[table]; }
const setting = (db, k) => (k in db.settings ? db.settings[k] : null);
const getSupplier = (db, id) => db.suppliers.find((s) => s.id === id) || null;
const balance = (db, supplierId) => round2(db.ledger_entries.filter((e) => e.supplier_id === supplierId).reduce((a, e) => a + Number(e.amount), 0));
function rateAt(db, when) {
  const rows = db.rates.filter((r) => r.effective_at <= when).sort((a, b) => (b.effective_at.localeCompare(a.effective_at)) || b.id - a.id);
  if (!rows.length) fail('server_error', 500);
  return rows[0];
}
function audit(db, actor, action, detail = '') {
  db.audit_log.push({ id: nextId(db, 'audit_log'), actor, action, detail: String(detail).slice(0, 240), created_at: dbNow() });
}
function addLedger(db, supplierId, type, amount, dropoffId, payoutId, note) {
  db.ledger_entries.push({ id: nextId(db, 'ledger_entries'), supplier_id: supplierId, type, amount, dropoff_id: dropoffId, payout_id: payoutId, note, created_at: dbNow() });
}
function requireStaff() {
  const s = session.get();
  if (!s.staff) fail('not_logged_in', 401);
  return s.staff;
}
function requireSupplier() {
  const s = session.get();
  if (!s.supplier_id) fail('not_logged_in', 401);
  return s.supplier_id;
}
const latestCorrection = (db, dropoffId) => db.corrections.filter((c) => c.dropoff_id === dropoffId).sort((a, b) => b.id - a.id)[0] || null;
const byOccurredDesc = (a, b) => b.occurred_at.localeCompare(a.occurred_at) || b.id - a.id;

// ---------------------------------------------------------------------------
// Simulated SMS (port of api/_shared/sms.php). Texts are saved as messages.
// ---------------------------------------------------------------------------
const SMS_TEXT = {
  receipt: { fil: 'WasteLedger: {kg} kg {grade}. {pay}. Balanse: P{bal}.', ilo: 'WasteLedger: {kg} kg {grade}. {pay}. Balanse: P{bal}.', en: 'WasteLedger: {kg} kg {grade}. {pay}. Balance: P{bal}.' },
  balance: { fil: 'WasteLedger: Ang balanse mo ay P{bal}.', ilo: 'WasteLedger: Ti balansem ket P{bal}.', en: 'WasteLedger: Your balance is P{bal}.' },
  threshold: {
    fil: 'WasteLedger: Umabot na sa P{thr} ang balanse mo. Isasama ito ng lungsod sa susunod na listahan ng bayad.',
    ilo: 'WasteLedger: Dimmanon ti balansem iti P{thr}. Iraman ti siudad daytoy iti sumaruno a listaan ti bayad.',
    en: 'WasteLedger: Your balance reached P{thr}. The city will add it to the next payout list.',
  },
  sent: {
    fil: 'WasteLedger: Ipinadala ng lungsod ang P{amt} sa iyong {channel}. Ref: {ref}.',
    ilo: 'WasteLedger: Impatulod ti siudad ti P{amt} iti {channel}-mo. Ref: {ref}.',
    en: 'WasteLedger: The city sent P{amt} to your {channel}. Ref: {ref}.',
  },
  failed: {
    fil: 'WasteLedger: Hindi naipadala ang P{amt}. Ibinalik ito sa balanse mo. Pumunta sa timbangan para masuri ang account mo.',
    ilo: 'WasteLedger: Saan a naipatulod ti P{amt}. Naisubli daytoy iti balansem. Mapan iti timbangan tapno makita ti accountmo.',
    en: 'WasteLedger: The P{amt} could not be sent. It is back in your balance. Please visit the station to check your account.',
  },
  apply: {
    fil: 'WasteLedger: Natanggap ang aplikasyon mo. Pumunta sa timbangan para makumpirma ito.',
    ilo: 'WasteLedger: Naawat ti aplikasionmo. Mapan iti timbangan tapno makumpirma daytoy.',
    en: 'WasteLedger: We got your application. Please visit the station to confirm it.',
  },
  approved: { fil: 'WasteLedger: Aktibo ka na! Ang iyong Supplier ID ay {id}.', ilo: 'WasteLedger: Aktibokan! Ti Supplier ID-m ket {id}.', en: 'WasteLedger: You are now active! Your Supplier ID is {id}.' },
  rejected: { fil: 'WasteLedger: Hindi naaprubahan ang aplikasyon mo. Dahilan: {reason}.', ilo: 'WasteLedger: Saan a naaprobaran ti aplikasionmo. Gapu: {reason}.', en: 'WasteLedger: Your application was not approved. Reason: {reason}.' },
  corrected: { fil: 'WasteLedger: Naitama ang {rec}: {kg} kg na. Balanse: P{bal}.', ilo: 'WasteLedger: Naipusto ti {rec}: {kg} kg itan. Balanse: P{bal}.', en: 'WasteLedger: {rec} was corrected to {kg} kg. Balance: P{bal}.' },
  reply: { fil: 'Timbangan: Natanggap po. Tatawag ang staff sa oras ng palengke.', ilo: 'Timbangan: Naawat. Umawag ti staff iti oras ti tiendaan.', en: 'Station: Received. Staff will call you during market hours.' },
};
const SMS_GRADE = {
  clean: { fil: 'Malinis', ilo: 'Nadalus', en: 'Clean' },
  minor: { fil: 'Medyo halo', ilo: 'Bassit a nalaokan', en: 'A little mixed' },
  rejected: { fil: 'Hindi tinanggap', ilo: 'Saan a naawat', en: 'Not accepted' },
};
const SMS_PAY = {
  tbd: { fil: 'Bayad: [TBD]', ilo: 'Bayad: [TBD]', en: 'Pay: [TBD]' },
  baseline: { fil: 'Baseline: walang bayad', ilo: 'Baseline: awan ti bayad', en: 'Baseline: no pay' },
  rejected: { fil: 'Walang bayad', ilo: 'Awan ti bayad', en: 'Not paid' },
};
function addMessage(db, supplierId, direction, text) {
  db.messages.push({ id: nextId(db, 'messages'), supplier_id: supplierId, direction, body: String(text).slice(0, 400), read_at: direction === 'in' ? dbNow() : null, created_at: dbNow() });
}
function sendSms(db, supplier, key, vars = {}) {
  let text = SMS_TEXT[key][supplier.lang] || SMS_TEXT[key].en;
  for (const [name, value] of Object.entries(vars)) text = text.split('{' + name + '}').join(String(value));
  addMessage(db, supplier.id, 'out', text);
}

// ---------------------------------------------------------------------------
// auth (api/auth/index.php)
// ---------------------------------------------------------------------------
const AUTH = {
  request_code(db, input) {
    const mobile = cleanText(input.mobile, 11);
    if (!validMobile(mobile)) fail('bad_mobile');
    const s = db.suppliers.find((x) => x.mobile === mobile);
    if (!s) fail('not_registered', 404);
    if (s.status !== 'active') fail('not_active_' + s.status, 403);
    // Demo only: a real system would text a random code, not return a fixed one.
    return { demo_code: setting(db, 'demo_otp') };
  },
  verify_code(db, input) {
    const mobile = cleanText(input.mobile, 11);
    if ((input.code ?? '') !== setting(db, 'demo_otp')) fail('bad_code');
    const s = db.suppliers.find((x) => x.mobile === mobile && x.status === 'active');
    if (!s) fail('not_registered', 404);
    session.set({ ...session.get(), supplier_id: s.id });
    audit(db, 'supplier ' + s.id, 'sign_in');
    return {};
  },
  staff_login(db, input) {
    const pin = cleanText(input.pin, 10);
    const st = db.staff.find((x) => x.pin === pin);
    if (!st) fail('bad_pin');
    const staff = { id: st.id, name: st.name, station_id: st.station_id, station: db.stations.find((t) => t.id === st.station_id).name };
    session.set({ ...session.get(), staff });
    audit(db, 'staff ' + staff.id, 'sign_in');
    return { staff };
  },
  logout(db, input) {
    const s = session.get();
    delete s[(input.who ?? '') === 'staff' ? 'staff' : 'supplier_id'];
    session.set(s);
    return {};
  },
};

// ---------------------------------------------------------------------------
// station (api/station/index.php)
// ---------------------------------------------------------------------------
const STATION = {
  bootstrap(db) {
    const staff = requireStaff();
    const crates = [...db.crates].sort((a, b) => a.code.localeCompare(b.code))
      .map((c) => ({ code: c.code, supplier_id: c.supplier_id, tare_kg: c.tare_kg, capacity_kg: c.capacity_kg, status: c.status }));
    const suppliers = db.suppliers.filter((s) => s.status === 'active').sort((a, b) => a.name.localeCompare(b.name)).map((s) => ({
      id: s.id, type: s.type, name: s.name, section: s.section, mobile: s.mobile, tag: s.tag, ubak: s.ubak,
      balance: balance(db, s.id),
      crates: crates.filter((c) => c.supplier_id === s.id && c.status === 'active'),
      members: db.coop_members.filter((m) => m.supplier_id === s.id).sort((a, b) => a.name.localeCompare(b.name)).map((m) => ({ id: m.id, supplier_id: m.supplier_id, name: m.name })),
    }));
    const rates = rateAt(db, dbNow());
    const lastCal = db.calibration_logs.filter((l) => l.station_id === staff.station_id).sort((a, b) => b.id - a.id)[0] || null;
    return {
      staff, suppliers, crates,
      pending: db.suppliers.filter((s) => s.status === 'pending').sort((a, b) => a.created_at.localeCompare(b.created_at))
        .map((s) => ({ id: s.id, type: s.type, name: s.name, section: s.section, mobile: s.mobile, payout_channel: s.payout_channel, payout_account: s.payout_account, lang: s.lang })),
      rates: { clean: Number(rates.clean), minor: rates.minor === null ? null : Number(rates.minor), existing_bonus: rates.existing_bonus === null ? null : Number(rates.existing_bonus) },
      baseline: setting(db, 'baseline_mode') === '1',
      last_calibration: lastCal,
    };
  },
  crate(db, input) {
    const staff = requireStaff();
    const code = cleanText(input.code, 12);
    const crate = db.crates.find((c) => c.code === code);
    if (!crate) fail('not_found', 404);
    const op = input.op ?? '';
    let detail = '';
    if (op === 'retire' || op === 'lost') {
      crate.status = op === 'retire' ? 'retired' : 'lost';
    } else if (op === 'reassign') {
      const target = getSupplier(db, cleanText(input.supplier_id, 10));
      if (!target || target.status !== 'active') fail('supplier_not_active');
      crate.supplier_id = target.id;
      crate.status = 'active';
      detail = 'To ' + target.id;
    } else {
      fail('bad_op');
    }
    db.crate_events.push({ id: nextId(db, 'crate_events'), crate_code: code, action: op, detail, staff_id: staff.id, created_at: dbNow() });
    audit(db, 'staff ' + staff.id, 'crate_' + op, code + ' ' + detail);
    return {};
  },
  calibration(db, input) {
    const staff = requireStaff();
    const reference = round1(input.reference_kg ?? 0), reading = round1(input.reading_kg ?? 0);
    if (!(reference > 0) || !(reading > 0) || !['pass', 'fail'].includes(input.result)) fail('missing_fields');
    db.calibration_logs.push({ id: nextId(db, 'calibration_logs'), station_id: staff.station_id, staff_id: staff.id, reference_kg: reference, reading_kg: reading, result: input.result, created_at: dbNow() });
    audit(db, 'staff ' + staff.id, 'calibration', `${reference} / ${reading} ${input.result}`);
    return {};
  },
  manifests(db) {
    const staff = requireStaff();
    const open = db.dropoffs.filter((d) => d.station_id === staff.station_id && d.manifest_id === null && d.grade !== 'rejected');
    return {
      manifests: db.manifests.filter((m) => m.station_id === staff.station_id).sort((a, b) => b.id - a.id).slice(0, 10),
      open: { crates: open.length, kg: round1(open.reduce((a, d) => a + Number(d.net_kg), 0)) },
    };
  },
  create_manifest(db) {
    const staff = requireStaff();
    const open = db.dropoffs.filter((d) => d.station_id === staff.station_id && d.manifest_id === null && d.grade !== 'rejected');
    if (!open.length) fail('nothing_to_send');
    const id = nextId(db, 'manifests');
    db.manifests.push({ id, station_id: staff.station_id, total_kg: round1(open.reduce((a, d) => a + Number(d.net_kg), 0)), crate_count: open.length, time_out: dbNow(), status: 'waiting', staff_id: staff.id });
    open.forEach((d) => { d.manifest_id = id; });
    audit(db, 'staff ' + staff.id, 'manifest', '#' + id);
    return { id };
  },
};

// ---------------------------------------------------------------------------
// dropoffs (api/dropoffs/index.php)
// ---------------------------------------------------------------------------
function computePay(db, supplier, grade, net, occurred) {
  if (grade === 'rejected') return [null, 0, 'rejected'];
  if (setting(db, 'baseline_mode') === '1') return [null, 0, 'baseline'];
  const rates = rateAt(db, occurred);
  const rate = supplier.tag === 'existing' ? (grade === 'clean' ? rates.existing_bonus : null) : (grade === 'clean' ? rates.clean : rates.minor);
  if (rate === null) return [null, 0, 'tbd'];
  return [Number(rate), round2(net * Number(rate)), 'paid'];
}
// Rule-based checks only. They mark a record for a person to review and never touch pay.
function computeFlags(db, supplierId, net) {
  const past = db.dropoffs.filter((d) => d.supplier_id === supplierId).sort(byOccurredDesc).map((d) => Number(d.net_kg));
  const flags = [];
  if (past.length >= 2 && past[0] === net && past[1] === net) flags.push('repeat');
  if (past.length >= 3 && net > (past.reduce((a, b) => a + b, 0) / past.length) * Number(setting(db, 'flag_jump_multiple'))) flags.push('jump');
  return flags.length ? flags.join(',') : null;
}
// Saves one drop-off. Safe to call again with the same client_uuid: a retry never counts twice.
function saveDropoff(db, r, staff) {
  const uuid = cleanText(r.client_uuid, 40);
  if (!uuid) return { client_uuid: uuid, status: 'error', error: 'missing_uuid' };
  const error = (code) => ({ client_uuid: uuid, status: 'error', error: code });
  const dup = db.dropoffs.find((d) => d.client_uuid === uuid);
  if (dup) return { client_uuid: uuid, status: 'duplicate', record_no: dup.record_no, amount: Number(dup.amount), balance: balance(db, dup.supplier_id) };

  const supplier = getSupplier(db, cleanText(r.supplier_id, 10));
  if (!supplier || supplier.status !== 'active') return error('supplier_not_active');
  const crate = db.crates.find((c) => c.code === cleanText(r.crate_code, 12) && c.supplier_id === supplier.id && c.status === 'active');
  if (!crate) return error('bad_crate');
  const gross = round1(r.gross_kg ?? 0);
  const net = round1(gross - Number(crate.tare_kg));
  if (!(net > 0)) return error('bad_weight');
  const grade = r.grade ?? '';
  if (!['clean', 'minor', 'rejected'].includes(grade)) return error('bad_grade');
  const reason = grade === 'clean' ? null : (r.reason ?? '');
  if (grade !== 'clean' && !['plastic', 'mixed', 'spoiled', 'sellable', 'other'].includes(reason)) return error('reason_required');
  if (!r.photo_name) return error('photo_required');

  let occurred = String(r.occurred_at ?? '');
  const t = Date.parse(occurred.replace(' ', 'T'));
  if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(occurred) || Number.isNaN(t) || t > Date.now() + 300000) occurred = dbNow();
  // A phone with a wrong clock would otherwise land before the first rate. Use now instead of failing the whole upload.
  if (occurred < db.rates.reduce((m, x) => (x.effective_at < m ? x.effective_at : m), '9999')) occurred = dbNow();

  let memberId = null;
  if (r.member_id) {
    const m = db.coop_members.find((x) => x.id === Number(r.member_id) && x.supplier_id === supplier.id);
    memberId = m ? m.id : null;
  }
  const [rate, amount, note] = computePay(db, supplier, grade, net, occurred);
  const flags = computeFlags(db, supplier.id, net);
  const id = nextId(db, 'dropoffs');
  const recordNo = 'WL-' + ymd(occurred) + '-' + pad4(id);
  db.dropoffs.push({
    id, client_uuid: uuid, record_no: recordNo, supplier_id: supplier.id, crate_code: crate.code, member_id: memberId, station_id: staff.station_id, staff_id: staff.id,
    device: cleanText(r.device ?? 'Station phone', 60), gross_kg: gross, tare_kg: Number(crate.tare_kg), net_kg: net, grade, reason, rate_applied: rate, amount, pay_note: note,
    flags, photo_name: cleanText(r.photo_name, 80), lat: null, lng: null, occurred_at: occurred, synced_at: dbNow(), manifest_id: null, composted: 0,
  });
  const before = balance(db, supplier.id);
  if (amount > 0) addLedger(db, supplier.id, 'credit', amount, id, null, 'Drop-off ' + recordNo);
  const after = balance(db, supplier.id);
  const pay = note === 'paid' ? '+P' + nf(amount, 2) : SMS_PAY[note][supplier.lang];
  sendSms(db, supplier, 'receipt', { kg: nf(net, 1), grade: SMS_GRADE[grade][supplier.lang], pay, bal: nf(after, 2) });
  const threshold = Number(setting(db, 'payout_threshold'));
  if (before < threshold && after >= threshold) sendSms(db, supplier, 'threshold', { thr: nf(threshold, 0) });
  audit(db, 'staff ' + staff.id, 'dropoff', recordNo);
  return { client_uuid: uuid, status: 'saved', record_no: recordNo, net_kg: net, amount, pay_note: note, balance: after, flags };
}
const DROPOFFS = {
  sync(db, input) {
    const staff = requireStaff();
    const records = input.records ?? [];
    if (!Array.isArray(records)) fail('bad_records');
    return { results: records.map((r) => saveDropoff(db, r || {}, staff)) };
  },
  today(db) {
    const staff = requireStaff();
    const day = dbNow().slice(0, 10);
    return {
      loads: db.dropoffs.filter((d) => d.station_id === staff.station_id && d.occurred_at.slice(0, 10) === day).sort(byOccurredDesc).map((d) => ({
        id: d.id, client_uuid: d.client_uuid, record_no: d.record_no, supplier_id: d.supplier_id, name: getSupplier(db, d.supplier_id).name,
        net_kg: d.net_kg, grade: d.grade, amount: d.amount, pay_note: d.pay_note, flags: d.flags, occurred_at: d.occurred_at, manifest_id: d.manifest_id,
        corrected_kg: latestCorrection(db, d.id)?.new_net_kg ?? null,
      })),
    };
  },
  correct(db, input) {
    const staff = requireStaff();
    const reason = cleanText(input.reason, 200);
    const newNet = round1(input.new_net_kg ?? 0);
    if (!reason) fail('reason_required');
    if (!(newNet > 0)) fail('bad_weight');
    const row = db.dropoffs.find((d) => d.id === Number(input.dropoff_id) && d.station_id === staff.station_id);
    if (!row) fail('not_found', 404);
    const oldNet = Number(latestCorrection(db, row.id)?.new_net_kg ?? row.net_kg);
    const change = row.rate_applied === null ? 0 : round2((newNet - oldNet) * Number(row.rate_applied));
    db.corrections.push({ id: nextId(db, 'corrections'), dropoff_id: row.id, old_net_kg: oldNet, new_net_kg: newNet, amount_change: change, reason, staff_id: staff.id, created_at: dbNow() });
    if (change !== 0) addLedger(db, row.supplier_id, 'adjustment', change, row.id, null, 'Correction of ' + row.record_no);
    audit(db, 'staff ' + staff.id, 'correction', `${row.record_no}: ${oldNet} to ${newNet} kg. ${reason}`);
    sendSms(db, getSupplier(db, row.supplier_id), 'corrected', { rec: row.record_no, kg: nf(newNet, 1), bal: nf(balance(db, row.supplier_id), 2) });
    return { amount_change: change };
  },
};

// ---------------------------------------------------------------------------
// applications (api/applications/index.php)
// ---------------------------------------------------------------------------
function readForm(db, input) {
  const form = {
    name: cleanText(input.name), type: input.type ?? '', section: cleanText(input.section), mobile: cleanText(input.mobile, 11),
    channel: input.channel ?? 'gcash', account: cleanText(input.account, 40), lang: ['fil', 'ilo', 'en'].includes(input.lang) ? input.lang : 'fil',
  };
  if (!form.name || !form.section || !form.account) fail('missing_fields');
  if (!['vendor', 'coop'].includes(form.type) || !['gcash', 'bank'].includes(form.channel)) fail('missing_fields');
  if (!validMobile(form.mobile)) fail('bad_mobile');
  if (db.suppliers.some((s) => s.mobile === form.mobile)) fail('mobile_taken', 409);
  return form;
}
function insertSupplier(db, f) {
  const max = db.suppliers.reduce((m, s) => Math.max(m, parseInt(s.id.slice(2), 10) || 0), 0);
  const id = 'S-' + pad4(max + 1);
  db.suppliers.push({ id, type: f.type, name: f.name, section: f.section, mobile: f.mobile, payout_channel: f.channel, payout_account: f.account, status: 'pending', tag: null, ubak: 0, reject_reason: null, consent_at: null, consent_by: null, lang: f.lang, created_at: dbNow() });
  return id;
}
// Everything a supplier needs before they can earn. Used for both application and direct registration.
function activate(db, id, input, staff) {
  if (input.consent !== true) fail('consent_required');
  if (!['additional', 'existing'].includes(input.tag ?? '')) fail('tag_required');
  const tare = round1(input.tare_kg ?? 0), capacity = round1(input.capacity_kg ?? 0);
  if (!(tare > 0) || capacity <= tare) fail('bad_crate');
  const code = 'CR-' + id.slice(2) + 'A';
  if (db.crates.some((c) => c.code === code)) fail('server_error', 500);
  db.crates.push({ code, supplier_id: id, tare_kg: tare, capacity_kg: capacity, status: 'active' });
  db.crate_events.push({ id: nextId(db, 'crate_events'), crate_code: code, action: 'issued', detail: 'To ' + id, staff_id: staff.id, created_at: dbNow() });
  const s = getSupplier(db, id);
  Object.assign(s, { status: 'active', tag: input.tag, ubak: input.ubak ? 1 : 0, consent_at: dbNow(), consent_by: staff.id });
  for (const member of String(input.members ?? '').split('\n').map((x) => x.trim()).filter(Boolean)) {
    db.coop_members.push({ id: nextId(db, 'coop_members'), supplier_id: id, name: cleanText(member) });
  }
  audit(db, 'staff ' + staff.id, 'activate', id);
  sendSms(db, s, 'approved', { id });
  return { id, crate: code };
}
const APPLICATIONS = {
  apply(db, input) {
    const id = insertSupplier(db, readForm(db, input));
    audit(db, 'public', 'apply', id);
    sendSms(db, getSupplier(db, id), 'apply');
    return { id };
  },
  register(db, input) {
    const staff = requireStaff();
    const id = insertSupplier(db, readForm(db, input));
    return activate(db, id, input, staff);
  },
  activate(db, input) {
    const staff = requireStaff();
    const id = cleanText(input.id, 10);
    const s = getSupplier(db, id);
    if (!s || s.status !== 'pending') fail('not_pending', 404);
    if (input.in_person !== true) fail('in_person_required');
    return activate(db, id, input, staff);
  },
  reject(db, input) {
    const staff = requireStaff();
    const id = cleanText(input.id, 10);
    const reason = cleanText(input.reason, 160);
    const s = getSupplier(db, id);
    if (!s || s.status !== 'pending') fail('not_pending', 404);
    if (!reason) fail('reason_required');
    Object.assign(s, { status: 'rejected', reject_reason: reason });
    audit(db, 'staff ' + staff.id, 'reject', id + ': ' + reason);
    sendSms(db, s, 'rejected', { reason });
    return {};
  },
};

// ---------------------------------------------------------------------------
// supplier (api/supplier/index.php)
// ---------------------------------------------------------------------------
function payoutState(db, id, bal, thr) {
  const all = db.payouts.filter((p) => p.supplier_id === id).sort((a, b) => b.id - a.id);
  const latest = all[0] || null;
  let state;
  if (latest && latest.status === 'pending') state = latest.approved_at ? 'sending' : 'approving';
  else if (bal >= thr) state = 'reached';
  else state = 'below';
  return { state, latest, all };
}
const SUPPLIER = {
  summary(db) {
    const id = requireSupplier();
    const s = getSupplier(db, id);
    const bal = balance(db, id), thr = Number(setting(db, 'payout_threshold'));
    const thisMonth = dbNow().slice(0, 7);
    const month = { kg: 0, composted: 0, earned: 0 };
    const members = {};
    const history = db.dropoffs.filter((d) => d.supplier_id === id).sort(byOccurredDesc).map((d) => {
      const corr = latestCorrection(db, d.id);
      const amountChange = db.corrections.filter((c) => c.dropoff_id === d.id).reduce((a, c) => a + Number(c.amount_change), 0);
      const row = {
        ...d,
        member: db.coop_members.find((m) => m.id === d.member_id)?.name ?? null,
        station: db.stations.find((t) => t.id === d.station_id)?.name ?? '',
        corrected_kg: corr ? corr.new_net_kg : null,
        amount_change: amountChange,
      };
      row.net_now = Number(row.corrected_kg ?? row.net_kg);
      row.amount_now = round2(Number(row.amount) + amountChange);
      const accepted = row.grade !== 'rejected';
      if (accepted && row.occurred_at.startsWith(thisMonth)) {
        month.kg += row.net_now;
        month.earned += row.amount_now;
        if (row.composted) month.composted += row.net_now;
      }
      if (row.member && accepted) members[row.member] = round2((members[row.member] ?? 0) + row.amount_now);
      return row;
    });
    return {
      supplier: { id: s.id, name: s.name, type: s.type, section: s.section, channel: s.payout_channel, account: s.payout_account, lang: s.lang },
      balance: bal,
      carried: round2(db.ledger_entries.filter((e) => e.supplier_id === id && e.type === 'adjustment' && e.dropoff_id === null && e.payout_id === null).reduce((a, e) => a + Number(e.amount), 0)),
      threshold: thr,
      payout: payoutState(db, id, bal, thr),
      history, month, members,
      messages: db.messages.filter((m) => m.supplier_id === id).sort((a, b) => a.id - b.id).map((m) => ({ id: m.id, direction: m.direction, body: m.body, read_at: m.read_at, created_at: m.created_at })),
      hotline: setting(db, 'station_hotline'),
    };
  },
  send_message(db, input) {
    const id = requireSupplier();
    const text = cleanText(input.text, 200);
    if (!text) fail('empty');
    addMessage(db, id, 'in', text);
    const s = getSupplier(db, id);
    if ((input.keyword ?? '') === 'balance') sendSms(db, s, 'balance', { bal: nf(balance(db, id), 2) });
    else if (input.wants_call === true) sendSms(db, s, 'reply');
    return {};
  },
  mark_read(db) {
    const id = requireSupplier();
    const now = dbNow();
    db.messages.forEach((m) => { if (m.supplier_id === id && m.read_at === null) m.read_at = now; });
    return {};
  },
  set_lang(db, input) {
    const id = requireSupplier();
    if (!['fil', 'ilo', 'en'].includes(input.lang ?? '')) fail('bad_lang');
    getSupplier(db, id).lang = input.lang;
    return {};
  },
};

// ---------------------------------------------------------------------------
// payouts: Demo Controls (api/payouts/index.php)
// ---------------------------------------------------------------------------
const ACTOR = 'demo controls';
const PAYOUTS = {
  state(db) {
    const name = (id) => getSupplier(db, id)?.name ?? '';
    return {
      threshold: Number(setting(db, 'payout_threshold')),
      baseline: setting(db, 'baseline_mode') === '1',
      funding: setting(db, 'funding_active') === '1',
      balances: db.suppliers.filter((s) => s.status === 'active').sort((a, b) => a.name.localeCompare(b.name)).map((s) => ({ id: s.id, name: s.name, balance: balance(db, s.id) })),
      payouts: [...db.payouts].sort((a, b) => b.id - a.id).slice(0, 30).map((p) => ({ ...p, name: name(p.supplier_id) })),
      manifests: db.manifests.filter((m) => m.status === 'waiting').sort((a, b) => a.id - b.id),
    };
  },
  generate(db) {
    if (setting(db, 'funding_active') !== '1') fail('no_funding');
    const thr = Number(setting(db, 'payout_threshold'));
    let made = 0;
    for (const s of db.suppliers.filter((x) => x.status === 'active')) {
      const open = db.payouts.some((p) => p.supplier_id === s.id && p.status === 'pending');
      const bal = balance(db, s.id);
      if (!open && bal >= thr) {
        db.payouts.push({ id: nextId(db, 'payouts'), ref: null, supplier_id: s.id, amount: bal, status: 'pending', approved_at: null, created_at: dbNow(), updated_at: dbNow() });
        made++;
      }
    }
    audit(db, ACTOR, 'payout_list', made + ' suppliers');
    return { made };
  },
  approve(db) {
    if (setting(db, 'funding_active') !== '1') fail('no_funding');
    const rows = db.payouts.filter((p) => p.status === 'pending' && !p.approved_at);
    for (const p of rows) {
      const ref = 'PO-' + ymd(dbNow()) + '-' + pad4(p.id);
      Object.assign(p, { approved_at: dbNow(), ref, updated_at: dbNow() });
      addLedger(db, p.supplier_id, 'debit', -Number(p.amount), null, p.id, 'Payout ' + ref);
    }
    audit(db, ACTOR, 'payout_approve', rows.length + ' payouts');
    return { approved: rows.length };
  },
  mark(db, input) {
    const p = db.payouts.find((x) => x.id === Number(input.id));
    if (!p) fail('not_found', 404);
    const status = input.status ?? '';
    const allowed = (p.status === 'pending' && p.approved_at && ['sent', 'failed'].includes(status)) || (p.status === 'sent' && status === 'returned');
    if (!allowed) fail('bad_status');
    Object.assign(p, { status, updated_at: dbNow() });
    const s = getSupplier(db, p.supplier_id);
    const amount = nf(p.amount, 2);
    if (status === 'sent') {
      sendSms(db, s, 'sent', { amt: amount, channel: s.payout_channel === 'gcash' ? 'GCash' : 'bank', ref: p.ref });
    } else {
      addLedger(db, p.supplier_id, 'adjustment', Number(p.amount), null, p.id, `Payout ${p.ref} ${status}; back to balance`);
      sendSms(db, s, 'failed', { amt: amount });
    }
    audit(db, ACTOR, 'payout_' + status, String(p.ref));
    return {};
  },
  confirm_manifest(db, input) {
    const id = Number(input.id);
    const m = db.manifests.find((x) => x.id === id);
    if (m) m.status = 'confirmed';
    db.dropoffs.forEach((d) => { if (d.manifest_id === id) d.composted = 1; });
    audit(db, ACTOR, 'manifest_confirm', '#' + id);
    return {};
  },
  toggle(db, input) {
    const key = input.key ?? '';
    if (!['baseline_mode', 'funding_active'].includes(key)) fail('bad_key');
    db.settings[key] = input.on ? '1' : '0';
    audit(db, ACTOR, 'setting', key + '=' + db.settings[key]);
    return {};
  },
  reset() {
    resetDb();
    session.set({});
    return { reset: true };
  },
};

// ---------------------------------------------------------------------------
// setup: the data is built in, so it is always ready
// ---------------------------------------------------------------------------
const SETUP = {
  status() { return { ready: true }; },
  install() { fail('already_installed', 409); },
};

const ENDPOINTS = { auth: AUTH, station: STATION, dropoffs: DROPOFFS, applications: APPLICATIONS, supplier: SUPPLIER, payouts: PAYOUTS, setup: SETUP };

// Same signature and error shape as the server version: resolves with { ok: true, ... } or throws an Error with .code and .status.
// Each call works on a copy of the data and saves only if it succeeds, so a failed action changes nothing.
async function api(endpoint, action, data) {
  const handler = ENDPOINTS[endpoint]?.[action];
  try {
    if (!handler) fail('unknown_action', 404);
    const db = loadDb();
    const result = handler(db, data ?? {});
    if (!(result && result.reset)) saveDb(db);
    return { ok: true, ...result };
  } catch (e) {
    const err = new Error(e instanceof ApiFail ? e.code : 'server_error');
    err.code = e instanceof ApiFail ? e.code : 'server_error';
    err.status = e instanceof ApiFail ? e.status : 500;
    err.detail = '';
    if (!(e instanceof ApiFail)) console.error('[api]', endpoint, action, e);
    throw err;
  }
}
