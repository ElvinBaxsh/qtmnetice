<?php
// GET /api/file.php?no=1125[&download=1] -> nəticə şəkli/PDF-i
require __DIR__ . '/_bootstrap.php';

$no = trim((string) ($_GET['no'] ?? ''));
if (!valid_no($no)) {
    json_out(400, ['error' => 'bad_request']);
}

rate_limit();

$exam = current_exam();
$file = $exam ? find_result_file((int) $exam['id'], $no) : null;
if (!$file) {
    json_out(404, ['error' => 'not_found']);
}

$disposition = isset($_GET['download']) ? 'attachment' : 'inline';
header('Content-Type: ' . $file['mime']);
header('Content-Length: ' . filesize($file['path']));
header("Content-Disposition: $disposition; filename=\"netice-$no.{$file['ext']}\"");
header('Cache-Control: private, no-store');
readfile($file['path']);
