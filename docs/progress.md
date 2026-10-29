# Progress

Tick a box (`[x]`) when a step is done. `/next` reads this file to pick your next task, and the milestone tracker (`/tracker`) shows it beside the chat. Step numbers match the workflow map. Indent a checkbox under a step to make it a substep.

## 01 · Idea & scope

- [ ] 1.1 One-line pitch: who it's for and what problem it solves
- [ ] 1.2 Core features for v1 listed; nice-to-haves in `docs/parking-lot.md`
- [ ] 1.3 Reference apps researched (optional: Agent Reach, REA)
- [ ] 1.4 Main screens and flows mapped
- [ ] 1.5 Data sketch: what the app stores (notes only)

## 02 · Web scaffold

- [ ] 2.1 Porting strategy chosen and recorded in `docs/decisions.md`
- [ ] 2.2 App repo created from this template
- [ ] 2.3 Mobile-first layout: phone frame, bottom nav, touch-sized controls
- [ ] 2.4 Design tokens in `design/tokens.json`, web CSS generated from it
- [ ] 2.5 Data module: every screen goes through it, fake data for now
- [ ] 2.6 Lint, type check, test and build scripts wired up for the Checks workflow

## 03 · Vercel live

- [ ] 3.1 Repo connected to Vercel
- [ ] 3.2 Preview deploys work for branches and PRs
- [ ] 3.3 `main` deploys to production; branch protection requires green checks
- [ ] 3.4 Keys in Vercel environment variables, separate for Preview and Production
- [ ] 3.5 Opened on a real phone

## 04 · Iterate loop

Current round: _not started_ · started: _date_ · ends: _date + 1 week_

- [ ] 4.1 UI variants tried (max 3 per screen), `/critique` on each
- [ ] 4.2 Color schemes compared, tokens updated
- [ ] 4.3 Features built, acceptance criteria written first
- [ ] 4.4 Dev Supabase connected; data module switched to real data
- [ ] 4.5 Playwright tests for every main flow (Codex writes them)
- [ ] 4.6 Kept version polished with `/polish`
- [ ] 4.7 Round closed: variants kept or dropped, new ideas in the parking lot

## 05 · Sign-off gate

- [ ] Final screens and flows approved
- [ ] Impeccable `/audit` passes
- [ ] Theme tokens locked in `design/tokens.json`
- [ ] v1 feature list locked; parking lot reviewed
- [ ] Web app runs on dev Supabase; data model frozen
- [ ] Every feature has written acceptance criteria
- [ ] Browser tests pass for every main flow
- [ ] Checks workflow green on `main`
- [ ] Tagged release, e.g. `web-v1`
- [ ] Screenshot set of every screen saved

## 06 · Confirm native stack

- [ ] 6.1 Inputs gathered: strategy, spec, acceptance criteria, data model
- [ ] 6.2 Options compared
- [ ] 6.3 Recommendation approved
- [ ] 6.4 Stack recorded in `docs/decisions.md` and `CLAUDE.md`
- [ ] 6.5 Web app's future decided

## 07 · Supabase prod

- [ ] 7.1 Schema promoted to a separate prod project
- [ ] 7.2 Android auth: login redirects, secure token storage
- [ ] 7.3 Row-level security on every table
- [ ] 7.4 Storage and functions where needed
- [ ] 7.5 Prod keys only in production settings and the release build

## 08 · Android build

- [ ] 8.1 Android theme generated from `design/tokens.json`
- [ ] 8.2 Screens ported (list them below as you go)
- [ ] 8.3 Same Supabase backend connected
- [ ] 8.4 Offline handling, notifications, permissions
- [ ] 8.5 Parity check: every acceptance criterion passes on Android
- [ ] 8.6 Crash reporting and analytics added

## 09 · Test & share

- [ ] 9.1 Tested on emulator and own phone
- [ ] 9.2 Release key backed up (password manager + offline)
- [ ] 9.3 APK on GitHub Releases and the download page
- [ ] 9.4 In-app update prompt works
- [ ] 9.5 Developer verification rules checked
