# sticky

Keeps a board above the Claude Code prompt: what Claude needs from you, what is still running, and what you should
not miss. Step away from a long session, and when you come back read the board instead of scrolling the transcript.

Claude pins items to it with two tools, `pin` and `unpin`: an **ask** (`?`) for a decision, an approval or a step
only you can give, **progress** (`~`) for work in flight, a **note** (`!`) for a fact not to miss. Background shells
are listed by themselves as each turn ends. Each item has a number and stays until it is settled.

- **Statuses:** any item can carry a status in Claude's own words ("queued", "in review", "merged") and a tone that
  colours it.
- **Jobs:** the parts of one job, such as the issues of an epic, share a group and draw as one line: a dot per part
  and a count per status, `2 merged · 1 in review · 3 queued`. **more** opens it.
- **Answer by number:** `2: keep them`, `2b` for an ask's second answer, `2?` to hear more. Or press answers on the
  board and send them as one message.
- **Details** open under an item; its age shows; its number jumps to where it was pinned.
- **A long board** (more than 10 lines, a job counting as one) moves to a pane beside the transcript. `/sticky`
  moves it by hand; `/sticky 3` opens item 3's detail.
- **Keys:** `ctrl+x`, then `tab`, gives the board the keyboard; then `a` sends answers, `e` opens every detail and
  job, `s` moves the board, `esc` goes back to the prompt.

Settings (in `/config`), all on by default:

- `notify`: a notification when an ask lands and you have not typed or pressed anything for two minutes.
- `catchAsks`: at each turn end, one short Haiku call reads Claude's reply and pins questions it asked but did not
  pin, leaving out those the board already holds.
- `showKeys`: the row of keys at the bottom of the board.

Install it at the prompt with `/plugin install sticky --marketplace serionist/claude-sticky`.

The board is saved per session in the plugin's store, on this machine, and comes back when you resume the session.
Written against Claude Code 2.1.321; the plugin API is early access.

The full README, with what it adds to Claude's context and its limits: https://github.com/serionist/claude-sticky
