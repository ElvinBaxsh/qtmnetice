-- QTM Nəticə: MySQL / MariaDB sxemi
-- cPanel: phpMyAdmin -> bazanı seçin -> Import -> bu faylı yükləyin

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS exams (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  exam_date DATE NOT NULL,
  -- 0 olarsa imtahan saytda görünmür
  published TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS results (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  exam_id INT UNSIGNED NOT NULL,
  is_nomresi VARCHAR(32) NOT NULL,
  soyadi VARCHAR(100) NOT NULL,
  adi VARCHAR(100) NOT NULL,
  sinif VARCHAR(20) NULL,
  bolme VARCHAR(50) NULL,
  variant VARCHAR(10) NULL,
  sections LONGTEXT NOT NULL,  -- JSON
  summary LONGTEXT NOT NULL,   -- JSON
  umumi_bal DECIMAL(8,2) NULL,
  published TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY exam_no (exam_id, is_nomresi),
  CONSTRAINT results_exam_fk FOREIGN KEY (exam_id) REFERENCES exams (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Axtarış limiti (iş nömrələrinin ardıcıl yoxlanmasının qarşısını alır)
CREATE TABLE IF NOT EXISTS rate_limits (
  ip VARCHAR(64) NOT NULL,
  window_start INT UNSIGNED NOT NULL,
  hits INT UNSIGNED NOT NULL,
  PRIMARY KEY (ip)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Açıq tipli suallara cavab faylları (müəllim admin paneldən yükləyir).
-- Faylın özü diskdə: files_dir/answers/<exam_id>/<is_nomresi>/<stored_name>
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
