<?php
// GET /api/admin/me.php -> daxil olmuş müəllim və cari imtahan
require __DIR__ . '/../_admin.php';

$user = require_admin();
$exam = current_exam();

json_out(200, [
    'user' => $user,
    'exam' => $exam ? ['id' => (int) $exam['id'], 'name' => $exam['name'], 'date' => $exam['exam_date']] : null,
]);
