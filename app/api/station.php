<?php
require_once __DIR__ . '/../includes/db.php';
$action = api_start();
$staff = require_staff();
$in = body();

switch ($action) {
    case 'bootstrap': // FR27: everything the phone must cache to work offline.
        $suppliers = db()->query("SELECT id, type, name, section, mobile, tag, ubak FROM suppliers WHERE status = 'active' ORDER BY name")->fetchAll();
        $crates = db()->query('SELECT code, supplier_id, tare_kg, capacity_kg, status FROM crates ORDER BY code')->fetchAll();
        $members = db()->query('SELECT id, supplier_id, name FROM coop_members ORDER BY name')->fetchAll();
        foreach ($suppliers as &$s) {
            $s['balance'] = balance($s['id']);
            $s['crates'] = array_values(array_filter($crates, fn($c) => $c['supplier_id'] === $s['id'] && $c['status'] === 'active'));
            $s['members'] = array_values(array_filter($members, fn($m) => $m['supplier_id'] === $s['id']));
        }
        unset($s);
        $rates = rate_at(now());
        $last = db()->prepare('SELECT * FROM calibration_logs WHERE station_id = ? ORDER BY id DESC LIMIT 1');
        $last->execute([$staff['station_id']]);
        json_out([
            'ok' => true,
            'staff' => $staff,
            'suppliers' => $suppliers,
            'crates' => $crates,
            'pending' => db()->query("SELECT id, type, name, section, mobile, payout_channel, payout_account, lang FROM suppliers WHERE status = 'pending' ORDER BY created_at")->fetchAll(),
            'rates' => [
                'clean' => (float) $rates['clean'],
                'minor' => $rates['minor'] === null ? null : (float) $rates['minor'],
                'existing_bonus' => $rates['existing_bonus'] === null ? null : (float) $rates['existing_bonus'],
            ],
            'baseline' => setting('baseline_mode') === '1',
            'last_calibration' => $last->fetch() ?: null,
        ]);

    case 'crate': // FR6: history is kept in crate_events.
        $code = clean_text($in['code'] ?? '', 12);
        $op = $in['op'] ?? '';
        $stmt = db()->prepare('SELECT code FROM crates WHERE code = ?');
        $stmt->execute([$code]);
        if (!$stmt->fetch()) {
            fail('not_found', 404);
        }
        if ($op === 'retire' || $op === 'lost') {
            db()->prepare('UPDATE crates SET status = ? WHERE code = ?')->execute([$op === 'retire' ? 'retired' : 'lost', $code]);
            $detail = '';
        } elseif ($op === 'reassign') {
            $target = get_supplier(clean_text($in['supplier_id'] ?? '', 10));
            if (!$target || $target['status'] !== 'active') {
                fail('supplier_not_active');
            }
            db()->prepare("UPDATE crates SET supplier_id = ?, status = 'active' WHERE code = ?")->execute([$target['id'], $code]);
            $detail = 'To ' . $target['id'];
        } else {
            fail('bad_op');
        }
        db()->prepare('INSERT INTO crate_events (crate_code, action, detail, staff_id, created_at) VALUES (?, ?, ?, ?, ?)')
            ->execute([$code, $op, $detail, $staff['id'], now()]);
        audit('staff ' . $staff['id'], 'crate_' . $op, $code . ' ' . $detail);
        json_out(['ok' => true]);

    case 'calibration': // FR21
        $reference = round((float) ($in['reference_kg'] ?? 0), 1);
        $reading = round((float) ($in['reading_kg'] ?? 0), 1);
        if ($reference <= 0 || $reading <= 0 || !in_array($in['result'] ?? '', ['pass', 'fail'], true)) {
            fail('missing_fields');
        }
        db()->prepare('INSERT INTO calibration_logs (station_id, staff_id, reference_kg, reading_kg, result, created_at) VALUES (?, ?, ?, ?, ?, ?)')
            ->execute([$staff['station_id'], $staff['id'], $reference, $reading, $in['result'], now()]);
        audit('staff ' . $staff['id'], 'calibration', $reference . ' / ' . $reading . ' ' . $in['result']);
        json_out(['ok' => true]);

    case 'manifests':
        $stmt = db()->prepare('SELECT * FROM manifests WHERE station_id = ? ORDER BY id DESC LIMIT 10');
        $stmt->execute([$staff['station_id']]);
        $open = db()->prepare("SELECT COUNT(*) AS crates, COALESCE(SUM(net_kg), 0) AS kg FROM dropoffs WHERE station_id = ? AND manifest_id IS NULL AND grade <> 'rejected'");
        $open->execute([$staff['station_id']]);
        json_out(['ok' => true, 'manifests' => $stmt->fetchAll(), 'open' => $open->fetch()]);

    case 'create_manifest': // FR22
        $pdo = db();
        $pdo->beginTransaction();
        $open = $pdo->prepare("SELECT COUNT(*) AS crates, COALESCE(SUM(net_kg), 0) AS kg FROM dropoffs WHERE station_id = ? AND manifest_id IS NULL AND grade <> 'rejected' FOR UPDATE");
        $open->execute([$staff['station_id']]);
        $totals = $open->fetch();
        if ((int) $totals['crates'] === 0) {
            $pdo->rollBack();
            fail('nothing_to_send');
        }
        $pdo->prepare('INSERT INTO manifests (station_id, total_kg, crate_count, time_out, staff_id) VALUES (?, ?, ?, ?, ?)')
            ->execute([$staff['station_id'], $totals['kg'], $totals['crates'], now(), $staff['id']]);
        $id = (int) $pdo->lastInsertId();
        $pdo->prepare("UPDATE dropoffs SET manifest_id = ? WHERE station_id = ? AND manifest_id IS NULL AND grade <> 'rejected'")->execute([$id, $staff['station_id']]);
        audit('staff ' . $staff['id'], 'manifest', '#' . $id);
        $pdo->commit();
        json_out(['ok' => true, 'id' => $id]);
}
fail('unknown_action', 404);
