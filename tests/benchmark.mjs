import { getHeapStatistics } from "node:v8";
import { Game, B, WEAPONS } from "../engine.js";
import { deltaSnapshot } from "../protocol.js";
const g = new Game(333);
const p = g.addPlayer("a", "A", "storm"),
  q = g.addPlayer("b", "B", "alchemist");
g.start();
g.spawnAt = 1e9;
g.eliteAt = 1e9;
g.t = 400;
g.bossSpawned = true;
g.xp = -1e9;
p.weapons = { lightning: 5, ice: 5, bees: 5, scythe: 5 };
q.weapons = { poison: 5, meteor: 5, wind: 5, mine: 5 };
p.immuneUntil = q.immuneUntil = 1e9;
p.passives = { conduct: 5, double: 5, hands: 5 };
q.passives = { area: 5, hands: 5 };
g.enemyCap = 150;
const durations = [],
  sizes = [],
  deltas = [];
let previous = null,
  maxBullets = 0,
  maxEnemies = 0,
  peakHeap = 0;
const startHeap = getHeapStatistics().used_heap_size;
for (let i = 0; i < 18000; i++) {
  while (g.enemies.length < 150) {
    const a = g.rand() * Math.PI * 2;
    const e = g.spawn(
      "armor",
      1400 + Math.cos(a) * 300,
      1400 + Math.sin(a) * 300,
    );
    e.hp = e.maxHP = 20000;
  }
  g.input("a", {
    seq: i,
    x: Math.cos(i * 0.01),
    y: Math.sin(i * 0.01),
    f: false,
  });
  g.input("b", {
    seq: i,
    x: Math.cos(i * 0.01 + 1),
    y: Math.sin(i * 0.01 + 1),
    f: false,
  });
  // Synthetic stress fixture: saturate projectile cap for final 150 seconds.
  if (i >= 15000) {
    while (g.bullets.length < B.maxBullets) {
      const e = g.enemies[Math.floor(g.rand() * g.enemies.length)];
      g.projectile(p, e, "ice", 1, { speed: 90, life: 10, pierce: 8 });
    }
    maxBullets = Math.max(maxBullets, g.bullets.length);
  }
  const start = performance.now();
  g.step();
  durations.push(performance.now() - start);
  g.events = [];
  if (g.state === "UPGRADE_SELECTION") g.resolveOffer();
  if (i % 2 === 0) {
    const s = g.snapshot();
    if (i % 100 === 0) {
      sizes.push(Buffer.byteLength(JSON.stringify(s)));
      deltas.push(
        Buffer.byteLength(JSON.stringify(deltaSnapshot(previous, s))),
      );
    }
    previous = s;
  }
  maxBullets = Math.max(maxBullets, g.bullets.length);
  maxEnemies = Math.max(maxEnemies, g.enemies.length);
  if (i % 100 === 0)
    peakHeap = Math.max(peakHeap, getHeapStatistics().used_heap_size);
}
durations.sort((a, b) => a - b);
const result = {
  environment:
    "Node " + process.version + " local CPU; NOT Cloudflare CPU or GB-s",
  simulatedSeconds: 900,
  ticks: 18000,
  targetEnemies: 150,
  synthetic450BulletStressSeconds: 150,
  maxEnemies,
  maxBullets,
  meanTickMs: durations.reduce((a, b) => a + b, 0) / durations.length,
  p95TickMs: durations[Math.floor(durations.length * 0.95)],
  p99TickMs: durations[Math.floor(durations.length * 0.99)],
  maxTickMs: durations.at(-1),
  meanFullBytes: sizes.reduce((a, b) => a + b, 0) / sizes.length,
  meanDeltaBytes: deltas.reduce((a, b) => a + b, 0) / deltas.length,
  heapStartMB: startHeap / 1048576,
  heapEndMB: getHeapStatistics().used_heap_size / 1048576,
  peakHeapMB: peakHeap / 1048576,
  bounded: {
    enemies: g.enemies.length,
    bullets: g.bullets.length,
    loot: g.loot.length,
    hazards: g.hazards.length,
    pool: g.pool.length,
  },
};
console.log(JSON.stringify(result, null, 2));
