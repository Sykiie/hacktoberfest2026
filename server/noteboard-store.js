import { createHash, randomBytes, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

export const MAX_NOTE_LENGTH = 500;
export const NOTE_WIDTH = 0.22;
export const NOTE_HEIGHT = 0.23;
export const MAX_NOTE_COVERAGE = 0.3;
export const REVIEW_WINDOW_MS = 10 * 60 * 1000;
export const REPLACEMENT_WINDOW_MS = 30 * 60 * 1000;
const AUDIT_LIMIT = 500;
const AUDIT_AGE_MS = 30 * 24 * 60 * 60 * 1000;
const COVERAGE_EPSILON = 1e-9;

function fail(status, message) { return Object.assign(new Error(message), { status }); }
function normalizeText(text) {
  if (typeof text !== "string" || !text.trim()) throw fail(400, "Write a note before placing it.");
  const value = text.trim();
  if (value.length > MAX_NOTE_LENGTH) throw fail(400, `Keep notes to ${MAX_NOTE_LENGTH} characters or fewer.`);
  return value;
}
function normalizeName(name) {
  if (typeof name !== "string" || !name.trim()) throw fail(400, "Choose a display name for your note.");
  if (name.trim().length > 32) throw fail(400, "Display names must be 32 characters or fewer.");
  return name.trim();
}
function normalizePosition(position) {
  const x = Number(position?.x);
  const y = Number(position?.y);
  if (!Number.isFinite(x) || !Number.isFinite(y) || x < 0 || y < 0 || x > 1 - NOTE_WIDTH || y > 1 - NOTE_HEIGHT) {
    throw fail(400, "Choose a position within the board.");
  }
  return { x: Number(x.toFixed(4)), y: Number(y.toFixed(4)) };
}
function coveredAreaRatio(note, overlays) {
  const right = note.x + NOTE_WIDTH;
  const bottom = note.y + NOTE_HEIGHT;
  const clipped = overlays.map((overlay) => ({
    left: Math.max(note.x, overlay.x),
    right: Math.min(right, overlay.x + NOTE_WIDTH),
    top: Math.max(note.y, overlay.y),
    bottom: Math.min(bottom, overlay.y + NOTE_HEIGHT),
  })).filter((rect) => rect.right > rect.left && rect.bottom > rect.top);
  const xEdges = [...new Set([note.x, right, ...clipped.flatMap((rect) => [rect.left, rect.right])])].sort((a, b) => a - b);
  let area = 0;
  for (let i = 0; i < xEdges.length - 1; i++) {
    const left = xEdges[i];
    const width = xEdges[i + 1] - left;
    if (!width) continue;
    const middle = left + width / 2;
    const intervals = clipped.filter((rect) => rect.left < middle && rect.right > middle)
      .map((rect) => [rect.top, rect.bottom]).sort((a, b) => a[0] - b[0]);
    let coveredHeight = 0;
    let start = null;
    let end = null;
    for (const [top, lower] of intervals) {
      if (start === null) { start = top; end = lower; }
      else if (top <= end) end = Math.max(end, lower);
      else { coveredHeight += end - start; start = top; end = lower; }
    }
    if (start !== null) coveredHeight += end - start;
    area += width * coveredHeight;
  }
  return area / (NOTE_WIDTH * NOTE_HEIGHT);
}

function validateUniquePlacement(position, notes) {
  for (let i = 0; i < notes.length; i++) {
    const note = notes[i];
    const overlays = notes.slice(0, i);
    const before = coveredAreaRatio(note, overlays);
    const after = coveredAreaRatio(note, [...overlays, position]);
    if (after > before + COVERAGE_EPSILON && after > MAX_NOTE_COVERAGE + COVERAGE_EPSILON) {
      throw fail(409, "That position would cover more than 30% of an existing note. Choose a clearer spot.");
    }
  }
}
function tokenHash(token) { return createHash("sha256").update(token).digest("hex"); }

export function createNoteboardStore({ boardFile, auditFile, now = () => Date.now() }) {
  let state = { notes: [], submissions: [] };
  let audit = [];
  let queue = Promise.resolve();

  async function readJson(filePath, fallback) {
    try { return JSON.parse(await readFile(filePath, "utf8")); }
    catch (error) { if (error.code === "ENOENT") return fallback; throw error; }
  }
  async function persist(filePath, value) {
    await mkdir(path.dirname(filePath), { recursive: true });
    const temp = `${filePath}.${randomBytes(8).toString("hex")}.tmp`;
    try {
      await writeFile(temp, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
      await rename(temp, filePath);
    } catch (error) { await unlink(temp).catch(() => {}); throw error; }
  }
  async function load() {
    state = await readJson(boardFile, { notes: [], submissions: [] });
    if (!Array.isArray(state.notes) || !Array.isArray(state.submissions)) throw new Error("Noteboard data file has an invalid format.");
    audit = await readJson(auditFile, []);
    if (!Array.isArray(audit)) throw new Error("Noteboard audit file has an invalid format.");
    await mutate((draft, events) => { expireAndApprove(draft, events); pruneAudit(events); });
  }
  async function mutate(operation) {
    let release;
    const previous = queue;
    queue = new Promise((resolve) => { release = resolve; });
    await previous;
    try {
      const draft = structuredClone(state);
      const events = structuredClone(audit);
      const result = await operation(draft, events);
      await persist(boardFile, draft);
      await persist(auditFile, events);
      state = draft;
      audit = events;
      return result;
    } finally { release(); }
  }
  function addAudit(events, note, action) {
    events.unshift({ id: randomUUID(), text: note.text, author: note.ownerUsername || "Guest", displayName: note.displayName, action, createdAt: new Date(now()).toISOString() });
    pruneAudit(events);
  }
  function pruneAudit(events) {
    const cutoff = now() - AUDIT_AGE_MS;
    for (let i = events.length - 1; i >= 0; i--) if (Date.parse(events[i].createdAt) < cutoff) events.splice(i, 1);
    if (events.length > AUDIT_LIMIT) events.splice(AUDIT_LIMIT);
  }
  function expireAndApprove(draft, events) {
    const stamp = now();
    let changed = false;
    for (const submission of draft.submissions) {
      if (submission.state === "pending" && stamp >= submission.reviewDeadline) {
        changed = true;
        const note = { ...submission.note, id: submission.id, createdAt: new Date(stamp).toISOString(), needsReview: true };
        try {
          validateUniquePlacement(submission.position, draft.notes);
          Object.assign(note, submission.position);
          draft.notes.unshift(note);
          submission.state = "published";
          submission.tokenHash = null;
          addAudit(events, note, "auto-published");
        } catch (error) {
          if (error.status !== 409) throw error;
          submission.state = "placement-required";
          submission.placementDeadline = stamp + REPLACEMENT_WINDOW_MS;
        }
      }
      if (submission.state === "placement-required" && stamp >= submission.placementDeadline) {
        changed = true;
        submission.state = "expired";
        submission.tokenHash = null;
      }
    }
    draft.submissions = draft.submissions.filter((submission) => !["published", "rejected", "expired"].includes(submission.state));
    return changed;
  }
  async function processDeadlines() {
    return mutate((draft, events) => expireAndApprove(draft, events));
  }
  async function validateCandidate({ text, displayName, position }) {
    normalizeText(text);
    normalizeName(displayName);
    const point = normalizePosition(position);
    await processDeadlines();
    validateUniquePlacement(point, state.notes);
    return point;
  }
  function publicNote(note, viewerKey, includeModerationState = false) {
    return { id: note.id, text: note.text, displayName: note.displayName, profileImageUrl: note.ownerKey ? `/api/profile-images/members/${encodeURIComponent(note.ownerKey)}` : null, x: note.x, y: note.y, createdAt: note.createdAt, showDate: note.showDate !== false, ...(includeModerationState ? { needsReview: Boolean(note.needsReview) } : {}), canDelete: Boolean(viewerKey && note.ownerKey === viewerKey) };
  }
  function moderationNote(note) {
    return { ...publicNote(note, null, true), author: note.ownerUsername || "Guest", ownerUsername: note.ownerUsername || null };
  }
  async function list(viewerKey = null) {
    await processDeadlines();
    return state.notes.map((note) => publicNote(note, viewerKey));
  }
  async function submitGuest({ text, displayName, position, showDate }) {
    const content = normalizeText(text);
    const name = normalizeName(displayName);
    const point = normalizePosition(position);
    let token;
    const id = await mutate((draft, events) => {
      expireAndApprove(draft, events);
      validateUniquePlacement(point, draft.notes);
      token = randomBytes(32).toString("base64url");
      const id = randomUUID();
      draft.submissions.push({ id, note: { text: content, displayName: name, showDate: showDate !== false, ownerKey: null, ownerUsername: null }, aiReview: { status: "pending", reason: "", severity: "none", checkedAt: null }, position: point, state: "pending", submittedAt: now(), reviewDeadline: now() + REVIEW_WINDOW_MS, placementDeadline: null, tokenHash: tokenHash(token), needsReview: false });
      addAudit(events, { id, text: content, displayName: name, ownerUsername: null }, "submitted-for-review");
      return id;
    });
    return { id, token, reviewDeadline: now() + REVIEW_WINDOW_MS };
  }
  async function getSubmission(token) {
    if (typeof token !== "string" || token.length < 20) throw fail(401, "This note link is no longer valid.");
    await processDeadlines();
    const submission = state.submissions.find((item) => item.tokenHash && item.tokenHash === tokenHash(token));
    if (!submission) throw fail(401, "This note link has expired or was already used.");
    return { state: submission.state, reviewDeadline: submission.reviewDeadline, placementDeadline: submission.placementDeadline };
  }
  async function replaceGuestPosition(token, position) {
    const point = normalizePosition(position);
    return mutate((draft, events) => {
      expireAndApprove(draft, events);
      const submission = draft.submissions.find((item) => item.tokenHash && item.tokenHash === tokenHash(token));
      if (!submission || submission.state !== "placement-required") throw fail(409, "This note is not waiting for a replacement position.");
      if (now() >= submission.placementDeadline) throw fail(410, "The replacement position window has expired.");
      validateUniquePlacement(point, draft.notes);
      const note = { ...submission.note, ...point, id: submission.id, createdAt: new Date(now()).toISOString(), needsReview: false };
      draft.notes.unshift(note);
      addAudit(events, note, "published-after-reposition");
      submission.state = "published";
      submission.tokenHash = null;
      draft.submissions = draft.submissions.filter((item) => item.id !== submission.id);
      return publicNote(note);
    });
  }
  async function createSignedIn({ text, displayName, position, showDate, author }) {
    const content = normalizeText(text);
    const name = normalizeName(displayName);
    const point = normalizePosition(position);
    return mutate((draft, events) => {
      expireAndApprove(draft, events);
      validateUniquePlacement(point, draft.notes);
      const note = { id: randomUUID(), text: content, displayName: name, showDate: showDate !== false, ...point, ownerKey: author.key, ownerUsername: author.username, createdAt: new Date(now()).toISOString(), needsReview: false, aiReview: { status: "pending", reason: "", severity: "none", checkedAt: null } };
      draft.notes.unshift(note);
      addAudit(events, note, "published");
      return publicNote(note, author.key);
    });
  }
  async function deleteNote(noteId, { authorKey = null, isModerator = false } = {}) {
    return mutate((draft, events) => {
      const index = draft.notes.findIndex((note) => note.id === noteId);
      if (index < 0) throw fail(404, "That note could not be found.");
      const note = draft.notes[index];
      if (!isModerator && (!authorKey || note.ownerKey !== authorKey)) throw fail(403, "You can only delete your own signed-in notes.");
      draft.notes.splice(index, 1);
      addAudit(events, note, isModerator ? "removed-by-host" : "deleted-by-author");
      return true;
    });
  }
  async function moderateSubmission(id, action) {
    return mutate((draft, events) => {
      expireAndApprove(draft, events);
      const submission = draft.submissions.find((item) => item.id === id);
      if (!submission) throw fail(404, "That submission is no longer pending.");
      if (action === "reject") {
        submission.state = "rejected";
        submission.tokenHash = null;
        addAudit(events, { ...submission.note }, "rejected-by-host");
        draft.submissions = draft.submissions.filter((item) => item.id !== id);
        return;
      }
      if (action !== "approve") throw fail(400, "Choose approve or reject.");
      const note = { ...submission.note, id: submission.id, createdAt: new Date(now()).toISOString(), needsReview: false };
      try {
        validateUniquePlacement(submission.position, draft.notes);
        Object.assign(note, submission.position);
        draft.notes.unshift(note);
        addAudit(events, note, "approved-and-published");
        submission.state = "published";
        submission.tokenHash = null;
        draft.submissions = draft.submissions.filter((item) => item.id !== id);
      } catch (error) {
        if (error.status !== 409) throw error;
        submission.state = "placement-required";
        submission.placementDeadline = now() + REPLACEMENT_WINDOW_MS;
        addAudit(events, note, "approved-position-required");
      }
    });
  }
  async function markReviewed(noteId) {
    await mutate((draft) => {
      const note = draft.notes.find((item) => item.id === noteId);
      if (!note) throw fail(404, "That note could not be found.");
      note.needsReview = false;
    });
  }
  async function listAiChecks() {
    await processDeadlines();
    const items = [];
    for (const submission of state.submissions) if (["pending", "unavailable"].includes(submission.aiReview?.status)) items.push({ itemType: "noteboard-submission", id: submission.id, text: submission.note.text });
    for (const note of state.notes) if (["pending", "unavailable"].includes(note.aiReview?.status)) items.push({ itemType: "noteboard-note", id: note.id, text: note.text });
    return items;
  }
  async function setAiReview({ itemType, id, expectedText, status, reason = "", severity = "none", checkedAt = null }) {
    return mutate((draft) => {
      const item = itemType === "noteboard-submission" ? draft.submissions.find((entry) => entry.id === id) : draft.notes.find((entry) => entry.id === id);
      const text = itemType === "noteboard-submission" ? item?.note.text : item?.text;
      if (!item || text !== expectedText) return false;
      item.aiReview = { status, reason: ["flagged", "unavailable"].includes(status) ? String(reason).slice(0, 500) : "", severity, checkedAt };
      return true;
    });
  }
  async function markAiReviewed(id, itemType) {
    return mutate((draft) => {
      const item = itemType === "noteboard-submission" ? draft.submissions.find((entry) => entry.id === id) : draft.notes.find((entry) => entry.id === id);
      if (!item || item.aiReview?.status !== "flagged") throw fail(404, "That AI-flagged note could not be found.");
      item.aiReview = { ...item.aiReview, status: "reviewed" };
    });
  }
  async function listForModeration() {
    await processDeadlines();
    return {
      notes: state.notes.map((note) => ({ ...moderationNote(note), aiReview: note.aiReview || { status: "not_checked", reason: "", severity: "none" } })),
      submissions: state.submissions.map((item) => ({ id: item.id, text: item.note.text, displayName: item.note.displayName, author: item.note.ownerUsername || "Guest", state: item.state, submittedAt: new Date(item.submittedAt).toISOString(), reviewDeadline: new Date(item.reviewDeadline).toISOString(), placementDeadline: item.placementDeadline ? new Date(item.placementDeadline).toISOString() : null, needsReview: item.needsReview, aiReview: item.aiReview || { status: "not_checked", reason: "", severity: "none" } })),
      audit: audit.map((item) => ({ ...item })),
    };
  }
  async function clearAudit() {
    await mutate((_draft, events) => { events.splice(0); });
  }

  async function clear() {
    await mutate((draft, events) => {
      draft.notes.splice(0);
      draft.submissions.splice(0);
      events.splice(0);
    });
  }

  return { load, list, submitGuest, getSubmission, replaceGuestPosition, validateCandidate, createSignedIn, deleteNote, moderateSubmission, markReviewed, markAiReviewed, listForModeration, listAiChecks, setAiReview, clearAudit, clear, processDeadlines };
}
