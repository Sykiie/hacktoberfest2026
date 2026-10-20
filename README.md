# Local Community

Local Community is an open-source, self-hosted web app for a temporary online community around a physical space. Guests on the venue's local network can read and publish text posts, comment, and identify themselves anonymously or with a venue-local account. The host can privately reveal account identities and moderate content from the loopback-only admin interface.

## Host setup

Requirements: Node.js 20 or later, the project dependencies, and a computer connected to the venue Wi-Fi or LAN.

1. Clone or copy this project to the venue computer.
2. From the project folder, install dependencies with `npm install`.
3. Build the React interface with `npm run build`.
4. Start the app with `npm start`. Allow Node.js through the computer's firewall on the private network if prompted.
5. Open the printed admin address, `http://127.0.0.1:3000/admin`, on the host computer.
6. Sign in on the host computer with the fresh-install default password `locomi`. After signing in, open the **Security** tab and change the password to one with at least 10 characters. The host stores only a salted password hash in its local `data/owner.json` file. Existing installations keep their saved password when updated.
7. Select **Enable guest hosting** when guests should be able to connect. The admin screen then shows the current join URL and QR code.
8. Guests connected to the venue network can scan the QR code or open the URL. The first screen asks them to sign in, create a venue-local account, or continue as a guest. After choosing, they enter the community feed. Returning signed-in users go directly to the feed.
9. Select **Disable guest hosting** to close guest access. The local admin page and guest preview at `http://127.0.0.1:3000/` remain available on the host computer.
10. Stop the app with `Ctrl+C` when finished. Guest hosting starts disabled each time the app is restarted, so sign in and enable it again when needed.

The default port is `3000`. If it is already in use, choose another available port before starting the app. In PowerShell, run `$env:PORT=3100; npm start`; in Command Prompt, run `set PORT=3100 && npm start`. Use the selected port in the local admin address.

The admin page and its actions are restricted by the server to loopback connections on the host computer. The dashboard has **Hosting**, **Community**, and **Security** tabs. The initial password `locomi` is intended for first-run setup; change it after signing in. Guest listeners bind only to private IPv4 addresses and are opened only while hosting is enabled. The app does not advertise public IPv4, IPv6, or link-local addresses.

## If a guest cannot connect

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

This first feed milestone intentionally does not include reactions, sticky notes, attachments, private messages, notifications, or account recovery.

**Prototype account security:** The app currently uses HTTP on the local network. Passwords and session cookies are not encrypted in transit, so someone monitoring the venue network could capture them. The registration screen discloses this before password submission. Use a unique, disposable password that you do not use anywhere else, and do not use these prototype accounts for sensitive information. Add HTTPS before introducing sensitive content or relying on accounts for important access.

## Development

- `npm run dev` starts Vite for local UI work. Run `npm start` in a second terminal to provide the admin APIs.
- `npm test` runs the network, authentication, and host lifecycle tests.
- `npm run build` creates the static files served by the host process.
