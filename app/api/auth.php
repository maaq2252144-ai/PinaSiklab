<?php
require_once __DIR__ . '/../includes/db.php';
$action = api_start();
$in = body();

switch ($action) {
    case 'request_code':
        $mobile = clean_text($in['mobile'] ?? '', 11);
        if (!valid_mobile($mobile)) {
            fail('bad_mobile');
        }
        $stmt = db()->prepare('SELECT status FROM suppliers WHERE mobile = ?');
        $stmt->execute([$mobile]);
        $status = $stmt->fetchColumn();
        if ($status === false) {
            fail('not_registered', 404);
        }
        if ($status !== 'active') {
            fail('not_active_' . $status, 403);
        }
        // Demo only: a real system would text a random code, not return a fixed one.
        json_out(['ok' => true, 'demo_code' => setting('demo_otp')]);

    case 'verify_code':
        $mobile = clean_text($in['mobile'] ?? '', 11);
        if (($in['code'] ?? '') !== setting('demo_otp')) {
            fail('bad_code');
        }
        $stmt = db()->prepare("SELECT id FROM suppliers WHERE mobile = ? AND status = 'active'");
        $stmt->execute([$mobile]);
        $id = $stmt->fetchColumn();
        if ($id === false) {
            fail('not_registered', 404);
        }
        session_regenerate_id(true);
        $_SESSION['supplier_id'] = $id;
        audit('supplier ' . $id, 'sign_in');
        json_out(['ok' => true]);

    case 'staff_login':
        $stmt = db()->prepare('SELECT s.id, s.name, s.station_id, t.name AS station FROM staff s JOIN stations t ON t.id = s.station_id WHERE s.pin = ?');
        $stmt->execute([clean_text($in['pin'] ?? '', 10)]);
        $staff = $stmt->fetch();
        if (!$staff) {
            fail('bad_pin');
        }
        session_regenerate_id(true);
        $_SESSION['staff'] = $staff;
        audit('staff ' . $staff['id'], 'sign_in');
        json_out(['ok' => true, 'staff' => $staff]);

    case 'logout':
        unset($_SESSION[($in['who'] ?? '') === 'staff' ? 'staff' : 'supplier_id']);
        json_out(['ok' => true]);
}
fail('unknown_action', 404);
