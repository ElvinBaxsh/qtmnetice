<?php
// GET /api/admin/file.php?id=12 -> müəllim üçün faylın özü (önizləmə)
require __DIR__ . '/../_admin.php';

require_admin();
$exam = admin_exam();
$examId = (int) $exam['id'];

$stmt = db()->prepare('SELECT is_nomresi, stored_name, original_name, mime FROM answer_files WHERE id = ? AND exam_id = ?');
$stmt->execute([(int) ($_GET['id'] ?? 0), $examId]);
$file = $stmt->fetch();
$path = $file ? answers_dir($examId, $file['is_nomresi']) . DIRECTORY_SEPARATOR . $file['stored_name'] : '';
if (!$file || !is_file($path)) {
    json_out(404, ['error' => 'not_found']);
}

send_file($path, $file['mime'], $file['original_name'], isset($_GET['download']));
