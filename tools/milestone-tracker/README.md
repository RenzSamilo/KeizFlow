# Milestone tracker

A pane beside the Claude Code chat that shows where you are in the workflow:

- **Milestones:** phases 01–09, the current one highlighted, with its "Done when".
- **Steps:** the current phase's checkboxes from `docs/progress.md`, the step you're on, and the one after it.
- **Substeps:** indented checkboxes under a step, plus Claude's own task list for the session, ticking live.
- **Orca agents:** one row per worktree or worker (running, done, waiting on you), its branch and PR checks, and open decision gates.
- **Next:** the next step, or "answer what is waiting on you" when an agent or gate needs you.

It reads `CLAUDE.md`, `docs/progress.md`, the Orca CLI, git and the GitHub CLI. Nothing new to keep up to date.

## Install (once per computer)

Needs Claude Code 2.1.275 or later. Run `claude update` first if you're not sure. The pane is an early-access Claude Code feature, so it may change between releases.

1. Open a terminal in your copy of this repo and start Claude Code: `claude`.
2. Install the tracker from the repo folder. On Windows, use your folder's full path:

   ```
   /plugin install milestone-tracker --marketplace C:\path\to\your-app
   ```

   Answer `y` to add the marketplace, then pick the user scope. Once this branch is on the repo's default branch on GitHub, this also works: `/plugin install milestone-tracker --marketplace RenzSamilo/Workflow_v1`.
3. Type `/tracker`.

Installed from the folder, the tracker runs from the folder itself: after a `git pull`, type `/reload-plugins` to pick up changes.

## Use

| Command | What it does |
|---|---|
| `/tracker` | Opens the pane |
| `/tracker refresh` | Re-reads everything now |
| `/tracker close` | Closes the pane |

In a terminal the pane docks to the right of the chat when the window is about 110 characters wide or more. Narrower, it shows above the prompt. The status line under the prompt shows a one-line summary, like `04 Iterate loop · 4.3 · 2 waiting on you`.

It refreshes after every Claude turn and every 30 seconds. PRs refresh every 2 minutes.

To add substeps, indent a checkbox under a step in `docs/progress.md`:

```
- [ ] 8.2 Screens ported (list them below as you go)
  - [x] Feed
  - [ ] Profile
```

## First run with Orca: check the agent rows

The Orca part couldn't be tested against a real Orca install, so check it once:

1. Open Claude Code in an Orca terminal tab and type `/tracker`.
2. Start one agent in another worktree.
3. Within 30 seconds its row should appear under **Orca agents**.

If it says **Worktrees (Orca not connected)** instead:

- In a normal terminal, run `orca worktree ps --json`. If that isn't found, find where Orca installed its command and put the full path in `/config` → **milestone-tracker** → **Orca command**.
- If it prints JSON but the rows look wrong (no state, no question), paste that output to Claude and ask it to fix `hooks/agents.ts`. The field names are guessed from common names, because Orca doesn't document them.

## Settings

In `/config` under **milestone-tracker**:

| Setting | Default | What it does |
|---|---|---|
| Orca command | `auto` | `auto` tries `orca`, then `orca.exe`, `orca.cmd` and `cmd /c orca` on Windows, and `orca-ide` on Linux |
| Refresh every (seconds) | 30 | How often Orca, worktrees and the branch are re-read |
| Open on start | on | Opens the pane when a session starts, if there's room |

## Limits

- Orca agents only show when Claude Code runs on the same computer as Orca. In a cloud session it falls back to git worktrees and PRs.
- PR rows need the GitHub CLI (`gh`) installed and signed in. Without it they're left out.
- Live substeps come from the session the pane is in. Other agents show as one row each.

## Develop

- `claude plugin validate tools/milestone-tracker` checks the manifest and hooks.
- `claude plugin test tools/milestone-tracker` runs the tests in `tests/`.
- `claude --plugin-dir tools/milestone-tracker` loads it from the folder for one session.
