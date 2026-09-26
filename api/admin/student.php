<?php
// GET /api/admin/student.php?no=1105 -> tələbə və onun cavab faylları
require __DIR__ . '/../_admin.php';

require_admin();
$exam = admin_exam();

$no = trim((string) ($_GET['no'] ?? ''));
if (!valid_no($no)) {
    json_out(400, ['error' => 'bad_request']);
}

$student = admin_student((int) $exam['id'], $no);
if (!$student) {
    json_out(404, ['error' => 'not_found']);
}

json_out(200, [
    'no' => $student['is_nomresi'],
    'soyadi' => $student['soyadi'],
    'adi' => $student['adi'],
    'sinif' => $student['sinif'] ?? '',
    'files' => list_answer_files((int) $exam['id'], $no),
]);
