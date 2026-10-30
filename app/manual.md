# WasteLedger PH Setup Manual (static Netlify version)

This branch runs with no server. There is no PHP and no MySQL: the accounts and sample data are hardcoded in `js/services/local-db.js`, and every change is saved in the browser. The `main` branch has the XAMPP version.

## 1. What this means

- **Each browser has its own data.** A load weighed on one phone does not show on another phone or computer. Use one browser for a demo, and open the station app and the supplier app in tabs of that same browser.
- **Data stays until it is reset.** Changes survive a reload. Clearing the browser's site data or pressing **Reset demo data** brings back the samples.
- **It works offline after the first visit.** Everything, including the supplier app and Demo Controls, keeps working with no signal.

## 2. Deploy to Netlify from GitHub

1. Push this branch: `git push -u origin netlify`.
2. In Netlify, choose **Add new site → Import an existing project → GitHub** and pick the `PinaSiklab` repository.
3. Set **Branch to deploy** to `netlify`. Leave the build command empty. The `netlify.toml` file already tells Netlify to publish only the `app` folder.
4. Press **Deploy**. Netlify gives the site an address like `https://something.netlify.app`.

## 3. Deploy to Netlify by drag and drop

1. Open [app.netlify.com/drop](https://app.netlify.com/drop).
2. Drag the `app` folder onto the page. Drag only `app`, not the whole repository, so the Docs folder stays private.

## 4. Try it on your own computer

Any static file server works. With Python:

```
cd app
py -m http.server 8000
```

Then open [http://localhost:8000/](http://localhost:8000/). Opening `index.html` by double-clicking also shows the screens, but offline mode and installing need `http://localhost` or the Netlify https address.

## 5. Change the accounts

Edit `seedData()` in `js/services/local-db.js`. Staff are in `staff` (name and PIN) and suppliers are in `suppliers`. The SMS code is `demo_otp` in `settings`. After editing, press **Reset demo data** in Demo Controls so the browser loads the new list.

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
| A new load or account doesn't show on another device | Each browser has its own data. Use one browser for the whole demo. |
| Account changes in `local-db.js` don't show | Press **Reset demo data** in Demo Controls, or clear the site's data in the browser. |
| Old screens still show after a deploy | Reload while online. If that fails, open DevTools, go to **Application → Service workers**, press **Unregister** and reload. |
| The install option doesn't appear | Use the Netlify https address. Plain http network addresses can't install. |

## 10. Before real use

This version is for demos only. Anyone who opens the site can see the sample accounts and change their own copy of the data. Use only sample data. A real deployment needs the server version from the `main` branch, rebuilt with a proper login.
