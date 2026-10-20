import { createHostServer } from "./host.js";

const host = await createHostServer();
await host.start();

console.log(`Local Community admin is available at http://127.0.0.1:${host.port}/admin`);
console.log("Guest access over venue Wi-Fi is disabled until the owner signs in and enables hosting.");

async function stop() {
  await host.close();
  process.exit(0);
}

process.on("SIGINT", stop);
process.on("SIGTERM", stop);
