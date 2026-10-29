import { expect, mock, test } from 'claude-code/testing'
import type { On } from 'claude-code'

const PANE = {
  plugin: 'milestone-tracker',
  component: 'Pane',
  requestId: 'milestones',
  props: {
    title: 'Milestones',
    isFocused: false,
    bodyColumns: 44,
    placement: 'dock',
    scroll: { offset: 0, bodyRows: 40 },
    view: {},
  },
} as const

const CLAUDE_MD = `## Current state

- **Phase:** 04 · Iterate loop

## Phases

| # | Phase | Done when |
|---|---|---|
| 03 | Vercel live | A push shows a preview link |
| 04 | Iterate loop | Timebox ends with core flows accepted |
`

const PROGRESS = `## 03 · Vercel live

- [x] 3.1 Repo connected to Vercel

## 04 · Iterate loop

Current round: _round 1_ · started: 2026-11-02 · ends: 2026-11-09

- [x] 4.1 UI variants tried
- [ ] 4.2 Color schemes compared
- [ ] 4.3 Features built
`

const WORKTREES = JSON.stringify([
  { name: 'home-a', branch: 'variant/home-a', agent: 'claude', state: 'running' },
  { name: 'home-c', branch: 'variant/home-c', agent: 'codex', question: 'Real map tiles?' },
])

const PRS = JSON.stringify([
  { number: 12, title: 'Home A', headRefName: 'variant/home-a', statusCheckRollup: [{ conclusion: 'SUCCESS' }] },
])

type World = { files: Record<string, string>; hasOrca: boolean; os?: string }

// Everything beneath the plugin: files, commands, the commands it registers, the pane.
function world(on: On, { files, hasOrca, os }: World): string[][] {
  const ran: string[][] = []
  mock.clock(on, { now: Date.UTC(2026, 10, 4, 9) })
  mock.env(on, os ? { OS: os } : {})
  // The engine hands the hook an absolute path, resolved from the working directory.
  on('fs.read', (_, e) => {
    const path = e.path.replace(/\\/g, '/')
    const text = Object.entries(files).find(([name]) => path.endsWith(`/${name}`))?.[1]
    if (text === undefined) throw new Error(`ENOENT ${e.path}`)

    return { value: text }
  })
  on('process.run', (_, e) => {
    const argv = [...e.argv]
    ran.push(argv)
    const result = (exitCode: number, stdout: string) => ({
      value: { exitCode, stdout, stderr: '', isStdoutTruncated: false, isStderrTruncated: false },
    })
    const ok = (stdout: string) => result(0, stdout)
    const joined = argv.join(' ')
    if (hasOrca && /^(orca|orca\.exe) worktree ps/.test(joined)) return ok(WORKTREES)
    if (hasOrca && /^(orca|orca\.exe) orchestration worker-list/.test(joined)) return ok('[]')
    if (hasOrca && /^(orca|orca\.exe) orchestration gate-list/.test(joined)) {
      return ok(JSON.stringify([{ title: 'Pick one winner for Home' }]))
    }
    if (joined === 'uname') return ok('Darwin\n')
    if (joined.startsWith('git worktree list')) {
      return ok('worktree /r/app\nbranch refs/heads/main\n\nworktree /r/wt/feed\nbranch refs/heads/screen/feed\n')
    }
    if (joined.startsWith('git rev-parse')) return ok('variant/home-a\n')
    if (joined.startsWith('git status')) return ok(' M src/Feed.tsx\n')
    if (joined.startsWith('gh pr list')) return ok(PRS)

    return result(1, '')
  })
  on('command.register', () => ({ value: { command: 'tracker' } }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('ui.status', () => ({ value: undefined }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))

  return ran
}

const FILES = { 'CLAUDE.md': CLAUDE_MD, 'docs/progress.md': PROGRESS }

test('the pane shows the phase, steps, Orca agents and what is next, on every surface', async ($, on) => {
  world(on, { files: FILES, hasOrca: true })
  await $.session.start({ cwd: '/r/app', surface: 'desktop', isInteractive: true })

  for (const surface of ['terminal', 'desktop', 'vscode', 'mobile'] as const) {
    const ui = await $.ui.mount({ ...PANE, surface })

    expect((await ui.find({ type: 'Text', text: /waiting on you/ }))?.text).toBe('2 waiting on you')
    expect(await ui.find({ type: 'Text', text: /^Iterate loop$/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /Round day 3 of 7/ })).toBeDefined()
    expect((await ui.find({ type: 'Text', text: /Color schemes compared/ }))?.text).toContain('4.2')
    expect((await ui.find({ type: 'Text', text: /Features built/ }))?.text).toContain('← next')
    expect(await ui.find({ type: 'Text', text: /^Orca agents$/ })).toBeDefined()
    expect((await ui.find({ type: 'Text', text: /home-a/ }))?.text).toContain('PR #12 checks ✓')
    expect(await ui.find({ type: 'Text', text: /Real map tiles\?/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /Gate: Pick one winner for Home/ })).toBeDefined()
    expect((await ui.find({ type: 'Text', text: /^Next:/ }))?.text).toBe('Next: answer what is waiting on you')
    expect(await ui.find({ type: 'Text', text: /1 uncommitted/ })).toBeDefined()
    await ui.unmount()
  }
})

test("Claude's tasks show under the current step as they change", async ($, on) => {
  world(on, { files: FILES, hasOrca: false })
  on('tool.call', (_, e) =>
    e.tool === 'TaskCreate'
      ? { result: { task: { id: '1', subject: 'Write acceptance criteria' } } }
      : { result: { success: true, taskId: '1', updatedFields: ['status'] } },
  )
  await $.session.start({ cwd: '/r/app', surface: 'terminal', isInteractive: true })
  await $.tool.call({ tool: 'TaskCreate', subject: 'Write acceptance criteria', description: 'x' })
  await $.tool.call({ tool: 'TaskUpdate', taskId: '1', status: 'in_progress' })

  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  expect(await ui.find({ type: 'Text', text: /Claude's tasks/ })).toBeDefined()
  expect((await ui.find({ type: 'Text', text: /Write acceptance criteria/ }))?.text).toContain('◉')
  await ui.unmount()
})

test('without Orca, git worktrees stand in and nothing waits', async ($, on) => {
  world(on, { files: FILES, hasOrca: false })
  await $.session.start({ cwd: '/r/app', surface: 'desktop', isInteractive: true })

  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  expect(await ui.find({ type: 'Text', text: /Orca not connected/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /^feed/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /Nothing waiting on you/ })).toBeDefined()
  expect((await ui.find({ type: 'Text', text: /^Next:/ }))?.text).toBe('Next: 4.2 Color schemes compared')
  await ui.unmount()
})

test('on Windows the Orca CLI is tried under its .exe and .cmd names', async ($, on) => {
  const ran = world(on, { files: FILES, hasOrca: false, os: 'Windows_NT' })
  await $.session.start({ cwd: 'C:/app', surface: 'desktop', isInteractive: true })

  const tried = ran.filter(argv => argv.join(' ').includes('worktree ps')).map(argv => argv.slice(0, 3).join(' '))
  expect(tried.slice(0, 4)).toEqual(['orca worktree ps', 'orca.exe worktree ps', 'orca.cmd worktree ps', 'cmd /c orca'])
})

test('a folder with no progress file says so', async ($, on) => {
  world(on, { files: {}, hasOrca: false })
  await $.session.start({ cwd: '/elsewhere', surface: 'desktop', isInteractive: true })

  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  expect(await ui.find({ type: 'Text', text: /No docs\/progress.md/ })).toBeDefined()
  await ui.unmount()
})
