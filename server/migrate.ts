import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import mysql, { type RowDataPacket } from 'mysql2/promise';

const MIGRATION_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS schema_migrations (
    migration_id VARCHAR(190) NOT NULL,
    applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (migration_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`;

function splitStatements(sql: string): string[] {
  return sql
    .split(';')
    .map((statement) => statement.trim())
    .filter((statement) => statement.length > 0);
}

async function migrate(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL is not configured');
  const connection = mysql.createConnection(databaseUrl);
  const db = await connection;
  try {
    await db.query(MIGRATION_TABLE_SQL);
    const migrationDirectory = path.resolve(process.cwd(), 'migrations');
    const names = (await readdir(migrationDirectory))
      .filter((name) => /^\d{4}_[a-z0-9_-]+\.sql$/.test(name))
      .sort();
    for (const name of names) {
      const migrationId = name.slice(0, -4);
      const [rows] = await db.execute<RowDataPacket[]>(
        'SELECT migration_id FROM schema_migrations WHERE migration_id = ? LIMIT 1',
        [migrationId],
      );
      if (rows.length > 0) continue;

      const sql = await readFile(path.join(migrationDirectory, name), 'utf8');
      for (const statement of splitStatements(sql)) await db.query(statement);
      await db.execute('INSERT INTO schema_migrations (migration_id) VALUES (?)', [migrationId]);
      console.log(`Applied ${migrationId}`);
    }
  } finally {
    await db.end();
  }
}

void migrate().catch((error: unknown) => {
  console.error('Migration failed:', error instanceof Error ? error.message : 'unknown error');
  process.exitCode = 1;
});
