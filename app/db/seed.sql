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
