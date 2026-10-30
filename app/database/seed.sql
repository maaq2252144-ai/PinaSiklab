-- Illustrative demo data. Names, numbers, crate weights and capacities are samples, not real records.
INSERT INTO settings (k, v, note) VALUES
 ('payout_threshold', '200', 'Concept note default'),
 ('baseline_mode', '0', 'FR23: 1 = weigh and record without pay'),
 ('funding_active', '1', 'FR50: 0 = payouts blocked'),
 ('flag_jump_multiple', '3', 'Sample value: flag a load this many times above the supplier average'),
 ('demo_otp', '482619', 'Demo only; no SMS is really sent'),
 ('station_hotline', '[STATION HOTLINE]', 'Placeholder');

INSERT INTO rates (effective_at, clean, minor, existing_bonus, changed_by) VALUES
 ('2026-01-01 00:00:00', 0.60, NULL, NULL, 'Seed data');

INSERT INTO stations (id, name) VALUES (1, 'Baguio Public Market');
INSERT INTO staff (id, station_id, name, pin) VALUES (1, 1, 'Kuya Jun', '1234');

INSERT INTO suppliers (id, type, name, section, mobile, payout_channel, payout_account, status, tag, ubak, consent_at, consent_by, lang, created_at) VALUES
 ('S-0207','coop','Ben Dulnuan · Atok Farmers Co-op','Atok, Benguet','09170000207','gcash','09170000207','active','additional',0,NOW() - INTERVAL 40 DAY,1,'fil',NOW() - INTERVAL 40 DAY),
 ('S-0112','vendor','Nena Bautista','Vegetable Section, Stall 12','09170000112','gcash','09170000112','active','additional',1,NOW() - INTERVAL 30 DAY,1,'fil',NOW() - INTERVAL 30 DAY),
 ('S-0145','vendor','Luz Pacio','Dry Goods Row, Stall 45','09170000145','gcash','09170000145','active','additional',0,NOW() - INTERVAL 20 DAY,1,'ilo',NOW() - INTERVAL 20 DAY),
 ('S-0188','vendor','Jenny Ramos','Fruit Section, Stall 8','09170000188','gcash','09170000188','active','existing',0,NOW() - INTERVAL 20 DAY,1,'en',NOW() - INTERVAL 20 DAY);
INSERT INTO suppliers (id, type, name, section, mobile, payout_channel, payout_account, status, lang, created_at) VALUES
 ('S-0301','vendor','Rosa Kimmay','Vegetable Section, Stall 31','09170000301','gcash','09170000301','pending','ilo',NOW() - INTERVAL 1 DAY);

INSERT INTO coop_members (id, supplier_id, name) VALUES (1,'S-0207','Ben Dulnuan'), (2,'S-0207','Maria Awingan'), (3,'S-0207','Pedro Tayaban');

INSERT INTO crates (code, supplier_id, tare_kg, capacity_kg) VALUES
 ('CR-0207A','S-0207',2.0,100.0), ('CR-0207B','S-0207',2.0,100.0),
 ('CR-0112A','S-0112',1.5,30.0), ('CR-0145A','S-0145',1.5,15.0), ('CR-0188A','S-0188',1.5,30.0),
 ('CR-SPARE1',NULL,1.5,30.0);

INSERT INTO manifests (id, station_id, total_kg, crate_count, time_out, status, staff_id) VALUES
 (1,1,116.0,2,NOW() - INTERVAL 2 DAY,'confirmed',1);

INSERT INTO dropoffs (client_uuid, record_no, supplier_id, crate_code, member_id, station_id, staff_id, device, gross_kg, tare_kg, net_kg, grade, reason, rate_applied, amount, pay_note, photo_name, occurred_at, synced_at, manifest_id, composted) VALUES
 ('seed-1','WL-SEED-0001','S-0207','CR-0207A',1,1,1,'Station phone 1',14.0,2.0,12.0,'rejected','plastic',NULL,0,'rejected','placeholder-photo.svg',NOW() - INTERVAL 6 DAY,NOW() - INTERVAL 6 DAY,NULL,0),
 ('seed-2','WL-SEED-0002','S-0207','CR-0207A',2,1,1,'Station phone 1',38.0,2.0,36.0,'minor','plastic',NULL,0,'tbd','placeholder-photo.svg',NOW() - INTERVAL 4 DAY,NOW() - INTERVAL 4 DAY,1,1),
 ('seed-3','WL-SEED-0003','S-0207','CR-0207B',1,1,1,'Station phone 1',82.0,2.0,80.0,'clean',NULL,0.60,48.00,'paid','placeholder-photo.svg',NOW() - INTERVAL 2 DAY,NOW() - INTERVAL 2 DAY,1,1),
 ('seed-4','WL-SEED-0004','S-0207','CR-0207A',3,1,1,'Station phone 1',56.0,2.0,54.0,'clean',NULL,0.60,32.40,'paid','placeholder-photo.svg',NOW() - INTERVAL 1 HOUR,NOW() - INTERVAL 1 HOUR,NULL,0),
 ('seed-5','WL-SEED-0005','S-0145','CR-0145A',NULL,1,1,'Station phone 1',5.7,1.5,4.2,'clean',NULL,0.60,2.52,'paid','placeholder-photo.svg',NOW() - INTERVAL 40 MINUTE,NOW() - INTERVAL 40 MINUTE,NULL,0);

INSERT INTO ledger_entries (supplier_id, type, amount, dropoff_id, note, created_at) VALUES
 ('S-0207','adjustment',77.40,NULL,'Carried over from last month',NOW() - INTERVAL 7 DAY),
 ('S-0207','credit',48.00,3,'Drop-off WL-SEED-0003',NOW() - INTERVAL 2 DAY),
 ('S-0207','credit',32.40,4,'Drop-off WL-SEED-0004',NOW() - INTERVAL 1 HOUR),
 ('S-0112','adjustment',212.40,NULL,'Carried over from last month',NOW() - INTERVAL 7 DAY),
 ('S-0145','credit',2.52,5,'Drop-off WL-SEED-0005',NOW() - INTERVAL 40 MINUTE);

INSERT INTO messages (supplier_id, direction, body, created_at) VALUES
 ('S-0207','out','WasteLedger: 54.0 kg Malinis. +P32.40. Balanse: P157.80.',NOW() - INTERVAL 1 HOUR),
 ('S-0112','out','WasteLedger: Umabot na sa P200 ang balanse mo. Isasama ito ng lungsod sa susunod na listahan ng bayad.',NOW() - INTERVAL 1 DAY);

-- More sample accounts, so every login case can be tried. Names and numbers are illustrative.
-- Staff: one PIN each. Everyone works at the one station the documents name.
INSERT INTO staff (id, station_id, name, pin) VALUES (2, 1, 'Ate Carmen', '5678'), (3, 1, 'Kuya Dante', '2468');

-- S-0215: co-op paid by bank, with a payout that was already sent.
-- S-0120: vendor whose last payout failed and went back to the balance.
-- S-0302: rejected applicant. S-0303: co-op still waiting for staff.
INSERT INTO suppliers (id, type, name, section, mobile, payout_channel, payout_account, status, tag, ubak, consent_at, consent_by, lang, created_at) VALUES
 ('S-0215','coop','Elena Bayang · La Trinidad Growers Co-op','La Trinidad, Benguet','09170000215','bank','Landbank 0000-0215-00','active','additional',0,NOW() - INTERVAL 50 DAY,2,'en',NOW() - INTERVAL 50 DAY),
 ('S-0120','vendor','Carlo Dumalo','Vegetable Section, Stall 20','09170000120','gcash','09170000120','active','additional',0,NOW() - INTERVAL 35 DAY,3,'ilo',NOW() - INTERVAL 35 DAY);
INSERT INTO suppliers (id, type, name, section, mobile, payout_channel, payout_account, status, reject_reason, lang, created_at) VALUES
 ('S-0302','vendor','Mario Calpito','Meat Section, Stall 2','09170000302','gcash','09170000302','rejected','Sample reason: could not be confirmed in person','fil',NOW() - INTERVAL 5 DAY);
INSERT INTO suppliers (id, type, name, section, mobile, payout_channel, payout_account, status, lang, created_at) VALUES
 ('S-0303','coop','Joel Bantog · Kapangan Farmers Association','Kapangan, Benguet','09170000303','gcash','09170000303','pending','fil',NOW() - INTERVAL 2 DAY);

INSERT INTO coop_members (id, supplier_id, name) VALUES (4,'S-0215','Elena Bayang'), (5,'S-0215','Rudy Pacyaya'), (6,'S-0215','Grace Ognayon');

INSERT INTO crates (code, supplier_id, tare_kg, capacity_kg) VALUES
 ('CR-0215A','S-0215',2.0,100.0), ('CR-0215B','S-0215',2.0,100.0), ('CR-0120A','S-0120',1.5,30.0);

INSERT INTO dropoffs (id, client_uuid, record_no, supplier_id, crate_code, member_id, station_id, staff_id, device, gross_kg, tare_kg, net_kg, grade, reason, rate_applied, amount, pay_note, photo_name, occurred_at, synced_at, manifest_id, composted) VALUES
 (6,'seed-6','WL-SEED-0006','S-0215','CR-0215A',5,1,2,'Station phone 1',64.0,2.0,62.0,'clean',NULL,0.60,37.20,'paid','placeholder-photo.svg',NOW() - INTERVAL 3 HOUR,NOW() - INTERVAL 3 HOUR,NULL,0),
 (7,'seed-7','WL-SEED-0007','S-0120','CR-0120A',NULL,1,3,'Station phone 1',11.5,1.5,10.0,'minor','mixed',NULL,0,'tbd','placeholder-photo.svg',NOW() - INTERVAL 2 HOUR,NOW() - INTERVAL 2 HOUR,NULL,0);

INSERT INTO payouts (id, ref, supplier_id, amount, status, approved_at, created_at, updated_at) VALUES
 (1,'PO-SEED-0001','S-0215',214.80,'sent',NOW() - INTERVAL 10 DAY,NOW() - INTERVAL 11 DAY,NOW() - INTERVAL 10 DAY),
 (2,'PO-SEED-0002','S-0120',205.00,'failed',NOW() - INTERVAL 3 DAY,NOW() - INTERVAL 4 DAY,NOW() - INTERVAL 2 DAY);

-- Balances are always the sum of these rows: S-0215 ends at 37.20, S-0120 at 205.00.
INSERT INTO ledger_entries (supplier_id, type, amount, dropoff_id, payout_id, note, created_at) VALUES
 ('S-0215','adjustment',214.80,NULL,NULL,'Carried over from last month',NOW() - INTERVAL 15 DAY),
 ('S-0215','debit',-214.80,NULL,1,'Payout PO-SEED-0001',NOW() - INTERVAL 10 DAY),
 ('S-0215','credit',37.20,6,NULL,'Drop-off WL-SEED-0006',NOW() - INTERVAL 3 HOUR),
 ('S-0120','adjustment',205.00,NULL,NULL,'Carried over from last month',NOW() - INTERVAL 6 DAY),
 ('S-0120','debit',-205.00,NULL,2,'Payout PO-SEED-0002',NOW() - INTERVAL 3 DAY),
 ('S-0120','adjustment',205.00,NULL,2,'Payout PO-SEED-0002 failed; back to balance',NOW() - INTERVAL 2 DAY);

INSERT INTO messages (supplier_id, direction, body, created_at) VALUES
 ('S-0215','out','WasteLedger: The city sent P214.80 to your bank. Ref: PO-SEED-0001.',NOW() - INTERVAL 10 DAY),
 ('S-0215','out','WasteLedger: 62.0 kg Clean. +P37.20. Balance: P37.20.',NOW() - INTERVAL 3 HOUR),
 ('S-0120','out','WasteLedger: Saan a naipatulod ti P205.00. Naisubli daytoy iti balansem. Mapan iti timbangan tapno makita ti accountmo.',NOW() - INTERVAL 2 DAY),
 ('S-0120','out','WasteLedger: 10.0 kg Bassit a nalaokan. Bayad: [TBD]. Balanse: P205.00.',NOW() - INTERVAL 2 HOUR),
 ('S-0302','out','WasteLedger: Hindi naaprubahan ang aplikasyon mo. Dahilan: Sample reason: could not be confirmed in person.',NOW() - INTERVAL 4 DAY);
