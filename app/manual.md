# WasteLedger PH Setup Manual

WasteLedger PH is a prototype of the farmer/vendor app and the weigh-station staff app. It runs on XAMPP (Apache, PHP and MySQL). All data is sample data.

## 1. What you need

- XAMPP with PHP 8.1 or newer. The team's copy is in `D:\xampp`.
- Chrome or Edge.

## 2. Set it up with XAMPP (recommended)

1. Open the **XAMPP Control Panel** and press **Start** next to **Apache** and **MySQL**. Both should turn green.
2. Copy the whole `app` folder into `D:\xampp\htdocs\` and rename the copy to `wasteledger`. You should now have `D:\xampp\htdocs\wasteledger\index.html`.
3. Open [http://localhost/wasteledger/](http://localhost/wasteledger/).
4. Press **Set up demo database**. This creates the `wasteledger_demo` database and loads the sample data. You only do this once.
5. The launcher now shows three buttons: **Farmer and vendor app**, **Station staff app** and **Demo Controls**.

Copy the folder again after you change any file, or work directly inside `htdocs\wasteledger`.

## 3. Set it up without Apache

Use this if Apache won't start, for example because Skype or IIS already uses port 80.

1. Start only **MySQL** in the XAMPP Control Panel.
2. Open a terminal in the folder that contains `app` and run:

   ```
   D:\xampp\php\php.exe -S localhost:8000 -t app
   ```

3. Open [http://localhost:8000/](http://localhost:8000/) and press **Set up demo database**.
4. Keep the terminal open while you use the app. Press Ctrl+C to stop it.

## 4. Set up the database by hand (optional)

The launcher button does this for you. To do it in phpMyAdmin instead:

1. Open [http://localhost/phpmyadmin/](http://localhost/phpmyadmin/).
2. Create a database named `wasteledger_demo` with collation `utf8mb4_unicode_ci`.
3. Select it, open **Import**, and import `database/schema.sql`.
4. Import `database/seed.sql` the same way.

## 5. Database settings

The connection settings are in `api/_shared/config.php`. They match a fresh XAMPP install:

| Setting | Value |
| --- | --- |
| Host | `127.0.0.1` |
| Port | `3306` |
| Database | `wasteledger_demo` |
| User | `root` |
| Password | empty |

Change them there if your MySQL has a password or uses another port.

## 6. Demo accounts

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

## 7. Install the station app on a phone or laptop

1. Open the station app in Chrome or Edge while online.
2. Choose **Install** from the address bar or the browser menu.
3. The installed app reopens without a signal. Loads weighed offline upload when the signal returns.

Installing and offline use need `http://localhost` or HTTPS. They don't work if you open the files by double-clicking them.

## 8. Reset the sample data

Open **Demo Controls** and press **Reset demo data**. This erases everything in `wasteledger_demo` and reloads the samples.

## 9. Troubleshooting

| Problem | Check |
| --- | --- |
| "Could not reach the PHP server" | Open the app through `http://localhost/wasteledger/`, not `file:///`. |
| "The database is not set up yet" stays after pressing the button | Start MySQL in the XAMPP Control Panel, then press the button again. The red message shows MySQL's own error. |
| "Access denied for user 'root'" | Your MySQL has a password. Put it in `api/_shared/config.php`. |
| Apache won't start | Another program is using port 80. Use section 3 instead. |
| Old screens still show after an update | Reload the page while online. If that fails, open DevTools, go to **Application → Service workers** and press **Unregister**, then reload. |

## 10. Before real use

The logins are demo-only and Demo Controls has no login, so don't host this publicly. Use only sample data. Don't enter real names, phone numbers or payout accounts.
