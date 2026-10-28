# Recipe: Variant fan-out (phase 04)

Try up to 3 directions for one screen at the same time, then keep one.

**Use it for:** a layout, a design direction, or two competing approaches to one feature.
**Don't use it for:** small tweaks, copy changes, bug fixes. Use one agent for those.

## Before you start

- The screen's acceptance criteria are written (step 4.3).
- `docs/progress.md` has a current round with dates.
- Orca's orchestration is on: **Settings → Experimental**.

## Paste this into Claude in Orca

Fill in the brackets, then paste:

```
Use Orca orchestration to run the variant fan-out recipe in docs/orca/recipes/variant-fanout.md.
Screen: [screen name]
Acceptance criteria: [paste or link]
Directions:
  A: [e.g. card list, airy spacing]
  B: [e.g. dense table, tabs on top]
  C: [e.g. Codex's own take on the brief]
Supervise the workers, then stop at the decision gate so I can pick the winner.
```

## What the coordinator does

1. Creates one Run with the objective "Variant fan-out: [screen]".
2. Starts one worker per direction (at most 3), each in its own new worktree. Suggested split: A and B on Claude, C on Codex.
3. Gives every worker the same task spec (below), changing only the direction.
4. Waits for every `worker_done`.
5. Builds the comparison: for each variant, the branch, its preview link (or local port from `orca ports`), a phone-size screenshot, and Impeccable `/critique` notes.
6. Opens a **decision gate**: "Which variant wins: A, B, C, or none?"
7. After you answer: opens a PR for the winner, records in `docs/decisions.md` why it won (one line), and releases the losing workers and removes their worktrees.

## Task spec for each worker

- **Target:** the [screen] screen and its components only.
- **Change:** build the screen in direction [X], meeting every acceptance criterion.
- **Constraints:** colors, fonts and spacing only from `design/tokens.json`; data only through the data module; no new dependencies.
- **Ownership:** may edit the screen's own files. Read-only: `design/tokens.json`, the data module, navigation, `CLAUDE.md`, `AGENTS.md`, `docs/`.
- **Observable acceptance:** the app builds, the screen renders at Android phone size in Chromium, and `worker_done` includes the preview link or local port and a 3-line summary (what it did, what it skipped, what needs your decision).

## Done when

One variant is merged through a PR with green checks, the others are deleted, and `docs/decisions.md` says why the winner won.
