-- Artıq qurulmuş baza üçün: admin panel (cavab faylları) əlavəsi.
-- Yeni quruluşda lazım deyil — schema.sql bunu özündə saxlayır.
SET NAMES utf8mb4;

ALTER TABLE rate_limits MODIFY ip VARCHAR(64) NOT NULL;

CREATE TABLE IF NOT EXISTS answer_files (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  exam_id INT UNSIGNED NOT NULL,
  is_nomresi VARCHAR(32) NOT NULL,
  stored_name VARCHAR(64) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  mime VARCHAR(50) NOT NULL,
  size_bytes INT UNSIGNED NOT NULL,
  uploaded_by VARCHAR(64) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY student (exam_id, is_nomresi),
  CONSTRAINT answer_files_exam_fk FOREIGN KEY (exam_id) REFERENCES exams (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
