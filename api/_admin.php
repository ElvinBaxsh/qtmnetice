<?php
// Admin (müəllim) endpointləri üçün ortaq kod: sessiya, giriş yoxlaması, CSRF qoruması
declare(strict_types=1);

require __DIR__ . '/_bootstrap.php';

const ADMIN_IDLE_SECONDS = 2 * 3600;   // 2 saat fəaliyyət olmasa çıxış
const ADMIN_MAX_SECONDS = 12 * 3600;   // girişdən 12 saat sonra hər halda çıxış
const LOGIN_MAX_FAILS = 5;             // bir hesaba 15 dəqiqədə 5 səhv cəhd -> 15 dəqiqəlik bağlanma
const LOGIN_FAIL_WINDOW = 900;

function admin_session_start(): void
{
    $https = ($_SERVER['HTTPS'] ?? '') !== '' && ($_SERVER['HTTPS'] ?? '') !== 'off';
    ini_set('session.use_strict_mode', '1');     // tanımadığı sessiya ID-sini qəbul etmir
    ini_set('session.use_only_cookies', '1');
    ini_set('session.cookie_httponly', '1');
    session_name('QTMADMIN');
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'secure' => $https,
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    session_start();
}

// Daxil olmuş müəllimin adı, yoxdursa 401
function require_admin(): string
{
    admin_session_start();
    $user = $_SESSION['admin'] ?? null;
    $last = (int) ($_SESSION['last_seen'] ?? 0);
    $loginAt = (int) ($_SESSION['login_at'] ?? 0);
    if (!is_string($user) || time() - $last > ADMIN_IDLE_SECONDS || time() - $loginAt > ADMIN_MAX_SECONDS) {
        $_SESSION = [];
        json_out(401, ['error' => 'unauthorized']);
    }
    $_SESSION['last_seen'] = time();
    return $user;
}

// Dəyişiklik edən sorğular yalnız POST və bizim səhifədən (xüsusi başlıq) — başqa saytın formu bunu göndərə bilməz
function require_post(): void
{
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST' || ($_SERVER['HTTP_X_QTM'] ?? '') !== '1') {
        json_out(400, ['error' => 'bad_request']);
    }
}

function json_body(): array
{
    $data = json_decode((string) file_get_contents('php://input'), true);
    return is_array($data) ? $data : [];
}

// Admin cari imtahanın bütün tələbələri ilə işləyir (nəticə elan olunmasa da)
function admin_student(int $examId, string $no): ?array
{
    $stmt = db()->prepare('SELECT is_nomresi, soyadi, adi, sinif FROM results WHERE exam_id = ? AND is_nomresi = ?');
    $stmt->execute([$examId, $no]);
    $row = $stmt->fetch();
    return $row ?: null;
}

function admin_exam(): array
{
    $exam = current_exam();
    if (!$exam) {
        json_out(404, ['error' => 'no_exam']);
    }
    return $exam;
}
