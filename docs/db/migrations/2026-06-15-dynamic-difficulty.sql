-- Tạo bảng danh mục độ khó
CREATE TABLE IF NOT EXISTS lms_difficulties (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  color_code VARCHAR(7) DEFAULT '#888888',
  display_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Nạp dữ liệu ban đầu tương thích với dữ liệu hiện tại
INSERT INTO lms_difficulties (name, color_code, display_order)
VALUES 
  ('Dễ', '#22c55e', 1),
  ('Trung Bình', '#eab308', 2),
  ('Khó', '#ef4444', 3)
ON DUPLICATE KEY UPDATE 
  color_code = VALUES(color_code),
  display_order = VALUES(display_order);
