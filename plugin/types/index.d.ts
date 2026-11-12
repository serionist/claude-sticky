export type Kind = 'ask' | 'progress' | 'note'

/** How an item stands out: the color its mark and its status are drawn in. */
export type Tone = 'muted' | 'active' | 'attention' | 'good' | 'bad'

/** One line on the board. `id` is its number, shown before it. */
export type Item = {
  id: string
  kind: Kind
  text: string
  /** Where the item stands, in Claude's own words: "in review", "queued". */
  status?: string
  tone?: Tone
  /** The job a progress item is a part of: parts of one job share the name. */
  group?: string
  /** What the person opens under the line. */
  detail?: string
  /** An ask's answers to press, in order: a, b, c. */
  options?: string[]
  /** When it was pinned, in `$.clock.now()`'s milliseconds. */
  at?: number
  /** The transcript row it was pinned from: the pin call's tool_use_id. */
  ref?: string
  /** True for an ask the mod found in a reply, which Claude had not pinned. */
  isCaught?: boolean
}

/**
 * `seq` is the last number given out, so none is used twice in a session.
 * `savedAt` is when the board was last kept in the store, on a kept one.
 */
export type Board = { seq: number; items: Item[]; savedAt?: number }

/** Background work the engine reported at the last turn end. */
export type Task = { id: string; type: string; label: string; status?: string }

/**
 * `mode`: `auto` moves a long board to the pane, `pane` is the person's
 * /sticky, `band` their closing of the pane. `isInPane`: the pane draws it now.
 */
export type Layout = { mode: 'auto' | 'pane' | 'band'; isInPane: boolean }

/** What the reply check has used in the session: its Haiku calls and their tokens. */
export type Spent = { calls: number; input: number; output: number }

/** The answer the person pressed for an ask, by its number, until it is sent. */
export type Picks = Record<string, string>

declare module 'claude-code' {
  interface PluginState {
    sticky: {
      board: Shaped<Board>
      tasks: Shaped<Task[]>
      layout: Layout
      /** The numbers of the items whose detail is shown. */
      open: string[]
      picks: Picks
      /** The time the ages are drawn from, moved on each minute. */
      now: number
      /** The id of the session the board belongs to; empty before the first. */
      owner: string
      /** The reply check's calls and tokens in this session, which `/sticky usage` reports. */
      spent: Spent
      /** Whether the list of keys in the board's last row is open. */
      isKeysOpen: boolean
    }
  }
}
