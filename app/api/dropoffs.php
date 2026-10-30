<?php
require_once __DIR__ . '/../includes/db.php';
$action = api_start();
$staff = require_staff();

// Saves one drop-off. Safe to call repeatedly with the same client_uuid (FR25, NFR3).
function save_dropoff(array $r, array $staff): array
{
    $uuid = clean_text($r['client_uuid'] ?? '', 40);
    if ($uuid === '') {
        return ['client_uuid' => $uuid, 'status' => 'error', 'error' => 'missing_uuid'];
    }
    $error = fn(string $code) => ['client_uuid' => $uuid, 'status' => 'error', 'error' => $code];

    $pdo = db();
    $pdo->beginTransaction();
    try {
        $stmt = $pdo->prepare('SELECT record_no, amount, supplier_id FROM dropoffs WHERE client_uuid = ? FOR UPDATE');
        $stmt->execute([$uuid]);
        if ($dup = $stmt->fetch()) {
            $pdo->commit();
            return ['client_uuid' => $uuid, 'status' => 'duplicate', 'record_no' => $dup['record_no'], 'amount' => (float) $dup['amount'], 'balance' => balance($dup['supplier_id'])];
        }

        $supplier = get_supplier(clean_text($r['supplier_id'] ?? '', 10));
        if (!$supplier || $supplier['status'] !== 'active') {
            $pdo->rollBack();
            return $error('supplier_not_active');
        }

        $stmt = $pdo->prepare("SELECT * FROM crates WHERE code = ? AND supplier_id = ? AND status = 'active'");
        $stmt->execute([clean_text($r['crate_code'] ?? '', 12), $supplier['id']]);
        $crate = $stmt->fetch();
        if (!$crate) {
            $pdo->rollBack();
            return $error('bad_crate');
        }

        $gross = round((float) ($r['gross_kg'] ?? 0), 1);
        $net = round($gross - (float) $crate['tare_kg'], 1);
        if ($net <= 0) {
            $pdo->rollBack();
            return $error('bad_weight');
        }

        $grade = $r['grade'] ?? '';
        if (!in_array($grade, ['clean', 'minor', 'rejected'], true)) {
            $pdo->rollBack();
            return $error('bad_grade');
        }
        $reason = $grade === 'clean' ? null : ($r['reason'] ?? '');
        if ($grade !== 'clean' && !in_array($reason, ['plastic', 'mixed', 'spoiled', 'sellable', 'other'], true)) {
            $pdo->rollBack();
            return $error('reason_required');
        }
        if (empty($r['photo_name'])) {
            $pdo->rollBack();
            return $error('photo_required');
        }

        $occurred = (string) ($r['occurred_at'] ?? '');
        if (!preg_match('/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/', $occurred) || strtotime($occurred) === false || strtotime($occurred) > time() + 300) {
            $occurred = now();
        }

        $memberId = null;
        if (!empty($r['member_id'])) {
            $stmt = $pdo->prepare('SELECT id FROM coop_members WHERE id = ? AND supplier_id = ?');
            $stmt->execute([(int) $r['member_id'], $supplier['id']]);
            $memberId = $stmt->fetchColumn() ?: null;
        }

        [$rate, $amount, $note] = compute_pay($supplier, $grade, $net, $occurred);
        $flags = compute_flags($supplier['id'], $net);

        $pdo->prepare(
            'INSERT INTO dropoffs (client_uuid, supplier_id, crate_code, member_id, station_id, staff_id, device, gross_kg, tare_kg, net_kg, grade, reason, rate_applied, amount, pay_note, flags, photo_name, lat, lng, occurred_at, synced_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        )->execute([
            $uuid, $supplier['id'], $crate['code'], $memberId, $staff['station_id'], $staff['id'], clean_text($r['device'] ?? 'Station phone', 60),
            $gross, $crate['tare_kg'], $net, $grade, $reason, $rate, $amount, $note, $flags, clean_text($r['photo_name'], 80),
            is_numeric($r['lat'] ?? null) ? $r['lat'] : null, is_numeric($r['lng'] ?? null) ? $r['lng'] : null, $occurred, now(),
        ]);
        $dropoffId = (int) $pdo->lastInsertId();
        $recordNo = 'WL-' . date('ymd', strtotime($occurred)) . '-' . sprintf('%04d', $dropoffId);
        $pdo->prepare('UPDATE dropoffs SET record_no = ? WHERE id = ?')->execute([$recordNo, $dropoffId]);

        $before = balance($supplier['id']);
        if ($amount > 0) {
            add_ledger($supplier['id'], 'credit', $amount, $dropoffId, null, 'Drop-off ' . $recordNo);
        }
        $after = balance($supplier['id']);

        $pay = $note === 'paid' ? '+P' . number_format($amount, 2) : SMS_PAY[$note][$supplier['lang']];
        send_sms($supplier, 'receipt', [
            'kg' => number_format($net, 1), 'grade' => SMS_GRADE[$grade][$supplier['lang']], 'pay' => $pay, 'bal' => number_format($after, 2),
        ]);
        $threshold = (float) setting('payout_threshold');
        if ($before < $threshold && $after >= $threshold) {
            send_sms($supplier, 'threshold', ['thr' => number_format($threshold, 0)]);
        }
        audit('staff ' . $staff['id'], 'dropoff', $recordNo);

        $pdo->commit();
        return ['client_uuid' => $uuid, 'status' => 'saved', 'record_no' => $recordNo, 'net_kg' => $net, 'amount' => $amount, 'pay_note' => $note, 'balance' => $after, 'flags' => $flags];
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $e;
    }
}

function compute_pay(array $supplier, string $grade, float $net, string $occurred): array
{
    if ($grade === 'rejected') {
        return [null, 0.0, 'rejected'];
    }
    if (setting('baseline_mode') === '1') {
        return [null, 0.0, 'baseline'];
    }
    $rates = rate_at($occurred);
    if ($supplier['tag'] === 'existing') {
        $rate = $grade === 'clean' ? $rates['existing_bonus'] : null;
    } else {
        $rate = $grade === 'clean' ? $rates['clean'] : $rates['minor'];
    }
    if ($rate === null) {
        return [null, 0.0, 'tbd'];
    }
    return [(float) $rate, round($net * (float) $rate, 2), 'paid'];
}

// Rule-based checks only. They mark a record for a person to review and never touch pay (FR59).
function compute_flags(string $supplierId, float $net): ?string
{
    $stmt = db()->prepare('SELECT net_kg FROM dropoffs WHERE supplier_id = ? ORDER BY occurred_at DESC, id DESC');
    $stmt->execute([$supplierId]);
    $past = array_map('floatval', $stmt->fetchAll(PDO::FETCH_COLUMN));
    $flags = [];
    if (count($past) >= 2 && $past[0] === $net && $past[1] === $net) {
        $flags[] = 'repeat';
    }
    if (count($past) >= 3 && $net > array_sum($past) / count($past) * (float) setting('flag_jump_multiple')) {
        $flags[] = 'jump';
    }
    return $flags ? implode(',', $flags) : null;
}

switch ($action) {
    case 'sync':
        $records = body()['records'] ?? [];
        if (!is_array($records)) {
            fail('bad_records');
        }
        json_out(['ok' => true, 'results' => array_map(fn($r) => save_dropoff((array) $r, $staff), $records)]);

    case 'today':
        $stmt = db()->prepare(
            "SELECT d.id, d.client_uuid, d.record_no, d.supplier_id, s.name, d.net_kg, d.grade, d.amount, d.pay_note, d.flags, d.occurred_at, d.manifest_id,
                    c.new_net_kg AS corrected_kg
             FROM dropoffs d
             JOIN suppliers s ON s.id = d.supplier_id
             LEFT JOIN corrections c ON c.id = (SELECT MAX(id) FROM corrections WHERE dropoff_id = d.id)
             WHERE d.station_id = ? AND DATE(d.occurred_at) = CURDATE() ORDER BY d.occurred_at DESC, d.id DESC"
        );
        $stmt->execute([$staff['station_id']]);
        json_out(['ok' => true, 'loads' => $stmt->fetchAll()]);

    case 'correct':
        $in = body();
        $reason = clean_text($in['reason'] ?? '', 200);
        $newNet = round((float) ($in['new_net_kg'] ?? 0), 1);
        if ($reason === '') {
            fail('reason_required');
        }
        if ($newNet <= 0) {
            fail('bad_weight');
        }
        $pdo = db();
        $pdo->beginTransaction();
        $stmt = $pdo->prepare(
            'SELECT d.*, c.new_net_kg FROM dropoffs d
             LEFT JOIN corrections c ON c.id = (SELECT MAX(id) FROM corrections WHERE dropoff_id = d.id)
             WHERE d.id = ? AND d.station_id = ? FOR UPDATE'
        );
        $stmt->execute([(int) ($in['dropoff_id'] ?? 0), $staff['station_id']]);
        $row = $stmt->fetch();
        if (!$row) {
            $pdo->rollBack();
            fail('not_found', 404);
        }
        $oldNet = (float) ($row['new_net_kg'] ?? $row['net_kg']);
        $change = $row['rate_applied'] === null ? 0.0 : round(($newNet - $oldNet) * (float) $row['rate_applied'], 2);
        $pdo->prepare('INSERT INTO corrections (dropoff_id, old_net_kg, new_net_kg, amount_change, reason, staff_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
            ->execute([$row['id'], $oldNet, $newNet, $change, $reason, $staff['id'], now()]);
        if ($change != 0) {
            add_ledger($row['supplier_id'], 'adjustment', $change, (int) $row['id'], null, 'Correction of ' . $row['record_no']);
        }
        audit('staff ' . $staff['id'], 'correction', $row['record_no'] . ': ' . $oldNet . ' to ' . $newNet . ' kg. ' . $reason);
        send_sms(get_supplier($row['supplier_id']), 'corrected', [
            'rec' => $row['record_no'], 'kg' => number_format($newNet, 1), 'bal' => number_format(balance($row['supplier_id']), 2),
        ]);
        $pdo->commit();
        json_out(['ok' => true, 'amount_change' => $change]);
}
fail('unknown_action', 404);
