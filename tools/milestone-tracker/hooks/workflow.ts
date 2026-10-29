// Reads the workflow out of CLAUDE.md and docs/progress.md. Pure: text in, data out.

import type {
  TrackerPhase,
  TrackerRound,
  TrackerStep,
  TrackerWorkflow,
} from '../types'

/** Drops markdown the pane can't draw: backticks, bold, italics, links. */
export function plain(text: string): string {
  return text
    .replace(/`([^`]*)`/g, '$1')
    .replace(/\*\*([^*]*)\*\*/g, '$1')
    .replace(/(^|[\s(])_([^_]+)_(?=$|[\s).,])/g, '$1$2')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .trim()
}

type PhaseInfo = { name: string; doneWhen: string }

/** The phase table and "Current state" from CLAUDE.md. */
export function parseClaudeMd(text: string): {
  info: Map<string, PhaseInfo>
  statedPhase?: string
} {
  const info = new Map<string, PhaseInfo>()
  let section = ''
  for (const line of text.split(/\r?\n/)) {
    const heading = /^##\s+(.+?)\s*$/.exec(line)
    if (heading) {
      section = heading[1]!.toLowerCase()
      continue
    }
    if (section !== 'phases') continue
    const row = /^\|\s*(\d{2})\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|/.exec(line)
    // "(see rules below)" points into CLAUDE.md, which the pane doesn't show.
    const doneWhen = plain(row?.[3] ?? '').replace(/\s*\(see [^)]*\)$/, '')
    if (row) info.set(row[1]!, { name: plain(row[2]!), doneWhen })
  }
  const stated = /\*\*Phase:\*\*\s*(\d{2})/.exec(text)

  return { info, statedPhase: stated?.[1] }
}

const ISO_DATE = /\d{4}-\d{2}-\d{2}/

function parseRound(line: string): TrackerRound | undefined {
  const m = /Current round:\s*(.*?)\s*·\s*started:\s*(.*?)\s*·\s*ends:\s*(.*)$/.exec(line)
  if (!m) return undefined
  const started = ISO_DATE.exec(m[2]!)?.[0]
  const ends = ISO_DATE.exec(m[3]!)?.[0]

  return { label: plain(m[1]!), started, ends }
}

/** Phases, steps and indented substeps from docs/progress.md. */
export function parseProgress(text: string): {
  phases: TrackerPhase[]
  round?: TrackerRound
} {
  const phases: TrackerPhase[] = []
  let round: TrackerRound | undefined
  let phase: TrackerPhase | undefined
  let step: TrackerStep | undefined
  for (const line of text.split(/\r?\n/)) {
    const heading = /^##\s+(\d{2})\s*·\s*(.+?)\s*$/.exec(line)
    if (heading) {
      phase = { num: heading[1]!, name: plain(heading[2]!), doneWhen: '', steps: [] }
      phases.push(phase)
      step = undefined
      continue
    }
    if (!phase) continue
    if (line.startsWith('Current round:')) {
      round = parseRound(line)
      continue
    }
    const box = /^(\s*)[-*]\s+\[([ xX])\]\s+(.*)$/.exec(line)
    if (!box) continue
    const isDone = box[2] !== ' '
    if (box[1]!.length >= 2 && step) {
      step.subs.push({ text: plain(box[3]!), isDone })
      continue
    }
    const numbered = /^(\d+\.\d+)\s+(.*)$/.exec(box[3]!)
    step = {
      num: numbered ? numbered[1]! : '',
      text: plain(numbered ? numbered[2]! : box[3]!),
      isDone,
      subs: [],
    }
    phase.steps.push(step)
  }

  return { phases, round }
}

export function parseWorkflow(claudeMd: string, progress: string): TrackerWorkflow {
  const { info, statedPhase } = parseClaudeMd(claudeMd)
  const { phases, round } = parseProgress(progress)
  for (const phase of phases) {
    const known = info.get(phase.num)
    if (known) phase.doneWhen = known.doneWhen
  }

  return { phases, statedPhase, round }
}

export type PhaseMark = 'done' | 'current' | 'todo'

export type StepRef = { phase: TrackerPhase; step: TrackerStep; index: number }

export type Position = {
  current?: TrackerPhase
  marks: { num: string; mark: PhaseMark }[]
  /** The first unticked step of the current phase. */
  step?: StepRef
  /** The unticked step after it, in this phase or the next. */
  next?: StepRef
  /** Day of the phase 04 round and its length, when both dates are real. */
  roundDay?: { day: number; of: number; isOver: boolean }
}

const DAY_MS = 24 * 60 * 60 * 1000

function dayNumber(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number)

  return Math.floor(Date.UTC(y!, m! - 1, d!) / DAY_MS)
}

function isComplete(phase: TrackerPhase): boolean {
  return phase.steps.length > 0 && phase.steps.every(s => s.isDone)
}

function firstOpen(phases: TrackerPhase[], from: number, skip?: TrackerStep): StepRef | undefined {
  for (let p = from; p < phases.length; p++) {
    const phase = phases[p]!
    for (let i = 0; i < phase.steps.length; i++) {
      const step = phase.steps[i]!
      if (!step.isDone && step !== skip) return { phase, step, index: i }
    }
  }

  return undefined
}

/** Where the user is: current phase, its first open step, and what follows. */
export function locate(workflow: TrackerWorkflow, now: number): Position {
  const { phases } = workflow
  let at = phases.findIndex(p => p.num === workflow.statedPhase)
  if (at < 0) at = phases.findIndex(p => !isComplete(p))
  const current = at >= 0 ? phases[at] : undefined
  const marks = phases.map((p, i) => ({
    num: p.num,
    mark: (i === at ? 'current' : isComplete(p) ? 'done' : 'todo') as PhaseMark,
  }))
  const step = at >= 0 ? firstOpen(phases, at) : undefined
  const next = step ? firstOpen(phases, phases.indexOf(step.phase), step.step) : undefined

  let roundDay: Position['roundDay']
  const round = workflow.round
  if (current?.num === '04' && round?.started && round.ends) {
    const start = dayNumber(round.started)
    const of = dayNumber(round.ends) - start
    const today = Math.floor(now / DAY_MS)
    const day = today - start + 1
    if (of > 0) roundDay = { day: Math.min(of, Math.max(1, day)), of, isOver: day > of }
  }

  return { current, marks, step, next, roundDay }
}
