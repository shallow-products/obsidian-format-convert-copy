# Release Verification Playbook (Slack & WhatsApp End-to-End)

Unit and snapshot tests cannot prove that Slack and WhatsApp accept what the plugin puts on the clipboard. This playbook describes the end-to-end check that must pass before a **significant release**. It extends [Tier 2 in the testing policy](./testing-policy.md).

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
| Test note | A temporary note in the vault root named `zz-format-convert-test` |

Fixtures live in `tests/manual/`. Use `slack-comprehensive-test.md` for Slack and `whatsapp-comprehensive-test.md` for WhatsApp. Add `slack-edge-cases.md` when the change touches Slack-specific handling.

## 4. Procedure

### 4.1 Prepare the temporary note

1. Copy the fixture into the vault root as `zz-format-convert-test.md`. Do not edit any existing note or setting.
2. Open the note. If the content of the file is replaced while it is open (for example when switching fixtures), **close the tab and reopen it**. Obsidian can keep the old content, and the copy command would then convert stale text.

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

### 4.4 Clean up

1. Close the note tab and delete `zz-format-convert-test.md`.
2. Confirm the vault contains no leftover test files.

## 5. Checklist

**WhatsApp**: bold headings, bold/italic/strikethrough syntax converted, underline stripped, links expanded to `title (url)`, underscores in URLs and snake_case preserved, checkboxes, callouts, code blocks, tables kept in aligned monospace blocks, math protected in code.

**Slack**: headings as bold, bold/italic/underline/strikethrough, inline code, links, bullet lists to 5 levels for 2-space, 4-space, and tab indentation, numbered lists to 5 levels, checklists with strikethrough on completed items, quotes and callouts, code blocks, aligned tables including CJK text, math, balanced parentheses in URLs, blank-line handling.

Pass criteria: every item renders as described by the fixture and the draft contains no raw conversion artifacts or placeholder markers. Any deviation blocks the release until it is understood.

## 6. Safety Rules

- Never send a message to Slack or WhatsApp during this check. Paste, inspect, and clear only.
- Use only the dedicated test channel and test group.
- Never modify existing notes, plugins other than the one under test, or vault settings.
- Do not record personal data (names, email addresses, local paths, workspace or vault names) in reports, issues, PRs, or commit messages. Describe locations generically, for example `<vault>`.

## 7. Notes for Automated (Computer-Use) Runs

- Background paste (`cmd+v`) is blocked for background control. Pasting requires full-screen control, which the user must approve for the session. Release it when done.
- Opening a note by URL (`obsidian://open?...`) is the quickest way to switch the active note.
- Selecting all with the pointer outside the message box selects the whole page instead of the draft. Click into the draft before pressing select-all, and check the selection before pressing delete.
- Read the clipboard once after copying to confirm plain-text output (WhatsApp) before pasting.

## 8. Report Template

Record the result in the release PR or issue, without personal data:

```
Version under test: X.Y.Z-beta.N (confirmed from installed manifest.json)
Fixtures: slack-comprehensive-test, whatsapp-comprehensive-test [, slack-edge-cases]
WhatsApp: PASS / FAIL (details)
Slack: PASS / FAIL (details)
Nothing was sent; drafts cleared; temporary note deleted.
```
