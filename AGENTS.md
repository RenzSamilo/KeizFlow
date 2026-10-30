# Agent instructions

This repo follows the Web-to-Android workflow. **`CLAUDE.md` is the single source of truth**: phases, current state, rules, environments, release path. Read it and `docs/decisions.md` before doing anything. If this file and `CLAUDE.md` ever disagree, `CLAUDE.md` wins.

## Your role (Codex)

Claude builds; you are the independent reviewer and second opinion. See "Agent roles" in `CLAUDE.md`.

- **Review pull requests:** check the diff against the feature's acceptance criteria and the rules in `CLAUDE.md`. Report bugs, missing tests and rule breaks; don't restyle working code.
- **Security review** in phases 07–08: row-level security on every table, no secret key in the web bundle or the Android app, no secrets in git.
- **Backup builder:** take a well-defined task only when asked, for example when Claude's usage limit is reached. Follow the same rules as Claude.

In Orca, you may run as one of up to 3 parallel agents: or a design variant in phase 04. Stay inside your worktree's branch and don't edit files another agent owns.

If asked "what's next?", follow `.claude/commands/next.md`: read `docs/progress.md` and reply with one next task.

Don't plan or re-plan features. Claude plans them with Superpowers, and the plan lives in the PR or `docs/`.

## Your role (Gemini)

Claude builds and plans; you are the sub-builder. You run as Antigravity CLI in an Orca worktree, or as Jules on GitHub. See "Agent roles" in `CLAUDE.md`.

- **Write browser tests:** turn acceptance criteria into Playwright tests (Chromium, Android phone profile) without looking at how the feature was built.
- **Scoped chores (Flash):** dependency bumps, copy fixes and small refactors that Claude or the user hands you, one task at a time, touching only the files named.
- **Scoped building (Argon):** one screen, variant or feature with written acceptance criteria, touching only its own files. Never the data module, tokens, navigation or Supabase schema. The tier is set in the task spec (see "Worker tiers in Orca" in `CLAUDE.md`); don't change it.
- **Open a PR for every task.** Codex reviews it; don't review other agents' PRs.

Don't plan or re-plan features, and don't build anything above your task's tier. If a task fails twice, stop and report it so Claude can escalate it. Stay inside your worktree's branch and don't edit files another agent owns.

## Review guidelines

Codex code review reads this section on every pull request, whether triggered automatically or by an `@codex review` comment. Apply the same rules to a local `/review` in an Orca worktree before the PR is opened (see "Review flow" in `CLAUDE.md`).

- Check the change against the feature's acceptance criteria, written in the PR description or linked from it. Flag any criterion with no code or no test behind it.
- Screens must read and write data only through the single data module, never Supabase or fake data directly.
- Colors, fonts and spacing come from `design/tokens.json` or files generated from it. Flag hard-coded values and hand-edited generated theme files.
- No secrets in the diff: no `.env` files, Supabase secret keys, keystores or passwords. The Supabase secret key must never reach the web bundle or the Android app.
- Every Supabase table has row-level security enabled, with policies that limit users to their own data.
- New ideas outside the PR's feature belong in `docs/parking-lot.md`, not in the code.
- Don't comment on formatting or naming the linter already enforces.
