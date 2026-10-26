# Security Policy

## Supported Versions

Only the latest release of **Format Convert Copy** receives security fixes. Please update to the [latest release](https://github.com/shallow-products/obsidian-format-convert-copy/releases/latest) before reporting.

## Reporting a Vulnerability

Please **do not** open a public issue for security problems.

Report privately through GitHub:

1. Open the [Security tab](https://github.com/shallow-products/obsidian-format-convert-copy/security) of this repository.
2. Choose **Report a vulnerability**.
3. Describe the issue, the affected version, and steps to reproduce.

Do not include personal data, credentials, or private note contents in a report. A minimal Markdown sample that reproduces the problem is enough.

## What to Expect

- Reports are handled on a best-effort basis by the maintainer.
- You will receive an acknowledgement, and updates as the issue is investigated.
- Confirmed vulnerabilities are fixed in a new release, and the advisory is published after the fix is available.

## Scope

This plugin converts Markdown text on the local device and writes the result to the clipboard. It does not send note contents over the network. Issues of interest include, for example, unsafe link or URL handling in generated output, unintended exposure of note contents, and weaknesses in the release workflow.
