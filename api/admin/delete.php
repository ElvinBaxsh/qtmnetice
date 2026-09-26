<?php
// POST /api/admin/delete.php  { id }
require __DIR__ . '/../_admin.php';

require_admin();
require_post();
$exam = admin_exam();
$examId = (int) $exam['id'];

$id = (int) (json_body()['id'] ?? 0);
$stmt = db()->prepare('SELECT is_nomresi, stored_name FROM answer_files WHERE id = ? AND exam_id = ?');
$stmt->execute([$id, $examId]);
$file = $stmt->fetch();
if (!$file) {
    json_out(404, ['error' => 'not_found']);
}

$path = answers_dir($examId, $file['is_nomresi']) . DIRECTORY_SEPARATOR . $file['stored_name'];
if (is_file($path)) {
    unlink($path);
}
db()->prepare('DELETE FROM answer_files WHERE id = ?')->execute([$id]);

json_out(200, ['files' => list_answer_files($examId, $file['is_nomresi'])]);
