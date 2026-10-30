# Recipe: Feature + test pair (phase 04)

One worker builds a feature while a different one writes its Playwright tests from the same acceptance criteria, at the same time. Tests come from a different author than the code, so they catch more.

**Use it for:** any new feature with written acceptance criteria.
**Don't use it for:** visual tweaks with no behavior to test.

## Before you start

- Superpowers has planned the feature and the acceptance criteria are written (step 4.3).

## Paste this into Claude in Orca

```
Use Orca orchestration to run the feature + test pair recipe in docs/orca/recipes/feature-test-pair.md.
Feature: [name]
Acceptance criteria: [paste or link]
Supervise both workers and report back when the tests pass against the feature, or stop and ask me if they disagree.
```

## What the coordinator does

1. Creates one Run with the objective "Feature + tests: [feature]".
2. Creates two tasks:
   - **Build** (Opus, or Argon for a scoped feature that touches no shared files): implements the feature.
   - **Tests** (Argon; Opus if Argon builds): writes Playwright tests for every acceptance criterion, without reading the build branch.
3. Starts both workers at once, each in its own new worktree.
4. When both finish: merges the tests branch into the build branch and runs the tests.
5. If tests fail, it does **not** change the tests to make them pass. It asks you: fix the code, or change the criterion?
6. Opens one PR with the feature and its tests. Codex's automatic review runs on it.

## Task specs

**Build worker (Opus or Argon, by tier)**
- **Target:** the files the feature plan names.
- **Change:** implement the feature so every acceptance criterion holds.
- **Constraints:** data only through the data module; tokens only from `design/tokens.json`.
- **Ownership:** may edit the feature's files. Must not create or edit files under the Playwright test folder.
- **Observable acceptance:** app builds, lint and type check pass, `worker_done` lists the files changed.

**Tests worker (Argon in Antigravity CLI, or Opus if Argon builds)**
- **Target:** the Playwright test folder only.
- **Change:** one test per acceptance criterion, in Chromium with an Android phone profile.
- **Constraints:** test behavior a user can see, not internal code; don't read the build branch.
- **Ownership:** may edit test files only.
- **Observable acceptance:** tests run, and fail only because the feature isn't built yet; `worker_done` maps each test to its criterion.

## Done when

One PR holds the feature and its tests, the tests pass, and checks are green.
