// Static (Netlify) version: the "database" lives in this browser's localStorage.
// The accounts and sample records below are hardcoded copies of database/seed.sql from the main branch.
// Each browser keeps its own copy, so a load weighed on one phone does not show on another.

const DB_KEY = 'wl_db_v1';
const SESSION_KEY = 'wl_session';

// "YYYY-MM-DD HH:MM:SS" in local time, the format the PHP version used.
const dbNow = () => localDateTime(new Date());
const ago = ({ days = 0, hours = 0, minutes = 0 }) => localDateTime(new Date(Date.now() - ((days * 24 + hours) * 60 + minutes) * 60000));

// ---------------------------------------------------------------------------
// Hardcoded accounts and sample data
// ---------------------------------------------------------------------------
function seedData() {
  const supplier = (id, type, name, section, mobile, channel, account, status, tag, ubak, consentDays, consentBy, lang, createdDays, rejectReason = null) => ({
    id, type, name, section, mobile, payout_channel: channel, payout_account: account, status, tag, ubak,
    reject_reason: rejectReason, consent_at: consentDays === null ? null : ago({ days: consentDays }), consent_by: consentBy, lang, created_at: ago({ days: createdDays }),
  });
  const dropoff = (id, supplierId, crate, member, staffId, gross, tare, grade, reason, rate, amount, payNote, when, manifestId, composted) => ({
    id, client_uuid: 'seed-' + id, record_no: 'WL-SEED-' + String(id).padStart(4, '0'), supplier_id: supplierId, crate_code: crate, member_id: member,
    station_id: 1, staff_id: staffId, device: 'Station phone 1', gross_kg: gross, tare_kg: tare, net_kg: Math.round((gross - tare) * 10) / 10,
    grade, reason, rate_applied: rate, amount, pay_note: payNote, flags: null, photo_name: 'placeholder-photo.svg', lat: null, lng: null,
    occurred_at: ago(when), synced_at: ago(when), manifest_id: manifestId, composted,
  });
  const ledger = (supplierId, type, amount, dropoffId, payoutId, note, when) => ({ supplier_id: supplierId, type, amount, dropoff_id: dropoffId, payout_id: payoutId, note, created_at: ago(when) });

  const data = {
    settings: {
      payout_threshold: '200', baseline_mode: '0', funding_active: '1', flag_jump_multiple: '3',
      demo_otp: '482619', station_hotline: '[STATION HOTLINE]',
    },
    rates: [{ id: 1, effective_at: '2026-01-01 00:00:00', clean: 0.60, minor: null, existing_bonus: null, changed_by: 'Seed data' }],
    stations: [{ id: 1, name: 'Baguio Public Market' }],
    // Station staff log in with these PINs.
    staff: [
      { id: 1, station_id: 1, name: 'Kuya Jun', pin: '1234' },
      { id: 2, station_id: 1, name: 'Ate Carmen', pin: '5678' },
      { id: 3, station_id: 1, name: 'Kuya Dante', pin: '2468' },
    ],
    // Suppliers log in with their mobile number and the SMS code in settings.demo_otp.
    suppliers: [
      supplier('S-0207', 'coop', 'Ben Dulnuan · Atok Farmers Co-op', 'Atok, Benguet', '09170000207', 'gcash', '09170000207', 'active', 'additional', 0, 40, 1, 'fil', 40),
      supplier('S-0112', 'vendor', 'Nena Bautista', 'Vegetable Section, Stall 12', '09170000112', 'gcash', '09170000112', 'active', 'additional', 1, 30, 1, 'fil', 30),
      supplier('S-0145', 'vendor', 'Luz Pacio', 'Dry Goods Row, Stall 45', '09170000145', 'gcash', '09170000145', 'active', 'additional', 0, 20, 1, 'ilo', 20),
      supplier('S-0188', 'vendor', 'Jenny Ramos', 'Fruit Section, Stall 8', '09170000188', 'gcash', '09170000188', 'active', 'existing', 0, 20, 1, 'en', 20),
      supplier('S-0215', 'coop', 'Elena Bayang · La Trinidad Growers Co-op', 'La Trinidad, Benguet', '09170000215', 'bank', 'Landbank 0000-0215-00', 'active', 'additional', 0, 50, 2, 'en', 50),
      supplier('S-0120', 'vendor', 'Carlo Dumalo', 'Vegetable Section, Stall 20', '09170000120', 'gcash', '09170000120', 'active', 'additional', 0, 35, 3, 'ilo', 35),
      supplier('S-0301', 'vendor', 'Rosa Kimmay', 'Vegetable Section, Stall 31', '09170000301', 'gcash', '09170000301', 'pending', null, 0, null, null, 'ilo', 1),
      supplier('S-0302', 'vendor', 'Mario Calpito', 'Meat Section, Stall 2', '09170000302', 'gcash', '09170000302', 'rejected', null, 0, null, null, 'fil', 5, 'Sample reason: could not be confirmed in person'),
      supplier('S-0303', 'coop', 'Joel Bantog · Kapangan Farmers Association', 'Kapangan, Benguet', '09170000303', 'gcash', '09170000303', 'pending', null, 0, null, null, 'fil', 2),
    ],
    coop_members: [
      { id: 1, supplier_id: 'S-0207', name: 'Ben Dulnuan' }, { id: 2, supplier_id: 'S-0207', name: 'Maria Awingan' }, { id: 3, supplier_id: 'S-0207', name: 'Pedro Tayaban' },
      { id: 4, supplier_id: 'S-0215', name: 'Elena Bayang' }, { id: 5, supplier_id: 'S-0215', name: 'Rudy Pacyaya' }, { id: 6, supplier_id: 'S-0215', name: 'Grace Ognayon' },
    ],
    crates: [
      ['CR-0207A', 'S-0207', 2.0, 100.0], ['CR-0207B', 'S-0207', 2.0, 100.0], ['CR-0112A', 'S-0112', 1.5, 30.0], ['CR-0145A', 'S-0145', 1.5, 15.0],
      ['CR-0188A', 'S-0188', 1.5, 30.0], ['CR-SPARE1', null, 1.5, 30.0], ['CR-0215A', 'S-0215', 2.0, 100.0], ['CR-0215B', 'S-0215', 2.0, 100.0], ['CR-0120A', 'S-0120', 1.5, 30.0],
    ].map(([code, supplierId, tare, capacity]) => ({ code, supplier_id: supplierId, tare_kg: tare, capacity_kg: capacity, status: 'active' })),
    crate_events: [],
    manifests: [{ id: 1, station_id: 1, total_kg: 116.0, crate_count: 2, time_out: ago({ days: 2 }), status: 'confirmed', staff_id: 1 }],
    dropoffs: [
      dropoff(1, 'S-0207', 'CR-0207A', 1, 1, 14.0, 2.0, 'rejected', 'plastic', null, 0, 'rejected', { days: 6 }, null, 0),
      dropoff(2, 'S-0207', 'CR-0207A', 2, 1, 38.0, 2.0, 'minor', 'plastic', null, 0, 'tbd', { days: 4 }, 1, 1),
      dropoff(3, 'S-0207', 'CR-0207B', 1, 1, 82.0, 2.0, 'clean', null, 0.60, 48.00, 'paid', { days: 2 }, 1, 1),
      dropoff(4, 'S-0207', 'CR-0207A', 3, 1, 56.0, 2.0, 'clean', null, 0.60, 32.40, 'paid', { hours: 1 }, null, 0),
      dropoff(5, 'S-0145', 'CR-0145A', null, 1, 5.7, 1.5, 'clean', null, 0.60, 2.52, 'paid', { minutes: 40 }, null, 0),
      dropoff(6, 'S-0215', 'CR-0215A', 5, 2, 64.0, 2.0, 'clean', null, 0.60, 37.20, 'paid', { hours: 3 }, null, 0),
      dropoff(7, 'S-0120', 'CR-0120A', null, 3, 11.5, 1.5, 'minor', 'mixed', null, 0, 'tbd', { hours: 2 }, null, 0),
    ],
    corrections: [],
    payouts: [
      { id: 1, ref: 'PO-SEED-0001', supplier_id: 'S-0215', amount: 214.80, status: 'sent', approved_at: ago({ days: 10 }), created_at: ago({ days: 11 }), updated_at: ago({ days: 10 }) },
      { id: 2, ref: 'PO-SEED-0002', supplier_id: 'S-0120', amount: 205.00, status: 'failed', approved_at: ago({ days: 3 }), created_at: ago({ days: 4 }), updated_at: ago({ days: 2 }) },
    ],
    // A balance is always the sum of these rows.
    ledger_entries: [
      ledger('S-0207', 'adjustment', 77.40, null, null, 'Carried over from last month', { days: 7 }),
      ledger('S-0207', 'credit', 48.00, 3, null, 'Drop-off WL-SEED-0003', { days: 2 }),
      ledger('S-0207', 'credit', 32.40, 4, null, 'Drop-off WL-SEED-0004', { hours: 1 }),
      ledger('S-0112', 'adjustment', 212.40, null, null, 'Carried over from last month', { days: 7 }),
      ledger('S-0145', 'credit', 2.52, 5, null, 'Drop-off WL-SEED-0005', { minutes: 40 }),
      ledger('S-0215', 'adjustment', 214.80, null, null, 'Carried over from last month', { days: 15 }),
      ledger('S-0215', 'debit', -214.80, null, 1, 'Payout PO-SEED-0001', { days: 10 }),
      ledger('S-0215', 'credit', 37.20, 6, null, 'Drop-off WL-SEED-0006', { hours: 3 }),
      ledger('S-0120', 'adjustment', 205.00, null, null, 'Carried over from last month', { days: 6 }),
      ledger('S-0120', 'debit', -205.00, null, 2, 'Payout PO-SEED-0002', { days: 3 }),
      ledger('S-0120', 'adjustment', 205.00, null, 2, 'Payout PO-SEED-0002 failed; back to balance', { days: 2 }),
    ],
    messages: [
      ['S-0207', 'WasteLedger: 54.0 kg Malinis. +P32.40. Balanse: P157.80.', { hours: 1 }],
      ['S-0112', 'WasteLedger: Umabot na sa P200 ang balanse mo. Isasama ito ng lungsod sa susunod na listahan ng bayad.', { days: 1 }],
      ['S-0215', 'WasteLedger: The city sent P214.80 to your bank. Ref: PO-SEED-0001.', { days: 10 }],
      ['S-0215', 'WasteLedger: 62.0 kg Clean. +P37.20. Balance: P37.20.', { hours: 3 }],
      ['S-0120', 'WasteLedger: Saan a naipatulod ti P205.00. Naisubli daytoy iti balansem. Mapan iti timbangan tapno makita ti accountmo.', { days: 2 }],
      ['S-0120', 'WasteLedger: 10.0 kg Bassit a nalaokan. Bayad: [TBD]. Balanse: P205.00.', { hours: 2 }],
      ['S-0302', 'WasteLedger: Hindi naaprubahan ang aplikasyon mo. Dahilan: Sample reason: could not be confirmed in person.', { days: 4 }],
    ].map(([supplierId, body, when], i) => ({ id: i + 1, supplier_id: supplierId, direction: 'out', body, read_at: null, created_at: ago(when) })),
    calibration_logs: [],
    audit_log: [],
  };
  // Next id for each table, like AUTO_INCREMENT.
  data.seq = {};
  for (const [table, rows] of Object.entries(data)) {
    if (Array.isArray(rows)) data.seq[table] = rows.reduce((m, r) => Math.max(m, Number(r.id) || 0), 0);
  }
  // Ledger rows were inserted without ids above; number them now.
  data.ledger_entries.forEach((r, i) => { r.id = i + 1; });
  data.seq.ledger_entries = data.ledger_entries.length;
  return data;
}

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------
let memoryDb = null; // used when the browser blocks localStorage (private mode)
function loadDb() {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* fall through to a fresh copy */ }
  if (memoryDb) return JSON.parse(JSON.stringify(memoryDb));
  const fresh = seedData();
  saveDb(fresh);
  return JSON.parse(JSON.stringify(fresh));
}
function saveDb(data) {
  memoryDb = data;
  try { localStorage.setItem(DB_KEY, JSON.stringify(data)); } catch (e) { /* keep the in-memory copy */ }
}
function resetDb() {
  const fresh = seedData();
  saveDb(fresh);
}

const session = {
  get() { try { return JSON.parse(localStorage.getItem(SESSION_KEY)) || {}; } catch (e) { return {}; } },
  set(v) { try { localStorage.setItem(SESSION_KEY, JSON.stringify(v)); } catch (e) { /* private mode */ } },
};
