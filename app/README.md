# WasteLedger PH: clickable prototype

A working prototype of the farmer/vendor app and the station staff app. Built with HTML, CSS and JavaScript only; this branch needs no server. All data is sample data, no real SMS is sent and no real money moves.

## Run it

This is the **static Netlify version** (branch `netlify`). It needs no server: the accounts and sample data are hardcoded in `js/services/local-db.js` and each browser keeps its own copy. The XAMPP version with PHP and MySQL is on the `main` branch.

- **Netlify:** deploy this branch from GitHub, or drag the `app` folder onto app.netlify.com/drop. `netlify.toml` publishes only `app`.
- **On your computer:** run `py -m http.server 8000` inside `app` and open `http://localhost:8000/`.

See [manual.md](manual.md) for the full guide.

## Folder structure

The layout follows the team's VitaCarnis project (`9628-slavesofdayrit`). This branch has no `api/` or `database/` folder.

```
app/
├── index.html              Launcher: links to the three apps
├── offline.html            Shown when a page was never saved for offline use
├── manifest.json           Install-as-app settings
├── sw.js                   Service worker: lets the apps reopen offline
├── _headers                Netlify cache headers
├── assets/
│   ├── css/                tokens.css, components.css
│   ├── icons/              App icons for the tab, home screen and install
│   └── images/             Logo and placeholder photo
├── js/
│   ├── app.js              Launcher logic
│   ├── core/utils.js       Shared helpers, icons, screen drawing
│   ├── services/
│   │   ├── local-db.js     Hardcoded accounts and sample data, saved in the browser
│   │   ├── api.js          The PHP API rebuilt in JavaScript, same actions and replies
│   │   └── sw-register.js  Registers the service worker
│   └── features/           station.js, supplier.js, demo.js and their translations
└── pages/
    ├── demo/dashboard.html
    ├── station/dashboard.html
    └── supplier/dashboard.html
```

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
- SMS: saved in the browser's data and shown in Messages.
- Photo: a placeholder in `assets/images/`. The logo is `assets/images/logo.png`, and the app icons are in `assets/icons/`.

## Not built

City Admin dashboard, rates screen, billing, reports and PDF statements, facility app, supervisor approval for corrections (threshold is [TBD]), GPS capture, public page, household features.

## Before real use

The accounts are demo-only and visible to anyone who opens the site. Each visitor changes only their own browser's copy of the data. Ilokano text needs a native speaker's review. The data model in `local-db.js` mirrors the prototype database on `main`, which should be replaced by the team's ERD.

[TBD] values are `NULL` in the `rates` table. Those loads credit ₱0.00 and show "Rate [TBD]" until a value is entered.
