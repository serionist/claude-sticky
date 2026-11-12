# Changelog

What each release changes for the people who install the plugin, in the
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) format. A change users notice adds its line under Unreleased
in the same PR; `docs/releasing.md` says how a release dates it.

## Unreleased

### Fixed

- Answers sent from the board while Claude was working reached it twice, and their row stayed grey as a prompt
  that still waits. The board now holds them and sends them once, when the turn ends; **don't send** takes that
  back, and a turn you interrupt sends nothing by itself.
- Answers could vanish from the board without reaching Claude: after you stop a turn, Claude Code takes nothing
  from a plugin until you send something yourself, and the board took the asks off before it knew. An ask now
  leaves the board only once its answer was taken; a refused answer stays marked and is put in your prompt box,
  for Enter to send.

## 0.2.0 (2026-11-12)

### Added

- `/sticky usage` reports how many Haiku calls the reply check has made in the session, and their tokens.

### Changed

- The board's last row lists its keys only after you press `k` (**keys**); before, it listed them on every
  board. `showKeys` now decides whether **keys** is there.

## 0.1.0 (2026-11-12)

The first public release.

### Added

- A board above the prompt that Claude pins to with two tools, `pin` and `unpin`: asks, progress and notes, each under
  a number given once per session, each staying until it is settled. Background shells and other background work are
  listed from each turn's end, with their status; subagents are left to Claude Code's own list.
- A status on any item, in Claude's own words, and a tone (muted, active, attention, good, bad) that colours it.
- Jobs: progress items that share a group draw as one line, with a mark per part and a count per status, and open to
  list the parts. A job counts as one line toward the band's 10.
- Changing an item by its number with only what changes, such as a new status.
- Answers by number (`2: yes`, `2b`, `2?` for more), and answer buttons on the board, sent together as one message.
- Details that open under an item, an item's age, and its number jumping to where it was pinned in the transcript.
- The board with each typed message, so Claude unpins what the message settles, and a system prompt section on how
  to use it.
- The reply check: at each turn end, one short Haiku call pins up to three questions Claude asked without pinning
  them, and leaves out questions the board already holds (`catchAsks`).
- A notification when an ask lands and you have not typed or pressed anything for two minutes (`notify`).
- The pane: a board of more than 10 lines moves beside the transcript; `/sticky` moves it by hand, `/sticky <n>` opens
  an item's detail.
- The board's keys (`ctrl+x`, then `tab`; `a`, `e`, `s`), listed in its last row (`showKeys`).
- The board saved per session in the plugin's store, and taken up again when that session is resumed. A saved board
  is dropped once its session has not come back for 60 days.
