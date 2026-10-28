# Web-to-Android Workflow (Orca variant)

Build a mobile app as a web app on Vercel first, iterate until it feels right, sign it off, then port it to native Android on the same Supabase backend.

This branch is the Orca variant: the same workflow, with parallel agents in Orca for phase 04 variants and phase 08 screens. See "Orca" below. The single-agent workflow lives on `main`.

Workflow map: https://claude.ai/artifact/TzY6HuSm7Hjg5VJWxFNebi

## Current state

- **Phase:** 01 · Idea & scope
- **Porting strategy:** not chosen yet (decided in step 2.1)
- **Web stack:** not chosen yet
- **Native stack:** not chosen yet (confirmed in phase 06)

Update this section whenever a phase ends or a decision is made. Record the reasoning in `docs/decisions.md`.

## Phases

| # | Phase | Done when |
|---|---|---|
| 01 | Idea & scope | Short spec exists; nice-to-haves are in `docs/parking-lot.md` |
| 02 | Web scaffold | Porting strategy recorded; app runs; every main screen exists; all data goes through one data module |
| 03 | Vercel live | A push shows up as a preview link within about a minute |
| 04 | Iterate loop | Timebox ends with core flows accepted (see rules below) |
| 05 | Sign-off gate | Every item in the gate checklist is true |
| 06 | Confirm native stack | Stack recorded in `docs/decisions.md` and approved |
| 07 | Supabase prod | Prod project matches dev and passes the security advisor |
| 08 | Android build | Every screen passes the same acceptance criteria as the web version |
| 09 | Test & share | Testers installed the APK from the download page; crashes show up in crash reporting; new ideas go to the parking lot |

## Rules for Claude

- Read this file and `docs/decisions.md` at the start of every session.
- Track progress in `docs/progress.md`: tick a step when it's done. Type `/next` any time to get one next task (`.claude/commands/next.md`). Don't start work outside the current step without saying so.
- Keep `AGENTS.md` in sync when roles or rules change; it only points here and describes Codex's role.
- Every screen reads and writes data through the single data module. Never call Supabase or fake data directly from a screen.
- Write a feature's acceptance criteria before building it. Each main flow gets a Playwright test that runs in Chromium with an Android phone profile.
- Ideas that are not in the v1 feature list go to `docs/parking-lot.md`, not into the code.
- Design tokens (colors, fonts, spacing) live in one JSON file, `design/tokens.json`. Web CSS variables and, later, the Android theme are generated from it (for example with Style Dictionary). Never hand-edit generated theme files.
- Use Superpowers' brainstorm → plan cycle for new features. Small visual tweaks (colors, spacing, copy, one component's layout) are direct prompts without it.
- Never commit secrets or signing keys. Real values live in Vercel, Supabase and a password manager; `.env.example` lists the names only.
- A pull request merges only when the Checks workflow is green.

## Agent roles

Claude (Claude Code) is the builder. Codex and ChatGPT are the independent second opinion. Codex reads `AGENTS.md`, which points back to this file.

| Phase | Claude: plans and builds | Codex / ChatGPT: reviews and challenges |
|---|---|---|
| 01 Idea | Superpowers brainstorm → spec | ChatGPT: challenge the spec, research, transcribe videos |
| 02–03 Scaffold | Builds everything | Reviews the porting-strategy decision |
| 04 Iterate | Builds features and variants | Reviews every PR; writes Playwright tests from the acceptance criteria |
| 05 Sign-off | Impeccable `/audit` | Full review of the app before it's frozen |
| 07–08 Backend and port | Builds | Security review: row-level security, secret handling |
| 09 Release | Release tasks | ChatGPT: icon ideas, download-page copy |

- Codex reviews every PR automatically: in Codex settings, turn on **Code review** and **Automatic reviews** for the repo (needs Codex cloud connected to GitHub). Comment `@codex review` to request one by hand, or `@codex review for security regressions` to focus it. Its rules are the "Review guidelines" section of `AGENTS.md`.
- Only Claude plans features. Codex doesn't re-plan; two planners give competing task lists.
- Tests written by Codex from the acceptance criteria are kept even when Claude's code disagrees with them: fix the code, or fix the criteria and say so in the PR.
- When Claude's usage limit is reached, Codex can take a well-defined task under the same rules.

## Orca

[Orca](https://github.com/stablyai/orca) (Stably AI's desktop app, not `orca-cli/orca`) runs several coding agents side by side, each in its own git worktree. Install: `brew install --cask stablyai/orca/orca` on macOS; see its README for Windows and Linux.

| Phase | How Orca is used |
|---|---|
| 01–03, 05–07, 09 | Not used. One Claude agent in a normal session. |
| 04 Iterate: UI variants | Fan out one prompt to up to 3 agents: 2 Claude + 1 Codex, or 3 Claude with different design directions. Compare the previews, merge one, delete the rest. |
| 04 Iterate: features | One Claude agent builds the feature; a second worktree has Codex write the Playwright tests from the same acceptance criteria. |
| 08 Android port | One Claude agent per screen, each in its own worktree, all checked against the same acceptance criteria. Codex reviews each before merge. |

Rules:

- **Fan-out is for real choices** (layouts, design directions, competing approaches). Small tweaks and bug fixes use one agent.
- **At most 3 parallel agents.** That matches the 3-variants-per-round timebox and keeps review manageable.
- **Every worktree is a branch.** Push it so Vercel builds a preview link, or run each worktree's dev server on its own port.
- **One winner per fan-out.** Merge it through a normal PR (Checks must pass); delete the losing branches the same day.
- **No two agents edit the same files** in phase 08. Split work by screen, and keep shared files (data module, tokens, navigation) with one agent.
- Superpowers still plans the feature first; Orca only runs the plan's tasks in parallel.

### Recipes

Ready-made plans for Orca's orchestration skill, in `docs/orca/recipes/`. Each has a prompt to paste into Claude in Orca, and stops at a decision gate for you.

| Recipe | Phase | What it runs |
|---|---|---|
| `variant-fanout.md` | 04 | Up to 3 design directions for one screen → you pick the winner |
| `feature-test-pair.md` | 04 | Claude builds the feature while Codex writes its tests |
| `screen-port-wave.md` | 08 | Shared files first, then up to 3 screens in parallel, parity check on the emulator |

Orchestration is experimental: turn it on in Orca's **Settings → Experimental**. Task specs follow Orca's format: target, change, constraints, ownership, observable acceptance.

### Orca features this workflow uses

| Feature | Phase | Why |
|---|---|---|
| `orca.yaml` setup script | All | Every new worktree copies `.env.local` and installs dependencies, then opens a dev-server tab |
| Design Mode | 04 | Click a UI element in Orca's Chromium window to send its HTML, CSS and a screenshot to the agent. Fastest way to make small visual tweaks. |
| Annotate AI diffs | 04, 08 | Comment on diff lines and send them back to the agent instead of retyping feedback |
| Notifications and mobile companion | All | Get pinged when an agent finishes or needs you, instead of watching terminals |
| Usage tracking | All | See Claude and Codex limits and resets; switch to Codex as backup builder when Claude runs out |
| GitHub PRs in-app | 04–09 | Open a worktree from a PR (`orca worktree create --pr <number>`) to review Codex's comments in place |
| Android emulator pane | 08, 09 | Agents install the debug APK, tap through acceptance criteria, and read logcat (`orca emulator ...`) |

Not used on purpose: SSH worktrees, per-workspace cloud environments, Linear/Jira, Computer Use. They add setup without speeding up a solo workflow.

## Automated checks

`.github/workflows/checks.yml` runs on every pull request and every push to `main`: lint, type check, unit tests, build, then Playwright browser tests in Chromium. Each step runs only once the app defines it (`npm run lint`, `typecheck`, `test`, `build`, `playwright.config.*`).

## Environments

| | Dev | Prod |
|---|---|---|
| Who uses it | You and Claude | Real users |
| Supabase project | `<app>-dev`, test data you can wipe | `<app>-prod`, real user data, created in phase 07 |
| Vercel | Preview deployments (every branch and PR) | Production deployment (`main`) |
| Android | Debug builds on your phone or emulator | Signed release APK from the download page |
| Keys | Publishable key in the app, secret key server-side only | Same rule, separate keys |

Unfinished features live on branches, and each branch gets its own preview link. Until phase 07 there is no prod Supabase project, so production also uses dev.

Android signing: the release keystore and its passwords go in a password manager plus one offline backup. Every update must be signed with the same key. With APK distribution there is no Google backup: lose the key and every user has to uninstall and reinstall.

## Release (phase 09): APK download, no Play Store yet

1. Build a signed release APK. CI can build it automatically when a version tag like `v1.0.0` is pushed.
2. Publish it as a GitHub Release asset. If the app repo is private, its release files are private too: use a public releases-only repo, or host the file on the Vercel site.
3. Add a download page to the Vercel site: download button, version number, and install steps (allow "Install unknown apps" for the browser, then open the file).
4. Updates: the app checks the latest release version on launch and shows an "Update available" prompt with the download link. APK installs don't update themselves.
5. Google is rolling out developer verification for apps installed outside the Play Store (2026–2027, country by country). Check the current rules and register before sharing the APK widely.

Play Store is parked in `docs/parking-lot.md` for later.

## After launch

- Crash reporting (for example Sentry) and basic privacy-friendly analytics are added in phase 08, before anyone else installs the app.
- The web app's role after the port is decided in phase 06 and recorded in `docs/decisions.md`: retire it, keep it as the design sandbox for phase 04 experiments, or keep it live as a second platform.

## Iterate loop timebox (phase 04)

- One round is at most **1 week** or **3 variants per screen**, whichever comes first.
- At the end of a round, each variant is kept or dropped. No "maybe" pile.
- A round may be extended once. After that, move to the sign-off gate or cut scope.

## Sign-off gate (phase 05)

- Final screens and flows approved
- Impeccable `/audit` passes (accessibility, responsive)
- Theme tokens locked in `design/tokens.json`
- v1 feature list locked; parking lot reviewed and nothing in it is needed for v1
- Web app runs on the dev Supabase backend; data model frozen
- Every feature has written acceptance criteria
- Browser tests pass for every main flow
- Checks workflow green on `main`
- Tagged release in git, e.g. `web-v1`
- Screenshot set of every screen saved

## Skills

Install once per computer in Claude Code (send each line as its own message):

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

| Skill | Used in |
|---|---|
| Superpowers | All phases: brainstorm → plan → build → review |
| Ponytail | 02, 04, 08: reuse existing code before writing new code |
| UI UX Pro Max | 02, 04: generates the design system and palettes |
| Impeccable | 04, 05, 08: `/critique`, `/polish`, `/audit` |
| I Have ADHD | All: answer-first replies |

Workspace: Orca (04, 08), see "Orca" above.

Add later: Agent Reach (01 research), REA (01, 04, 09), Understand Anything or Graphify (06, 08).

Left out on purpose: Taste, gstack, GSD, BMAD, ECC, Agent Skills, Matt Pocock Skills, Karpathy Skills, Caveman, Claude-Mem. They duplicate or conflict with the skills above.
