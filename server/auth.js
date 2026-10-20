import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const COOKIE_NAME = "local_community_admin";
export const DEFAULT_ADMIN_PASSWORD = "locomi";

export function isLoopbackAddress(address) {
  const normalized = String(address || "").toLowerCase().replace(/^::ffff:/, "");
  if (normalized === "::1") return true;
  const octets = normalized.split(".").map(Number);
  return octets.length === 4 && octets.every((part) => Number.isInteger(part) && part >= 0 && part <= 255) && octets[0] === 127;
}

export function isAdminLoopbackRequest(request) {
  return isLoopbackAddress(request.socket?.localAddress);
}

function readCookie(request) {
  const cookies = String(request.headers.cookie || "").split(";");
  for (const item of cookies) {
    const [name, ...value] = item.trim().split("=");
    if (name === COOKIE_NAME) return decodeURIComponent(value.join("="));
  }
  return "";
}

export function createAdminAuth(ownerFile) {
  const sessions = new Set();
  let owner = null;

  async function load() {
    try {
      owner = JSON.parse(await readFile(ownerFile, "utf8"));
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }

  async function savePassword(password, { exclusive = false } = {}) {
    const salt = randomBytes(16).toString("hex");
    const passwordHash = (await scrypt(password, salt, 64)).toString("hex");
    const nextOwner = { salt, passwordHash };
    await mkdir(path.dirname(ownerFile), { recursive: true });
    await writeFile(ownerFile, `${JSON.stringify(nextOwner)}\n`, { flag: exclusive ? "wx" : "w", mode: 0o600 });
    owner = nextOwner;
  }

  async function initializeDefault(password = DEFAULT_ADMIN_PASSWORD) {
    if (owner) return false;
    try {
      await savePassword(password, { exclusive: true });
      return true;
    } catch (error) {
      if (error.code !== "EEXIST") throw error;
      await load();
      return false;
    }
  }

  async function changePassword(password) {
    if (typeof password !== "string" || password.length < 10) {
      throw new TypeError("Choose a password with at least 10 characters.");
    }
    if (!owner) throw new Error("Owner authentication is not configured.");
    await savePassword(password);
    sessions.clear();
    return createSession();
  }

  async function login(password) {
    if (!await verifyPassword(password)) return null;
    return createSession();
  }

  async function verifyPassword(password) {
    if (!owner || typeof password !== "string") return false;
    const candidate = await scrypt(password, owner.salt, 64);
    const expected = Buffer.from(owner.passwordHash, "hex");
    return candidate.length === expected.length && timingSafeEqual(candidate, expected);
  }

  function createSession() {
    const token = randomBytes(32).toString("base64url");
    sessions.add(token);
    return token;
  }

  function isAuthenticated(request) {
    const token = readCookie(request);
    return Boolean(token && sessions.has(token));
  }

  function authenticatedSessionId(request) {
    const token = readCookie(request);
    return token && sessions.has(token) ? token : null;
  }

  function destroySession(request) {
    const token = readCookie(request);
    if (token) sessions.delete(token);
  }

  function sessionCookie(token) {
    return `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Strict`;
  }

  function clearCookie() {
    return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`;
  }

  return {
    load,
    initializeDefault,
    changePassword,
    login,
    verifyPassword,
    isConfigured: () => Boolean(owner),
    isAuthenticated,
    authenticatedSessionId,
    destroySession,
    sessionCookie,
    clearCookie,
  };
}
