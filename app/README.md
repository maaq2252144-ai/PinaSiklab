# WasteLedger PH: clickable prototype

A working prototype of the farmer/vendor app and the station staff app. Built with HTML, CSS, JavaScript, PHP and MySQL. All data is sample data, no real SMS is sent and no real money moves.

## Run it

See [manual.md](manual.md) for the full setup guide. The short version:

1. Start **Apache** and **MySQL** in the XAMPP Control Panel.
2. Copy this `app` folder to `htdocs` and rename it `wasteledger`, so you get `xampp\htdocs\wasteledger\index.html`.
3. Open `http://localhost/wasteledger/` and press **Set up demo database**. It creates a database called `wasteledger_demo`.

If your MySQL has a password or uses another port, change `api/_shared/config.php`.

## Folder structure

The layout follows the team's VitaCarnis project (`9628-slavesofdayrit`).

```
app/
├── index.html              Launcher: checks the database, links to the three apps
├── offline.html            Shown when a page was never saved for offline use
├── manifest.json           Install-as-app settings
├── sw.js                   Service worker: lets the station app reopen offline
├── api/
│   ├── _shared/            bootstrap.php (database + helpers), config.php, sms.php
│   ├── applications/       Supplier applications and activation
│   ├── auth/               Supplier SMS-code login, staff PIN login
│   ├── dropoffs/           Weigh-ins, offline sync, corrections
│   ├── payouts/            Demo Controls (stand-in for City Admin)
│   ├── setup/              First-run database setup for the launcher
│   ├── station/            Station bootstrap, crates, calibration, manifests
│   └── supplier/           Supplier balance, history, messages
├── assets/
│   ├── css/                tokens.css, components.css
│   └── images/             Placeholder logo and photo
├── database/               schema.sql, seed.sql
├── js/
│   ├── app.js              Launcher logic
│   ├── core/utils.js       Shared helpers, icons, APP_ROOT
│   ├── services/           api.js (calls the PHP API), sw-register.js
│   └── features/           station.js, supplier.js, demo.js and their translations
└── pages/
    ├── demo/dashboard.html
    ├── station/dashboard.html
    └── supplier/dashboard.html
```

Every API endpoint is `api/<name>/index.php?action=<action>`. Scripts find the app root from their own address, so pages can sit at any depth.

## Demo logins

| Account | Login | What it shows |
| --- | --- | --- |
| Ben Dulnuan, co-op | `09170000207` | Filipino. Co-op with members, rejected and pending-rate loads |
| Nena Bautista, vendor | `09170000112` | Filipino. Balance has reached the ₱200 payout threshold |
| Luz Pacio, vendor | `09170000145` | Ilokano. Small balance, one load |
| Jenny Ramos, vendor | `09170000188` | English. New account with no loads, tagged "existing" |
| Elena Bayang, co-op | `09170000215` | English. Paid by bank, has a payout already sent |
| Carlo Dumalo, vendor | `09170000120` | Ilokano. Last payout failed and went back to the balance |
| Rosa Kimmay, applicant | `09170000301` | Can't log in yet. Waiting for staff to activate |
| Joel Bantog, co-op applicant | `09170000303` | Can't log in yet. Waiting for staff to activate |
| Mario Calpito, applicant | `09170000302` | Can't log in. Application was rejected |
| Kuya Jun, station staff | PIN `1234` | Station app |
| Ate Carmen, station staff | PIN `5678` | Station app |
| Kuya Dante, station staff | PIN `2468` | Station app |
| Demo Controls | No login | Stand-in for City Admin |

Every supplier uses the SMS code `482619`, which the app shows on screen.

## Five-minute demo

1. **Station:** log in with PIN 1234. Tap the network button so it says "No signal".
2. Tap **Weigh a load**, then the scanner, then crate `CR-0207B` (Ben). Enter a scale reading of `90`, take the photo, choose **Clean**, tick the check, and save. It says "Saved on this phone" and the queue count goes up.
3. Tap the network button again. The load uploads once and shows as uploaded.
4. **Supplier:** log in as Ben. The balance has passed ₱200, there is a new receipt in Messages, and **My payout** shows that it was reached.
5. **Demo Controls:** generate the list and approve it. The tracker moves to sending. Mark it **Sent** or **Failed**. Failed puts the money back in the balance.
6. **Application:** in the supplier app, choose "Apply". In the station app, open More tools → Applications, then activate it. The new supplier can now log in.

## What is simulated

- QR scan: you pick a crate from a list. The QR images are sample patterns, not scannable.
- Camera: shows a placeholder image.
- SMS: saved in the database and shown in Messages.
- Logo and images: placeholders in `assets/images/`.

## Not built

City Admin dashboard, rates screen, billing, reports and PDF statements, facility app, supervisor approval for corrections (threshold is [TBD]), GPS capture, public page, household features.

## Before real use

The login is demo-only and Demo Controls has no login, so **don't host this publicly**. Ilokano text needs a native speaker's review. The database in `database/` is a prototype and should be replaced by the team's ERD.

[TBD] values are `NULL` in the `rates` table. Those loads credit ₱0.00 and show "Rate [TBD]" until a value is entered.
