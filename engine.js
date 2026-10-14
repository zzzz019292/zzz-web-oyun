// Deterministic server-authoritative simulation. All combat state lives here.
export const B = {
  world: 2800,
  tick: 0.05,
  match: 720,
  maxEnemies: 150,
  maxBullets: 450,
  maxLoot: 240,
  maxHazards: 60,
  speed: 210,
  dashSpeed: 820,
  dashDuration: 0.18,
  dashCD: 5,
  reviveBase: 22,
  reviveMax: 35,
  reviveRange: 120,
  reviveHold: 3,
  reviveReduce: 8,
  nearRange: 230,
  lastSpeed: 1.5,
  lastAttack: 1.5,
  lastHeal: 0.5,
  lastResist: 0.2,
  maxSpeedMult: 2.1,
  maxAttackMult: 3,
  maxResist: 0.65,
  upgradeSeconds: 12,
  bossHP: 18000,
  bossDamage: 24,
  xpBase: 18,
  xpGrowth: 1.3,
};
export const CLASSES = {
  tank: {
    name: "ÖNCÜ",
    hp: 130,
    speed: 1,
    resist: 0.15,
    crit: 0.05,
    weapon: "shield",
    cd: 22,
    color: "#49e5dc",
  },
  storm: {
    name: "FIRTINA",
    hp: 85,
    speed: 1.15,
    resist: 0,
    crit: 0.05,
    weapon: "lightning",
    cd: 24,
    color: "#b190ff",
  },
  alchemist: {
    name: "SİMYACI",
    hp: 100,
    speed: 1,
    resist: 0,
    crit: 0.05,
    weapon: "poison",
    cd: 30,
    color: "#91ef83",
  },
  shadow: {
    name: "GÖLGE",
    hp: 90,
    speed: 1,
    resist: 0,
    crit: 0.2,
    weapon: "dagger",
    cd: 18,
    color: "#ff728d",
  },
};
export const WEAPONS = {
  lightning: {
    name: "Yıldırım Yayı",
    desc: "Hedefler arası zincirleme elektrik.",
    tag: "elektrik",
    damage: 23,
    cd: 1.2,
    color: "#b79aff",
  },
  ice: {
    name: "Buz İğneleri",
    desc: "Delici iğneler yavaşlatır ve dondurur.",
    tag: "buz",
    damage: 15,
    cd: 0.9,
    color: "#8ceaff",
  },
  scythe: {
    name: "Kan Orağı",
    desc: "Yörüngede dönen, kanama veren oraklar.",
    tag: "kan",
    damage: 17,
    cd: 1.5,
    color: "#ff617d",
  },
  meteor: {
    name: "Meteor Yağmuru",
    desc: "İşaretlenen kümeye ateşli patlama.",
    tag: "ateş · ağır",
    damage: 52,
    cd: 2.8,
    color: "#ff9e61",
  },
  shield: {
    name: "Dönen Kalkan",
    desc: "Yörüngedeki diskler düşmanları iter.",
    tag: "ağır",
    damage: 20,
    cd: 1.4,
    color: "#52e7d2",
  },
  roots: {
    name: "Dikenli Kökler",
    desc: "Zeminden yükselen kökler hedefi sabitler.",
    tag: "kontrol",
    damage: 22,
    cd: 2,
    color: "#9ee882",
  },
  wind: {
    name: "Rüzgar Bıçağı",
    desc: "Geri dönen bumerang yanmayı yayar.",
    tag: "rüzgar",
    damage: 21,
    cd: 1.6,
    color: "#d5ffee",
  },
  mine: {
    name: "Kara Delik Mayını",
    desc: "Düşmanları çeker, ardından patlar.",
    tag: "ağır",
    damage: 65,
    cd: 3.5,
    color: "#c777ff",
  },
  dagger: {
    name: "Gölge Hançeri",
    desc: "Hızlı, delici, kritik odaklı atış.",
    tag: "kritik",
    damage: 19,
    cd: 0.65,
    color: "#ff8ca7",
  },
  bees: {
    name: "Arı Sürüsü",
    desc: "Hedefi takip eden yardımcı yaratıklar.",
    tag: "sürü",
    damage: 12,
    cd: 1.1,
    color: "#ffd977",
  },
  sound: {
    name: "Ses Dalgası",
    desc: "Konik alanda vuruş ve geri itme.",
    tag: "rüzgar",
    damage: 30,
    cd: 1.7,
    color: "#f4b9ff",
  },
  spear: {
    name: "Işık Mızrağı",
    desc: "Çok hedef delen uzun ışın.",
    tag: "ışık",
    damage: 35,
    cd: 1.8,
    color: "#fff3b0",
  },
  poison: {
    name: "Zehir Şişesi",
    desc: "Islatan, zehirli kimya havuzu.",
    tag: "ıslak · zehir",
    damage: 14,
    cd: 2,
    color: "#91ef83",
  },
};
export const PASSIVES = {
  steel: { name: "Çelik Deri", desc: "+12 HP ve %3 direnç / seviye." },
  hands: { name: "Hızlı Eller", desc: "+%10 saldırı hızı / seviye." },
  boots: { name: "Rüzgar Ayakkabıları", desc: "+%7 hareket hızı / seviye." },
  focus: { name: "Keskin Odak", desc: "+%5 kritik / seviye." },
  vampire: { name: "Kan Emici", desc: "Hasardan iyileşme; en fazla 4 HP/sn." },
  area: { name: "Büyük Patlama", desc: "+%12 alan yarıçapı / seviye." },
  double: { name: "İkiz Atış", desc: "+%12 ek mermi şansı / seviye." },
  magnet: {
    name: "Mıknatıs Kalp",
    desc: "+45 kristal çekme mesafesi / seviye.",
  },
  cold: { name: "Soğuk Damar", desc: "Kontrol süresi ve buz evrimi." },
  conduct: { name: "İletken Ruh", desc: "+%12 elektrik hasarı / seviye." },
  fire: { name: "Alev Çekirdeği", desc: "Yanma süresi ve hasarı artar." },
  oath: { name: "Birlik Yemini", desc: "Yakınlık bonuslarını güçlendirir." },
};
export const EVOLUTIONS = {
  lightning: { passive: "conduct", name: "Sonsuz Fırtına" },
  ice: { passive: "cold", name: "Mutlak Sıfır" },
  scythe: { passive: "vampire", name: "Kızıl Hasat" },
  meteor: { passive: "fire", name: "Kıyamet Yağmuru" },
  shield: { passive: "steel", name: "Ebedi Muhafız" },
  bees: { passive: "double", name: "Lejyon Sürüsü" },
};
export const BONDS = {
  sacrifice: { name: "Son Fedakârlık", desc: "Son Nöbet: +%20 hasar." },
  blood: {
    name: "Ortak Kan",
    desc: "İyileştirmenin %15’i diğerine aktarılır.",
  },
  ghost: {
    name: "Hayalet Yardımı",
    desc: "Ruh 3 saniyede bir düşük hasarlı atış yapar.",
  },
  chance: {
    name: "İkinci Şans",
    desc: "Maçta bir kez takım düştüğünde %20 HP ile dönüş.",
  },
  chain: {
    name: "Zincirli Ruhlar",
    desc: "Yakın oyuncuların enerji bağı hasar verir.",
  },
  revenge: {
    name: "İntikam Yemini",
    desc: "Arkadaş düşünce 8 saniye +%30 kritik.",
  },
  target: {
    name: "Birlikten Kuvvet Doğar",
    desc: "Boss’a Ortak Hedef bonusu %25 olur.",
  },
  share: {
    name: "Yaşam Paylaşımı",
    desc: "30 saniyede bir düşük cana en fazla %10 HP aktarılır.",
  },
};
export const ENEMIES = {
  rot: {
    name: "Çürük",
    hp: 32,
    speed: 78,
    damage: 7,
    r: 15,
    color: "#89ad9c",
    xp: 2,
  },
  runner: {
    name: "Koşucu",
    hp: 22,
    speed: 142,
    damage: 6,
    r: 11,
    color: "#d79cac",
    xp: 2,
  },
  spitter: {
    name: "Tükürücü",
    hp: 55,
    speed: 48,
    damage: 9,
    r: 17,
    color: "#a1d773",
    xp: 3,
  },
  burst: {
    name: "Patlak",
    hp: 38,
    speed: 90,
    damage: 11,
    r: 16,
    color: "#ffa367",
    xp: 3,
  },
  armor: {
    name: "Zırhlı",
    hp: 180,
    speed: 38,
    damage: 15,
    r: 23,
    color: "#8e9cb8",
    xp: 5,
  },
  mage: {
    name: "Büyücü",
    hp: 80,
    speed: 46,
    damage: 13,
    r: 19,
    color: "#bd89e8",
    xp: 4,
  },
  hunter: {
    name: "Avcı",
    hp: 85,
    speed: 84,
    damage: 12,
    r: 17,
    color: "#e57089",
    xp: 4,
  },
  elite: {
    name: "DİKEN MUHAFIZI",
    hp: 650,
    speed: 54,
    damage: 19,
    r: 29,
    color: "#f6ca75",
    xp: 22,
  },
  boss: {
    name: "BOŞLUK EFENDİSİ",
    hp: B.bossHP,
    speed: 36,
    damage: B.bossDamage,
    r: 60,
    color: "#d197ff",
    xp: 0,
  },
};
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
function segmentDist(e, a, b) {
  const dx = b.x - a.x,
    dy = b.y - a.y,
    t = clamp(
      ((e.x - a.x) * dx + (e.y - a.y) * dy) / (dx * dx + dy * dy || 1),
      0,
      1,
    );
  return Math.hypot(e.x - a.x - t * dx, e.y - a.y - t * dy);
}
export class Grid {
  constructor(size = 100) {
    this.size = size;
    this.cells = new Map();
  }
  build(es) {
    this.cells.clear();
    for (const e of es) {
      if (e.hp <= 0) continue;
      const k = `${Math.floor(e.x / this.size)},${Math.floor(e.y / this.size)}`;
      if (!this.cells.has(k)) this.cells.set(k, []);
      this.cells.get(k).push(e);
    }
  }
  query(x, y, r) {
    const a = [];
    for (
      let i = Math.floor((x - r) / this.size);
      i <= Math.floor((x + r) / this.size);
      i++
    )
      for (
        let j = Math.floor((y - r) / this.size);
        j <= Math.floor((y + r) / this.size);
        j++
      )
        for (const e of this.cells.get(`${i},${j}`) || [])
          if (Math.hypot(e.x - x, e.y - y) < r + e.r) a.push(e);
    return a;
  }
}
export class Game {
  constructor(seed = Date.now()) {
    Object.assign(this, {
      rng: seed >>> 0 || 1,
      state: "LOBBY",
      players: [],
      enemies: [],
      bullets: [],
      hazards: [],
      loot: [],
      events: [],
      pool: [],
      grid: new Grid(),
      id: 1,
      tick: 0,
      t: 0,
      xp: 0,
      level: 1,
      need: B.xpBase,
      bonds: [],
      kills: 0,
      deaths: 0,
      synergies: {},
      noticeAt: {},
      spawnAt: 0,
      eliteAt: 70,
      swarmAt: 24,
      enemyCap: B.maxEnemies,
      bossSpawned: false,
      offerRevision: 0,
      shareAt: 0,
      bloodAt: [],
      startedAt: 0,
      pausedMs: 0,
      runtimeLostMs: 0,
    });
  }
  rand() {
    let x = this.rng;
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    this.rng = x >>> 0;
    return this.rng / 4294967296;
  }
  addPlayer(id, name, cls = "tank") {
    if (this.players.length >= 2) throw Error("Oda dolu");
    const p = {
      id,
      name,
      cls,
      ready: false,
      connected: true,
      seq: -1,
      input: { x: 0, y: 0, f: false },
      x: 1400 + this.players.length * 70,
      y: 1400,
      dead: false,
      deathCount: 0,
      evolved: [],
      weaponAt: {},
      dashUntil: 0,
      dashAt: 0,
      activeAt: 0,
      activeUntil: 0,
      shield: 0,
      shieldUntil: 0,
      immuneUntil: 0,
      hurtUntil: 0,
      damage: 0,
      last: false,
      reviveProgress: 0,
      reviveUsed: false,
      respawnAt: 0,
      dx: 1,
      dy: 0,
      phoenixUntil: 0,
      healWindow: 0,
      healTotal: 0,
    };
    this.players.push(p);
    this.configure(p, cls);
    return p;
  }
  configure(p, cls) {
    if (!CLASSES[cls]) return;
    const c = CLASSES[cls];
    p.cls = cls;
    p.maxHP = c.hp;
    p.hp = c.hp;
    p.weapons = { [c.weapon]: 1 };
    p.passives = {};
    p.weaponAt = {};
  }
  start(now = Date.now()) {
    this.state = "PLAYING";
    this.startedAt = now;
    // An evenly spaced opening ring gives immediate action without spawning
    // enemies on top of either player. Normal reinforcements follow shortly.
    const x = this.players.reduce((n, p) => n + p.x, 0) / this.players.length;
    const y = this.players.reduce((n, p) => n + p.y, 0) / this.players.length;
    for (let i = 0; i < 10; i++) {
      const a = (i * Math.PI * 2) / 10;
      const r = 335 + this.rand() * 45;
      this.spawn(i % 4 === 0 ? "runner" : "rot", x + Math.cos(a) * r, y + Math.sin(a) * r);
    }
    this.spawnAt = 0.6;
    this.event("game_start", "ÇAYIR KUŞATMASI · Bağınızı koruyun!");
  }
  event(type, text, data = {}) {
    this.events.push({ id: this.id++, type, text, ...data });
    if (this.events.length > 100) this.events.shift();
  }
  synergy(name) {
    this.synergies[name] = (this.synergies[name] || 0) + 1;
    if (this.t - (this.noticeAt[name] ?? -99) > 4) {
      this.noticeAt[name] = this.t;
      this.event("synergy", name);
    }
  }
  stats(p) {
    const q = this.players.find((x) => x !== p),
      near = q && !q.dead && !p.dead && distance(p, q) < B.nearRange,
      c = CLASSES[p.cls],
      v = p.passives;
    return {
      near,
      speed:
        B.speed *
        c.speed *
        Math.min(
          B.maxSpeedMult,
          (1 + 0.07 * (v.boots || 0)) * (p.last ? B.lastSpeed : 1),
        ),
      attack: Math.min(
        B.maxAttackMult,
        (1 + 0.1 * (v.hands || 0)) *
          (p.last ? B.lastAttack : 1) *
          (near ? 1.1 + 0.02 * (v.oath || 0) : 1) *
          (p.cls === "storm" && p.activeUntil > this.t ? 1.6 : 1),
      ),
      damage:
        (p.phoenixUntil > this.t ? 1.2 : 1) *
        (p.last && this.bonds.includes("sacrifice") ? 1.2 : 1),
      resist: Math.min(
        B.maxResist,
        c.resist +
          0.03 * (v.steel || 0) +
          (p.last ? B.lastResist : 0) +
          (near ? 0.1 + 0.015 * (v.oath || 0) : 0) +
          (near && q.cls === "tank" ? 0.08 : 0),
      ),
      crit: Math.min(
        0.75,
        c.crit + 0.05 * (v.focus || 0) + (p.revengeUntil > this.t ? 0.3 : 0),
      ),
      area: 1 + 0.12 * (v.area || 0),
      magnet: 100 + 45 * (v.magnet || 0),
    };
  }
  input(id, m) {
    const p = this.players.find((p) => p.id === id);
    if (
      !p ||
      !Number.isSafeInteger(m.seq) ||
      m.seq <= p.seq ||
      m.seq > p.seq + 100000
    )
      return false;
    if (
      !Number.isFinite(m.x) ||
      !Number.isFinite(m.y) ||
      Math.abs(m.x) > 1 ||
      Math.abs(m.y) > 1 ||
      typeof m.f !== "boolean"
    )
      return false;
    p.seq = m.seq;
    const n = Math.max(1, Math.hypot(m.x, m.y));
    p.input = { x: m.x / n, y: m.y / n, f: m.f };
    p.inputAt = this.t;
    if (p.input.x || p.input.y) {
      p.dx = p.input.x;
      p.dy = p.input.y;
    }
    if (m.dash === true && !p.dead && p.dashAt <= this.t) {
      p.dashAt = this.t + B.dashCD;
      p.dashUntil = this.t + B.dashDuration;
      p.immuneUntil = Math.max(p.immuneUntil, p.dashUntil);
      this.event("dash", "", { player: p.id, x: p.x, y: p.y });
    }
    if (m.active === true && !p.dead && p.activeAt <= this.t) this.active(p);
    return true;
  }
  active(p) {
    p.activeAt = this.t + CLASSES[p.cls].cd;
    p.activeUntil = this.t + (p.cls === "storm" ? 4 : 5);
    if (p.cls === "tank") {
      p.shield = 45;
      p.shieldUntil = this.t + 5;
      const q = this.players.find(
        (x) => x !== p && !x.dead && distance(x, p) < B.nearRange,
      );
      if (q) {
        q.shield = Math.max(q.shield, 18);
        q.shieldUntil = this.t + 5;
        this.synergy("KORUYUCU BAĞ");
      }
      for (const e of this.grid.query(p.x, p.y, 180)) this.push(e, p, 100);
    }
    if (p.cls === "alchemist")
      for (const q of this.players)
        if (!q.dead && distance(q, p) < 380) this.heal(q, 20);
    if (p.cls === "shadow") {
      const old = { x: p.x, y: p.y };
      p.x = clamp(p.x + p.dx * 230, 20, B.world - 20);
      p.y = clamp(p.y + p.dy * 230, 20, B.world - 20);
      p.immuneUntil = this.t + 0.4;
      for (const e of this.grid.query(
        (p.x + old.x) / 2,
        (p.y + old.y) / 2,
        180,
      ))
        if (segmentDist(e, old, p) < 38) this.hit(e, p, 70, "dagger");
    }
    this.event("active", CLASSES[p.cls].name, { player: p.id, x: p.x, y: p.y });
  }
  heal(p, value, share = true) {
    if (p.dead) return;
    const actual = Math.min(
      p.maxHP - p.hp,
      value * (p.cls === "alchemist" ? 1.25 : 1),
    );
    p.hp += actual;
    if (share && this.bonds.includes("blood")) {
      const q = this.players.find((x) => x !== p && !x.dead);
      if (q) this.heal(q, actual * 0.15, false);
    }
  }
  hurt(p, value) {
    if (p.dead || p.immuneUntil > this.t) return;
    value *= 1 - this.stats(p).resist;
    if (p.shield > 0) {
      const a = Math.min(p.shield, value);
      p.shield -= a;
      value -= a;
      this.event("shield", "", { x: p.x, y: p.y });
    }
    if (value <= 0) return;
    p.hp -= value;
    p.reviveProgress = 0;
    p.immuneUntil = this.t + 0.4;
    p.hurtUntil = this.t + 0.32;
    this.event("hurt", "", { player: p.id, x: p.x, y: p.y, value: Math.round(value) });
    if (p.hp <= 0) this.down(p);
  }
  down(p) {
    if (p.dead) return;
    p.dead = true;
    p.hp = 0;
    p.deathCount++;
    this.deaths++;
    p.respawnAt =
      this.t + Math.min(B.reviveMax, B.reviveBase + (p.deathCount - 1) * 4);
    p.reviveUsed = false;
    p.last = false;
    p.shield = 0;
    const q = this.players.find((x) => x !== p);
    if (q && !q.dead) {
      q.last = true;
      q.hp += (q.maxHP - q.hp) * B.lastHeal;
      if (this.bonds.includes("revenge")) q.revengeUntil = this.t + 8;
      this.event("player_down", "SON NÖBET AKTİF!", { player: p.id });
    } else if (this.bonds.includes("chance") && !this.chanceUsed) {
      this.chanceUsed = true;
      p.dead = false;
      p.hp = p.maxHP * 0.2;
      p.immuneUntil = this.t + 2;
      p.last = true;
      this.event("synergy", "İKİNCİ ŞANS");
    } else this.end(false);
  }
  respawn(p) {
    const q = this.players.find((x) => x !== p && !x.dead);
    p.dead = false;
    p.hp = p.maxHP * 0.5;
    p.x = clamp((q?.x || p.x) + 45, 20, B.world - 20);
    p.y = q?.y || p.y;
    p.immuneUntil = this.t + 2;
    p.hurtUntil = 0;
    p.reviveProgress = 0;
    for (const v of this.players) {
      v.last = false;
      v.phoenixUntil = this.t + 4;
    }
    for (const e of this.grid.query(p.x, p.y, 240)) this.push(e, p, 120);
    this.synergy("ANKA BAĞI");
    this.event("player_respawn", "BAĞ YENİDEN DOĞDU", {
      x: p.x,
      y: p.y,
      player: p.id,
    });
  }
  end(win) {
    this.state = win ? "VICTORY" : "GAME_OVER";
    this.event("game_over", win ? "BOŞLUK YENİLDİ" : "SON BAĞ KOPTU");
  }
  push(e, p, amount) {
    const d = Math.max(1, distance(e, p));
    e.x = clamp(e.x + ((e.x - p.x) / d) * amount, 0, B.world);
    e.y = clamp(e.y + ((e.y - p.y) / d) * amount, 0, B.world);
  }
  spawn(type, x, y) {
    if (this.enemies.length >= this.enemyCap && type !== "boss") return;
    const c = ENEMIES[type],
      living = this.players.filter((p) => !p.dead),
      q = living[Math.floor(this.rand() * living.length)] || this.players[0],
      a = this.rand() * Math.PI * 2,
      range = this.t < 120 ? 440 : 580,
      scale = type === "boss" ? 1 : 1 + this.t / 650;
    const e = {
      id: this.id++,
      type,
      x: x ?? clamp(q.x + Math.cos(a) * range, 35, B.world - 35),
      y: y ?? clamp(q.y + Math.sin(a) * range, 35, B.world - 35),
      hp: c.hp * scale,
      maxHP: c.hp * scale,
      r: c.r,
      at: this.t + 1,
      hitAt: [-99, -99],
      markUntil: 0,
      wetUntil: 0,
      frozenUntil: 0,
      slowUntil: 0,
      burnUntil: 0,
      bleedUntil: 0,
      rootUntil: 0,
      fireSpreadAt: 0,
      statusAt: 0,
      attackCycle: 0,
    };
    this.enemies.push(e);
    return e;
  }
  commanderAttack(e, target, alive) {
    const boss = e.type === "boss", c = ENEMIES[e.type];
    const rage = boss && e.hp <= e.maxHP * 0.5;
    if (rage && !e.enraged) {
      e.enraged = true;
      this.event("boss_phase", "BOŞLUK ÖFKESİ · İkinci evre!", { x: e.x, y: e.y });
    }
    // Cycle through distinct, readable attacks instead of randomly repeating.
    const mode = e.attackCycle++ % (boss ? 4 : 3);
    const name = boss
      ? ["KÖK KIRILMASI", "YIKICI HÜCUM", "DİKEN ÇEMBERİ", "KARANLIK ÇAĞRI"][mode]
      : ["DİKEN EZİŞİ", "TOHUM SALVOSU", "ORMAN ÇAĞRISI"][mode];
    e.cast = { name, until: this.t + (mode === 3 ? 1.3 : 1) };
    this.event("boss_attack", name, { enemy: e.id, x: e.x, y: e.y });
    if (mode === 0) {
      for (const p of alive) {
        this.hazard(p.x, p.y, boss ? (rage ? 110 : 85) : 70, 1, c.damage, "enemy", null);
        if (rage) {
          // A delayed second bloom makes staying in the first impact unsafe.
          this.hazard(p.x + 110, p.y, 65, 1.7, c.damage * 0.8, "enemy", null);
          this.hazard(p.x - 110, p.y, 65, 1.7, c.damage * 0.8, "enemy", null);
        }
      }
    } else if (boss && mode === 1) {
      const d = distance(e, target) || 1;
      e.pendingCharge = { dx: (target.x - e.x) / d, dy: (target.y - e.y) / d,
        at: this.t + 1, until: this.t + 1.75 };
    } else if (mode === (boss ? 2 : 1)) {
      e.pendingVolley = { at: this.t + 1, angle: Math.atan2(target.y - e.y, target.x - e.x),
        count: boss ? (rage ? 16 : 12) : 5, ring: boss, damage: c.damage };
    } else {
      this.hazard(e.x, e.y, boss ? 145 : 100, 1.3, c.damage, "enemy", null);
      e.pendingSummon = { at: this.t + 1.3, count: boss ? (rage ? 6 : 4) : 3 };
    }
    e.at = this.t + (boss ? (rage ? 3 : 4.2) : 5);
  }
  nearest(p, r = 750) {
    let target = null,
      best = r;
    for (const e of this.grid.query(p.x, p.y, r)) {
      const d = distance(e, p);
      if (e.hp > 0 && d < best) {
        best = d;
        target = e;
      }
    }
    return target;
  }
  hit(e, p, raw, kind, secondary = false) {
    if (e.hp <= 0) return;
    const st = this.stats(p),
      crit = this.rand() < st.crit + (kind === "dagger" ? 0.1 : 0),
      i = this.players.indexOf(p),
      other = 1 - i;
    let damage = raw * st.damage * (crit ? 1.5 : 1);
    if (e.markUntil > this.t)
      damage *=
        e.type === "boss" && this.bonds.includes("target") ? 1.25 : 1.15;
    if (
      p.cls === "shadow" &&
      (e.slowUntil > this.t ||
        e.bleedUntil > this.t ||
        e.rootUntil > this.t ||
        e.wetUntil > this.t)
    )
      damage *= 1.25;
    if (e.type === "armor" && !["lightning", "poison", "spear"].includes(kind))
      damage *= 0.75;
    if (!secondary) {
      if (e.hitAt[other] > this.t - 2) {
        e.markUntil = this.t + 5;
        if (e.hitAt[i] <= this.t - 2) this.synergy("ORTAK HEDEF");
      }
      e.hitAt[i] = this.t;
      if (kind === "poison") {
        e.wetUntil = this.t + 5;
        e.poisonUntil = this.t + 4;
        e.poisonOwner = p.id;
      }
      if (kind === "ice") {
        e.slowUntil = this.t + 2 + 0.3 * (p.passives.cold || 0);
        e.iceHits = (e.iceHits || 0) + 1;
        if (e.iceHits % 3 === 0 || p.evolved.includes("ice")) {
          e.frozenUntil = this.t + 1 + 0.25 * (p.passives.cold || 0);
          e.freezeOwner = p.id;
        }
      }
      if (kind === "scythe") {
        e.bleedUntil = this.t + 4;
        e.bleedOwner = p.id;
      }
      if (kind === "meteor") {
        e.burnUntil = this.t + 4 + 0.4 * (p.passives.fire || 0);
        e.burnOwner = p.id;
      }
      if (kind === "roots") e.rootUntil = this.t + 1.2;
      if (
        e.frozenUntil > this.t &&
        e.freezeOwner !== p.id &&
        ["meteor", "shield", "mine", "sound"].includes(kind)
      ) {
        e.frozenUntil = 0;
        this.synergy("BUZ KIRICI");
        this.event("shatter", "", { x: e.x, y: e.y });
        for (const v of this.grid.query(e.x, e.y, 110))
          if (v !== e) this.hit(v, p, raw * 0.6, kind, true);
      }
      if (
        e.burnUntil > this.t &&
        e.burnOwner !== p.id &&
        ["wind", "sound"].includes(kind) &&
        e.fireSpreadAt <= this.t
      ) {
        e.fireSpreadAt = this.t + 3;
        this.synergy("ALEV FIRTINASI");
        for (const v of this.grid
          .query(e.x, e.y, 150)
          .filter((v) => v !== e)
          .slice(0, 3)) {
          v.burnUntil = this.t + 4;
          v.burnOwner = e.burnOwner;
        }
        this.event("tornado", "", { x: e.x, y: e.y });
      }
    }
    e.hp -= damage;
    p.damage += damage;
    this.event("hit", "", {
      x: e.x,
      y: e.y,
      value: Math.round(damage),
      crit,
      color: WEAPONS[kind]?.color || "#fff",
    });
    if (p.passives.vampire) {
      if (this.t - p.healWindow >= 1) {
        p.healWindow = this.t;
        p.healTotal = 0;
      }
      const h = Math.min(4 - p.healTotal, damage * 0.008 * p.passives.vampire);
      if (h > 0) {
        this.heal(p, h);
        p.healTotal += h;
      }
    }
    if (e.hp <= 0) {
      this.kills++;
      if (e.bleedUntil > this.t && e.bleedOwner !== p.id) {
        this.bloodAt = this.bloodAt.filter((t) => t > this.t - 1);
        if (this.bloodAt.length < 3) {
          this.bloodAt.push(this.t);
          for (const q of this.players) this.heal(q, 2);
          this.synergy("KAN KARDEŞLİĞİ");
        }
      }
      if (e.type === "boss") {
        this.end(true);
        return;
      }
      this.drop(e, ENEMIES[e.type].xp);
      this.event("kill", "", { x: e.x, y: e.y, color: ENEMIES[e.type].color });
      if (e.type === "burst")
        this.hazard(e.x, e.y, 75, 0.5, ENEMIES.burst.damage, "enemy", null);
      if (e.type === "elite") {
        this.eliteReward = true;
        this.event("chest", "ELITE SANDIĞI", { x: e.x, y: e.y });
      }
      if (this.rand() < 0.025) this.drop(e, 15, "health");
    }
  }
  drop(e, value, type = "xp") {
    if (this.loot.length >= B.maxLoot) {
      const v = this.loot.find((l) => l.type === type);
      if (v) v.value += value;
      return;
    }
    this.loot.push({ id: this.id++, x: e.x, y: e.y, value, type });
  }
  projectile(p, e, kind, damage, o = {}) {
    if (this.bullets.length >= B.maxBullets) return;
    const d = Math.max(1, distance(p, e)),
      b = this.pool.pop() || {};
    Object.assign(b, {
      id: this.id++,
      owner: p.id,
      kind,
      x: p.x,
      y: p.y,
      ox: p.x,
      oy: p.y,
      vx: ((e.x - p.x) / d) * (o.speed || 450),
      vy: ((e.y - p.y) / d) * (o.speed || 450),
      damage,
      life: o.life || 1.8,
      r: o.r || 7,
      pierce: o.pierce || 1,
      age: 0,
      hit: [],
      target: e.id,
      ...o,
    });
    this.bullets.push(b);
  }
  hazard(x, y, r, delay, damage, kind, owner, duration = 0) {
    if (this.hazards.length >= B.maxHazards) return;
    this.hazards.push({
      id: this.id++,
      x,
      y,
      r,
      at: this.t + delay,
      until: this.t + delay + duration,
      damage,
      kind,
      owner,
      hitAt: 0,
    });
  }
  attack(p, kind, lv) {
    const e = this.nearest(p);
    if (!e) return;
    const cfg = WEAPONS[kind],
      ev = p.evolved.includes(kind),
      st = this.stats(p);
    let damage = cfg.damage * (1 + 0.2 * (lv - 1)) * (ev ? 1.35 : 1);
    const n =
      1 +
      (lv >= 3 ? 1 : 0) +
      (this.rand() < 0.12 * (p.passives.double || 0) ? 1 : 0);
    if (kind === "lightning") {
      damage *= 1 + 0.12 * (p.passives.conduct || 0);
      let hits = [e],
        wet = e.wetUntil > this.t && e.poisonOwner !== p.id;
      if (wet) {
        damage *= 1.25;
        this.synergy("ELEKTRİK İLETKENİ");
      }
      let max =
        2 +
        Math.floor(lv / 2) +
        (wet ? 2 : 0) +
        (p.cls === "storm" && this.rand() < st.crit ? 1 : 0);
      for (let k = 0; k < max; k++) {
        const last = hits.at(-1),
          next = this.grid
            .query(last.x, last.y, 190)
            .find((v) => v.hp > 0 && !hits.includes(v));
        if (!next) break;
        hits.push(next);
      }
      let prev = p;
      for (const v of hits) {
        this.hit(v, p, damage, kind);
        this.event("bolt", "", {
          x: prev.x,
          y: prev.y,
          tx: v.x,
          ty: v.y,
          color: cfg.color,
        });
        prev = v;
      }
      if (ev && (!p.stormAt || p.stormAt <= this.t)) {
        p.stormAt = this.t + 5;
        for (const v of this.grid.query(p.x, p.y, 260))
          this.hit(v, p, damage, kind);
        this.event("nova", "", { x: p.x, y: p.y, r: 260, color: cfg.color });
      }
    } else if (kind === "scythe" || kind === "shield") {
      const r = (kind === "scythe" ? 100 : 85) * st.area + lv * 6;
      for (const v of this.grid.query(p.x, p.y, r)) {
        this.hit(v, p, damage, kind);
        if (kind === "shield") this.push(v, p, 22);
        if (ev && kind === "scythe") this.heal(p, 1);
      }
      if (ev && kind === "shield") {
        p.shield = Math.min(50, p.shield + 5);
        p.shieldUntil = this.t + 3;
        const q = this.players.find(
          (v) => v !== p && !v.dead && distance(v, p) < B.nearRange,
        );
        if (q) {
          q.shield = Math.min(25, q.shield + 2);
          q.shieldUntil = this.t + 3;
          this.synergy("KORUYUCU BAĞ");
        }
      }
      this.event("orbit", "", { x: p.x, y: p.y, r, color: cfg.color, kind });
    } else if (kind === "meteor") {
      for (let i = 0; i < (ev ? 3 : n); i++) {
        const v = i
          ? this.enemies[Math.floor(this.rand() * this.enemies.length)]
          : e;
        if (v) this.hazard(v.x, v.y, 85 * st.area, 0.7, damage, kind, p.id);
      }
    } else if (kind === "roots") {
      for (const v of this.grid.query(e.x, e.y, 95 * st.area))
        this.hit(v, p, damage, kind);
      this.event("roots", "", {
        x: e.x,
        y: e.y,
        r: 95 * st.area,
        color: cfg.color,
      });
    } else if (kind === "mine")
      this.hazard(e.x, e.y, 150 * st.area, 1.5, damage, kind, p.id);
    else if (kind === "poison")
      this.hazard(e.x, e.y, 95 * st.area, 0.25, damage, kind, p.id, 3);
    else if (kind === "sound") {
      const angle = Math.atan2(e.y - p.y, e.x - p.x);
      for (const v of this.grid.query(p.x, p.y, 270 * st.area))
        if (Math.cos(Math.atan2(v.y - p.y, v.x - p.x) - angle) > 0.65) {
          this.hit(v, p, damage, kind);
          this.push(v, p, 35);
        }
      this.event("cone", "", {
        x: p.x,
        y: p.y,
        angle,
        r: 270 * st.area,
        color: cfg.color,
      });
    } else if (kind === "spear") {
      const d = distance(e, p) || 1,
        end = {
          x: p.x + ((e.x - p.x) / d) * 650,
          y: p.y + ((e.y - p.y) / d) * 650,
        };
      for (const v of this.grid.query(
        (p.x + end.x) / 2,
        (p.y + end.y) / 2,
        360,
      ))
        if (segmentDist(v, p, end) < v.r + 10) this.hit(v, p, damage, kind);
      this.event("beam", "", {
        x: p.x,
        y: p.y,
        tx: end.x,
        ty: end.y,
        color: cfg.color,
      });
    } else
      for (let i = 0; i < n + (ev && kind === "bees" ? 3 : 0); i++) {
        const target =
          kind === "bees"
            ? this.enemies[Math.floor(this.rand() * this.enemies.length)] || e
            : e;
        this.projectile(p, target, kind, damage, {
          speed:
            kind === "dagger"
              ? 720
              : kind === "wind"
                ? 390
                : kind === "bees"
                  ? 240
                  : 480,
          pierce:
            kind === "ice"
              ? 2 + lv
              : kind === "dagger"
                ? 3
                : kind === "wind"
                  ? 99
                  : 1,
          life: kind === "wind" ? 1.7 : 2.2,
          r: kind === "wind" ? 16 : 6,
        });
      }
  }
  step(dt = B.tick) {
    if (!["PLAYING", "BOSS_FIGHT"].includes(this.state)) return;
    this.t += dt;
    this.tick++;
    this.grid.build(this.enemies);
    if (!this.bossSpawned && this.t >= B.match) {
      this.bossSpawned = true;
      this.state = "BOSS_FIGHT";
      this.spawn("boss");
      this.event("boss_spawn", "BOŞLUK EFENDİSİ");
    }
    if (this.t >= this.spawnAt) {
      const pool = ["rot", "rot", "runner",
        ...(this.t >= 25 ? ["spitter"] : []),
        ...(this.t >= 45 ? ["burst"] : []),
        ...(this.t >= 95 ? ["hunter"] : []),
        ...(this.t >= 135 ? ["mage"] : []),
        ...(this.t >= 180 ? ["armor"] : []),
      ];
      this.spawn(pool[Math.floor(this.rand() * pool.length)]);
      this.spawnAt = this.t + Math.max(0.22, 0.6 - this.t / 1000);
    }
    if (this.t >= (this.swarmAt ?? 24)) {
      for (let i = 0; i < 5; i++) this.spawn(i % 2 ? "runner" : "rot");
      this.swarmAt = this.t + 24;
      this.event("swarm", "SÜRÜ GELİYOR!");
    }
    if (this.t >= this.eliteAt) {
      this.spawn("elite");
      this.eliteAt = this.t + 95;
      this.event("elite_spawn", "DİKEN MUHAFIZI · Miniboss yaklaşıyor!");
    }
    const alive = this.players.filter((p) => !p.dead);
    if (!alive.length) {
      this.end(false);
      return;
    }
    for (const p of this.players) {
      const st = this.stats(p);
      if (p.inputAt < this.t - 0.5) p.input = { x: 0, y: 0, f: false };
      let dx = p.input.x,
        dy = p.input.y;
      if (!p.connected && !p.dead) {
        const e = this.nearest(p, 200);
        if (e) {
          const d = distance(p, e) || 1;
          dx = (p.x - e.x) / d;
          dy = (p.y - e.y) / d;
        }
      }
      const speed = p.dead
        ? B.speed * 0.55
        : p.dashUntil > this.t
          ? B.dashSpeed
          : st.speed;
      p.x = clamp(p.x + dx * speed * dt, 20, B.world - 20);
      p.y = clamp(p.y + dy * speed * dt, 20, B.world - 20);
      if (p.shieldUntil <= this.t) p.shield = 0;
      if (p.dead) {
        if (p.respawnAt <= this.t) this.respawn(p);
        else if (this.bonds.includes("ghost") && (p.ghostAt || 0) <= this.t) {
          const e = this.nearest(p);
          if (e) this.projectile(p, e, "ghost", 5, { speed: 180, life: 3 });
          p.ghostAt = this.t + 3;
        }
        continue;
      }
      const q = this.players.find((v) => v !== p);
      if (
        q?.dead &&
        !q.reviveUsed &&
        p.input.f &&
        distance(p, q) < B.reviveRange
      ) {
        p.reviveProgress += dt;
        if (p.reviveProgress >= B.reviveHold) {
          q.respawnAt = Math.max(this.t, q.respawnAt - B.reviveReduce);
          q.reviveUsed = true;
          p.reviveProgress = 0;
          this.event("rescue", "RUH KURTARILDI", { x: q.x, y: q.y });
        }
      } else p.reviveProgress = 0;
      for (const [kind, lv] of Object.entries(p.weapons))
        if ((p.weaponAt[kind] || 0) <= this.t) {
          this.attack(p, kind, lv);
          p.weaponAt[kind] =
            this.t + WEAPONS[kind].cd / (st.attack * (1 + 0.05 * (lv - 1)));
        }
      if (st.near && p === alive[0] && !this.nearWas) this.synergy("YAN YANA");
      if (st.near && this.tick % 20 === 0) {
        if (this.bonds.includes("chain") && p === alive[0])
          for (const e of this.grid.query(
            (p.x + q.x) / 2,
            (p.y + q.y) / 2,
            150,
          ))
            if (segmentDist(e, p, q) < 20)
              this.hit(e, p, 12, "lightning", true);
      }
      if (p === alive[0]) this.nearWas = st.near;
      if (
        this.bonds.includes("share") &&
        this.shareAt <= this.t &&
        p.hp < p.maxHP * 0.25 &&
        q &&
        !q.dead &&
        q.hp > q.maxHP * 0.5
      ) {
        const a = Math.min(q.maxHP * 0.1, p.maxHP - p.hp);
        q.hp -= a;
        this.heal(p, a, false);
        this.shareAt = this.t + 30;
        this.synergy("YAŞAM PAYLAŞIMI");
      }
    }
    for (const e of [...this.enemies]) {
      if (e.hp <= 0) continue;
      const target = alive.reduce((a, b) =>
          distance(e, a) < distance(e, b) ? a : b,
        ),
        c = ENEMIES[e.type],
        d = distance(e, target) || 1,
        dx = (target.x - e.x) / d,
        dy = (target.y - e.y) / d;
      let speed = c.speed * (e.slowUntil > this.t ? 0.5 : 1);
      if (e.frozenUntil > this.t || e.rootUntil > this.t) speed = 0;
      if (e.type === "spitter" && d < 310) speed = d < 210 ? -30 : 0;
      if (e.type === "hunter" && e.at <= this.t) {
        e.charge = { dx, dy, until: this.t + 0.45 };
        e.at = this.t + 4;
        this.event("hunter", "", {
          x: e.x,
          y: e.y,
          tx: target.x,
          ty: target.y,
        });
      }
      if (e.charge?.until > this.t) {
        e.x += e.charge.dx * 350 * dt;
        e.y += e.charge.dy * 350 * dt;
      } else {
        e.x += dx * speed * dt;
        e.y += dy * speed * dt;
      }
      if (this.tick % 2 === 0 && e.type !== "boss")
        for (const v of this.grid.query(e.x, e.y, e.r + 20)) {
          if (v === e) continue;
          const gap = distance(e, v);
          if (gap < e.r + v.r && gap > 0.1) {
            e.x += ((e.x - v.x) / gap) * 2;
            e.y += ((e.y - v.y) / gap) * 2;
          }
        }
      e.x = clamp(e.x, 0, B.world);
      e.y = clamp(e.y, 0, B.world);
      for (const p of alive)
        if (distance(e, p) < e.r + 15) this.hurt(p, c.damage);
      if (e.at <= this.t) {
        if (e.type === "spitter") {
          this.projectile(
            { id: null, x: e.x, y: e.y },
            target,
            "enemy",
            c.damage,
            { speed: 155, r: 9, life: 5 },
          );
          e.at = this.t + 2.4;
        } else if (e.type === "mage") {
          this.hazard(target.x, target.y, 75, 1.1, c.damage, "enemy", null);
          e.at = this.t + 3.5;
        } else if (e.type === "boss" || e.type === "elite") {
          this.commanderAttack(e, target, alive);
        }
      }
      if (e.pendingVolley && this.t >= e.pendingVolley.at) {
        const v = e.pendingVolley;
        for (let i = 0; i < v.count; i++) {
          const a = v.angle + (v.ring ? i * Math.PI * 2 / v.count : (i - 2) * 0.22);
          this.projectile({ id: null, x: e.x, y: e.y },
            { x: e.x + Math.cos(a) * 100, y: e.y + Math.sin(a) * 100 },
            "orb", v.damage, { speed: v.ring ? 145 : 180, r: v.ring ? 12 : 8, life: 5 });
        }
        e.pendingVolley = null;
      }
      if (e.pendingSummon && this.t >= e.pendingSummon.at) {
        for (let i = 0; i < e.pendingSummon.count; i++) {
          const a = i * Math.PI * 2 / e.pendingSummon.count;
          this.spawn(i % 2 ? "rot" : "runner", e.x + Math.cos(a) * 95, e.y + Math.sin(a) * 95);
        }
        e.pendingSummon = null;
      }
      if (e.pendingCharge && this.t >= e.pendingCharge.at) {
        if (this.t < e.pendingCharge.until) {
          e.x += e.pendingCharge.dx * 450 * dt;
          e.y += e.pendingCharge.dy * 450 * dt;
        } else e.pendingCharge = null;
      }
      if (e.statusAt <= this.t) {
        e.statusAt = this.t + 0.6;
        for (const [key, owner, kind, a] of [
          ["burnUntil", "burnOwner", "meteor", 4],
          ["bleedUntil", "bleedOwner", "scythe", 3],
          ["poisonUntil", "poisonOwner", "poison", 3],
        ])
          if (e[key] > this.t) {
            const p = this.players.find((p) => p.id === e[owner]);
            if (p)
              this.hit(
                e,
                p,
                a * (kind === "meteor" ? 1 + 0.2 * (p.passives.fire || 0) : 1),
                kind,
                true,
              );
          }
      }
    }
    this.grid.build(this.enemies);
    for (const b of this.bullets) {
      b.age += dt;
      b.life -= dt;
      const old = { x: b.x, y: b.y },
        p = this.players.find((p) => p.id === b.owner);
      if (b.kind === "bees") {
        const e =
          this.enemies.find((e) => e.id === b.target && e.hp > 0) ||
          this.nearest(b, 500);
        if (e) {
          const d = distance(b, e) || 1;
          b.vx += ((e.x - b.x) / d) * 600 * dt;
          b.vy += ((e.y - b.y) / d) * 600 * dt;
          const m = Math.hypot(b.vx, b.vy) || 1;
          b.vx = (b.vx / m) * 280;
          b.vy = (b.vy / m) * 280;
        }
      }
      if (b.kind === "wind" && b.age > 0.75 && p) {
        const d = distance(b, p) || 1;
        b.vx = ((p.x - b.x) / d) * 450;
        b.vy = ((p.y - b.y) / d) * 450;
        if (d < 20) b.life = 0;
      }
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      if (!b.owner) {
        for (const p of alive)
          if (segmentDist(p, old, b) < b.r + 15) {
            this.hurt(p, b.damage);
            b.life = 0;
            break;
          }
      } else if (p)
        for (const e of this.grid.query(
          (old.x + b.x) / 2,
          (old.y + b.y) / 2,
          50,
        )) {
          if (b.hit.includes(e.id) || segmentDist(e, old, b) > e.r + b.r)
            continue;
          this.hit(e, p, b.damage, b.kind);
          b.hit.push(e.id);
          if (b.kind === "wind") this.push(e, p, 25);
          if (--b.pierce <= 0) {
            b.life = 0;
            break;
          }
        }
    }
    const keep = [];
    for (const b of this.bullets)
      if (
        b.life > 0 &&
        b.x >= -50 &&
        b.y >= -50 &&
        b.x <= B.world + 50 &&
        b.y <= B.world + 50
      )
        keep.push(b);
      else if (this.pool.length < 100) this.pool.push(b);
    this.bullets = keep;
    for (const h of [...this.hazards]) {
      if (h.kind === "mine" && h.at > this.t)
        for (const e of this.grid.query(h.x, h.y, h.r))
          this.push(e, h, -45 * dt);
      if (h.at <= this.t && h.hitAt <= this.t) {
        h.hitAt = this.t + 0.5;
        const p = this.players.find((p) => p.id === h.owner);
        if (p) {
          for (const e of this.grid.query(h.x, h.y, h.r))
            this.hit(e, p, h.damage, h.kind);
          if (h.kind === "meteor" && p.evolved.includes("meteor"))
            this.hazard(
              h.x,
              h.y,
              h.r * 0.7,
              0.1,
              h.damage * 0.25,
              "poison",
              p.id,
              2,
            );
        } else
          for (const p of alive)
            if (distance(h, p) < h.r + 15) this.hurt(p, h.damage);
        if (!h.fired) {
          this.event("nova", "", {
            x: h.x,
            y: h.y,
            r: h.r,
            color: WEAPONS[h.kind]?.color || "#ff697e",
          });
          h.fired = true;
        }
      }
    }
    this.hazards = this.hazards.filter((h) => this.t <= h.until);
    this.enemies = this.enemies.filter((e) => e.hp > 0);
    this.loot = this.loot.filter((l) => {
      for (const p of alive) {
        const d = distance(l, p);
        if (d < this.stats(p).magnet) {
          const move = Math.min(d, 400 * dt);
          l.x += ((p.x - l.x) / (d || 1)) * move;
          l.y += ((p.y - l.y) / (d || 1)) * move;
        }
        if (d < 22) {
          if (l.type === "health") this.heal(p, l.value);
          else this.xp += l.value;
          this.event("collect", "", {
            x: l.x,
            y: l.y,
            color: l.type === "health" ? "#ff7189" : "#70eadc",
          });
          return false;
        }
      }
      return true;
    });
    if (["VICTORY", "GAME_OVER"].includes(this.state)) return;
    if (this.eliteReward) {
      this.eliteReward = false;
      this.evolve();
      const a = Object.keys(BONDS).filter((k) => !this.bonds.includes(k));
      if (a.length && this.bonds.length < 3) {
        this.beginOffer("bond", a);
        return;
      }
    }
    if (this.xp >= this.need) {
      this.xp -= this.need;
      this.level++;
      this.need = Math.round(B.xpBase * Math.pow(this.level, B.xpGrowth));
      this.beginOffer("normal");
    }
  }
  evolve() {
    for (const p of this.players)
      for (const [k, ev] of Object.entries(EVOLUTIONS))
        if (
          p.weapons[k] === 5 &&
          (p.passives[ev.passive] || 0) >= 2 &&
          !p.evolved.includes(k)
        ) {
          p.evolved.push(k);
          this.event("evolution", ev.name, { x: p.x, y: p.y, player: p.id });
        }
  }
  beginOffer(kind, available = []) {
    this.resumeState = this.state;
    this.state = "UPGRADE_SELECTION";
    this.offerRevision++;
    this.offerKind = kind;
    this.choices = {};
    this.offers = {};
    if (kind === "bond") {
      this.teamOffer = this.shuffle(available).slice(0, 3);
      for (const p of this.players)
        this.offers[p.id] = this.teamOffer.map((key) => ({
          key,
          type: "bond",
          rarity: "legendary",
          ...BONDS[key],
        }));
    } else
      for (const p of this.players) {
        const a = [];
        for (const [key, c] of Object.entries(WEAPONS))
          if (
            (p.weapons[key] || 0) < 5 &&
            (p.weapons[key] || Object.keys(p.weapons).length < 4)
          )
            a.push({
              key,
              type: "weapon",
              ...c,
              level: (p.weapons[key] || 0) + 1,
            });
        for (const [key, c] of Object.entries(PASSIVES))
          if (
            (p.passives[key] || 0) < 5 &&
            (p.passives[key] || Object.keys(p.passives).length < 5)
          )
            a.push({
              key,
              type: "passive",
              ...c,
              level: (p.passives[key] || 0) + 1,
            });
        if (!a.length)
          a.push({
            key: "heal",
            type: "heal",
            name: "Can Tazeleme",
            desc: "Maksimum canın %35’i iyileşir.",
          });
        this.offers[p.id] = this.shuffle(a)
          .slice(0, 3)
          .map((c) => ({
            ...c,
            rarity: ["common", "rare", "epic", "legendary"][
              Math.floor(this.rand() * 4)
            ],
          }));
      }
    this.event(
      "upgrade_offer",
      kind === "bond" ? "BAĞ KARTI" : "TAKIM SEVİYE ATLADI",
    );
  }
  shuffle(a) {
    a = [...a];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(this.rand() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  choose(id, index, revision) {
    if (
      this.state !== "UPGRADE_SELECTION" ||
      revision !== this.offerRevision ||
      !Number.isInteger(index) ||
      !this.offers[id]?.[index] ||
      this.choices[id] !== undefined
    )
      return false;
    this.choices[id] = index;
    return true;
  }
  resolveOffer() {
    if (this.state !== "UPGRADE_SELECTION") return;
    for (const p of this.players)
      if (this.choices[p.id] === undefined) this.choices[p.id] = 0;
    if (this.offerKind === "bond") {
      const a = Object.values(this.choices),
        i = a.every((i) => i === a[0])
          ? a[0]
          : a[Math.floor(this.rand() * a.length)],
        k = this.teamOffer[i];
      if (!this.bonds.includes(k)) this.bonds.push(k);
      this.event("synergy", BONDS[k].name);
    } else
      for (const p of this.players) {
        const c = this.offers[p.id][this.choices[p.id]];
        if (c.type === "weapon") p.weapons[c.key] = c.level;
        else if (c.type === "passive") {
          p.passives[c.key] = c.level;
          if (c.key === "steel") {
            p.maxHP += 12;
            if (!p.dead) p.hp += 12;
          }
        } else this.heal(p, p.maxHP * 0.35);
      }
    this.state = this.resumeState;
    this.offers = {};
    this.choices = {};
  }
  checkpoint() {
    const { grid, pool, events, ...data } = this;
    return JSON.stringify({ version: 1, data });
  }
  static restore(json) {
    const v = JSON.parse(json);
    if (v.version !== 1) throw Error("Checkpoint sürümü desteklenmiyor");
    const g = new Game();
    Object.assign(g, v.data);
    g.grid = new Grid();
    g.pool = [];
    g.events = [];
    return g;
  }
  snapshot() {
    const q = (v) => Math.round(v * 2) / 2;
    return {
      tick: this.tick,
      time: q(this.t),
      state: this.state,
      level: this.level,
      xp: this.xp,
      need: this.need,
      kills: this.kills,
      deaths: this.deaths,
      score: Math.max(
        0,
        Math.round(this.kills * 10 + this.t * 2 - this.deaths * 100),
      ),
      bonds: this.bonds,
      synergies: this.synergies,
      enemyCap: this.enemyCap,
      runtimeLostMs: this.runtimeLostMs,
      players: this.players.map((p) => ({
        ...Object.fromEntries(
          [
            "id",
            "name",
            "cls",
            "ready",
            "connected",
            "dead",
            "weapons",
            "passives",
            "evolved",
            "damage",
            "last",
            "seq",
            "reviveUsed",
          ].map((k) => [k, p[k]]),
        ),
        x: q(p.x),
        y: q(p.y),
        hp: q(p.hp),
        maxHP: p.maxHP,
        shield: q(p.shield),
        speed: q(this.stats(p).speed),
        attack: q(this.stats(p).attack),
        near: !!this.stats(p).near,
        reviveProgress: q(p.reviveProgress),
        respawnIn: q(Math.max(0, p.respawnAt - this.t)),
        dashIn: q(Math.max(0, p.dashAt - this.t)),
        activeIn: q(Math.max(0, p.activeAt - this.t)),
        immune: p.immuneUntil > this.t,
        hurt: (p.hurtUntil || 0) > this.t,
      })),
      enemies: this.enemies.map((e) => ({
        id: e.id,
        type: e.type,
        x: q(e.x),
        y: q(e.y),
        hp: q(e.hp),
        maxHP: q(e.maxHP),
        r: e.r,
        frozen: e.frozenUntil > this.t,
        wet: e.wetUntil > this.t,
        marked: e.markUntil > this.t,
        burn: e.burnUntil > this.t,
        enraged: !!e.enraged,
        cast: e.cast?.until > this.t ? e.cast.name : "",
        charge: e.pendingCharge && this.t < e.pendingCharge.at ? {
          tx: q(e.x + e.pendingCharge.dx * 420),
          ty: q(e.y + e.pendingCharge.dy * 420),
          left: q(e.pendingCharge.at - this.t),
        } : null,
      })),
      bullets: this.bullets.map((b) => ({
        id: b.id,
        kind: b.kind,
        x: q(b.x),
        y: q(b.y),
        vx: q(b.vx),
        vy: q(b.vy),
        r: b.r,
      })),
      hazards: this.hazards.map((h) => ({
        id: h.id,
        x: q(h.x),
        y: q(h.y),
        r: q(h.r),
        kind: h.kind,
        left: q(Math.max(0, h.at - this.t)),
      })),
      loot: this.loot.map((l) => ({
        id: l.id,
        x: q(l.x),
        y: q(l.y),
        type: l.type,
        value: l.value,
      })),
    };
  }
}
