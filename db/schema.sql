-- ============================================================
-- THE VOSS FILES — Database Schema
-- SQLite with foreign keys and indexes
-- ============================================================

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- Users
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  username      TEXT    NOT NULL UNIQUE COLLATE NOCASE,
  email         TEXT    NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT    NOT NULL,
  role          TEXT    NOT NULL DEFAULT 'player' CHECK(role IN ('player','admin')),
  is_active     INTEGER NOT NULL DEFAULT 1,
  api_token     TEXT    UNIQUE,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_api_token ON users(api_token);

-- Chapters
CREATE TABLE IF NOT EXISTS chapters (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  slug        TEXT    NOT NULL UNIQUE,
  title       TEXT    NOT NULL,
  setting     TEXT,
  summary     TEXT,
  mechanic    TEXT,
  status      TEXT    NOT NULL DEFAULT 'Planned' CHECK(status IN ('Planned','In development','Playable')),
  sort_order  INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_chapters_sort ON chapters(sort_order);

-- Builds (downloadable game files)
-- Builds index
-- (table definition)
CREATE TABLE IF NOT EXISTS builds (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  version      TEXT    NOT NULL,
  platform     TEXT    NOT NULL CHECK(platform IN ('Windows','Android')),
  release_date TEXT,
  file_path    TEXT,
  file_size    TEXT,
  notes        TEXT,
  is_published INTEGER NOT NULL DEFAULT 0,
  created_at   TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- Blog posts
CREATE TABLE IF NOT EXISTS blog_posts (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  title        TEXT    NOT NULL,
  slug         TEXT    NOT NULL UNIQUE,
  body         TEXT    NOT NULL,
  author_id    INTEGER NOT NULL,
  is_published INTEGER NOT NULL DEFAULT 0,
  created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_posts_published ON blog_posts(is_published, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_slug ON blog_posts(slug);

-- Comments on blog posts
CREATE TABLE IF NOT EXISTS comments (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id    INTEGER NOT NULL,
  user_id    INTEGER NOT NULL,
  body       TEXT    NOT NULL,
  created_at TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (post_id) REFERENCES blog_posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id, created_at);

-- Screenshots
CREATE TABLE IF NOT EXISTS screenshots (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  chapter_id INTEGER,
  caption    TEXT,
  file_path  TEXT    NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_screenshots_sort ON screenshots(sort_order);

-- Scores (leaderboard)
CREATE TABLE IF NOT EXISTS scores (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id      INTEGER NOT NULL,
  chapter_id   INTEGER NOT NULL,
  time_seconds REAL    NOT NULL CHECK(time_seconds > 0),
  hints_used   INTEGER NOT NULL DEFAULT 0 CHECK(hints_used >= 0),
  created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id)    REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_scores_chapter ON scores(chapter_id, time_seconds);
CREATE INDEX IF NOT EXISTS idx_scores_user ON scores(user_id);

-- Feedback
CREATE TABLE IF NOT EXISTS feedback (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER,
  type       TEXT    NOT NULL CHECK(type IN ('bug','review','suggestion')),
  rating     INTEGER CHECK(rating BETWEEN 1 AND 5),
  message    TEXT    NOT NULL,
  status     TEXT    NOT NULL DEFAULT 'open' CHECK(status IN ('open','resolved')),
  created_at TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_builds_published ON builds(is_published, release_date DESC);
