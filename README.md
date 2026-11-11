<p align="center">
  <img src="docs/images/logo.svg" width="96" alt="">
</p>

<h1 align="center">sticky</h1>

<p align="center">
  A Claude Code plugin that keeps a board above the prompt:<br>
  what Claude needs from you, what is still running, and what you should not miss.
</p>

<p align="center">
  <a href="https://github.com/serionist/claude-sticky/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/serionist/claude-sticky/actions/workflows/ci.yml/badge.svg"></a>
  <a href="LICENSE"><img alt="MIT licence" src="https://img.shields.io/badge/licence-MIT-blue"></a>
</p>

You step away from a long session, and when you come back you read the board, not the transcript.

In a session that runs for an hour, the two or three messages that need you are somewhere in a transcript you would
have to scroll back through: a question asked mid-turn, a decision Claude parked while it got on with the rest, a test
suite it left running. Claude pins those to the board as it works, and each one stays there until it is settled.

Ask Claude to implement an epic of six issues and go for lunch: when you come back, one line on the board says
"2 merged · 1 in review · 3 queued", and the one question it could not answer for itself waits above it with its
answers as buttons.

<p align="center">
  <img src="docs/images/side.png" width="100%" alt="A terminal with the board in the Sticky pane beside the transcript. A yellow 'Waiting on you' line counts 3 asks, 7 in progress and 1 note. Under it, three numbered asks, two of them with lettered answer buttons and their details open; the job 'Epic #40 checkout rewrite' opened to its six issues, each with its status in colour: merged, in review, running, blocked on #43, queued; a deploy that is rolling out; a note; and the board's keys in its last rows. Above the prompt, the band keeps its first line.">
</p>

Here the board is in its pane, with two details and a job opened. Short, it sits in the band above the prompt.

## What you see

The board is a band above the prompt. Its first line says whether anything waits on you (**Waiting on you**, or
**Nothing needed from you**) and counts what is on it. Under that, one line per item:

| Mark | Kind | What it holds |
|---|---|---|
| `?` | ask | something Claude needs from you: a decision, an approval, information only you have, a step only you can do |
| `~` | progress | work in flight that outlasts the turn: a deploy, a review Claude waits for, "step 3 of 7" |
| `!` | note | a fact you should not miss: a step it skipped, a result that changes your plan |

Background shells and other background work are listed under progress by themselves, with their status, from what
Claude Code reports as each turn ends. Subagents are left out: Claude Code lists them itself. With nothing on the
board, the band is not drawn.

- **Every item has a number,** given once and never reused in the session. You answer by it.
- **An ask can carry answers** to press, lettered a, b, c.
- **An item can carry a status,** a word or two in Claude's own words ("queued", "in review", "blocked on #12",
  "merged"), coloured by a tone Claude picks: muted, active, attention, good or bad. The board knows no list of
  statuses.
- **An item can carry a detail:** two or three sentences on what hangs on it and what Claude recommends. **more**
  opens it under the line.
- **Its age** shows after a minute (`5m`, `3h`, `2d`), and, for an item Claude pinned, **its number** jumps to where
  it was pinned in the transcript.
- **×** takes an item off the board.

**A job with several parts,** such as an epic and its issues, is one progress item per part, all under the same group
name. The board draws the job as one line: its name, a dot per part in that part's tone, and a count per status, such
as `2 merged · 1 in review · 3 queued`. **more** opens it to list the parts, each with its own number and status. As
the work moves, Claude changes a part's status by its number, and the line moves with it. **×** on the job's line
takes the whole job off.

A board of more than 10 lines moves to a pane beside the transcript (a job counts as one line, open or not), and the
band keeps its first line, with "(in the Sticky pane)". It comes back above the prompt when it is short again. `/sticky`
moves it either way by hand.

## Install

At the prompt of a Claude Code session:

```
/plugin install sticky --marketplace serionist/claude-sticky
```

Answer `y` to add the marketplace. From a shell, the same is
`claude plugin install sticky --marketplace serionist/claude-sticky`.

In the desktop app, where `/plugin` does not run: click **+** next to the prompt box, then **Plugins**,
**Add marketplace** with `serionist/claude-sticky`, then **Add plugin**.

Written and tested on Claude Code 2.1.321. The plugin API it uses is early access and may change between Claude Code
releases; an issue with your version helps.

## Use

**Answering.** Reply as you would, and use the number: `2: keep them`, or `2b` for an ask's second answer. `2?` asks
Claude to say more about item 2, and leaves it pinned. Claude takes an ask off the board once your reply settles it,
and leaves the rest.

**Pressing answers.** Press an answer on the board to mark it, press it again to take the mark back. Once any is
marked, **send** sends them all as one message of yours, such as `1: yes (to: Run the staging migration now?)`, and
takes those asks off the board. While Claude is working, the message waits for the turn to end.

**Keys.** The board's last row lists them, until you turn that off:

| Keys | What |
|---|---|
| `ctrl+x`, then `tab` | gives the board the keyboard |
| `tab`, `enter` | move to a button, press it |
| `a` | send the marked answers |
| `e` | open every detail and every job, or close them all |
| `s` | move the board to the side, or back above the prompt |
| `esc` | back to the prompt |
| `ctrl+x ctrl+a` | hide the band |
| `ctrl+x x` | close the pane |

**`/sticky`** moves the board to the pane, or back above the prompt. `/sticky 3` opens item 3's detail, or closes
it.

**Settings,** in `/config` under the plugin, all on by default:

| Setting | What |
|---|---|
| `notify` | a notification when Claude pins an ask and you have not typed or pressed anything for two minutes, taken back when the ask leaves the board |
| `catchAsks` | at the end of each turn, a small model reads Claude's reply and pins up to three questions it asked you without pinning them, marked "from the reply"; a question the board already holds, reworded, is left out |
| `showKeys` | the row of keys at the bottom of the board |

## What it costs, and what Claude reads

- **The system prompt** gains a section on how to use the board: about 3,300 characters, some 800 tokens, in every
  session the plugin is on.
- **Two tools,** `pin` and `unpin`, always loaded: about 3,000 characters of descriptions and schema together, some
  750 tokens.
- **Each message you type** carries the board as it stands, one line per item (a job's parts each get theirs), and a
  short note on answering by number, so Claude knows what to unpin and keeps the numbers after a compaction. An empty
  board adds nothing. Prompts you did not type (a background task's notice, a command) carry nothing.
- **The reply check** (`catchAsks`) costs one short Haiku call per turn end: its instructions, the asks already on the
  board, and the last 6,000 characters of Claude's reply in; at most 300 tokens out. It runs after the turn, so the
  turn never waits for it. It is skipped when the reply is empty or the same as the last one.

## What it keeps, and where

The board, saved per session under the session's id in the plugin's own store, a JSON file Claude Code keeps for it
in your Claude Code configuration folder. Resume that session later and its board comes back. A board that empties is
deleted from the store, and so is one whose session has not come back for 60 days. After `/clear` the board starts
empty, and the old session keeps its own.

The board's text goes nowhere but into the session's own model requests: with your messages, and in the Haiku call
above, which goes through the same Claude Code connection.

## Requirements and limits

- **Claude Code 2.1.321,** where it was written. The mod API is early access, and a later release may break it.
- **The band draws in the terminal and the desktop app only.** The pane draws on every surface, so elsewhere the board
  is in the pane.
- **A pane the plugin opens by itself** needs a terminal at least 144 columns wide, or 110 once you have opened it
  with `/sticky`. Below that a long board stays in the band. `/sticky` opens it at any width: beside the transcript
  where there is room, inline above the prompt where there is not.
- **Notifications in a terminal** are raised at once, and only through iTerm2, kitty, Ghostty or a plain bell. Holding
  one until you are really away is something only the desktop app does; the plugin's two-minute rule stands in for
  it.
- **The background-work list** refreshes as each turn ends, not live.
- **Answers sent while Claude is working** may reach it twice: inside the running turn, and again as a turn of their
  own once it ends.
- **The reply check** costs one short Haiku call per turn end. Turn off `catchAsks` to save it.
- **Not yet tried in a live session:** closing the pane by hand, the jump from an item's number to the transcript,
  restoring a board after a real restart, notifications on Windows Terminal, and the list of background shells.
  Pinning, numbering, answering by number, pressed answers arriving as one message, the reply check, details,
  statuses, tones, a job drawn and opened, and the pane opened with `/sticky` have been. Changing a job's part by its
  number has run only in the tests.
  [docs/testing-by-hand.md](docs/testing-by-hand.md) is the checklist.

## Uninstall

`/plugin uninstall sticky@sticky`. Boards it saved may stay behind in the plugin's store file in your Claude Code
configuration folder.

## Developing

```
git clone https://github.com/serionist/claude-sticky.git
cd claude-sticky
npm ci
node tools/setup.ts
```

`npm ci` installs the pinned dev tools (Claude Code, Biome, TypeScript) without running any install script;
`node tools/setup.ts` turns on the git hooks. Then:

- `claude --plugin-dir plugin` starts a session with the plugin from this clone, and reloads it each time you save.
  Turn the installed copy off first (`claude plugin disable sticky@sticky`), or both draw a board. Loading it also
  writes the plugin API's types to `plugin/.claude-plugin/types/`, which the gate checks.
- `node tools/gate.ts full` runs every check and test; the pre-push hook runs `quick`.

[CONTRIBUTING.md](CONTRIBUTING.md) is the short path to a pull request; [AGENTS.md](AGENTS.md) has the full rules, for
people and AI agents alike. [docs/design.md](docs/design.md) says how it works.

## Licence

[MIT](LICENSE). Not affiliated with Anthropic.
