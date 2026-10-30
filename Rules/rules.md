# Rules

Constraints to follow when working on WasteLedger PH. Add a rule whenever a new constraint comes up.

## Working rules

- **Documents contain only what they are named for.** A requirements document lists requirements only: no scope, roles, data entities, interfaces, acceptance criteria or open questions unless asked. *(Oct 30, 2026)*
- **Requirements format:** one table per type with only two columns, `ID | Functional Requirement` (FR1, FR2, …) and `ID | Non-Functional Requirement` (NFR1, NFR2, …). Write each as "The system shall …". No priority column. Group functional requirements under area subheadings (Supplier Registration, Weigh Station, Offline Sync, and so on), each with its own table, and keep the FR numbers continuous across groups. *(Oct 30, 2026)*
- **Don't invent values the sources don't give.** Mark them **[TBD]** instead. *(Oct 30, 2026)*
- **Put project documents in the `Docs` folder.** *(Oct 30, 2026)*
- **Keep this rules file in the `Rules` folder, not the project root.** *(Oct 30, 2026)*
- **Log every change from the concept note** in `Docs/Concept_Note_Changes.md`: what the note says, what it is now, and which sections need updating. *(Oct 30, 2026)*
- **Don't turn persona suggestions into rules.** Rules come only from constraints the user states or from the concept note. Persona design implications are ideas, not constraints. *(Oct 30, 2026)*

## Product constraints

- **WasteLedger never holds payout money.** It keeps a ledger of what the city owes each supplier, and the cash stays in the city's own account (Xendit/GCash or Landbank) until a payout. A payout is due once a balance reaches the threshold (₱200 by default) and the city approves the payout list.
- **WasteLedger never buys or resells waste.**
- **Suppliers never pay.** Cities pay; vendors, farmers and households only get paid.
- **No government ID numbers are collected** from suppliers.
- **Suppliers can apply, but staff activate them.** An application stays pending and earns nothing until staff verify it in person, record consent, set the additional/existing tag and issue the crate and ID card.
- **Records can't be deleted.** Every correction is logged with who made it, when and why.
- **Automatic flags never withhold pay.** The flags are simple rule-based checks, not AI; don't call them AI. A person reviews every flag.
- **Rate rule:** payout + platform fee + transfer fee + minimum city saving must not exceed the city's hauling + tipping cost per kg.
- **Full rate only for newly diverted waste.** Waste that already went to Irisan earns only a quality bonus.
- **No weekly cap on paid kilos.** Don't add a per-supplier or per-co-op weekly limit to requirements, rules or designs. *(Removed Oct 30, 2026)*
- **The station app must work offline.**
- **City-specific values are settings, not code.**
- **Comply with the Data Privacy Act of 2012.**
