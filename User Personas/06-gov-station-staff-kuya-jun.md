# Persona 6 — Kuya Jun, Weigh-Station Staff (Market or GSO Utility Worker)

> *"Basta mabilis lang at hindi nagha-hang — kasi pila na 'yung mga tindera."* ("As long as it's fast and doesn't freeze, because the vendors are already lining up.")
> — illustrative

| | |
|---|---|
| **Stakeholder group** | Government: market or GSO utility worker assigned to the weigh station |
| **Role in WasteLedger** | **Main daily user of the station app**: scan, weigh, photograph, grade |
| **Priority** | **Primary (user)** |
| **Evidence base** | Concept Note §III, §X; vendor interviews (collection habits, spoilage, rain) |

## Snapshot
- **Age:** 38 · **Assignment:** Utility worker at Baguio City Public Market; already handles market waste
- **Pay:** About the Cordillera minimum wage of **₱505 a day**
- **Tech:** Personal Android phone (Facebook, TikTok, GCash); has never used a work app
- **Conditions:** Wet, cold mornings; wears gloves; **weak signal** inside the market

## Background
Kuya Jun already collects vegetable waste for Irisan. With WasteLedger he works a **fixed station** with a sealed digital platform scale (100 kg or more), a station phone and QR crates. The vendor interviews tell him what his day will look like:
- **High-volume vegetable stalls** bring 10–15 kg every morning after cleaning.
- **Small stalls** bring 3–5 kg, have no storage, and can't wait more than **1–2 days** before scraps go watery.
- **Rain** already disrupts collection today.
- Volume rises toward **December**: Irisan's vegetable intake went from about 4.5 t/day in February to about 11 t/day in December 2025.

He knows most vendors by name, so he is the one who has to say "rejected".

## Goals
- Work through the queue quickly without mistakes
- **Avoid arguments** over weights and grades
- Not be blamed if the numbers don't match later

## Pain points and frustrations
- **Signal drops:** he worries records will be lost or counted twice
- **Gloves and wet hands:** small buttons and typing are hard
- **Watery loads:** old scraps weigh more because of water. Should he grade them down?
- **Social conflict** when he rejects a neighbor's crate
- **Extra steps** he is tempted to skip

## How he uses WasteLedger (per drop-off)
1. **Scan** the crate's QR code
2. **Weigh** and type the weight (the app subtracts the empty crate's weight)
3. **One photo** with the scale display and the QR code in the frame
4. **Grade:** Clean / Minor contamination / Rejected, with a reason (including *spoiled or watery*)
5. **Save.** The record is stored offline and synced later with a unique ID, so it never counts twice
6. **Review AI flags.** He or a supervisor decides; pay is never withheld automatically
7. **Small-stall round** (if the city approves it): batch-scan several small crates along a stall row
8. **Weekly:** check the scale against the market's Timbangan ng Bayan scale

## Design implications (Accessibility lens)
- **Large touch targets that work with gloves**; three large grade buttons with colors and icons
- **Numeric keypad only**; flag weights that can't be right
- Clear **offline indicator** and "X records waiting to upload"
- Filipino/English toggle, with icons alongside text
- **Picture-based rejection reasons**, including spoiled or watery scraps
- **Batch mode** for rounds and co-op drop-offs
- Every correction is logged with his name, the time and a reason. This protects him too.
- Target: **30 seconds or less per crate**

## Success measures
- 30 seconds or less per drop-off on average; no lost or duplicate records
- Under 5% of records corrected afterwards

## Open questions
- Will the city assign existing utility workers, or will the pilot fund staff (₱42,420–₱84,840)?
- Can one staff member handle the morning rush **and** a small-stall round?
- What staffing does December need, when volume is about twice the yearly average?
