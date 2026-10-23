# Contributing to Locomi

Thanks for helping improve Locomi. Keep changes small, describe the behavior they affect, and include a test for each new server behavior or important bug fix.

## Set up the project

Use Node.js 22.12+ or 24+, then run:

```sh
npm ci
npm test
npm run check
npm run check:docs
npm run build
```

For interface work, run `npm run dev` and `npm start` in separate terminals. The development server provides the browser UI; the Node host provides the local APIs. Tests use Node's built-in test runner and create disposable data directories.

## Add a feature module

1. Add a stable, lowercase ID and guest-facing label to `COMMUNITY_MODULES` in `shared/community-options.js`. Set `enabledByDefault` only when new venues should start with the module enabled.
2. Implement the guest interface and its server routes. Keep authorization, validation, persistence, and public/private data projection on the server.
3. Add or extend store tests and API integration tests. Include disabled-module behavior and authorization checks where relevant.
4. Add host moderation controls if the module creates content that the owner must review or remove.
5. Update the relevant OpenSpec capability under `openspec/specs/` and the user-facing README.
6. Run all four setup commands above and describe the user-visible change and test coverage in the pull request.

The shared catalog drives server-side module validation, host setup checkboxes, guest tab labels, and default module selection. Module IDs are persisted in the venue settings; keep existing IDs stable when changing display names.

## Add a venue type

Add the display value once to `VENUE_TYPES` in `shared/community-options.js`, then add a scenario to `openspec/specs/venue-community/spec.md` and a validation test to `tests/venue-community-store.test.js`. Hosts can already choose **Other** and enter a custom type when a standard option does not fit.

## Tests and checks

- Put store and validation tests beside the existing tests in `tests/`.
- Use integration tests for API authentication, request validation, and public/private response fields.
- Keep tests isolated in temporary directories; do not use real accounts, API keys, or venue data.
- Run `npm test`, `npm run check`, `npm run check:docs`, and `npm run build` before opening a pull request. GitHub Actions runs these checks on pushes and pull requests; Gitleaks scans repository history for secrets.
- Update OpenSpec requirements when externally visible behavior changes. Keep `CHANGELOG.md` current for user-facing changes.

## Pull requests and issues

Use the issue forms for bug reports and feature requests. Pull requests should explain the problem, the change, how it was verified, and any screenshots or short recording needed to review an interface change. Keep unrelated formatting changes out of functional pull requests. Do not include credentials, private venue data, or generated `data/` files.

By participating, contributors agree to follow [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md). Report security issues using the private contact guidance in [SECURITY.md](SECURITY.md), not a public issue.
