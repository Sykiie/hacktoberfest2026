import { buildJoinUrl } from "./network.js";

export async function createJoinPayload(address, port, encodeQRCode) {
  const url = buildJoinUrl(address, port);
  const qrDataUrl = await encodeQRCode(url);
  return { url, qrDataUrl };
}
