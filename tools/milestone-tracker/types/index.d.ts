// What the milestone tracker keeps in $.state, and the shapes its parsers return.

export type TrackerSubstep = { text: string; isDone: boolean }

export type TrackerStep = {
  /** "4.3", or "" for an unnumbered checklist line (phase 05). */
  num: string
  text: string
  isDone: boolean
  subs: TrackerSubstep[]
}

export type TrackerPhase = {
  /** "01" to "09". */
  num: string
  name: string
  doneWhen: string
  steps: TrackerStep[]
}

export type TrackerRound = {
  label: string
  /** ISO dates (YYYY-MM-DD) when the file holds real dates. */
  started?: string
  ends?: string
}

export type TrackerWorkflow = {
  phases: TrackerPhase[]
  /** The phase CLAUDE.md's "Current state" names, if any. */
  statedPhase?: string
  round?: TrackerRound
}

export type TrackerTask = {
  id: string
  subject: string
  status: 'pending' | 'in_progress' | 'completed'
}

export type TrackerLaneState = 'run' | 'done' | 'wait' | 'idle' | 'unknown'

export type TrackerLane = {
  name: string
  branch?: string
  agent?: string
  state: TrackerLaneState
  /** The question or note shown when the agent needs you. */
  ask?: string
}

export type TrackerGate = { name: string; detail?: string }

export type TrackerChecks = 'pass' | 'fail' | 'pending' | 'none'

export type TrackerPr = {
  number: number
  title: string
  branch: string
  checks: TrackerChecks
}

export type TrackerSnapshot = {
  workflow?: TrackerWorkflow
  /** Why the workflow files could not be read, when they could not. */
  workflowError?: string
  /** "orca" when the Orca CLI answered, "git" for the worktree fallback. */
  agentsFrom: 'orca' | 'git' | 'none'
  lanes: TrackerLane[]
  gates: TrackerGate[]
  prs: TrackerPr[]
  branch?: string
  uncommitted: number
  updatedAt: number
}

declare module 'claude-code' {
  interface PluginState {
    'milestone-tracker': {
      snapshot: Shaped<TrackerSnapshot | null>
      tasks: Shaped<TrackerTask[]>
    }
  }
}
