// Real HTTP and WebSocket clients against local Wrangler/workerd. Never cloud claims.
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
const port = 18787,
  base = process.env.TEST_ORIGIN || `http://127.0.0.1:${port}`;
let child, temp;
const logs = [];
const sockets = [];
const checks = [];
let timer;
function check(name, fn) {
  fn();
  checks.push(name);
  console.log("PASS " + name);
}
async function until(fn, ms = 12000) {
  const start = Date.now();
  while (Date.now() - start < ms) {
    const v = fn();
    if (v) return v;
    await delay(40);
  }
  throw Error("Timeout");
}
async function connect(code, auth) {
  const ws = new WebSocket(base.replace(/^http/, "ws") + "/ws/" + code),
    client = { ws, messages: [], snapshots: new Map(), latest: null };
  sockets.push(ws);
  ws.addEventListener("message", (e) => {
    const m = JSON.parse(e.data);
    client.messages.push(m);
    if (m.type === "snapshot") {
      let s = m.data;
      if (!m.full && client.latest) {
        s = { ...m.data };
        for (const key of ["enemies", "bullets", "hazards", "loot"]) {
          const map = new Map(client.latest[key].map((v) => [v.id, v]));
          for (const id of m.removed[key]) map.delete(id);
          for (const v of s[key]) map.set(v.id, v);
          s[key] = [...map.values()];
        }
      }
      client.latest = s;
      client.snapshots.set(s.tick, s);
    }
  });
  ws.addEventListener("error", () => {});
  await new Promise((res, rej) => {
    ws.addEventListener("open", res, { once: true });
    ws.addEventListener("error", () => rej(Error("WS handshake failed")), {
      once: true,
    });
  });
  ws.send(JSON.stringify({ type: "join", ...auth }));
  return client;
}
const send = (c, m) => c.ws.send(JSON.stringify(m));
try {
  if (!process.env.TEST_ORIGIN) {
    temp = await mkdtemp(new URL("../.test-state-", import.meta.url).pathname);
    child = spawn(
      process.execPath,
      [
        ...process.execArgv,
        "node_modules/wrangler/wrangler-dist/cli.js",
        "dev",
        "--ip",
        "127.0.0.1",
        "--port",
        String(port),
        "--persist-to",
        temp,
      ],
      {
        cwd: new URL("..", import.meta.url),
        stdio: ["ignore", "pipe", "pipe"],
        env: { ...process.env, WRANGLER_SEND_METRICS: "false" },
      },
    );
    child.stdout.on("data", (d) => logs.push(d.toString()));
    child.stderr.on("data", (d) => logs.push(d.toString()));
    await until(() => logs.join("").includes("Ready on"), 90000);
  }
  const health = await fetch(base + "/api/health").then((r) => r.json());
  check("health responds with authoritative server", () =>
    assert(health.serverAuthoritative),
  );
  const html = await fetch(base).then((r) => r.text());
  check("single HTML served same origin", () =>
    assert(html.includes("LAST BOND")),
  );
  const response = await fetch(base + "/api/rooms", { method: "POST" });
  assert.equal(response.status, 201);
  const created = await response.json();
  check("crypto six-character code + private founder token", () => {
    assert.match(created.code, /^[A-HJ-NP-Z2-9]{6}$/);
    assert(created.token.length >= 32);
  });
  const a = await connect(created.code, {
    name: "Test A",
    id: created.id,
    token: created.token,
  });
  await until(() => a.messages.find((m) => m.type === "room_joined"));
  const b = await connect(created.code, { name: "Test B" });
  const joined = await until(() =>
    b.messages.find((m) => m.type === "room_joined"),
  );
  check("two authenticated player slots", () =>
    assert.notEqual(joined.id, created.id),
  );
  await delay(11000);
  check("idle lobby has no simulation loop or ticking broadcasts", () => {
    assert.equal(a.latest.tick, 0);
    assert.equal(b.latest.tick, 0);
    assert(
      !a.messages.filter((m) => m.type === "snapshot").at(-1).metrics
        .loopActive,
    );
  });
  const extra = await connect(created.code, { name: "Third" });
  const full = await until(() =>
    extra.messages.find((m) => m.type === "error"),
  );
  check("third player receives room-full error", () =>
    assert.match(full.message, /dolu/),
  );
  send(a, { type: "select_character", cls: "storm" });
  send(b, { type: "select_character", cls: "alchemist" });
  await delay(100);
  send(a, { type: "ready", value: true });
  send(b, { type: "ready", value: true });
  await until(
    () => a.latest?.state === "PLAYING" && b.latest?.state === "PLAYING",
  );
  check("both start on server countdown", () =>
    assert(a.latest.players.every((p) => p.connected)),
  );
  const initial = a.latest.players.find((p) => p.id === created.id).x;
  let seq = a.latest.players.find((p) => p.id === created.id).seq + 1;
  timer = setInterval(() => {
    if (a.ws.readyState === 1)
      send(a, { type: "input", seq: seq++, x: 1, y: 0, f: false });
  }, 100);
  await delay(1400);
  clearInterval(timer);
  timer = null;
  send(a, { type: "input", seq: seq++, x: 0, y: 0, f: false });
  await delay(300);
  check("server simulates normalized movement", () =>
    assert(a.latest.players.find((p) => p.id === created.id).x > initial + 200),
  );
  let common;
  for (const tick of [...a.snapshots.keys()].reverse())
    if (tick > 10 && b.snapshots.has(tick)) {
      common = tick;
      break;
    }
  check("two clients agree exactly on same server tick and enemies", () => {
    assert(common);
    const sa = a.snapshots.get(common),
      sb = b.snapshots.get(common);
    assert.deepEqual(sa.players, sb.players);
    assert.deepEqual(sa.enemies, sb.enemies);
    assert(sa.enemies.length > 0);
  });
  send(a, { type: "input", seq: seq - 2, x: -1, y: 0, f: false });
  send(a, { type: "input", seq: seq++, x: 0, y: 0, f: false, hp: 999999 });
  await delay(150);
  check("tampered HP rejected by strict schema", () =>
    assert(
      a.messages.some((m) => m.type === "error" && /alan/.test(m.message)),
    ),
  );
  check("private tokens never exposed to teammate snapshots or lobby", () => {
    for (const m of b.messages.filter((m) => m.type !== "room_joined"))
      assert(!JSON.stringify(m).includes(created.token));
  });
  a.ws.close();
  await delay(200);
  const re = await connect(created.code, {
    name: "Test A",
    id: created.id,
    token: created.token,
  });
  const returned = await until(() =>
    re.messages.find((m) => m.type === "room_joined"),
  );
  check("secure reconnect restores original slot and sequence", () => {
    assert.equal(returned.id, created.id);
    assert(returned.seq >= 0);
    assert.equal(re.latest.players.length, 2);
  });
  const forged = await connect(created.code, {
    id: created.id,
    token: "0".repeat(48),
    name: "Forgery",
  });
  const denial = await until(() =>
    forged.messages.find((m) => m.type === "error"),
  );
  check("wrong reconnect token cannot replace owner", () =>
    assert.match(denial.message, /geçersiz/),
  );
  const second = await fetch(base + "/api/rooms", { method: "POST" });
  assert.equal(second.status, 201);
  const third = await fetch(base + "/api/rooms", { method: "POST" });
  assert.equal(third.status, 201);
  const limited = await fetch(base + "/api/rooms", { method: "POST" });
  check("global room admission capped at 3", () =>
    assert.equal(limited.status, 429),
  );
  console.log(
    JSON.stringify({
      environment: base.includes("127.0.0.1")
        ? "local Wrangler/workerd HTTP + actual WebSocket 101"
        : "remote HTTP + WebSocket",
      checks: checks.length,
      passed: true,
    }),
  );
} catch (e) {
  console.error(e.stack);
  if (child) console.error(logs.join("").slice(-4000));
  process.exitCode = 1;
} finally {
  clearInterval(timer);
  for (const ws of sockets)
    try {
      ws.close();
    } catch {}
  if (child) {
    child.kill("SIGTERM");
    await delay(400);
    if (!child.killed) child.kill("SIGKILL");
  }
  if (temp) await rm(temp, { recursive: true, force: true });
}
