-- Create database
CREATE DATABASE IF NOT EXISTS seeyoutoon1;
USE seeyoutoon1;

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id VARCHAR(36) PRIMARY KEY COMMENT 'UUID',
  name VARCHAR(255) NOT NULL UNIQUE COMMENT 'Category name',
  description LONGTEXT COMMENT 'Category description',
  icon_url VARCHAR(500) COMMENT 'URL to category icon image',
  active BOOLEAN DEFAULT true COMMENT 'Visibility toggle for mobile apps',
  position INT NOT NULL DEFAULT 0 COMMENT 'Display order priority',
  content_count INT DEFAULT 0 COMMENT 'Number of items in category',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_active (active),
  KEY idx_position (position)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Category definitions';

-- Content table (articles, videos, images, etc.)
CREATE TABLE IF NOT EXISTS content (
  id VARCHAR(36) PRIMARY KEY COMMENT 'UUID',
  category_id VARCHAR(36) NOT NULL COMMENT 'Foreign key to categories',
  title VARCHAR(255) NOT NULL COMMENT 'Content title',
  description LONGTEXT COMMENT 'Content description',
  thumbnail_url VARCHAR(500) COMMENT 'URL to thumbnail image',
  content_url VARCHAR(500) COMMENT 'URL to actual content',
  content_type ENUM('image', 'video', 'article', 'audio', 'document') DEFAULT 'article' COMMENT 'Type of content',
  active BOOLEAN DEFAULT true COMMENT 'Visibility in mobile apps',
  view_count INT DEFAULT 0 COMMENT 'Number of views',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_content_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  KEY idx_category_id (category_id),
  KEY idx_active (active),
  KEY idx_content_type (content_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Content items belonging to categories';

-- Category tags table (for secondary categorization)
CREATE TABLE IF NOT EXISTS category_tags (
  id VARCHAR(36) PRIMARY KEY COMMENT 'UUID',
  category_id VARCHAR(36) NOT NULL COMMENT 'Foreign key to categories',
  tag_name VARCHAR(100) NOT NULL COMMENT 'Tag name',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_tag_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE ON UPDATE CASCADE,
  KEY idx_category_id (category_id),
  KEY idx_tag_name (tag_name),
  UNIQUE KEY uk_category_tag (category_id, tag_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tags associated with categories for filtering';

-- Content tags table (many-to-many between content and tags)
CREATE TABLE IF NOT EXISTS content_tags (
  id VARCHAR(36) PRIMARY KEY COMMENT 'UUID',
  content_id VARCHAR(36) NOT NULL COMMENT 'Foreign key to content',
  tag_name VARCHAR(100) NOT NULL COMMENT 'Tag name',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_content_tag_content FOREIGN KEY (content_id) REFERENCES content(id) ON DELETE CASCADE ON UPDATE CASCADE,
  KEY idx_content_id (content_id),
  KEY idx_tag_name (tag_name),
  UNIQUE KEY uk_content_tag (content_id, tag_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tags associated with content items';

-- Category statistics table (for analytics)
CREATE TABLE IF NOT EXISTS category_stats (
  id VARCHAR(36) PRIMARY KEY COMMENT 'UUID',
  category_id VARCHAR(36) NOT NULL UNIQUE COMMENT 'Foreign key to categories',
  total_views INT DEFAULT 0 COMMENT 'Total views across all content in category',
  total_interactions INT DEFAULT 0 COMMENT 'Total user interactions',
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_stats_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Category performance statistics';

-- Category history/audit table (track changes)
CREATE TABLE IF NOT EXISTS category_audit_log (
  id VARCHAR(36) PRIMARY KEY COMMENT 'UUID',
  category_id VARCHAR(36) NOT NULL COMMENT 'Category being modified',
  action VARCHAR(50) NOT NULL COMMENT 'Action: created, updated, deleted, enabled, disabled',
  old_values JSON COMMENT 'Previous values of changed fields',
  new_values JSON COMMENT 'New values of changed fields',
  changed_by VARCHAR(100) COMMENT 'User who made the change',
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_audit_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE ON UPDATE CASCADE,
  KEY idx_category_id (category_id),
  KEY idx_changed_at (changed_at),
  KEY idx_action (action)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Audit log for category changes';

-- Indexes for common queries
CREATE INDEX idx_categories_active_position ON categories(active, position);
CREATE INDEX idx_content_category_active ON content(category_id, active);

-- Insert sample data
INSERT INTO categories (id, name, description, active, position) VALUES
('cat-001', 'Comedy', 'Funny and entertaining content', true, 1),
('cat-002', 'Drama', 'Dramatic stories and series', true, 2),
('cat-003', 'Animation', 'Animated content for all ages', true, 3),
('cat-004', 'Documentary', 'Educational and informative content', true, 4),
('cat-005', 'Uncategorized', 'Default category for unassigned content', true, 99);

-- Insert sample content
INSERT INTO content (id, category_id, title, description, content_type, active) VALUES
('cont-001', 'cat-001', 'Funny Moments Compilation', 'A collection of hilarious moments', 'video', true),
('cont-002', 'cat-001', 'Comedy Sketches', 'Short comedy sketches', 'video', true),
('cont-003', 'cat-002', 'Mystery Story', 'An engaging mystery drama', 'article', true),
('cont-004', 'cat-003', 'Anime Episode 1', 'First episode of popular anime', 'video', true),
('cont-005', 'cat-004', 'Nature Documentary', 'Exploring wildlife', 'video', true);

-- Insert category stats
INSERT INTO category_stats (id, category_id, total_views, total_interactions) VALUES
('stat-001', 'cat-001', 1500, 450),
('stat-002', 'cat-002', 1200, 380),
('stat-003', 'cat-003', 2000, 650),
('stat-004', 'cat-004', 800, 250),
('stat-005', 'cat-005', 0, 0);

-- Verify tables were created
SHOW TABLES;
SELECT * FROM categories;
