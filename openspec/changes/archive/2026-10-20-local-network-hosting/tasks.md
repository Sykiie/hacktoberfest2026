# Tasks

## 1. Establish a minimal runnable host app

- [x] 1.1 Create the React web app, production build, and host startup command with a landing page that confirms the app is running; verify the host can start it and open it locally in a browser.
- [x] 1.2 Document prerequisites and startup/shutdown steps for a venue computer; verify a new host can follow the instructions from a clean checkout.

## 2. Serve and advertise the local network address

- [x] 2.1 Configure the server to accept connections through the venue computer's active private LAN interface and discover usable local addresses; verify loopback and unrelated public/VPN addresses are not presented as the join target.
- [x] 2.2 Display the current local join URL and explain host firewall and Wi-Fi client isolation prerequisites; verify the displayed address uses the server's actual port and can be copied.
- [x] 2.3 Add focused coverage for local address selection and URL construction; verify the tests cover multiple interfaces, missing private addresses, and address changes.

## 3. Generate and refresh the join QR code

- [x] 3.1 Generate a QR code from the same current URL shown to the owner; verify decoding the QR produces exactly the displayed URL.
- [x] 3.2 Refresh both the URL and QR code when the usable local address changes; verify neither retains a stale address after a change.

## 4. Verify cross-device access

- [x] 4.1 Document and perform a manual smoke check from a second device on the venue Wi-Fi, including opening the URL and scanning the QR; verify both paths load the hosted landing page.
- [x] 4.2 Verify and document the expected failure when client isolation or host firewall blocks traffic, and state that network reachability does not prove physical presence.
