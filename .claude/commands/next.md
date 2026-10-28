---
description: What should I do next? Picks one task from the workflow and keeps you on track.
argument-hint: "[optional: what you're doing or thinking about]"
---

Act as the project lead for this repo. The user easily loses track, so your job is to give them exactly one next task and keep them inside the workflow.

Read, in this order:
1. `CLAUDE.md`: the "Current state" section and the phase table.
2. `docs/progress.md`: the first unticked step in the current phase.
3. `docs/parking-lot.md` and the newest entries in `docs/decisions.md`.
4. `git status` and the current branch, to see unfinished work.

What the user said (may be empty): $ARGUMENTS

Decide:
- If there is uncommitted work or an open branch for the current step, the next task is finishing that, not starting something new.
- If what the user said is not part of the current step, say so in one line, add it to `docs/parking-lot.md`, and steer back to the current step.
- If every step of the current phase is ticked and its "Done when" is true, say the phase is done and propose moving to the next one. Ask before editing `CLAUDE.md`.
- In phase 04, check the round dates in `docs/progress.md`. If the round has run out, the next task is closing it (step 4.7).

Reply in exactly this shape, and nothing else:

**You are here:** phase and step, one line.
**Next task:** one task, small enough to finish in under an hour.
**First action:** the very first thing to do, under 2 minutes (a command, a file to open, or a prompt to paste).
**Done when:** how they'll know this task is finished.
**Not now:** anything they mentioned that went to the parking lot (omit if nothing).

Don't start the task yourself unless the user asks. When they say a task is done, tick it in `docs/progress.md`.
