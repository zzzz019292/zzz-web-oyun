// In-memory DOM/audio adapter for exercising the shipped client, without a browser.
import vm from 'node:vm';
import fs from 'node:fs';
export function loadClient(canvasFactory) {
  const calls = [], audioCalls = [];
  function mockCanvas() {
    const canvas = { width: 1, height: 1 };
    const ctx = new Proxy({ canvas }, {
      get(o, key) {
        if (key in o) return o[key];
        if (key === 'createRadialGradient') return () => ({ addColorStop() {} });
        return (...args) => calls.push({ op: key, args, color: o.fillStyle });
      },
      set(o, key, value) { o[key] = value; return true; },
    });
    canvas.getContext = () => ctx; return canvas;
  }
  function node(kind) {
    const param = { value: 0, setValueAtTime(v) { audioCalls.push([kind, v]); }, exponentialRampToValueAtTime() {} };
    return { frequency: param, gain: param, connect() {}, disconnect() {},
      start() { audioCalls.push([kind, 'start']); }, stop() {} };
  }
  class AudioContext {
    state = 'running'; currentTime = 1; sampleRate = 8000; destination = {};
    createOscillator() { return node('oscillator'); }
    createGain() { return node('gain'); }
    createBufferSource() { return node('noise'); }
    createBiquadFilter() { return node('filter'); }
    createBuffer(ch, size) { return { getChannelData: () => new Float32Array(size) }; }
    resume() { this.state = 'running'; }
  }
  const source = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const elements = new Map();
  for (const match of source.matchAll(/id="([\w-]+)"/g)) {
    const id = match[1], hidden = new Set(['hidden']);
    const el = id === 'world' || id === 'poster' ? (canvasFactory || mockCanvas)() : {};
    Object.assign(el, { style: {}, checked: id !== 'low', value: '', textContent: '', innerHTML: '',
      disabled: false, classList: { add: v => hidden.add(v), remove: v => hidden.delete(v), contains: v => hidden.has(v) },
      focus() {}, addEventListener() {} });
    elements.set(id, el);
  }
  let now = 1000;
  const sandbox = {
    document: { getElementById: id => elements.get(id), querySelectorAll: () => [],
      createElement: () => (canvasFactory || mockCanvas)(), addEventListener() {} },
    innerWidth: 1600, innerHeight: 900, devicePixelRatio: 1,
    sessionStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    localStorage: { getItem: () => null, setItem() {} },
    location: { origin: 'http://localhost', protocol: 'http:' }, navigator: {},
    performance: { now: () => now }, AudioContext, HTMLInputElement: class {},
    addEventListener() {}, requestAnimationFrame() {}, setTimeout() {}, clearTimeout() {},
    console, Date, Math,
  };
  sandbox.window = sandbox;
  const context = vm.createContext(sandbox);
  const evaluate = code => vm.runInContext(code, context);
  evaluate(source.match(/<script>([\s\S]*?)<\/script>/)[1]);
  return { evaluate, calls, audioCalls, elements, setNow: n => now = n,
    snapshot: data => { sandbox.testSnapshot = data; evaluate(`session = {id: 'a'}; receive({type:'snapshot',full:true,revision:1,data:testSnapshot,serverTime:Date.now()});`); },
  };
}
