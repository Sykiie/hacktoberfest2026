import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { AI_BATCH_RESPONSE_TIMEOUT_MS, classifyBatch, classifyText, createAiSettingsStore, normalizeProviderSettings, publicProviderSettings } from "../server/ai-moderation.js";

test("batch classifier applies the 60-second default timeout and aborts overdue requests", async () => {
  assert.equal(AI_BATCH_RESPONSE_TIMEOUT_MS, 60000);
  const settings = { provider: "openai-compatible", baseUrl: "https://api.example.com/v1", model: "test", apiKey: "secret" };
  await assert.rejects(classifyBatch(settings, [{ id: "1", text: "content" }], async (_url, options) => new Promise((_resolve, reject) => {
    options.signal.addEventListener("abort", () => reject(Object.assign(new Error("Request aborted"), { name: "AbortError" })), { once: true });
  }), 15), { name: "AbortError" });
});

test("provider configuration requires credentials for cloud and keeps secrets out of public settings", () => {
  assert.throws(() => normalizeProviderSettings({ provider: "openai-compatible", baseUrl: "https://api.example.com/v1", model: "m" }), /API key/);
  const settings = normalizeProviderSettings({ provider: "openai-compatible", baseUrl: "https://api.example.com/v1", model: "m", apiKey: "secret" });
  assert.equal(publicProviderSettings(settings).apiKey, undefined);
  assert.equal(publicProviderSettings(settings).hasApiKey, true);
  assert.throws(() => normalizeProviderSettings({ provider: "ollama", baseUrl: "https://remote.example.com", model: "gemma" }), /localhost/);
});

test("settings persistence masks keys and allows preserving a saved key", async (t) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "ai-settings-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const file = path.join(directory, "settings.json");
  const store = createAiSettingsStore(file);
  await store.load();
  await store.save({ provider: "openai-compatible", baseUrl: "https://api.example.com/v1", model: "test", apiKey: "secret" });
  const saved = await store.save({ provider: "openai-compatible", baseUrl: "https://api.example.com/v1", model: "test", keepExistingKey: true });
  assert.equal(saved.hasApiKey, true);
  assert.equal(JSON.parse(await readFile(file, "utf8")).apiKey, "secret");
});

test("classifier validates provider responses and reports flagged reasons", async () => {
  const settings = { provider: "openai-compatible", baseUrl: "https://api.example.com/v1", model: "test", apiKey: "secret" };
  const fetchMock = async (_url, options) => {
    assert.match(options.headers.Authorization, /secret/);
    return { ok: true, json: async () => ({ choices: [{ message: { content: JSON.stringify({ flagged: true, severity: "high", reason: "scam" }) } }] }) };
  };
  assert.deepEqual(await classifyText(settings, "content", fetchMock), { flagged: true, severity: "high", reason: "scam" });
});

test("classifier rubric explicitly covers profanity and severity", async () => {
  const settings = { provider: "openai-compatible", baseUrl: "https://openrouter.ai/api/v1", model: "test", apiKey: "secret" };
  let prompt;
  const result = await classifyText(settings, "fuck this", async (_url, options) => {
    prompt = JSON.parse(options.body).messages[0].content;
    return { ok: true, json: async () => ({ choices: [{ message: { content: JSON.stringify({ flagged: true, severity: "medium", reason: "Profanity" }) } }] }) };
  });
  assert.match(prompt, /Flag profanity/i);
  assert.deepEqual(result, { flagged: true, severity: "medium", reason: "Profanity" });
});

test("OpenAI-compatible requests omit optional JSON mode and surface provider diagnostics", async () => {
  const settings = { provider: "openai-compatible", baseUrl: "https://openrouter.ai/api/v1", model: "vendor/model", apiKey: "secret" };
  let requestedUrl;
  await assert.rejects(classifyText(settings, "content", async (url, options) => {
    requestedUrl = url;
    assert.equal(JSON.parse(options.body).response_format, undefined);
    return { ok: false, status: 401, json: async () => ({ error: { message: "Invalid API key" } }) };
  }), /Invalid API key/);
  assert.equal(requestedUrl, "https://openrouter.ai/api/v1/chat/completions");
});

test("provider diagnostics include raw text responses but redact credentials", async () => {
  const settings = { provider: "openai-compatible", baseUrl: "https://openrouter.ai/api/v1", model: "google/gemma-4-26b-a4b-it:free", apiKey: "sk-or-v1-secretsecretsecret" };
  await assert.rejects(classifyText(settings, "content", async () => ({
    ok: false,
    status: 502,
    text: async () => JSON.stringify({ error: { message: "Provider returned error", code: "upstream_error", detail: "key sk-or-v1-secretsecretsecret" } }),
  })), (error) => {
    assert.match(error.message, /HTTP 502/);
    assert.match(error.message, /upstream_error/);
    assert.doesNotMatch(error.message, /sk-or-v1-secretsecretsecret/);
    return true;
  });
});

test("429 provider response explains rate limiting", async () => {
  const settings = { provider: "openai-compatible", baseUrl: "https://openrouter.ai/api/v1", model: "test", apiKey: "secret" };
  await assert.rejects(classifyText(settings, "content", async () => ({ ok: false, status: 429, json: async () => ({ error: "Provider returned error" }) })), /rate limit or model quota/);
});

test("classifier accepts JSON wrapped in markdown fences or surrounding prose", async () => {
  const settings = { provider: "openai-compatible", baseUrl: "https://openrouter.ai/api/v1", model: "google/gemma-4-26b-a4b-it:free", apiKey: "secret" };
  for (const content of ['```json\n{"flagged":false,"reason":""}\n```', 'Result:\n{"flagged":true,"reason":"scam"}\nDone.']) {
    const result = await classifyText(settings, "content", async () => ({ ok: true, json: async () => ({ choices: [{ finish_reason: "stop", message: { content } }] }) }));
    assert.equal(typeof result.flagged, "boolean");
  }
});
