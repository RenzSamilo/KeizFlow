# Glossary

Plain-English meanings of the words agents use in this workflow. Agents use these words, and `/huh` adds a new term every time it has to explain one. Keep each meaning to one sentence, in alphabetical order.

| Term | Meaning |
|---|---|
| Acceptance criteria | A short list of things a feature must do for it to count as done, written before it's built. |
| Agent | An AI that can read and change files and run commands on its own, like Claude, Codex or Gemini. |
| API | The set of commands one piece of software offers so other code can use it. |
| APK | The install file for an Android app, like an `.exe` on Windows. |
| Branch | A separate copy of the code where changes are made without touching the main version. |
| Checks (CI) | Automatic tests GitHub runs on every change; "green" means they all passed. |
| Commit | A saved snapshot of changes in git, with a short note saying what changed. |
| Data module | The one file all screens go through to read or save data, so the data source can change without touching screens. |
| Dependency | Someone else's code that the app uses, installed from the internet. |
| Deploy | Putting a version of the app on a server so people can open it. |
| Design tokens | The app's colors, fonts and spacing, kept in one file (`design/tokens.json`) so every screen matches. |
| Diff | The list of lines a change adds or removes. |
| Environment variable | A setting, often a secret key, that the app reads when it starts instead of keeping it in the code. |
| Git | The tool that tracks every change to the code and lets you go back. |
| Keystore | The file that signs the Android app to prove updates come from you; losing it means users must reinstall. |
| Library | A ready-made package of code the app uses, like Next.js or the Supabase client. |
| Lint | An automatic check for sloppy or risky code patterns. |
| Merge | Adding a branch's changes into another branch, usually `main`. |
| Migration | A small script that changes the database's structure, such as adding a table. |
| Node.js | The program that runs JavaScript tools on your computer; many install commands (`npx`, `npm`) need it. |
| Orca | The desktop app that runs several agents side by side, each in its own worktree. |
| Parking lot | The list of ideas that wait until after v1 (`docs/parking-lot.md`). |
| Playwright | A tool that opens the app in a browser and clicks through it automatically to test it. |
| Preview link | A temporary web address Vercel makes for each branch, so you can try a change before it's merged. |
| Production (prod) | The live version real users use. |
| Pull request (PR) | A request to merge a branch, where the changes get reviewed before they go in. |
| Rate limit | How much of a model you can use in a set time (for example 5 hours or a week) before you have to wait for it to reset. |
| Repo (repository) | The project folder tracked by git, stored on GitHub. |
| Review | Another agent (usually Codex) reading a PR and pointing out bugs or broken rules. |
| Row-level security (RLS) | A Supabase rule that lets each user see and change only their own rows of data. |
| Secret key | A password-like key that gives full access to a service; it never goes in the code. |
| Status line | The info bar at the bottom of Claude Code; in KeizFlow it shows Claude's usage. |
| Supabase | The online database and login service the app uses. |
| Type check | An automatic check that each piece of code gets the kind of data it expects. |
| Vercel | The service that hosts the web version of the app and makes preview links. |
| Worktree | A second working folder for the same repo on its own branch, so two agents don't edit the same files. |
