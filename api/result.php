<?php
// GET /api/result.php?no=1125
// Cavab: { kind: "sheet", result: {...} } və ya { kind: "file", ext: "png" }
require __DIR__ . '/_bootstrap.php';

$no = trim((string) ($_GET['no'] ?? ''));
if (!valid_no($no)) {
    json_out(400, ['error' => 'bad_request']);
}

rate_limit();

$exam = current_exam();
if (!$exam) {
    json_out(404, ['error' => 'not_found']);
}

$stmt = db()->prepare('SELECT * FROM results WHERE exam_id = ? AND is_nomresi = ? AND published = 1');
$stmt->execute([$exam['id'], $no]);
$row = $stmt->fetch();

if ($row) {
    json_out(200, [
        'kind' => 'sheet',
        'result' => [
            'isNomresi' => $row['is_nomresi'],
            'imtahan' => $exam['name'],
            'kecirilmeTarixi' => $exam['exam_date'],
            'bolme' => $row['bolme'] ?? '',
            'soyadi' => $row['soyadi'],
            'adi' => $row['adi'],
            'sinif' => $row['sinif'] ?? '',
            'variant' => $row['variant'] ?? '',
            'sections' => json_decode($row['sections'], true) ?? [],
            'summary' => json_decode($row['summary'], true) ?? [],
            'umumiBal' => (float) ($row['umumi_bal'] ?? 0),
        ],
        // Açıq tipli suallara cavab faylları (müəllim yükləyir)
        'answerFiles' => array_map(
            fn(array $f) => ['id' => $f['id'], 'mime' => $f['mime']],
            list_answer_files((int) $exam['id'], $no)
        ),
    ]);
}

$file = find_result_file((int) $exam['id'], $no);
if ($file) {
    json_out(200, ['kind' => 'file', 'ext' => $file['ext']]);
}

json_out(404, ['error' => 'not_found']);
