# Decisions

One entry per decision, newest at the top. Keep each entry short: what was decided, why, and what it rules out.

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
