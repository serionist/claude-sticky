# Releasing

Users get a new version of the plugin only when `plugin/.claude-plugin/plugin.json`'s version changes: Claude Code
compares it when it updates a marketplace. The marketplace serves `main`, so a version is out the moment its release
PR merges. The tag and the GitHub release record it.

## Versions

SemVer, one literal version in `plugin.json`. In `0.x` a minor may break a one-way door, under the CHANGELOG's
Breaking with how to move over; a patch never does.

## Steps

1. **The release PR,** from `main`, titled `Release X.Y.Z`:
   - `CHANGELOG.md`: rename `## Unreleased` to `## X.Y.Z (YYYY-MM-DD)`, dated the day it merges, and start a new empty
     `## Unreleased` above it;
   - `plugin.json`: `"version": "X.Y.Z"`;
   - the README's "Written and tested on Claude Code" line, when the release was tried on a newer one;
   - `node tools/gate.ts full` passes; its version check reads the dated section.
2. **Try it** from the branch before the merge: `claude plugin marketplace add <the clone's folder>`, then install or
   update `sticky` from it, and run the checks in [testing-by-hand.md](testing-by-hand.md) that the release touches.
3. **Merge** on the maintainer's word.
4. **Tag** the merge commit at once: `git tag vX.Y.Z <sha>` and `git push origin vX.Y.Z`. `release.yml` checks that
   the tag is on `main`, that it equals `plugin.json`'s version and that the CHANGELOG has its dated section, then
   publishes the GitHub release with that section as its notes.

The first release, 0.1.0, is the repository's first commit on `main`: tag that commit `v0.1.0` once it is pushed.

A release that went wrong is fixed forward with the next patch: a version once on `main` may already be installed.
