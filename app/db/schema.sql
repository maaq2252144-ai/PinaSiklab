-- WasteLedger PH prototype schema. Re-running this wipes the demo data.
-- Prototype only: the team's ERD should supersede it.
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS audit_log, manifests, calibration_logs, messages, payouts, corrections,
  ledger_entries, dropoffs, crate_events, crates, coop_members, suppliers, staff, stations, rates, settings;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE settings (
  k VARCHAR(40) PRIMARY KEY,
  v VARCHAR(100) NULL,
  note VARCHAR(160) NULL
);

-- FR28, FR41: rates are versioned; a drop-off uses the row in effect when it happened.
CREATE TABLE rates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  effective_at DATETIME NOT NULL,
  clean DECIMAL(6,2) NOT NULL,
  minor DECIMAL(6,2) NULL COMMENT 'NULL = [TBD]',
  existing_bonus DECIMAL(6,2) NULL COMMENT 'NULL = [TBD]',
  changed_by VARCHAR(60) NOT NULL
);

CREATE TABLE stations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(80) NOT NULL
);

CREATE TABLE staff (
  id INT AUTO_INCREMENT PRIMARY KEY,
  station_id INT NOT NULL,
  name VARCHAR(80) NOT NULL,
  pin VARCHAR(10) NOT NULL,
  FOREIGN KEY (station_id) REFERENCES stations(id)
);

-- FR2: there is deliberately no government ID column.
CREATE TABLE suppliers (
  id VARCHAR(10) PRIMARY KEY,
  type ENUM('vendor','coop','household') NOT NULL,
  name VARCHAR(100) NOT NULL,
  section VARCHAR(100) NOT NULL,
  mobile VARCHAR(11) NOT NULL UNIQUE,
  payout_channel ENUM('gcash','bank') NOT NULL DEFAULT 'gcash',
  payout_account VARCHAR(40) NOT NULL,
  status ENUM('pending','active','rejected') NOT NULL DEFAULT 'pending',
  tag ENUM('additional','existing') NULL,
  ubak TINYINT(1) NOT NULL DEFAULT 0,
  reject_reason VARCHAR(160) NULL,
  consent_at DATETIME NULL,
  consent_by INT NULL,
  lang ENUM('fil','ilo','en') NOT NULL DEFAULT 'fil',
  created_at DATETIME NOT NULL
);

CREATE TABLE coop_members (
  id INT AUTO_INCREMENT PRIMARY KEY,
  supplier_id VARCHAR(10) NOT NULL,
  name VARCHAR(100) NOT NULL,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);

CREATE TABLE crates (
  code VARCHAR(12) PRIMARY KEY,
  supplier_id VARCHAR(10) NULL,
  tare_kg DECIMAL(5,1) NOT NULL,
  capacity_kg DECIMAL(5,1) NOT NULL,
  status ENUM('active','retired','lost') NOT NULL DEFAULT 'active',
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);

CREATE TABLE crate_events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  crate_code VARCHAR(12) NOT NULL,
  action VARCHAR(20) NOT NULL,
  detail VARCHAR(160) NULL,
  staff_id INT NULL,
  created_at DATETIME NOT NULL
);

CREATE TABLE manifests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  station_id INT NOT NULL,
  total_kg DECIMAL(9,1) NOT NULL,
  crate_count INT NOT NULL,
  time_out DATETIME NOT NULL,
  status ENUM('waiting','confirmed') NOT NULL DEFAULT 'waiting',
  staff_id INT NOT NULL
);

-- FR25: client_uuid is generated on the phone, so a record uploaded twice counts once.
CREATE TABLE dropoffs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_uuid VARCHAR(40) NOT NULL UNIQUE,
  record_no VARCHAR(20) NULL,
  supplier_id VARCHAR(10) NOT NULL,
  crate_code VARCHAR(12) NOT NULL,
  member_id INT NULL,
  station_id INT NOT NULL,
  staff_id INT NOT NULL,
  device VARCHAR(60) NULL,
  gross_kg DECIMAL(6,1) NOT NULL,
  tare_kg DECIMAL(5,1) NOT NULL,
  net_kg DECIMAL(6,1) NOT NULL,
  grade ENUM('clean','minor','rejected') NOT NULL,
  reason VARCHAR(20) NULL,
  rate_applied DECIMAL(6,2) NULL,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  pay_note ENUM('paid','tbd','baseline','rejected') NOT NULL,
  flags VARCHAR(60) NULL,
  photo_name VARCHAR(80) NOT NULL,
  lat DECIMAL(9,6) NULL,
  lng DECIMAL(9,6) NULL,
  occurred_at DATETIME NOT NULL,
  synced_at DATETIME NOT NULL,
  manifest_id INT NULL,
  composted TINYINT(1) NOT NULL DEFAULT 0,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
  FOREIGN KEY (manifest_id) REFERENCES manifests(id)
);

-- Append-only. A balance is always SUM(amount), never a stored number.
CREATE TABLE ledger_entries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  supplier_id VARCHAR(10) NOT NULL,
  type ENUM('credit','debit','adjustment') NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  dropoff_id INT NULL,
  payout_id INT NULL,
  note VARCHAR(160) NULL,
  created_at DATETIME NOT NULL,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);

-- FR31: the drop-off row keeps its original values; each correction is a new linked row.
CREATE TABLE corrections (
  id INT AUTO_INCREMENT PRIMARY KEY,
  dropoff_id INT NOT NULL,
  old_net_kg DECIMAL(6,1) NOT NULL,
  new_net_kg DECIMAL(6,1) NOT NULL,
  amount_change DECIMAL(10,2) NOT NULL,
  reason VARCHAR(200) NOT NULL,
  staff_id INT NOT NULL,
  created_at DATETIME NOT NULL,
  FOREIGN KEY (dropoff_id) REFERENCES dropoffs(id)
);

CREATE TABLE payouts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ref VARCHAR(24) NULL,
  supplier_id VARCHAR(10) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status ENUM('pending','sent','failed','returned') NOT NULL DEFAULT 'pending',
  approved_at DATETIME NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);

CREATE TABLE messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  supplier_id VARCHAR(10) NOT NULL,
  direction ENUM('in','out') NOT NULL,
  body VARCHAR(400) NOT NULL,
  read_at DATETIME NULL,
  created_at DATETIME NOT NULL,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);

CREATE TABLE calibration_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  station_id INT NOT NULL,
  staff_id INT NOT NULL,
  reference_kg DECIMAL(6,1) NOT NULL,
  reading_kg DECIMAL(6,1) NOT NULL,
  result ENUM('pass','fail') NOT NULL,
  created_at DATETIME NOT NULL
);

CREATE TABLE audit_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  actor VARCHAR(80) NOT NULL,
  action VARCHAR(40) NOT NULL,
  detail VARCHAR(240) NULL,
  created_at DATETIME NOT NULL
);
