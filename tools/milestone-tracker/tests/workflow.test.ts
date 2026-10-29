import { expect, test } from 'claude-code/testing'

import { locate, parseWorkflow, plain } from '../hooks/workflow'

const CLAUDE_MD = `# App

## Current state

- **Phase:** 04 · Iterate loop

## Phases

| # | Phase | Done when |
|---|---|---|
| 01 | Idea & scope | Short spec exists |
| 04 | Iterate loop | Timebox ends with core flows accepted (see rules below) |
| 05 | Sign-off gate | Every item in the gate checklist is true |

## Orca

| 04 Iterate: UI variants | Fan out |
`

const PROGRESS = `# Progress

## 01 · Idea & scope

- [x] 1.1 One-line pitch
- [x] 1.2 Core features in \`docs/parking-lot.md\`

## 04 · Iterate loop

Current round: _round 1_ · started: 2026-11-02 · ends: 2026-11-09

- [x] 4.1 UI variants tried
- [ ] 4.2 Color schemes compared
- [ ] 4.3 Features built
  - [x] Feed screen
  - [ ] Profile screen

## 05 · Sign-off gate

- [ ] Final screens and flows approved
`

const DAY = 24 * 60 * 60 * 1000

test('reads phases, steps, substeps and the round', () => {
  const w = parseWorkflow(CLAUDE_MD, PROGRESS)

  expect(w.phases.map(p => p.num)).toEqual(['01', '04', '05'])
  expect(w.statedPhase).toBe('04')
  expect(w.phases[1]?.doneWhen).toBe('Timebox ends with core flows accepted')
  expect(w.phases[0]?.steps[1]?.text).toBe('Core features in docs/parking-lot.md')
  expect(w.phases[1]?.steps[2]?.subs).toEqual([
    { text: 'Feed screen', isDone: true },
    { text: 'Profile screen', isDone: false },
  ])
  expect(w.phases[2]?.steps[0]?.num).toBe('')
  expect(w.round).toEqual({ label: 'round 1', started: '2026-11-02', ends: '2026-11-09' })
})

test('finds the current step, the next one and the round day', () => {
  const w = parseWorkflow(CLAUDE_MD, PROGRESS)
  const pos = locate(w, Date.UTC(2026, 10, 4, 12))

  expect(pos.current?.num).toBe('04')
  expect(pos.step?.step.num).toBe('4.2')
  expect(pos.next?.step.num).toBe('4.3')
  expect(pos.marks.map(m => m.mark)).toEqual(['done', 'current', 'todo'])
  expect(pos.roundDay).toEqual({ day: 3, of: 7, isOver: false })
  expect(locate(w, Date.UTC(2026, 10, 9) + 2 * DAY).roundDay?.isOver).toBe(true)
})

test('the next step can be in the following phase', () => {
  const done = PROGRESS.replace('- [ ] 4.2', '- [x] 4.2')
  const pos = locate(parseWorkflow(CLAUDE_MD, done), 0)

  expect(pos.step?.step.num).toBe('4.3')
  expect(pos.next?.phase.num).toBe('05')
})

test('without a stated phase, the first unfinished one is current', () => {
  const pos = locate(parseWorkflow('', PROGRESS), 0)

  expect(pos.current?.num).toBe('04')
  expect(pos.roundDay).toBeDefined()
})

test('an unstarted round shows no day count', () => {
  const unstarted = PROGRESS.replace(
    'Current round: _round 1_ · started: 2026-11-02 · ends: 2026-11-09',
    'Current round: _not started_ · started: _date_ · ends: _date + 1 week_',
  )
  const w = parseWorkflow(CLAUDE_MD, unstarted)

  expect(w.round?.label).toBe('not started')
  expect(locate(w, 0).roundDay).toBeUndefined()
})

test('Windows line endings parse the same', () => {
  const w = parseWorkflow(CLAUDE_MD.replace(/\n/g, '\r\n'), PROGRESS.replace(/\n/g, '\r\n'))

  expect(w.phases[1]?.steps.length).toBe(3)
  expect(w.statedPhase).toBe('04')
})

test('plain drops markdown the pane cannot draw', () => {
  expect(plain('Run **`/audit`** and see [docs](x.md)')).toBe('Run /audit and see docs')
})
