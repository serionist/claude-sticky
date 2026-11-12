# Security

sticky runs inside every Claude Code session it is on. It adds text to what Claude reads, and sends messages as yours
when you press **send**. A flaw here runs with your rights, in every session.

## Report a vulnerability

Report it privately: the repository's **Security** tab > **Report a vulnerability**, or
[this link](https://github.com/serionist/claude-sticky/security/advisories/new). Only the maintainer sees it. Never
put a vulnerability in an issue, a pull request or a discussion: anyone can read those.

Include what you can: the plugin's version, your system, terminal and Claude Code versions, what an attacker can do
and what they need first, and the smallest reproduction, with invented items and no real session's text. You'll get an
answer within a week; the fix is developed in the advisory and the advisory published with the fixed version,
crediting you unless you ask otherwise.

## What counts

- A message sent as the person's that they did not press **send** for, or text in it they did not choose.
- What is on the board reaching anywhere but the session's own Claude Code calls and the plugin's store
  on the person's machine.
- One session's board shown or changed in another session.

## Supported versions

The latest release only. Fixes ship as a new version; Claude Code installs it on the next marketplace update.
