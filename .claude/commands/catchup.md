---
description: Catch me up. What changed since my last message, in plain words, and what's waiting on me.
argument-hint: "[optional: a topic to focus on]"
---

The user stepped away and is back. Catch them up on what changed since the last message they wrote before `/catchup`, and lay out every decision waiting on them so they can make it from your reply alone.

What the user said (may be empty): $ARGUMENTS

Keep this turn read-only: don't change code, start anything, or post anything.

## Gather

- Your own work since their last message, and reports from any agents or workers you ran.
- The current state of each PR, Checks run, or Orca worker you mention. Check it now; don't repeat an old status.
- Anything only the user can do: a choice, an approval, a merge, a step that can't be undone, or access you don't have. Include items still waiting from before their last message. Work you can still do yourself is not an item.

## Write the reply

Use the words in `docs/glossary.md` and the voice of `/huh`: plain words, short sentences, no jargon.

1. **One opening sentence** that names what's waiting on them, or says nothing is.
2. **What happened:** one short bullet per thing they asked for, with what came of it and whether it's done, still running, failed, or not checked. Under 100 words in all. Say what changed for them, not how you did it ("the tests pass", not "CI is green"). Leave out hashes, paths and commands.
3. **Waiting on you:** one bullet per decision, riskiest first, about 30 words each: the decision, your pick, what it changes, and its risk. Add the PR link when there is one. Write "unknown" for a fact you don't have; never make one up.

If nothing happened and nothing is waiting on them, say so in one line and stop.

Based on `ketchup` from [pstack](https://github.com/cursor/plugins/tree/main/pstack) (MIT).
