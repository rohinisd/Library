import { Pool } from "pg";

const globalForDb = globalThis as unknown as { pool: Pool | undefined };

function getPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set. Add it to .env (or .env.local) and restart the dev server.");
  }
  if (!globalForDb.pool) {
    globalForDb.pool = new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
  }
  return globalForDb.pool;
}

/**
 * Tagged template for SQL queries. Uses pg so the connection works reliably in Node.
 * Usage: sql`SELECT * FROM users WHERE id = ${id}::uuid`
 */
export async function sql(
  strings: TemplateStringsArray,
  ...values: unknown[]
): Promise<Record<string, unknown>[]> {
  const pool = getPool();
  let text = strings[0];
  for (let i = 0; i < values.length; i++) {
    text += `$${i + 1}` + (strings[i + 1] ?? "");
  }
  const result = await pool.query(text, values);
  return result.rows as Record<string, unknown>[];
}

export async function getDb(): Promise<Pool> {
  return getPool();
}
