# Release Verification Playbook (Slack, WhatsApp & Discord End-to-End)

Unit and snapshot tests cannot prove that Slack, WhatsApp, and Discord accept what the plugin puts on the clipboard. This playbook describes the end-to-end check that must pass before a **significant release**. It extends [Tier 2 in the testing policy](./testing-policy.md).

## 1. When to Run It

Run the full check before tagging a release when any of the following changed:

- Anything under `src/converters/` or `src/utils/clipboard.ts` (conversion output or clipboard writing).
- Regular expressions or text-processing logic (a refactor can change output even when snapshots pass).
- A change that fixes a user-reported bug in copy or paste behavior.
- A major dependency or runtime change (Node, esbuild, Obsidian API typings).

Docs-only, CI-only, and metadata-only releases do not need it.

## 2. Order of Work

1. Automated checks pass in Docker (`npm test`, `npm run build`) and in CI (Build & Test, CodeQL).
2. Cut a **beta tag** (`X.Y.Z-beta.N`, no `v` prefix). The release workflow publishes it as a pre-release automatically.
3. Install the beta in a vault (BRAT, or copy `main.js`, `manifest.json`, `styles.css` into the plugin folder) and **confirm the installed `manifest.json` version equals the beta**. Testing an older build proves nothing about the new one.
4. Run the end-to-end check in section 4.
5. If everything passes, bump to the final version and tag it. Tags must match the `manifest.json` version exactly, with no `v` prefix.
6. After the release, reply to any issue the release fixes (thanks, apology for delay if any, cause, fix, version, link).

## 3. Test Environment

| Item | Requirement |
|---|---|
| Obsidian | Desktop, plugin installed at the version under test |
| Slack | A private test channel that only the tester can see |
| WhatsApp | A group that contains only the tester |
| Discord | A private test server and channel that only the tester can see |
| Plain-text editor | A new plain-text document (for example TextEdit in plain-text mode) used for the error case |
| Test note | A temporary note in the vault root named `zz-format-convert-test` |

Fixtures live in `tests/manual/`. Use `slack-comprehensive-test.md` for Slack, `whatsapp-comprehensive-test.md` for WhatsApp, and `discord-comprehensive-test.md` for Discord. Add `slack-edge-cases.md` when the change touches Slack-specific handling.

## 4. Procedure

### 4.1 Prepare the temporary note

1. Copy the fixture into the vault root as `zz-format-convert-test.md`. Do not edit any existing note or setting.
2. Open the note. If the content of the file is replaced while it is open (for example when switching fixtures), **close the tab and reopen it**. Obsidian can keep the old content, and the copy command would then convert stale text.
3. Make sure **nothing is selected** before running a copy command. When text is selected, only the selection is copied. Clicking a rendered horizontal rule (`---`) selects it, which makes the copy command put just `---` on the clipboard. Click at the end of an ordinary text line instead, and check that the status bar shows the whole note's character count rather than a small selection count.

### 4.2 WhatsApp

1. Run the command palette entry for WhatsApp copy on the note.
2. Paste into the message box of the test group. **Do not send.**
3. Check the checklist in section 5.
4. Select all text in the message box and delete it. Confirm the box is empty.

### 4.3 Slack

1. Switch the note to the Slack fixture (see 4.1) and run the Slack copy command.
2. Paste into the message box of the test channel. **Do not send.**
3. Scroll through the whole draft and check the checklist in section 5.
4. Click inside the draft first, then select all and delete, so only the draft is cleared. Confirm the box is empty and no message was posted.

### 4.4 Discord

Discord turns a pasted message longer than 2000 characters into a `message.txt` attachment, so the whole fixture cannot be checked in one paste. Split the fixture at its `---` separators into chunks of about 1800 characters or less and repeat for each chunk:

1. Put one chunk into the temporary note (close and reopen the tab, see 4.1).
2. Run the Discord copy command with nothing selected.
3. Paste into the message box of the test channel. **Do not send.** If an attachment appears instead of text, the chunk was too long: remove the attachment and split further.
4. Check the checklist in section 5, then select all inside the message box and delete.

Inline styling (bold, italic, underline, strikethrough, inline code, spoilers) renders live in the message box. Headings, lists, and quotes appear as Discord syntax until a message is sent, so check that the syntax text is correct.

### 4.5 Plain-text fallback (error case)

Some apps cannot read the rich clipboard formats the plugin writes. The plain-text fallback must stay readable.

1. Open a new document in a plain-text editor.
2. Run the Slack copy command on the Slack fixture and paste.
3. Check that the result is readable Slack-style text: `*bold*` headings, `•` bullets, backtick code and fenced code blocks, `>` quotes, `<url|title>` links. It must contain no HTML tags, no JSON, and no private-use marker characters.
4. Close the document without saving.

### 4.6 Cross-paste matrix

Users paste the output into apps it was not made for. The compact fixture [`docs/fixtures/cross-paste-smoke.md`](./fixtures/cross-paste-smoke.md) (about 430 characters, so it also fits Discord's 2000-character limit) covers headings, inline styles, links, lists, checklists, quotes, a code block, a table with an inline-code cell and CJK text, math, currency, snake_case, a wikilink alias, and an embed.

For each source below, copy the fixture with the matching command (nothing selected), read the clipboard text once, then paste into every target. **Do not send.** Clear each draft before the next paste.

| Source (copy command) | Slack | Discord | WhatsApp | Plain-text editor |
|---|---|---|---|---|
| Slack | native rich text | readable | readable | readable Slack text |
| Discord | readable | native | readable | raw text |
| WhatsApp | readable | readable | native | raw text |
| Raw Markdown | Slack formats it | readable | readable | raw text |

"Native" must match the per-service checklist in section 5. "Readable" means content is complete, in order, with no HTML, JSON, or placeholder characters; styling differences caused by another service's syntax are expected and acceptable. Examples seen with 0.3.40: Slack's `*bold*` shows as italic in Discord, and Slack's `<url|title>` link is not clickable in Discord or WhatsApp.

Known limitations observed with 0.3.40 (record, do not treat as new regressions unless they get worse):

- A table cell that contains inline code (for example `` `/ban` ``) leaks a private-use marker and an index number in the Discord, WhatsApp, and Slack plain-text outputs. Slack desktop rich text is not affected.
- In Slack desktop rich text, `snake_case_word` renders with the middle word in italics.

### 4.7 Clean up

1. Close the note tab and delete `zz-format-convert-test.md`.
2. Confirm the vault contains no leftover test files.

## 5. Checklist

**WhatsApp**: bold headings, bold/italic/strikethrough syntax converted, underline stripped, links expanded to `title (url)`, underscores in URLs and snake_case preserved, checkboxes, callouts, code blocks, tables kept in aligned monospace blocks, math protected in code.

**Discord**: `#`/`##`/`###` headings, H4 and below as bold, `__bold__` converted to `**`, underline as `__text__`, strikethrough, inline code, spoilers, links, 10-level list nesting, checklists with strikethrough on completed items, quotes and callouts, code blocks, tables in aligned monospace blocks including CJK text and **inline code inside table cells**, math protected in code, currency amounts left alone.

**Plain-text fallback**: readable Slack-style text as described in 4.5.

**Cross-paste**: every cell of the matrix in 4.6 is readable and free of HTML, JSON, and placeholder characters.

**Slack**: headings as bold, bold/italic/underline/strikethrough, inline code, links, bullet lists to 5 levels for 2-space, 4-space, and tab indentation, numbered lists to 5 levels, checklists with strikethrough on completed items, quotes and callouts, code blocks, aligned tables including CJK text, math, balanced parentheses in URLs, blank-line handling.

Pass criteria: every item renders as described by the fixture and the draft contains no raw conversion artifacts or placeholder markers (invisible private-use characters around digits, such as in table cells, count as placeholder leaks). Any deviation blocks the release until it is understood.

## 6. Safety Rules

- Never send a message to Slack, WhatsApp, or Discord during this check. Paste, inspect, and clear only.
- Use only the dedicated test channel and test group.
- Never modify existing notes, plugins other than the one under test, or vault settings.
- Do not record personal data (names, email addresses, local paths, workspace or vault names) in reports, issues, PRs, or commit messages. Describe locations generically, for example `<vault>`.

## 7. Notes for Automated (Computer-Use) Runs

- Background paste (`cmd+v`) is blocked for background control. Pasting requires full-screen control, which the user must approve for the session. Release it when done.
- Opening a note by URL (`obsidian://open?...`) is the quickest way to switch the active note.
- Selecting all with the pointer outside the message box selects the whole page instead of the draft. Click into the draft before pressing select-all, and check the selection before pressing delete.
- Read the clipboard once after copying to confirm plain-text output (WhatsApp, Discord) before pasting. An unexpectedly short clipboard usually means a selection was copied.
- A plain-text editor's close prompt for an unsaved scratch document can be answered with the discard option.

## 8. Report Template

Record the result in the release PR or issue, without personal data:

```
Version under test: X.Y.Z-beta.N (confirmed from installed manifest.json)
Fixtures: slack-comprehensive-test, whatsapp-comprehensive-test, discord-comprehensive-test, cross-paste-smoke [, slack-edge-cases]
WhatsApp: PASS / FAIL (details)
Slack: PASS / FAIL (details)
Discord: PASS / FAIL (details, number of chunks)
Plain-text fallback: PASS / FAIL (details)
Cross-paste matrix: PASS / FAIL per cell (details)
Nothing was sent; drafts cleared; temporary note deleted.
```
