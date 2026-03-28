import { Pool, PoolConfig } from "pg";
import knex, { Knex } from "knex"; // Standard import to avoid require() ambiguity

function mask(s: any) {
  try {
    const str = String(s ?? "");
    if (str.length <= 10) return str;
    return str.slice(0, 6) + "..." + str.slice(-4);
  } catch {
    return "<not-string>";
  }
}

let _pool: Pool | null = null;

function buildPoolFromDatabaseUrl(raw: string): Pool {
  try {
    const u = new URL(raw);
    const cfg: PoolConfig = {
      host: u.hostname || undefined,
      port: Number(u.port || 5432),
      database: u.pathname && u.pathname.length > 1 ? u.pathname.slice(1) : undefined,
      user: u.username || undefined,
      password: u.password || undefined,
    };
    // Prefer explicit config when parsed successfully
    return new Pool(cfg);
  } catch {
    // Fall back to passing the raw string as connectionString
    return new Pool({ connectionString: raw });
  }
}

function createPool(): Pool {
  const raw = process.env.DATABASE_URL ?? "";
  console.error("DBG: src/lib/db DATABASE_URL masked", mask(raw));

  if (typeof raw === "string" && raw.trim()) {
    return buildPoolFromDatabaseUrl(raw.trim());
  }

  // Try classic PG env vars
  const host = process.env.PGHOST ?? process.env.DB_HOST;
  const user = process.env.PGUSER ?? process.env.DB_USER;
  const db = process.env.PGDATABASE ?? process.env.DB_NAME;
  const pw = process.env.PGPASSWORD ?? process.env.DB_PASSWORD;
  if (host && user && db) {
    const cfg: PoolConfig = {
      host,
      port: Number(process.env.PGPORT ?? 5432),
      user,
      database: db,
      password: pw,
    };
    console.error("DBG: src/lib/db using PG env vars, host masked", mask(host));
    return new Pool(cfg);
  }

  throw new Error(
    "Missing DB configuration. Set DATABASE_URL or PGHOST/PGUSER/PGPASSWORD/PGDATABASE in the environment."
  );
}

export default function getPool(): Pool {
  // Singleton Pattern for Next.js HMR (Prevent Connection Exhaustion)
  if (process.env.NODE_ENV === 'development') {
    if ((global as any).__PG_POOL) {
      return (global as any).__PG_POOL;
    }
  }

  if (_pool) return _pool;
  _pool = createPool();

  // Cache in global for dev
  if (process.env.NODE_ENV === 'development') {
    (global as any).__PG_POOL = _pool;
  }

  // DEV-ONLY: pool-level query logger — remove after troubleshooting
  if (process.env.NODE_ENV === "development") {
    try {
      const realQuery = (_pool as any).query.bind(_pool);
      (_pool as any).query = async function (text: any, params?: any[]) {
        try {
          const shortSql = String(text).replace(/\s+/g, " ").trim();
          const safeParams = (params || []).map((p: any) => {
            try {
              const s = String(p ?? "");
              return s.length > 100 ? (s.slice(0, 30) + "..." + s.slice(-10)) : s;
            } catch {
              return "<non-string-param>";
            }
          });
          console.error("[SQL LOG]", shortSql, "PARAMS:", safeParams);
        } catch (e) {
          console.error("[SQL LOG] formatting failed", e);
        }
        try {
          return await realQuery(text, params);
        } catch (err: any) {
          console.error(
            "[SQL ERROR]",
            err && err.message ? err.message : err,
            "SQL:",
            String(text).slice(0, 200),
            "PARAMS:",
            (params || []).map((p: any) => mask(p))
          );
          throw err;
        }
      };
    } catch (e) {
      console.error("Failed to install DEV query logger", e);
    }
  }

  (_pool as any).on("error", (err: any) => {
    console.error("Unexpected PG client error (src/lib/db):", err);
  });
  return _pool!;
}

export const query = async (text: string, params?: any[]) => {
  const pool = getPool();
  return pool.query(text, params);
};

export const transaction = async <T>(callback: (client: any) => Promise<T>): Promise<T> => {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
};

// ADDED EXPORT KEYWORD AND SINGLETON CHECK
export function getKnex(): Knex {
  if ((global as any).__KNEX_INSTANCE) return (global as any).__KNEX_INSTANCE;

  const k = knex({
    client: 'pg',
    connection: process.env.DATABASE_URL,
    searchPath: ['public'],
  });

  if (process.env.NODE_ENV === 'development') {
    (global as any).__KNEX_INSTANCE = k;
  }
  return k;
}