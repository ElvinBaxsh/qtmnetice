<?php
// POST /api/admin/login.php  { username, password }
require __DIR__ . '/../_admin.php';

require_post();
// Şifrə təxmin etməyə qarşı: bir IP-dən dəqiqədə 10 cəhd
rate_limit('login:', 10);

$body = json_body();
$username = trim((string) ($body['username'] ?? ''));
$password = (string) ($body['password'] ?? '');

// Hesab üzrə səhv cəhdlər (IP dəyişsə də işləyir): limit keçibsə yoxlamadan rədd edilir
$failKey = 'fail:' . substr(hash('sha256', mb_strtolower($username)), 0, 40);
if (counter($failKey, LOGIN_FAIL_WINDOW, false) >= LOGIN_MAX_FAILS) {
    json_out(429, ['error' => 'locked']);
}

$admins = $config['admins'] ?? [];
$hash = is_array($admins) ? ($admins[$username] ?? null) : null;

// İstifadəçi olmasa da hash yoxlaması aparılır ki, cavab vaxtından istifadəçi adı bilinməsin
$valid = password_verify($password, is_string($hash) ? $hash : '$2y$10$hvo8pbuMkJWEjmD1VHLEL.gkgNxaVGyjUoj404FlfavM/9P.8yJNW');
if (!is_string($hash) || !$valid) {
    counter($failKey, LOGIN_FAIL_WINDOW);
    json_out(401, ['error' => 'invalid_credentials']);
}

admin_session_start();
session_regenerate_id(true);
$_SESSION['admin'] = $username;
$_SESSION['last_seen'] = time();
$_SESSION['login_at'] = time();

json_out(200, ['user' => $username]);
