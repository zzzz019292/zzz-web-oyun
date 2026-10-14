import { test } from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readFile } from "node:fs/promises";
import { Game } from "../engine.js";
// Inject only the Cloudflare base class for lifecycle tests. SQL is real SQLite;
// WebSocket transport is independently checked in network.mjs with workerd.
let source = await readFile(new URL("../worker.js", import.meta.url), "utf8");
source = source.replace(
  /import\s*\{\s*DurableObject\s*\}\s*from\s*["\x27]cloudflare:workers["\x27];?/,
  "class DurableObject { constructor(ctx,env){this.ctx=ctx;this.env=env;} }",
);
source = source
  .replace(
    /["\x27]\.\/engine\.js["\x27]/,
    JSON.stringify(new URL("../engine.js", import.meta.url).href),
  )
  .replace(
    /["\x27]\.\/protocol\.js["\x27]/,
    JSON.stringify(new URL("../protocol.js", import.meta.url).href),
  );
const { GameRoom, RoomDirectory } = await import(
  "data:text/javascript;base64," + Buffer.from(source).toString("base64")
);
class Socket {
  constructor(a = {}) {
    this.readyState = 1;
    this.attachment = a;
    this.messages = [];
  }
  serializeAttachment(a) {
    this.attachment = structuredClone(a);
  }
  deserializeAttachment() {
    return structuredClone(this.attachment);
  }
  send(raw) {
    this.messages.push(JSON.parse(raw));
  }
  close(code, reason) {
    this.readyState = 3;
    this.closed = { code, reason };
  }
}
function context(db = new DatabaseSync(":memory:")) {
  const ctx = {
    db,
    sockets: [],
    alarmAt: null,
    pending: [],
    getWebSockets() {
      return this.sockets.filter((s) => s.readyState === 1);
    },
    blockConcurrencyWhile(fn) {
      this.ready = fn();
    },
    waitUntil(p) {
      this.pending.push(p);
    },
    storage: {
      sql: {
        exec(query, ...args) {
          const st = db.prepare(query);
          return st.columns().length ? st.all(...args) : (st.run(...args), []);
        },
      },
      async setAlarm(t) {
        ctx.alarmAt = t;
      },
      async deleteAlarm() {
        ctx.alarmAt = null;
      },
    },
  };
  return ctx;
}
const env = {
  MAX_ACTIVE_ROOMS: "3",
  MAX_NEW_ROOMS_PER_DAY: "40",
  RECONNECT_GRACE_SECONDS: "30",
  DIRECTORY: {
    getByName() {
      return { fetch: async () => Response.json({ ok: true }) };
    },
  },
  ROOMS: {
    getByName() {
      return { fetch: async () => Response.json({ ok: true }) };
    },
  },
};
async function room() {
  const ctx = context(),
    r = new GameRoom(ctx, env);
  await ctx.ready;
  await r.fetch(
    new Request("https://internal/init", {
      method: "POST",
      body: JSON.stringify({
        code: "ABC234",
        expires: Date.now() + 300000,
        id: "a",
        hash: "owner-hash",
      }),
    }),
  );
  return { ctx, r };
}
function attach(ctx, r, id) {
  const s = new Socket({
    id,
    createdAt: Date.now(),
    window: Date.now(),
    count: 0,
    seq: 0,
  });
  ctx.sockets.push(s);
  r.sockets.set(id, s);
  const p = r.game.players.find((p) => p.id === id);
  p.connected = true;
  return s;
}
test("lobby and terminal game never keep a repeating simulation timer", async () => {
  const { ctx, r } = await room();
  const a = attach(ctx, r, "a");
  r.ensureLoop();
  assert.equal(r.loop, null);
  r.game.addPlayer("b", "B");
  r.sessions.push({ id: "b", hash: "b", disconnectAt: null });
  attach(ctx, r, "b");
  r.game.start();
  r.ensureLoop();
  const loop = r.loop;
  r.ensureLoop();
  assert.equal(r.loop, loop);
  assert(loop);
  r.game.end(false);
  r.finish();
  assert.equal(r.loop, null);
  await Promise.all(ctx.pending);
  assert(ctx.alarmAt > Date.now());
  assert(a.messages.some((m) => m.type === "snapshot"));
});
test("upgrade stops loop, stores checkpoint, auto resolves on a single low frequency alarm", async () => {
  const { ctx, r } = await room();
  attach(ctx, r, "a");
  r.game.addPlayer("b", "B");
  attach(ctx, r, "b");
  r.game.start();
  r.ensureLoop();
  r.game.beginOffer("normal");
  r.pulse();
  assert.equal(r.loop, null);
  assert.equal(r.game.state, "UPGRADE_SELECTION");
  assert(r.meta.deadline > Date.now());
  await Promise.all(ctx.pending);
  assert.equal(ctx.alarmAt, r.meta.deadline);
  r.meta.deadline = Date.now() - 1;
  await r.alarm();
  assert.equal(r.game.state, "PLAYING");
  assert(r.loop);
  r.stopLoop();
});
test("last socket disconnect clears interval; reconnect identity restored from SQLite + attachments", async () => {
  const { ctx, r } = await room();
  const a = attach(ctx, r, "a");
  r.game.start();
  r.ensureLoop();
  assert(r.loop);
  a.readyState = 3;
  await r.webSocketClose(a);
  assert.equal(r.loop, null);
  assert(!r.game.players[0].connected);
  assert(r.sessions[0].disconnectAt);
  a.readyState = 1;
  a.serializeAttachment({ ...a.deserializeAttachment(), seq: 88 });
  r.game.seq = 0;
  r.save();
  const restored = new GameRoom(ctx, env);
  await ctx.ready;
  assert.equal(restored.game.players[0].seq, 88);
  assert(restored.game.players[0].connected);
  assert.equal(restored.sessions[0].disconnectAt, null);
  assert(restored.loop);
  restored.stopLoop();
});
test("expired room deletes checkpoint, cancels alarm and closes sockets", async () => {
  const { ctx, r } = await room();
  const a = attach(ctx, r, "a");
  r.meta.expires = Date.now() - 1;
  await r.alarm();
  assert.equal(r.game, null);
  assert.equal(r.loop, null);
  assert.equal(ctx.alarmAt, null);
  assert.equal(a.readyState, 3);
  assert.equal([...ctx.storage.sql.exec("SELECT * FROM checkpoint")].length, 0);
});
test("expired disconnect grace ends game rather than creating an unrestricted bot", async () => {
  const { ctx, r } = await room();
  r.game.addPlayer("b", "B");
  attach(ctx, r, "b");
  r.game.start();
  r.sessions[0].disconnectAt = Date.now() - 31000;
  await r.alarm();
  assert.equal(r.game.state, "GAME_OVER");
  assert.equal(r.loop, null);
  assert(r.sessions[0].expired);
});
test("malformed messages are rejected without HP mutation and socket is closed after 3", async () => {
  const { ctx, r } = await room();
  const a = attach(ctx, r, "a");
  const hp = r.game.players[0].hp;
  for (let i = 0; i < 3; i++)
    await r.webSocketMessage(a, '{"type":"input","hp":100000}');
  assert.equal(r.game.players[0].hp, hp);
  assert.equal(a.closed.code, 1008);
});
test("directory reserves room codes before async work; concurrent creates cannot exceed cap", async () => {
  const ctx = context(),
    d = new RoomDirectory(ctx, env);
  const responses = await Promise.all(
    Array.from({ length: 12 }, () =>
      d.fetch(new Request("https://internal/create", { method: "POST" })),
    ),
  );
  const codes = [];
  for (const r of responses)
    if (r.status === 201) codes.push((await r.json()).code);
  assert.equal(codes.length, 3);
  assert.equal(new Set(codes).size, 3);
  assert.equal(responses.filter((r) => r.status === 429).length, 9);
  const count = [
    ...ctx.storage.sql.exec("SELECT SUM(count) AS n FROM daily"),
  ][0].n;
  assert.equal(count, 3);
});
test("directory alarm expires records and cancels itself when no rooms remain", async () => {
  const ctx = context(),
    d = new RoomDirectory(ctx, env);
  ctx.storage.sql.exec(
    "INSERT INTO rooms VALUES (?,?)",
    "ABC234",
    Date.now() - 1,
  );
  await d.alarm();
  assert.equal([...ctx.storage.sql.exec("SELECT * FROM rooms")].length, 0);
  assert.equal(ctx.alarmAt, null);
});

test("explicit leave ends active game immediately; it never leaves an unbounded bot", async () => {
  const { ctx, r } = await room();
  const a = attach(ctx, r, "a");
  r.game.addPlayer("b", "B");
  attach(ctx, r, "b");
  r.game.start();
  r.ensureLoop();
  await r.webSocketMessage(a, JSON.stringify({ type: "leave" }));
  assert.equal(r.game.state, "GAME_OVER");
  assert.equal(r.loop, null);
  await Promise.all(ctx.pending);
});
test("two rematch votes reset build and preserve replay/offer monotonic identifiers", async () => {
  const { ctx, r } = await room();
  const a = attach(ctx, r, "a");
  r.game.addPlayer("b", "B", "storm");
  const b = attach(ctx, r, "b");
  r.game.players[0].weapons = { lightning: 5, ice: 5 };
  r.game.players[0].seq = 91;
  r.game.offerRevision = 4;
  r.game.id = 1234;
  r.game.end(false);
  r.finish();
  await r.webSocketMessage(a, JSON.stringify({ type: "replay" }));
  assert.equal(r.game.state, "GAME_OVER");
  await r.webSocketMessage(b, JSON.stringify({ type: "replay" }));
  assert.equal(r.game.state, "LOBBY");
  assert.equal(r.loop, null);
  assert.deepEqual(r.game.players[0].weapons, { shield: 1 });
  assert.equal(r.game.players[0].seq, 91);
  assert.equal(r.game.offerRevision, 4);
  assert(r.game.id >= 1234);
  await Promise.all(ctx.pending);
});
test("simultaneous joining of last slot admits exactly one session and gives room-full to other", async () => {
  const { ctx, r } = await room();
  const make = () =>
    new Socket({
      id: null,
      createdAt: Date.now(),
      window: Date.now(),
      count: 0,
      seq: -1,
    });
  const a = make(),
    b = make();
  ctx.sockets.push(a, b);
  await Promise.all([
    r.webSocketMessage(a, JSON.stringify({ type: "join", name: "A" })),
    r.webSocketMessage(b, JSON.stringify({ type: "join", name: "B" })),
  ]);
  assert.equal(r.game.players.length, 2);
  assert.equal(r.sessions.length, 2);
  assert.equal(
    [...a.messages, ...b.messages].filter((m) => m.type === "room_joined")
      .length,
    1,
  );
  assert(
    [...a.messages, ...b.messages].some(
      (m) => m.type === "error" && m.message.includes("dolu"),
    ),
  );
});

test("frozen production clock uses timer credits without double-counting on next I/O", async () => {
  const { ctx, r } = await room();
  attach(ctx, r, "a");
  r.game.start();
  r.game.spawnAt = 9999;
  r.game.eliteAt = 9999;
  const original = performance.now;
  let wall = 100;
  performance.now = () => wall;
  try {
    r.ensureLoop();
    for (let i = 0; i < 8; i++) r.pulse();
    assert.equal(r.game.tick, 8);
    wall += 400;
    r.pulse();
    assert.equal(r.game.tick, 8);
    wall += 50;
    r.pulse();
    assert.equal(r.game.tick, 9);
  } finally {
    r.stopLoop();
    performance.now = original;
  }
});
