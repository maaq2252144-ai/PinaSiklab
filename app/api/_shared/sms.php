<?php
// Simulated SMS (FR19, FR33, FR35, FR47). Nothing leaves the machine: texts are stored in `messages`.
const SMS_TEXT = [
    'receipt' => [
        'fil' => 'WasteLedger: {kg} kg {grade}. {pay}. Balanse: P{bal}.',
        'ilo' => 'WasteLedger: {kg} kg {grade}. {pay}. Balanse: P{bal}.',
        'en' => 'WasteLedger: {kg} kg {grade}. {pay}. Balance: P{bal}.',
    ],
    'balance' => [
        'fil' => 'WasteLedger: Ang balanse mo ay P{bal}.',
        'ilo' => 'WasteLedger: Ti balansem ket P{bal}.',
        'en' => 'WasteLedger: Your balance is P{bal}.',
    ],
    'threshold' => [
        'fil' => 'WasteLedger: Umabot na sa P{thr} ang balanse mo. Isasama ito ng lungsod sa susunod na listahan ng bayad.',
        'ilo' => 'WasteLedger: Dimmanon ti balansem iti P{thr}. Iraman ti siudad daytoy iti sumaruno a listaan ti bayad.',
        'en' => 'WasteLedger: Your balance reached P{thr}. The city will add it to the next payout list.',
    ],
    'sent' => [
        'fil' => 'WasteLedger: Ipinadala ng lungsod ang P{amt} sa iyong {channel}. Ref: {ref}.',
        'ilo' => 'WasteLedger: Impatulod ti siudad ti P{amt} iti {channel}-mo. Ref: {ref}.',
        'en' => 'WasteLedger: The city sent P{amt} to your {channel}. Ref: {ref}.',
    ],
    'failed' => [
        'fil' => 'WasteLedger: Hindi naipadala ang P{amt}. Ibinalik ito sa balanse mo. Pumunta sa timbangan para masuri ang account mo.',
        'ilo' => 'WasteLedger: Saan a naipatulod ti P{amt}. Naisubli daytoy iti balansem. Mapan iti timbangan tapno makita ti accountmo.',
        'en' => 'WasteLedger: The P{amt} could not be sent. It is back in your balance. Please visit the station to check your account.',
    ],
    'apply' => [
        'fil' => 'WasteLedger: Natanggap ang aplikasyon mo. Pumunta sa timbangan para makumpirma ito.',
        'ilo' => 'WasteLedger: Naawat ti aplikasionmo. Mapan iti timbangan tapno makumpirma daytoy.',
        'en' => 'WasteLedger: We got your application. Please visit the station to confirm it.',
    ],
    'approved' => [
        'fil' => 'WasteLedger: Aktibo ka na! Ang iyong Supplier ID ay {id}.',
        'ilo' => 'WasteLedger: Aktibokan! Ti Supplier ID-m ket {id}.',
        'en' => 'WasteLedger: You are now active! Your Supplier ID is {id}.',
    ],
    'rejected' => [
        'fil' => 'WasteLedger: Hindi naaprubahan ang aplikasyon mo. Dahilan: {reason}.',
        'ilo' => 'WasteLedger: Saan a naaprobaran ti aplikasionmo. Gapu: {reason}.',
        'en' => 'WasteLedger: Your application was not approved. Reason: {reason}.',
    ],
    'corrected' => [
        'fil' => 'WasteLedger: Naitama ang {rec}: {kg} kg na. Balanse: P{bal}.',
        'ilo' => 'WasteLedger: Naipusto ti {rec}: {kg} kg itan. Balanse: P{bal}.',
        'en' => 'WasteLedger: {rec} was corrected to {kg} kg. Balance: P{bal}.',
    ],
    'reply' => [
        'fil' => 'Timbangan: Natanggap po. Tatawag ang staff sa oras ng palengke.',
        'ilo' => 'Timbangan: Naawat. Umawag ti staff iti oras ti tiendaan.',
        'en' => 'Station: Received. Staff will call you during market hours.',
    ],
];

const SMS_GRADE = [
    'clean' => ['fil' => 'Malinis', 'ilo' => 'Nadalus', 'en' => 'Clean'],
    'minor' => ['fil' => 'Medyo halo', 'ilo' => 'Bassit a nalaokan', 'en' => 'A little mixed'],
    'rejected' => ['fil' => 'Hindi tinanggap', 'ilo' => 'Saan a naawat', 'en' => 'Not accepted'],
];

const SMS_PAY = [
    'tbd' => ['fil' => 'Bayad: [TBD]', 'ilo' => 'Bayad: [TBD]', 'en' => 'Pay: [TBD]'],
    'baseline' => ['fil' => 'Baseline: walang bayad', 'ilo' => 'Baseline: awan ti bayad', 'en' => 'Baseline: no pay'],
    'rejected' => ['fil' => 'Walang bayad', 'ilo' => 'Awan ti bayad', 'en' => 'Not paid'],
];

function send_sms(array $supplier, string $key, array $vars = []): void
{
    $text = SMS_TEXT[$key][$supplier['lang']] ?? SMS_TEXT[$key]['en'];
    foreach ($vars as $name => $value) {
        $text = str_replace('{' . $name . '}', (string) $value, $text);
    }
    add_message($supplier['id'], 'out', $text);
}

function add_message(string $supplierId, string $direction, string $text): void
{
    db()->prepare('INSERT INTO messages (supplier_id, direction, body, read_at, created_at) VALUES (?, ?, ?, ?, ?)')
        ->execute([$supplierId, $direction, mb_substr($text, 0, 400), $direction === 'in' ? now() : null, now()]);
}
