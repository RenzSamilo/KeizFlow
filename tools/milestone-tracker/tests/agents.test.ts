import { expect, test } from 'claude-code/testing'

import { changedFiles, ghPrs, gitLanes, orcaGates, orcaLanes } from '../hooks/agents'

test('worktrees take their state from the worker running in them', () => {
  const worktrees = JSON.stringify({
    worktrees: [
      { name: 'home-a', branch: 'refs/heads/variant/home-a', path: '/r/home-a' },
      { name: 'home-b', branch: 'variant/home-b', agent: 'claude', status: 'done' },
    ],
  })
  const workers = JSON.stringify([
    { name: 'home-a', branch: 'variant/home-a', agent: 'codex', state: 'running' },
    { name: 'home-c', branch: 'variant/home-c', state: 'idle', question: 'Real map tiles?' },
  ])
  const lanes = orcaLanes(worktrees, workers)

  expect(lanes).toEqual([
    { name: 'home-a', branch: 'variant/home-a', agent: 'codex', state: 'run', ask: undefined },
    { name: 'home-b', branch: 'variant/home-b', agent: 'claude', state: 'done', ask: undefined },
    { name: 'home-c', branch: 'variant/home-c', agent: undefined, state: 'wait', ask: 'Real map tiles?' },
  ])
})

test('a needs-attention flag counts as waiting', () => {
  const lanes = orcaLanes(JSON.stringify([{ path: 'C:\\repo\\wt\\screen-feed', needsAttention: true }]))

  expect(lanes[0]?.name).toBe('screen-feed')
  expect(lanes[0]?.state).toBe('wait')
})

test('unknown or broken Orca output gives no lanes, not an error', () => {
  expect(orcaLanes('not json')).toEqual([])
  expect(orcaLanes(JSON.stringify({ ok: true }))).toEqual([])
})

test('open gates only', () => {
  const gates = orcaGates(JSON.stringify({
    gates: [
      { title: 'Pick one winner for Home', status: 'open', recipe: 'variant-fanout' },
      { title: 'Approve stack', status: 'answered' },
    ],
  }))

  expect(gates).toEqual([{ name: 'Pick one winner for Home', detail: 'variant-fanout' }])
})

test('git worktrees skip the main checkout', () => {
  const text = [
    'worktree /r/app\nHEAD abc\nbranch refs/heads/main',
    'worktree /r/app-wt/feed\nHEAD def\nbranch refs/heads/screen/feed',
    'worktree /r/app-wt/old\nHEAD 123\ndetached',
  ].join('\n\n')

  expect(gitLanes(text)).toEqual([
    { name: 'feed', branch: 'screen/feed', state: 'unknown' },
    { name: 'old', branch: undefined, state: 'unknown' },
  ])
})

test('PR checks roll up to pass, fail or pending', () => {
  const prs = ghPrs(JSON.stringify([
    { number: 12, title: 'Home B', headRefName: 'variant/home-b', statusCheckRollup: [{ conclusion: 'SUCCESS' }] },
    { number: 13, title: 'Feed', headRefName: 'f', statusCheckRollup: [{ conclusion: 'SUCCESS' }, { conclusion: 'FAILURE' }] },
    { number: 14, title: 'Map', headRefName: 'm', statusCheckRollup: [{ status: 'IN_PROGRESS' }] },
    { number: 15, title: 'Docs', headRefName: 'd', statusCheckRollup: [] },
  ]))

  expect(prs.map(pr => pr.checks)).toEqual(['pass', 'fail', 'pending', 'none'])
  expect(prs[0]?.branch).toBe('variant/home-b')
})

test('changed files are counted from git status', () => {
  expect(changedFiles(' M a.ts\n?? b.ts\n')).toBe(2)
  expect(changedFiles('')).toBe(0)
})
