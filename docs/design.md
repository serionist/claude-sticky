# How sticky works

For people changing the plugin. What it does for users is in the [README](../README.md); the rules for changing it
are in [AGENTS.md](../AGENTS.md).

## The parts

| File | What |
|---|---|
| `plugin/hooks/register.tsx` | everything: the two tools, the system prompt's section, the board's state, the notifications, `/sticky`, and the drawing of the band and the pane, jobs included |
| `plugin/hooks/register.test.tsx` | the tests, run by `claude plugin test plugin` in the engine's sandbox: a stand-in engine beneath the plugin, the clock and the store mocked |
| `plugin/types/index.d.ts` | `Kind`, `Tone`, `Item`, `Board`, `Task`, `Layout`, `Picks`, and the plugin's `$.state` values under `sticky` |
| `plugin/.claude-plugin/plugin.json` | the manifest and the two settings, `notify` and `showKeys` |

The hooks module runs inside Claude Code, with no Node and no DOM. It reaches the session through `$.session`, the
screen through `$.ui` and its saved boards through `$.store`. It makes no model calls.

## State

Nine atoms under `sticky` in `$.state`, declared in `types/index.d.ts`:

| Atom | What |
|---|---|
| `board` | `{ seq, items }`: `seq` is the last number given out, so none is given twice in a session; a kept board also has `savedAt` |
| `tasks` | the background work the engine listed at the last turn end |
| `layout` | `mode` (`auto`, `pane` for the person's `/sticky`, `band` for their closing of the pane) and `isInPane` |
| `open` | the numbers of the items whose detail is shown, and `group:<name>` for each job opened |
| `picks` | the answer pressed for each ask, until it is sent |
| `now` | the time the ages are drawn from, moved on each minute while the board holds anything |
| `owner` | the session id the board belongs to |
| `isKeysOpen` | whether the list of keys in the last row is open |
| `sending` | where pressed answers stand: `none`, `held` for the running turn's end, or `sent`, with Claude Code and not yet a turn |

`board` and `tasks` carry a shape tag (`board-1`, `tasks-1`). Change the tag when their fields change: the engine
then declines a value an earlier version kept, which outlives a reload.

Module variables hold what the board does not draw: the three settings, read once in `register`; `lastSeen`, when
the person last typed or pressed something; `notified`, the asks a notification went out for; `lastReply`, the last
reply read for asks.

## Pinning

`pin` (`mcp__sticky__pin`) takes `kind`, `text`, `status`, `tone`, `group`, `options`, `detail` and `id`, none of
them required by the schema: a new item needs `text`, a change needs `id`.

- Text, detail, status and group are folded to one line; a status is cut to 40 characters, a group to 80.
- A new item without a known `kind` counts as an `ask`. A new item with empty text is refused.
- `status` is Claude's own words; the code holds no list of them. An empty status takes it off.
- `tone` is one of `muted`, `active`, `attention`, `good`, `bad` (`TONE`), each a colour of the engine's theme, for the
  item's mark and status; without one, the mark takes its kind's colour. A muted item's line is dimmed. Any other
  value is ignored.
- `group` counts only on a progress item: the name of the job it is a part of.
- `options` count only on an ask, need at least two, and are cut to four.
- Without `id` the item gets `seq + 1`. With `id` the call changes that item in place: only what it names changes
  (its text, kind, status, tone, group, detail, options), and the rest is kept; an `id` not on the board is refused.
  A changed kind sheds what only the old kind takes: an ask's options, a progress item's group.
- The item keeps the call's `tool_use_id` as `ref`, which its number scrolls the transcript to.
- An ask may raise a notification (below).

`unpin` takes `ids`, strings or numbers, and answers what it removed, what was not on the board, and what is still
pinned. Removing an item also drops its pressed answer and takes back its notification.

Both tools register with `isDeferred: false`, so Claude has them from the first turn without a tool search.

## What Claude reads

- **The system prompt** (`prompt.compose`) gains the section `sticky:board`, `SECTION` in the code, scoped to the
  session. A `bare` prompt gets none. It makes a question Claude's reply puts to the person, and needs answered, an
  ask to pin before the turn ends: nothing reads the reply afterwards.
- **Each prompt the person typed** (`prompt.submit`, origin `composer`, `bridge` or `sdk`, not meta, not a command) gets
  the board as context: each item under its number, with its kind, its status, its job (`in "<group>"`), its answers
  lettered; then how numbered answers read, and to unpin what the
  message settles. Nothing is added to a prompt nobody typed, or when the board is empty. The board's own message
  of pressed answers never passes this hook: the engine keeps a plugin's prompt from that plugin's hooks, so it
  reaches Claude bare, and the system prompt's section says its asks are already off the board.

The board travels with the message, not only in the system prompt, so Claude still has the numbers after a
compaction.

## Jobs

`laidOut` walks the progress items in the order pinned: an item with no group is an entry of its own, and items with
the same `group` collect in the entry where the first of them stood. A job is drawn as one line (`≡`): its name, a
`●` per part in that part's colour, a count per status in the order first seen (`2 merged · 1 in review`), or the
number of parts when none has a status, then **more** or **less** and **×**, which unpins every part. Opened, the
parts are listed under it as ordinary rows, each with its own number, **more** and **×**. A job opens under the key
`group:<name>` in `open`, so `e` opens and closes jobs with the details; `/sticky <n>` opens only an item's detail.

The status line counts each part under "in progress"; `arrange` counts a job as one line.

## Where the board draws

- **The band** (`ui.render` for `AbovePrompt`) draws the board when it holds anything and no survey is showing;
  otherwise the engine's own band draws.
- **The pane** (`ui.render` for `Pane`, id `sticky`, 48 columns) draws the same tree in full.
- `arrange` seats it after every change: more than `BAND_LINES` (10) lines, counting each ask, note, ungrouped progress
  item, job and task as one, or `mode: pane`, opens the pane; a short board in `auto` closes it. While the pane holds
  the list, the band draws only its first line.
- A pane opened unasked that the engine does not place (a terminal under 144 columns, or 110 once the person opened
  it) is closed again at once, so the band keeps the list.
- The person closing the pane (`ui.close` with origin `person`) sets `mode: band`, which holds only while the board
  is long.

The tree: a status line, then the asks, progress (jobs in their place), background tasks and notes, each under its
number (padded so they line up), its status in its tone's colour, its age, its answer
buttons (beside the line when they fit, under it when not), **more** or **less** for a detail, and **×**. The last row
holds **send** (`a`, once an answer is pressed), **expand** or **collapse** (`e`, when any item has a detail or there is
a job), **to the side** or **above the prompt** (`s`), and, with `showKeys`, **keys** (`k`), which opens and closes
the list of the other keys and of how to answer by number. The list is closed until the person opens it.

## Pressed answers

A press marks an answer in `picks`; a second press on the same answer takes it back. **send** submits one prompt as
the person's (`asUser: true`), a line per ask, `<n>: <answer> (to: <text>)`, and sets `sending` to `sent`: the last
row says so, and send is gone until the prompt settles.

`$.prompt.submit` settles when the prompt's turn starts, or with a `drop` and its reason. `settle` takes the asks
off the board only when it entered. Claude Code refuses a plugin's prompt in some states: after the person
stopped a turn it takes none until they send something themselves ("the session was stopped and nobody has sent
input since"), unless it counts the call as their own press. A refused or failed prompt leaves the asks and their
marked answers where they were, appends the text to the person's prompt box (`$.prompt.fill`), which Claude Code
always takes from, and says so in a toast. An answer is never dropped unseen.

Nothing is submitted while a turn of the main conversation runs (`isTurnRunning`, from `turn.start` and
`turn.complete` with no `agentId`). On Claude Code 2.1.321 a prompt a plugin submits during a turn is folded into
that turn as a queued command and then runs again as a turn of its own, and its row stays grey meanwhile, as a
prompt that still waits. So **send** during a turn only sets `sending` to `held`: the asks stay, the last row says the
answers go out when the turn ends, and **don't send** takes it back. When the turn completes with an answer, a
timer of `IDLE_MS` (300 ms) lets the engine go idle, then `flush` submits; if another turn has started by then,
the answers wait for that one. A turn that was interrupted or failed clears the hold and sends nothing: the
answers stay marked for the person to send.

`session.start` sets `sending` back to `none`: it runs on every load, and after a reload the promise that would
have settled a `sent` is gone with the old environment.

## Notifications

When an ask is pinned, `tell` raises a notification (title "Claude is waiting on you", the ask's text, key
`ask:<n>`) if `notify` is on and the person has not typed a prompt, run `/sticky` or pressed anything for `AWAY_MS`
(two minutes). Removing the ask cancels it, and so does a `/clear` or a resume. A terminal raises it at once through
whichever channel Claude Code uses there.

## Keeping the board

- `save` writes the board to `$.store` under `board:<session id>` after every change, with `savedAt`, and deletes the
  key when the board is empty. A failed write is logged to the debug log, never raised.
- `adopt` runs before the hooks that read the board. When the session id differs from `owner`, it takes up what the
  store holds for this session, or starts empty, and clears `picks` and `open`. A store that cannot be read counts as
  holding nothing, so a pin or a prompt still goes through.
- `prune` runs with each adoption: a kept board whose `savedAt` is more than `KEEP_MS` (60 days) old is deleted, so
  the store, which Claude Code caps at 4 MiB, does not fill with sessions nobody came back to. A board kept without a
  date stays.
- `session.end` for `clear` or `resume` empties the board on screen and clears `owner`, so the next session adopts
  its own. The ended session's board stays in the store under its id.

## Background work

`classic.Stop` carries `background_tasks`; each becomes a `Task` with its type, a one-line label (the command, the
name or the description) and the status the engine gives. Subagents (type `subagent`, or any task with an
`agent_type`) are left out, since Claude Code lists them itself. The list is replaced at every turn end, so it is as
fresh as the last turn.
