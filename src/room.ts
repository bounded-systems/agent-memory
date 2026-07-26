/** The `memory` capability as a guest-room DOOR. A guest with it reaches the
 *  memory verbs through memoryd's socket; the broker holds the store credential.
 *  Fully separate from the `frontdesk` door — an agent can hold either, both, or
 *  neither. */
export const MEMORY_DOOR = {
  memory: {
    flag: "--memory",
    inBox: "/run/memoryd.sock",
    env: "MEMORYD_SOCK",
    hostDefault: "/tmp/memoryd.sock",
    grants: "agent memory (remember / recall / search)",
    use: "Store and recall your own memories through the memory door — remember/recall/list/search/forget. The broker holds the store; you never hold a DB credential.",
    deny: "No memory here; relaunch with --memory — you cannot persist or recall memories without it.",
  },
} as const;
