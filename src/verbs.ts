/**
 * @module verbs
 * Memory as VerbSpec verbs — remember / recall / list / search / forget,
 * projected to CLI, MCP, OpenAPI. The `memory` capability's surface.
 */

import { z } from "zod";
import { defineVerb, type Registry } from "@bounded-systems/verbspec";
import { forget, list, recall, remember, search } from "./memory.ts";

const agent = z.string().describe("whose memory");
const Mem = z.object({ agent: z.string(), key: z.string(), value: z.string(), tags: z.array(z.string()), updatedAt: z.string() });

export const rememberVerb = defineVerb({
  id: "remember",
  summary: "Store (upsert) a memory for an agent, by key, with optional tags.",
  actor: "memory",
  input: z.object({ agent, key: z.string(), value: z.string(), tags: z.array(z.string()).default([]) }),
  output: z.object({ stored: z.boolean(), key: z.string() }),
  run: async (i) => { await remember(i.agent, i.key, i.value, i.tags); return { stored: true, key: i.key }; },
  render: (o) => `remembered "${o.key}"`,
});

export const recallVerb = defineVerb({
  id: "recall",
  summary: "Read one memory by exact key.",
  actor: "memory",
  input: z.object({ agent, key: z.string() }),
  output: z.object({ found: z.boolean(), memory: Mem.nullable() }),
  run: async (i) => { const m = await recall(i.agent, i.key); return { found: !!m, memory: m }; },
  render: (o) => o.memory ? `${o.memory.key} [${o.memory.tags.join(",")}]\n  ${o.memory.value}` : "not found",
});

export const listVerb = defineVerb({
  id: "list",
  summary: "List an agent's memories (most recent first).",
  actor: "memory",
  input: z.object({ agent }),
  output: z.object({ count: z.number(), memories: z.array(Mem) }),
  run: async (i) => { const ms = await list(i.agent); return { count: ms.length, memories: ms }; },
  render: (o) => o.memories.map((m) => `  ${m.key}  [${m.tags.join(",")}]`).join("\n") || "  (none)",
});

export const searchVerb = defineVerb({
  id: "search",
  summary: "Substring search over key / value / tags for an agent.",
  actor: "memory",
  input: z.object({ agent, query: z.string() }),
  output: z.object({ count: z.number(), memories: z.array(Mem) }),
  run: async (i) => { const ms = await search(i.agent, i.query); return { count: ms.length, memories: ms }; },
  render: (o) => o.memories.map((m) => `  ${m.key}: ${m.value.slice(0, 60)}`).join("\n") || "  (no match)",
});

export const forgetVerb = defineVerb({
  id: "forget",
  summary: "Delete a memory by key.",
  actor: "memory",
  input: z.object({ agent, key: z.string() }),
  output: z.object({ forgotten: z.boolean() }),
  run: async (i) => ({ forgotten: await forget(i.agent, i.key) }),
  render: (o) => (o.forgotten ? "forgotten" : "no such memory"),
});

export const VERBS: Registry = {
  remember: rememberVerb,
  recall: recallVerb,
  list: listVerb,
  search: searchVerb,
  forget: forgetVerb,
};
