import { test } from "node:test";
import assert from "node:assert/strict";
import { Game, B, WEAPONS, PASSIVES, EVOLUTIONS, BONDS } from "../engine.js";
import { parseMessage, deltaSnapshot } from "../protocol.js";
function game(a = "tank", b = "alchemist") {
  const g = new Game(123);
  g.addPlayer("a", "A", a);
  g.addPlayer("b", "B", b);
  g.start(1000);
  g.spawnAt = 9999;
  g.eliteAt = 9999;
  return g;
}
function advance(g, sec) {
  for (let i = 0; i < sec / B.tick; i++) g.step();
}
test("direction is normalized; replay and invalid inputs do not mutate state", () => {
  const g = game();
  assert(g.input("a", { seq: 0, x: 1, y: 1, f: false }));
  advance(g, 0.1);
  assert(
    Math.abs(Math.hypot(g.players[0].x - 1400, g.players[0].y - 1400) - 21) <
      0.001,
  );
  assert(!g.input("a", { seq: 0, x: 0, y: 0, f: false }));
  assert(!g.input("a", { seq: 1, x: Infinity, y: 0, f: false }));
  assert(!g.input("a", { seq: 1, x: 2, y: 0, f: false }));
});
test("Last Stand exactly heals half missing HP; buffs never stack; ghost cannot attack", () => {
  const g = game("shadow", "alchemist"),
    [a, b] = g.players;
  b.hp = 20;
  g.down(a);
  assert.equal(b.hp, 60);
  assert.equal(g.stats(b).speed, 315);
  assert.equal(g.stats(b).attack, 1.5);
  assert.equal(g.stats(b).resist, 0.2);
  g.down(a);
  assert.equal(b.hp, 60);
  assert.equal(g.deaths, 1);
  const enemy = g.spawn("armor", a.x + 30, a.y);
  g.grid.build(g.enemies);
  b.weapons = {};
  advance(g, 1);
  assert.equal(enemy.hp, enemy.maxHP);
  assert(a.dead);
});
test("respawn nearby at half HP, invulnerability, phoenix and buff removed", () => {
  const g = game(),
    [a, b] = g.players;
  g.down(a);
  advance(g, 22.1);
  assert(!a.dead);
  assert.equal(a.hp, a.maxHP * 0.5);
  assert(!b.last);
  assert(a.immuneUntil > g.t);
  assert(g.synergies["ANKA BAĞI"]);
  assert(Math.hypot(a.x - b.x, a.y - b.y) < 80);
});
test("F rescue continuous 3s once per death; damage interrupts", () => {
  const g = game(),
    [a, b] = g.players;
  g.down(b);
  const input = () => g.input("a", { seq: a.seq + 1, x: 0, y: 0, f: true });
  for (let i = 0; i < 30; i++) {
    input();
    g.step();
  }
  assert(a.reviveProgress > 1);
  g.hurt(a, 10);
  assert.equal(a.reviveProgress, 0);
  for (let i = 0; i < 61; i++) {
    input();
    g.step();
  }
  assert(b.reviveUsed);
  assert(b.respawnAt < 22);
  const at = b.respawnAt;
  for (let i = 0; i < 80; i++) {
    input();
    g.step();
  }
  assert.equal(b.respawnAt, at);
});
test("simultaneous death ends game; second chance works once", () => {
  const g = game();
  g.down(g.players[0]);
  g.down(g.players[1]);
  assert.equal(g.state, "GAME_OVER");
  const h = game();
  h.bonds = ["chance"];
  h.down(h.players[0]);
  h.down(h.players[1]);
  assert.equal(h.state, "PLAYING");
  assert.equal(h.players[1].hp, 20);
  h.players[1].immuneUntil = 0;
  h.down(h.players[1]);
  assert.equal(h.state, "GAME_OVER");
});
test("repeated death increases timer with cap", () => {
  const g = game();
  const a = g.players[0];
  for (const expected of [22, 26, 30, 34, 35]) {
    g.down(a);
    assert.equal(a.respawnAt - g.t, expected);
    g.respawn(a);
  }
  assert.equal(g.deaths, 5);
});
test("shared XP pauses every simulation clock; both independent choices apply once", () => {
  const g = game();
  g.xp = g.need;
  g.step();
  assert.equal(g.state, "UPGRADE_SELECTION");
  assert.equal(g.level, 2);
  const time = g.t;
  advance(g, 2);
  assert.equal(g.t, time);
  for (const p of g.players) {
    assert.equal(g.offers[p.id].length, 3);
    assert(g.choose(p.id, 0, g.offerRevision));
    assert(!g.choose(p.id, 1, g.offerRevision));
  }
  g.resolveOffer();
  assert.equal(g.state, "PLAYING");
  assert.equal(Object.keys(g.offers).length, 0);
  assert(!g.choose("a", 0, g.offerRevision));
});
test("all 13 weapons do actual damage or create different attack entities", () => {
  for (const key of Object.keys(WEAPONS)) {
    const g = game("storm", "shadow"),
      p = g.players[0];
    g.players[1].weapons = {};
    p.weapons = { [key]: 3 };
    const e = g.spawn("armor", p.x + 50, p.y);
    g.grid.build(g.enemies);
    g.attack(p, key, 3);
    for (let i = 0; i < 50; i++) g.step();
    assert(e.hp < e.maxHP, key + " never damaged");
  }
});
test("8 synergies including elemental ownership and cooldowns", () => {
  const g = game("storm", "alchemist"),
    [a, b] = g.players;
  const e = g.spawn("armor", 1420, 1400),
    v = g.spawn("armor", 1450, 1400);
  e.hp = e.maxHP = 10000;
  v.hp = v.maxHP = 10000;
  g.grid.build(g.enemies);
  g.hit(e, b, 1, "poison");
  g.attack(a, "lightning", 1);
  assert(g.synergies["ELEKTRİK İLETKENİ"]);
  assert(g.synergies["ORTAK HEDEF"]);
  for (let i = 0; i < 3; i++) g.hit(e, b, 1, "ice");
  g.hit(e, a, 1, "meteor");
  assert(g.synergies["BUZ KIRICI"]);
  g.hit(e, b, 1, "meteor");
  g.hit(e, a, 1, "wind");
  assert(g.synergies["ALEV FIRTINASI"]);
  a.hp = 30;
  b.hp = 30;
  g.hit(e, b, 1, "scythe");
  g.hit(e, a, 20000, "dagger");
  assert(g.synergies["KAN KARDEŞLİĞİ"]);
  const h = game("tank", "shadow");
  h.active(h.players[0]);
  assert(h.players[1].shield === 18);
  assert(h.synergies["KORUYUCU BAĞ"]);
  advance(h, 1.1);
  assert(h.synergies["YAN YANA"]);
  h.down(h.players[1]);
  h.respawn(h.players[1]);
  assert(h.synergies["ANKA BAĞI"]);
});
test("6 evolutions require level5, passive2, elite reward and alter attacks", () => {
  assert.equal(Object.keys(EVOLUTIONS).length, 6);
  for (const [k, e] of Object.entries(EVOLUTIONS)) {
    const g = game(),
      p = g.players[0];
    p.weapons = { [k]: 5 };
    p.passives = { [e.passive]: 1 };
    g.evolve();
    assert(!p.evolved.length);
    p.passives[e.passive] = 2;
    g.evolve();
    assert(p.evolved.includes(k));
  }
});
test("bond voting resolves only an offered card and at most one", () => {
  const g = game();
  assert.equal(Object.keys(BONDS).length, 8);
  g.beginOffer("bond", Object.keys(BONDS));
  g.choose("a", 1, g.offerRevision);
  g.choose("b", 1, g.offerRevision);
  const selected = g.teamOffer[1];
  g.resolveOffer();
  assert.deepEqual(g.bonds, [selected]);
});
test("boss spawn at 12 minutes; death produces VICTORY", () => {
  const g = game();
  g.t = 719.99;
  g.step();
  assert.equal(g.state, "BOSS_FIGHT");
  const boss = g.enemies.find((e) => e.type === "boss");
  assert(boss);
  g.hit(boss, g.players[0], 100000, "lightning");
  assert.equal(g.state, "VICTORY");
});
test("checkpoint restores deterministic world and strips runtime objects", () => {
  const g = game();
  g.spawn("rot");
  advance(g, 0.5);
  const restored = Game.restore(g.checkpoint());
  assert.deepEqual(restored.snapshot(), g.snapshot());
  g.step();
  restored.step();
  assert.deepEqual(restored.snapshot(), g.snapshot());
  assert.throws(() => Game.restore('{"version":2}'));
});
test("strict schemas reject tampering, oversized payload, JSON, unknown messages", () => {
  for (const raw of [
    "bad",
    "{}",
    "[]",
    '{"type":"input","seq":1,"x":0,"y":0,"f":false,"hp":999}',
    '{"type":"ping","time":1e999}',
    '{"type":"join","token":"' + "a".repeat(2000) + '"}',
  ])
    assert.throws(() => parseMessage(raw));
  assert.equal(
    parseMessage('{"type":"input","seq":1,"x":0,"y":0,"f":false}').type,
    "input",
  );
});
test("delta snapshots remove entities and include changed IDs only", () => {
  const g = game();
  const s1 = g.snapshot();
  g.spawn("rot", 1600, 1400);
  const s2 = g.snapshot(),
    delta = deltaSnapshot(s1, s2);
  assert(!delta.full);
  assert.equal(delta.data.enemies.length, 1);
  assert.equal(deltaSnapshot(s2, s2).data.enemies.length, 0);
  g.enemies = [];
  assert.equal(deltaSnapshot(s2, g.snapshot()).removed.enemies.length, 1);
});
test("passive and active slot limits offer no impossible acquisitions", () => {
  const g = game();
  const p = g.players[0];
  p.weapons = Object.fromEntries(
    Object.keys(WEAPONS)
      .slice(0, 4)
      .map((k) => [k, 5]),
  );
  p.passives = Object.fromEntries(
    Object.keys(PASSIVES)
      .slice(0, 5)
      .map((k) => [k, 5]),
  );
  g.beginOffer("normal");
  assert.equal(g.offers.a[0].type, "heal");
});
