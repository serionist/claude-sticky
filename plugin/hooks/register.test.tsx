import type { On } from 'claude-code'
import type { Engine } from 'claude-code/testing'
import { expect, mock, test } from 'claude-code/testing'

type Surface = 'terminal' | 'desktop' | 'vscode' | 'mobile'

const PIN = 'mcp__sticky__pin'
const UNPIN = 'mcp__sticky__unpin'
const MINUTE = 60_000
const DAY = 24 * 60 * MINUTE
// The clock's start: late enough for a kept board to be older than it.
const START = 100 * DAY

const BAND = {
  plugin: 'sticky',
  component: 'AbovePrompt',
  requestId: 'band',
  props: {
    hasSurvey: false,
    isCollapsed: false,
    isWorking: false,
    maxRows: 12,
    bodyColumns: 80,
    scroll: { offset: 0, bodyRows: 12 },
    view: {},
  },
} as const

const PANE = {
  plugin: 'sticky',
  component: 'Pane',
  requestId: 'sticky',
  props: {
    title: 'Sticky',
    isFocused: false,
    bodyColumns: 40,
    placement: 'dock',
    scroll: { offset: 0, bodyRows: 20 },
    view: {},
  },
} as const

const TYPED = { wait: false, origin: { kind: 'composer' } } as const

type World = {
  /** Whether the terminal seats a pane opened unasked. */
  isWide?: boolean
  /** What the plugin's store holds as the session starts. */
  kept?: Record<string, unknown>
  /** What the small model answers when it reads a reply. */
  found?: string
  /** Why Claude Code takes no prompt from a plugin, when it takes none. */
  refuses?: string
}

// Each hook here stands for the engine beneath the plugin. `seen` records what
// the plugin asked of it, `sent` the prompts that entered, `store` what it
// keeps, and `time` is the clock, which moves only when a test moves it.
const engine = async ($: Engine, on: On, world: World = {}) => {
  const seen: string[] = []
  const sent: string[] = []
  const filled: string[] = []
  const store = new Map(Object.entries(world.kept ?? {}))
  const time = mock.clock(on, { now: START })

  on('tool.register', (_, e) => ({ value: { tool: `mcp__sticky__${e.name}` } }))
  on('command.register', () => ({ value: { command: 'sticky' } }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('session.end', (_, e) => ({ sessionId: e.sessionId }))
  on('session.id', () => ({ value: 's1' }))
  on('store.get', (_, e) => ({ value: store.get(e.key) }))
  on('store.keys', () => ({ value: [...store.keys()] }))
  on('store.set', (_, e) => {
    store.set(e.key, e.value)

    return { value: undefined }
  })
  on('store.delete', (_, e) => {
    store.delete(e.key)

    return { value: undefined }
  })
  on('prompt.submit', (_, e) => {
    if (world.refuses !== undefined && e.origin.kind === 'plugin') {
      return { drop: world.refuses }
    }

    sent.push(e.text)

    return { text: e.text, context: e.context }
  })
  on('prompt.fill', (_, e) => {
    filled.push(e.text)

    return { isFilled: true }
  })
  on('classic.Stop', () => ({}))
  on('turn.start', (_, e) => ({ turnId: e.turnId }))
  on('turn.complete', (_, e) => ({ text: e.answer }))
  on('prompt.compose', () => ({
    sections: [{ id: 'intro', text: 'You are Claude.', scope: 'shared' }],
  }))
  on('model.complete', () => ({
    value: {
      isAnswered: true,
      text: world.found ?? 'NONE',
      usage: {
        input_tokens: 1200,
        output_tokens: 14,
        cache_read_input_tokens: 300,
        cache_creation_input_tokens: 0,
      },
    },
  }))
  on('ui.notify', (_, e) => {
    seen.push(`notify: ${e.text}`)

    return { value: { isSent: true, channel: 'terminal_bell' } }
  })
  on('ui.cancelNotify', (_, e) => {
    seen.push(`cancel ${e.key}`)

    return { value: { isSent: true } }
  })
  on('ui.toast', (_, e) => {
    seen.push(`toast: ${e.text}`)

    return { value: undefined }
  })
  on('ui.open', () => {
    seen.push('open')

    return {
      value: world.isWide === false ? { isPlaced: false, reason: 'narrow' } : { isPlaced: true },
    }
  })
  on('ui.close', (_, e) => {
    seen.push(`close by ${e.origin.kind}`)

    return { value: undefined }
  })
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)

    return <Text>engine</Text>
  })

  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })

  return { seen, sent, filled, store, time }
}

const pin = ($: Engine, kind: string, text: string) => $.tool.call({ tool: PIN, kind, text })

const shown = async ($: Engine, target: typeof BAND | typeof PANE, surface: Surface = 'terminal') => {
  const ui = await $.ui.mount({ ...target, surface })
  const drawn = await ui.findAll({})
  await ui.unmount()

  // The texts and the labels of the buttons, in the order drawn.
  return drawn
    .filter(found => found.type === 'Text' || found.type === 'Button')
    .map(found => found.text)
    .join('\n')
}

const press = async ($: Engine, key: string, target: typeof BAND | typeof PANE = BAND) => {
  const ui = await $.ui.mount({ ...target, surface: 'terminal' })
  await ui.press({ key })
  await ui.unmount()
}

const sticky = ($: Engine, args: string) =>
  $.command.run({
    command: 'sticky',
    args,
    origin: { kind: 'composer' },
    presentation: { isFullscreen: true, columns: 120 },
  })

test('an ask stays through a reply until it is unpinned', async ($, on) => {
  await engine($, on)

  expect((await pin($, 'ask', 'Drop the  legacy routes?')).result).toBe('Pinned as 1.')
  await pin($, 'note', 'Skipped the flaky e2e suite')

  for (const surface of ['terminal', 'desktop'] as const) {
    const band = await shown($, BAND, surface)
    expect(band).toContain('Waiting on you')
    expect(band).toContain('1 ask · 1 note')
    expect(band).toContain('1 ?')
    expect(band).toContain('2 !')
    expect(band).toContain('Drop the legacy routes?')
  }

  // The reply carries the board, and clears nothing by itself.
  const entered = await $.prompt.submit({ text: 'keep them', ...TYPED })
  expect(entered.context?.join(' ')).toContain('- 1 (ask): Drop the legacy routes?')
  expect(entered.context?.join(' ')).toContain('("2?") asks you to say more')
  expect(await shown($, BAND)).toContain('Drop the legacy routes?')

  const unpinned = await $.tool.call({ tool: UNPIN, ids: ['1', 9] })
  expect(unpinned.result).toBe('Unpinned 1. Not on the board: 9. Still pinned: 2.')

  // A number is not given out twice.
  expect((await pin($, 'ask', 'Run the migration now?')).result).toBe('Pinned as 3.')
  await $.tool.call({ tool: UNPIN, ids: [3] })

  const band = await shown($, BAND)
  expect(band).toContain('Nothing needed from you')
  expect(band).not.toContain('Drop the legacy routes?')
  expect(band).toContain('Skipped the flaky e2e suite')
})

test('an empty board leaves the band to the engine', async ($, on) => {
  await engine($, on)

  expect(await shown($, BAND)).toBe('engine')
})

test('a prompt nobody typed carries no board', async ($, on) => {
  await engine($, on)
  await pin($, 'ask', 'Run the migration now?')

  const notified = await $.prompt.submit({
    text: 'task done',
    wait: false,
    isMeta: true,
    origin: { kind: 'task-notification' },
  })
  expect(notified.context).toBeUndefined()
})

test('an item is reworded in place by its number', async ($, on) => {
  await engine($, on)
  await pin($, 'progress', 'Migrating module 3 of 7')

  const reworded = await $.tool.call({
    tool: PIN,
    kind: 'progress',
    text: 'Migrating module 4 of 7',
    id: '1',
  })
  expect(reworded.result).toBe('Pinned as 1.')

  const band = await shown($, BAND)
  expect(band).toContain('module 4 of 7')
  expect(band).not.toContain('module 3 of 7')
  expect((await $.tool.call({ tool: PIN, kind: 'note', text: 'x', id: '7' })).deny).toBe('No item 7 is on the board.')
})

test('background work is listed from the end of a turn', async ($, on) => {
  await engine($, on)

  await $.classic.Stop({
    stop_hook_active: false,
    background_tasks: [
      {
        id: 't1',
        type: 'shell',
        status: 'running',
        description: 'the e2e suite',
        command: 'npm run test:e2e',
      },
    ],
  })

  const band = await shown($, BAND)
  expect(band).toContain('Nothing needed from you')
  expect(band).toContain('1 in progress')
  expect(band).toContain('shell: npm run test:e2e')

  await $.classic.Stop({ stop_hook_active: false, background_tasks: [] })
  expect(await shown($, BAND)).toBe('engine')
})

test('the dismiss mark removes its item', async ($, on) => {
  await engine($, on)
  await pin($, 'note', 'Branch is not pushed')
  await pin($, 'ask', 'Merge to main?')

  await press($, 'drop:1')

  const band = await shown($, BAND)
  expect(band).not.toContain('Branch is not pushed')
  expect(band).toContain('Merge to main?')
})

test('a long board moves to the pane and comes back when short', async ($, on) => {
  const { seen } = await engine($, on)

  for (let n = 1; n <= 10; n += 1) {
    await pin($, 'ask', `Question ${n}?`)
  }

  expect(seen).toEqual([])
  expect(await shown($, BAND)).toContain('Question 10?')

  await pin($, 'ask', 'Question 11?')
  expect(seen).toEqual(['open'])

  const band = await shown($, BAND)
  expect(band).toContain('11 asks')
  expect(band).toContain('in the Sticky pane')
  expect(band).not.toContain('Question 1?')

  for (const surface of ['terminal', 'desktop', 'vscode', 'mobile'] as const) {
    expect(await shown($, PANE, surface)).toContain('Question 11?')
  }

  await $.tool.call({ tool: UNPIN, ids: ['11'] })
  expect(seen).toEqual(['open', 'close by plugin'])
  expect(await shown($, BAND)).toContain('Question 1?')
})

test('a terminal too narrow for the pane keeps the list in the band', async ($, on) => {
  await engine($, on, { isWide: false })

  for (let n = 1; n <= 11; n += 1) {
    await pin($, 'ask', `Question ${n}?`)
  }

  const band = await shown($, BAND)
  expect(band).toContain('Question 11?')
  expect(band).not.toContain('in the Sticky pane')
})

test('an item carries the status and the tone Claude gives it', async ($, on) => {
  await engine($, on)
  await $.tool.call({
    tool: PIN,
    kind: 'progress',
    text: 'Deploy build 412',
    status: 'rolling  out',
    tone: 'active',
  })
  await $.tool.call({ tool: PIN, kind: 'ask', text: 'Merge to main?', status: 'blocks the release' })

  const band = await $.ui.mount({ ...BAND, surface: 'terminal' })
  const status = await band.find({ type: 'Text', text: /^ · rolling out$/ })
  expect(status?.props.color).toBe('claude')
  expect(await band.find({ type: 'Text', text: /^ · blocks the release$/ })).toBeDefined()
  await band.unmount()

  // A change names the item and what changes, and nothing else.
  await $.tool.call({ tool: PIN, id: 1, status: 'failed', tone: 'bad' })
  const failed = await $.ui.mount({ ...BAND, surface: 'terminal' })
  expect((await failed.find({ type: 'Text', text: /^ · failed$/ }))?.props.color).toBe('error')
  await failed.unmount()
  expect(await shown($, BAND)).toContain('Deploy build 412')

  const entered = await $.prompt.submit({ text: 'why?', ...TYPED })
  expect(entered.context?.join(' ')).toContain('- 1 (progress, failed): Deploy build 412')

  // An empty status takes it off.
  await $.tool.call({ tool: PIN, id: 1, status: '' })
  expect(await shown($, BAND)).not.toContain('failed')
})

test('the parts of a job are one line that opens', async ($, on) => {
  const { seen } = await engine($, on)
  const part = (text: string, status: string, tone: string) =>
    $.tool.call({ tool: PIN, kind: 'progress', text, status, tone, group: 'Epic #40 checkout' })

  await part('#41 Cart totals', 'merged', 'good')
  await part('#42 Address form', 'merged', 'good')
  await part('#43 Payment step', 'in review', 'active')
  await part('#44 Receipts', 'queued', 'muted')
  await pin($, 'progress', 'Waiting for the nightly build')

  // Twelve more parts would not move the board to the pane: a job is one line.
  for (let n = 45; n <= 56; n += 1) {
    await part(`#${n} More`, 'queued', 'muted')
  }

  expect(seen).toEqual([])

  const closed = await shown($, BAND)
  expect(closed).toContain('Epic #40 checkout')
  expect(closed).toContain('2 merged · 1 in review · 13 queued')
  expect(closed).toContain('17 in progress')
  expect(closed).toContain('Waiting for the nightly build')
  expect(closed).not.toContain('#43 Payment step')

  await press($, 'more:group:Epic #40 checkout')
  const opened = await shown($, BAND)
  expect(opened).toContain('#43 Payment step')
  expect(opened).toContain(' · in review')

  const entered = await $.prompt.submit({ text: 'how is it going?', ...TYPED })
  expect(entered.context?.join(' ')).toContain('- 3 (progress, in review, in "Epic #40 checkout"): #43 Payment step')

  // The key for all opens and closes jobs too, and the mark drops the job whole.
  await press($, 'all')
  expect(await shown($, BAND)).not.toContain('#43 Payment step')
  await press($, 'drop:group:Epic #40 checkout')
  const after = await shown($, BAND)
  expect(after).not.toContain('Epic #40 checkout')
  expect(after).toContain('Waiting for the nightly build')
})

test('subagents are left out of the background work', async ($, on) => {
  await engine($, on)

  await $.classic.Stop({
    stop_hook_active: false,
    background_tasks: [
      { id: 't1', type: 'subagent', status: 'running', description: 'Build the repo', agent_type: 'general-purpose' },
      { id: 't2', type: 'shell', status: 'running', description: 'tests', command: 'npm test' },
    ],
  })

  const band = await shown($, BAND)
  expect(band).toContain('shell: npm test · running')
  expect(band).not.toContain('Build the repo')
  expect(band).toContain('1 in progress')
})

test('a kept board whose session never came back is dropped', async ($, on) => {
  const note = (text: string) => [{ id: '1', kind: 'note', text }]
  const { store } = await engine($, on, {
    kept: {
      'board:old': { seq: 1, items: note('Long ago'), savedAt: START - 61 * DAY },
      'board:recent': { seq: 1, items: note('Last week'), savedAt: START - 7 * DAY },
      'board:undated': { seq: 1, items: note('Before boards were dated') },
    },
  })

  expect([...store.keys()]).toEqual(['board:recent', 'board:undated'])

  await pin($, 'note', 'Branch is not pushed')
  expect(store.get('board:s1')).toMatchObject({ seq: 1, savedAt: START })
})

test('an item whose kind changes sheds what only the old kind takes', async ($, on) => {
  await engine($, on)
  await $.tool.call({ tool: PIN, kind: 'ask', text: 'Ship it?', options: ['yes', 'no'] })
  await $.tool.call({ tool: PIN, id: 1, kind: 'note', text: 'Shipped' })

  const band = await shown($, BAND)
  expect(band).toContain('Shipped')
  expect(band).not.toContain('a: yes')

  // A tone the board does not know is left out, a name every object has too.
  await $.tool.call({ tool: PIN, id: 1, tone: 'constructor' })
  const drawn = await $.ui.mount({ ...BAND, surface: 'terminal' })
  expect((await drawn.find({ type: 'Text', text: /^1 !$/ }))?.props.color).toBe('suggestion')
  await drawn.unmount()
})

test("/sticky usage reports the reply check's calls and tokens", async ($, on) => {
  const { time } = await engine($, on)

  expect((await sticky($, 'usage')).text).toBe(
    'The reply check has made 0 Haiku calls in this session: 0 tokens in, 0 out.',
  )

  // Each call counts what it read, the cached part included, and what it wrote.
  await $.classic.Stop({ stop_hook_active: false, last_assistant_message: 'All done.' })
  await time.settle()
  await $.classic.Stop({ stop_hook_active: false, last_assistant_message: 'The tests pass.' })
  await time.settle()

  expect((await sticky($, 'usage')).text).toBe(
    'The reply check has made 2 Haiku calls in this session: 3,000 tokens in, 28 out.',
  )

  // A /clear starts the count again with the session.
  await $.session.end({ reason: 'clear', sessionId: 's1', resume: { id: 's1' } })
  expect((await sticky($, 'usage')).text).toContain('0 Haiku calls')
})

// Not covered: the person closing the pane by hand. The kit raises no
// `ui.close` of theirs, so that path is checked in a session.

test('/sticky and the key for the side move the board to the pane and back', async ($, on) => {
  const { seen } = await engine($, on)
  await pin($, 'note', 'Branch is not pushed')

  expect((await sticky($, '')).text).toBe('The sticky board is in its pane.')
  expect(await shown($, BAND)).toContain('in the Sticky pane')
  expect((await sticky($, '')).text).toBe('The sticky board is above the prompt.')
  expect(seen).toEqual(['open', 'close by plugin'])
  expect(await shown($, BAND)).toContain('Branch is not pushed')

  const band = await $.ui.mount({ ...BAND, surface: 'terminal' })
  expect((await band.find({ key: 'side' }))?.props.hotkey).toBe('s')
  await band.press({ key: 'side' })
  await band.unmount()
  expect(await shown($, BAND)).toContain('in the Sticky pane')

  await press($, 'side', PANE)
  expect(seen).toEqual(['open', 'close by plugin', 'open', 'close by plugin'])
  expect(await shown($, BAND)).toContain('Branch is not pushed')
})

test('a /clear takes the board off the screen', async ($, on) => {
  await engine($, on)
  await pin($, 'ask', 'Merge to main?')

  await $.session.end({ reason: 'clear', sessionId: 's1', resume: { id: 's1' } })
  expect(await shown($, BAND)).toBe('engine')
})

test('the system prompt gains the section on the board', async ($, on) => {
  await engine($, on)

  const composed = await $.prompt.compose({
    model: 'claude-fable-5-2',
    promptModel: 'claude-fable-5-2',
    surfaces: ['terminal'],
    tools: [PIN, UNPIN],
    outputStyle: null,
    traits: [],
  })

  expect(composed.sections.map(section => section.id)).toEqual(['intro', 'sticky:board'])
  expect(composed.sections[1]?.text).toContain('stays until it is settled')
})

test('a detail opens by its mark, by the key for all and by /sticky', async ($, on) => {
  await engine($, on)
  await $.tool.call({
    tool: PIN,
    kind: 'ask',
    text: 'Run the staging migration now?',
    detail: 'It locks the  orders table for about two minutes.',
  })
  await pin($, 'note', 'Branch is not pushed')

  const detail = 'It locks the orders table for about two minutes.'

  expect(await shown($, BAND)).not.toContain(detail)

  await press($, 'more:1')
  expect(await shown($, BAND)).toContain(detail)
  await press($, 'more:1')
  expect(await shown($, BAND)).not.toContain(detail)

  await press($, 'all')
  expect(await shown($, BAND)).toContain(detail)
  await press($, 'all')
  expect(await shown($, BAND)).not.toContain(detail)

  expect((await sticky($, '1')).text).toBe('Item 1 is open.')
  expect(await shown($, BAND)).toContain(detail)
  expect((await sticky($, '2')).text).toBe('Item 2 has no detail. Send "2?" to ask for more.')
  expect((await sticky($, '7')).text).toBe('No item 7 is on the sticky board.')

  // A rewording that names no detail keeps it.
  await $.tool.call({ tool: PIN, kind: 'ask', text: 'Run it tonight?', id: 1 })
  expect(await shown($, BAND)).toContain(detail)
})

test('the last row lists the keys once k opens the list', async ($, on) => {
  await engine($, on)
  await pin($, 'ask', 'Merge to main?')

  // Closed, the row holds the board's own actions and the key that opens the list.
  const closed = await $.ui.mount({ ...BAND, surface: 'terminal' })
  expect((await closed.find({ key: 'keys' }))?.props.hotkey).toBe('k')
  await closed.unmount()
  expect(await shown($, BAND)).not.toContain('ctrl+x')
  expect(await shown($, BAND)).toContain('to the side')

  await press($, 'keys')

  const band = await shown($, BAND)
  expect(band).toContain('hide keys')
  // How to give the board the keyboard comes before the keys it then takes.
  expect(band.indexOf('press ctrl+x, then tab, to use these keys:')).toBeGreaterThan(-1)
  expect(band.indexOf('press ctrl+x, then tab')).toBeLessThan(band.indexOf('to the side'))
  expect(band).toContain('ctrl+x ctrl+a: hide')
  expect(band).toContain('reply "1: yes", or "1?" to hear more')
  expect(await shown($, PANE)).toContain('ctrl+x x: close')

  await press($, 'keys')
  expect(await shown($, BAND)).not.toContain('ctrl+x')
})

test('the keys are left out when switched off', { options: { showKeys: false } }, async ($, on) => {
  await engine($, on)
  await pin($, 'ask', 'Merge to main?')

  const band = await $.ui.mount({ ...BAND, surface: 'terminal' })
  expect(await band.find({ key: 'keys' })).toBeUndefined()
  expect(await band.find({ key: 'side' })).toBeDefined()
  await band.unmount()
  expect(await shown($, BAND)).not.toContain('ctrl+x')
})

test('answers sent during a turn wait for its end, and go out once', async ($, on) => {
  const { sent, time } = await engine($, on)
  const turn = { text: 'carry on', turnId: 't1' }
  const done = { answer: 'Done.', durationMs: 1000, isAborted: false, turnId: 't1' }
  await $.tool.call({ tool: PIN, kind: 'ask', text: 'Run the migration now?', options: ['yes', 'no'] })

  await $.turn.start(turn)
  await press($, 'pick:1:0')
  await press($, 'send')

  // Held: nothing is submitted, and the ask stays where the person can change it.
  expect(sent).toEqual([])
  const held = await shown($, BAND)
  expect(held).toContain('1 answer goes to Claude when this turn ends')
  expect(held).toContain("don't send")
  expect(held).toContain('Run the migration now?')

  // A second press takes it back, a third holds it again.
  await press($, 'send')
  expect(await shown($, BAND)).toContain('send 1 answer')
  await press($, 'send')

  // A subagent's turn ending is not the conversation's.
  await $.turn.complete({ ...done, agentId: 'a1', reason: 'answer' })
  await time.advance(1000)
  expect(sent).toEqual([])

  await $.turn.complete({ ...done, reason: 'answer' })
  expect(sent).toEqual([])
  await time.advance(1000)
  expect(sent).toEqual(['1: yes (to: Run the migration now?)'])
  expect(await shown($, BAND)).toBe('engine')
})

test('answers held through an interrupted turn are not sent by themselves', async ($, on) => {
  const { sent, time } = await engine($, on)
  await $.tool.call({ tool: PIN, kind: 'ask', text: 'Run the migration now?', options: ['yes', 'no'] })

  await $.turn.start({ text: 'carry on', turnId: 't1' })
  await press($, 'pick:1:0')
  await press($, 'send')
  await $.turn.complete({ answer: '', durationMs: 1000, isAborted: true, turnId: 't1', reason: 'aborted' })
  await time.advance(1000)

  // The answer stays marked, and send is a press away now that nothing runs.
  expect(sent).toEqual([])
  expect(await shown($, BAND)).toContain('send 1 answer')
  await press($, 'send')
  expect(sent).toEqual(['1: yes (to: Run the migration now?)'])
})

test('answers held when the next turn starts at once go out after that one', async ($, on) => {
  const { sent, time } = await engine($, on)
  const done = { answer: 'Done.', durationMs: 1000, isAborted: false, reason: 'answer' } as const
  await $.tool.call({ tool: PIN, kind: 'ask', text: 'Run the migration now?', options: ['yes', 'no'] })

  await $.turn.start({ text: 'carry on', turnId: 't1' })
  await press($, 'pick:1:0')
  await press($, 'send')
  await $.turn.complete({ ...done, turnId: 't1' })
  // A prompt the person had queued starts its turn before the answers went out.
  await $.turn.start({ text: 'and the docs', turnId: 't2' })
  await time.advance(1000)
  expect(sent).toEqual([])

  await $.turn.complete({ ...done, turnId: 't2' })
  await time.advance(1000)
  expect(sent).toEqual(['1: yes (to: Run the migration now?)'])
})

test('answers Claude Code does not take stay marked and go into the prompt box', async ($, on) => {
  const stopped = 'the session was stopped and nobody has sent input since'
  const { sent, seen, filled } = await engine($, on, { refuses: stopped })
  await $.tool.call({ tool: PIN, kind: 'ask', text: 'Run the migration now?', options: ['yes', 'no'] })

  await press($, 'pick:1:0')
  await press($, 'send')

  expect(sent).toEqual([])
  expect(filled).toEqual(['1: yes (to: Run the migration now?)'])
  expect(seen.at(-1)).toContain(stopped)
  expect(seen.at(-1)).toContain('press Enter')

  // Nothing is lost: the ask and its answer are where they were, and send is there again.
  const band = await shown($, BAND)
  expect(band).toContain('Run the migration now?')
  expect(band).toContain('send 1 answer')
})

test('answers pressed on the board are sent as one message', async ($, on) => {
  const { sent } = await engine($, on)
  await $.tool.call({
    tool: PIN,
    kind: 'ask',
    text: 'Run the staging migration now?',
    options: ['yes', 'no'],
  })
  await $.tool.call({
    tool: PIN,
    kind: 'ask',
    text: 'Auth token expiry?',
    options: ['keep 24h', 'shorten to 1h'],
  })
  await pin($, 'ask', 'Who reviews the release notes?')

  const before = await shown($, BAND)
  expect(before).toContain('a: yes')
  expect(before).toContain('b: shorten to 1h')
  expect(before).not.toContain('send')

  // A second press on another answer changes the pick; one on the same clears it.
  await press($, 'pick:1:1')
  await press($, 'pick:1:0')
  await press($, 'pick:2:1')
  await press($, 'pick:2:1')
  expect(await shown($, BAND)).toContain('send 1 answer')
  await press($, 'pick:2:1')
  expect(await shown($, BAND)).toContain('send 2 answers')

  const typed = await $.prompt.submit({ text: 'hold on', ...TYPED })
  expect(typed.context?.join(' ')).toContain('- 2 (ask): Auth token expiry? [a: keep 24h | b: shorten to 1h]')

  await press($, 'send')
  expect(sent.at(-1)).toBe('1: yes (to: Run the staging migration now?)\n2: shorten to 1h (to: Auth token expiry?)')

  const after = await shown($, BAND)
  expect(after).not.toContain('Auth token expiry?')
  expect(after).toContain('Who reviews the release notes?')
  expect(after).not.toContain('send')
})

test('an ask left out of the board is found in the reply', async ($, on) => {
  const { time } = await engine($, on, {
    found: 'ASK: Merge the  release branch to main?\nnot a line of it\nASK: Tag it v2.1?',
  })

  await $.classic.Stop({
    stop_hook_active: false,
    last_assistant_message: 'All green. Should I merge and tag it?',
  })
  await time.settle()

  const band = await shown($, BAND)
  expect(band).toContain('Merge the release branch to main?')
  expect(band).toContain('from the reply')
  expect(band).toContain('2 asks')

  const entered = await $.prompt.submit({ text: 'yes to both', ...TYPED })
  expect(entered.context?.join(' ')).toContain('- 2 (ask, found in your last reply): Tag it v2.1?')
})

test('a question the board already holds is not found again', async ($, on) => {
  const { time } = await engine($, on, {
    found: [
      'ASK: Which name should the plugin use: sticky, pinned, corkboard, or afk (ask 1)?',
      'ASK: Should the tests run now?',
    ].join('\n'),
  })
  await $.tool.call({
    tool: PIN,
    kind: 'ask',
    text: 'Name for the plugin?',
    options: ['sticky', 'pinned', 'corkboard', 'afk'],
  })
  await pin($, 'ask', 'Run the migration now?')

  await $.classic.Stop({
    stop_hook_active: false,
    last_assistant_message: 'Pick a name (ask 1). Should the tests run now?',
  })
  await time.settle()

  // The reworded ask is left out; one that only shares a few words is kept.
  const band = await shown($, BAND)
  expect(band).toContain('3 asks')
  expect(band).toContain('Should the tests run now?')
  expect(band).not.toContain('Which name')
})

test('no reply is read when that is switched off', { options: { catchAsks: false } }, async ($, on) => {
  const { time } = await engine($, on, { found: 'ASK: Merge to main?' })

  await $.classic.Stop({
    stop_hook_active: false,
    last_assistant_message: 'Should I merge it?',
  })
  await time.settle()

  expect(await shown($, BAND)).toBe('engine')
})

test('an ask raises a notification only while the person is away', async ($, on) => {
  const { seen, time } = await engine($, on)

  await pin($, 'ask', 'Merge to main?')
  expect(seen).toEqual([])

  await time.advance(3 * MINUTE)
  await pin($, 'note', 'Branch is not pushed')
  await pin($, 'ask', 'Tag it v2.1?')
  expect(seen).toEqual(['notify: Tag it v2.1?'])

  await $.tool.call({ tool: UNPIN, ids: [1, 3] })
  expect(seen).toEqual(['notify: Tag it v2.1?', 'cancel ask:3'])

  // A message of theirs says they are back.
  await $.prompt.submit({ text: 'back', ...TYPED })
  await pin($, 'ask', 'Push it?')
  expect(seen).toEqual(['notify: Tag it v2.1?', 'cancel ask:3'])
})

test('an item shows its age, and its number shows where it was pinned', async ($, on) => {
  const { seen, time } = await engine($, on)
  await pin($, 'ask', 'Merge to main?')

  expect(await shown($, BAND)).not.toContain(' · ')

  await time.advance(5 * MINUTE)
  expect(await shown($, BAND)).toContain(' · 5m')

  await time.advance(3 * 60 * MINUTE)
  expect(await shown($, BAND)).toContain(' · 3h')

  // The kit scrolls no transcript row, so the press ends in the mod saying
  // it could not: the scroll itself is checked in a session.
  await press($, 'go:1')
  expect(seen).toEqual(['toast: Sticky: could not show where item 1 was pinned'])
})

test('a board is kept under its session and taken up at the next start', async ($, on) => {
  const { store } = await engine($, on, {
    kept: {
      'board:s1': {
        seq: 4,
        items: [{ id: '4', kind: 'ask', text: 'Merge to main?' }],
      },
      'board:other': { seq: 1, items: [{ id: '1', kind: 'note', text: 'Elsewhere' }] },
    },
  })

  const band = await shown($, BAND)
  expect(band).toContain('Merge to main?')
  expect(band).not.toContain('Elsewhere')

  expect((await pin($, 'note', 'Branch is not pushed')).result).toBe('Pinned as 5.')
  expect(store.get('board:s1')).toMatchObject({
    seq: 5,
    items: [{ id: '4' }, { id: '5', text: 'Branch is not pushed' }],
  })

  await $.tool.call({ tool: UNPIN, ids: [4, 5] })
  expect(store.has('board:s1')).toBe(false)
  expect(store.has('board:other')).toBe(true)
})
