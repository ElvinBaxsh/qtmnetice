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

// Konfiqurasiya (baza şifrəsi) mümkünsə public_html-dən kənarda saxlanır: /home/<user>/qtm-config.php.
// Yoxdursa api/config.php istifadə olunur (.htaccess ilə bağlıdır).
$configFile = dirname(__DIR__, 2) . DIRECTORY_SEPARATOR . 'qtm-config.php';
$config = require (is_file($configFile) ? $configFile : __DIR__ . '/config.php');

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

// Yalnız lokal inkişaf üçün (sayt localhost:3000-də, API XAMPP-da)
if (!empty($config['cors_origin'])) {
    header('Access-Control-Allow-Origin: ' . $config['cors_origin']);
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Headers: Content-Type, X-QTM');
    header('Access-Control-Allow-Methods: GET, POST');
    header('Vary: Origin');
    if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
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

// Sayğac: $key üçün cari $window saniyəlik pəncərədəki sorğu sayı ($increment = false olarsa artırmır)
function counter(string $key, int $window, bool $increment = true): int
{
    $start = intdiv(time(), $window) * $window;
    $pdo = db();
    if ($increment) {
        $pdo->prepare(
            'INSERT INTO rate_limits (ip, window_start, hits) VALUES (?, ?, 1)
             ON DUPLICATE KEY UPDATE
               hits = IF(window_start = VALUES(window_start), hits + 1, 1),
               window_start = VALUES(window_start)'
        )->execute([$key, $start]);
        if (mt_rand(1, 200) === 1) {
            $pdo->prepare('DELETE FROM rate_limits WHERE window_start < ?')->execute([time() - 86400]);
        }
    }
    $stmt = $pdo->prepare('SELECT hits FROM rate_limits WHERE ip = ? AND window_start = ?');
    $stmt->execute([$key, $start]);
    return (int) $stmt->fetchColumn();
}

// Bir IP-dən dəqiqəlik və saatlıq limitdən çox sorğunu rədd edir (iş nömrələrinin toplu yoxlanmasına qarşı).
// $bucket ayrı sayğac üçündür (məs. "login:")
function rate_limit(string $bucket = '', ?int $perMinute = null): void
{
    global $config;
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $perMinute ??= (int) ($config['rate_limit_per_minute'] ?? 20);
    $perHour = (int) ($config['rate_limit_per_hour'] ?? 300);

    if (counter("m:$bucket$ip", 60) > $perMinute || counter("h:$bucket$ip", 3600) > $perHour) {
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

// Açıq tipli suallara cavab faylları (müəllim yükləyir): files_dir/answers/<imtahan id>/<iş nömrəsi>/
const ANSWER_FILE_TYPES = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp', 'application/pdf' => 'pdf'];

function answers_dir(int $examId, string $no): string
{
    global $config;
    return rtrim((string) ($config['files_dir'] ?? ''), '/\\') . DIRECTORY_SEPARATOR . 'answers'
        . DIRECTORY_SEPARATOR . $examId . DIRECTORY_SEPARATOR . $no;
}

function list_answer_files(int $examId, string $no): array
{
    $stmt = db()->prepare(
        'SELECT id, mime, original_name, size_bytes FROM answer_files WHERE exam_id = ? AND is_nomresi = ? ORDER BY id'
    );
    $stmt->execute([$examId, $no]);
    return array_map(fn(array $r) => [
        'id' => (int) $r['id'],
        'mime' => $r['mime'],
        'name' => $r['original_name'],
        'size' => (int) $r['size_bytes'],
    ], $stmt->fetchAll());
}

// Faylı brauzerə göndərir (JSON başlıqlarının üstündən yazır)
function send_file(string $path, string $mime, string $downloadName, bool $download): void
{
    header('Content-Type: ' . $mime);
    header('Content-Length: ' . filesize($path));
    // Ad başlığa düşür: dırnaq, sətir sonu və s. təmizlənir; UTF-8 ad ayrıca verilir
    $ascii = preg_replace('/[^A-Za-z0-9._-]+/', '_', $downloadName) ?: 'fayl';
    header('Content-Disposition: ' . ($download ? 'attachment' : 'inline')
        . '; filename="' . $ascii . '"; filename*=UTF-8\'\'' . rawurlencode($downloadName));
    header('Cache-Control: private, no-store');
    // Şəkil heç vaxt skript kimi işləməsin (sandbox); PDF-də Chrome-un öz görüntüləyicisi işləsin deyə sandbox qoyulmur
    if (str_starts_with($mime, 'image/')) {
        header("Content-Security-Policy: sandbox; default-src 'none'; img-src 'self'; style-src 'unsafe-inline'");
    }
    header('X-Frame-Options: SAMEORIGIN');
    readfile($path);
    exit;
}
