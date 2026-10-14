import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../engine.js';
import { loadClient } from './client-fixture.mjs';
function client() {
  const c = loadClient(), g = new Game(123);
  g.addPlayer('a', 'A'); g.addPlayer('b', 'B', 'storm'); g.start();
  c.snapshot(g.snapshot()); c.evaluate('initAudio()');
  return { c, g };
}
test('own damage flashes and plays a distinct hit sound, including with particles disabled', () => {
  const { c, g } = client(); c.elements.get('particles').checked = false;
  g.hurt(g.players[0], 1);
  c.evaluate(`receive({type:'game_event',events:${JSON.stringify(g.events.filter(e => e.type === 'hurt'))}})`);
  const diag = c.evaluate('lastBondDiagnostics()');
  assert.equal(diag.localHurtCount, 1); assert.equal(diag.audioState, 'running');
  assert(c.audioCalls.some(([kind, value]) => kind === 'noise' && value === 'start'));
  assert(c.audioCalls.some(([kind, value]) => kind === 'oscillator' && value === 170));
  c.evaluate('actor(snap.players[0], 1)');
  assert.equal(c.evaluate(`spriteCache.has('tank:hurt')`), true);
  assert(c.calls.some(v => v.op === 'fillRect' && v.args[1] < -30 && v.color === '#ee7460'));
  c.setNow(1400); c.calls.length = 0; c.evaluate('actor(snap.players[0], 1.4)');
  assert(c.calls.some(v => v.op === 'fillRect' && v.color === '#b4d985'));
});
test('mute suppresses damage audio, teammate damage does not play your hit sound, events deduplicate', () => {
  const { c, g } = client();
  const event = { id: 500, type: 'hurt', player: 'b', x: 1470, y: 1400, value: 5 };
  c.evaluate(`receive({type:'game_event',events:[${JSON.stringify(event)}]})`);
  assert.equal(c.audioCalls.length, 0); assert.equal(c.evaluate('localHurtCount'), 0);
  c.elements.get('sound').checked = false; event.id++; event.player = 'a';
  const code = `receive({type:'game_event',events:[${JSON.stringify(event)}]})`;
  c.evaluate(code); c.evaluate(code);
  assert.equal(c.audioCalls.length, 0); assert.equal(c.evaluate('localHurtCount'), 1);
});
test('all classes and enemy types draw in both quality modes, warnings remain visible', () => {
  const { c, g } = client();
  for (const type of ['rot','runner','spitter','burst','armor','mage','hunter','elite','boss'])
    g.spawn(type, 1400 + g.enemies.length * 5, 1550);
  const boss = g.enemies.find(e => e.type === 'boss'); boss.attackCycle = 1;
  g.commanderAttack(boss, g.players[0], g.players);
  c.snapshot(g.snapshot());
  for (const quality of [1, .5]) {
    c.calls.length = 0; c.evaluate(`quality = ${quality}; renderWorld(1100,.016); updateHUD();`);
    assert(c.calls.some(v => v.op === 'fillText' && v.args[0] === 'YIKICI HÜCUM'));
    assert(c.calls.some(v => v.op === 'lineTo'));
  }
  c.evaluate(`for(const cls of Object.keys(CL)) actor({...snap.players[0], cls}, 1)`);
  assert.equal(c.evaluate('spriteCache.size >= 13'), true);
  assert.equal(c.evaluate('lastBondDiagnostics().visualTheme'), 'pixel-meadow-v2');
});
