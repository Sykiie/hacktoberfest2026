# Locomi

Locomi is an open-source, self-hosted web app for a temporary online community around a physical space. Guests on the venue's local network can use the Shared Feed and Noteboard modules. They can publish posts and comments, or place short notes on a shared visual board. The host can privately reveal account identities and moderate content from the loopback-only admin interface.

## Architecture

Locomi uses React 19 and Vite 7 for the browser interface and Node.js with Express 5 for the venue host. Vite builds the interface into `dist/`; the host serves those files and the JSON APIs from one Node.js process. Guests reach that process over the venue's private IPv4 network only while the owner enables hosting. Owner administration stays on loopback.

```text
Guest browser ── HTTP on venue LAN ──┐
                                     ├── Node.js / Express host ── local data/ files
Owner browser ── loopback only ──────┘           │
                                                 ├── React/Vite static build
                                                 ├── community and account stores
                                                 ├── optional AI moderation provider
                                                 └── Server-Sent Events for live updates
```

The host owns validation, authentication, moderation, persistence, and venue-network access. The browser owns presentation and interaction; it never receives the AI provider key. The host rejects guest API requests for disabled modules, even when a visitor calls an endpoint directly. JSON stores and process-local sessions keep setup simple for one venue computer. `shared/community-options.js` is the shared catalog for venue types and feature-module IDs and labels, so the server and browser validate and display the same options.

## Technology impact

The app runs on a venue computer already connected to Wi-Fi or LAN, without a hosted account service. React and Vite provide a responsive guest and owner interface; Express serves the local APIs; Node.js opens guest listeners only on private IPv4 addresses and keeps owner routes loopback-only. Optional moderation can use Ollama on the host or a host-configured OpenAI-compatible HTTPS provider. Cloud moderation sends contribution text to that provider; local Ollama keeps it on the venue computer.

## Host setup

Requirements: Node.js 22.12 or later (or Node.js 24 or later), the project dependencies, and a computer connected to the venue Wi-Fi or LAN.

1. Clone or copy this project to the venue computer.
2. From the project folder, install the locked dependencies with `npm ci`.
3. Build the React interface with `npm run build`.
4. Start the app with `npm start`. Allow Node.js through the computer's firewall on the private network if prompted.
5. Open `http://127.0.0.1:3000/` (or `/admin`) on the host computer to reach the admin screen.
6. Sign in on the host computer with the fresh-install default password `locomi`. After signing in, open the **Security** tab and change the password to one with at least 10 characters. The host stores only a salted password hash in its local `data/owner.json` file. Existing installations keep their saved password when updated.
7. Select **Enable guest hosting** when guests should be able to connect. The admin screen then shows the current join URL and QR code.
8. Guests connected to the venue network can scan the QR code or open the URL. The first screen asks them to sign in, create a venue-local account, or continue as a guest. After choosing, they enter the community with separate **Shared Feed** and **Noteboard** tabs. Returning signed-in users go directly to the community.
9. Select **Disable guest hosting** to close guest access. The local admin page remains available on the host computer; the guest preview is at `http://127.0.0.1:3000/guest`.
10. Stop the app with `Ctrl+C` when finished. Guest hosting starts disabled each time the app is restarted, so sign in and enable it again when needed.

The default port is `3000`. If it is already in use, choose another available port before starting the app. In PowerShell, run `$env:PORT=3100; npm start`; in Command Prompt, run `set PORT=3100 && npm start`. Use the selected port in the local admin address.

The admin page and its actions are restricted by the server to loopback connections on the host computer. The dashboard has **Hosting**, **Community**, and **Security** tabs. The initial password `locomi` is intended for first-run setup; change it after signing in. Guest listeners bind only to private IPv4 addresses and are opened only while hosting is enabled. The app does not advertise public IPv4, IPv6, or link-local addresses.

## If a guest cannot connect

- On the **host computer**, set the venue Wi-Fi network profile to **Private** (not **Public**). On Windows, open **Settings > Network & internet > Wi-Fi > [connected network] > Network profile type** and select **Private**. This allows Windows Firewall to apply the private-network rules needed for guest devices to reach the host.
- Confirm that the host and guest device are on the same venue Wi-Fi or local network.
- Confirm that the owner enabled hosting and selected the address belonging to the venue Wi-Fi.
- Allow Node.js or the selected port through the host computer's firewall on the private network.
- Check whether the router or access point enables client isolation. This prevents devices from reaching each other even when they use the same Wi-Fi name.
- Reconnect the host to Wi-Fi and refresh the admin screen if its local address changes.

Network reachability is the access boundary for this milestone. It does not prove physical presence at the venue. Guest accounts are stored on this host in `data/users.json`; passwords are stored as salted scrypt hashes, never plaintext. Account sessions use in-memory host sessions and end when the host app restarts. There is no email verification or self-service password recovery.

## Community feed and moderation

- Posts and comments are plain text, up to 2,000 characters each, and persist on the host in `data/community.json` across app restarts.
- The feed shows newest posts first. Deleting a post removes its comments too.
- Open guest and host moderation feeds update automatically when posts or comments are created, edited, or deleted; the page does not reload. If a device briefly loses its live connection, its feed refreshes when the connection returns.
- Anyone connected to the guest network can select **Continue as guest** and publish without an account; those contributions appear as **Anonymous** and cannot be edited or deleted by their author.
- Signed-in users appear under their username by default and can select **Post anonymously** or **Anonymous** for each contribution. They can edit or delete their own posts and comments later. The server retains the linked account identity for ownership checks.
- On the host computer, sign in to admin at `/admin` and open the **Community** tab to view and moderate the feed. Signed-in identities, including identities behind anonymous contributions, appear there. No second password prompt is needed; the owner admin session and loopback-only restriction protect these tools.
- The host can participate publicly by opening the shared community feed and signing in with a regular venue-local account. The owner password remains separate and is not used as a public identity.
- Host moderation routes are restricted to loopback connections and are unavailable from guest devices.
- The host can configure AI review in the Security tab. Choose Local Ollama to connect to an Ollama service running on the host, or Cloud / OpenAI-compatible to enter a compatible HTTPS endpoint, model name, and API key. Cloud providers receive post and comment text for classification; review their data handling before choosing one. The key is stored in the host's ignored data/ai-moderation.json file and is never returned to guest clients. Restrict access to the host's data directory.
- AI checks run after publishing. If the configured provider is unavailable, posts and comments remain visible and are marked unavailable in host moderation; the host retries them automatically when the provider is reachable. AI flags remain visible until the owner reviews, edits, or deletes the contribution. AI moderation is advisory and does not automatically hide content.
- Local Ollama example: install Ollama on the host, download a compatible model such as Gemma, then configure the local URL (for example http://127.0.0.1:11434) and the exact model name in Security. Cloud providers must expose an OpenAI-compatible chat completions endpoint.

The current community modules do not include feed reactions, attachments, private messages, notifications, or account recovery.

## Community modules and Noteboard

- The host can create one venue community, choose a venue type and name, and enable one or more feature modules. **Shared Feed** and **Noteboard** are enabled by default and appear in separate guest-facing tabs. Venue types include Cafe, Library, Coworking Space, Community Center, and a custom type.
- The shared module catalog is in `shared/community-options.js`. A new module needs a stable ID and label there, a guest interface, server routes and persistence, host moderation where applicable, and unit/integration tests. See [CONTRIBUTING.md](CONTRIBUTING.md) for the complete path.
- To add a standard venue type, add it to the shared `VENUE_TYPES` catalog. Use **Other** when a host needs a venue type that is not in the standard list.
- The Noteboard is a shared board rendered with the same relative layout on phones and computers. Click the board to choose a note's top-left position. Notes can overlap, but a placement is rejected if it would cover more than 30% of any note underneath, including combined coverage from several notes. While writing, authors can choose whether a calendar date appears on their note; it is shown by default, and times are never displayed. After publication, note text and position are final; authors cannot edit or move notes.
- Notes contain up to 500 characters and have a public display name (up to 32 characters). Signed-in authors may choose any display name; the host can still see the account username.
- Signed-in notes publish immediately after confirmation. The account then has a one-minute server-enforced cooldown that prevents posting another note or deleting notes. Authors can delete their own notes after the cooldown.
- Guests submit notes for host review. The host can approve or reject during the first 10 minutes. Notes are automatically approved after 10 minutes; if the chosen position is still available, they appear on the board marked **Needs review**. If another note makes that position invalid, the approved note stays private and the guest has 30 minutes to choose a valid replacement position without another content review. An unplaced note expires after that window.
- Each guest submission receives a random, single-submission token. The host stores only its hash. It permits checking that submission's status and placing an approved note in a replacement position; it cannot delete a published note. The host removes the token when the submission is published, rejected, or expires, and the guest browser clears its copy after learning it is terminal. Tokens are kept in that browser's local storage while the submission is active so the guest can return after closing the page. Because the app currently uses HTTP, a capable local-network observer could capture a pending token. Its authority is limited to that one submission and its short review/placement lifetime.
- Guests cannot delete published notes. Signed-in authors can delete their own notes after cooldown, and the host can remove any note from the loopback-only admin view.
- In admin **Community**, the host can switch between **Feed**, **Noteboard**, and **Accounts** moderation tabs. The Noteboard view shows guest submissions, published notes, review flags, an account-freeze shortcut, and audit history. Auto-published notes remain flagged until the host marks them reviewed. The history is collapsed by default to keep the moderation view compact.
- The host audit records note text, display name, account username when signed in (otherwise Guest), action, and time. It keeps at most 500 events and removes events older than 30 days. Clearing history requires a confirmation dialog and the admin password; it does not remove notes from the board.
- The host can freeze a signed-in account for 24 hours from the Accounts moderation tab or the Noteboard shortcut, or unfreeze it sooner. Freezes apply globally across community modules: the account can still read, but cannot create, edit, or delete feed contributions or notes. Accountless guests cannot be frozen.
- Board changes update open guest boards and host Noteboard moderation views over the existing server-sent event stream; clients fetch content from their normal authorized API routes.

**Prototype account security:** The app currently uses HTTP on the local network. Passwords and session cookies are not encrypted in transit, so someone monitoring the venue network could capture them. The registration screen discloses this before password submission. Use a unique, disposable password that you do not use anywhere else, and do not use these prototype accounts for sensitive information. Add HTTPS before introducing sensitive content or relying on accounts for important access.

## Development

- `npm ci` installs the locked dependencies. Node.js 22.12+ or 24+ is supported.
- `npm run dev` starts Vite for local UI work. Run `npm start` in a second terminal to provide the admin APIs.
- `npm test` runs unit and integration tests for the stores, authentication, community APIs, and host lifecycle.
- `npm run check` runs Node.js syntax checks over server code, shared catalogs, scripts, and tests; `npm run build` parses and bundles the React interface.
- `npm run check:docs` checks that required contributor documents exist and their relative Markdown links resolve.
- `npm run build` creates the static files served by the host process.
- GitHub Actions runs tests, syntax and documentation checks, the production build, and a production dependency audit on pull requests and pushes. A separate Gitleaks job scans repository history for committed credentials.

Read [CONTRIBUTING.md](CONTRIBUTING.md) for local setup, testing, module and venue-type extensions, and pull-request guidance. Current behavior is specified in `openspec/specs/`; completed changes are recorded in `openspec/changes/archive/`. Read [SECURITY.md](SECURITY.md) before configuring a cloud moderation key. The project is released under the [MIT License](LICENSE); version history is in [CHANGELOG.md](CHANGELOG.md) and the current release series is in `package.json`.

For the judging demo, see [DEMO_SCRIPT.md](DEMO_SCRIPT.md) for a one-minute recording plan using the running app and a second device.

## Deployment and scale

Locomi is designed for one venue community on one self-hosted computer. Guest feed requests return cursor-based pages of 30 posts, so the initial page and routine refreshes stay bounded as the feed grows. The current JSON stores still rewrite local files on updates, sessions live in process memory, and live events are broadcast by that process. This keeps the venue setup low-cost and easy to back up, and suits a small or medium local event, but does not provide horizontal scaling or shared sessions across hosts. A larger multi-venue deployment should first replace the JSON stores with a database-backed store, move sessions and event delivery to shared services, and add HTTPS and load testing. Contributors can keep the current store contracts while introducing those adapters incrementally.
