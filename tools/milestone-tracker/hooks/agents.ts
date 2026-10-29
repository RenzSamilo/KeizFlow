// Turns Orca, git and GitHub CLI output into lanes, gates and PRs. Pure: text in, data out.
//
// Orca's JSON fields aren't documented, so each field is looked up under the
// names it is likely to have. Unknown shapes produce fewer details, never errors.

import type {
  TrackerChecks,
  TrackerGate,
  TrackerLane,
  TrackerLaneState,
  TrackerPr,
} from '../types'

type Json = Record<string, unknown>

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return undefined
  }
}

/** The list inside an Orca answer: the array itself, or the first array field. */
export function listOf(value: unknown): Json[] {
  if (Array.isArray(value)) return value.filter(isObject)
  if (isObject(value)) {
    for (const field of Object.values(value)) {
      if (Array.isArray(field)) return field.filter(isObject)
    }
  }

  return []
}

function isObject(value: unknown): value is Json {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** The first non-empty string under any of `keys`, one level of nesting allowed. */
function pick(item: Json, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = item[key]
    if (typeof value === 'string' && value.trim() !== '') return value.trim()
    if (isObject(value)) {
      const inner = pick(value, ['name', 'title', 'text', 'message', 'state', 'status'])
      if (inner) return inner
    }
  }

  return undefined
}

function baseName(path: string): string {
  const parts = path.split(/[\\/]/).filter(Boolean)

  return parts[parts.length - 1] ?? path
}

function shortBranch(ref: string): string {
  return ref.replace(/^refs\/heads\//, '')
}

export function laneState(raw: string | undefined, hasQuestion: boolean): TrackerLaneState {
  if (hasQuestion) return 'wait'
  const s = (raw ?? '').toLowerCase()
  if (/wait|input|attention|blocked|question|ask|approv|permission|review/.test(s)) return 'wait'
  if (/run|work|busy|active|think|progress|start/.test(s)) return 'run'
  if (/done|complete|finish|success|exit|stopped/.test(s)) return 'done'
  if (/idle|ready/.test(s)) return 'idle'

  return 'unknown'
}

const NAME_KEYS = ['name', 'title', 'displayName', 'label', 'id']
const BRANCH_KEYS = ['branch', 'branchName', 'headBranch', 'ref', 'head']
const PATH_KEYS = ['path', 'worktreePath', 'worktree', 'cwd', 'dir']
const AGENT_KEYS = ['agent', 'agentType', 'agentName', 'provider', 'tool', 'kind', 'cli']
const STATE_KEYS = ['state', 'status', 'agentState', 'agentStatus', 'phase']
// Not 'prompt' or 'message': those usually hold the agent's task, not a question.
const ASK_KEYS = ['question', 'pendingQuestion', 'attention', 'needsAttention', 'waitingFor']

function toLane(item: Json): TrackerLane {
  const path = pick(item, PATH_KEYS)
  const branchRaw = pick(item, BRANCH_KEYS)
  const branch = branchRaw ? shortBranch(branchRaw) : undefined
  const ask = pick(item, ASK_KEYS)
  // A boolean "needs attention" flag counts even without a question text.
  const flagged = ['needsAttention', 'needsInput', 'waiting'].some(k => item[k] === true)
  const askText = ask && ask !== 'true' ? ask : undefined

  return {
    name: pick(item, NAME_KEYS) ?? (path ? baseName(path) : branch ?? 'worktree'),
    branch,
    agent: pick(item, AGENT_KEYS),
    state: laneState(pick(item, STATE_KEYS), flagged || askText !== undefined),
    ask: askText,
  }
}

function sameLane(a: TrackerLane, b: TrackerLane): boolean {
  return (a.branch !== undefined && a.branch === b.branch) || a.name === b.name
}

/**
 * Lanes from `orca worktree ps --json`, with `orca orchestration worker-list --json`
 * laid over them: a worker's state and question win for the worktree it runs in.
 */
export function orcaLanes(worktreesText: string, workersText?: string): TrackerLane[] {
  const lanes = listOf(parseJson(worktreesText)).map(toLane)
  const workers = workersText ? listOf(parseJson(workersText)).map(toLane) : []
  for (const worker of workers) {
    const lane = lanes.find(l => sameLane(l, worker))
    if (!lane) {
      lanes.push(worker)
      continue
    }
    if (worker.state !== 'unknown') lane.state = worker.state
    lane.ask = worker.ask ?? lane.ask
    lane.agent = lane.agent ?? worker.agent
  }

  return lanes
}

/** Whether the text is JSON Orca could have answered with. */
export function isJson(text: string): boolean {
  return parseJson(text) !== undefined
}

/** Open decision gates from `orca orchestration gate-list --json`. */
export function orcaGates(text: string): TrackerGate[] {
  return listOf(parseJson(text))
    .filter(item => !/answered|closed|resolved|done/i.test(pick(item, STATE_KEYS) ?? ''))
    .map(item => ({
      name: pick(item, ['question', 'title', 'name', 'prompt', 'id']) ?? 'Decision gate',
      detail: pick(item, ['description', 'detail', 'options', 'worker', 'recipe']),
    }))
}

/** Lanes from `git worktree list --porcelain`: one per extra worktree, state unknown. */
export function gitLanes(text: string): TrackerLane[] {
  const lanes: TrackerLane[] = []
  for (const block of text.split(/\r?\n\r?\n/)) {
    const path = /^worktree (.+)$/m.exec(block)?.[1]
    if (!path) continue
    const branch = /^branch (.+)$/m.exec(block)?.[1]
    lanes.push({
      name: baseName(path),
      branch: branch ? shortBranch(branch) : undefined,
      state: 'unknown',
    })
  }

  // The first entry is the main checkout itself, not a parallel agent.
  return lanes.slice(1)
}

function checksOf(rollup: unknown): TrackerChecks {
  const runs = Array.isArray(rollup) ? rollup.filter(isObject) : []
  if (runs.length === 0) return 'none'
  const results = runs.map(r =>
    String(r.conclusion ?? r.state ?? r.status ?? '').toUpperCase(),
  )
  if (results.some(r => /FAIL|ERROR|CANCEL|TIMED_OUT|ACTION_REQUIRED/.test(r))) return 'fail'
  if (results.some(r => !/SUCCESS|NEUTRAL|SKIPPED/.test(r))) return 'pending'

  return 'pass'
}

/** PRs from `gh pr list --json number,title,headRefName,statusCheckRollup`. */
export function ghPrs(text: string): TrackerPr[] {
  const value = parseJson(text)
  if (!Array.isArray(value)) return []

  return value.filter(isObject).map(pr => ({
    number: Number(pr.number) || 0,
    title: String(pr.title ?? ''),
    branch: String(pr.headRefName ?? ''),
    checks: checksOf(pr.statusCheckRollup),
  }))
}

/** Count of changed files in `git status --porcelain`. */
export function changedFiles(text: string): number {
  return text.split(/\r?\n/).filter(line => line.trim() !== '').length
}
