# Decisions

One entry per decision, newest at the top. Keep each entry short: what was decided, why, and what it rules out.

## 2026-10-28 · Orca for parallel variants and screens (Orca branch)

- **Decision:** use Orca to fan out up to 3 agents for phase 04 UI variants and to run one agent per screen in phase 08. Everything else stays single-agent.
- **Why:** Orca's worktree-per-agent model matches "try 2–3 variants side by side" and parallel screen ports, without adding a planning layer that competes with Superpowers.
- **Rules out:** role-based orchestrators (Multica's planner/coder/QA setup); fan-out for small tweaks.

## 2026-10-28 · Claude builds, Codex reviews

- **Decision:** Claude plans and builds with the skill set. Codex reviews PRs, writes Playwright tests from acceptance criteria, does security reviews, and is the backup builder. ChatGPT handles research and spec challenges. Codex reads `AGENTS.md`, which defers to `CLAUDE.md`.
- **Why:** the skills are Claude Code plugins; a different model catches different mistakes; one planner avoids competing task lists.
- **Rules out:** Codex as orchestrator or planner.

## 2026-10-28 · Ship as a downloadable APK first

- **Decision:** release builds go out as a signed APK on GitHub Releases and a download page on the Vercel site. Play Store waits.
- **Why:** no store review, no tester-count requirement, faster to get the app onto phones.
- **Rules out:** automatic updates through the store; users get an in-app "update available" prompt instead.

## 2026-10-28 · Portable design tokens, Superpowers for features only

- **Decision:** tokens live in `design/tokens.json` and generate both web CSS and the Android theme. Superpowers runs for features; visual tweaks are direct prompts.
- **Why:** one source of truth for the look across platforms; no planning ceremony for a color change.
- **Rules out:** hand-copying colors into the Android project.

## 2026-10-28 · Separate dev and prod, automated checks

- **Decision:** two Supabase projects (dev and prod); Vercel previews use dev; secrets only in Vercel, Supabase and a password manager; every PR runs the Checks workflow.
- **Why:** experiments can't touch real user data, keys never leak through git, and broken code never reaches a preview.
- **Rules out:** one shared database for testing and real users; committing `.env` files or signing keys.

## 2026-10-28 · Adopt the Web-to-Android workflow

- **Decision:** build each app as a Vercel web app first, then port it to native Android on the same Supabase backend. Phases and rules are in `CLAUDE.md`.
- **Why:** web previews make UI and feature iteration fast; one backend serves both versions.
- **Rules out:** building Android first; a separate backend for the native app.

## 2026-10-28 · Core skill set

- **Decision:** Superpowers, Ponytail, UI UX Pro Max, Impeccable, I Have ADHD.
- **Why:** each covers a different job and none of them conflict.
- **Rules out:** other workflow frameworks (gstack, GSD, BMAD, ECC), Taste, Caveman, Claude-Mem.

<!-- Template:
## YYYY-MM-DD · Title

- **Decision:**
- **Why:**
- **Rules out:**
-->
