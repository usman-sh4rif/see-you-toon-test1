# MySQL Database Setup Guide

## Prerequisites

- MySQL Server 8.0+ installed and running
- MySQL Client (command-line tool) or MySQL Workbench

## Quick Setup

### 1. Create Database and Tables

**Option A: Using MySQL CLI**

```bash
mysql -u root -p < db/schema.sql
```

**Option B: Using MySQL Workbench**
1. Open MySQL Workbench
2. Connect to your local MySQL server
3. Open the SQL Editor
4. Open and run `db/schema.sql`

**Option C: Copy-paste SQL**
```sql
-- Login to MySQL
mysql -u root -p

-- Then paste the contents of db/schema.sql
```

### 2. Verify Database Creation

```sql
USE seeyoutoon1;
SHOW TABLES;
SELECT * FROM categories;
```

Expected output: 5 sample categories (Comedy, Drama, Animation, Documentary, Uncategorized)

## Database Schema Overview

### Core Tables

#### `categories`
- Main table for category definitions
- Fields: id, name, description, icon_url, active, position, content_count, created_at, updated_at
- Indexes: active, position (for sorting and filtering)
- Sample data: 5 categories

#### `content`
- Articles, videos, images, etc. associated with categories
- Relationship: Many content items per category
- Foreign key: category_id (RESTRICT on delete to prevent orphaning)
- Sample data: 5 items

#### `category_tags`
- Optional tags for secondary categorization
- Relationship: Many tags per category
- Unique constraint: (category_id, tag_name)

#### `content_tags`
- Tags for individual content items
- Relationship: Many-to-many between content and tags
- Unique constraint: (content_id, tag_name)

#### `category_stats`
- Performance metrics per category
- Tracks: total_views, total_interactions
- One-to-one relationship with categories

#### `category_audit_log`
- Track all changes to categories (audit trail)
- Records: action (created/updated/deleted/enabled/disabled), old_values, new_values, changed_by

## Environment Setup

### 1. Copy Environment File
```bash
cp .env.example .env
```

### 2. Configure Database Connection
Edit `.env`:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_password
DB_NAME=seeyoutoon1
NODE_ENV=development
```

## Data Integrity Constraints

### Foreign Keys
- `content.category_id` → `categories.id`
  - ON DELETE: RESTRICT (prevent deleting category with content)
  - ON UPDATE: CASCADE (update content if category id changes)
  
- `category_tags.category_id` → `categories.id`
  - ON DELETE: CASCADE (delete tags if category is deleted)
  - ON UPDATE: CASCADE

### Unique Constraints
- `categories.name` - Category names must be unique
- `category_tags.category_id + tag_name` - No duplicate tags per category
- `content_tags.content_id + tag_name` - No duplicate tags per content

## API Integration

### Installation
```bash
npm install
```

### Start Application
```bash
npm run start:dev
```

### API Endpoints
- `GET /categories` - List all categories
- `POST /categories` - Create category
- `PUT /categories/:id` - Update category
- `DELETE /categories/:id` - Delete (with content reassignment)
- `POST /categories/:id/enable` - Enable category
- `POST /categories/:id/disable` - Disable category
- `POST /categories/reorder` - Reorder categories
- `GET /categories/stream` - Real-time updates via SSE

### Admin UI
Access at: http://localhost:3000/admin

## Troubleshooting

### Connection Issues
```bash
# Test MySQL connection
mysql -u root -p -h localhost -e "SELECT VERSION();"

# Check if seeyoutoon1 database exists
mysql -u root -p -e "SHOW DATABASES;"
```

### Reset Database
```sql
DROP DATABASE IF EXISTS seeyoutoon1;
-- Re-run schema.sql
```

### View Database Size
```sql
SELECT 
    table_schema as 'Database', 
    ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) as 'Size in MB'
FROM information_schema.TABLES 
WHERE table_schema = 'seeyoutoon1'
GROUP BY table_schema;
```

## Sample Data

The schema includes 5 sample categories with demo content:
1. **Comedy** - 2 content items
2. **Drama** - 1 content item
3. **Animation** - 1 content item
4. **Documentary** - 1 content item
5. **Uncategorized** - Default fallback (0 items)

## Performance Optimization

### Indexes
- `categories(active, position)` - Fast queries for active categories
- `content(category_id, active)` - Fast content filtering
- `category_tags(tag_name)` - Fast tag searches
- `category_audit_log(changed_at, action)` - Fast audit queries

### Query Examples

```sql
-- Get all active categories ordered by position
SELECT * FROM categories WHERE active = true ORDER BY position ASC;

-- Count content per category
SELECT category_id, COUNT(*) as content_count 
FROM content 
WHERE active = true 
GROUP BY category_id;

-- Get category with most views
SELECT c.id, c.name, cs.total_views 
FROM categories c
JOIN category_stats cs ON c.id = cs.category_id
ORDER BY cs.total_views DESC
LIMIT 1;

-- Audit trail for specific category
SELECT * FROM category_audit_log 
WHERE category_id = 'cat-001' 
ORDER BY changed_at DESC;
```

## Next Steps

1. ✅ Create database and tables (db/schema.sql)
2. ✅ Configure environment variables (.env)
3. ✅ Install dependencies (npm install)
4. Start application (npm run start:dev)
5. Access admin UI at http://localhost:3000/admin
6. Customize TypeORM entities for your specific needs

## Support

For issues with:
- **Database connection**: Check DB_* environment variables in .env
- **Schema errors**: Verify MySQL version (8.0+) and run schema.sql directly
- **API errors**: Check application logs (npm run start:dev)
