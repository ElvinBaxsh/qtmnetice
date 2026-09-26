<?php
// GET /api/admin/overview.php -> cari imtahanın tələbələri və hər birinin fayl sayı
require __DIR__ . '/../_admin.php';

require_admin();
$exam = admin_exam();

$stmt = db()->prepare(
    'SELECT r.is_nomresi, r.soyadi, r.adi, r.sinif, COUNT(f.id) AS files
     FROM results r
     LEFT JOIN answer_files f ON f.exam_id = r.exam_id AND f.is_nomresi = r.is_nomresi
     WHERE r.exam_id = ?
     GROUP BY r.id, r.is_nomresi, r.soyadi, r.adi, r.sinif
     ORDER BY r.is_nomresi'
);
$stmt->execute([$exam['id']]);

json_out(200, [
    'students' => array_map(fn(array $r) => [
        'no' => $r['is_nomresi'],
        'soyadi' => $r['soyadi'],
        'adi' => $r['adi'],
        'sinif' => $r['sinif'] ?? '',
        'files' => (int) $r['files'],
    ], $stmt->fetchAll()),
]);
