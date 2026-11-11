# Testing by hand

What no test reaches: the engine's test kit draws the band and the pane and mocks the clock, the store and the small
model, but it raises no close of the person's, scrolls no transcript, restarts nothing and sends no notification
anywhere. Run this before a release that changes how the board draws, saves or notifies, and fill in the record at the
end.

## Setup

From a clone of this repo, on the branch or the `main` to test. A merged change reaches installs only with a release,
so the test loads the plugin from the clone:

1. Turn the installed copy off: `claude plugin disable sticky@sticky`.
2. In a scratch folder, start `claude --plugin-dir <clone>/plugin`, in a terminal at least 144 columns wide.
3. Ask Claude something that makes it pin: "Pin an ask with the options yes and no and a detail, a progress item and
   a note, then stop."

Afterwards, turn the installed copy back on: `claude plugin enable sticky@sticky`.

## Not yet tried in a live session

Each of these has never been seen working in a real session. Count one as tried only when you saw it.

| Check | Steps | Expect |
|---|---|---|
| closing the pane by hand | pin until the board has more than 10 lines, so it moves to the pane; close the pane with `ctrl+x x` | the band takes the full list back; the pane does not reopen while the board stays long; once the board is 10 lines or fewer and grows past 10 again, the pane opens again |
| the jump to the transcript | scroll the transcript well away from the pin; press an item's number (`ctrl+x`, `tab` to it, `enter`) | the transcript scrolls to the `pin` call that made it. After a `/compact`, the toast "Sticky: could not show where item N was pinned" instead |
| a board after a real restart | pin two items; quit with `/exit`; run `claude --plugin-dir <clone>/plugin --resume` and pick that session | the same items, under the same numbers; the next pin takes the next number |
| notifications on Windows Terminal | in Windows Terminal, send "Run `sleep 150` in the shell, then pin an ask", and touch nothing until the pin: the two minutes count from your last prompt or press | a notification titled "Claude is waiting on you" with the ask's text; unpinning the ask takes it back where the terminal supports that. Note what Windows Terminal showed, if anything |

## Already tried live

Run these again when a change touches them.

| Check | Expect |
|---|---|
| pinning and numbering | each item under its number; a number never given twice in the session, even after unpins |
| answering by number | `1: yes` in a message, and Claude unpins ask 1; `1?` gets more on it, and it stays pinned |
| pressed answers | press an answer on two asks, then `a`: one message of yours, a line per ask, and both asks gone |
| the reply check | Claude ends a turn with a question it did not pin: within seconds an ask "from the reply" appears |
| details | **more** opens the detail, `e` opens them all, `/sticky 1` opens or closes item 1's |
| statuses, tones and a job | each item's status in its tone's colour; a job as one line with a dot per part and a count per status, and **more** listing its parts (the README's screenshot) |
| the pane | `/sticky` moves the board beside the transcript, and the band keeps its first line |

Two more have run only in the tests. Until a live run is recorded, try them too:

| Check | Steps | Expect |
|---|---|---|
| moving a job's parts | "Pin an epic of four issues as one job, statuses queued, then move one to in review and one to merged" | `1 merged · 1 in review · 2 queued` on the job's line; Claude moved the parts by number, naming only the status |
| background work | start a background shell, end the turn | the shell listed with its status; a subagent never listed |

## Also worth a look

- The desktop app: the band draws; the pane draws; a notification waits until you are away.
- A terminal under 144 columns: a long board stays in the band; `/sticky` still opens the pane.
- `/config`: each of `notify`, `catchAsks` and `showKeys` turned off does what the README says.

## Recording it

Say in the PR's "Tested by", or in a comment on its issue: which checks ran, on which system, terminal and Claude Code
version, what you saw, and what failed. When a "not yet tried" check passes, move it to "Already tried live" here and
in the README's limits, in the same PR.
