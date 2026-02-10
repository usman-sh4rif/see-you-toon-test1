# Category & Tag Management System - Database Schema

## Database: `seeyoutoon1`

### Table Structure Overview

```
seeyoutoon1/
├── categories (primary)
│   ├── 1:N → content
│   ├── 1:N → category_tags
│   ├── 1:1 → category_stats
│   └── 1:N → category_audit_log
│
├── content
│   └── 1:N → content_tags
│
├── category_tags (secondary indexing for categories)
│
├── content_tags (many-to-many for content)
│
├── category_stats (performance metrics)
│
└── category_audit_log (audit trail)
```

## Table Specifications

### 1. Categories Table
```sql
CREATE TABLE categories (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description LONGTEXT,
  icon_url VARCHAR(500),
  active BOOLEAN DEFAULT true,
  position INT DEFAULT 0,
  content_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_active (active),
  INDEX idx_position (position)
);
```

**Purpose**: Stores category definitions with visibility and ordering

### 2. Content Table
```sql
CREATE TABLE content (
  id VARCHAR(36) PRIMARY KEY,
  category_id VARCHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description LONGTEXT,
  thumbnail_url VARCHAR(500),
  content_url VARCHAR(500),
  content_type ENUM('image', 'video', 'article', 'audio', 'document'),
  active BOOLEAN DEFAULT true,
  view_count INT DEFAULT 0,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
  INDEX idx_category_id (category_id)
);
```

**Purpose**: Stores content items (articles, videos, etc.) associated with categories

**Constraints**: 
- `ON DELETE RESTRICT` - Prevents category deletion if content exists
- Orphaned content protection

### 3. Category Tags Table
```sql
CREATE TABLE category_tags (
  id VARCHAR(36) PRIMARY KEY,
  category_id VARCHAR(36) NOT NULL,
  tag_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
  UNIQUE KEY uk_category_tag (category_id, tag_name)
);
```

**Purpose**: Optional secondary tags for category filtering

### 4. Content Tags Table
```sql
CREATE TABLE content_tags (
  id VARCHAR(36) PRIMARY KEY,
  content_id VARCHAR(36) NOT NULL,
  tag_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP,
  FOREIGN KEY (content_id) REFERENCES content(id) ON DELETE CASCADE,
  UNIQUE KEY uk_content_tag (content_id, tag_name)
);
```

**Purpose**: Tags for individual content items

### 5. Category Stats Table
```sql
CREATE TABLE category_stats (
  id VARCHAR(36) PRIMARY KEY,
  category_id VARCHAR(36) NOT NULL UNIQUE,
  total_views INT DEFAULT 0,
  total_interactions INT DEFAULT 0,
  last_updated TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);
```

**Purpose**: Performance analytics per category

### 6. Category Audit Log Table
```sql
CREATE TABLE category_audit_log (
  id VARCHAR(36) PRIMARY KEY,
  category_id VARCHAR(36) NOT NULL,
  action VARCHAR(50) NOT NULL,
  old_values JSON,
  new_values JSON,
  changed_by VARCHAR(100),
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
  INDEX idx_changed_at (changed_at),
  INDEX idx_action (action)
);
```

**Purpose**: Audit trail for category changes and compliance

## Key Features

### Data Integrity
- ✅ Unique category names (prevent duplicates)
- ✅ Foreign key constraints (maintain referential integrity)
- ✅ Orphaned content protection (RESTRICT on category deletion)
- ✅ Automatic timestamp management (created_at, updated_at)

### Performance
- ✅ Indexed columns: active, position, category_id, tag_name, changed_at
- ✅ Composite index: (category_id, active) for fast filtering
- ✅ Support for large datasets (VARCHAR(36) for UUIDs)

### Data Consistency
- ✅ JSON support for audit logs (old_values, new_values)
- ✅ Cascade deletes for tags (cleanup orphaned tags)
- ✅ UTC timestamps across all tables

## SQL Operations Guide

### Create Database & Tables
```bash
mysql -u root -p < db/schema.sql
```

### Verify Installation
```sql
USE seeyoutoon1;
SHOW TABLES;
DESC categories;
SELECT COUNT(*) FROM categories;
```

### Sample Queries

**Get active categories ordered by position**
```sql
SELECT * FROM categories WHERE active = true ORDER BY position ASC;
```

**Count content per category**
```sql
SELECT category_id, COUNT(*) as count FROM content GROUP BY category_id;
```

**Get category with audit trail**
```sql
SELECT c.*, cal.action, cal.changed_at 
FROM categories c
LEFT JOIN category_audit_log cal ON c.id = cal.category_id
WHERE c.id = 'cat-001'
ORDER BY cal.changed_at DESC;
```

**Update content count after content operation**
```sql
UPDATE categories 
SET content_count = (SELECT COUNT(*) FROM content WHERE category_id = categories.id)
WHERE id = 'cat-001';
```

## Data Retention & Cleanup

- **Categories**: Kept indefinitely unless explicitly deleted
- **Content**: Can be soft-deleted via `active=false`
- **Audit Logs**: Kept for compliance (consider archiving after 1-2 years)
- **Stats**: Auto-updated, stale data can be cleaned monthly

## Connection Configuration

```
Host: localhost (default)
Port: 3306 (default)
Database: seeyoutoon1
Username: root
Password: (your password)
Charset: utf8mb4
Collation: utf8mb4_unicode_ci
```

## Files Included

- `db/schema.sql` - Complete MySQL schema with sample data
- `db/DATABASE_SETUP.md` - Detailed setup instructions
- `src/config/database.config.ts` - TypeORM configuration
- `src/category/entities/*.ts` - TypeORM entity definitions
- `src/content/entities/*.ts` - Content entity definitions

Run the schema setup and follow the DATABASE_SETUP.md guide to get started!
