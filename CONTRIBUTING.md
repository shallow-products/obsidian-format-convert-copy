# Contributing

Thanks for your interest in **Format Convert Copy**. Bug reports, feature requests, and pull requests are welcome.

## Reporting Issues

- Use the [issue templates](https://github.com/shallow-products/obsidian-format-convert-copy/issues/new/choose).
- For security problems, follow [SECURITY.md](./SECURITY.md) instead of opening a public issue.
- Before posting logs or screenshots, remove personal data such as usernames, hostnames, and local file paths.

## Development Setup

All commands run inside Docker, so no local Node.js installation is needed:

```bash
docker compose run --rm format-convert-copy npm test
```

```bash
docker compose run --rm format-convert-copy npm run build
```

See [AGENTS.md](./AGENTS.md) for the full design constraints, including cross-platform (desktop and mobile) rules.

## Pull Requests

1. Fork the repository and create a branch from `master`.
2. Keep changes focused, and add or update tests for behavior changes.
3. Make sure tests and the production build pass.
4. Use [Conventional Commits](https://www.conventionalcommits.org/) for commit messages and PR titles (`feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `ci:`, `chore:`, `sec:`).
5. Fill in the pull request template.

Pull requests are squash-merged into `master` after CI passes.

## Mobile Compatibility

The plugin supports iOS and Android. Do not use Node.js built-in modules (`fs`, `path`, `crypto`, `os`, `http`, `child_process`) in plugin code.

## Releases

Releases are made by the maintainer. Release tags use the exact manifest version with no `v` prefix (for example `0.3.38`).

## License

By contributing, you agree that your contributions are licensed under the [MIT License](./LICENSE).
