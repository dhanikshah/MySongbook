import Database from 'better-sqlite3';
import { Pool } from 'pg';
import path from 'path';

// Database type
type DbType = 'sqlite' | 'postgres';

// Detect database type from environment
const getDbType = (): DbType => {
  // Use PostgreSQL if DATABASE_URL is set (Railway provides this)
  if (process.env.DATABASE_URL) {
    console.log('🔍 DATABASE_URL detected, using PostgreSQL');
    console.log('🔍 DATABASE_URL:', process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@')); // Hide password
    return 'postgres';
  }
  // Use SQLite for local development
  console.log('⚠️ DATABASE_URL not set, using SQLite (data will be lost on redeploy)');
  return 'sqlite';
};

const dbType = getDbType();

// SQLite database (for local development)
let sqliteDb: Database.Database | null = null;

// PostgreSQL connection pool (for production)
let pgPool: Pool | null = null;

// Database interface abstraction
export interface DatabaseAdapter {
  exec(sql: string): Promise<void> | void;
  prepare(sql: string): PreparedStatement;
  close?(): void | Promise<void>;
}

// Prepared statement interface
export interface PreparedStatement {
  run(...params: any[]): Promise<{ changes: number; lastInsertRowid?: any }> | { changes: number; lastInsertRowid?: any };
  get(...params: any[]): Promise<any> | any;
  all(...params: any[]): Promise<any[]> | any[];
}

// SQLite adapter
class SQLiteAdapter implements DatabaseAdapter {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  exec(sql: string): void {
    this.db.exec(sql);
  }

  prepare(sql: string): PreparedStatement {
    const stmt = this.db.prepare(sql);
    return {
      run: (...params: any[]) => stmt.run(...params),
      get: (...params: any[]) => stmt.get(...params),
      all: (...params: any[]) => stmt.all(...params),
    };
  }

  close(): void {
    this.db.close();
  }
}

// PostgreSQL adapter
class PostgresAdapter implements DatabaseAdapter {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async exec(sql: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(sql);
    } finally {
      client.release();
    }
  }

  prepare(sql: string): PreparedStatement {
    // Convert SQLite-style ? placeholders to PostgreSQL $1, $2, etc.
    const convertSql = (sql: string, paramCount: number): string => {
      let paramIndex = 1;
      return sql.replace(/\?/g, () => `$${paramIndex++}`);
    };

    return {
      run: async (...params: any[]) => {
        const client = await this.pool.connect();
        try {
          const pgSql = convertSql(sql, params.length);
          const result = await client.query(pgSql, params);
          return {
            changes: result.rowCount || 0,
            lastInsertRowid: result.rows[0]?.id || null
          };
        } finally {
          client.release();
        }
      },
      get: async (...params: any[]) => {
        const client = await this.pool.connect();
        try {
          const pgSql = convertSql(sql, params.length);
          const result = await client.query(pgSql, params);
          return result.rows[0] || null;
        } finally {
          client.release();
        }
      },
      all: async (...params: any[]) => {
        const client = await this.pool.connect();
        try {
          const pgSql = convertSql(sql, params.length);
          const result = await client.query(pgSql, params);
          return result.rows;
        } finally {
          client.release();
        }
      }
    };
  }
}

// Initialize database based on type
export async function initDatabase() {
  console.log(`🔧 Initializing database (type: ${dbType})...`);
  if (dbType === 'postgres') {
    // Initialize PostgreSQL
    if (!pgPool) {
      pgPool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DATABASE_URL?.includes('railway') ? { rejectUnauthorized: false } : false,
      });
    }

    const client = await pgPool.connect();
    try {
      // Create songs table
      await client.query(`
        CREATE TABLE IF NOT EXISTS songs (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          artist TEXT NOT NULL,
          type TEXT NOT NULL CHECK(type IN ('lyrics', 'chords', 'tabs')),
          key TEXT NOT NULL,
          tags TEXT NOT NULL,
          rawFileUrl TEXT,
          extractedText TEXT NOT NULL,
          createdAt BIGINT NOT NULL,
          updatedAt BIGINT NOT NULL
        )
      `);

      // Create indexes
      await client.query(`CREATE INDEX IF NOT EXISTS idx_title ON songs(title)`);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_artist ON songs(artist)`);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_type ON songs(type)`);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_key ON songs(key)`);

      console.log('✅ PostgreSQL database initialized');
      console.log('✅ Tables and indexes created/verified');
    } catch (error) {
      console.error('❌ Error initializing PostgreSQL:', error);
      throw error;
    } finally {
      client.release();
    }
  } else {
    // Initialize SQLite
    if (!sqliteDb) {
      const dbPath = path.join(__dirname, 'songbook.db');
      console.log('⚠️ Using SQLite database at:', dbPath);
      console.log('⚠️ WARNING: SQLite data will be lost on Railway redeploy!');
      sqliteDb = new Database(dbPath);
    }

    // Create songs table
    sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS songs (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        artist TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('lyrics', 'chords', 'tabs')),
        key TEXT NOT NULL,
        tags TEXT NOT NULL,
        rawFileUrl TEXT,
        extractedText TEXT NOT NULL,
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL
      )
    `);

    // Create indexes
    sqliteDb.exec(`CREATE INDEX IF NOT EXISTS idx_title ON songs(title)`);
    sqliteDb.exec(`CREATE INDEX IF NOT EXISTS idx_artist ON songs(artist)`);
    sqliteDb.exec(`CREATE INDEX IF NOT EXISTS idx_type ON songs(type)`);
    sqliteDb.exec(`CREATE INDEX IF NOT EXISTS idx_key ON songs(key)`);

    console.log('✅ SQLite database initialized');
  }
}

// Get database adapter
export function getDb(): DatabaseAdapter {
  if (dbType === 'postgres') {
    if (!pgPool) {
      throw new Error('PostgreSQL pool not initialized. Call initDatabase() first.');
    }
    return new PostgresAdapter(pgPool);
  } else {
    if (!sqliteDb) {
      throw new Error('SQLite database not initialized. Call initDatabase() first.');
    }
    return new SQLiteAdapter(sqliteDb);
  }
}

// Close database connections
export async function closeDatabase(): Promise<void> {
  if (dbType === 'postgres' && pgPool) {
    await pgPool.end();
    pgPool = null;
  } else if (sqliteDb) {
    sqliteDb.close();
    sqliteDb = null;
  }
}
