import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const COOKIE_NAME = "local_community_user";
const USERNAME_PATTERN = /^[A-Za-z0-9_]{3,24}$/;

export function normalizeUsername(username) {
  if (typeof username !== "string") return null;
  const trimmed = username.trim();
  if (!USERNAME_PATTERN.test(trimmed)) return null;
  return trimmed.toLowerCase();
}

function readCookie(request) {
  for (const item of String(request.headers.cookie || "").split(";")) {
    const [name, ...value] = item.trim().split("=");
    if (name === COOKIE_NAME) return decodeURIComponent(value.join("="));
  }
  return "";
}

export function createUserAuth(usersFile, { now = () => Date.now() } = {}) {
  const sessions = new Map();
  let users = new Map();
  let registrationQueue = Promise.resolve();

  async function load() {
    try {
      const records = JSON.parse(await readFile(usersFile, "utf8"));
      users = new Map(records.map((user) => [user.username, user]));
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }

  function isAvailable(username) {
    const normalized = normalizeUsername(username);
    return Boolean(normalized && !users.has(normalized));
  }

  async function persist(nextUsers) {
    await mkdir(path.dirname(usersFile), { recursive: true });
    const temporaryFile = `${usersFile}.${randomBytes(8).toString("hex")}.tmp`;
    try {
      await writeFile(temporaryFile, `${JSON.stringify([...nextUsers.values()], null, 2)}\n`, { mode: 0o600 });
      await rename(temporaryFile, usersFile);
    } catch (error) {
      await unlink(temporaryFile).catch(() => {});
      throw error;
    }
  }

  async function mutateUsers(operation) {
    let release;
    const previous = registrationQueue;
    registrationQueue = new Promise((resolve) => { release = resolve; });
    await previous;
    try {
      const nextUsers = new Map(users);
      const result = await operation(nextUsers);
      await persist(nextUsers);
      users = nextUsers;
      return result;
    } finally { release(); }
  }

  function isFrozen(username) {
    const record = users.get(normalizeUsername(username));
    return Boolean(record?.frozenUntil && Date.parse(record.frozenUntil) > now());
  }

  function assertCanContribute(username) {
    if (isFrozen(username)) throw Object.assign(new Error("This account is frozen from contributing for a while. You can still read the community."), { status: 403, code: "ACCOUNT_FROZEN" });
  }

  async function startNoteCooldown(username) {
    const normalized = normalizeUsername(username);
    assertCanContribute(normalized);
    return mutateUsers((nextUsers) => {
      const user = nextUsers.get(normalized);
      if (user?.frozenUntil && Date.parse(user.frozenUntil) > now()) throw Object.assign(new Error("This account is frozen from contributing for a while. You can still read the community."), { status: 403, code: "ACCOUNT_FROZEN" });
      const current = Date.parse(user?.noteCooldownUntil || "") || 0;
      if (current > now()) throw Object.assign(new Error(`Please wait ${Math.ceil((current - now()) / 1000)} seconds before posting or deleting a note.`), { status: 429, code: "NOTE_COOLDOWN", cooldownUntil: user.noteCooldownUntil });
      const cooldownUntil = new Date(now() + 60_000).toISOString();
      nextUsers.set(normalized, { ...user, noteCooldownUntil: cooldownUntil });
      return cooldownUntil;
    });
  }

  function assertCanDeleteNote(username) {
    assertCanContribute(username);
    const user = users.get(normalizeUsername(username));
    if (Date.parse(user?.noteCooldownUntil || "") > now()) {
      throw Object.assign(new Error(`Please wait ${Math.ceil((Date.parse(user.noteCooldownUntil) - now()) / 1000)} seconds before posting or deleting a note.`), { status: 429, code: "NOTE_COOLDOWN" });
    }
  }

  async function setFrozen(username, frozen) {
    const normalized = normalizeUsername(username);
    if (!normalized || !users.has(normalized)) throw Object.assign(new Error("That community account could not be found."), { status: 404 });
    return mutateUsers((nextUsers) => {
      const user = nextUsers.get(normalized);
      const frozenUntil = frozen ? new Date(now() + 24 * 60 * 60 * 1000).toISOString() : null;
      nextUsers.set(normalized, { ...user, frozenUntil });
      return { username: user.displayUsername, frozenUntil };
    });
  }

  function listAccounts() {
    return [...users.values()].map((user) => ({ username: user.displayUsername, frozenUntil: user.frozenUntil && Date.parse(user.frozenUntil) > now() ? user.frozenUntil : null }));
  }

  async function register(username, password) {
    const normalized = normalizeUsername(username);
    if (!normalized) throw new TypeError("Use 3–24 letters, numbers, or underscores for the username.");
    if (typeof password !== "string" || password.length < 10) throw new TypeError("Choose a password with at least 10 characters.");
    let release;
    const previous = registrationQueue;
    registrationQueue = new Promise((resolve) => { release = resolve; });
    await previous;
    try {
      if (users.has(normalized)) throw Object.assign(new Error("That username is unavailable."), { code: "USERNAME_TAKEN" });
      const salt = randomBytes(16).toString("hex");
      const passwordHash = (await scrypt(password, salt, 64)).toString("hex");
      const record = { username: normalized, displayUsername: username.trim(), salt, passwordHash, frozenUntil: null, noteCooldownUntil: null };
      const nextUsers = new Map(users);
      nextUsers.set(normalized, record);
      await persist(nextUsers);
      users = nextUsers;
      return createSession(normalized);
    } finally {
      release();
    }
  }

  async function login(username, password) {
    const normalized = normalizeUsername(username);
    const user = normalized ? users.get(normalized) : null;
    if (typeof password !== "string") return null;
    // Use a dummy scrypt for unknown usernames to reduce timing-based account discovery.
    const salt = user?.salt || "local-community-login-dummy-salt";
    const candidate = await scrypt(password, salt, 64);
    if (!user) return null;
    const expected = Buffer.from(user.passwordHash, "hex");
    if (candidate.length !== expected.length || !timingSafeEqual(candidate, expected)) return null;
    return createSession(user.username);
  }

  function createSession(username) {
    const token = randomBytes(32).toString("base64url");
    sessions.set(token, username);
    return token;
  }

  function identifyUser(request) {
    const token = readCookie(request);
    const username = token && sessions.get(token);
    if (!username) return null;
    const user = users.get(username);
    return user ? { key: user.username, username: user.displayUsername } : null;
  }

  function currentUser(request) {
    const user = identifyUser(request);
    return user ? { username: user.username } : null;
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

  return { load, isAvailable, register, login, identifyUser, currentUser, destroySession, sessionCookie, clearCookie, isFrozen, assertCanContribute, startNoteCooldown, assertCanDeleteNote, setFrozen, listAccounts };
}
