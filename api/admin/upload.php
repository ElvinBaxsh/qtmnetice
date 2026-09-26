<?php
// POST /api/admin/upload.php  (multipart: no, files[])
require __DIR__ . '/../_admin.php';

$user = require_admin();
require_post();
$exam = admin_exam();
$examId = (int) $exam['id'];

// Sorğu PHP-nin post_max_size limitini keçəndə $_POST və $_FILES boş gəlir
if (empty($_POST) && empty($_FILES) && (int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > 0) {
    json_out(413, ['error' => 'too_large']);
}

$no = trim((string) ($_POST['no'] ?? ''));
if (!valid_no($no) || !admin_student($examId, $no)) {
    json_out(400, ['error' => 'bad_student']);
}

$uploads = $_FILES['files'] ?? null;
if (!is_array($uploads) || !is_array($uploads['name'] ?? null)) {
    json_out(400, ['error' => 'no_files']);
}

const MAX_FILES_PER_STUDENT = 30;
$maxBytes = (int) ($config['max_upload_mb'] ?? 10) * 1024 * 1024;

$count = db()->prepare('SELECT COUNT(*) FROM answer_files WHERE exam_id = ? AND is_nomresi = ?');
$count->execute([$examId, $no]);
$existing = (int) $count->fetchColumn();
if ($existing + count($uploads['name']) > MAX_FILES_PER_STUDENT) {
    json_out(400, ['error' => 'too_many_files']);
}

$dir = answers_dir($examId, $no);
if (!is_dir($dir) && !mkdir($dir, 0750, true) && !is_dir($dir)) {
    throw new RuntimeException("Qovluq yaradıla bilmədi: $dir");
}

$finfo = new finfo(FILEINFO_MIME_TYPE);
$insert = db()->prepare(
    'INSERT INTO answer_files (exam_id, is_nomresi, stored_name, original_name, mime, size_bytes, uploaded_by)
     VALUES (?, ?, ?, ?, ?, ?, ?)'
);

$rejected = [];
foreach ($uploads['name'] as $i => $originalName) {
    $originalName = mb_substr(basename((string) $originalName), 0, 200);
    $tmp = $uploads['tmp_name'][$i] ?? '';
    $error = $uploads['error'][$i] ?? UPLOAD_ERR_NO_FILE;
    $size = (int) ($uploads['size'][$i] ?? 0);

    if ($error === UPLOAD_ERR_INI_SIZE || $error === UPLOAD_ERR_FORM_SIZE) {
        $rejected[] = ['name' => $originalName, 'reason' => 'too_large'];
        continue;
    }
    if ($error !== UPLOAD_ERR_OK || !is_uploaded_file($tmp)) {
        $rejected[] = ['name' => $originalName, 'reason' => 'upload_error'];
        continue;
    }
    if ($size <= 0 || $size > $maxBytes) {
        $rejected[] = ['name' => $originalName, 'reason' => 'too_large'];
        continue;
    }
    // Növ faylın adına görə yox, məzmununa görə yoxlanır
    $mime = (string) $finfo->file($tmp);
    $ext = ANSWER_FILE_TYPES[$mime] ?? null;
    if ($ext === null) {
        $rejected[] = ['name' => $originalName, 'reason' => 'bad_type'];
        continue;
    }

    $storedName = bin2hex(random_bytes(16)) . '.' . $ext;
    if (!move_uploaded_file($tmp, $dir . DIRECTORY_SEPARATOR . $storedName)) {
        $rejected[] = ['name' => $originalName, 'reason' => 'upload_error'];
        continue;
    }
    $insert->execute([$examId, $no, $storedName, $originalName, $mime, $size, $user]);
}

json_out(200, ['files' => list_answer_files($examId, $no), 'rejected' => $rejected]);
