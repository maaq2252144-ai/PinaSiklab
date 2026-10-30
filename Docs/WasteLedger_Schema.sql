/* =============================================================================
   WasteLedger PH database schema
   Microsoft SQL Server (T-SQL), tested on SQL Server 2025.
   Run with: sqlcmd -S localhost -E -C -d <database> -i WasteLedger_Schema.sql

   Values marked TBD in the requirements are nullable columns with no default.
   All timestamps are stored in UTC.
   ============================================================================= */

SET NOCOUNT ON;
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;   -- required for the computed columns (sqlcmd defaults it to OFF)
GO

/* -----------------------------------------------------------------------------
   1. Cities, stations, facilities and users
   ----------------------------------------------------------------------------- */

CREATE TABLE dbo.cities (
    city_id                    INT IDENTITY PRIMARY KEY,
    name                       NVARCHAR(100) NOT NULL UNIQUE,
    payout_channel             VARCHAR(20)   NOT NULL
        CHECK (payout_channel IN ('xendit', 'gcash', 'landbank')),
    match_tolerance_pct        DECIMAL(5,2)  NULL,          -- TBD (FR53)
    subscription_waived_until  DATE          NULL,          -- FR74
    created_at                 DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE dbo.stations (
    station_id   INT IDENTITY PRIMARY KEY,
    city_id      INT           NOT NULL REFERENCES dbo.cities (city_id),
    name         NVARCHAR(100) NOT NULL,
    location     NVARCHAR(200) NULL,
    is_active    BIT           NOT NULL DEFAULT 1,
    created_at   DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    UNIQUE (city_id, name)
);

CREATE TABLE dbo.market_sections (
    market_section_id  INT IDENTITY PRIMARY KEY,
    city_id            INT           NOT NULL REFERENCES dbo.cities (city_id),
    station_id         INT           NULL REFERENCES dbo.stations (station_id),
    name               NVARCHAR(100) NOT NULL,
    diversion_status   VARCHAR(10)   NOT NULL
        CHECK (diversion_status IN ('additional', 'existing')),   -- FR8
    UNIQUE (city_id, name)
);

CREATE TABLE dbo.facilities (
    facility_id    INT IDENTITY PRIMARY KEY,
    city_id        INT           NOT NULL REFERENCES dbo.cities (city_id),
    name           NVARCHAR(100) NOT NULL,
    facility_type  VARCHAR(20)   NOT NULL
        CHECK (facility_type IN ('composting', 'black_soldier_fly', 'biodigester')),
    is_active      BIT           NOT NULL DEFAULT 1,
    UNIQUE (city_id, name)
);

CREATE TABLE dbo.users (
    user_id        INT IDENTITY PRIMARY KEY,
    city_id        INT           NULL REFERENCES dbo.cities (city_id),
    role           VARCHAR(20)   NOT NULL
        CHECK (role IN ('station_staff', 'station_supervisor', 'city_admin',
                        'council_viewer', 'facility_staff', 'auditor', 'platform_admin')),
    full_name      NVARCHAR(100) NOT NULL,
    email          VARCHAR(200)  NULL,
    mobile_number  VARCHAR(20)   NULL,
    password_hash  VARCHAR(255)  NOT NULL,
    station_id     INT           NULL REFERENCES dbo.stations (station_id),
    facility_id    INT           NULL REFERENCES dbo.facilities (facility_id),
    is_active      BIT           NOT NULL DEFAULT 1,
    created_at     DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    -- Only platform admins work across cities (FR77).
    CHECK (role = 'platform_admin' OR city_id IS NOT NULL)
);

-- Emails are optional (many station staff won't have one), so uniqueness
-- applies only to the rows that have one.
CREATE UNIQUE INDEX ux_users_email ON dbo.users (email) WHERE email IS NOT NULL;

CREATE TABLE dbo.devices (
    device_id          INT IDENTITY PRIMARY KEY,
    station_id         INT           NOT NULL REFERENCES dbo.stations (station_id),
    device_identifier  VARCHAR(100)  NOT NULL UNIQUE,
    label              NVARCHAR(100) NULL,
    last_synced_at     DATETIME2     NULL,
    is_active          BIT           NOT NULL DEFAULT 1
);
GO

/* -----------------------------------------------------------------------------
   2. Cost and rate settings (versioned by effective date)
   ----------------------------------------------------------------------------- */

CREATE TABLE dbo.cost_settings (
    cost_setting_id       INT IDENTITY PRIMARY KEY,
    city_id               INT           NOT NULL REFERENCES dbo.cities (city_id),
    hauling_cost_per_ton  DECIMAL(10,2) NOT NULL CHECK (hauling_cost_per_ton >= 0),
    tipping_fee_per_ton   DECIMAL(10,2) NOT NULL CHECK (tipping_fee_per_ton >= 0),
    effective_from        DATE          NOT NULL,
    set_by                INT           NOT NULL REFERENCES dbo.users (user_id),
    created_at            DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    UNIQUE (city_id, effective_from)
);

CREATE TABLE dbo.rate_settings (
    rate_setting_id              INT IDENTITY PRIMARY KEY,
    city_id                      INT          NOT NULL REFERENCES dbo.cities (city_id),
    payout_per_kg                DECIMAL(9,4) NOT NULL CHECK (payout_per_kg >= 0),
    platform_fee_per_kg          DECIMAL(9,4) NOT NULL CHECK (platform_fee_per_kg >= 0),
    transfer_fee_ceiling_per_kg  DECIMAL(9,4) NOT NULL CHECK (transfer_fee_ceiling_per_kg >= 0),
    min_city_saving_per_kg       DECIMAL(9,4) NOT NULL CHECK (min_city_saving_per_kg >= 0),
    minor_contamination_share    DECIMAL(5,4) NULL                 -- TBD (FR40)
        CHECK (minor_contamination_share BETWEEN 0 AND 1),
    existing_supplier_bonus_per_kg DECIMAL(9,4) NULL,              -- TBD (FR39)
    reward_type                  VARCHAR(10)  NOT NULL DEFAULT 'cash'
        CHECK (reward_type IN ('cash', 'voucher')),                -- FR38
    effective_from               DATE         NOT NULL,
    set_by                       INT          NOT NULL REFERENCES dbo.users (user_id),
    change_reason                NVARCHAR(300) NULL,
    created_at                   DATETIME2    NOT NULL DEFAULT SYSUTCDATETIME(),
    UNIQUE (city_id, effective_from)
);

CREATE TABLE dbo.payout_thresholds (
    payout_threshold_id  INT IDENTITY PRIMARY KEY,
    city_id              INT           NOT NULL REFERENCES dbo.cities (city_id),
    supplier_type        VARCHAR(20)   NOT NULL
        CHECK (supplier_type IN ('individual_vendor', 'farmer_group', 'household')),
    amount               DECIMAL(10,2) NOT NULL DEFAULT 200 CHECK (amount > 0),
    effective_from       DATE          NOT NULL,
    set_by               INT           NOT NULL REFERENCES dbo.users (user_id),
    UNIQUE (city_id, supplier_type, effective_from)
);

CREATE TABLE dbo.funding_sources (
    funding_source_id  INT IDENTITY PRIMARY KEY,
    city_id            INT           NOT NULL REFERENCES dbo.cities (city_id),
    funding_type       VARCHAR(20)   NOT NULL
        CHECK (funding_type IN ('rate_ordinance', 'bridge_funding')),
    reference          NVARCHAR(200) NOT NULL,   -- ordinance number, grant or sponsor name
    amount             DECIMAL(12,2) NULL,
    valid_from         DATE          NOT NULL,
    valid_to           DATE          NULL,
    is_active          BIT           NOT NULL DEFAULT 1,
    created_by         INT           NOT NULL REFERENCES dbo.users (user_id),
    CHECK (valid_to IS NULL OR valid_to >= valid_from)
);
GO

/* -----------------------------------------------------------------------------
   3. Suppliers and crates
   No government ID column, by design (FR2).
   ----------------------------------------------------------------------------- */

CREATE TABLE dbo.suppliers (
    supplier_id             INT IDENTITY PRIMARY KEY,
    city_id                 INT           NOT NULL REFERENCES dbo.cities (city_id),
    supplier_code           VARCHAR(20)   NOT NULL,
    supplier_type           VARCHAR(20)   NOT NULL
        CHECK (supplier_type IN ('individual_vendor', 'farmer_group', 'household')),
    full_name               NVARCHAR(150) NOT NULL,
    market_section_id       INT           NULL REFERENCES dbo.market_sections (market_section_id),
    stall_or_farm           NVARCHAR(150) NULL,
    barangay                NVARCHAR(100) NULL,
    mobile_number           VARCHAR(20)   NOT NULL,
    payout_method           VARCHAR(10)   NOT NULL CHECK (payout_method IN ('gcash', 'bank')),
    payout_account          VARCHAR(50)   NOT NULL,
    -- NULL means "use the market section's status".
    diversion_status        VARCHAR(10)   NULL CHECK (diversion_status IN ('additional', 'existing')),
    feeds_animal_collector  BIT           NOT NULL DEFAULT 0,       -- FR9
    status                  VARCHAR(10)   NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'active', 'rejected', 'inactive')),
    application_channel     VARCHAR(10)   NOT NULL
        CHECK (application_channel IN ('staff', 'sms', 'web')),  -- FR1, FR10
    applied_at              DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    reviewed_by             INT           NULL REFERENCES dbo.users (user_id),
    reviewed_at             DATETIME2     NULL,
    rejection_reason        NVARCHAR(300) NULL,
    UNIQUE (city_id, supplier_code),
    CHECK (status <> 'rejected' OR rejection_reason IS NOT NULL),   -- FR12
    CHECK (status NOT IN ('active', 'rejected') OR reviewed_by IS NOT NULL)
);

CREATE TABLE dbo.supplier_consents (
    consent_id       INT IDENTITY PRIMARY KEY,
    supplier_id      INT          NOT NULL REFERENCES dbo.suppliers (supplier_id),
    language         VARCHAR(3)   NOT NULL CHECK (language IN ('fil', 'en')),
    consent_version  VARCHAR(20)  NOT NULL,
    recorded_by      INT          NOT NULL REFERENCES dbo.users (user_id),
    recorded_at      DATETIME2    NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE dbo.coop_members (
    coop_member_id  INT IDENTITY PRIMARY KEY,
    supplier_id     INT           NOT NULL REFERENCES dbo.suppliers (supplier_id),
    full_name       NVARCHAR(150) NOT NULL,
    is_active       BIT           NOT NULL DEFAULT 1,
    created_at      DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE dbo.crates (
    crate_id             INT IDENTITY PRIMARY KEY,
    city_id              INT          NOT NULL REFERENCES dbo.cities (city_id),
    qr_code              VARCHAR(64)  NOT NULL UNIQUE,
    tare_weight_kg       DECIMAL(6,2) NOT NULL CHECK (tare_weight_kg > 0),
    capacity_kg          DECIMAL(6,2) NULL CHECK (capacity_kg > 0),
    current_supplier_id  INT          NULL REFERENCES dbo.suppliers (supplier_id),
    status               VARCHAR(10)  NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'retired', 'lost')),
    created_at           DATETIME2    NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE dbo.crate_assignments (
    crate_assignment_id  INT IDENTITY PRIMARY KEY,
    crate_id             INT          NOT NULL REFERENCES dbo.crates (crate_id),
    supplier_id          INT          NOT NULL REFERENCES dbo.suppliers (supplier_id),
    assigned_by          INT          NOT NULL REFERENCES dbo.users (user_id),
    assigned_at          DATETIME2    NOT NULL DEFAULT SYSUTCDATETIME(),
    ended_at             DATETIME2    NULL,
    end_reason           VARCHAR(20)  NULL CHECK (end_reason IN ('reassigned', 'retired', 'lost')),
    CHECK (ended_at IS NULL OR ended_at >= assigned_at)
);
GO

/* -----------------------------------------------------------------------------
   4. Weigh-station operations
   IDs that are created on the phone are UNIQUEIDENTIFIERs, so a record uploaded
   twice hits the primary key and is stored once (FR25).
   ----------------------------------------------------------------------------- */

CREATE TABLE dbo.photos (
    photo_id      UNIQUEIDENTIFIER PRIMARY KEY,
    storage_path  VARCHAR(400)  NOT NULL,
    sha256        CHAR(64)      NOT NULL,      -- used to spot reused photos (FR58)
    taken_at      DATETIME2     NOT NULL,
    uploaded_at   DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    uploaded_by   INT           NOT NULL REFERENCES dbo.users (user_id)
);

CREATE TABLE dbo.baseline_periods (
    baseline_period_id  INT IDENTITY PRIMARY KEY,
    city_id             INT       NOT NULL REFERENCES dbo.cities (city_id),
    market_section_id   INT       NULL REFERENCES dbo.market_sections (market_section_id),
    starts_on           DATE      NOT NULL,
    ends_on             DATE      NOT NULL,
    created_by          INT       NOT NULL REFERENCES dbo.users (user_id),
    CHECK (ends_on >= starts_on)
);

CREATE TABLE dbo.dropoff_sessions (
    session_id    UNIQUEIDENTIFIER PRIMARY KEY,
    station_id    INT         NOT NULL REFERENCES dbo.stations (station_id),
    staff_id      INT         NOT NULL REFERENCES dbo.users (user_id),
    device_id     INT         NOT NULL REFERENCES dbo.devices (device_id),
    session_type  VARCHAR(10) NOT NULL CHECK (session_type IN ('single', 'batch', 'round')),
    started_at    DATETIME2   NOT NULL,
    ended_at      DATETIME2   NULL
);

CREATE TABLE dbo.delivery_manifests (
    manifest_id   UNIQUEIDENTIFIER PRIMARY KEY,
    station_id    INT           NOT NULL REFERENCES dbo.stations (station_id),
    facility_id   INT           NOT NULL REFERENCES dbo.facilities (facility_id),
    manifest_date DATE          NOT NULL,
    total_kg      DECIMAL(10,2) NOT NULL CHECK (total_kg >= 0),
    crate_count   INT           NOT NULL CHECK (crate_count >= 0),
    departed_at   DATETIME2     NOT NULL,
    created_by    INT           NOT NULL REFERENCES dbo.users (user_id),
    confirmed_by  INT           NULL REFERENCES dbo.users (user_id),
    confirmed_at  DATETIME2     NULL
);

CREATE TABLE dbo.dropoffs (
    dropoff_id           UNIQUEIDENTIFIER PRIMARY KEY,   -- generated on the phone
    session_id           UNIQUEIDENTIFIER NOT NULL REFERENCES dbo.dropoff_sessions (session_id),
    station_id           INT           NOT NULL REFERENCES dbo.stations (station_id),
    supplier_id          INT           NOT NULL REFERENCES dbo.suppliers (supplier_id),
    crate_id             INT           NULL REFERENCES dbo.crates (crate_id),
    coop_member_id       INT           NULL REFERENCES dbo.coop_members (coop_member_id),
    staff_id             INT           NOT NULL REFERENCES dbo.users (user_id),
    device_id            INT           NOT NULL REFERENCES dbo.devices (device_id),
    gross_kg             DECIMAL(7,2)  NOT NULL CHECK (gross_kg > 0),
    tare_kg              DECIMAL(6,2)  NOT NULL CHECK (tare_kg >= 0),
    net_kg               AS (gross_kg - tare_kg) PERSISTED,
    grade                VARCHAR(20)   NOT NULL
        CHECK (grade IN ('clean', 'minor_contamination', 'rejected')),
    grade_reason         VARCHAR(20)   NULL
        CHECK (grade_reason IN ('plastic', 'mixed_residual', 'spoiled_watery',
                                'sellable_produce', 'other')),
    grade_note           NVARCHAR(300) NULL,
    photo_id             UNIQUEIDENTIFIER NOT NULL REFERENCES dbo.photos (photo_id),  -- FR16
    latitude             DECIMAL(9,6)  NULL,
    longitude            DECIMAL(9,6)  NULL,
    is_baseline          BIT           NOT NULL DEFAULT 0,
    rate_setting_id      INT           NULL REFERENCES dbo.rate_settings (rate_setting_id),
    rate_per_kg_applied  DECIMAL(9,4)  NOT NULL DEFAULT 0,
    amount               DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (amount >= 0),
    manifest_id          UNIQUEIDENTIFIER NULL REFERENCES dbo.delivery_manifests (manifest_id),
    recorded_at          DATETIME2     NOT NULL,     -- time on the phone (FR28)
    synced_at            DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    CHECK (gross_kg >= tare_kg),                                   -- FR15
    CHECK (grade = 'clean' OR grade_reason IS NOT NULL),           -- FR17
    CHECK (grade <> 'rejected' OR amount = 0),
    CHECK (is_baseline = 0 OR amount = 0)                          -- FR23
);

CREATE INDEX ix_dropoffs_supplier_time ON dbo.dropoffs (supplier_id, recorded_at);
CREATE INDEX ix_dropoffs_station_time  ON dbo.dropoffs (station_id, recorded_at);
CREATE INDEX ix_photos_sha256          ON dbo.photos (sha256);

CREATE TABLE dbo.corrections (
    correction_id    INT IDENTITY PRIMARY KEY,
    dropoff_id       UNIQUEIDENTIFIER NOT NULL REFERENCES dbo.dropoffs (dropoff_id),
    field_name       VARCHAR(50)   NOT NULL,
    old_value        NVARCHAR(300) NULL,
    new_value        NVARCHAR(300) NULL,
    reason           NVARCHAR(300) NOT NULL,
    made_by          INT           NOT NULL REFERENCES dbo.users (user_id),
    made_at          DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    approval_status  VARCHAR(15)   NOT NULL DEFAULT 'not_required'
        CHECK (approval_status IN ('not_required', 'pending', 'approved', 'rejected')),  -- FR32
    approved_by      INT           NULL REFERENCES dbo.users (user_id),
    approved_at      DATETIME2     NULL,
    CHECK (approval_status NOT IN ('approved', 'rejected') OR approved_by IS NOT NULL)
);

CREATE TABLE dbo.calibration_checks (
    calibration_check_id  INT IDENTITY PRIMARY KEY,
    station_id            INT           NOT NULL REFERENCES dbo.stations (station_id),
    reference_weight_kg   DECIMAL(7,2)  NOT NULL CHECK (reference_weight_kg > 0),
    reading_kg            DECIMAL(7,2)  NOT NULL,
    passed                BIT           NOT NULL,
    checked_by            INT           NOT NULL REFERENCES dbo.users (user_id),
    checked_at            DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    notes                 NVARCHAR(300) NULL
);
GO

/* -----------------------------------------------------------------------------
   5. Payouts and the supplier ledger
   WasteLedger never holds money: payouts record instructions sent through the
   city's own account (FR45).
   ----------------------------------------------------------------------------- */

CREATE TABLE dbo.payout_batches (
    payout_batch_id    INT IDENTITY PRIMARY KEY,
    city_id            INT           NOT NULL REFERENCES dbo.cities (city_id),
    funding_source_id  INT           NOT NULL REFERENCES dbo.funding_sources (funding_source_id),  -- FR50
    status             VARCHAR(10)   NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'approved', 'released')),
    total_amount       DECIMAL(12,2) NOT NULL DEFAULT 0,
    created_by         INT           NOT NULL REFERENCES dbo.users (user_id),
    created_at         DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    approved_by        INT           NULL REFERENCES dbo.users (user_id),
    approved_at        DATETIME2     NULL,
    released_at        DATETIME2     NULL,
    CHECK (status = 'draft' OR approved_by IS NOT NULL)                -- FR44
);

CREATE TABLE dbo.payouts (
    payout_id           INT IDENTITY PRIMARY KEY,
    payout_batch_id     INT           NOT NULL REFERENCES dbo.payout_batches (payout_batch_id),
    supplier_id         INT           NOT NULL REFERENCES dbo.suppliers (supplier_id),
    amount              DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    reward_type         VARCHAR(10)   NOT NULL DEFAULT 'cash'
        CHECK (reward_type IN ('cash', 'voucher', 'compost')),        -- FR49
    payout_method       VARCHAR(10)   NOT NULL CHECK (payout_method IN ('gcash', 'bank')),
    payout_account      VARCHAR(50)   NOT NULL,   -- copied at payout time
    status              VARCHAR(10)   NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'sent', 'failed', 'returned')),  -- FR46
    provider_reference  VARCHAR(100)  NULL,
    failure_reason      NVARCHAR(300) NULL,
    sent_at             DATETIME2     NULL,
    created_at          DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE dbo.ledger_entries (
    ledger_entry_id  BIGINT IDENTITY PRIMARY KEY,
    supplier_id      INT           NOT NULL REFERENCES dbo.suppliers (supplier_id),
    entry_type       VARCHAR(10)   NOT NULL
        CHECK (entry_type IN ('credit', 'debit', 'adjustment', 'reversal')),
    amount           DECIMAL(12,2) NOT NULL,   -- positive adds to the balance, negative subtracts
    dropoff_id       UNIQUEIDENTIFIER NULL REFERENCES dbo.dropoffs (dropoff_id),
    payout_id        INT           NULL REFERENCES dbo.payouts (payout_id),
    correction_id    INT           NULL REFERENCES dbo.corrections (correction_id),
    description      NVARCHAR(200) NULL,
    created_at       DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    CHECK (entry_type <> 'credit'     OR (dropoff_id IS NOT NULL AND amount >= 0)),
    CHECK (entry_type <> 'debit'      OR (payout_id IS NOT NULL AND amount < 0)),
    CHECK (entry_type <> 'reversal'   OR (payout_id IS NOT NULL AND amount > 0)),  -- failed payout returned (FR46)
    CHECK (entry_type <> 'adjustment' OR correction_id IS NOT NULL)
);

CREATE INDEX ix_ledger_supplier ON dbo.ledger_entries (supplier_id);

CREATE TABLE dbo.sms_messages (
    sms_id              BIGINT IDENTITY PRIMARY KEY,
    supplier_id         INT           NULL REFERENCES dbo.suppliers (supplier_id),
    mobile_number       VARCHAR(20)   NOT NULL,
    message_type        VARCHAR(20)   NOT NULL
        CHECK (message_type IN ('receipt', 'payout_sent', 'monthly_summary',
                                'application_result', 'balance_reply', 'statement')),
    language            VARCHAR(3)    NOT NULL CHECK (language IN ('fil', 'en')),
    body                NVARCHAR(480) NOT NULL,
    dropoff_id          UNIQUEIDENTIFIER NULL REFERENCES dbo.dropoffs (dropoff_id),
    payout_id           INT           NULL REFERENCES dbo.payouts (payout_id),
    status              VARCHAR(10)   NOT NULL DEFAULT 'queued'
        CHECK (status IN ('queued', 'sent', 'failed')),
    provider_reference  VARCHAR(100)  NULL,
    created_at          DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    sent_at             DATETIME2     NULL
);

CREATE INDEX ix_sms_status ON dbo.sms_messages (status);
GO

/* -----------------------------------------------------------------------------
   6. Facility intake and matching
   ----------------------------------------------------------------------------- */

CREATE TABLE dbo.facility_intakes (
    intake_id     UNIQUEIDENTIFIER PRIMARY KEY,   -- drafts are saved offline first (FR56)
    facility_id   INT           NOT NULL REFERENCES dbo.facilities (facility_id),
    intake_date   DATE          NOT NULL,
    total_kg      DECIMAL(10,2) NOT NULL CHECK (total_kg >= 0),
    load_count    INT           NULL CHECK (load_count >= 0),
    notes         NVARCHAR(500) NULL,
    source        VARCHAR(15)   NOT NULL
        CHECK (source IN ('form', 'manifest', 'logbook_photo', 'excel')),  -- FR51, FR52
    manifest_id   UNIQUEIDENTIFIER NULL REFERENCES dbo.delivery_manifests (manifest_id),
    photo_id      UNIQUEIDENTIFIER NULL REFERENCES dbo.photos (photo_id),
    entered_by    INT           NOT NULL REFERENCES dbo.users (user_id),
    status        VARCHAR(10)   NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted')),
    submitted_at  DATETIME2     NULL,
    CHECK (source <> 'manifest'      OR manifest_id IS NOT NULL),
    CHECK (source <> 'logbook_photo' OR photo_id IS NOT NULL)
);

CREATE TABLE dbo.match_results (
    match_result_id    INT IDENTITY PRIMARY KEY,
    facility_id        INT           NOT NULL REFERENCES dbo.facilities (facility_id),
    match_date         DATE          NOT NULL,
    station_total_kg   DECIMAL(10,2) NOT NULL,
    facility_total_kg  DECIMAL(10,2) NOT NULL,
    difference_kg      AS (facility_total_kg - station_total_kg) PERSISTED,
    tolerance_pct      DECIMAL(5,2)  NULL,   -- copied from the city setting at match time
    within_tolerance   BIT           NULL,
    review_status      VARCHAR(10)   NOT NULL DEFAULT 'not_needed'
        CHECK (review_status IN ('not_needed', 'open', 'resolved')),   -- FR54
    reviewed_by        INT           NULL REFERENCES dbo.users (user_id),
    reviewed_at        DATETIME2     NULL,
    review_note        NVARCHAR(500) NULL,
    computed_at        DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    UNIQUE (facility_id, match_date)
);

CREATE TABLE dbo.contamination_reports (
    contamination_report_id  INT IDENTITY PRIMARY KEY,
    facility_id              INT           NOT NULL REFERENCES dbo.facilities (facility_id),
    station_id               INT           NULL REFERENCES dbo.stations (station_id),
    manifest_id              UNIQUEIDENTIFIER NULL REFERENCES dbo.delivery_manifests (manifest_id),
    report_date              DATE          NOT NULL,
    description              NVARCHAR(500) NOT NULL,
    photo_id                 UNIQUEIDENTIFIER NULL REFERENCES dbo.photos (photo_id),
    reported_by              INT           NOT NULL REFERENCES dbo.users (user_id),
    created_at               DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    CHECK (station_id IS NOT NULL OR manifest_id IS NOT NULL)            -- FR55
);
GO

/* -----------------------------------------------------------------------------
   7. Anomaly flags (rule-based checks, reviewed by a person)
   ----------------------------------------------------------------------------- */

CREATE TABLE dbo.anomaly_flags (
    flag_id        INT IDENTITY PRIMARY KEY,
    dropoff_id     UNIQUEIDENTIFIER NOT NULL REFERENCES dbo.dropoffs (dropoff_id),
    rule_code      VARCHAR(20)   NOT NULL
        CHECK (rule_code IN ('repeated_weight', 'weight_jump', 'frequent_dropoffs',
                             'missing_photo', 'duplicate_photo')),       -- FR58
    details        NVARCHAR(300) NULL,
    status         VARCHAR(10)   NOT NULL DEFAULT 'open'
        CHECK (status IN ('open', 'cleared', 'corrected', 'escalated')),  -- FR60
    reviewed_by    INT           NULL REFERENCES dbo.users (user_id),
    reviewed_at    DATETIME2     NULL,
    review_reason  NVARCHAR(300) NULL,
    created_at     DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    CHECK (status = 'open' OR (reviewed_by IS NOT NULL AND review_reason IS NOT NULL))
);

CREATE INDEX ix_flags_status ON dbo.anomaly_flags (status);
GO

/* -----------------------------------------------------------------------------
   8. Billing
   ----------------------------------------------------------------------------- */

CREATE TABLE dbo.subscription_bills (
    bill_id                INT IDENTITY PRIMARY KEY,
    city_id                INT           NOT NULL REFERENCES dbo.cities (city_id),
    billing_month          DATE          NOT NULL CHECK (DAY(billing_month) = 1),
    confirmed_extra_tons   DECIMAL(10,3) NOT NULL CHECK (confirmed_extra_tons >= 0),  -- FR57
    rate_per_ton           DECIMAL(10,2) NOT NULL DEFAULT 300,
    cap_per_ton            DECIMAL(10,2) NOT NULL,   -- 25% of hauling cost per ton
    station_count          INT           NOT NULL CHECK (station_count >= 0),
    minimum_per_station    DECIMAL(10,2) NOT NULL DEFAULT 1500,
    amount                 DECIMAL(12,2) NOT NULL CHECK (amount >= 0),
    is_waived              BIT           NOT NULL DEFAULT 0,   -- FR74
    waiver_reason          NVARCHAR(300) NULL,
    created_at             DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    UNIQUE (city_id, billing_month),
    CHECK (is_waived = 0 OR waiver_reason IS NOT NULL)
);
GO

/* -----------------------------------------------------------------------------
   9. Audit log
   ----------------------------------------------------------------------------- */

CREATE TABLE dbo.audit_logs (
    audit_log_id  BIGINT IDENTITY PRIMARY KEY,
    city_id       INT           NULL REFERENCES dbo.cities (city_id),
    user_id       INT           NULL REFERENCES dbo.users (user_id),
    action_name   VARCHAR(50)   NOT NULL,   -- sign_in, setting_change, correction, review, payout_approval
    entity_type   VARCHAR(50)   NULL,
    entity_id     VARCHAR(50)   NULL,
    before_data   NVARCHAR(MAX) NULL CHECK (before_data IS NULL OR ISJSON(before_data) = 1),
    after_data    NVARCHAR(MAX) NULL CHECK (after_data  IS NULL OR ISJSON(after_data)  = 1),
    ip_address    VARCHAR(45)   NULL,
    created_at    DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

/* -----------------------------------------------------------------------------
   10. Triggers that enforce the rules
   ----------------------------------------------------------------------------- */

-- Records can't be deleted (FR31). Corrections go in dbo.corrections instead.
CREATE OR ALTER TRIGGER dbo.trg_dropoffs_no_delete ON dbo.dropoffs INSTEAD OF DELETE AS
    THROW 50001, 'Drop-offs cannot be deleted. Record a correction instead.', 1;
GO
CREATE OR ALTER TRIGGER dbo.trg_corrections_no_delete ON dbo.corrections INSTEAD OF DELETE AS
    THROW 50002, 'Corrections cannot be deleted.', 1;
GO
CREATE OR ALTER TRIGGER dbo.trg_payouts_no_delete ON dbo.payouts INSTEAD OF DELETE AS
    THROW 50003, 'Payouts cannot be deleted.', 1;
GO

-- The ledger and the audit log are append-only (FR29, FR79).
CREATE OR ALTER TRIGGER dbo.trg_ledger_append_only ON dbo.ledger_entries INSTEAD OF UPDATE, DELETE AS
    THROW 50004, 'Ledger entries cannot be changed or deleted. Add an adjustment entry instead.', 1;
GO
CREATE OR ALTER TRIGGER dbo.trg_audit_append_only ON dbo.audit_logs INSTEAD OF UPDATE, DELETE AS
    THROW 50005, 'The audit log cannot be changed or deleted.', 1;
GO

-- Rate rule (FR37): payout + platform fee + transfer fee ceiling + minimum city
-- saving must not exceed hauling + tipping cost per kg on the effective date.
CREATE OR ALTER TRIGGER dbo.trg_rate_settings_rate_rule ON dbo.rate_settings AFTER INSERT, UPDATE AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (
        SELECT 1
        FROM inserted AS i
        OUTER APPLY (
            SELECT TOP 1 (c.hauling_cost_per_ton + c.tipping_fee_per_ton) / 1000.0 AS cost_per_kg
            FROM dbo.cost_settings AS c
            WHERE c.city_id = i.city_id AND c.effective_from <= i.effective_from
            ORDER BY c.effective_from DESC
        ) AS cost
        WHERE cost.cost_per_kg IS NULL
    )
        THROW 50010, 'No cost setting is in effect for this city on the rate''s effective date.', 1;

    IF EXISTS (
        SELECT 1
        FROM inserted AS i
        CROSS APPLY (
            SELECT TOP 1 (c.hauling_cost_per_ton + c.tipping_fee_per_ton) / 1000.0 AS cost_per_kg
            FROM dbo.cost_settings AS c
            WHERE c.city_id = i.city_id AND c.effective_from <= i.effective_from
            ORDER BY c.effective_from DESC
        ) AS cost
        WHERE i.payout_per_kg + i.platform_fee_per_kg + i.transfer_fee_ceiling_per_kg
              + i.min_city_saving_per_kg > cost.cost_per_kg
    )
        THROW 50011, 'Rate rule broken: payout + fees + minimum saving exceed the hauling cost per kg.', 1;
END;
GO

-- A supplier can only become active after consent is recorded (FR11).
-- Insert new suppliers as pending, record consent, then activate.
CREATE OR ALTER TRIGGER dbo.trg_suppliers_activation ON dbo.suppliers AFTER INSERT, UPDATE AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (
        SELECT 1
        FROM inserted AS i
        WHERE i.status = 'active'
          AND NOT EXISTS (SELECT 1 FROM dbo.supplier_consents AS sc WHERE sc.supplier_id = i.supplier_id)
    )
        THROW 50020, 'A supplier cannot be activated before their privacy consent is recorded.', 1;
END;
GO

/* -----------------------------------------------------------------------------
   11. Views
   ----------------------------------------------------------------------------- */

-- Current balance per supplier (FR29, FR43).
CREATE OR ALTER VIEW dbo.v_supplier_balances AS
SELECT
    s.supplier_id,
    s.city_id,
    s.supplier_code,
    s.full_name,
    s.supplier_type,
    COALESCE(SUM(l.amount), 0) AS balance
FROM dbo.suppliers AS s
LEFT JOIN dbo.ledger_entries AS l ON l.supplier_id = s.supplier_id
GROUP BY s.supplier_id, s.city_id, s.supplier_code, s.full_name, s.supplier_type;
GO

-- Kilos accepted per station per day, used for matching and the dashboard (FR53, FR62).
-- Days are counted in Philippine time.
CREATE OR ALTER VIEW dbo.v_daily_station_totals AS
SELECT
    d.station_id,
    CAST(SWITCHOFFSET(CAST(d.recorded_at AS DATETIMEOFFSET), '+08:00') AS DATE) AS local_date,
    COUNT(*)      AS dropoff_count,
    SUM(d.net_kg) AS accepted_kg,
    SUM(d.amount) AS amount_earned
FROM dbo.dropoffs AS d
WHERE d.grade <> 'rejected'
GROUP BY d.station_id,
         CAST(SWITCHOFFSET(CAST(d.recorded_at AS DATETIMEOFFSET), '+08:00') AS DATE);
GO
