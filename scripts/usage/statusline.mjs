#!/usr/bin/env node
// Claude Code status line: shows Claude's 5-hour and weekly usage, and saves
// them to ~/.keizflow/usage/claude.json so usage-check.mjs can read them.
// Claude Code sends rate_limits on stdin (see code.claude.com/docs/en/statusline).

import { mkdirSync, writeFileSync, renameSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const dir = join(homedir(), ".keizflow", "usage");

let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => (input += chunk));
process.stdin.on("end", () => {
  let data = {};
  try {
    data = JSON.parse(input);
  } catch {
    // Show something even if Claude Code sends nothing we can read.
  }

  const limits = data.rate_limits ?? {};
  const five = limits.five_hour;
  const week = limits.seven_day;

  if (five || week) {
    const snapshot = {
      updated_at: new Date().toISOString(),
      five_hour: five ?? null,
      seven_day: week ?? null,
    };
    try {
      mkdirSync(dir, { recursive: true });
      const tmp = join(dir, "claude.json.tmp");
      writeFileSync(tmp, JSON.stringify(snapshot, null, 2));
      renameSync(tmp, join(dir, "claude.json"));
    } catch {
      // A status line must never crash Claude Code.
    }
  }

  const pct = (w) => (w ? `${Math.round(w.used_percentage)}%` : "–");
  const model = data.model?.display_name ?? "Claude";
  process.stdout.write(`${model} · 5h ${pct(five)} · week ${pct(week)}`);
});
