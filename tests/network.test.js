import test from "node:test";
import assert from "node:assert/strict";
import { buildJoinUrl, getPrivateIPv4Interfaces, isPrivateIPv4 } from "../server/network.js";
import { createJoinPayload } from "../server/join.js";

test("recognizes RFC 1918 IPv4 addresses and excludes other ranges", () => {
  for (const address of ["10.0.0.1", "10.255.255.254", "172.16.0.1", "172.31.255.254", "192.168.1.20"]) {
    assert.equal(isPrivateIPv4(address), true, address);
  }
  for (const address of ["127.0.0.1", "169.254.1.4", "172.15.0.1", "172.32.0.1", "8.8.8.8", "192.169.1.1", "300.1.1.1", "not-an-ip"]) {
    assert.equal(isPrivateIPv4(address), false, address);
  }
});

test("selects unique private IPv4 interface addresses only", () => {
  const found = getPrivateIPv4Interfaces({
    WiFi: [
      { family: "IPv4", address: "192.168.1.25", internal: false },
      { family: "IPv6", address: "fe80::1", internal: false },
    ],
    Ethernet: [
      { family: 4, address: "10.0.0.8", internal: false },
      { family: 4, address: "192.168.1.25", internal: false },
    ],
    VPN: [{ family: "IPv4", address: "100.64.0.2", internal: false }],
    Loopback: [{ family: "IPv4", address: "127.0.0.1", internal: true }],
  });
  assert.deepEqual(found, [
    { name: "WiFi", address: "192.168.1.25" },
    { name: "Ethernet", address: "10.0.0.8" },
  ]);
});

test("reports a changed address on the next interface snapshot", () => {
  const before = getPrivateIPv4Interfaces({ WiFi: [{ family: 4, address: "192.168.1.25", internal: false }] });
  const after = getPrivateIPv4Interfaces({ WiFi: [{ family: 4, address: "192.168.1.44", internal: false }] });
  assert.deepEqual(before.map(({ address }) => address), ["192.168.1.25"]);
  assert.deepEqual(after.map(({ address }) => address), ["192.168.1.44"]);
});

test("builds the guest join URL from the selected address and actual port", () => {
  assert.equal(buildJoinUrl("192.168.1.25", 3000), "http://192.168.1.25:3000/guest");
  assert.throws(() => buildJoinUrl("127.0.0.1", 3000), /private IPv4/);
  assert.throws(() => buildJoinUrl("192.168.1.25", 70000), /valid port/);
});

test("encodes exactly the URL returned to the host screen", async () => {
  let encodedValue = "";
  const payload = await createJoinPayload("192.168.1.25", 3000, async (url) => {
    encodedValue = url;
    return "data:image/png;base64,qr";
  });
  assert.equal(payload.url, "http://192.168.1.25:3000/guest");
  assert.equal(encodedValue, payload.url);
  assert.equal(payload.qrDataUrl, "data:image/png;base64,qr");
});
