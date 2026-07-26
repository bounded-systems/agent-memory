/**
 * @module memory
 * Agent memory over a dedicated dolt-server (MySQL protocol) — fully separate
 * from Front Desk. Agent-scoped key/value with tags; versioned by Dolt (dolt
 * diff = how a memory evolved). The beads-memory (`bd remember/recall/memories`)
 * replacement, as its own capability.
 *
 *   MEMORY_DOLT_HOST (127.0.0.1)  MEMORY_DOLT_PORT (3308)  MEMORY_DOLT_DB (mirror)
 *   MEMORY_DOLT_USER (mem)        MEMORY_DOLT_PASSWORD (mem-local)
 */

import { createConnection } from "mysql2/promise";

export interface MemoryConfig {
  readonly host: string;
  readonly port: number;
  readonly user: string;
  readonly password: string;
  readonly database: string;
}

export function config(): MemoryConfig {
  return {
    host: process.env.MEMORY_DOLT_HOST ?? "127.0.0.1",
    port: Number(process.env.MEMORY_DOLT_PORT ?? 3308),
    user: process.env.MEMORY_DOLT_USER ?? "mem",
    password: process.env.MEMORY_DOLT_PASSWORD ?? "mem-local",
    database: process.env.MEMORY_DOLT_DB ?? "mirror",
  };
}

async function withConn<T>(fn: (q: (sql: string, params?: unknown[]) => Promise<unknown[]>) => Promise<T>): Promise<T> {
  const c = config();
  const conn = await createConnection({ host: c.host, port: c.port, user: c.user, password: c.password, database: c.database });
  try {
    return await fn(async (sql, params) => {
      const [rows] = await conn.query(sql, params);
      return rows as unknown[];
    });
  } finally {
    await conn.end();
  }
}

export interface Memory {
  readonly agent: string;
  readonly key: string;
  readonly value: string;
  readonly tags: string[];
  readonly updatedAt: string;
}

function toMemory(r: { agent: string; mkey: string; value: string; tags: string; updated_at: string }): Memory {
  return { agent: r.agent, key: r.mkey, value: r.value, tags: r.tags ? r.tags.split(",").filter(Boolean) : [], updatedAt: String(r.updated_at) };
}

/** Store (upsert) a memory for an agent. */
export async function remember(agent: string, key: string, value: string, tags: string[] = []): Promise<void> {
  await withConn((q) =>
    q(
      `INSERT INTO memories (agent, mkey, value, tags, created_at, updated_at)
       VALUES (?, ?, ?, ?, UTC_TIMESTAMP(), UTC_TIMESTAMP())
       ON DUPLICATE KEY UPDATE value = VALUES(value), tags = VALUES(tags), updated_at = UTC_TIMESTAMP()`,
      [agent, key, value, tags.join(",")],
    )
  );
}

/** Read one memory by exact key. */
export async function recall(agent: string, key: string): Promise<Memory | null> {
  return withConn(async (q) => {
    const rows = (await q("SELECT agent, mkey, value, tags, updated_at FROM memories WHERE agent=? AND mkey=?", [agent, key])) as never[];
    return rows.length ? toMemory(rows[0]) : null;
  });
}

/** List an agent's memories (keys + tags; values truncated for the overview). */
export async function list(agent: string): Promise<Memory[]> {
  return withConn(async (q) => {
    const rows = (await q("SELECT agent, mkey, value, tags, updated_at FROM memories WHERE agent=? ORDER BY updated_at DESC", [agent])) as never[];
    return rows.map(toMemory);
  });
}

/** Substring search over key / value / tags for an agent (exact-key store; LIKE recall). */
export async function search(agent: string, query: string): Promise<Memory[]> {
  return withConn(async (q) => {
    const like = `%${query}%`;
    const rows = (await q(
      "SELECT agent, mkey, value, tags, updated_at FROM memories WHERE agent=? AND (mkey LIKE ? OR value LIKE ? OR tags LIKE ?) ORDER BY updated_at DESC",
      [agent, like, like, like],
    )) as never[];
    return rows.map(toMemory);
  });
}

/** Delete a memory. */
export async function forget(agent: string, key: string): Promise<boolean> {
  return withConn(async (q) => {
    const res = (await q("DELETE FROM memories WHERE agent=? AND mkey=?", [agent, key])) as unknown as { affectedRows?: number };
    return (res.affectedRows ?? 0) > 0;
  });
}
