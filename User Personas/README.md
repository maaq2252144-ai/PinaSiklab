# WasteLedger PH — User Personas

**Research lenses:** [UX Researcher](../PinaSiklab/personas/ux-researcher.md) (persona structure, assumptions to validate), [Accessibility](../PinaSiklab/personas/accessibility.md) (low-literacy, outdoor, offline and shared-phone use), [Technical PM](../PinaSiklab/personas/technical-pm.md) (government stakeholders, procurement, budget steps).

## Evidence base
| Source | What it contributed |
|--------|---------------------|
| *WasteLedger PH Concept Note v6.5* | Business model, rate rule, pilot design, policy context |
| *WasteLedger PPT* | Pitch framing; vendor quote |
| **GSO data response, CY 2025** (`Docs/Data-requested.xlsx`) | Monthly residual tonnage, hauling and tipping costs, market waste, vegetable waste to Irisan, Irisan capacity, the transfer-station process |
| **Vendor interviews** (`Docs/Interviews.pdf`) | Three stalls, five vendors: Tita Imelda and Tita Mabel, Tita Marlene (three recordings), Tita Jenny and Tita Bet |

> **Validation status:** the two vendor personas are **grounded in interviews**. The government and Irisan personas are **grounded in GSO data**. The farmer and household personas remain **unvalidated** because there are no farmer or household interviews yet. Persona names and personal details are made up; quotes from real interviewees are credited to them.

## The business-to-government (B2G) model in one line
**Cities pay. Vendors, farmers and households get paid and never pay.**

```
             ┌──────────── GOVERNMENT (pays, operates, approves) ────────────┐
             │  Engr. Ramon – GSO (buyer, dashboard owner)                   │
             │  Councilor Grace – City Council (rate ordinance, budget)      │
             │  Kuya Jun – Weigh-station staff (daily app user)              │
             │  Ma'am Lorna – Irisan Composting Facility (intake matching)   │
             └──────────────────────────────┬────────────────────────────────┘
                                            │ ₱0.60/kg via GCash, from the city's own account
             ┌──────────────────────────────┴────────────────────────────────┐
             │                 SUPPLIERS / PUBLIC (paid, never pay)          │
             │  Ate Nena – High-volume vegetable vendor                      │
             │  Tita Luz – Small-stall vendor (no storage)                   │
             │  Manong Ben – Benguet farmer co-op leader                     │
             │  Carla – Baguio household resident                            │
             └───────────────────────────────────────────────────────────────┘
```

## Persona index
| # | Persona | Stakeholder group | Role | Priority |
|---|---------|-------------------|------|----------|
| 1 | [Ate Nena — High-Volume Vegetable Vendor](01-vendor-ate-nena.md) | Market vendors | Supplier (10–15 kg/day) | **Primary** |
| 2 | [Tita Luz — Small-Stall Vendor](02-vendor-tita-luz.md) | Market vendors | Supplier (3–5 kg/day) | **Primary** |
| 3 | [Manong Ben — Farmer Co-op Leader](03-farmer-manong-ben.md) | Benguet farmers | Supplier (group) | **Primary** |
| 4 | [Carla — Household Resident](04-household-carla.md) | General public / households | Supplier and taxpayer-beneficiary | Secondary |
| 5 | [Engr. Ramon — GSO Solid Waste Head](05-gov-gso-engr-ramon.md) | Government (LGU) | **Paying customer**, dashboard owner | **Primary (buyer)** |
| 6 | [Kuya Jun — Weigh-Station Staff](06-gov-station-staff-kuya-jun.md) | Government (LGU) | Daily app operator | **Primary (user)** |
| 7 | [Councilor Grace — City Council](07-gov-councilor-grace.md) | Government (LGU) | Rate ordinance and budget line | Key decision-maker |
| 8 | [Ma'am Lorna — Irisan Facility Supervisor](08-partner-irisan-lorna.md) | Government / partner | Intake records for matching | Secondary |

## Key findings from the new data

**From the vendor interviews**
| Finding | Evidence | Persona impact |
|---------|----------|----------------|
| **Everyone has GCash** | All three stalls | GCash is the default payout channel |
| **Everyone is willing** | *"Gustong-gusto namin"* ("We'd love to"); *"Oo naman, walang problema"* ("Of course, no problem"); *"Why not?"* | Willingness isn't the barrier; convenience and trust are |
| **Volumes are lower than assumed** | 10–15 kg/day (large vegetable stall); 3–5 kg/day (small stall); concept note assumed 20 kg | Payout is about ₱156–234 a month for large stalls and ₱47–78 for small ones, not ₱300 |
| **Free animal-feed collectors already exist** | *Ubak* collectors take scraps daily for ducks and rabbits, without paying | Don't push out a reuse that is better than composting; pay only for newly diverted waste |
| **No storage; scraps spoil in 1–2 days** | Tita Marlene | Daily drop-off or pickup schedule; grade spoiled or watery loads |
| **The public wants the government to lead and provide bins** | Tita Marlene | City-provided crates; a strong case for B2G |
| **Distrust from a failed barangay composting project** | Tita Imelda | Show where the waste goes; prove the program is active |
| **Rain disrupts collection** | Tita Imelda | Covered station; offline app |

**From the GSO data (CY 2025)**
| Finding | Persona impact |
|---------|----------------|
| Hauling cost dropped from ₱1,604 to ₱897/t (March); tipping fee from ₱632 to ₱550/t (June). Cost per kg went from **₱2.24 to ₱1.45** | GSO and Council need **editable cost settings** and a rate rule that adjusts automatically |
| Irisan vegetable intake ranges from **about 4 to 11 t/day**, peaking in December (341 t) | Seasonal staffing and forecasting for station staff and Irisan |
| Irisan handles **market waste only**; capacity is above its typical 5 t/day | Confirms spare capacity; CEPMO handles park waste |
| Residual waste leaves the transfer station **within 24 hours** by an accredited private hauler | Shows the public that unsorted waste goes straight to the landfill |

## Shared needs across personas
| Theme | Applies to | Design response |
|-------|------------|-----------------|
| Trust in the weight, the payout and the program | Vendors, households, Council | Weight, photo and grade at every drop-off; "where your waste went" impact messages |
| Convenience over cash | Small stalls, households | Fixed schedules, city-provided containers, no travel |
| Small amounts still count | All suppliers | **The balance carries over and never expires**; payout to GCash at ₱200 |
| Weak signal and rain | Station staff | Offline-first app; covered station |
| Public money must hold up to audit | GSO, Council, COA | Records can't be deleted, logged edits, matching with Irisan |
| Unstable costs | GSO, Council | Rate-rule engine with dated cost settings |

## Still to validate
1. Is ₱0.60/kg enough at the **real** volumes, or is convenience the bigger driver?
2. How should WasteLedger treat vendors whose scraps already go to animal-feed collectors?
3. Should low-volume suppliers have a **lower payout threshold** than ₱200?
4. Farmers (10 interviews planned) and households (none yet)
5. How much food waste is **still** in the market garbage (the unpaid baseline weeks)?
