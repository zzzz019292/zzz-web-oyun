// LAST BOND — Cloudflare Worker + Durable Object (sunucu otoriter simülasyon)
export const CFG = {
  tickHz: 20, snapEvery: 2, world: 3000, maxEnemies: 150,
  player: { hp: 100, speed: 210, dashCd: 5, dashTime: 0.15, dashMul: 3.5, crit: 0.05, critMul: 1.5, baseCd: 0.6, dmg: 12 },
  classes: {
    tank:   { hp: 130, speed: 1.0,  dr: 0.15, crit: 0, cd: 0.7 },
    storm:  { hp: 85,  speed: 1.15, dr: 0,    crit: 0, cd: 0.5 },
    alch:   { hp: 100, speed: 1.0,  dr: 0,    crit: 0, cd: 0.6 },
    shadow: { hp: 90,  speed: 1.0,  dr: 0,    crit: 0.15, cd: 0.55 },
  },
  lastStand: { speed: 0.5, as: 0.5, heal: 0.5, dr: 0.2 },
  side: { dist: 230, as: 0.1, dr: 0.1 },
  respawn: { base: 22, step: 4, max: 35, reviveHold: 3, reviveCut: 8, reviveRange: 120, invuln: 2, hpFrac: 0.5 },
  caps: { as: 3, speed: 2, crit: 0.8, dmg: 6 },
  xp: { base: 8, perLevel: 6, pickup: 60, pickupBase: 70 },
  upgradeTime: 12, bossTime: 720, bossHp: 6000,
  enemies: {
    walker: { hp: 20, spd: 70,  dmg: 8,  r: 14, xp: 1 },
    runner: { hp: 10, spd: 150, dmg: 5,  r: 10, xp: 1 },
    tank:   { hp: 90, spd: 45,  dmg: 14, r: 22, xp: 4 },
    boss:   { hp: 6000, spd: 55, dmg: 30, r: 70, xp: 0 },
  },
};
const CARDS = [
  { id: 'dmg', n: 'Keskin Silah', d: '+%20 hasar' }, { id: 'as', n: 'Hızlı Eller', d: '+%15 saldırı hızı' },
  { id: 'ms', n: 'Rüzgar Ayakkabıları', d: '+%8 hareket hızı' }, { id: 'hp', n: 'Çelik Deri', d: '+20 maks HP' },
  { id: 'multi', n: 'İkiz Atış', d: '+1 mermi' }, { id: 'pierce', n: 'Delici Uç', d: '+1 delme' },
  { id: 'crit', n: 'Keskin Odak', d: '+%5 kritik' }, { id: 'mag', n: 'Mıknatıs Kalp', d: '+%30 XP menzili' },
];
const rnd = (a, b) => a + Math.random() * (b - a);
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

export default {
  async fetch(req, env) {
    const u = new URL(req.url);
    if (u.pathname !== '/ws') return env.ASSETS.fetch(req);
    if (req.headers.get('Upgrade') !== 'websocket') return new Response('WebSocket gerekli', { status: 426 });
    let code = (u.searchParams.get('room') || '').toUpperCase();
    if (u.searchParams.get('mode') === 'create') {
      const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      code = Array.from({ length: 6 }, () => A[Math.floor(Math.random() * A.length)]).join('');
    }
    if (!/^[A-Z0-9]{6}$/.test(code)) return new Response('Geçersiz kod', { status: 400 });
    u.searchParams.set('room', code);
    return env.ROOM.get(env.ROOM.idFromName(code)).fetch(new Request(u, req));
  },
};

export class Room {
  constructor() { this.created = false; this.players = []; this.state = 'LOBBY'; this.timer = null; this.rl = new Map(); }
  async fetch(req) {
    const u = new URL(req.url), mode = u.searchParams.get('mode'), tok = u.searchParams.get('token');
    const [c, s] = Object.values(new WebSocketPair()); s.accept();
    const send = (o) => { try { s.send(JSON.stringify(o)); } catch {} };
    let p = tok && this.players.find((x) => x.token === tok);
    if (p) { p.ws = s; p.connected = true; p.dcAt = 0; }
    else if (mode === 'create' && !this.created) { this.created = true; p = this.addPlayer(s); }
    else if (mode === 'create') { send({ t: 'error', m: 'Oda kodu çakıştı, tekrar dene.' }); s.close(); return new Response(null, { status: 101, webSocket: c }); }
    else if (!this.created) { send({ t: 'error', m: 'Yanlış kod: oda bulunamadı.' }); s.close(); return new Response(null, { status: 101, webSocket: c }); }
    else if (this.players.length >= 2 || this.state !== 'LOBBY') { send({ t: 'error', m: 'Oda dolu.' }); s.close(); return new Response(null, { status: 101, webSocket: c }); }
    else p = this.addPlayer(s);
    this.code = u.searchParams.get('room');
    send({ t: mode === 'create' && !tok ? 'room_created' : 'room_joined', code: this.code, slot: p.slot, token: p.token });
    this.lobby();
    s.addEventListener('message', (e) => this.onMsg(p, e.data));
    s.addEventListener('close', () => { if (p.ws === s) { p.connected = false; p.dcAt = Date.now(); this.lobby(); } });
    return new Response(null, { status: 101, webSocket: c });
  }
  addPlayer(ws) {
    const slot = this.players.length;
    const p = { slot, ws, token: crypto.randomUUID(), connected: true, name: 'Oyuncu ' + (slot + 1), cls: 'tank', ready: false, dcAt: 0 };
    this.players.push(p); return p;
  }
  bc(o) { const m = JSON.stringify(o); for (const p of this.players) if (p.connected) try { p.ws.send(m); } catch {} }
  lobby() { this.bc({ t: 'lobby_update', players: this.players.map((p) => ({ slot: p.slot, name: p.name, cls: p.cls, ready: p.ready, connected: p.connected })) }); }
  onMsg(p, raw) {
    const now = Date.now(), r = this.rl.get(p.slot) || { n: 0, t: now };
    if (now - r.t > 1000) { r.n = 0; r.t = now; } if (++r.n > 60) return; this.rl.set(p.slot, r);
    let m; try { m = JSON.parse(raw); } catch { return; }
    if (m.t === 'ping') return p.ws.send(JSON.stringify({ t: 'pong', c: m.c }));
    if (this.state === 'LOBBY') {
      if (m.t === 'select_character' && CFG.classes[m.cls]) { p.cls = m.cls; const nm=typeof m.name==='string'?m.name.trim().slice(0,12).replace(/[<>&"']/g,''):''; if(nm)p.name=nm; p.ready = false; this.lobby(); }
      if (m.t === 'ready') { p.ready = !!m.v; this.lobby(); if (this.players.length === 2 && this.players.every((x) => x.ready)) this.start(); }
      return;
    }
    if (m.t === 'input' && p.g) {
      if (!(m.seq > p.g.seq)) return; p.g.seq = m.seq;
      const x = Math.max(-1, Math.min(1, +m.x || 0)), y = Math.max(-1, Math.min(1, +m.y || 0));
      p.g.ix = x; p.g.iy = y; p.g.dash = !!m.dash; p.g.ability = !!m.e; p.g.revive = !!m.f;
    }
    if (m.t === 'choose_upgrade' && this.state === 'UPGRADE_SELECTION' && p.g.offer && p.g.pick == null) {
      const c = p.g.offer[m.i | 0]; if (c) { p.g.pick = c; this.applyCard(p, c); this.checkUpgradeDone(); }
    }
  }
  start() {
    this.state = 'COUNTDOWN'; this.bc({ t: 'countdown', n: 3 });
    setTimeout(() => this.begin(), 3000);
  }
  begin() {
    const W = CFG.world;
    this.t = 0; this.level = 1; this.xp = 0; this.kills = 0; this.dmgDone = 0; this.es = []; this.bs = []; this.gs = []; this.ev = []; this.nid = 1; this.spawnAcc = 0; this.tick = 0; this.boss = null; this.bossAcc = 0;
    for (const p of this.players) {
      const k = CFG.classes[p.cls];
      p.g = { x: W / 2 + (p.slot ? 60 : -60), y: W / 2, hp: k.hp, mhp: k.hp, alive: true, resp: 0, deaths: 0, ix: 0, iy: 0, dash: false, dashCd: 0, dashT: 0, seq: 0, cd: 0.3, hit: 0, inv: 0, rev: 0, revUsed: false, revProg: 0,
        dmg: 1, as: 1, ms: 1, multi: 1, pierce: 0, crit: CFG.player.crit + k.crit, mag: 1, dr: k.dr, offer: null, pick: null, dx: 0, dy: -1, level: {} };
    }
    this.state = 'PLAYING'; this.bc({ t: 'game_start', world: W, cfg: { dashCd: CFG.player.dashCd, bossTime: CFG.bossTime } });
    this.last = Date.now(); this.timer = setInterval(() => this.step(), 1000 / CFG.tickHz);
  }
  alive() { return this.players.filter((p) => p.g.alive); }
  lastStand(p) { return p.g.alive && this.players.length === 2 && !this.players.some((q) => q !== p && q.g.alive); }
  step() {
    const dt = 1 / CFG.tickHz; this.tick++;
    // bağlantı koparsa 30 sn sonra ayrılmış say
    for (const p of this.players) if (!p.connected && p.dcAt && Date.now() - p.dcAt > 30000) { p.g.ix = p.g.iy = 0; if (p.g.alive) this.kill(p); }
    if (this.state === 'UPGRADE_SELECTION') {
      if (Date.now() > this.upDeadline) { for (const p of this.players) if (p.g.pick == null) { p.g.pick = p.g.offer[0]; this.applyCard(p, p.g.offer[0]); } this.checkUpgradeDone(); }
      if (this.tick % CFG.snapEvery === 0) this.snap(); return;
    }
    if (this.state !== 'PLAYING') return;
    this.t += dt; const P = CFG.player, W = CFG.world;
    // oyuncular
    for (const p of this.players) {
      const g = p.g, k = CFG.classes[p.cls], ls = this.lastStand(p);
      g.dashCd = Math.max(0, g.dashCd - dt); g.hit = Math.max(0, g.hit - dt); g.inv = Math.max(0, g.inv - dt);
      const mate = this.players.find((q) => q !== p), near = mate && mate.g.alive && g.alive && dist(g, mate.g) < CFG.side.dist;
      g.msMul = Math.min(CFG.caps.speed, g.ms * k.speed * (ls ? 1 + CFG.lastStand.speed : 1));
      g.asMul = Math.min(CFG.caps.as, g.as * (ls ? 1 + CFG.lastStand.as : 1) * (near ? 1 + CFG.side.as : 1));
      g.drTot = Math.min(0.6, g.dr + (ls ? CFG.lastStand.dr : 0) + (near ? CFG.side.dr : 0));
      g.ls = ls; g.near = near;
      let ix = g.ix, iy = g.iy; const l = Math.hypot(ix, iy); if (l > 1) { ix /= l; iy /= l; }
      if (l > 0.1) { g.dx = ix; g.dy = iy; }
      let sp = P.speed * g.msMul * (g.alive ? 1 : 0.4);
      if (g.alive && g.dash && g.dashCd <= 0 && l > 0.1) { g.dashT = P.dashTime; g.dashCd = P.dashCd; g.inv = Math.max(g.inv, 0.2); }
      if (g.dashT > 0) { g.dashT -= dt; sp *= P.dashMul; }
      g.x = Math.max(20, Math.min(W - 20, g.x + ix * sp * dt)); g.y = Math.max(20, Math.min(W - 20, g.y + iy * sp * dt));
      if (!g.alive) { g.resp -= dt; if (g.resp <= 0) this.respawn(p); continue; }
      // kurtarma
      g.rev = 0;
      if (g.revive && mate && !mate.g.alive && !mate.g.revUsed && dist(g, mate.g) < CFG.respawn.reviveRange) {
        mate.g.revProg += dt; g.rev = mate.g.revProg / CFG.respawn.reviveHold;
        if (mate.g.revProg >= CFG.respawn.reviveHold) { mate.g.resp = Math.max(0.1, mate.g.resp - CFG.respawn.reviveCut); mate.g.revUsed = true; mate.g.revProg = 0; this.ev.push(['msg', 'Kurtarma başarılı!']); }
      } else if (mate) mate.g.revProg = 0;
      // otomatik saldırı
      g.cd -= dt;
      if (g.cd <= 0) {
        let best = null, bd = 520;
        for (const e of this.es) { const d = dist(g, e); if (d < bd) { bd = d; best = e; } }
        if (best) {
          g.cd = k.cd / g.asMul; const a = Math.atan2(best.y - g.y, best.x - g.x), n = g.multi;
          for (let i = 0; i < n; i++) { const aa = a + (i - (n - 1) / 2) * 0.18;
            this.bs.push({ x: g.x, y: g.y, vx: Math.cos(aa) * 520, vy: Math.sin(aa) * 520, life: 1.2, dmg: P.dmg * g.dmg, pierce: g.pierce, o: p.slot, crit: g.crit, hit: [] }); }
        }
      }
    }
    // spawn
    this.spawnAcc += dt * (0.8 + this.t / 60 * 0.9);
    while (this.spawnAcc >= 1) { this.spawnAcc -= 1; if (this.es.length < CFG.maxEnemies && this.t < CFG.bossTime) this.spawn(); }
    if (this.t >= CFG.bossTime && !this.boss) this.spawnBoss();
    // düşmanlar (spatial grid ile ayrışma)
    const grid = new Map(), cs = 64;
    for (const e of this.es) { const key = ((e.x / cs) | 0) + ',' + ((e.y / cs) | 0); (grid.get(key) || grid.set(key, []).get(key)).push(e); }
    for (const e of this.es) {
      const T = CFG.enemies[e.ty]; let tg = null, td = 1e9;
      for (const p of this.alive()) { const d = dist(e, p.g); if (d < td) { td = d; tg = p.g; } }
      if (tg) { const a = Math.atan2(tg.y - e.y, tg.x - e.x); e.x += Math.cos(a) * T.spd * dt; e.y += Math.sin(a) * T.spd * dt; }
      const cx = (e.x / cs) | 0, cy = (e.y / cs) | 0;
      for (let ox = -1; ox <= 1; ox++) for (let oy = -1; oy <= 1; oy++) for (const o of grid.get((cx + ox) + ',' + (cy + oy)) || []) {
        if (o === e) continue; const dx = e.x - o.x, dy = e.y - o.y, d = Math.hypot(dx, dy) || 1, m = T.r + CFG.enemies[o.ty].r;
        if (d < m) { e.x += dx / d * 30 * dt; e.y += dy / d * 30 * dt; } }
      if (tg) for (const p of this.alive()) if (p.g.hit <= 0 && p.g.inv <= 0 && dist(e, p.g) < T.r + 16) this.hurt(p, T.dmg * (1 + this.t / 240));
    }
    // mermiler
    for (const b of this.bs) {
      b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
      for (const e of this.es) {
        if (e.hp <= 0 || b.life <= 0 || b.hit.includes(e.id)) continue;
        if (dist(b, e) < CFG.enemies[e.ty].r + 6) {
          b.hit.push(e.id); const owner = this.players[b.o].g;
          const crit = Math.random() < Math.min(CFG.caps.crit, b.crit); let d = b.dmg * (crit ? CFG.player.critMul : 1);
          if (e.mark > 0 && e.markBy !== b.o) d *= 1.15; if (e.markBy != null && e.markBy !== b.o) e.mark = 5;
          if (e.markBy == null || e.mark <= 0) { e.markBy = b.o; e.mark = 2; } // Ortak Hedef: 2 sn içinde ikinci oyuncu vurursa işaretle
          else if (e.markBy !== b.o && e.mark > 0) { e.marked = 5; }
          e.hp -= d; this.dmgDone += d; this.ev.push(['d', e.x | 0, e.y | 0, d | 0, crit ? 1 : 0]);
          if (b.hit.length > b.pierce) b.life = 0;
          if (e.hp <= 0) this.killEnemy(e);
        }
      }
    }
    for (const e of this.es) { if (e.mark > 0) e.mark -= dt; }
    this.bs = this.bs.filter((b) => b.life > 0); this.es = this.es.filter((e) => e.hp > 0);
    // boss
    if (this.boss && this.boss.hp > 0) { this.bossAcc += dt; if (this.bossAcc > 5) { this.bossAcc = 0; for (let i = 0; i < 6; i++) this.spawn(this.boss.x + rnd(-120, 120), this.boss.y + rnd(-120, 120)); } }
    // XP kristalleri
    for (const gm of this.gs) for (const p of this.alive()) { const d = dist(gm, p.g), r = CFG.xp.pickup * p.g.mag + CFG.xp.pickupBase * 0;
      if (d < r) { gm.x += (p.g.x - gm.x) * 0.3; gm.y += (p.g.y - gm.y) * 0.3; } if (d < 24) { gm.dead = true; this.xp += gm.v; } }
    this.gs = this.gs.filter((g) => !g.dead);
    const need = CFG.xp.base + this.level * CFG.xp.perLevel;
    if (this.xp >= need) { this.xp -= need; this.level++; this.offerUpgrades(); }
    if (this.tick % CFG.snapEvery === 0) this.snap();
  }
  spawn(x, y) {
    const al = this.alive(); if (!al.length) return; const c = al[(Math.random() * al.length) | 0].g;
    const a = rnd(0, 6.283), r = rnd(650, 850), W = CFG.world;
    const ty = this.t > 90 && Math.random() < 0.12 ? 'tank' : Math.random() < 0.25 ? 'runner' : 'walker';
    const sc = 1 + this.t / 150;
    x = x ?? Math.max(10, Math.min(W - 10, c.x + Math.cos(a) * r)); y = y ?? Math.max(10, Math.min(W - 10, c.y + Math.sin(a) * r));
    const hp = CFG.enemies[ty].hp * sc; this.es.push({ id: this.nid++, ty, x, y, hp, mhp: hp, mark: 0, markBy: null });
  }
  spawnBoss() {
    const hp = CFG.bossHp; this.boss = { id: this.nid++, ty: 'boss', x: CFG.world / 2, y: 200, hp, mhp: hp, mark: 0, markBy: null };
    this.es.push(this.boss); this.bc({ t: 'boss_spawn' });
  }
  killEnemy(e) {
    this.kills++; if (e.ty !== 'boss') this.gs.push({ x: e.x, y: e.y, v: CFG.enemies[e.ty].xp });
    if (e === this.boss) this.win();
  }
  hurt(p, d) {
    const g = p.g; g.hp -= d * (1 - g.drTot); g.hit = 0.5; g.revProg = 0; this.ev.push(['h', g.x | 0, g.y | 0, p.slot]);
    if (g.hp <= 0) this.kill(p);
  }
  kill(p) {
    const g = p.g; g.alive = false; g.hp = 0; g.deaths++; g.revUsed = false; g.revProg = 0;
    g.resp = Math.min(CFG.respawn.max, CFG.respawn.base + CFG.respawn.step * (g.deaths - 1));
    const mate = this.players.find((q) => q !== p);
    if (mate && mate.g.alive) { const m = mate.g; m.hp += (m.mhp - m.hp) * CFG.lastStand.heal; this.bc({ t: 'player_down', slot: p.slot }); this.ev.push(['msg', 'SON NÖBET AKTİF!']); }
    else this.over();
  }
  respawn(p) {
    const g = p.g, mate = this.players.find((q) => q !== p);
    g.alive = true; g.hp = g.mhp * CFG.respawn.hpFrac; g.inv = CFG.respawn.invuln;
    if (mate) { g.x = mate.g.x + 50; g.y = mate.g.y; }
    this.bc({ t: 'player_respawn', slot: p.slot }); this.ev.push(['msg', 'ANKA BAĞI']);
    for (const e of this.es) { const d = dist(e, g); if (d < 250) { e.x += (e.x - g.x) / (d || 1) * 120; e.y += (e.y - g.y) / (d || 1) * 120; } }
    for (const q of this.players) q.g.dmg *= 1; // (+%20 hasar penceresi README'de: henüz yok)
  }
  offerUpgrades() {
    this.state = 'UPGRADE_SELECTION'; this.upDeadline = Date.now() + CFG.upgradeTime * 1000;
    for (const p of this.players) {
      p.g.pick = null; p.g.offer = [...CARDS].sort(() => Math.random() - 0.5).slice(0, 3);
      if (p.connected) p.ws.send(JSON.stringify({ t: 'upgrade_offer', cards: p.g.offer, time: CFG.upgradeTime, level: this.level }));
    }
  }
  applyCard(p, c) {
    const g = p.g, id = c.id;
    if (id === 'dmg') g.dmg = Math.min(CFG.caps.dmg, g.dmg * 1.2); if (id === 'as') g.as = Math.min(CFG.caps.as, g.as * 1.15);
    if (id === 'ms') g.ms = Math.min(CFG.caps.speed, g.ms * 1.08); if (id === 'hp') { g.mhp += 20; g.hp += 20; }
    if (id === 'multi') g.multi = Math.min(6, g.multi + 1); if (id === 'pierce') g.pierce = Math.min(6, g.pierce + 1);
    if (id === 'crit') g.crit = Math.min(CFG.caps.crit, g.crit + 0.05); if (id === 'mag') g.mag *= 1.3;
    g.level[id] = (g.level[id] || 0) + 1;
  }
  checkUpgradeDone() { if (this.players.every((p) => p.g.pick != null)) { this.state = 'PLAYING'; this.bc({ t: 'upgrade_done' }); } }
  snap() {
    const r = (n) => Math.round(n);
    const msg = { t: 'snapshot', st: this.state, time: +this.t.toFixed(1), lv: this.level, xp: this.xp, need: CFG.xp.base + this.level * CFG.xp.perLevel, kills: this.kills,
      p: this.players.map((p) => { const g = p.g; return { s: p.slot, c: p.cls, x: r(g.x), y: r(g.y), hp: r(g.hp), m: g.mhp, a: g.alive ? 1 : 0, rs: +g.resp.toFixed(1), ls: g.ls ? 1 : 0, nr: g.near ? 1 : 0, dc: +g.dashCd.toFixed(1), rv: +g.rev.toFixed(2), rp: +(g.revProg / CFG.respawn.reviveHold).toFixed(2), inv: g.inv > 0 ? 1 : 0, seq: g.seq, cn: p.connected ? 1 : 0, w: g.multi }; }),
      e: this.es.map((e) => [e.id, e.ty === 'walker' ? 0 : e.ty === 'runner' ? 1 : e.ty === 'tank' ? 2 : 3, r(e.x), r(e.y), +(e.hp / e.mhp).toFixed(2), e.mark > 0 ? 1 : 0]),
      b: this.bs.map((b) => [r(b.x), r(b.y), b.o]), g: this.gs.slice(0, 300).map((g) => [r(g.x), r(g.y)]), ev: this.ev };
    this.ev = []; this.bc(msg);
  }
  win() { this.end('VICTORY'); }
  over() { this.end('GAME_OVER'); }
  end(st) {
    this.state = st; clearInterval(this.timer);
    this.bc({ t: 'game_over', victory: st === 'VICTORY', time: this.t | 0, kills: this.kills, dmg: this.dmgDone | 0, deaths: this.players.map((p) => p.g.deaths) });
    setTimeout(() => { this.state = 'LOBBY'; for (const p of this.players) p.ready = false; this.lobby(); }, 500);
  }
}
