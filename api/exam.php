<?php
// GET /api/exam.php -> saytda göstərilən (ən son) imtahan
require __DIR__ . '/_bootstrap.php';

$exam = current_exam();
if (!$exam) {
    json_out(404, ['error' => 'not_found']);
}

json_out(200, ['id' => (int) $exam['id'], 'name' => $exam['name'], 'date' => $exam['exam_date']]);
