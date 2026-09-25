<?php
declare(strict_types=1);

// Xəta detalları istifadəçiyə göstərilmir, yalnız server loguna yazılır
ini_set('display_errors', '0');
set_exception_handler(function (Throwable $e): void {
    error_log('API error: ' . $e->getMessage());
    if (!headers_sent()) {
        http_response_code(500);
        header('Content-Type: application/json; charset=utf-8');
    }
    echo json_encode(['error' => 'server']);
});

$config = require __DIR__ . '/config.php';

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

if (!empty($config['cors_origin'])) {
    header('Access-Control-Allow-Origin: ' . $config['cors_origin']);
    header('Vary: Origin');
}

function json_out(int $status, array $body): void
{
    http_response_code($status);
    echo json_encode($body, JSON_UNESCAPED_UNICODE);
    exit;
}

function db(): PDO
{
    global $config;
    static $pdo = null;
    if ($pdo === null) {
        try {
            $pdo = new PDO(
                "mysql:host={$config['db_host']};dbname={$config['db_name']};charset=utf8mb4",
                $config['db_user'],
                $config['db_pass'],
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                ]
            );
        } catch (PDOException $e) {
            error_log('DB connection failed: ' . $e->getMessage());
            json_out(500, ['error' => 'server']);
        }
    }
    return $pdo;
}

// Bir IP-dən dəqiqədə limitdən çox sorğunu rədd edir
function rate_limit(): void
{
    global $config;
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $window = intdiv(time(), 60) * 60;

    $pdo = db();
    $pdo->prepare(
        'INSERT INTO rate_limits (ip, window_start, hits) VALUES (?, ?, 1)
         ON DUPLICATE KEY UPDATE
           hits = IF(window_start = VALUES(window_start), hits + 1, 1),
           window_start = VALUES(window_start)'
    )->execute([$ip, $window]);

    $stmt = $pdo->prepare('SELECT hits FROM rate_limits WHERE ip = ?');
    $stmt->execute([$ip]);
    $hits = (int) $stmt->fetchColumn();

    if (mt_rand(1, 100) === 1) {
        $pdo->prepare('DELETE FROM rate_limits WHERE window_start < ?')->execute([$window - 3600]);
    }

    if ($hits > (int) ($config['rate_limit_per_minute'] ?? 20)) {
        json_out(429, ['error' => 'too_many_requests']);
    }
}

// İş nömrəsi yalnız hərf, rəqəm və tire ola bilər (fayl yolu kimi də istifadə olunur)
function valid_no(string $no): bool
{
    return (bool) preg_match('/^[0-9A-Za-z-]{1,32}$/', $no);
}

// Ən son dərc olunmuş imtahan
function current_exam(): ?array
{
    $row = db()->query(
        'SELECT id, name, exam_date FROM exams WHERE published = 1 ORDER BY exam_date DESC, id DESC LIMIT 1'
    )->fetch();
    return $row ?: null;
}

// Şəkil/PDF nəticə faylı: files_dir/<imtahan id>/<iş nömrəsi>.<ext>
const RESULT_FILE_TYPES = ['png' => 'image/png', 'jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg', 'pdf' => 'application/pdf'];

function find_result_file(int $examId, string $no): ?array
{
    global $config;
    $dir = rtrim((string) ($config['files_dir'] ?? ''), '/\\') . DIRECTORY_SEPARATOR . $examId;
    foreach (RESULT_FILE_TYPES as $ext => $mime) {
        foreach ([$ext, strtoupper($ext)] as $e) {
            $path = $dir . DIRECTORY_SEPARATOR . $no . '.' . $e;
            if (is_file($path)) {
                return ['path' => $path, 'ext' => $ext, 'mime' => $mime];
            }
        }
    }
    return null;
}
