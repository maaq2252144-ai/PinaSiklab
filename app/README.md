# WasteLedger PH: clickable prototype

A working prototype of the farmer/vendor app and the station staff app. Built with HTML, CSS, JavaScript, PHP and MySQL. All data is sample data, no real SMS is sent and no real money moves.

## Run it

1. Open the XAMPP Control Panel and start **MySQL**.
2. Start the site, either way:
   - **Apache:** copy this `app` folder to `C:\xampp\htdocs\wasteledger`, start Apache, and open `http://localhost/wasteledger/`.
   - **PHP's own server:** run `C:\xampp\php\php.exe -S localhost:8000 -t app` from the repo root, and open `http://localhost:8000/`.
3. On the first visit, press **Set up demo database**. It creates a database called `wasteledger_demo`.

If your MySQL has a password or uses another port, change `config.php`.

## Demo logins

| App | Login |
|---|---|
| Farmer and vendor | Ben `09170000207`, Nena `09170000112`, Luz `09170000145`; the SMS code is on screen (`482619`) |
| Station staff | PIN `1234` |

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
- Logo and images: placeholders in `assets/img/`.

## Not built

City Admin dashboard, rates screen, billing, reports and PDF statements, facility app, supervisor approval for corrections (threshold is [TBD]), GPS capture, public page, household features.

## Before real use

The login is demo-only and Demo Controls has no login, so **don't host this publicly**. Ilokano text needs a native speaker's review. The database in `db/` is a prototype and should be replaced by the team's ERD.

[TBD] values are `NULL` in the `rates` table. Those loads credit ₱0.00 and show "Rate [TBD]" until a value is entered.
