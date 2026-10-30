# WasteLedger PH — Requirements

## Functional Requirements

### Supplier Registration

| ID | Functional Requirement |
|----|------------------------|
| FR1 | The system shall allow station staff and city admins to register a supplier as an Individual Vendor, Farmer Group/Co-op, or Household, with a name, market section or stall, mobile number, and payout account (GCash number or bank account). |
| FR2 | The system shall not collect government ID numbers from suppliers. |
| FR3 | The system shall record each supplier's privacy consent, shown in Filipino and English, with the date and the staff member who recorded it. |
| FR4 | The system shall assign each supplier a unique supplier ID and generate a printable ID card with a QR code. |
| FR5 | The system shall allow staff to link one or more QR-tagged crates to a supplier and store each crate's empty (tare) weight. |
| FR6 | The system shall allow staff to reassign, retire, or report a crate as lost while keeping its history. |
| FR7 | The system shall allow a Farmer Group/Co-op to hold several crates and an optional member list so that drop-offs can be attributed to members. |
| FR8 | The system shall allow staff to tag each supplier or market section as additional (food waste still went out with the garbage during the baseline weeks) or existing (food waste already went to Irisan). |
| FR9 | The system shall allow staff to flag suppliers whose scraps already go to animal-feed (*ubak*) collectors. **[TBD: policy]** |
| FR10 | The system shall allow suppliers to apply to join by SMS or a web form with their name, stall or farm, mobile number, and payout account, and shall save the application as pending, earning nothing. |
| FR11 | The system shall allow station staff to activate a pending application only after confirming the details in person, recording consent, setting the additional/existing tag, and issuing the crate and ID card. |
| FR12 | The system shall allow staff to reject an application with a reason and shall notify the applicant of approval or rejection by SMS. |


### Weigh Station

| ID | Functional Requirement |
|----|------------------------|
| FR13 | The system shall allow station staff to identify a supplier by scanning the crate's QR code or the supplier ID card, or by searching by name or ID. |
| FR14 | The system shall allow staff to enter the gross weight on a numeric keypad and shall subtract the crate's tare weight automatically to show the net weight. |
| FR15 | The system shall warn staff of impossible or unlikely weights, such as a negative net weight or a weight above the crate's capacity, before saving. |
| FR16 | The system shall require one photo showing the scale display and the crate's QR code in the same frame before a drop-off can be saved. |
| FR17 | The system shall allow staff to grade each drop-off as Clean, Minor Contamination, or Rejected, and shall require a reason from a picture-based list (plastic, mixed residual, spoiled/watery, sellable produce, other) for any downgrade or rejection. |
| FR18 | The system shall allow staff to log several crates from one supplier, or several small suppliers on a stall-row round, in one batch session. |
| FR19 | The system shall send the supplier an SMS receipt with the net weight, grade, amount earned, and current balance after each drop-off. |
| FR20 | The system shall record the station, staff member, device, timestamp, and GPS location (if available) for each drop-off. |
| FR21 | The system shall allow staff to log the weekly calibration check of the station scale against the market's Timbangan ng Bayan scale, with the reference weight, reading, and pass/fail result. |
| FR22 | The system shall generate a delivery manifest for each trip to the composting facility, with the total kg, crate count, and time out, for the facility to confirm. |
| FR23 | The system shall allow supervisors to run unpaid baseline weeks in which drop-offs are weighed and recorded without payouts. |


### Offline Sync

| ID | Functional Requirement |
|----|------------------------|
| FR24 | The system shall save every drop-off, including its photo, on the phone first and upload it when a connection is available, so the station app is fully usable offline. |
| FR25 | The system shall give every record a unique ID generated on the phone, so a record uploaded twice is counted once. |
| FR26 | The system shall show an online/offline indicator and the number of records waiting to upload. |
| FR27 | The system shall cache supplier lists, crate tare weights, and current rates on the phone so scanning and grading work offline. |
| FR28 | The system shall calculate each drop-off's amount using the rate in effect at the time of the drop-off, not the time of upload. |


### Ledger and Balances

| ID | Functional Requirement |
|----|------------------------|
| FR29 | The system shall keep a ledger for each supplier of credits (drop-offs), debits (payouts), and adjustments, with a running balance. |
| FR30 | The system shall carry each supplier's unpaid balance over until it is paid out. |
| FR31 | The system shall not allow records to be deleted, and shall save every correction as a new linked entry with the old value, new value, who made it, when, and why. |
| FR32 | The system shall require supervisor approval for corrections by station staff above a set threshold. |
| FR33 | The system shall send suppliers a monthly SMS summary of kilos dropped off, amount earned, balance, and an impact line. |
| FR34 | The system shall provide each Farmer Group/Co-op a monthly statement with a breakdown per drop-off (and per member, if a member list exists) by SMS and as a printable PDF. |
| FR35 | The system shall allow suppliers to check their balance by SMS keyword. |


### Rates and Cost Settings

| ID | Functional Requirement |
|----|------------------------|
| FR36 | The system shall allow city admins to enter the hauling cost per ton and tipping fee per ton, each with an effective date, and shall keep past values. |
| FR37 | The system shall enforce the rate rule: payout + platform fee + transfer fee ceiling + minimum city saving must not exceed the hauling + tipping cost per kg (Baguio defaults: ₱0.60 + ₱0.30 + ₱0.13 + ₱0.20 ≤ ₱1.45), with each component configurable per city. |
| FR38 | The system shall lower the payout to the highest value that satisfies the rate rule when the proposed payout breaks it, alert the city admin, and allow the admin to switch to vouchers instead. |
| FR39 | The system shall pay the full rate for clean waste from additional suppliers and only a quality bonus for waste from existing suppliers. **[TBD: bonus amount]** |
| FR40 | The system shall pay a reduced rate for Minor Contamination loads **[TBD: rate]** and nothing for Rejected loads. |
| FR41 | The system shall version every rate and threshold change with its effective date and the user who made it. |
| FR42 | The system shall allow city admins and council users to view payouts and city savings under different hauling costs and food-waste shares. |


### Payouts

| ID | Functional Requirement |
|----|------------------------|
| FR43 | The system shall generate a payout list of suppliers whose balance has reached the payout threshold (₱200 by default, configurable per supplier type). |
| FR44 | The system shall require a city admin to review and approve each payout list before it is released. |
| FR45 | The system shall send payouts from the city's own Xendit/GCash or Landbank account, by API or an exported disbursement file, and shall never receive or hold the funds. |
| FR46 | The system shall record each payout's status (pending, sent, failed, returned) and shall return failed payouts to the supplier's balance. |
| FR47 | The system shall notify suppliers by SMS when a payout is sent. |
| FR48 | The system shall pay each Farmer Group/Co-op as one account. |
| FR49 | The system shall allow non-cash rewards, such as sponsor vouchers or compost from the facility, at a set conversion rate. |
| FR50 | The system shall block payouts, with a clear message, when the city has no active funding source (rate ordinance and budget line, or bridge funding) configured. |


### Facility Intake and Matching

| ID | Functional Requirement |
|----|------------------------|
| FR51 | The system shall allow facility staff to enter daily intake on one form with the date, total kg, number of loads, and notes. |
| FR52 | The system shall allow facility staff to confirm a station's delivery manifest, upload a photo of the logbook page, or upload an Excel sheet instead of filling in the form. |
| FR53 | The system shall compare each day's station totals against facility intake within a configurable tolerance for moisture loss. **[TBD: tolerance]** |
| FR54 | The system shall send mismatches outside the tolerance to a GSO review queue and shall not count them against the facility or a supplier automatically. |
| FR55 | The system shall allow facility staff to record contamination found at intake, linked to a manifest or station. |
| FR56 | The system shall save facility intake drafts locally and submit them when a connection is available. |
| FR57 | The system shall record the extra tons from additional suppliers confirmed by the facility as the basis for billing. |


### Anomaly Flags

| ID | Functional Requirement |
|----|------------------------|
| FR58 | The system shall flag unusual drop-offs, such as repeated identical weights, sudden jumps against the supplier's history, frequent drop-offs close together, and missing or duplicated photos. |
| FR59 | The system shall send flags to a review queue for supervisors or the GSO and shall never withhold pay automatically. |
| FR60 | The system shall log each review decision (cleared, corrected, escalated) with the reviewer and a reason. |
| FR61 | The system shall improve its flags with a model trained on pilot data, with every flag still reviewed by a person. (Later phase) |


### Dashboard and Reports

| ID | Functional Requirement |
|----|------------------------|
| FR62 | The system shall show city admins a dashboard of kilos diverted, active suppliers, weekly active rate, rejection rate, payouts made, and money saved compared with hauling, by day, week, and month. |
| FR63 | The system shall allow dashboard users to filter by station, market section, supplier type, and date range. |
| FR64 | The system shall show the station-to-facility match status for each day. |
| FR65 | The system shall show a seasonal view comparing current volumes with the previous year's monthly pattern. |
| FR66 | The system shall generate a one-page executive summary PDF of tons diverted, money saved, active stations, and payouts this month. |
| FR67 | The system shall export data to Excel/CSV, including layouts that fit the RA 9003 self-compliance report (SCMAR) and DILG Seal submissions. |
| FR68 | The system shall forecast facility intake volumes from station data and the previous year's pattern. |
| FR69 | The system shall report contamination by station, market section, and supplier. |


### Public Transparency Page

| ID | Functional Requirement |
|----|------------------------|
| FR70 | The system shall provide a public page showing program totals (tons diverted, money saved, active stations, and payouts made this month) without exposing suppliers' personal data. |
| FR71 | The system shall show a "where your waste goes" explainer on the public page (station → facility → compost). |
| FR72 | The system shall show public totals by barangay. (Phase 2) |


### Billing

| ID | Functional Requirement |
|----|------------------------|
| FR73 | The system shall compute the monthly city subscription at ₱300 per extra ton confirmed by the facility, capped at 25% of the city's hauling cost per ton, with a minimum of ₱1,500 per station per month. |
| FR74 | The system shall allow the subscription to be waived for a set period. |
| FR75 | The system shall generate a monthly billing statement for the city's procurement and payment documents. |


### Administration

| ID | Functional Requirement |
|----|------------------------|
| FR76 | The system shall provide role-based access for Suppliers, Station Staff, Station Supervisors, City Admins, Council/Executive users, Facility Staff, Auditors, and Platform Admins, with Auditors and Council/Executive users limited to read-only access. |
| FR77 | The system shall keep each city as a separate tenant with its own costs, rates, thresholds, stations, facilities, and payout account. |
| FR78 | The system shall allow admins to add and deactivate stations, facilities, staff accounts, and station phones without losing history. |
| FR79 | The system shall write every sign-in, setting change, correction, review decision, and payout approval to an audit log that cannot be edited. |


### Household Suppliers (Phase 2)

| ID | Functional Requirement |
|----|------------------------|
| FR80 | The system shall allow households to register at barangay drop points or self-register on mobile web with consent. (Phase 2) |
| FR81 | The system shall allow barangay weigh points to use the same station app. (Phase 2) |
| FR82 | The system shall allow households to receive rewards as GCash, vouchers, or a credit against the monthly garbage fee. (Phase 2) **[TBD]** |


### Later Extensions

| ID | Functional Requirement |
|----|------------------------|
| FR83 | The system shall export verified diversion records in a form that can support carbon credits. (Later phase) |
| FR84 | The system shall monitor a partner biodigester's feed and gas output through IoT sensors, using the same records. (Later phase) |
| FR85 | The system shall provide intake and inventory tools for composting and black soldier fly partners. (Later phase) |

## Non-Functional Requirements

| ID | Non-Functional Requirement |
|----|----------------------------|
| NFR1 | The system shall let station staff complete a drop-off (scan, weigh, photo, grade, save) in 30 seconds or less on average. |
| NFR2 | The station app shall work with no connection for at least a full operating day and store at least 1,000 drop-offs with photos locally. |
| NFR3 | The system shall not lose or duplicate any record during sync. |
| NFR4 | The station app shall use large touch targets that work with gloves and wet hands, three large grade buttons with color and icon, and a numeric keypad only for weights. |
| NFR5 | The system shall support Filipino and English in the station app, consent text, and SMS. |
| NFR6 | The system shall deliver supplier receipts by SMS so they work on any phone, and shall not show meaning by color alone. |
| NFR7 | The station app shall run on low- to mid-range Android phones (minimum version **[TBD]**), and facility and dashboard screens shall work in a desktop browser. |
| NFR8 | The system shall let a city admin find the city's total savings in under 5 minutes. |
| NFR9 | The system shall comply with the Data Privacy Act of 2012 through consent, minimum data collection, no government ID numbers, and no personal data on public pages. |
| NFR10 | The system shall let the city, as owner of its data, export all of it. |
| NFR11 | The system shall encrypt data in transit and at rest, enforce role-based access, allow payout approval only by an authorized city user, and store photos securely linked to their records. |
| NFR12 | The system shall make every record, correction, and payout traceable to a person, device, and time. |
| NFR13 | The system shall keep city-specific values (costs, rates, facilities, payout channel) as settings, not code. |
| NFR14 | The dashboard and sync service shall be available during market hours (about 4:00 AM–8:00 PM). |
| NFR15 | The system's hosting shall fit the pilot budget of ₱3,000–₱7,500 for three months. |
