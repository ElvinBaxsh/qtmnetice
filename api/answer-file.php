<?php
// GET /api/answer-file.php?no=1105&id=12[&download=1] -> tələbənin açıq tipli cavab faylı
require __DIR__ . '/_bootstrap.php';

$no = trim((string) ($_GET['no'] ?? ''));
$id = (int) ($_GET['id'] ?? 0);
if (!valid_no($no) || $id <= 0) {
    json_out(400, ['error' => 'bad_request']);
}

rate_limit();

$exam = current_exam();
if (!$exam) {
    json_out(404, ['error' => 'not_found']);
}
$examId = (int) $exam['id'];

// Fayl yalnız bu iş nömrəsinə aiddirsə və nəticə elan olunubsa verilir
$stmt = db()->prepare(
    'SELECT f.stored_name, f.mime FROM answer_files f
     JOIN results r ON r.exam_id = f.exam_id AND r.is_nomresi = f.is_nomresi AND r.published = 1
     WHERE f.id = ? AND f.exam_id = ? AND f.is_nomresi = ?'
);
$stmt->execute([$id, $examId, $no]);
$file = $stmt->fetch();
$path = $file ? answers_dir($examId, $no) . DIRECTORY_SEPARATOR . $file['stored_name'] : '';
if (!$file || !is_file($path)) {
    json_out(404, ['error' => 'not_found']);
}

$ext = ANSWER_FILE_TYPES[$file['mime']] ?? 'bin';
send_file($path, $file['mime'], "cavab-$no-$id.$ext", isset($_GET['download']));
