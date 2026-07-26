/** memoryd — the broker behind the `memory` door (guest-room).
 * Serves the memory verbs as JSON-RPC over a unix socket, holding the memory
 * store credential (MEMORY_DOLT_*). A guest knocks; it never holds the key.
 *   MEMORYD_SOCK=/run/memoryd.sock node scripts/memoryd.ts
 */
import { createServer } from "node:net";
import { existsSync, unlinkSync } from "node:fs";
import { handleJsonRpc } from "@bounded-systems/verbspec";
import { VERBS } from "../src/verbs.ts";
const sock = process.env.MEMORYD_SOCK ?? "/tmp/memoryd.sock";
if (existsSync(sock)) unlinkSync(sock);
const server = createServer((conn) => {
  let buf = "";
  conn.on("data", async (chunk) => {
    buf += chunk.toString();
    let nl: number;
    while ((nl = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, nl).trim(); buf = buf.slice(nl + 1);
      if (!line) continue;
      try { const r = await handleJsonRpc(VERBS, JSON.parse(line)); if (r) conn.write(JSON.stringify(r) + "\n"); }
      catch (e) { conn.write(JSON.stringify({ jsonrpc: "2.0", id: null, error: { code: -32700, message: String(e) } }) + "\n"); }
    }
  });
});
server.listen(sock, () => console.error(`memoryd: door open on ${sock} (verbs: ${Object.keys(VERBS).join(", ")})`));
process.on("SIGINT", () => { try { unlinkSync(sock); } catch {} process.exit(0); });
process.on("SIGTERM", () => { try { unlinkSync(sock); } catch {} process.exit(0); });
