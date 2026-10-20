import os from "node:os";

export function isPrivateIPv4(address) {
  const octets = String(address).split(".");
  if (octets.length !== 4 || octets.some((part) => !/^\d{1,3}$/.test(part))) return false;
  const numbers = octets.map(Number);
  if (numbers.some((part) => part < 0 || part > 255)) return false;
  const [first, second] = numbers;
  return first === 10 ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168);
}

export function getPrivateIPv4Interfaces(networkInterfaces = os.networkInterfaces()) {
  const result = [];
  const seen = new Set();
  for (const [name, records] of Object.entries(networkInterfaces)) {
    for (const record of records ?? []) {
      const isIPv4 = record.family === "IPv4" || record.family === 4;
      if (!isIPv4 || record.internal || !isPrivateIPv4(record.address) || seen.has(record.address)) continue;
      seen.add(record.address);
      result.push({ name, address: record.address });
    }
  }
  return result;
}

export function buildJoinUrl(address, port) {
  if (!isPrivateIPv4(address)) throw new TypeError("A private IPv4 address is required.");
  const numericPort = Number(port);
  if (!Number.isInteger(numericPort) || numericPort < 1 || numericPort > 65535) {
    throw new TypeError("A valid port is required.");
  }
  return `http://${address}:${numericPort}/`;
}
