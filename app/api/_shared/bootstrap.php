<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/sms.php';

date_default_timezone_set('Asia/Manila');

function db_server(): PDO
{
    return new PDO('mysql:host=' . DB_HOST . ';port=' . DB_PORT . ';charset=utf8mb4', DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
}

function db(): PDO
{
    static $pdo = null;
    if ($pdo === null) {
        $pdo = db_server();
        $pdo->exec('USE `' . DB_NAME . '`');
        $pdo->exec("SET time_zone = '+08:00'");
    }
    return $pdo;
}

// Creates the database if needed and reloads the schema and demo data.
function install_demo_data(): void
{
    $pdo = db_server();
    $pdo->exec('CREATE DATABASE IF NOT EXISTS `' . DB_NAME . '` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
    $pdo->exec('USE `' . DB_NAME . '`');
    $pdo->exec("SET time_zone = '+08:00'");
    foreach (['schema.sql', 'seed.sql'] as $file) {
        $sql = preg_replace('/^--.*$/m', '', file_get_contents(__DIR__ . '/../../database/' . $file));
        foreach (array_filter(array_map('trim', explode(";\n", str_replace("\r\n", "\n", $sql)))) as $statement) {
            $pdo->exec(rtrim($statement, ';'));
        }
    }
}

function db_ready(): bool
{
    try {
        db()->query('SELECT 1 FROM settings LIMIT 1');
        return true;
    } catch (Throwable $e) {
        return false;
    }
}

function json_out(array $data, int $code = 200): never
{
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function fail(string $error, int $code = 422): never
{
    json_out(['ok' => false, 'error' => $error], $code);
}

function body(): array
{
    $data = json_decode(file_get_contents('php://input') ?: '[]', true);
    return is_array($data) ? $data : [];
}

function api_start(): string
{
    session_start();
    set_exception_handler(function (Throwable $e) {
        error_log((string) $e);
        fail('server_error', 500);
    });
    return (string) ($_GET['action'] ?? '');
}

function now(): string
{
    return date('Y-m-d H:i:s');
}

function setting(string $key): ?string
{
    $stmt = db()->prepare('SELECT v FROM settings WHERE k = ?');
    $stmt->execute([$key]);
    $v = $stmt->fetchColumn();
    return $v === false ? null : $v;
}

function balance(string $supplierId): float
{
    $stmt = db()->prepare('SELECT COALESCE(SUM(amount), 0) FROM ledger_entries WHERE supplier_id = ?');
    $stmt->execute([$supplierId]);
    return round((float) $stmt->fetchColumn(), 2);
}

function rate_at(string $when): array
{
    $stmt = db()->prepare('SELECT * FROM rates WHERE effective_at <= ? ORDER BY effective_at DESC, id DESC LIMIT 1');
    $stmt->execute([$when]);
    $row = $stmt->fetch();
    if (!$row) {
        throw new RuntimeException('No rate in effect at ' . $when);
    }
    return $row;
}

function audit(string $actor, string $action, string $detail = ''): void
{
    db()->prepare('INSERT INTO audit_log (actor, action, detail, created_at) VALUES (?, ?, ?, ?)')
        ->execute([$actor, $action, mb_substr($detail, 0, 240), now()]);
}

function get_supplier(string $id): ?array
{
    $stmt = db()->prepare('SELECT * FROM suppliers WHERE id = ?');
    $stmt->execute([$id]);
    return $stmt->fetch() ?: null;
}

function add_ledger(string $supplierId, string $type, float $amount, ?int $dropoffId, ?int $payoutId, string $note): void
{
    db()->prepare('INSERT INTO ledger_entries (supplier_id, type, amount, dropoff_id, payout_id, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
        ->execute([$supplierId, $type, $amount, $dropoffId, $payoutId, $note, now()]);
}

function require_staff(): array
{
    if (empty($_SESSION['staff'])) {
        fail('not_logged_in', 401);
    }
    return $_SESSION['staff'];
}

function require_supplier(): string
{
    if (empty($_SESSION['supplier_id'])) {
        fail('not_logged_in', 401);
    }
    return $_SESSION['supplier_id'];
}

function valid_mobile(string $mobile): bool
{
    return (bool) preg_match('/^09\d{9}$/', $mobile);
}

function clean_text($value, int $max = 100): string
{
    return mb_substr(trim((string) $value), 0, $max);
}
