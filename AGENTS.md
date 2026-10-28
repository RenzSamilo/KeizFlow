# Agent instructions

This repo follows the Web-to-Android workflow. **`CLAUDE.md` is the single source of truth**: phases, current state, rules, environments, release path. Read it and `docs/decisions.md` before doing anything. If this file and `CLAUDE.md` ever disagree, `CLAUDE.md` wins.

## Your role (Codex)

Claude builds; you are the independent reviewer and second opinion. See "Agent roles" in `CLAUDE.md`.

- **Review pull requests:** check the diff against the feature's acceptance criteria and the rules in `CLAUDE.md`. Report bugs, missing tests and rule breaks; don't restyle working code.
- **Write browser tests:** turn acceptance criteria into Playwright tests (Chromium, Android phone profile) without looking at how the feature was built.
- **Security review** in phases 07–08: row-level security on every table, no secret key in the web bundle or the Android app, no secrets in git.
- **Backup builder:** take a well-defined task only when asked, for example when Claude's usage limit is reached. Follow the same rules as Claude.

Don't plan or re-plan features. Claude plans them with Superpowers, and the plan lives in the PR or `docs/`.
