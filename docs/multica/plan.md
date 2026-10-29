# Plan: Multica variant of the KeizFlow workflow

Status: **draft, not approved.** Plan only; nothing on this branch is implemented yet.

Branch: `workflow-multica`, based on `main`. Sibling of `workflow-orca`: same phases and rules, but the agents run as a Multica squad instead of side by side in Orca.

Source for the Multica side: Renz's "Multica agent workflow: current state summary" (29 Oct 2026, library v4.3 + v4.4 autonomy update). The live library in `C:\dev\PROJECTS\_agents\` wins where it differs.

## 1. Goal

Run KeizFlow's phases 02–09 through Multica cards, so Renz assigns a card and the Build squad carries it to a reviewed PR without him relaying messages. Renz keeps the spec, UI, visual and feature calls, and every medium/high-risk merge.

What stays from `main`: the 9 phases, `docs/progress.md`, `/next`, one data module, acceptance criteria first, tokens in `design/tokens.json`, parking lot, Checks workflow, APK release path.

What Multica adds: cards (`KEIZ-NN`), squads, the Co-Founder's next moves, run caps, risk labels and the low-risk merge path.

## 2. Phase map

| KeizFlow phase | Multica stage | Who drives | Notes |
|---|---|---|---|
| 01 Idea & scope | P Plan | Renz + one Claude session (Superpowers brainstorm) | Output is the spec; Multica `plan.md` becomes a pointer to it. Squads never brainstorm. |
| 02 Web scaffold | 0 Setup + 1 Stack | Lead cards, Architect decision record | Porting strategy (step 2.1) is an Architect record; Renz approves. |
| 03 Vercel live | 0 Setup gate | Stage-0 verification card | Done when a preview opens on Renz's phone. |
| 04 Iterate loop | 2 Visual direction + 3 Build loop | **Renz, hands-on** (see §2a) | Renz builds features and UI live in his own session; agents review and refine afterwards. Timebox rules unchanged. |
| 05 Sign-off gate | End-of-stage audit card + 4 Web release | Audit card, then named task from Renz | Impeccable `/audit` runs in Renz's Claude session (it's over Multica's 1 MiB import cap). |
| 06 Native stack | 1 Stack (again) | Architect record, Co-Founder tier 3 brief | Codex challenge of the recommendation = Code and Evidence Reviewer on the record. |
| 07 Supabase prod | 3 Build loop, high risk | Cards, Renz approves each merge | Security review by the Reviewer (row-level security, secrets). |
| 08 Android build | 6 Android | One card per screen | Same acceptance criteria as web. Owner-device testing as in Multica today. |
| 09 Test & share | 4 Release (Android) | Named task only | Release, signing and store stay Renz-only. |

## 2a. Phase 04: Renz builds live, agents review after

Decided 29 Oct 2026. Small UI and feature changes are faster and cheaper done live than through cards (a clean card costs ~5 runs).

1. Renz works on a branch in his own session with the dev server running, and sees each change instantly.
2. When a round's changes feel right, he pushes the branch and opens a PR (Vercel gives a preview).
3. **One review card per PR, not per tweak.** Assigned to the Build squad: the Reviewer checks it against the acceptance criteria; Gemini adds missing Playwright tests; App Builder or Gemini does cleanup the Reviewer asks for.
4. Merge follows the normal risk rules in §4.

Default model for the live session is Renz's choice; using Antigravity (`agy`) for quick tweaks saves Claude usage.

## 3. Roles

KeizFlow says "Claude builds, Codex reviews, only Claude plans." Multica already matches the first two. The third needs a clear line (see §6, item 1).

| Agent | Runtime | KeizFlow job |
|---|---|---|
| Project Lead | Codex | Slices an approved plan into one-run cards, keeps ledgers, merges low-risk PRs. Does not invent features. |
| App Builder | Claude Code | Main builder. One slice per run. |
| UI Designer, Design System Designer, Motion Designer | Claude Code | Phase 04 screens and `design/tokens.json` (Design squad). |
| Code and Evidence Reviewer | Codex | Reviews every PR against the acceptance criteria and `AGENTS.md` review guidelines. |
| Design Reviewer | Codex | Reviews design cards. |
| Software Architect | Claude Code | Porting strategy (2.1), native stack (06). |
| Co-Founder | Claude Code | Next moves, low-risk merge OKs, tier-3 briefs to Renz. |
| ChatGPT | Outside Multica | Spec challenge, research, icon ideas, download-page copy. Unchanged. |
| Gemini | Antigravity (`agy`) | **Takes load off Claude** (§6 item 2): tests, chores, research, first-pass builds of routine cards. Proposed agents in §3a. |

### 3a. Moving load from Claude to Gemini

Renz wants Claude usage preserved (it's his default LLM). Proposed split, in steps so quality can be checked:

| Step | Move to Gemini (`agy`) | Stays on Claude |
|---|---|---|
| 1, now | New **Test Writer** (Playwright tests from acceptance criteria); **Reverse Engineer**; **Motion Designer**; research (Deep Research, NotebookLM) outside Multica | App Builder, UI Designer, Design System Designer, Architect, Co-Founder |
| 2, after ~10 cards | New **Gemini Builder** for low-risk routine cards (chores, copy, small refactors, dependency bumps) | App Builder for medium/high-risk and new features |
| 3, if step 2 holds up | Co-Founder on Gemini (removes the queue behind App Builder runs) | Architect, UI Designer |

Codex keeps the Lead and Reviewer jobs, so Gemini's work is still reviewed by a different model family. Gemini never plans. Check the AI Pro `agy` limits before step 2.

## 4. Rules to merge

Where the two workflows overlap, this is the proposed combined rule.

1. **Merging:** KeizFlow's "merge only when Checks is green" becomes part of Multica's low-risk test ("required checks passed on that exact head"). No change needed beyond naming the Checks workflow.
2. **Risk labels:** adopt Multica's low/medium/high labels as is. Add: any change to `design/tokens.json`, the data module, or Supabase schema/RLS is medium at least.
3. **Acceptance criteria:** every card's `Outcome:` cites the feature's acceptance criteria. The Reviewer flags any criterion with no test.
4. **Playwright tests:** one test per main flow, Chromium + Android phone profile, as on `main`. Gemini's Test Writer writes them (§3a).
5. **Parking lot:** the Lead labels out-of-scope requests `parked` and adds them to `docs/parking-lot.md`, not only the Multica board.
6. **Decisions:** one log only: `docs/decisions.md` (decided 29 Oct). Multica's `DECISIONS.md` rules point to it. Project Lead stays the sole writer.
7. **Progress:** `docs/progress.md` stays the phase checklist; Multica `WORK.md` stays the one-page "now" view. `/next` reads both.
8. **Timebox:** phase 04 rounds (1 week or 3 variants per screen) become a card field: `Round: n of 3`.
9. **Secrets and evidence:** Multica's GitHub guard (5 MiB, no evidence/keys/APKs in git) replaces nothing on `main`; add it to the Checks workflow.

## 5. Files to add when implementing

Not written yet. Proposed list:

| File | What |
|---|---|
| `CLAUDE.md` | "Multica variant" header, roles table from §3, rules from §4, link to this plan |
| `AGENTS.md` | Project facts block Multica agents read (repo checkout dir, verified commands, environment failures) plus the existing review guidelines |
| `WORK.md` | One-page current task, from the Multica template |
| `docs/multica/card-templates.md` | Task card and result templates with KeizFlow fields (acceptance criteria, round, phase) |
| `docs/multica/setup.md` | How to attach this repo to a Multica project and which squad Instructions point here |
| `.github/workflows/checks.yml` | Add the file-size/evidence/secret guard job |
| `.claude/commands/next.md` | Also read `WORK.md` and open Multica cards |
| `README.md` | Add `workflow-multica` to the Branches table |

The library in `C:\dev\PROJECTS\_agents\` stays project-neutral. Nothing KeizFlow-specific goes into `SHARED-RULES.md`.

## 6. Open questions for Renz

1. **Planning line.** KeizFlow says only Claude plans. In Multica the Project Lead (Codex) writes task cards. Proposal: Claude (Renz's session) writes the plan and acceptance criteria; the Lead only slices it into cards and can't add scope. OK?
2. **Gemini.** The Multica summary says "No Gemini", which was before you added Google AI Pro. Multica supports Antigravity (`agy`), not Gemini CLI. Options:
   - A. **Test Writer agent on `agy`** in the Build squad: writes Playwright tests from acceptance criteria on its own card, in parallel with App Builder. Matches the Orca branch role.
   - B. **Research only, outside Multica:** Deep Research and NotebookLM for phase 01 and 06, like ChatGPT. No new agent.
   - C. **Keep no Gemini** in Multica for now.
   - Recommendation: **B now, A after the first milestone**, once you know whether Codex/Claude usage is the bottleneck.
3. **Which app.** Decided: any future app. Rules stay app-neutral (no app names, stacks or card numbers); app facts go in each app's `AGENTS.md`.
4. **Decision log name.** Decided: `docs/decisions.md`. It already exists and `/next` and every KeizFlow file already point to it.
5. **Multica `main` deploys to production.** KeizFlow uses dev Supabase for production until phase 07. Keep Multica's low-risk auto-merge before phase 07, or require your OK on every merge until then?

## 7. Rollout (after the plan is approved)

1. Write the files in §5 on this branch. It stays its own branch, like `workflow-orca`, and doesn't merge into `main`.
2. Agent Recruiter card: point the Build and Design squad Instructions at this repo's `AGENTS.md` (after your "approved").
3. Stage-0 verification card: Lead → Builder → Reviewer → Co-Founder, to prove the loop runs on this repo.
4. First real card: one small phase 02 slice. Check run count and cost against KEIZ-72 (5 runs, ~$0.96).
5. Review after ~10 cards with the Workflow Analyst.

## 8. Things to verify before building

From the summary's uncertain items, the ones that affect this plan:

- Whether PR #23 (standing low-risk merge approval) merged in TREN.
- Final hashes of `SHARED-RULES.md` and the Co-Founder profile after 27 Oct.
- Whether Codex Leads can set board labels (needed for the parking-lot rule).
- Whether a timed-out run auto-requeues (affects run caps).
