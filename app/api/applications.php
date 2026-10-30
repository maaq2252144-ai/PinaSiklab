<?php
require_once __DIR__ . '/../includes/db.php';
$action = api_start();
$in = body();

function read_form(array $in): array
{
    $form = [
        'name' => clean_text($in['name'] ?? ''),
        'type' => $in['type'] ?? '',
        'section' => clean_text($in['section'] ?? ''),
        'mobile' => clean_text($in['mobile'] ?? '', 11),
        'channel' => $in['channel'] ?? 'gcash',
        'account' => clean_text($in['account'] ?? '', 40),
        'lang' => in_array($in['lang'] ?? '', ['fil', 'ilo', 'en'], true) ? $in['lang'] : 'fil',
    ];
    if ($form['name'] === '' || $form['section'] === '' || $form['account'] === '') {
        fail('missing_fields');
    }
    if (!in_array($form['type'], ['vendor', 'coop'], true) || !in_array($form['channel'], ['gcash', 'bank'], true)) {
        fail('missing_fields');
    }
    if (!valid_mobile($form['mobile'])) {
        fail('bad_mobile');
    }
    $stmt = db()->prepare('SELECT id FROM suppliers WHERE mobile = ?');
    $stmt->execute([$form['mobile']]);
    if ($stmt->fetchColumn() !== false) {
        fail('mobile_taken', 409);
    }
    return $form;
}

function new_supplier_id(): string
{
    $max = db()->query('SELECT MAX(CAST(SUBSTRING(id, 3) AS UNSIGNED)) FROM suppliers')->fetchColumn();
    return 'S-' . sprintf('%04d', (int) $max + 1);
}

function insert_supplier(array $f): string
{
    $id = new_supplier_id();
    db()->prepare('INSERT INTO suppliers (id, type, name, section, mobile, payout_channel, payout_account, status, lang, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
        ->execute([$id, $f['type'], $f['name'], $f['section'], $f['mobile'], $f['channel'], $f['account'], 'pending', $f['lang'], now()]);
    return $id;
}

// Everything FR11 requires before a supplier can earn. Used for both application and direct registration.
function activate(string $id, array $in, array $staff): array
{
    if (($in['consent'] ?? false) !== true) {
        fail('consent_required');
    }
    if (!in_array($in['tag'] ?? '', ['additional', 'existing'], true)) {
        fail('tag_required');
    }
    $tare = round((float) ($in['tare_kg'] ?? 0), 1);
    $capacity = round((float) ($in['capacity_kg'] ?? 0), 1);
    if ($tare <= 0 || $capacity <= $tare) {
        fail('bad_crate');
    }
    $code = 'CR-' . substr($id, 2) . 'A';
    db()->prepare('INSERT INTO crates (code, supplier_id, tare_kg, capacity_kg) VALUES (?, ?, ?, ?)')->execute([$code, $id, $tare, $capacity]);
    db()->prepare('INSERT INTO crate_events (crate_code, action, detail, staff_id, created_at) VALUES (?, ?, ?, ?, ?)')
        ->execute([$code, 'issued', 'To ' . $id, $staff['id'], now()]);
    db()->prepare("UPDATE suppliers SET status = 'active', tag = ?, ubak = ?, consent_at = ?, consent_by = ? WHERE id = ?")
        ->execute([$in['tag'], !empty($in['ubak']) ? 1 : 0, now(), $staff['id'], $id]);
    foreach (array_filter(array_map('trim', explode("\n", (string) ($in['members'] ?? '')))) as $member) {
        db()->prepare('INSERT INTO coop_members (supplier_id, name) VALUES (?, ?)')->execute([$id, clean_text($member)]);
    }
    audit('staff ' . $staff['id'], 'activate', $id);
    send_sms(get_supplier($id), 'approved', ['id' => $id]);
    return ['ok' => true, 'id' => $id, 'crate' => $code];
}

switch ($action) {
    case 'apply': // FR10: public; earns nothing until staff activate.
        $form = read_form($in);
        $id = insert_supplier($form);
        audit('public', 'apply', $id);
        send_sms(get_supplier($id), 'apply');
        json_out(['ok' => true, 'id' => $id]);

    case 'register': // FR1: staff register directly, confirmed in person.
        $staff = require_staff();
        $pdo = db();
        $pdo->beginTransaction();
        $form = read_form($in);
        $id = insert_supplier($form);
        $out = activate($id, $in, $staff);
        $pdo->commit();
        json_out($out);

    case 'activate':
        $staff = require_staff();
        $pdo = db();
        $pdo->beginTransaction();
        $id = clean_text($in['id'] ?? '', 10);
        $supplier = get_supplier($id);
        if (!$supplier || $supplier['status'] !== 'pending') {
            fail('not_pending', 404);
        }
        if (($in['in_person'] ?? false) !== true) {
            fail('in_person_required');
        }
        $out = activate($id, $in, $staff);
        $pdo->commit();
        json_out($out);

    case 'reject':
        $staff = require_staff();
        $id = clean_text($in['id'] ?? '', 10);
        $reason = clean_text($in['reason'] ?? '', 160);
        $supplier = get_supplier($id);
        if (!$supplier || $supplier['status'] !== 'pending') {
            fail('not_pending', 404);
        }
        if ($reason === '') {
            fail('reason_required');
        }
        db()->prepare("UPDATE suppliers SET status = 'rejected', reject_reason = ? WHERE id = ?")->execute([$reason, $id]);
        audit('staff ' . $staff['id'], 'reject', $id . ': ' . $reason);
        send_sms($supplier, 'rejected', ['reason' => $reason]);
        json_out(['ok' => true]);
}
fail('unknown_action', 404);
