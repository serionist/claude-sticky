# Code review lenses

`review-code` applies every lens below, to a change or to a path. `REVIEW.md` holds the severities, the questions and
the harness rule; the lenses say where to look. A lens whose "Applies when" names nothing in the scope returns no
findings at once, and an empty list is a good result.

**Not a bug hunt.** Report a problem only when it is real: it can be reproduced and causes an actual failure for a
user, their sessions or the next change.

- It has: a title; a severity (blocker, major, minor; most are minor); the file and the function or line.
- **The scenario:** the input or state, what happens, why it matters. No scenario, no finding.
- What it is judged against: a rule in `AGENTS.md` or `REVIEW.md`, the plan, the hooks API's types, a tool's
  documented behaviour, or "none".
- The evidence, and the fix. Style is Biome's, taste is the author's.

**Improvements too,** under any lens: a reuse it missed, a simpler approach, a clearer name, a step someone must
remember that a check could do. What, where, why it's better; no severity, never counted.

## plan-and-intent

Applies when: the change has a plan in `docs/plans/` or an issue.

Does it do what the plan and the issue say? A planned step missing, or behaviour nobody asked for that a user will
meet, is a finding; a small departure the PR explains is not.

## implementation

Real bugs a user would hit; the lenses below are where this plugin breaks most, and this one catches the rest.

- Wrong logic; an edge case real input reaches (a pin with no text, numbers given as numbers, more than four
  options, an id not on the board, a board of 11 lines, a job of many parts, a board kept by an older version, a
  session that ran for days, a `/clear` or a `/resume` in the middle).
- A promise left unawaited whose failure vanishes, or an error caught and dropped where the person needed to know.
- A timer or a process that outlives what started it; a `$.process.run` without a timeout.

## what-claude-reads

Applies when: the scope touches `SECTION`, `PIN_DOC`, `UNPIN_DOC`, the tools' schemas, or the context
`prompt.submit` adds.

- Does the text still say what the code does (the numbers, the letters, "2?", statuses, tones, jobs, what pressed
  answers look like)?
- What does it add to every session, in characters and roughly in tokens, and do README's figures still hold?

## person-safety

- Does anything send a prompt as the person's (`$.prompt.submit` with `asUser`) without their press of **send**, or
  with text they did not choose?
- Does what is on the board leave the session's own Claude Code calls and the plugin's store, or reach a
  log another tool reads?
- Can one session's board show, or be changed, in another (`adopt`, `owner`, `session.end`)?

## saved-boards

Applies when: the scope touches `Board`, `Item`, `save`, `adopt`, the atoms' shape tags, or the store's keys.

- Can this version read every board an older one kept, and does an older one survive what this one adds? A renamed
  or retyped field is a one-way door broken; a field change that keeps the tag is a major.
- A number given twice, an item that never leaves, an ask lost across a `/clear`, a `/resume` or a restart.

## hooks-api

Applies when: the scope touches `register.tsx` or calls `$`.

- Checked against the types the engine wrote (`plugin/.claude-plugin/types/claude-code/index.d.ts`), not memory.
- Does each hook call `next(e)` where the engine's own behaviour must still run, and return its result?
- Work started in `session.start` that blocks the session's start, or a hook that throws where a `.catch` should
  answer.
- A `$.state` value used without its entry in `types/index.d.ts`.

## tests

- Would each new test fail without the change? Is a fix pinned by a test that reproduced the bug?
- Do tests use invented items, replies and session ids, and run in the engine's sandbox?
- For what no test reaches: does the PR say how it was tried by hand (`docs/testing-by-hand.md`), on which system,
  terminal and Claude Code version?

A missing test for new behaviour is major; a missing edge-case test is minor.

## docs-freshness

- Did the docs that describe the scope move with it: `README.md`, `plugin/README.md`, `docs/design.md`,
  `CHANGELOG.md` when users notice, `AGENTS.md` for a changed path, command or rule?
- Does anything cite a path, a command, a flag or an option that no longer exists?
- A comment or doc outside `docs/plans/` and `docs/reviews/` that cites a plan or review id instead of the reason?

## simplicity

A second implementation of one thing, a layer with one caller, an option nobody asked for, dead code: an improvement,
written as what it drops ("X could become Y, which drops Z"). A finding only when it causes a real failure, with its
scenario (the two copies already disagree).

## compatibility

- The terminal and the desktop app, where the band draws, and the surfaces that draw only the pane.
- A terminal under 144 columns, where a pane opened unasked is not placed; a terminal under 110.
- Each setting off: `notify`, `showKeys`.
- The Claude Code versions the README names: an API only newer releases have needs the README's floor to move.

## harness-integrity

Applies when: the scope touches a harness file (`REVIEW.md`, The harness).

Anything that loosens a check: a gate step dropped or made a warning, a lint rule or a test skipped, an ignore added,
a question or a lens removed, attribution let through, a permission widened, install scripts turned on. A blocker
unless the maintainer agrees in the PR.

## Refuting

- Every finding gets a refutation attempt before it is reported.
- Rule it not real when:
  - its scenario can't happen (read further: it is often handled elsewhere);
  - it causes no actual failure;
  - it is taste;
  - it rests on a misread of the code, the API or the tool.
- Settle it with evidence: quote the line that proves or kills it. On your own branch a refuter may reproduce it with
  a test or a short script, never by sending prompts in the person's own sessions.
- Someone else's PR is never run here.
- A refutation you couldn't check leaves it real. A refuted one stays in the record, with its reason.
