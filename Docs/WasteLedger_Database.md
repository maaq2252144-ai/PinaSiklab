# WasteLedger PH — Database

The schema is in [WasteLedger_Schema.sql](WasteLedger_Schema.sql). It's written for Microsoft SQL Server and has **32 tables, 7 triggers and 2 views**, in nine groups.

## How the tables connect

```
cities ─┬─ stations ── devices
        ├─ market_sections
        ├─ facilities
        ├─ users
        ├─ cost_settings, rate_settings, payout_thresholds, funding_sources
        └─ suppliers ─┬─ supplier_consents
                      ├─ coop_members
                      ├─ crates ── crate_assignments
                      └─ ledger_entries

dropoff_sessions ── dropoffs ─┬─ photos
                              ├─ corrections
                              ├─ anomaly_flags
                              └─ delivery_manifests ── facility_intakes
                                                     └─ match_results

payout_batches ── payouts ── ledger_entries, sms_messages
```

**One drop-off, end to end:**
1. Staff scan a **crate**, which belongs to a **supplier**.
2. They save a **dropoff** with a **photo**, inside a **dropoff_session**.
3. The amount comes from the **rate_settings** in effect at that time, and a credit is added to **ledger_entries**.
4. The supplier gets a receipt through **sms_messages**.
5. The rule-based checks may raise an **anomaly_flag** for a person to review.
6. The crate goes to the facility on a **delivery_manifest**. The facility records a **facility_intake**, and the day's totals are compared in **match_results**.
7. Once the supplier's balance reaches the **payout_threshold**, they're added to a **payout_batch**. When the city approves it, a **payout** is sent from the city's account and a debit is added to the ledger.

---

## 1. Cities, stations, facilities and users

| Table | What it's for | Key columns |
|-------|---------------|-------------|
| **cities** | One row per city using WasteLedger. Each city's data and settings are kept apart (FR77). | `payout_channel` (Xendit, GCash or Landbank); `match_tolerance_pct` (TBD); `subscription_waived_until` |
| **stations** | Weigh stations, such as the Baguio public market station. | `city_id`, `name`, `is_active` |
| **market_sections** | Sections of the market. Each is tagged as *additional* (its food waste still went to the landfill during the baseline weeks) or *existing* (it already went to Irisan), which decides the rate (FR8). | `diversion_status` |
| **facilities** | Where the waste goes: composting, black soldier fly or biodigester. | `facility_type` |
| **users** | Everyone who signs in: station staff, supervisors, city admins, council viewers, facility staff, auditors and platform admins (FR76). Suppliers aren't users; they're in `suppliers`. | `role`, `city_id`, `station_id`, `facility_id` |
| **devices** | Station phones, so each drop-off shows which phone recorded it (FR20). | `device_identifier`, `last_synced_at` |

## 2. Cost and rate settings

All four tables are **versioned by effective date**. A change adds a new row instead of overwriting the old one, so past drop-offs and savings stay correct (FR36, FR41).

| Table | What it's for | Key columns |
|-------|---------------|-------------|
| **cost_settings** | The city's hauling cost and tipping fee per ton (Baguio: ₱896.62 + ₱550.00). | `hauling_cost_per_ton`, `tipping_fee_per_ton`, `effective_from` |
| **rate_settings** | What suppliers are paid and the fees in the rate rule. A trigger rejects any rate that breaks the rule (FR37). | `payout_per_kg`, `platform_fee_per_kg`, `transfer_fee_ceiling_per_kg`, `min_city_saving_per_kg`, `minor_contamination_share` (TBD), `existing_supplier_bonus_per_kg` (TBD), `reward_type` |
| **payout_thresholds** | The balance at which a supplier is due a payout, per supplier type (FR43). | `supplier_type`, `amount` (default ₱200) |
| **funding_sources** | Where payout money comes from: a rate ordinance and budget line, or bridge funding. A payout batch can't be created without one (FR50). | `funding_type`, `reference`, `valid_from`, `valid_to` |

## 3. Suppliers and crates

| Table | What it's for | Key columns |
|-------|---------------|-------------|
| **suppliers** | Vendors, farmer groups/co-ops and households. Covers both staff registration and self-application: a supplier starts as *pending* and earns nothing until staff activate them (FR1, FR10–FR12). **There is no government ID column** (FR2). | `supplier_type`, `status` (pending, active, rejected, inactive), `application_channel` (staff, SMS, web), `diversion_status`, `payout_method`, `payout_account`, `rejection_reason` |
| **supplier_consents** | The privacy consent record: language, version, who recorded it and when. A trigger blocks activating a supplier who has no consent (FR3, FR11). | `language`, `consent_version`, `recorded_by` |
| **coop_members** | Optional member list for a farmer group, so drop-offs can be credited to members (FR7). | `supplier_id`, `full_name` |
| **crates** | Each QR-tagged crate and its empty weight, which is subtracted automatically (FR5). | `qr_code`, `tare_weight_kg`, `capacity_kg`, `current_supplier_id`, `status` |
| **crate_assignments** | History of who each crate belonged to, and why that ended: reassigned, retired or lost (FR6). | `assigned_at`, `ended_at`, `end_reason` |

## 4. Weigh-station operations

Records created on the phone (drop-offs, sessions, photos, manifests) use an ID **generated on the phone**. If a weak signal makes the phone upload the same record twice, the second copy hits the same ID and is refused, so it counts once (FR25).

| Table | What it's for | Key columns |
|-------|---------------|-------------|
| **dropoffs** | The core table: one row per weighed crate (FR13–FR20). | `gross_kg`, `tare_kg`, `net_kg` (calculated automatically), `grade` (clean, minor contamination, rejected), `grade_reason`, `photo_id` (required), `is_baseline`, `rate_per_kg_applied`, `amount`, `recorded_at` (time on the phone), `synced_at` |
| **dropoff_sessions** | Groups drop-offs logged together: a single crate, a co-op's batch, or a stall-row round (FR18). | `session_type` (single, batch, round) |
| **photos** | Every photo: the scale-and-QR photo for each drop-off, logbook photos and contamination photos. The file fingerprint (`sha256`) is used to spot a photo reused for a second drop-off (FR58). | `storage_path`, `sha256`, `taken_at` |
| **corrections** | Every change to a drop-off, with old value, new value, reason, who and when. Changes above a set threshold wait for supervisor approval (FR31, FR32). | `field_name`, `old_value`, `new_value`, `reason`, `approval_status` |
| **baseline_periods** | The unpaid baseline weeks, for the whole city or one market section. Drop-offs in these weeks are weighed but earn nothing (FR23). | `starts_on`, `ends_on`, `market_section_id` |
| **delivery_manifests** | One row per trip from a station to a facility, for the facility to confirm (FR22). | `total_kg`, `crate_count`, `departed_at`, `confirmed_by` |
| **calibration_checks** | The weekly check of the station scale against the Timbangan ng Bayan scale (FR21). | `reference_weight_kg`, `reading_kg`, `passed` |

## 5. Payouts and the supplier ledger

WasteLedger never holds money. These tables record **what the city owes** and **the payout instructions** sent through the city's own account (FR45).

| Table | What it's for | Key columns |
|-------|---------------|-------------|
| **ledger_entries** | Every change to a supplier's balance: a *credit* for a drop-off, a *debit* for a payout, an *adjustment* for a correction, or a *reversal* when a failed payout goes back to the balance. The balance is the sum of the entries. Entries can't be changed or deleted (FR29, FR46). | `entry_type`, `amount` (positive adds, negative subtracts), `dropoff_id`, `payout_id`, `correction_id` |
| **payout_batches** | A payout list waiting for approval. It can't be marked approved without an approver (FR43, FR44). | `status` (draft, approved, released), `funding_source_id`, `approved_by` |
| **payouts** | One payment to one supplier in a batch. The payout account is copied at payout time, so a later change of GCash number doesn't change history (FR46, FR48, FR49). | `amount`, `reward_type` (cash, voucher, compost), `status` (pending, sent, failed, returned), `provider_reference` |
| **sms_messages** | Every text sent: receipts, payout notices, monthly summaries, application results, balance replies and statements (FR12, FR19, FR33–FR35, FR47). | `message_type`, `language`, `body`, `status` |

## 6. Facility intake and matching

| Table | What it's for | Key columns |
|-------|---------------|-------------|
| **facility_intakes** | What the facility says it received, entered on the form, by confirming a manifest, as a logbook photo or as an Excel upload. Drafts are saved first and submitted when online (FR51, FR52, FR56). | `intake_date`, `total_kg`, `source`, `status` (draft, submitted) |
| **match_results** | One row per facility per day comparing station totals with facility intake. Results outside the tolerance go to GSO review and are never counted against anyone automatically (FR53, FR54, FR64). | `station_total_kg`, `facility_total_kg`, `difference_kg` (calculated), `within_tolerance`, `review_status` |
| **contamination_reports** | Contamination the facility finds, linked to a station or manifest so staff can coach suppliers (FR55, FR69). | `description`, `photo_id`, `station_id`, `manifest_id` |

## 7. Anomaly flags

| Table | What it's for | Key columns |
|-------|---------------|-------------|
| **anomaly_flags** | Drop-offs caught by the rule-based checks, waiting for a person. A flag can't be closed without a reviewer and a reason, and it never holds back pay by itself (FR58–FR60). | `rule_code` (repeated weight, weight jump, frequent drop-offs, missing photo, duplicate photo), `status` (open, cleared, corrected, escalated), `review_reason` |

## 8. Billing

| Table | What it's for | Key columns |
|-------|---------------|-------------|
| **subscription_bills** | The monthly bill to the city: ₱300 per extra ton the facility confirms, capped at 25% of the hauling cost per ton, with a minimum of ₱1,500 per station. It can be waived, for example during the pilot (FR73–FR75). | `billing_month`, `confirmed_extra_tons`, `cap_per_ton`, `station_count`, `amount`, `is_waived` |

## 9. Audit log

| Table | What it's for | Key columns |
|-------|---------------|-------------|
| **audit_logs** | Every sign-in, setting change, correction, review decision and payout approval, with the data before and after. It can't be changed or deleted (FR79). | `action_name`, `entity_type`, `entity_id`, `before_data`, `after_data`, `user_id` |

---

## Rules the database enforces itself

These are enforced in the database, so a bug in the app can't get around them.

| Rule | How |
|------|-----|
| Drop-offs, corrections and payouts can't be deleted | Triggers refuse the delete |
| Ledger entries and the audit log can't be edited or deleted | Triggers refuse the update or delete |
| The rate rule: payout + fees + minimum saving ≤ hauling cost per kg | Trigger on `rate_settings` checks against the cost in effect on that date |
| No rate without a cost setting in effect | Same trigger |
| A supplier can't be activated before consent is recorded | Trigger on `suppliers` |
| A rejected application needs a reason | Check on `suppliers` |
| Every drop-off has a photo | `photo_id` is required |
| A downgraded or rejected load needs a reason | Check on `dropoffs` |
| The weight can't be less than the empty crate | Check on `dropoffs` |
| Rejected loads and baseline-week loads earn ₱0 | Checks on `dropoffs` |
| A duplicate upload is stored once | Phone-generated ID is the primary key |
| A payout batch needs a funding source, and an approver before it's approved | Required column and check on `payout_batches` |
| A flag can't be closed without a reviewer and a reason | Check on `anomaly_flags` |

## Views

| View | What it shows |
|------|---------------|
| **v_supplier_balances** | Each supplier's current balance, the sum of their ledger entries. Used for the payout list and balance replies. |
| **v_daily_station_totals** | Accepted kilos, drop-off count and amount earned per station per day, in Philippine time. Used for matching and the dashboard. |
