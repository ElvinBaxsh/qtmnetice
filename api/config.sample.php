<?php
// Bu faylı config.php adı ilə kopyalayın və dəyərləri doldurun.
// config.php git-ə düşmür.

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

    // Bir IP-dən dəqiqədə maksimum axtarış sayı
    'rate_limit_per_minute' => 20,
];
