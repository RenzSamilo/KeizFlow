#!/usr/bin/env node
// Collects Claude, Codex and Antigravity usage into one report, so the Orca
// orchestrator can pick a worker before each hand-off. See "Usage check before
// hand-off" in CLAUDE.md.
//
//   node scripts/usage/usage-check.mjs          plain-English summary
//   node scripts/usage/usage-check.mjs --json   the same, as JSON
//
// Every provider ends up "ok", "full" or "unknown". Treat "unknown" as "full".

import { readFileSync, statSync, mkdirSync, writeFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { createInterface } from "node:readline";
import { homedir } from "node:os";
import { join } from "node:path";

const CUTOFF = 85; // percent: no new tasks for a provider at or above this
const CLAUDE_MAX_AGE_MS = 15 * 60 * 1000;
const usageDir = join(homedir(), ".keizflow", "usage");

function status(windows) {
  const known = windows.filter((w) => typeof w.used === "number");
  if (known.length === 0) return "unknown";
  return known.some((w) => w.used >= CUTOFF) ? "full" : "ok";
}

function isoFromEpoch(seconds) {
  return typeof seconds === "number" ? new Date(seconds * 1000).toISOString() : null;
}

// Claude: written by statusline.mjs while any Claude Code session runs.
function readClaude() {
  const file = join(usageDir, "claude.json");
  try {
    const age = Date.now() - statSync(file).mtimeMs;
    if (age > CLAUDE_MAX_AGE_MS) {
      return { status: "unknown", note: `last reading is ${Math.round(age / 60000)} min old`, windows: [] };
    }
    const snap = JSON.parse(readFileSync(file, "utf8"));
    const windows = [
      { name: "5-hour", used: snap.five_hour?.used_percentage, resets_at: isoFromEpoch(snap.five_hour?.resets_at) },
      { name: "weekly", used: snap.seven_day?.used_percentage, resets_at: isoFromEpoch(snap.seven_day?.resets_at) },
    ];
    return { status: status(windows), windows };
  } catch {
    return { status: "unknown", note: "no reading yet: is the KeizFlow status line on?", windows: [] };
  }
}

// Run a command and collect stdout, with a timeout.
function run(cmd, args, timeoutMs) {
  return new Promise((resolve) => {
    let out = "";
    let child;
    try {
      child = spawn(cmd, args, { stdio: ["ignore", "pipe", "ignore"] });
    } catch {
      return resolve(null);
    }
    const timer = setTimeout(() => child.kill(), timeoutMs);
    child.stdout.on("data", (c) => (out += c));
    child.on("error", () => resolve(null));
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve(code === 0 ? out : null);
    });
  });
}

// Codex: `codex app-server` speaks newline-delimited JSON-RPC.
// account/rateLimits/read returns primary (5-hour) and secondary (weekly) windows.
function readCodex(timeoutMs = 20000) {
  return new Promise((resolve) => {
    const unknown = (note) => resolve({ status: "unknown", note, windows: [] });
    let child;
    try {
      child = spawn("codex", ["app-server"], { stdio: ["pipe", "pipe", "ignore"] });
    } catch {
      return unknown("codex not installed");
    }
    const send = (msg) => child.stdin.write(JSON.stringify(msg) + "\n");
    const done = (result) => {
      clearTimeout(timer);
      child.kill();
      resolve(result);
    };
    const timer = setTimeout(() => done({ status: "unknown", note: "codex did not answer in time", windows: [] }), timeoutMs);
    child.on("error", () => done({ status: "unknown", note: "codex not installed", windows: [] }));

    createInterface({ input: child.stdout }).on("line", (line) => {
      let msg;
      try {
        msg = JSON.parse(line);
      } catch {
        return;
      }
      if (msg.id === 0) {
        send({ method: "initialized" });
        send({ id: 1, method: "account/rateLimits/read", params: {} });
      } else if (msg.id === 1) {
        const limits = msg.result?.rateLimits;
        if (!limits) return done({ status: "unknown", note: "codex sent no rate limits (signed in?)", windows: [] });
        const windows = [
          { name: "5-hour", used: limits.primary?.usedPercent, resets_at: isoFromEpoch(limits.primary?.resetsAt) },
          { name: "weekly", used: limits.secondary?.usedPercent, resets_at: isoFromEpoch(limits.secondary?.resetsAt) },
        ];
        done({ status: status(windows), windows });
      }
    });

    send({ id: 0, method: "initialize", params: { clientInfo: { name: "keizflow-usage", title: "KeizFlow usage check", version: "0.1.0" } } });
  });
}

// Antigravity: `agy -p /usage --output-format json` answers without using quota
// (agy 1.1.11+). Its JSON layout isn't documented, so look for any object with a
// remaining fraction and a name, and save the raw answer for checking.
async function readAntigravity() {
  const out = await run("agy", ["-p", "/usage", "--output-format", "json"], 30000);
  if (out === null) return { status: "unknown", note: "agy not installed, too old (needs 1.1.11+), or failed", windows: [] };
  try {
    mkdirSync(usageDir, { recursive: true });
    writeFileSync(join(usageDir, "antigravity-raw.json"), out);
  } catch {}

  let data;
  try {
    data = JSON.parse(out);
  } catch {
    return { status: "unknown", note: "agy answer wasn't JSON; see ~/.keizflow/usage/antigravity-raw.json", windows: [] };
  }

  const windows = [];
  const walk = (node, path) => {
    if (!node || typeof node !== "object") return;
    const fraction = node.remainingFraction ?? node.remaining_fraction;
    if (typeof fraction === "number") {
      const name = node.displayName ?? node.modelId ?? node.name ?? node.window ?? path.join(".");
      const reset = node.resetTime ?? node.reset_time ?? node.resetsAt ?? null;
      windows.push({ name: String(name), used: Math.round((1 - fraction) * 1000) / 10, resets_at: reset });
    }
    for (const [key, value] of Object.entries(node)) walk(value, [...path, key]);
  };
  walk(data, []);

  if (windows.length === 0) {
    return { status: "unknown", note: "couldn't find quota numbers; see ~/.keizflow/usage/antigravity-raw.json", windows: [] };
  }
  return { status: status(windows), windows };
}

const [claude, codex, antigravity] = await Promise.all([
  Promise.resolve(readClaude()),
  readCodex(),
  readAntigravity(),
]);
const report = { checked_at: new Date().toISOString(), cutoff_percent: CUTOFF, claude, codex, antigravity };

if (process.argv.includes("--json")) {
  console.log(JSON.stringify(report, null, 2));
} else {
  for (const [name, r] of Object.entries({ Claude: claude, Codex: codex, Antigravity: antigravity })) {
    const parts = r.windows
      .filter((w) => typeof w.used === "number")
      .map((w) => `${w.name} ${w.used}%${w.resets_at ? ` (resets ${w.resets_at})` : ""}`);
    console.log(`${name}: ${r.status.toUpperCase()}${parts.length ? " · " + parts.join(" · ") : ""}${r.note ? ` · ${r.note}` : ""}`);
  }
}
