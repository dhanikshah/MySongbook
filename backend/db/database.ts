import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = path.join(__dirname, 'songbook.db');
const db = new Database(dbPath);

export function initDatabase() {
  // Create songs table
  db.exec(`
    CREATE TABLE IF NOT EXISTS songs (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      artist TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('lyrics', 'chords', 'tabs')),
      key TEXT NOT NULL,
      tags TEXT NOT NULL, -- JSON array
      rawFileUrl TEXT,
      extractedText TEXT NOT NULL,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    )
  `);

  // Create indexes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_title ON songs(title);
    CREATE INDEX IF NOT EXISTS idx_artist ON songs(artist);
    CREATE INDEX IF NOT EXISTS idx_type ON songs(type);
    CREATE INDEX IF NOT EXISTS idx_key ON songs(key);
  `);

  console.log('✅ Database initialized');
}

export function getDb() {
  return db;
}

