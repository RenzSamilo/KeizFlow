// Milestone tracker: a pane beside the chat showing the workflow's phases, the
// current step, Claude's live tasks, Orca agents and what comes next.

import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type {
  TrackerLane,
  TrackerPr,
  TrackerSnapshot,
  TrackerStep,
  TrackerTask,
} from '../types'
import {
  changedFiles,
  ghPrs,
  gitLanes,
  isJson,
  orcaGates,
  orcaLanes,
} from './agents'
import { locate, parseWorkflow } from './workflow'

const PANE = 'milestones'
const TITLE = 'Milestones'

// Change a tag when that value's fields change: it declines what an earlier
// version stored, which outlives a reload.
const snapshot = atom(
  { plugin: 'milestone-tracker', key: 'snapshot' } as const,
  null,
  { shape: 'snapshot-1' },
)
const tasks = atom({ plugin: 'milestone-tracker', key: 'tasks' } as const, [], {
  shape: 'tasks-1',
})

type Engine = EngineInterface

async function run(
  $: Engine,
  argv: readonly string[],
): Promise<{ ok: boolean; stdout: string }> {
  try {
    const r = await $.process.run(argv, { timeoutMs: 15_000 })

    return { ok: r.exitCode === 0, stdout: r.stdout }
  } catch {
    return { ok: false, stdout: '' }
  }
}

// The Orca command that answered; re-probed once `worktree ps` stops answering.
let orcaPrefix: readonly string[] | undefined
// The commands to probe, worked out once per load.
let candidates: string[][] | undefined

async function orcaCandidates($: Engine, configured: string): Promise<string[][]> {
  if (configured !== '' && configured !== 'auto') return [[configured]]
  if ((await $.env.get('OS')) === 'Windows_NT') {
    // No shell runs the command, so a .cmd shim needs its name or cmd /c.
    return [['orca'], ['orca.exe'], ['orca.cmd'], ['cmd', '/c', 'orca']]
  }
  // On Linux, bare `orca` outside an Orca terminal can start the GNOME screen reader.
  const uname = await run($, ['uname'])
  if (uname.stdout.trim() === 'Linux') return [['orca-ide']]

  return [['orca']]
}

/** Runs Orca with the command that answered before, probing for one when none has. */
async function orca(
  $: Engine,
  configured: string,
  args: string[],
): Promise<string | undefined> {
  if (orcaPrefix) {
    const r = await run($, [...orcaPrefix, ...args])

    return r.ok && isJson(r.stdout) ? r.stdout : undefined
  }
  candidates ??= await orcaCandidates($, configured)
  for (const prefix of candidates) {
    const r = await run($, [...prefix, ...args])
    if (r.ok && isJson(r.stdout)) {
      orcaPrefix = prefix

      return r.stdout
    }
  }

  return undefined
}

async function readWorkflow($: Engine): Promise<Pick<TrackerSnapshot, 'workflow' | 'workflowError'>> {
  try {
    const progress = await $.fs.read('docs/progress.md')
    const claudeMd = await $.fs.read('CLAUDE.md').catch(() => '')

    return { workflow: parseWorkflow(claudeMd, progress) }
  } catch {
    return { workflowError: 'No docs/progress.md in this folder.' }
  }
}

async function collect(
  $: Engine,
  orcaCommand: string,
  previous: TrackerSnapshot | null,
  withPrs: boolean,
): Promise<TrackerSnapshot> {
  const files = await readWorkflow($)

  let agentsFrom: TrackerSnapshot['agentsFrom'] = 'none'
  let lanes: TrackerLane[] = []
  let gates: TrackerSnapshot['gates'] = []
  const worktrees = await orca($, orcaCommand, ['worktree', 'ps', '--json'])
  // Orca stopped answering (closed, or moved): probe again next time.
  if (worktrees === undefined) orcaPrefix = undefined
  if (worktrees !== undefined) {
    agentsFrom = 'orca'
    const workers = await orca($, orcaCommand, ['orchestration', 'worker-list', '--json'])
    lanes = orcaLanes(worktrees, workers)
    // gate-list may not exist in every Orca version.
    const gateText = await orca($, orcaCommand, ['orchestration', 'gate-list', '--json'])
    gates = gateText ? orcaGates(gateText) : []
  } else {
    const list = await run($, ['git', 'worktree', 'list', '--porcelain'])
    if (list.ok) {
      agentsFrom = 'git'
      lanes = gitLanes(list.stdout)
    }
  }

  let prs = previous?.prs ?? []
  if (withPrs) {
    const gh = await run($, [
      'gh', 'pr', 'list', '--state', 'open', '--limit', '10',
      '--json', 'number,title,headRefName,statusCheckRollup',
    ])
    prs = gh.ok ? ghPrs(gh.stdout) : []
  }

  const head = await run($, ['git', 'rev-parse', '--abbrev-ref', 'HEAD'])
  const status = await run($, ['git', 'status', '--porcelain'])

  return {
    ...files,
    agentsFrom,
    lanes,
    gates,
    prs,
    branch: head.ok ? head.stdout.trim() : undefined,
    uncommitted: status.ok ? changedFiles(status.stdout) : 0,
    updatedAt: await $.clock.now(),
  }
}

export function waitingCount(s: TrackerSnapshot): number {
  return s.lanes.filter(l => l.state === 'wait').length + s.gates.length
}

export function statusText(s: TrackerSnapshot): string | undefined {
  if (!s.workflow) return undefined
  const pos = locate(s.workflow, s.updatedAt)
  if (!pos.current) return 'Workflow done'
  const parts = [`${pos.current.num} ${pos.current.name}`]
  if (pos.step?.step.num) parts.push(pos.step.step.num)
  const running = s.lanes.filter(l => l.state === 'run').length
  if (running > 0) parts.push(`${running} running`)
  const waiting = waitingCount(s)
  if (waiting > 0) parts.push(`${waiting} waiting on you`)

  return parts.join(' · ')
}

function clock(ms: number): string {
  const d = new Date(ms)

  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const LANE_LOOK: Record<TrackerLane['state'], { glyph: string; color?: string; label: string }> = {
  run: { glyph: '●', color: 'claude', label: 'running' },
  done: { glyph: '✓', color: 'success', label: 'done' },
  wait: { glyph: '!', color: 'warning', label: 'waiting on you' },
  idle: { glyph: '·', label: 'idle' },
  unknown: { glyph: '·', label: '' },
}

const CHECKS: Record<TrackerPr['checks'], string> = {
  pass: 'checks ✓',
  fail: 'checks ✗',
  pending: 'checks running',
  none: 'no checks',
}

const TASK_GLYPH: Record<TrackerTask['status'], string> = {
  completed: '✓',
  in_progress: '◉',
  pending: '○',
}

let isBusy = false

async function refresh($: Engine, orcaCommand: string, withPrs: boolean): Promise<void> {
  if (isBusy) return
  isBusy = true
  try {
    const previous = await read($, snapshot)
    const next = await collect($, orcaCommand, previous, withPrs || previous === null)
    await update($, snapshot, () => next)
    $.ui.status(statusText(next))
  } finally {
    isBusy = false
  }
}

export const register: Register = (on, options) => {
  const orcaCommand = String(options.orcaCommand ?? 'auto')
  const refreshMs = Math.max(10, Number(options.refreshSeconds ?? 30)) * 1000
  const openOnStart = options.openOnStart !== false

  let ticks = 0

  on('session.start', async ($, e, next) => {
    const started = await next(e)
    await $.command.register({
      name: 'tracker',
      description: 'Show the workflow milestone tracker beside the chat',
      argumentHint: '[refresh | close]',
    })
    await refresh($, orcaCommand, true)
    if (openOnStart && e.isInteractive) void $.ui.open({ id: PANE, title: TITLE })
    // PRs come from GitHub over the network, so they refresh every fourth tick.
    $.clock.every(refreshMs, () => {
      ticks += 1
      void refresh($, orcaCommand, ticks % 4 === 0)
    })

    return started
  })

  on('command.run', { command: 'tracker' }, async ($, e) => {
    const arg = e.args.trim().toLowerCase()
    if (arg === 'close') {
      await $.ui.close({ id: PANE })

      return { text: 'Milestone tracker closed. Type /tracker to open it again.' }
    }
    await refresh($, orcaCommand, true)
    if (arg === 'refresh') return { text: 'Milestone tracker refreshed.' }
    const opened = await $.ui.open({ id: PANE, title: TITLE })
    const s = await read($, snapshot)
    const line = s ? statusText(s) : undefined

    return {
      text: opened.isPlaced
        ? `Milestone tracker open${line ? `: ${line}` : ''}.`
        : `Milestone tracker is ready but has no room to show yet${line ? ` (${line})` : ''}. Widen the window.`,
    }
  })

  // Files may have changed during the turn (a step ticked, a phase moved on).
  on('turn.complete', async ($, e, next) => {
    const done = await next(e)
    void refresh($, orcaCommand, false)

    return done
  })

  // Claude's own task list for this session becomes the current step's substeps.
  on('tool.call', { tool: 'TaskCreate' }, async ($, e, next) => {
    const ran = await next(e)
    const result = ran.result as { task?: { id?: string; subject?: string } } | undefined
    const id = result?.task?.id
    if (id && !ran.isError && !e.agentId) {
      const task: TrackerTask = { id, subject: result?.task?.subject ?? e.subject, status: 'pending' }
      await update($, tasks, list => [...list.filter(t => t.id !== id), task])
    }

    return ran
  }).catch(($, e, next) => next(e))

  on('tool.call', { tool: 'TaskUpdate' }, async ($, e, next) => {
    const ran = await next(e)
    if (!ran.isError && !ran.deny && !e.agentId) {
      const { taskId, status, subject } = e
      await update($, tasks, list =>
        status === 'deleted'
          ? list.filter(t => t.id !== taskId)
          : list.map(t =>
              t.id === taskId
                ? { ...t, status: status ?? t.status, subject: subject ?? t.subject }
                : t,
            ),
      )
    }

    return ran
  }).catch(($, e, next) => next(e))

  on('tool.call', { tool: 'TaskList' }, async ($, e, next) => {
    const ran = await next(e)
    const result = ran.result as { tasks?: TrackerTask[] } | undefined
    if (Array.isArray(result?.tasks) && !e.agentId) {
      const list = result.tasks.map(t => ({ id: t.id, subject: t.subject, status: t.status }))
      await update($, tasks, () => list)
    }

    return ran
  }).catch(($, e, next) => next(e))

  on('tool.call', { tool: 'TodoWrite' }, async ($, e, next) => {
    const ran = await next(e)
    if (!ran.isError && !ran.deny && !e.agentId) {
      const list = e.todos.map((t, i) => ({ id: `todo-${i}`, subject: t.content, status: t.status }))
      await update($, tasks, () => list)
    }

    return ran
  }).catch(($, e, next) => next(e))

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text, Button } = $.ui.resolve(e)
    const s = await read($, snapshot)
    const taskList = await read($, tasks)

    if (!s) return <Text dimColor>Reading the workflow…</Text>
    if (!s.workflow) {
      return (
        <Box flexDirection="column" gap={1}>
          <Text>{s.workflowError ?? 'No workflow found.'}</Text>
          <Text dimColor>Open Claude Code in the app's repo folder, the one with CLAUDE.md.</Text>
        </Box>
      )
    }

    const pos = locate(s.workflow, s.updatedAt)
    const waiting = waitingCount(s)
    const phase = pos.current
    const prByBranch = new Map(s.prs.map(pr => [pr.branch, pr]))
    const lanePrs = new Set(s.lanes.map(l => l.branch).filter(Boolean))
    const otherPrs = s.prs.filter(pr => !lanePrs.has(pr.branch)).slice(0, 5)

    const stepRow = (step: TrackerStep) => {
      const isCurrent = pos.step?.step === step
      const isNext = pos.next?.step === step
      const glyph = step.isDone ? '✓' : isCurrent ? '◉' : '○'
      const color = step.isDone ? 'success' : isCurrent ? 'claude' : undefined

      return (
        <Box flexDirection="column">
          <Text>
            <Text color={color}>{glyph}</Text>
            <Text dimColor> {step.num || '·'} </Text>
            <Text bold={isCurrent} dimColor={step.isDone}>{step.text}</Text>
            {isNext && <Text color="suggestion"> ← next</Text>}
          </Text>
          {step.subs.map(sub => (
            <Text dimColor={sub.isDone}>
              {'    '}
              <Text color={sub.isDone ? 'success' : undefined}>{sub.isDone ? '✓' : '○'}</Text> {sub.text}
            </Text>
          ))}
          {isCurrent && taskList.length > 0 && (
            <Box flexDirection="column">
              <Text dimColor>{'    '}Claude's tasks</Text>
              {taskList.map(t => (
                <Text dimColor={t.status === 'completed'} bold={t.status === 'in_progress'}>
                  {'    '}
                  <Text color={t.status === 'completed' ? 'success' : t.status === 'in_progress' ? 'claude' : undefined}>
                    {TASK_GLYPH[t.status]}
                  </Text>{' '}
                  {t.subject}
                </Text>
              ))}
            </Box>
          )}
        </Box>
      )
    }

    return (
      <Box flexDirection="column" gap={1}>
        <Text>
          {waiting > 0 ? (
            <Text color="warning" bold>{waiting} waiting on you</Text>
          ) : (
            <Text color="success">Nothing waiting on you</Text>
          )}
        </Text>

        <Text>
          {pos.marks.map((m, i) => (
            <Text
              color={m.mark === 'done' ? 'success' : m.mark === 'current' ? 'claude' : undefined}
              dimColor={m.mark === 'todo'}
              bold={m.mark === 'current'}
            >
              {i > 0 ? ' ' : ''}
              {m.mark === 'done' ? '✓' : m.mark === 'current' ? '▸' : ''}
              {m.num}
            </Text>
          ))}
        </Text>

        {phase ? (
          <Box flexDirection="column">
            <Text dimColor>Phase {phase.num} of {s.workflow.phases.length}</Text>
            <Text bold>{phase.name}</Text>
            {phase.doneWhen !== '' && <Text dimColor>Done when: {phase.doneWhen}</Text>}
            {pos.roundDay && (
              <Text color={pos.roundDay.isOver ? 'warning' : undefined} dimColor={!pos.roundDay.isOver}>
                {pos.roundDay.isOver
                  ? `Round over: close it (4.7)`
                  : `Round day ${pos.roundDay.day} of ${pos.roundDay.of}`}
              </Text>
            )}
          </Box>
        ) : (
          <Text color="success" bold>Every phase is done.</Text>
        )}

        {phase && <Box flexDirection="column">{phase.steps.map(step => stepRow(step))}</Box>}

        {(s.lanes.length > 0 || s.gates.length > 0) && (
          <Box flexDirection="column">
            <Text dimColor>
              {s.agentsFrom === 'orca' ? 'Orca agents' : 'Worktrees (Orca not connected)'}
            </Text>
            {s.lanes.map(lane => {
              const look = LANE_LOOK[lane.state]
              const pr = lane.branch ? prByBranch.get(lane.branch) : undefined
              const meta = [
                lane.agent,
                look.label,
                lane.branch,
                pr ? `PR #${pr.number} ${CHECKS[pr.checks]}` : undefined,
              ].filter(Boolean)

              return (
                <Box flexDirection="column">
                  <Text>
                    <Text color={look.color} dimColor={!look.color}>{look.glyph}</Text>{' '}
                    <Text bold={lane.state === 'wait'}>{lane.name}</Text>
                    <Text dimColor> · {meta.join(' · ')}</Text>
                  </Text>
                  {lane.ask && <Text color="warning">{'  '}“{lane.ask}”</Text>}
                </Box>
              )
            })}
            {s.gates.map(gate => (
              <Text color="warning">
                ◇ Gate: {gate.name}
                {gate.detail && <Text dimColor> · {gate.detail}</Text>}
              </Text>
            ))}
          </Box>
        )}

        {otherPrs.length > 0 && (
          <Box flexDirection="column">
            <Text dimColor>Open PRs</Text>
            {otherPrs.map(pr => (
              <Text>
                <Text color={pr.checks === 'fail' ? 'error' : pr.checks === 'pass' ? 'success' : undefined}>
                  #{pr.number}
                </Text>{' '}
                {pr.title}
                <Text dimColor> · {CHECKS[pr.checks]}</Text>
              </Text>
            ))}
          </Box>
        )}

        <Box flexDirection="column">
          <Text>
            <Text bold>Next: </Text>
            {waiting > 0
              ? 'answer what is waiting on you'
              : pos.step
                ? `${pos.step.step.num ? `${pos.step.step.num} ` : ''}${pos.step.step.text}`
                : 'nothing left'}
          </Text>
          {pos.next && waiting === 0 && (
            <Text dimColor>
              Then: {pos.next.step.num ? `${pos.next.step.num} ` : ''}{pos.next.step.text}
            </Text>
          )}
          <Text dimColor>Type /next for the first action.</Text>
        </Box>

        <Box flexDirection="column">
          {s.branch && (
            <Text dimColor>
              On {s.branch}
              {s.uncommitted > 0 ? ` · ${s.uncommitted} uncommitted` : ''}
            </Text>
          )}
          <Box flexDirection="row" gap={1}>
            <Button key="refresh" label="Refresh" hotkey="r" onPress={() => refresh($, orcaCommand, true)} />
            <Text dimColor>Updated {clock(s.updatedAt)}</Text>
          </Box>
        </Box>
      </Box>
    )
  })
}
