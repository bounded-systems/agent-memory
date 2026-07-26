#!/usr/bin/env node
/** memory — the agent-memory CLI, dispatched from the VerbSpec registry.
 *   agent-memory remember --agent prx --key k --value v --tags a,b
 *   agent-memory recall   --agent prx --key k
 *   agent-memory search   --agent prx --query keeper
 *   agent-memory list     --agent prx
 *
 * JSON output: verbspec validates flags strictly against each verb's input
 * schema, so there is no `--json` flag to add. Set MEMORY_JSON=1 in the env and
 * the raw verb output object is printed as JSON instead of the human render —
 * this is the machine surface consumers (e.g. prx's memory port) select.
 */
import { dispatch, render } from "@bounded-systems/verbspec";
import { VERBS } from "../src/verbs.ts";
const result = await dispatch(VERBS, process.argv.slice(2), "agent-memory");
if (result.kind === "help") console.log(result.text);
else if (process.env.MEMORY_JSON === "1") console.log(JSON.stringify(result.output));
else { const v = VERBS[result.id]; console.log(v?.render ? v.render(result.output, result.input) : render(result.output)); }
