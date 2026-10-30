# Recipe: Screen port wave (phase 08)

Port the frozen web app to Android a few screens at a time, without agents colliding on shared files.

**Use it for:** step 8.2, after the native stack is confirmed (phase 06) and the theme is ported (step 8.1).

## Before you start

- `docs/progress.md` lists every screen to port under step 8.2.
- The screenshot set from the sign-off gate is saved.
- Android Studio or the Android SDK is installed, with an emulator (AVD) for Orca's emulator pane.

## Paste this into Claude in Orca

```
Use Orca orchestration to run the screen port wave recipe in docs/orca/recipes/screen-port-wave.md.
Screens this wave: [up to 3 screen names]
Supervise the wave and stop at the decision gate before merging.
```

## How the wave runs

1. **Foundation first, one agent.** If not done yet: shared files (theme from `design/tokens.json`, data module, navigation shell) are ported by a single Opus worker. Every later wave depends on this task.
2. **Screens in parallel, up to 3.** One worker per screen (Argon by default, Opus for complex screens), each in its own worktree.
3. **Codex review per screen.** Each screen branch gets a PR; Codex's automatic review runs on it.
4. **Parity check.** For each screen, install the debug APK on the emulator (`orca emulator install`, `orca emulator launch`) and walk through its acceptance criteria. Check `orca emulator logcat` for crashes.
5. **Decision gate:** "Merge these screens: all, some, or none?" You answer after looking at the emulator and the review.
6. Tick each merged screen under step 8.2 in `docs/progress.md`. Plan the next wave.

## Task spec for each screen worker

- **Target:** the [screen] screen in the Android app.
- **Change:** port the screen so it matches the screenshot set and meets the same acceptance criteria as the web version.
- **Constraints:** theme only from the generated Android theme; data only through the data module; no new dependencies without asking.
- **Ownership:** may edit the screen's own files only. Read-only: theme, data module, navigation, `CLAUDE.md`, `AGENTS.md`, `docs/`. Changes needed in shared files go back to the coordinator as an `ask`, not into the screen branch.
- **Observable acceptance:** the debug build runs on the emulator, the screen's acceptance criteria pass, and `worker_done` includes a 3-line summary.

## Done when

Every screen in the wave is merged with green checks and a passing parity check, and ticked in `docs/progress.md`.
