<?php
// Backs the launcher page (index.html): reports whether the demo database exists and creates it on first run.
require_once __DIR__ . '/../_shared/bootstrap.php';
$action = api_start();

switch ($action) {
    case 'status':
        json_out(['ok' => true, 'ready' => db_ready()]);

    case 'install':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            fail('post_required', 405);
        }
        // Only on first run. Demo Controls has "Reset demo data" for reloading an existing database.
        if (db_ready()) {
            fail('already_installed', 409);
        }
        try {
            install_demo_data();
        } catch (Throwable $e) {
            error_log((string) $e);
            json_out(['ok' => false, 'error' => 'install_failed', 'message' => $e->getMessage()], 500);
        }
        json_out(['ok' => true, 'ready' => db_ready()]);
}
fail('unknown_action', 404);
