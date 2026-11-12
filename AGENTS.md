# claude-sticky

The rules for anyone who changes this repo, person or agent. Claude Code reads this file through `.claude/CLAUDE.md`,
Codex reads it directly; the gate caps it at 150 lines. What the plugin does for those who use it is in `README.md`.

## What this is

`sticky`, a Claude Code plugin (a mod: a hooks module, no MCP server, no skills) that keeps a board above the prompt,
or in a pane beside the transcript, of what Claude needs from the person, what is in flight and what they should not
miss. The repo is its own marketplace.

- **The plugin** (`plugin/`): `hooks/register.tsx` holds all of it: the `pin` and `unpin` tools, the system prompt's
  section, the notifications, `/sticky`, the band, the pane and jobs; `types/index.d.ts` declares the
  board and the plugin's state.
- **It runs inside Claude Code,** in an environment with no DOM and no Node: everything outside reaches it through `$`
  (`$.session`, `$.store`, `$.ui`). The API is early access and changes between Claude Code releases.
- **On every surface:** the band in the terminal and the desktop app, the pane everywhere. `docs/design.md` says how
  each part works.

## Where things are

| Path | What |
|---|---|
| `plugin/` | the plugin: `.claude-plugin/plugin.json` (name, version, the `notify` and `showKeys` settings), `hooks/` (`hooks.json`, `register.tsx`, and its tests `register.test.tsx`), `types/index.d.ts`, `tsconfig.json`, `README.md`, `.claude-plugin/icon.png` (for a directory listing) |
| `.claude-plugin/marketplace.json` | the marketplace: one plugin, source `./plugin` |
| `docs/` | `design.md` (how it works), `releasing.md`, `testing-by-hand.md` (a real session's checklist), `images/` (the README's screenshot, the logo, the social preview; its README says how each was made); `plans/`, `reviews/`: dated records, never current truth |
| `tools/` | `gate.ts` (the gate), `hooks.ts` (behind `.githooks/`), `setup.ts` (once per clone; `link` for skills), `gate.test.ts`; Node's standard library only |
| `.githooks/` | `commit-msg` refuses attribution, `pre-push` runs gate quick on what the push sends, `post-checkout` and `post-merge` name changed AI setup files |
| `.claude/` | `CLAUDE.md` (imports this file), `settings.json` (no attribution; allows read-only git and gh, plus the repo's own checks), `skills/` (below) |
| `.agents/skills/` | links to `.claude/skills/<name>` for Codex, written into git's index by `node tools/setup.ts link` |
| `.github/` | CI, CodeQL, the PR text check, the release, Dependabot and `dependabot-auto-merge.yml` (turns on auto-merge for its minor and patch updates), issue forms, the PR template, CODEOWNERS |
| `AGENTS.md`, `REVIEW.md` | this file; what a review finding is, and the questions every review answers |
| `.mcp.json` | Context7 over HTTP; `.claude/settings.local.json.example` turns it on |
| `package.json`, `package-lock.json`, `.npmrc`, `.nvmrc` | the dev tools, pinned exactly (Claude Code, Biome, TypeScript); no install scripts; Node 24 |
| `biome.jsonc`, `tsconfig.json` | lint and format for everything; the tools' types (the plugin's are `plugin/tsconfig.json`) |
| `.gitleaks.toml` | the secret scan: gitleaks' own rules, and any exception with its reason |
| `.editorconfig`, `.gitattributes`, `.gitignore` | UTF-8 and LF everywhere; what git ignores |
| `README.md`, `CHANGELOG.md`, `CONTRIBUTING.md`, `SECURITY.md`, `LICENSE` | for users; what changed, under Unreleased; a first contribution's short path; how to report a vulnerability; MIT |

A new top-level file or folder adds its row in the same change.

## Build and test

You need Node 24, git, and gitleaks for the secret scan. Claude Code itself comes pinned from `npm ci`.

| What | Command |
|---|---|
| once per clone | `npm ci`, then `node tools/setup.ts` (hooks, skill links) |
| the plugin's tests | `npm run claude -- plugin test plugin` (the pinned Claude Code) |
| the gate | `node tools/gate.ts quick` (pins, Biome, types, the plugin validated, version, AGENTS.md, skills, hooks, attribution, secrets); `full` adds the plugin's tests and the tools' tests |
| format | `npx biome check --write .`, then review the diff |
| run it | `claude --plugin-dir plugin`: the mod from this clone, reloaded on each save (README, Developing) |

- **The plugin's types** come from Claude Code: it writes them to `plugin/.claude-plugin/types/` when a session loads
  the mod. No command writes them, so CI can't check them: gate quick checks them where they are, and skips with the
  reason where they are not. Load the mod once before a PR that changes `plugin/`.
- **Tests run in the engine's sandbox:** the clock, the store and the screen are mocks. What only a
  real session shows (the person closing the pane, the scroll to the transcript, a notification, a restart) is checked
  by hand (`docs/testing-by-hand.md`), and the PR says how.

## How a change lands

1. **An issue** for anything beyond a typo.
2. **A plan** in `docs/plans/` for non-trivial work (`docs/plans/README.md` says when), reviewed with `review-plan`
   until approved, then approved by the maintainer.
3. **A branch** `<issue>-<slug>` from `origin/main`, the plan its first commit.
4. **The code,** with its tests and docs in the same change.
5. **finish-work:** `node tools/gate.ts full`, `review-code` until clean, a PR.
6. **The maintainer,** @serionist, squash-merges; merging is the approval. `main` takes PRs only.

The skills in `.claude/skills/` run this loop: `start-work` (1 to 3), `review-plan`, `review-code`, `finish-work`
(5), and `write-skill` for writing or fixing a skill.

## Writing

- A lead line, then a table or short bullets. Conclusion first; name the file, the command, the number.
- Plain words. No "ensure", "robust", "comprehensive", "leverage" or "seamless"; spaced hyphens, never em dashes;
  British spelling (behaviour, licence).
- A comment says why, not what the next line does, and says it in its own words, not only as a plan or review id.
- The text Claude reads (`SECTION`, the tools' descriptions, the context on each prompt) is part of
  the behaviour: a change to it is a change to the plugin, with its test, and README's cost figures move with it.
- Docs move in the same change: `README.md` and `plugin/README.md` for what users see, `docs/design.md` for how it
  works, `CHANGELOG.md` when users notice, this file for a changed path, command or rule.

## Commits and PRs

- A plain imperative subject that says what changed; a body that says why, ending `Refs #<n>` or `Closes #<n>`.
- PRs are squash-merged: the PR title becomes the subject on `main`, its description the body.
- A Dependabot PR's squash message keeps only its title and a line naming what moved: its description quotes other
  projects' release notes. A minor or patch update merges itself once `CI` passes, unless its PR is a draft, and
  `dependabot-auto-merge.yml` writes that line; a major waits for the maintainer, who cuts the message at merge.
- No tool attribution anywhere: no AI co-author trailers, no "Generated with" lines, no session links, in commits,
  PR titles or PR bodies. `commit-msg` refuses them, the gate checks every message, and CI checks the PR's text.
- **Versions:** users get a change only when `plugin.json`'s version moves. A release PR sets it and dates the
  CHANGELOG section (`docs/releasing.md`); no other PR touches it.

## One-way doors

Users depend on these. Change one only in a PR that names it in its title, after the maintainer agrees in its issue;
in `0.x` a minor may break one, under CHANGELOG's Breaking.

- the plugin's and the marketplace's name, `sticky`;
- the tools' names (`mcp__sticky__pin`, `mcp__sticky__unpin`), their arguments and the five tones: a permission rule
  or a habit names them;
- the `/sticky` command and its argument (a number);
- the `notify` and `showKeys` settings, their names and their meaning;
- how answers read: a number, `<n>: <answer>`, `<n><letter>`, `<n>?`, and the pressed answers' message;
- the saved board, `board:<session id>` in the plugin's store, and the `Board` and `Item` fields: a new version reads
  the boards an older one kept, so a field is added, never renamed or retyped; a change that must break them moves
  the atom's shape tag.

## Traps

What this code already paid for; `docs/design.md` has the detail.

| What broke | Where | The guard |
|---|---|---|
| Answers sent during a turn reached Claude twice, their row left grey: the engine folds a plugin's prompt into the running turn, then runs it again | `send` | Held on the board (`sending` is `held`) and submitted `IDLE_MS` after the turn completes |
| Answers vanished unsent: the asks were removed before the prompt was taken, and after a stop the engine refuses a plugin's prompt | `dispatch`, `settle` | The asks leave only when `$.prompt.submit` settles as entered; a refused prompt goes into the prompt box |
| A small model read each reply and pinned what Claude had not: it repeated pinned asks in other words, and pinned closing offers | the reply check, removed in 0.3.0 | `SECTION` makes a question of the reply an ask Claude pins itself; nothing reads the reply afterwards |
| A pane opened unasked on a narrow terminal is not placed, and the list vanished from the band | `arrange` | A pane not placed is closed again, and the band keeps the list |
| With many MCP servers connected, the engine's `claude-code-mcp` types pass TypeScript's depth limit (TS2589) | `plugin/tsconfig.json` | The plugin's types leave them out |
| A value kept by an earlier version outlives a reload, with old fields | `board`, `tasks` atoms | Each has a shape tag; change it with the fields |

## Look up APIs before coding against them

The hooks API: `plugin/.claude-plugin/types/claude-code/index.d.ts`, written by the Claude Code that loaded the mod;
grep it for the event or noun (`'prompt.submit'`, `Pane: {`). `npm run claude -- plugin validate plugin` lists what
the module hooks and calls, and what the engine would refuse. Anything else: Context7 (`.mcp.json`) or the vendor's
docs, never memory.

## Never

- Push to `main`, or merge with a failing gate.
- Weaken a test, a check, a hook or CI to make a change pass: no skip, no new ignore, no `--no-verify`.
- Check out, build or run code from outside the maintainers (a contributor's PR or branch) on your machine: read it,
  and let CI run it. A hooks module runs in every Claude session, with every credential there.
- Send what is on the board anywhere but the session's own Claude Code calls, or make a model call from the plugin.
- Add tool attribution: commits, PR titles, PR bodies.
- Commit secrets, or a real session's board or reply: tests use invented ones.
- Change a one-way door without the maintainer's agreement.
