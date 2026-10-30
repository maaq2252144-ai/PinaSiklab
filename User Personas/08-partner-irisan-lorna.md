# Persona 8 — Ma'am Lorna, Irisan Composting Facility Supervisor

> *"Mas malinis ang dating, mas mabilis ang compost. Basta huwag n'yo akong dagdagan ng papeles."* ("The cleaner it arrives, the faster the compost. Just don't add to my paperwork.")
> — illustrative

| | |
|---|---|
| **Stakeholder group** | Government / partner: Irisan Composting Facility (also black soldier fly and other processors) |
| **Role in WasteLedger** | Receives the waste; **provides intake records** for daily matching |
| **Priority** | Secondary user, but **critical for verification** |
| **Evidence base** | GSO data response, CY 2025 (Data-requested.xlsx, Questions 3 and 5); Concept Note §II-C, §IV |

## Snapshot
- **Age:** 44 · **Site:** Irisan Composting Facility, Baguio City (run by the city)
- **Scope:** **Only market waste.** Park trimmings go to CEPMO.
- **Records today:** paper logbook of deliveries; monthly Excel summary to the GSO
- **Tech:** Desktop PC at the site office with unreliable internet; Viber with the GSO

## Background: her intake in 2025 (GSO data)
| Month | Vegetable waste (t) | About t/day |
|-------|--------------------:|------------:|
| Jan | 142 | 4.6 |
| Feb | 126 | 4.5 |
| Mar | 140 | 4.5 |
| Apr | 212 | 7.1 |
| May | 210 | 6.8 |
| Jun | 266 | 8.9 |
| Jul | 208 | 6.7 |
| Aug | 130 | 4.2 |
| Sep | 248 | 8.3 |
| Oct | 272 | 8.8 |
| Nov | 256 | 8.5 |
| **Dec** | **341** | **11.0** |
| **Total** | **2,551** | **about 7.0** |

The GSO describes her **typical intake as about 5 t/day**, with **processing capacity above that**. Real intake **swings between about 4 and 11 t/day**. December already went past the 12-month target of 10 t/day for a short time, which shows the facility can handle peaks.

## Goals
- **Cleaner feedstock**, with less plastic and fewer spoiled or watery loads
- **Predictable volumes**, especially for the second-half and December peaks
- Sustain **10 t/day or more** all year, not just in December
- **Minimal extra paperwork**

## Pain points and frustrations
- No record of **who** sent contaminated loads
- Manual, delayed logbooks
- Worries that a mismatch will be blamed on her facility
- **Watery scraps** (vendors say scraps spoil within 2 days) add weight but not compost

## How she uses WasteLedger
| Need | Feature |
|------|---------|
| Log intake | **Daily intake entry**, or a photo of the logbook page or an uploaded Excel sheet |
| Match | Station totals vs. her intake; mismatches **go to the GSO for review** and are never counted against her automatically |
| Plan | **Volume forecast** from station data and last year's monthly pattern |
| Feedback | **Contamination report by source**, so stations can coach specific suppliers |
| Later | Facility tools (intake and inventory); IoT digester monitoring if a partner biodigester is built |

## Design implications
- **One screen, one form**; a logbook photo as a fallback
- **Matching tolerance** for moisture loss in transit, so small differences don't look like fraud
- A **delivery manifest** created at the station, so her intake entry is a quick confirm
- A **seasonal forecast** chart built on the 2025 monthly pattern

## Success measures
- Intake records submitted every operating day
- Station-to-Irisan match within the agreed tolerance
- Fewer contaminated loads over the pilot
