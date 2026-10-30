<?php
require_once __DIR__ . '/../includes/db.php';
$action = api_start();
$id = require_supplier();
$supplier = get_supplier($id);
$in = body();

function payout_state(string $id, float $balance, float $threshold): array
{
    $stmt = db()->prepare('SELECT * FROM payouts WHERE supplier_id = ? ORDER BY id DESC');
    $stmt->execute([$id]);
    $all = $stmt->fetchAll();
    $latest = $all[0] ?? null;
    if ($latest && $latest['status'] === 'pending') {
        $state = $latest['approved_at'] ? 'sending' : 'approving';
    } elseif ($balance >= $threshold) {
        $state = 'reached';
    } else {
        $state = 'below';
    }
    return ['state' => $state, 'latest' => $latest, 'all' => $all];
}

switch ($action) {
    case 'summary':
        $bal = balance($id);
        $thr = (float) setting('payout_threshold');
        $stmt = db()->prepare(
            "SELECT d.*, m.name AS member, t.name AS station, c.new_net_kg AS corrected_kg,
                    (SELECT COALESCE(SUM(amount_change), 0) FROM corrections WHERE dropoff_id = d.id) AS amount_change
             FROM dropoffs d
             JOIN stations t ON t.id = d.station_id
             LEFT JOIN coop_members m ON m.id = d.member_id
             LEFT JOIN corrections c ON c.id = (SELECT MAX(id) FROM corrections WHERE dropoff_id = d.id)
             WHERE d.supplier_id = ? ORDER BY d.occurred_at DESC, d.id DESC"
        );
        $stmt->execute([$id]);
        $history = $stmt->fetchAll();

        $month = ['kg' => 0.0, 'composted' => 0.0, 'earned' => 0.0];
        $members = [];
        $thisMonth = date('Y-m');
        foreach ($history as &$row) {
            $row['net_now'] = (float) ($row['corrected_kg'] ?? $row['net_kg']);
            $row['amount_now'] = round((float) $row['amount'] + (float) $row['amount_change'], 2);
            $accepted = $row['grade'] !== 'rejected';
            if ($accepted && str_starts_with($row['occurred_at'], $thisMonth)) {
                $month['kg'] += $row['net_now'];
                $month['earned'] += $row['amount_now'];
                if ($row['composted']) {
                    $month['composted'] += $row['net_now'];
                }
            }
            if ($row['member'] && $accepted) {
                $members[$row['member']] = round(($members[$row['member']] ?? 0) + $row['amount_now'], 2);
            }
        }
        unset($row);

        $stmt = db()->prepare('SELECT id, direction, body, read_at, created_at FROM messages WHERE supplier_id = ? ORDER BY id');
        $stmt->execute([$id]);
        $messages = $stmt->fetchAll();

        $stmt = db()->prepare("SELECT COALESCE(SUM(amount), 0) FROM ledger_entries WHERE supplier_id = ? AND type = 'adjustment' AND dropoff_id IS NULL AND payout_id IS NULL");
        $stmt->execute([$id]);

        json_out([
            'ok' => true,
            'supplier' => [
                'id' => $supplier['id'], 'name' => $supplier['name'], 'type' => $supplier['type'], 'section' => $supplier['section'],
                'channel' => $supplier['payout_channel'], 'account' => $supplier['payout_account'], 'lang' => $supplier['lang'],
            ],
            'balance' => $bal,
            'carried' => round((float) $stmt->fetchColumn(), 2),
            'threshold' => $thr,
            'payout' => payout_state($id, $bal, $thr),
            'history' => $history,
            'month' => $month,
            'members' => $members,
            'messages' => $messages,
            'hotline' => setting('station_hotline'),
        ]);

    case 'send_message':
        $text = clean_text($in['text'] ?? '', 200);
        if ($text === '') {
            fail('empty');
        }
        add_message($id, 'in', $text);
        if (($in['keyword'] ?? '') === 'balance') {
            send_sms($supplier, 'balance', ['bal' => number_format(balance($id), 2)]);
        } elseif (($in['wants_call'] ?? false) === true) {
            send_sms($supplier, 'reply');
        }
        json_out(['ok' => true]);

    case 'mark_read':
        db()->prepare('UPDATE messages SET read_at = ? WHERE supplier_id = ? AND read_at IS NULL')->execute([now(), $id]);
        json_out(['ok' => true]);

    case 'set_lang':
        if (!in_array($in['lang'] ?? '', ['fil', 'ilo', 'en'], true)) {
            fail('bad_lang');
        }
        db()->prepare('UPDATE suppliers SET lang = ? WHERE id = ?')->execute([$in['lang'], $id]);
        json_out(['ok' => true]);
}
fail('unknown_action', 404);
