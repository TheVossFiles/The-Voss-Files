/**
 * Database connection module for THE VOSS FILES.
 * Uses better-sqlite3 for synchronous, fast SQLite access.
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const DB_PATH = path.resolve(__dirname, '..', process.env.DB_PATH || './db/vossfiles.db');

// Ensure the db directory exists
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(DB_PATH);

// Enable WAL mode and foreign keys
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

/**
 * Initialize schema from schema.sql if tables don't exist yet.
 */
function initSchema() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  db.exec(schema);
}

// Run schema on first require
initSchema();

module.exports = db;
