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
5. The Orca review inbox (below), if Orca is running.

## Orca review inbox

Use the Orca CLI: `orca`, or `orca-ide` on Linux outside an Orca terminal (never bare `orca` there; it can start the GNOME screen reader). If the CLI is missing or Orca isn't running, fall back to `git worktree list` and skip this step quietly.

- `orca worktree ps --json`: every worktree and its agent's state.
- `orca orchestration worker-list --json`: supervised workers and whether they need attention.
- `orca orchestration gate-list --json` (if the command exists): decision gates waiting for an answer.

Also check open PRs (`gh pr list` or the GitHub view in Orca) for Codex review comments nobody has answered.

Sort what you find into **Waiting on you** (an open decision gate, a worker asking a question, a finished worker whose branch has no PR or an unreviewed PR, unanswered Codex review comments, an agent waiting for input) and **Still running**. Ignore idle worktrees with no changes.

What the user said (may be empty): $ARGUMENTS

Decide:
- If there is uncommitted work or an open branch for the current step, the next task is finishing that, not starting something new.
- If what the user said is not part of the current step, say so in one line, add it to `docs/parking-lot.md`, and steer back to the current step.
- If every step of the current phase is ticked and its "Done when" is true, say the phase is done and propose moving to the next one. Ask before editing `CLAUDE.md`.
- In phase 04, check the round dates in `docs/progress.md`. If the round has run out, the next task is closing it (step 4.7).
- If anything is **Waiting on you** in the Orca inbox, the next task is the oldest of those items: answer the gate, reply to the question, or review the branch. Nothing new starts while work waits on the user.
- If several variant branches from one fan-out are open, the next task is picking one winner and deleting the rest.
- Only suggest parallel agents for phase 04 variants or features (recipes `variant-fanout` and `feature-test-pair`) and phase 08 screens (`screen-port-wave`), all in `docs/orca/recipes/`. When suggesting one, the first action is pasting that recipe's prompt.

Reply in exactly this shape, and nothing else:

**Waiting on you:** each Orca item that needs the user, one line each, oldest first (omit if none).
**Still running:** count of running agents and what they're on, one line (omit if none).
**You are here:** phase and step, one line.
**Next task:** one task, small enough to finish in under an hour.
**First action:** the very first thing to do, under 2 minutes (a command, a file to open, or a prompt to paste).
**Done when:** how they'll know this task is finished.
**Not now:** anything they mentioned that went to the parking lot (omit if nothing).

Don't start the task yourself unless the user asks. When they say a task is done, tick it in `docs/progress.md`.
