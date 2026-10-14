import { DurableObject } from "cloudflare:workers";
import { Game, B, CLASSES } from "./engine.js";
import { parseMessage, deltaSnapshot } from "./protocol.js";
const VERSION = "1.0.0";
const num = (env, k, d) => Math.max(1, Math.min(10000, Number(env[k]) || d));
const json = (data, status = 200, headers = {}) =>
  Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store", ...headers },
  });
const randomToken = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(24)), (v) =>
    v.toString(16).padStart(2, "0"),
  ).join("");
const digest = async (value) =>
  Array.from(
    new Uint8Array(
      await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)),
    ),
    (v) => v.toString(16).padStart(2, "0"),
  ).join("");
const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function randomCode() {
  let code = "";
  while (code.length < 6)
    for (const n of crypto.getRandomValues(new Uint8Array(12))) {
      if (n >= Math.floor(256 / alphabet.length) * alphabet.length) continue;
      code += alphabet[n % alphabet.length];
      if (code.length === 6) break;
    }
  return code;
}
function originAllowed(req, env) {
  const origin = req.headers.get("Origin");
  return (
    !origin ||
    origin === new URL(req.url).origin ||
    (origin === "null" && env.ALLOW_FILE_ORIGIN === "true")
  );
}
export default {
  async fetch(req, env) {
    const u = new URL(req.url),
      origin = req.headers.get("Origin"),
      cors =
        origin === "null" && env.ALLOW_FILE_ORIGIN === "true"
          ? { "Access-Control-Allow-Origin": "null" }
          : {};
    try {
      if (!originAllowed(req, env))
        return json({ error: "Bu origin için izin yok." }, 403);
      if (req.method === "OPTIONS" && u.pathname.startsWith("/api/"))
        return new Response(null, {
          status: 204,
          headers: {
            ...cors,
            "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
          },
        });
      if (u.pathname === "/api/health" && req.method === "GET")
        return json(
          {
            ok: true,
            version: VERSION,
            platform: "Cloudflare SQLite Durable Objects",
            serverAuthoritative: true,
          },
          200,
          cors,
        );
      if (u.pathname === "/api/rooms" && req.method === "POST") {
        if (Number(req.headers.get("Content-Length") || 0) > 128)
          return json({ error: "İstek çok büyük." }, 413, cors);
        const response = await env.DIRECTORY.getByName("global").fetch(
          "https://internal/create",
          { method: "POST" },
        );
        return new Response(response.body, {
          status: response.status,
          headers: { ...Object.fromEntries(response.headers), ...cors },
        });
      }
      const match = u.pathname.match(/^\/ws\/([A-HJ-NP-Z2-9]{6})$/);
      if (match && req.method === "GET") {
        if (req.headers.get("Upgrade")?.toLowerCase() !== "websocket")
          return json({ error: "WebSocket Upgrade gerekli." }, 426);
        const code = match[1],
          valid = await env.DIRECTORY.getByName("global").fetch(
            `https://internal/resolve/${code}`,
          );
        if (!valid.ok) return valid;
        return env.ROOMS.getByName(code).fetch(req);
      }
      if (u.pathname.startsWith("/api/") || u.pathname.startsWith("/ws/"))
        return json({ error: "Oda veya endpoint bulunamadı." }, 404, cors);
      return env.ASSETS.fetch(req);
    } catch {
      return json(
        {
          error:
            "Sunucu yoğun veya ücretsiz kota / kaynak limiti aşıldı. Biraz sonra yeniden deneyin.",
        },
        503,
        cors,
      );
    }
  },
};
export class RoomDirectory extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;
    this.sql.exec(
      "CREATE TABLE IF NOT EXISTS rooms(code TEXT PRIMARY KEY, expires INTEGER NOT NULL)",
    );
    this.sql.exec(
      "CREATE TABLE IF NOT EXISTS daily(day TEXT PRIMARY KEY, count INTEGER NOT NULL)",
    );
  }
  async fetch(req) {
    const u = new URL(req.url),
      now = Date.now();
    this.sql.exec("DELETE FROM rooms WHERE expires<=?", now);
    this.sql.exec(
      "DELETE FROM daily WHERE day<?",
      new Date(now - 86400000).toISOString().slice(0, 10),
    );
    if (u.pathname === "/create") {
      const day = new Date(now).toISOString().slice(0, 10),
        count =
          [...this.sql.exec("SELECT count FROM daily WHERE day=?", day)][0]
            ?.count || 0;
      if (count >= num(this.env, "MAX_NEW_ROOMS_PER_DAY", 40))
        return json(
          {
            error:
              "Günlük yeni oda koruması doldu. UTC gece yarısından sonra tekrar deneyin.",
          },
          429,
        );
      if (
        [...this.sql.exec("SELECT COUNT(*) AS n FROM rooms")][0].n >=
        num(this.env, "MAX_ACTIVE_ROOMS", 3)
      )
        return json(
          { error: "Sunucu yoğun: eşzamanlı oda sınırı doldu." },
          429,
        );
      let code;
      do {
        code = randomCode();
      } while (
        [...this.sql.exec("SELECT code FROM rooms WHERE code=?", code)].length
      );
      const expires = now + num(this.env, "LOBBY_TTL_MINUTES", 5) * 60000;
      this.sql.exec("INSERT INTO rooms VALUES (?,?)", code, expires);
      this.sql.exec(
        "INSERT INTO daily VALUES (?,1) ON CONFLICT(day) DO UPDATE SET count=count+1",
        day,
      );
      const id = crypto.randomUUID(),
        token = randomToken(),
        hash = await digest(token);
      try {
        const r = await this.env.ROOMS.getByName(code).fetch(
          "https://internal/init",
          { method: "POST", body: JSON.stringify({ code, expires, id, hash }) },
        );
        if (!r.ok) throw Error();
      } catch {
        this.sql.exec("DELETE FROM rooms WHERE code=?", code);
        return json(
          { error: "Oda başlatılamadı; kaynak limiti olasılığı." },
          503,
        );
      }
      await this.schedule();
      return json({ code, id, token, expires }, 201);
    }
    if (u.pathname.startsWith("/resolve/")) {
      const row = [
        ...this.sql.exec(
          "SELECT code FROM rooms WHERE code=?",
          u.pathname.split("/").at(-1),
        ),
      ][0];
      return row
        ? json({ ok: true })
        : json({ error: "Oda bulunamadı veya süresi doldu." }, 404);
    }
    if (u.pathname === "/lease") {
      const m = await req.json();
      this.sql.exec(
        "UPDATE rooms SET expires=? WHERE code=?",
        m.expires,
        m.code,
      );
      await this.schedule();
      return json({ ok: true });
    }
    if (u.pathname === "/release") {
      this.sql.exec("DELETE FROM rooms WHERE code=?", await req.text());
      await this.schedule();
      return json({ ok: true });
    }
    return json({ error: "Bilinmeyen işlem" }, 404);
  }
  async schedule() {
    const next = [...this.sql.exec("SELECT MIN(expires) AS t FROM rooms")][0]
      ?.t;
    if (next) await this.ctx.storage.setAlarm(next);
    else await this.ctx.storage.deleteAlarm();
  }
  async alarm() {
    this.sql.exec("DELETE FROM rooms WHERE expires<=?", Date.now());
    await this.schedule();
  }
}
export class GameRoom extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;
    this.sql.exec(
      "CREATE TABLE IF NOT EXISTS checkpoint(id INTEGER PRIMARY KEY CHECK(id=1), data TEXT NOT NULL)",
    );
    this.game = null;
    this.meta = null;
    this.sessions = [];
    this.sockets = new Map();
    this.loop = null;
    this.previous = null;
    this.revision = 0;
    this.lastSave = 0;
    this.lastSnapshot = 0;
    this.snapshotHz = Math.min(15, num(env, "SNAPSHOT_HZ", 10));
    this.costEMA = 0;
    this.lagEMA = 0;
    this.adaptAt = 0;
    this.clockCredit = 0;
    this.accumulator = 0;
    ctx.blockConcurrencyWhile(async () => {
      const row = [
        ...this.sql.exec("SELECT data FROM checkpoint WHERE id=1"),
      ][0];
      if (row) {
        const cp = JSON.parse(row.data);
        this.game = Game.restore(cp.game);
        this.meta = cp.meta;
        this.sessions = cp.sessions;
        this.revision = cp.revision || 0;
        for (const ws of ctx.getWebSockets()) {
          const a = ws.deserializeAttachment();
          if (a?.id) {
            const p = this.game.players.find((p) => p.id === a.id),
              s = this.sessions.find((s) => s.id === a.id);
            if (p && s && !s.expired) {
              this.sockets.set(a.id, ws);
              p.connected = true;
              p.seq = Math.max(p.seq, a.seq ?? -1);
              s.disconnectAt = null;
            }
          }
        }
        for (const p of this.game.players)
          if (!this.sockets.has(p.id)) {
            p.connected = false;
            const s = this.sessions.find((s) => s.id === p.id);
            if (s && !s.disconnectAt && this.game.state !== "LOBBY")
              s.disconnectAt = Date.now();
          }
        this.game.runtimeLostMs += Math.max(
          0,
          Date.now() - (cp.savedAt || Date.now()),
        );
        this.ensureLoop();
      }
    });
  }
  save() {
    if (!this.game) return;
    const cp = JSON.stringify({
      game: this.game.checkpoint(),
      meta: this.meta,
      sessions: this.sessions,
      revision: this.revision,
      savedAt: Date.now(),
    });
    this.sql.exec(
      "INSERT INTO checkpoint VALUES (1,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data",
      cp,
    );
    this.lastSave = Date.now();
  }
  async fetch(req) {
    const u = new URL(req.url);
    if (u.pathname === "/init" && req.method === "POST") {
      if (this.game) return json({ error: "Oda mevcut" }, 409);
      const m = await req.json();
      this.meta = {
        code: m.code,
        expires: m.expires,
        createdAt: Date.now(),
        pauseAt: 0,
        deadline: 0,
        ended: false,
      };
      this.game = new Game();
      this.game.enemyCap = Math.min(
        B.maxEnemies,
        num(this.env, "MAX_ENEMIES", 150),
      );
      const p = this.game.addPlayer(m.id, "Kurucu");
      p.connected = false;
      this.sessions = [
        { id: m.id, hash: m.hash, disconnectAt: null, expired: false },
      ];
      this.save();
      await this.schedule();
      return json({ ok: true });
    }
    if (!this.game || Date.now() >= this.meta.expires)
      return json({ error: "Oda süresi doldu." }, 404);
    if (req.headers.get("Upgrade")?.toLowerCase() !== "websocket")
      return json({ error: "Upgrade gerekli" }, 426);
    // Allow bounded unauthenticated sockets so a full room can still reconnect securely.
    if (this.ctx.getWebSockets().length >= 4)
      return json({ error: "Oda dolu veya bağlantı sınırı aşıldı." }, 409);
    const pair = new WebSocketPair(),
      [client, server] = Object.values(pair);
    this.ctx.acceptWebSocket(server);
    server.serializeAttachment({
      id: null,
      createdAt: Date.now(),
      window: Date.now(),
      count: 0,
      seq: -1,
      errors: 0,
    });
    await this.schedule();
    return new Response(null, { status: 101, webSocket: client });
  }
  send(ws, m) {
    try {
      if (ws.readyState === 1 && (Number(ws.bufferedAmount) || 0) < 256000)
        ws.send(JSON.stringify(m));
      else if ((Number(ws.bufferedAmount) || 0) >= 256000)
        ws.close(1013, "Ağ yavaş");
    } catch {}
  }
  broadcast(m) {
    for (const ws of this.sockets.values()) this.send(ws, m);
  }
  error(ws, message) {
    this.send(ws, { type: "error", message });
  }
  async webSocketMessage(ws, raw) {
    let a = ws.deserializeAttachment() || {},
      m;
    try {
      m = parseMessage(raw);
    } catch (e) {
      a.errors = (a.errors || 0) + 1;
      ws.serializeAttachment(a);
      this.error(ws, e.message);
      if (a.errors >= 3) ws.close(1008, "Mesaj doğrulama");
      return;
    }
    const now = Date.now();
    if (now - a.window >= 1000) {
      a.window = now;
      a.count = 0;
    }
    if (++a.count > 18) {
      ws.close(1008, "Komut sıklığı sınırı");
      return;
    }
    ws.serializeAttachment(a);
    try {
      await this.advanceDeadlines();
      if (
        !this.game ||
        (this.meta.ended &&
          m.type !== "replay" &&
          m.type !== "ping" &&
          m.type !== "join" &&
          m.type !== "leave")
      )
        return;
      if (!a.id) {
        if (m.type !== "join") {
          this.error(ws, "Önce oturum doğrulayın.");
          return;
        }
        if (now - a.createdAt > 10000) {
          ws.close(1008, "Oturum zaman aşımı");
          return;
        }
        let p, s, token;
        if (m.id || m.token) {
          s = this.sessions.find((s) => s.id === m.id);
          if (
            !s ||
            s.expired ||
            typeof m.token !== "string" ||
            s.hash !== (await digest(m.token))
          ) {
            this.error(ws, "Yeniden bağlanma kimliği geçersiz.");
            ws.close(1008, "Geçersiz token");
            return;
          }
          if (
            s.disconnectAt &&
            now - s.disconnectAt >
              num(this.env, "RECONNECT_GRACE_SECONDS", 30) * 1000 &&
            this.game.state !== "LOBBY"
          ) {
            this.error(ws, "Yeniden bağlanma süresi doldu.");
            ws.close(1008, "Süre doldu");
            return;
          }
          p = this.game.players.find((p) => p.id === s.id);
          token = m.token;
        } else {
          if (this.game.state !== "LOBBY") {
            this.error(
              ws,
              "Maç başlamış; yalnızca mevcut oturum geri dönebilir.",
            );
            ws.close(1008, "Maç başladı");
            return;
          }
          if (
            this.game.players.length >=
            Math.min(2, num(this.env, "MAX_PLAYERS_PER_ROOM", 2))
          ) {
            this.error(ws, "Oda dolu.");
            ws.close(1008, "Oda dolu");
            return;
          }
          token = randomToken();
          s = {
            id: crypto.randomUUID(),
            hash: null,
            disconnectAt: null,
            expired: false,
          };
          p = this.game.addPlayer(s.id, "Savaşçı");
          p.connected = false;
          this.sessions.push(s);
          s.hash = await digest(token);
        }
        const old = this.sockets.get(p.id);
        this.sockets.set(p.id, ws);
        if (old && old !== ws) old.close(1000, "Oturum yenilendi");
        p.connected = true;
        s.disconnectAt = null;
        p.input = { x: 0, y: 0, f: false };
        p.name =
          (m.name || p.name || "Savaşçı").trim().slice(0, 24) || "Savaşçı";
        a.id = p.id;
        a.seq = p.seq;
        ws.serializeAttachment(a);
        this.send(ws, {
          type: "room_joined",
          code: this.meta.code,
          id: p.id,
          token,
          seq: p.seq,
          catalog: { classes: CLASSES },
        });
        this.send(ws, {
          type: "snapshot",
          revision: ++this.revision,
          base: 0,
          serverTime: now,
          full: true,
          data: this.game.snapshot(),
          metrics: this.metrics(),
        });
        this.previous = null;
        this.save();
        this.lobby();
        if (this.game.state === "UPGRADE_SELECTION") this.offer(ws, p.id);
        this.ensureLoop();
        await this.schedule();
        return;
      }
      const p = this.game.players.find((p) => p.id === a.id);
      if (!p || this.sockets.get(a.id) !== ws) return;
      if (m.type === "ping") {
        this.send(ws, { type: "pong", time: m.time, serverTime: now });
        return;
      }
      if (m.type === "sync") {
        this.send(ws, {
          type: "snapshot",
          revision: ++this.revision,
          base: 0,
          serverTime: now,
          full: true,
          data: this.game.snapshot(),
          metrics: this.metrics(),
        });
        this.previous = null;
        return;
      }
      if (
        m.type === "input" &&
        ["PLAYING", "BOSS_FIGHT"].includes(this.game.state)
      ) {
        if (this.game.input(p.id, m)) {
          a.seq = p.seq;
          ws.serializeAttachment(a);
        }
        return;
      }
      if (m.type === "select_character" && this.game.state === "LOBBY") {
        if (!CLASSES[m.cls]) {
          this.error(ws, "Sınıf bulunamadı.");
          return;
        }
        this.game.configure(p, m.cls);
        p.ready = false;
        this.save();
        this.lobby();
      }
      if (m.type === "ready" && this.game.state === "LOBBY") {
        p.ready = m.value;
        this.save();
        this.lobby();
        if (
          this.game.players.length === 2 &&
          this.game.players.every((p) => p.ready && p.connected)
        ) {
          this.game.state = "COUNTDOWN";
          this.meta.deadline = now + 3000;
          this.meta.expires = now + 30 * 60000;
          this.meta.pauseAt = now;
          await this.lease();
          this.save();
          this.lobby();
        }
      }
      if (
        m.type.startsWith("choose_") &&
        this.game.state === "UPGRADE_SELECTION"
      ) {
        if (
          (this.game.offerKind === "bond") !==
          (m.type === "choose_bond_card")
        ) {
          this.error(ws, "Yanlış seçim türü.");
          return;
        }
        if (this.game.choose(p.id, m.index, m.revision)) {
          this.send(ws, {
            type: "choice_ack",
            revision: m.revision,
            index: m.index,
          });
          if (
            this.game.players.every(
              (p) => this.game.choices[p.id] !== undefined,
            )
          )
            this.resume();
          this.save();
        } else this.error(ws, "Seçim eski, tekrarlanmış veya geçersiz.");
      }
      if (
        m.type === "replay" &&
        ["GAME_OVER", "VICTORY"].includes(this.game.state)
      ) {
        p.rematch = true;
        this.lobby();
        if (this.game.players.every((p) => p.rematch && p.connected)) {
          const old = this.game;
          this.game = new Game();
          this.game.id = old.id;
          this.game.offerRevision = old.offerRevision;
          this.game.enemyCap = Math.min(
            B.maxEnemies,
            num(this.env, "MAX_ENEMIES", 150),
          );
          for (const v of old.players) {
            const n = this.game.addPlayer(v.id, v.name, v.cls);
            n.connected = true;
            n.seq = v.seq;
          }
          this.meta.ended = false;
          this.meta.deadline = 0;
          this.meta.expires =
            now + num(this.env, "LOBBY_TTL_MINUTES", 5) * 60000;
          this.previous = null;
          await this.lease();
          this.save();
          this.publish(true);
          this.lobby();
        }
      }
      if (m.type === "leave") {
        const s = this.sessions.find((s) => s.id === p.id);
        if (s) s.expired = true;
        if (["LOBBY", "COUNTDOWN"].includes(this.game.state)) {
          await this.destroy("Oyuncu lobiden ayrıldı.");
          return;
        }
        if (
          ["PLAYING", "BOSS_FIGHT", "UPGRADE_SELECTION"].includes(
            this.game.state,
          )
        ) {
          this.game.end(false);
          this.game.event("disconnect", "Bir oyuncu odadan ayrıldı.");
          this.finish();
        }
        ws.close(1000, "Odadan ayrıldı");
      }
      await this.schedule();
    } catch {
      this.error(ws, "Sunucu kaynak limiti veya geçici işlem hatası.");
      this.stopLoop();
    }
  }
  lobby() {
    if (!this.game) return;
    this.broadcast({
      type: "lobby_update",
      state: this.game.state,
      deadline: this.meta.deadline,
      expires: this.meta.expires,
      players: this.game.players.map((p) => ({
        id: p.id,
        name: p.name,
        cls: p.cls,
        ready: p.ready,
        connected: p.connected,
        rematch: !!p.rematch,
      })),
    });
  }
  offer(ws, id) {
    this.send(ws, {
      type:
        this.game.offerKind === "bond" ? "team_upgrade_offer" : "upgrade_offer",
      kind: this.game.offerKind,
      revision: this.game.offerRevision,
      deadline: this.meta.deadline,
      cards: this.game.offers[id],
      chosen: this.game.choices[id] !== undefined,
    });
  }
  resume() {
    if (this.game.state !== "UPGRADE_SELECTION") return;
    this.game.resolveOffer();
    this.game.pausedMs += Date.now() - this.meta.pauseAt;
    this.meta.pauseAt = 0;
    this.meta.deadline = 0;
    this.previous = null;
    this.publish(true);
    this.ensureLoop();
  }
  ensureLoop() {
    if (
      this.loop ||
      !this.game ||
      !["PLAYING", "BOSS_FIGHT"].includes(this.game.state) ||
      !this.sockets.size
    )
      return;
    this.lastMono = performance.now();
    this.clockCredit = 0;
    this.accumulator = 0;
    this.loop = setInterval(() => this.pulse(), 50);
  }
  stopLoop() {
    if (this.loop) {
      clearInterval(this.loop);
      this.loop = null;
    }
    this.accumulator = 0;
  }
  pulse() {
    const start = performance.now(),
      now = Date.now();
    try {
      if (now >= this.meta.expires) {
        this.stopLoop();
        this.ctx.waitUntil(this.destroy());
        return;
      }
      // Deployed Workers clocks can freeze between I/O events. Track timer
      // steps credited during a frozen clock so the next I/O does not double-count.
      const observed = Math.max(0, start - this.lastMono);
      let delta;
      if (observed > 0) {
        delta = Math.max(0, observed - this.clockCredit);
        this.clockCredit = 0;
        this.lastMono = start;
      } else {
        delta = 50;
        this.clockCredit += 50;
      }
      this.lagEMA = this.lagEMA * 0.95 + Math.max(0, delta - 50) * 0.05;
      this.accumulator += Math.min(delta, 250);
      if (delta > 250) this.game.runtimeLostMs += delta - 250;
      let steps = 0;
      while (this.accumulator >= 50 && steps++ < 4) {
        this.accumulator -= 50;
        this.game.step(B.tick);
        if (!["PLAYING", "BOSS_FIGHT"].includes(this.game.state)) break;
      }
      if (this.accumulator > 200) {
        this.game.runtimeLostMs += this.accumulator;
        this.accumulator = 0;
      }
      this.costEMA = this.costEMA * 0.95 + (performance.now() - start) * 0.05;
      if (
        (this.costEMA > 12 || this.lagEMA > 20) &&
        this.game.enemyCap > 60 &&
        now >= this.adaptAt
      ) {
        this.adaptAt = now + 2000;
        this.game.enemyCap = Math.max(60, this.game.enemyCap - 10);
        this.snapshotHz = Math.max(5, this.snapshotHz - 1);
        this.game.event(
          "performance",
          `Yük koruması: düşman sınırı ${this.game.enemyCap}, yayın ${this.snapshotHz} Hz.`,
        );
      }
      if (this.game.state === "UPGRADE_SELECTION") {
        this.stopLoop();
        this.meta.pauseAt = now;
        this.meta.deadline = now + B.upgradeSeconds * 1000;
        this.save();
        this.publish(true);
        for (const [id, ws] of this.sockets) this.offer(ws, id);
        this.ctx.waitUntil(this.schedule());
      } else if (["GAME_OVER", "VICTORY"].includes(this.game.state)) {
        this.finish();
      } else if (now - this.lastSnapshot >= 1000 / this.snapshotHz)
        this.publish();
      if (now - this.lastSave >= 20000) this.save();
      // Disconnected sessions get bounded protective movement, then the match ends.
      for (const s of this.sessions)
        if (
          s.disconnectAt &&
          !s.expired &&
          now - s.disconnectAt >=
            num(this.env, "RECONNECT_GRACE_SECONDS", 30) * 1000
        ) {
          s.expired = true;
          this.game.end(false);
          this.game.event(
            "disconnect",
            "Bir oyuncunun geri dönüş süresi doldu.",
          );
          this.finish();
          break;
        }
    } catch {
      this.stopLoop();
      this.broadcast({
        type: "error",
        message:
          "Simülasyon durdu: ücretsiz kaynak limiti veya sunucu hatası. Yeniden bağlanmayı deneyin.",
      });
    }
  }
  metrics() {
    return {
      tickHz: 20,
      snapshotHz: this.snapshotHz,
      simulationMs: Math.round(this.costEMA * 100) / 100,
      timerLagMs: Math.round(this.lagEMA * 100) / 100,
      cpuMeasurement: "local-only",
      enemyCap: this.game.enemyCap,
      loopActive: !!this.loop,
    };
  }
  publish(force = false) {
    if (!this.game) return;
    const snap = this.game.snapshot(),
      full = force || !this.previous || this.game.tick % 100 < 2,
      delta = deltaSnapshot(full ? null : this.previous, snap),
      base = this.revision,
      rev = ++this.revision;
    this.broadcast({
      type: "snapshot",
      revision: rev,
      base: delta.full ? 0 : base,
      serverTime: Date.now(),
      ...delta,
      metrics: this.metrics(),
    });
    if (this.game.events.length)
      this.broadcast({
        type: "game_event",
        events: this.game.events.splice(0),
      });
    this.previous = snap;
    this.lastSnapshot = Date.now();
  }
  finish() {
    if (this.meta.ended) return;
    this.stopLoop();
    this.meta.ended = true;
    this.meta.expires = Date.now() + 2 * 60000;
    this.meta.deadline = 0;
    this.save();
    this.publish(true);
    this.lobby();
    this.ctx.waitUntil(this.lease());
    this.ctx.waitUntil(this.schedule());
  }
  async lease() {
    await this.env.DIRECTORY.getByName("global").fetch(
      "https://internal/lease",
      {
        method: "POST",
        body: JSON.stringify({
          code: this.meta.code,
          expires: this.meta.expires,
        }),
      },
    );
  }
  async advanceDeadlines() {
    if (!this.game) return;
    const now = Date.now();
    if (now >= this.meta.expires) {
      await this.destroy();
      return;
    }
    for (const ws of this.ctx.getWebSockets()) {
      const a = ws.deserializeAttachment();
      if (!a?.id && now - a.createdAt >= 10000)
        ws.close(1008, "Doğrulama zaman aşımı");
    }
    let expired = false;
    for (const s of this.sessions)
      if (
        s.disconnectAt &&
        !s.expired &&
        now - s.disconnectAt >=
          num(this.env, "RECONNECT_GRACE_SECONDS", 30) * 1000
      ) {
        s.expired = true;
        expired = true;
      }
    if (
      expired &&
      !["GAME_OVER", "VICTORY", "LOBBY"].includes(this.game.state)
    ) {
      this.game.end(false);
      this.game.event("disconnect", "Yeniden bağlanma süresi doldu.");
      this.finish();
    }
    if (this.meta.deadline && now >= this.meta.deadline) {
      if (this.game.state === "COUNTDOWN") {
        if (this.game.players.every((p) => p.connected && p.ready)) {
          this.meta.deadline = 0;
          this.meta.pauseAt = 0;
          this.game.start(now);
          this.save();
          this.publish(true);
          this.ensureLoop();
        } else {
          this.game.state = "LOBBY";
          this.meta.deadline = 0;
          for (const p of this.game.players) p.ready = false;
          this.save();
          this.lobby();
        }
      } else if (this.game.state === "UPGRADE_SELECTION") {
        this.resume();
        this.save();
      }
    }
  }
  async schedule() {
    if (!this.game) {
      await this.ctx.storage.deleteAlarm();
      return;
    }
    const deadlines = [this.meta.expires];
    if (this.meta.deadline) deadlines.push(this.meta.deadline);
    for (const s of this.sessions)
      if (s.disconnectAt && !s.expired)
        deadlines.push(
          s.disconnectAt + num(this.env, "RECONNECT_GRACE_SECONDS", 30) * 1000,
        );
    for (const ws of this.ctx.getWebSockets()) {
      const a = ws.deserializeAttachment();
      if (!a?.id) deadlines.push(a.createdAt + 10000);
    }
    await this.ctx.storage.setAlarm(
      Math.max(Date.now() + 100, Math.min(...deadlines)),
    );
  }
  async alarm() {
    await this.advanceDeadlines();
    await this.schedule();
  }
  async webSocketClose(ws) {
    await this.disconnected(ws);
  }
  async webSocketError(ws) {
    try {
      ws.close(1011, "Bağlantı hatası");
    } catch {}
    await this.disconnected(ws);
  }
  async disconnected(ws) {
    const a = ws.deserializeAttachment();
    if (a?.id && this.sockets.get(a.id) === ws && this.game) {
      this.sockets.delete(a.id);
      const p = this.game.players.find((p) => p.id === a.id),
        s = this.sessions.find((s) => s.id === a.id);
      if (p) {
        p.connected = false;
        p.input = { x: 0, y: 0, f: false };
      }
      if (s) s.disconnectAt = Date.now();
      if (this.game.state === "COUNTDOWN") {
        this.game.state = "LOBBY";
        this.meta.deadline = 0;
        for (const p of this.game.players) p.ready = false;
      }
      if (!this.sockets.size) this.stopLoop();
      this.save();
      this.lobby();
    }
    await this.schedule();
  }
  async destroy(reason = "Oda süresi doldu") {
    this.stopLoop();
    for (const ws of this.ctx.getWebSockets())
      try {
        ws.close(1000, reason);
      } catch {}
    this.sockets.clear();
    const code = this.meta?.code;
    this.game = null;
    this.meta = null;
    this.sessions = [];
    this.sql.exec("DELETE FROM checkpoint");
    await this.ctx.storage.deleteAlarm();
    if (code)
      await this.env.DIRECTORY.getByName("global").fetch(
        "https://internal/release",
        { method: "POST", body: code },
      );
  }
}
