<?php
// Serverdə: bu faylı /home/<istifadəçi>/qtm-config.php kimi yükləyin (public_html-dən KƏNARDA) və doldurun.
// Lokalda: api/config.php kimi kopyalayın. Hər ikisi git-ə düşmür.

return [
    'db_host' => 'localhost',
    'db_name' => 'cpaneluser_qtm',
    'db_user' => 'cpaneluser_qtm',
    'db_pass' => '',

    // Şəkil/PDF nəticələrin qovluğu — public_html-dən KƏNARDA olmalıdır,
    // məsələn /home/cpaneluser/qtm-files. İçində: <imtahan id>/<iş nömrəsi>.png
    'files_dir' => __DIR__ . '/../../qtm-files',

    // Yalnız lokal inkişaf üçün (məs. 'http://localhost:3000'). Canlıda boş saxlayın.
    'cors_origin' => '',

    // Bir IP-dən maksimum axtarış sayı (dəqiqədə / saatda)
    'rate_limit_per_minute' => 20,
    'rate_limit_per_hour' => 300,

    // Admin panel (müəllimlər): istifadəçi adı => şifrənin hash-i.
    // Hash yaratmaq: php -r "echo password_hash('ŞİFRƏ', PASSWORD_DEFAULT);"
    // Şifrənin özünü buraya YAZMAYIN, yalnız hash-i.
    'admins' => [
        // 'muellim1' => '$2y$10$...',
    ],

    // Bir faylın maksimum ölçüsü (MB). Şəkillər yükləmədən əvvəl brauzerdə kiçildilir.
    'max_upload_mb' => 10,
];
