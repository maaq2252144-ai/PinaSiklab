# WasteLedger PH Prototype Screens

Screenshots of the important screens in the WasteLedger PH prototype, with what each screen shows and what it does. They were taken in English from the static (Netlify) version on 31 October 2026, using the sample accounts. The app also runs in Filipino and Ilokano. All names, numbers and amounts are sample data.

## Launcher

### Launcher
![Launcher](00-launcher.png)

The first page of the prototype. It links to the farmer and vendor app, the station staff app, and Demo Controls.

## Station staff app

The app that weigh-station staff use on a station phone. It works with no signal.

### 1. PIN login
![PIN login](station-01-pin-login.png)

Staff log in by tapping their PIN on a large keypad. The dots show how many digits are entered. The sample PINs are listed at the bottom.

### 2. Home
![Station home](station-02-home.png)

Shows the station and the staff member on duty, the signal status, and today's total kilos and number of deliveries. Below is the list of today's deliveries and whether each one has uploaded. **Weigh a load** starts a new weigh-in. **More tools** opens the other station tasks, with a count of applications waiting.

### 3. Scan the crate
![Scan the crate](station-03-scan-crate.png)

Step 1 of 5. Staff scan the QR code on the supplier's crate. In the prototype, tapping the box opens a list of crates instead of the camera. Staff can also search for a supplier by name or ID.

### 4. Enter the weight
![Enter the weight](station-04-enter-weight.png)

Step 2 of 5. Shows the supplier and their balance, lets staff pick a crate and a co-op member, and takes the scale reading on a keypad. The app subtracts the empty crate's weight and shows the contents. It warns if the weight is over the crate's capacity.

### 5. Take a photo
![Take a photo](station-05-photo-proof.png)

Step 3 of 5. Staff take one photo with the scale display and the crate's QR code in the frame, as proof of the weight. The prototype shows a placeholder image. **Retake** replaces it.

### 6. Grade
![Grade](station-06-grade.png)

Step 4 of 5. Staff choose Clean, A little mixed, or Not accepted. Anything other than Clean needs a reason, picked from picture tiles such as Plastic or Spoiled or watery.

### 7. Check before saving
![Check before saving](station-07-check-and-save.png)

Step 5 of 5. A summary of the crate, scale reading, crate weight, contents, grade and what the supplier earns. Staff tick that they checked it with the supplier, then save.

### 8. Recorded
![Recorded](station-08-recorded.png)

Shown when the load uploads straight away. It confirms the weight, grade and pay, shows the record number, and notes that the supplier got a text receipt. Staff can weigh the next load, weigh another crate for the same supplier, or go back.

### 9. Saved on this phone
![Saved on this phone](station-09-saved-offline.png)

Shown when there is no signal. The load is saved on the phone and uploads by itself when the signal returns. The screen tells staff not to weigh it again.

### 10. Home with loads waiting to upload
![Home with loads waiting](station-10-home-offline-queue.png)

The signal button shows "No signal" and how many loads are waiting. Waiting loads are marked "Saved on phone" in today's list. Uploading the same load twice still counts it once.

### 11. More tools
![More tools](station-11-more-tools.png)

The station's other tasks: supplier applications, registering a supplier, crates, the weekly scale check, and the delivery to Irisan. **Log out** is here too.

### 12. Applications
![Applications](station-12-applications.png)

Supplier applications sent from the farmer and vendor app, waiting for staff to check them in person.

### 13. Activate a supplier
![Activate a supplier](station-13-activate-supplier.png)

Staff confirm the applicant's details in person and record their consent. They mark whether the waste is newly diverted or already went to Irisan, note any animal-feed collector, and issue a crate. Activating sends the supplier their ID. Staff can also reject an application with a reason.

### 14. Register a supplier
![Register a supplier](station-14-register-supplier.png)

Staff register a supplier directly at the station, with the same consent and crate steps as activation. No government ID is asked for.

### 15. Supplier ID card
![Supplier ID card](station-15-supplier-id-card.png)

The supplier's ID card with their QR code, ID, name and crate codes, ready to print. The QR in the prototype is a sample pattern.

### 16. Crates
![Crates](station-16-crates.png)

Every crate, who it belongs to and its empty weight. Staff can reassign a crate to another supplier, retire it, or report it lost. Each change is logged.

### 17. Weekly scale check
![Weekly scale check](station-17-scale-check.png)

Staff weigh a known reference weight, enter the reading, and mark pass or fail. The last check is shown at the top.

### 18. Trip to Irisan
![Trip to Irisan](station-18-delivery-manifest.png)

Shows the kilos and crates not yet sent to the Irisan composting facility. **Create manifest** groups them into one delivery. Past deliveries show whether Irisan confirmed them.

### 19. Correct the weight
![Correct the weight](station-19-correct-a-record.png)

Opened by tapping a delivery on the home screen. Staff enter the corrected contents and a reason. The original record stays, and the correction is logged with who made it, when and why. The supplier's balance and text receipt update.

## Farmer and vendor app

The app that suppliers use on their own phone.

### 1. Choose language
![Choose language](supplier-01-choose-language.png)

The first screen. Suppliers choose Filipino, Ilokano or English. They can change it later in **Me**.

### 2. Log in with your mobile number
![Log in with your mobile number](supplier-02-login-number.png)

Suppliers type the mobile number registered at the weigh station. New suppliers can tap **No account yet? Apply**.

### 3. Enter the code
![Enter the code](supplier-03-sms-code.png)

Suppliers enter the 6-digit code sent by text. In the prototype no text is sent, and the code is shown on screen to tap and fill.

### 4. Home
![Supplier home](supplier-04-home-balance.png)

Shows the supplier's balance and how much more is needed before a payout. The balance never expires. Tiles lead to My QR, History, My payout and Help. Below are the last delivery and its progress. **Hide** covers the balance, and **Listen** reads the screen aloud.

### 5. My QR
![My QR](supplier-05-my-qr.png)

The supplier's QR code and ID, to show at the weigh station.

### 6. History
![History](supplier-06-history.png)

Every delivery with its date, weight, grade and pay. Filters show all deliveries, only clean ones, only mixed ones, or only the ones not accepted. Co-ops also see each member's share.

### 7. Delivery details
![Delivery details](supplier-07-delivery-receipt.png)

One delivery from start to finish: weighed, photo saved, added to the balance, and checked at Irisan. Below are the photo, weight, grade, pay per kilo, earnings, station and record number. Corrections show the old and new weight.

### 8. My payout
![My payout](supplier-08-my-payout.png)

Where the payout stands. It moves from reaching the threshold, to the city checking the list, to being sent to the supplier's GCash or bank. The city adds the supplier to the list automatically, and the city pays the fees. Past payouts are listed below.

### 9. Messages
![Messages](supplier-09-messages.png)

The text messages from the weigh station, with a count of unread ones.

### 10. Station chat
![Station chat](supplier-10-station-chat.png)

All text receipts and updates. Quick replies let the supplier say thanks, ask the station to call, or ask for their balance.

### 11. How it works
![How it works](supplier-11-how-it-works.png)

Four steps from crate to payout, what waste is accepted and what is not, and the weigh station's phone number.

### 12. Me
![Me](supplier-12-me-settings.png)

The supplier's name, ID and stall or farm. Here they change the language, turn read-aloud on or off, open Help, or log out.

### 13. Apply
![Apply](supplier-13-apply.png)

A form for new suppliers: name, vendor or co-op, stall or farm, mobile number, and where to send pay. The application waits until staff confirm it in person at the station.

## Demo Controls

### Demo Controls
![Demo Controls](demo-01-demo-controls.png)

A stand-in for the City Admin and Irisan steps, which are not built. It is not part of the product. It shows every supplier's balance, builds the payout list, approves it, and marks each payout as sent or failed. It also confirms deliveries for Irisan, switches baseline weeks and city funding on or off, and resets the sample data.
