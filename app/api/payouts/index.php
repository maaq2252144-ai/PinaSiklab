<?php
// Backs the Demo Controls page, which stands in for the City Admin app (not built).
require_once __DIR__ . '/../_shared/bootstrap.php';
$action = api_start();
$in = body();
$actor = 'demo controls';

function payout_row(int $id): array
{
    $stmt = db()->prepare('SELECT p.*, s.name, s.payout_channel FROM payouts p JOIN suppliers s ON s.id = p.supplier_id WHERE p.id = ?');
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    if (!$row) {
        fail('not_found', 404);
    }
    return $row;
}

switch ($action) {
    case 'state':
        $balances = [];
        foreach (db()->query("SELECT id, name FROM suppliers WHERE status = 'active' ORDER BY name")->fetchAll() as $s) {
            $s['balance'] = balance($s['id']);
            $balances[] = $s;
        }
        json_out([
            'ok' => true,
            'threshold' => (float) setting('payout_threshold'),
            'baseline' => setting('baseline_mode') === '1',
            'funding' => setting('funding_active') === '1',
            'balances' => $balances,
            'payouts' => db()->query('SELECT p.*, s.name FROM payouts p JOIN suppliers s ON s.id = p.supplier_id ORDER BY p.id DESC LIMIT 30')->fetchAll(),
            'manifests' => db()->query("SELECT * FROM manifests WHERE status = 'waiting' ORDER BY id")->fetchAll(),
        ]);

    case 'generate': // FR43, FR50
        if (setting('funding_active') !== '1') {
            fail('no_funding');
        }
        $thr = (float) setting('payout_threshold');
        $made = 0;
        $pdo = db();
        $pdo->beginTransaction();
        foreach ($pdo->query("SELECT id FROM suppliers WHERE status = 'active'")->fetchAll(PDO::FETCH_COLUMN) as $id) {
            $open = $pdo->prepare("SELECT COUNT(*) FROM payouts WHERE supplier_id = ? AND status = 'pending'");
            $open->execute([$id]);
            $bal = balance($id);
            if ((int) $open->fetchColumn() === 0 && $bal >= $thr) {
                $pdo->prepare('INSERT INTO payouts (supplier_id, amount, created_at, updated_at) VALUES (?, ?, ?, ?)')->execute([$id, $bal, now(), now()]);
                $made++;
            }
        }
        audit($actor, 'payout_list', $made . ' suppliers');
        $pdo->commit();
        json_out(['ok' => true, 'made' => $made]);

    case 'approve': // FR44: approval moves the money out of the balance; a failure puts it back.
        if (setting('funding_active') !== '1') {
            fail('no_funding');
        }
        $pdo = db();
        $pdo->beginTransaction();
        $rows = $pdo->query("SELECT * FROM payouts WHERE status = 'pending' AND approved_at IS NULL FOR UPDATE")->fetchAll();
        foreach ($rows as $p) {
            $ref = 'PO-' . date('ymd') . '-' . sprintf('%04d', $p['id']);
            $pdo->prepare('UPDATE payouts SET approved_at = ?, ref = ?, updated_at = ? WHERE id = ?')->execute([now(), $ref, now(), $p['id']]);
            add_ledger($p['supplier_id'], 'debit', -(float) $p['amount'], null, (int) $p['id'], 'Payout ' . $ref);
        }
        audit($actor, 'payout_approve', count($rows) . ' payouts');
        $pdo->commit();
        json_out(['ok' => true, 'approved' => count($rows)]);

    case 'mark': // FR46, FR47
        $id = (int) ($in['id'] ?? 0);
        $status = $in['status'] ?? '';
        $pdo = db();
        $pdo->beginTransaction();
        $p = payout_row($id);
        $allowed = ($p['status'] === 'pending' && $p['approved_at'] && in_array($status, ['sent', 'failed'], true))
            || ($p['status'] === 'sent' && $status === 'returned');
        if (!$allowed) {
            $pdo->rollBack();
            fail('bad_status');
        }
        $pdo->prepare('UPDATE payouts SET status = ?, updated_at = ? WHERE id = ?')->execute([$status, now(), $id]);
        $supplier = get_supplier($p['supplier_id']);
        $amount = number_format((float) $p['amount'], 2);
        if ($status === 'sent') {
            send_sms($supplier, 'sent', ['amt' => $amount, 'channel' => $p['payout_channel'] === 'gcash' ? 'GCash' : 'bank', 'ref' => $p['ref']]);
        } else {
            add_ledger($p['supplier_id'], 'adjustment', (float) $p['amount'], null, $id, 'Payout ' . $p['ref'] . ' ' . $status . '; back to balance');
            send_sms($supplier, 'failed', ['amt' => $amount]);
        }
        audit($actor, 'payout_' . $status, (string) $p['ref']);
        $pdo->commit();
        json_out(['ok' => true]);

    case 'confirm_manifest': // Stands in for the facility's confirmation.
        $id = (int) ($in['id'] ?? 0);
        db()->prepare("UPDATE manifests SET status = 'confirmed' WHERE id = ?")->execute([$id]);
        db()->prepare('UPDATE dropoffs SET composted = 1 WHERE manifest_id = ?')->execute([$id]);
        audit($actor, 'manifest_confirm', '#' . $id);
        json_out(['ok' => true]);

    case 'toggle':
        $key = $in['key'] ?? '';
        if (!in_array($key, ['baseline_mode', 'funding_active'], true)) {
            fail('bad_key');
        }
        db()->prepare('UPDATE settings SET v = ? WHERE k = ?')->execute([!empty($in['on']) ? '1' : '0', $key]);
        audit($actor, 'setting', $key . '=' . (!empty($in['on']) ? '1' : '0'));
        json_out(['ok' => true]);

    case 'reset':
        install_demo_data();
        session_unset();
        json_out(['ok' => true]);
}
fail('unknown_action', 404);
