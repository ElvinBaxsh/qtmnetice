<?php
// POST /api/admin/logout.php
require __DIR__ . '/../_admin.php';

require_post();
admin_session_start();
$_SESSION = [];
session_destroy();

json_out(200, ['ok' => true]);
