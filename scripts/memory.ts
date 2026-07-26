/** memory — the agent-memory CLI, dispatched from the VerbSpec registry.
 *   node scripts/memory.ts remember --agent prx --key k --value v --tags a,b
 *   node scripts/memory.ts recall --agent prx --key k
 *   node scripts/memory.ts search --agent prx --query keeper
 */
import { dispatch, render } from "@bounded-systems/verbspec";
import { VERBS } from "../src/verbs.ts";
const result = await dispatch(VERBS, process.argv.slice(2), "node scripts/memory.ts");
if (result.kind === "help") console.log(result.text);
else { const v = VERBS[result.id]; console.log(v?.render ? v.render(result.output, result.input) : render(result.output)); }
