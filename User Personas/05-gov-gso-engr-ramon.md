# Persona 5 — Engr. Ramon, GSO Solid Waste Division Head (Paying Customer)

> *"Hindi ako bibili ng sistema na hindi ko maipapaliwanag sa COA."* ("I won't buy a system I can't explain to the Commission on Audit.")
> — illustrative

| | |
|---|---|
| **Stakeholder group** | Government: Baguio City General Services Office (GSO), with CEPMO and market administration |
| **Role in WasteLedger** | **Paying customer** (business-to-government subscription), dashboard owner, payout approver |
| **Priority** | **Primary (buyer)** |
| **Evidence base** | GSO data response, CY 2025 (Data-requested.xlsx); Concept Note §I, §VII, §IX |

## Snapshot
- **Age:** 46 · **Office:** GSO, Baguio City Hall
- **Responsibilities:** The hauling contract with an accredited private hauler, the Marcos Highway transfer station, coordination with Irisan, RA 9003 self-compliance reports
- **Tech:** Excel, email and Viber group chats; prefers printable reports
- **Reports to:** City Administrator and the Mayor; gets questions from the City Council and COA

## Background: what his own data shows (GSO, CY 2025)
| Item | 2025 figure |
|------|-------------|
| Residual waste hauled to Urdaneta | **80,472 t** (5,480 t in Feb to **7,863 t in Jul**) |
| Hauling cost per ton | **₱1,604.13** (Jan–Feb), then **₱896.62** (Mar–Dec) |
| Tipping fee per ton | **₱632** (Jan–May), then **₱550** (Jun–Dec) |
| Combined cost per kg | **₱2.24** in Jan–Feb, ₱1.53 in Mar–May, **₱1.45** from Jun |
| Public market waste | **15,511 t** (about 1,157–1,401 t a month) |
| Market vegetable waste sent to Irisan | **2,551 t** (126 t in Feb to **341 t in Dec**) |

Residual waste leaves the transfer station **within 24 hours**. Market biodegradable waste already goes to Irisan, and park trimmings are CEPMO's responsibility. **His disposal cost dropped by about 35% within one year**, and the Urdaneta landfill is on the DENR's imminent-danger list. He knows the next change could just as easily be a big increase.

## Goals
- **Cut cost per ton in a way he can measure,** and protect the city against the next price jump
- **Verified diversion data** for RA 9003 reports and the **DILG Seal of Good Local Governance**
- Hit the city's **20% reduction** target and show progress on the Open Government Partnership (OGP) commitment
- No procurement or audit problems

## Pain points and frustrations
- **Unstable unit costs.** A pricing model fixed to one hauling rate would have been wrong twice in 2025.
- **No data at the vendor level.** Nobody weighs the vendor handoff or checks it against Irisan.
- **Audit risk.** Paying citizens needs a **rate ordinance, a budget line** and proof for every peso.
- **Budget timing.** The 2027 budget is already submitted.
- **Staff limits.** He would reassign utility workers rather than hire.
- **Doubt.** "Market food waste already goes to Irisan. How much is really left?"

## How he uses WasteLedger
| Need | Feature |
|------|---------|
| See value | **City dashboard:** kilos diverted, active suppliers, payouts, **money saved** compared with hauling |
| Track cost changes | **Hauling and tipping cost inputs he can update** each time the contract changes; the **rate-rule engine** then recalculates the payout so the city always saves at least ₱0.20/kg |
| Approve payouts | **Payout list** run through the **city's own GCash/Xendit or Landbank account**. WasteLedger never holds the money |
| Defend spending | Photo proof for every load, records that can't be deleted, logged edits, AI flags reviewed by staff |
| Report | Data in the RA 9003 self-compliance report (SCMAR) format and for the DILG Seal |
| Plan | **Seasonal view:** market vegetable waste peaks toward December (341 t) |
| Verify | **Daily match** of station totals against Irisan intake |

## Buying journey (from the Technical PM lens)
1. **Letter of interest** (no cost to the city)
2. **MOA** for station space, Irisan intake data and data access
3. **Pilot on bridge funding** (about ₱26,000 for payouts; subscription waived)
4. **Procurement:** direct acquisition (up to ₱200,000) or small value procurement under RA 12009
5. **Subscription:** ₱300 per extra ton confirmed by Irisan, capped at 25% of the hauling cost per ton; at least ₱1,500 per station per month

## Design implications
- **Answers "how much did we save?" in under 5 minutes**, with a one-page PDF for the Mayor and Council
- **Cost settings with history:** every rate change has an effective date, so past savings stay correct
- **Scenario view:** what payouts and savings look like if costs go back to ₱2.24/kg, or drop further
- Excel/CSV export in the SCMAR format; role-based access for GSO, CEPMO, market administration and a read-only auditor

## Success measures
- Cost per diverted kg, **including staff**, stays below the current hauling cost
- Station totals match Irisan intake
- The data is used in at least one compliance report

## Objections to prepare for
- **"What if hauling costs drop again?"** The rate rule lowers the payout or switches to vouchers. 2025 already showed a 35% drop, and the model still saved money.
- **"What about padded loads?"** Sealed scales, photos, weekly caps, matching with Irisan and staff review.
- **"Who owns the data?"** The city. The team registers with the National Privacy Commission.
