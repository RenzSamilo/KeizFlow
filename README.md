# Web-to-Android Workflow (Orca variant)

> This is the `workflow-orca` branch: the same workflow as `main`, plus [Orca](https://github.com/stablyai/orca) for parallel agents. See [Orca](#orca) below.

A template repo for building a mobile app the fast way: prototype it as a web app on Vercel, iterate until it feels right, sign it off, then port it to native Android on the same Supabase backend.

Workflow map: https://claude.ai/artifact/TzY6HuSm7Hjg5VJWxFNebi

## Quick start

1. Create your app's repo from this one (GitHub: **Use this template**, or copy the files).
2. Install the skills once per computer (see [Commands](#commands)).
3. In Codex settings, turn on **Code review** and **Automatic reviews** for the new repo.
4. Open the repo in Claude Code and type `/next`.

Lost at any point? Type `/next`. It gives you one next task and a first action you can start in under 2 minutes.

## Milestones

| # | Phase | Done when |
|---|---|---|
| 01 | Idea & scope | Short spec exists; nice-to-haves are in the parking lot |
| 02 | Web scaffold | Porting strategy recorded; app runs; every main screen exists; data goes through one module |
| 03 | Vercel live | Every push gets a preview link; failing checks block merges |
| 04 | Iterate loop | A timeboxed round ends with core flows accepted |
| 05 | Sign-off gate | Every item on the gate checklist is true; tagged `web-v1` |
| 06 | Confirm native stack | Stack recorded and approved; web app's future decided |
| 07 | Supabase prod | Prod project matches dev and passes the security advisor |
| 08 | Android build | Every screen passes the same acceptance criteria as the web version |
| 09 | Test & share | Testers installed the APK; crashes show up in crash reporting |

Every step inside each phase is a checkbox in [`docs/progress.md`](docs/progress.md).

## Commands

### Your guide

| Command | What it does |
|---|---|
| `/next` | Tells you where you are, your one next task, a 2-minute first action, and when it's done |
| `/next <idea>` | Checks whether an idea fits the current step; parks it if not |

### Skills (install once per computer, one line per message in Claude Code)

```
/plugin install superpowers@claude-plugins-official
/plugin marketplace add DietrichGebert/ponytail
/plugin install ponytail@ponytail
/plugin marketplace add nextlevelbuilder/ui-ux-pro-max-skill
/plugin install ui-ux-pro-max@ui-ux-pro-max-skill
/plugin marketplace add pbakaus/impeccable
/plugin install impeccable@impeccable
/plugin marketplace add ayghri/i-have-adhd
/plugin install i-have-adhd@i-have-adhd
```

| Skill | Use it for | Phases |
|---|---|---|
| Superpowers | Brainstorm → plan → build → review for new features | All |
| Ponytail | Reuse existing code before writing new code | 02, 04, 08 |
| UI UX Pro Max | Generate the design system and palettes | 02, 04 |
| Impeccable | `/critique` while iterating, `/polish` before merging, `/audit` at sign-off | 04, 05, 08 |
| I Have ADHD | Answer-first replies | All |

### Codex review

| How | What happens |
|---|---|
| Automatic reviews on | Codex reviews every new PR by itself |
| Comment `@codex review` | Requests a review by hand |
| Comment `@codex review for security regressions` | Review with a specific focus |

Codex follows the "Review guidelines" in [`AGENTS.md`](AGENTS.md).

## Who does what

| | Role |
|---|---|
| Claude | Plans every feature with Superpowers and builds it. The only planner. |
| Codex | Reviews every PR, writes Playwright tests from acceptance criteria, security review in phases 07–08. Backup builder. |
| ChatGPT | Challenges the spec, research, transcripts, icon ideas, download-page copy. |

## Files

| File | Purpose |
|---|---|
| [`CLAUDE.md`](CLAUDE.md) | Source of truth: current state, rules, environments, release path. Claude reads it every session. |
| [`AGENTS.md`](AGENTS.md) | Codex's role and review guidelines; defers to `CLAUDE.md` |
| [`docs/progress.md`](docs/progress.md) | Checklist of every step; `/next` reads it |
| [`docs/decisions.md`](docs/decisions.md) | Decision log: what, why, what it rules out |
| [`docs/parking-lot.md`](docs/parking-lot.md) | Ideas that wait until after v1 |
| [`.claude/commands/next.md`](.claude/commands/next.md) | The `/next` command |
| [`.github/workflows/checks.yml`](.github/workflows/checks.yml) | Lint, type check, tests, build and Chromium browser tests on every PR |
| [`.env.example`](.env.example) | Environment variable names, no values |
| [`orca.yaml`](orca.yaml) | Orca setup for every new worktree |
| [`docs/orca/recipes/`](docs/orca/recipes/) | Orchestration recipes |

## Key rules

- **One data module:** screens never call Supabase or fake data directly.
- **Acceptance criteria first:** written before a feature is built; Codex turns them into Playwright tests.
- **Timeboxed rounds:** phase 04 rounds last at most 1 week or 3 variants per screen.
- **Parking lot:** ideas outside the current step get written down, not built.
- **Tokens in one file:** `design/tokens.json` generates both web CSS and the Android theme.
- **No secrets in git:** keys live in Vercel, Supabase and a password manager.
- **Green checks to merge.**
- **Dev vs prod:** previews use the dev Supabase project; real users only touch prod.
- **APK first:** v1 ships as a signed APK on GitHub Releases and a download page. Play Store comes later.

## Orca

[Orca](https://github.com/stablyai/orca) runs several coding agents side by side, each in its own git worktree. This workflow uses it in two places only: design variants in phase 04 and screen ports in phase 08. Everything else stays single-agent.

### Setup (once)

1. Install Orca: [download](https://onorca.dev/download), or `brew install --cask stablyai/orca/orca` on macOS.
2. Turn on orchestration: **Settings → Experimental**.
3. Optional: pair the Orca mobile app to get notified when agents finish.
4. `orca.yaml` in this repo already sets up every new worktree: copies `.env.local`, installs dependencies, opens a dev-server tab.

### Recipes

Paste a recipe's prompt into Claude in Orca. The orchestrator runs the workers and stops at a decision gate for you.

| Recipe | Phase | Runs |
|---|---|---|
| [`variant-fanout`](docs/orca/recipes/variant-fanout.md) | 04 | Up to 3 design directions → you pick one |
| [`feature-test-pair`](docs/orca/recipes/feature-test-pair.md) | 04 | Claude builds the feature, Codex writes its tests in parallel |
| [`screen-port-wave`](docs/orca/recipes/screen-port-wave.md) | 08 | Shared files first, then up to 3 screens, parity check on the emulator |

### Rules

- At most 3 parallel agents. Fan out only for real choices, never small tweaks.
- One winner per fan-out; delete the rest the same day.
- No two agents edit the same files.
- `/next` shows a **Waiting on you** inbox first: decision gates, worker questions, branches to review. Nothing new starts while work waits on you.

### Review flow

| Step | Where | What |
|---|---|---|
| 1. Build | Orca | Claude finishes the change in its worktree |
| 2. Local review | Orca | Codex terminal in the same worktree → `/review`; fix serious issues before pushing |
| 3. Open PR | GitHub | Checks workflow runs |
| 4. Automatic review | GitHub (also visible in Orca) | Codex posts a review on the PR |
| 5. Fix | Orca | `orca worktree create --pr <number>`, Claude fixes each comment, or reply why it stays |
| 6. Merge | GitHub | Checks green, no Codex comment unanswered |

Small visual tweaks can skip step 2.

### Orca CLI commands you'll see

| Command | What it does |
|---|---|
| `orca worktree ps --json` | Every worktree and its agent's state |
| `orca ports --json` | Which local port each worktree's dev server uses |
| `orca worktree create --pr <number>` | Open a worktree from a PR to review it |
| `orca emulator install ./app-debug.apk` | Install the debug build on the Android emulator |
| `orca emulator logcat --lines 200` | Recent Android logs, for crashes |

On Linux, outside Orca's own terminals, the command is `orca-ide` (bare `orca` may start the GNOME screen reader).

## Branches

| Branch | What it is |
|---|---|
| `main` | The single-agent workflow |
| `workflow-orca` | This one: the same workflow plus Orca for parallel agents |
