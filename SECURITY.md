# Security policy

## Supported deployments

Locomi is a local-network prototype for a venue computer. It currently serves the guest network over HTTP. Account passwords, session cookies, and pending guest-note tokens are not encrypted in transit; use a trusted venue network and unique, disposable community passwords. Do not use the prototype for sensitive information.

## Protect credentials

- Configure AI provider keys in the host's Security screen. They are stored in the host's ignored `data/ai-moderation.json` file and are not returned to browser clients.
- Keep `.env` files, `data/`, private keys, and venue records out of Git. `.gitignore` covers common local environment files and host data; Gitleaks also scans repository history in GitHub Actions.
- For a repository owned by a GitHub organization, configure the encrypted `GITLEAKS_LICENSE` repository secret required by the Gitleaks Action. Personal repositories do not need it.
- Never paste a real key into source, tests, issues, pull requests, screenshots, or logs. Use fake test credentials only.
- Restrict access to the host computer and its `data/` directory. Back up local data to a protected location.

If a real credential is exposed, revoke or rotate it with its provider immediately, remove it from the active files and Git history, and report the incident privately to the maintainers. Deleting a key from the latest commit does not invalidate copies in earlier commits.

## Report a vulnerability

Do not publish an unpatched vulnerability in a public issue. Contact the project maintainers privately using the contact method on the repository profile and include reproduction steps and impact. The project does not yet publish a guaranteed response timeline.
