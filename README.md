# agent-memory

Agent memory as a **capability**, fully separate from Front Desk. A dedicated
`dolt sql-server` holds an agent-scoped key/value store (versioned by Dolt), and a
`memory` **door** (`memoryd`) fronts it — an agent knocks to remember/recall and
never holds a DB credential. This is the **`bd memories` replacement** for retiring
beads (bounded-systems/prx#1008), kept deliberately orthogonal to the scheduling board.

## Surface (VerbSpec → CLI + MCP)

```sh
node scripts/memory.ts remember --agent prx --key submit/base-ref --value "…" --tags bug,submit
node scripts/memory.ts recall   --agent prx --key submit/base-ref
node scripts/memory.ts search   --agent prx --query keeper
node scripts/memory.ts list     --agent prx
```

## Store — its own dolt-server

Its own Dolt DB + `dolt sql-server` (MySQL protocol), **separate from the board
mirror**. `docker/dolt-server/` is the image; `MEMORY_DOLT_*` env points the verbs
at it. Versioned: `dolt diff` shows how a memory evolved.

## The `memory` door

`memoryd` serves the verbs over a unix socket, holding the store credential. A
guest-room room grants `memory` **independently** of `frontdesk` (src/room.ts) —
an agent can hold either, both, or neither. No ambient authority.
