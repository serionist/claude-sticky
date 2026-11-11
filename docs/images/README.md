# Images

The README's images, and how each was made.

| File | What | How |
|---|---|---|
| `side.png` | the README's screenshot | A capture of a real session in Windows Terminal with the plugin loaded and the board moved to the pane with `/sticky`: two details and the job opened. The items and the transcript are invented for the picture. Cropped under the prompt, to leave out the session's own status line |
| `logo.svg` | the README's logo | Drawn: a sticky note with three lines, each led by a dot in one of the board's colours |
| `social-preview.png` | GitHub's social preview, 1280 by 640 | Drawn with the logo and the pane cut from `side.png`, laid out as a web page and captured with headless Chrome. GitHub takes it only in the repo's settings (Settings, General, Social preview), by the maintainer |

The plugin's icon, `plugin/.claude-plugin/icon.png`, is the logo on a dark square, 1024 pixels, where
`claude plugin validate` looks for one: for a listing in Anthropic's plugin directory. Claude Code itself shows no
icon.

A new screenshot is a capture of the plugin itself, cropped only, with invented items and nothing of a real session's
on screen: no prompt, reply, path or usage figure.
