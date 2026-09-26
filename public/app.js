/* DOT-01 — Web Audio polyphonic synthesizer. No dependencies. */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage unavailable */ } }
  };
  const NOTE = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const noteName = n => NOTE[n % 12] + (Math.floor(n / 12) - 1);
  const mtof = n => 440 * Math.pow(2, (n - 69) / 12);

  /* ───────── Parameters ───────── */
  const hz = v => v >= 1000 ? (v / 1000).toFixed(v >= 10000 ? 0 : 1) + 'k' : Math.round(v) + '';
  const sec = v => v < 1 ? Math.round(v * 1000) + 'ms' : v.toFixed(2) + 's';
  const pct = v => Math.round(v * 100) + '%';
  const sgn = v => (v > 0 ? '+' : '') + v;
  const PARAMS = {
    osc1Wave: { seg: ['sine', 'triangle', 'sawtooth', 'square', 'pulse'], def: 'sawtooth', label: 'WAVE' },
    osc1Oct: { min: -2, max: 2, step: 1, def: 0, label: 'OCTAVE', fmt: sgn },
    osc1Semi: { min: -12, max: 12, step: 1, def: 0, label: 'SEMI', fmt: sgn },
    osc1Level: { min: 0, max: 1, def: 0.8, label: 'LEVEL', fmt: pct },
    osc2Wave: { seg: ['sine', 'triangle', 'sawtooth', 'square', 'pulse'], def: 'square', label: 'WAVE' },
    osc2Oct: { min: -2, max: 2, step: 1, def: 0, label: 'OCTAVE', fmt: sgn },
    osc2Detune: { min: -50, max: 50, step: 1, def: 7, label: 'DETUNE', fmt: v => sgn(v) + 'c' },
    osc2Level: { min: 0, max: 1, def: 0.45, label: 'LEVEL', fmt: pct },
    subLevel: { min: 0, max: 1, def: 0, label: 'SUB', fmt: pct },
    noiseLevel: { min: 0, max: 1, def: 0, label: 'NOISE', fmt: pct },
    filterType: { seg: ['lowpass', 'highpass', 'bandpass'], def: 'lowpass', label: 'TYPE', names: { lowpass: 'LP', highpass: 'HP', bandpass: 'BP' } },
    cutoff: { min: 30, max: 18000, curve: 'exp', def: 2200, label: 'CUTOFF', fmt: hz },
    reso: { min: 0.3, max: 22, curve: 'exp', def: 2, label: 'RESO', fmt: v => v.toFixed(1) },
    envAmt: { min: -1, max: 1, def: 0.35, label: 'ENV AMT', fmt: v => sgn(Math.round(v * 100)) },
    keyTrack: { min: 0, max: 1, def: 0.4, label: 'KEY TRK', fmt: pct },
    ampA: { min: 0.001, max: 4, curve: 'exp', def: 0.005, label: 'ATTACK', fmt: sec },
    ampD: { min: 0.005, max: 4, curve: 'exp', def: 0.3, label: 'DECAY', fmt: sec },
    ampS: { min: 0, max: 1, def: 0.7, label: 'SUSTAIN', fmt: pct },
    ampR: { min: 0.005, max: 6, curve: 'exp', def: 0.35, label: 'RELEASE', fmt: sec },
    fA: { min: 0.001, max: 4, curve: 'exp', def: 0.005, label: 'ATTACK', fmt: sec },
    fD: { min: 0.005, max: 4, curve: 'exp', def: 0.45, label: 'DECAY', fmt: sec },
    fS: { min: 0, max: 1, def: 0.25, label: 'SUSTAIN', fmt: pct },
    fR: { min: 0.005, max: 6, curve: 'exp', def: 0.4, label: 'RELEASE', fmt: sec },
    lfoWave: { seg: ['sine', 'triangle', 'square', 'sawtooth'], def: 'sine', label: 'WAVE' },
    lfoTarget: { seg: ['pitch', 'filter', 'amp'], def: 'filter', label: 'TARGET', names: { pitch: 'PITCH', filter: 'FILTER', amp: 'AMP' } },
    lfoRate: { min: 0.05, max: 20, curve: 'exp', def: 4, label: 'RATE', fmt: v => v.toFixed(v < 1 ? 2 : 1) + 'Hz' },
    lfoDepth: { min: 0, max: 1, def: 0, label: 'DEPTH', fmt: pct },
    drive: { min: 0, max: 1, def: 0, label: 'DRIVE', fmt: pct },
    bits: { min: 1, max: 16, step: 1, def: 16, label: 'BITS', fmt: v => v + 'b' },
    down: { min: 1, max: 32, step: 1, def: 1, label: 'DOWNSMP', fmt: v => '÷' + v },
    chorus: { min: 0, max: 1, def: 0, label: 'CHORUS', fmt: pct },
    delayTime: { min: 0.02, max: 1.2, curve: 'exp', def: 0.33, label: 'D.TIME', fmt: sec },
    delayFb: { min: 0, max: 0.9, def: 0.35, label: 'D.FDBK', fmt: pct },
    delayMix: { min: 0, max: 1, def: 0, label: 'D.MIX', fmt: pct },
    revSize: { min: 0.3, max: 8, curve: 'exp', def: 2.4, label: 'R.SIZE', fmt: v => v.toFixed(1) + 's' },
    revMix: { min: 0, max: 1, def: 0.15, label: 'R.MIX', fmt: pct },
    volume: { min: 0, max: 1, def: 0.7, label: 'VOLUME', fmt: pct },
    glide: { min: 0, max: 1, def: 0, label: 'GLIDE', fmt: sec },
    mode: { seg: ['poly', 'mono'], def: 'poly', label: 'MODE', names: { poly: 'POLY', mono: 'MONO' } },
    // arp / seq
    bpm: { min: 40, max: 240, step: 1, def: 110, label: 'BPM', fmt: v => v + '' },
    swing: { min: 0, max: 0.6, def: 0, label: 'SWING', fmt: pct },
    arpOn: { seg: ['off', 'on'], def: 'off', label: 'ARP', names: { off: 'OFF', on: 'ON' } },
    arpMode: { seg: ['up', 'down', 'updown', 'random'], def: 'up', label: 'MODE', names: { up: 'UP', down: 'DN', updown: 'U/D', random: 'RND' } },
    arpRate: { seg: ['4', '8', '16', '8t'], def: '16', label: 'RATE', names: { 4: '1/4', 8: '1/8', 16: '1/16', '8t': '1/8T' } },
    arpOct: { seg: ['1', '2', '3'], def: '1', label: 'OCT' },
    arpGate: { min: 0.1, max: 1, def: 0.6, label: 'GATE', fmt: pct }
  };
  const SOUND_KEYS = Object.keys(PARAMS).filter(k => !['bpm', 'swing', 'arpOn', 'arpMode', 'arpRate', 'arpOct', 'arpGate'].includes(k));
  const defaults = () => Object.fromEntries(Object.entries(PARAMS).map(([k, d]) => [k, d.def]));
  const P = Object.assign(defaults(), store.get('dot01:params', {}));

  // normalized ↔ value
  function toNorm(k, v) { const d = PARAMS[k]; return d.curve === 'exp' ? Math.log(v / d.min) / Math.log(d.max / d.min) : (v - d.min) / (d.max - d.min); }
  function fromNorm(k, n) {
    const d = PARAMS[k]; n = clamp(n, 0, 1);
    let v = d.curve === 'exp' ? d.min * Math.pow(d.max / d.min, n) : d.min + n * (d.max - d.min);
    if (d.step) v = Math.round(v / d.step) * d.step;
    return +v.toFixed(d.curve === 'exp' ? 4 : 3);
  }

  /* ───────── Presets ───────── */
  const PRESETS = [
    { name: 'INIT' },
    { name: 'DOT LEAD', osc1Wave: 'sawtooth', osc2Wave: 'sawtooth', osc2Detune: 12, osc2Level: .6, cutoff: 2600, reso: 4, envAmt: .45, fD: .35, fS: .3, ampS: .8, glide: .06, mode: 'mono', lfoTarget: 'pitch', lfoRate: 5.5, lfoDepth: .12, delayMix: .22, delayTime: .27, revMix: .18 },
    { name: 'RETRO BASS', osc1Wave: 'square', osc1Oct: -1, osc2Wave: 'sawtooth', osc2Oct: -1, osc2Detune: -6, osc2Level: .5, subLevel: .5, cutoff: 480, reso: 7, envAmt: .55, fA: .002, fD: .22, fS: .05, ampD: .4, ampS: .6, ampR: .12, mode: 'mono', glide: .03, revMix: .05, drive: .25 },
    { name: 'GLYPH PAD', osc1Wave: 'sawtooth', osc2Wave: 'triangle', osc2Oct: 1, osc2Detune: 9, osc2Level: .5, cutoff: 1400, reso: 1.2, envAmt: .2, ampA: 1.2, ampD: 1.5, ampS: .8, ampR: 2.6, fA: 1.4, fD: 2, fS: .5, fR: 2, lfoTarget: 'filter', lfoRate: .25, lfoDepth: .35, chorus: .6, revSize: 5.5, revMix: .45, delayMix: .12, delayTime: .5 },
    { name: 'CHIP ARP', osc1Wave: 'pulse', osc2Wave: 'square', osc2Oct: 1, osc2Detune: 0, osc2Level: .25, cutoff: 9000, reso: .7, envAmt: 0, ampA: .001, ampD: .12, ampS: .25, ampR: .08, bits: 5, down: 4, delayMix: .25, delayTime: .18, delayFb: .3, arpOn: 'on', arpMode: 'updown', arpRate: '16', arpOct: '2', arpGate: .5, revMix: .08 },
    { name: 'WARM KEYS', osc1Wave: 'triangle', osc2Wave: 'sine', osc2Oct: 1, osc2Level: .35, osc2Detune: 3, cutoff: 3200, reso: .8, envAmt: .25, ampA: .004, ampD: 1.4, ampS: .35, ampR: .7, fD: .9, fS: .2, chorus: .45, revMix: .25, lfoTarget: 'amp', lfoRate: 4.5, lfoDepth: .12 },
    { name: 'WOBBLE', osc1Wave: 'sawtooth', osc1Oct: -1, osc2Wave: 'square', osc2Oct: -1, osc2Level: .6, subLevel: .6, cutoff: 380, reso: 9, envAmt: .1, lfoTarget: 'filter', lfoWave: 'sine', lfoRate: 2.8, lfoDepth: .75, mode: 'mono', drive: .45, ampS: 1, revMix: .08 },
    { name: 'TAPE STRINGS', osc1Wave: 'sawtooth', osc2Wave: 'sawtooth', osc2Detune: 15, osc2Level: .8, cutoff: 2400, reso: .6, envAmt: .1, ampA: .6, ampD: 1, ampS: .85, ampR: 1.4, chorus: .8, lfoTarget: 'pitch', lfoRate: .6, lfoDepth: .08, revSize: 4, revMix: .38, bits: 12, down: 2 },
    { name: 'BELL', osc1Wave: 'sine', osc2Wave: 'sine', osc2Oct: 2, osc2Detune: 13, osc2Level: .55, cutoff: 12000, envAmt: 0, ampA: .001, ampD: 2.2, ampS: 0, ampR: 2.2, revSize: 4.5, revMix: .4, delayMix: .18, delayTime: .42 },
    { name: 'NOISE HAT', osc1Level: 0, osc2Level: 0, noiseLevel: .9, filterType: 'highpass', cutoff: 7000, reso: 2, envAmt: 0, ampA: .001, ampD: .06, ampS: 0, ampR: .05, revMix: .1 },
    { name: 'SYNC SCREAM', osc1Wave: 'sawtooth', osc1Semi: 7, osc2Wave: 'square', osc2Detune: -20, osc2Level: .7, cutoff: 5200, reso: 12, envAmt: .6, fD: .6, fS: .4, drive: .7, mode: 'mono', glide: .12, lfoTarget: 'pitch', lfoRate: 6, lfoDepth: .1, delayMix: .3, delayTime: .36, revMix: .2 },
    { name: 'LO-FI PIANO', osc1Wave: 'triangle', osc2Wave: 'square', osc2Oct: 1, osc2Level: .15, cutoff: 2600, envAmt: .3, fD: .5, fS: 0, ampA: .002, ampD: 1.6, ampS: 0, ampR: .5, bits: 8, down: 3, chorus: .3, revMix: .3, lfoTarget: 'pitch', lfoRate: .3, lfoDepth: .06 },
    { name: 'SUB DROP', osc1Wave: 'sine', osc1Oct: -1, osc2Level: 0, subLevel: .8, cutoff: 900, envAmt: .2, ampA: .002, ampD: .8, ampS: .6, ampR: .4, mode: 'mono', glide: .25, drive: .35 }
  ];
  let userPresets = store.get('dot01:user', []);
  const allPresets = () => PRESETS.concat(userPresets);
  let presetIdx = store.get('dot01:preset', 0);

  /* ───────── Audio engine ───────── */
  let ctx = null, E = {};
  const voices = [];
  const held = []; // notes held by player (order of press)
  let monoVoice = null, lastFreqNote = null;

  function pulseWave(duty) {
    const n = 64, re = new Float32Array(n), im = new Float32Array(n);
    for (let k = 1; k < n; k++) re[k] = 2 * Math.sin(Math.PI * k * duty) / (Math.PI * k);
    return ctx.createPeriodicWave(re, im);
  }
  function setWave(osc, w) { if (w === 'pulse') osc.setPeriodicWave(E.pulse); else osc.type = w; }
  function driveCurve(amt) {
    const n = 2048, c = new Float32Array(n), k = 1 + amt * 40;
    for (let i = 0; i < n; i++) { const x = i / (n - 1) * 2 - 1; c[i] = amt < 0.001 ? x : Math.tanh(k * x) / Math.tanh(k); }
    return c;
  }
  function makeIR(seconds) {
    const len = Math.floor(ctx.sampleRate * seconds), buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = buf.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2); }
    return buf;
  }
  const CRUSH_SRC = `class Crush extends AudioWorkletProcessor{static get parameterDescriptors(){return[{name:'bits',defaultValue:16,minValue:1,maxValue:16},{name:'down',defaultValue:1,minValue:1,maxValue:64}]}
constructor(){super();this.ph=0;this.h=[0,0]}
process(ins,outs,p){const inp=ins[0],out=outs[0];if(!inp||!inp.length){return true}const bits=p.bits[0],down=Math.max(1,Math.round(p.down[0])),q=Math.pow(2,bits-1);
let ph0=this.ph,ph=ph0;for(let c=0;c<out.length;c++){const x=inp[c]||inp[0],y=out[c];let h=this.h[c]||0;ph=ph0;
for(let i=0;i<y.length;i++){if(ph===0){h=bits>=16?x[i]:Math.round(x[i]*q)/q}y[i]=h;ph=(ph+1)%down}this.h[c]=h}this.ph=ph;return true}}
registerProcessor('crush',Crush);`;

  async function initAudio() {
    if (ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)({ latencyHint: 'interactive' });
    E.pulse = pulseWave(0.25);
    const nb = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate), nd = nb.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    E.noise = nb;
    E.bus = ctx.createGain(); E.bus.gain.value = 0.5;
    // global modulation sources
    E.lfo = ctx.createOscillator(); E.lfo.start();
    E.lfoPitch = ctx.createGain(); E.lfoFilter = ctx.createGain(); E.lfoAmp = ctx.createGain();
    E.lfo.connect(E.lfoPitch); E.lfo.connect(E.lfoFilter); E.lfo.connect(E.lfoAmp);
    E.bend = ctx.createConstantSource(); E.bend.offset.value = 0; E.bend.start();
    // drive
    E.drive = ctx.createWaveShaper(); E.drive.oversample = '2x';
    E.driveGain = ctx.createGain();
    E.bus.connect(E.drive); E.drive.connect(E.driveGain);
    // crusher
    let afterCrush = E.driveGain;
    try {
      const url = URL.createObjectURL(new Blob([CRUSH_SRC], { type: 'application/javascript' }));
      await ctx.audioWorklet.addModule(url);
      E.crush = new AudioWorkletNode(ctx, 'crush', { outputChannelCount: [2] });
      E.driveGain.connect(E.crush); afterCrush = E.crush;
    } catch (err) { E.crush = null; }
    // chorus
    E.chIn = ctx.createGain(); E.chDry = ctx.createGain(); E.chWet = ctx.createGain(); E.chOut = ctx.createGain();
    afterCrush.connect(E.chIn); E.chIn.connect(E.chDry); E.chDry.connect(E.chOut);
    const merger = ctx.createChannelMerger(2), chLfo = ctx.createOscillator(); chLfo.frequency.value = 0.6; chLfo.start();
    [0, 1].forEach(ch => {
      const d = ctx.createDelay(0.1); d.delayTime.value = ch ? 0.019 : 0.013;
      const g = ctx.createGain(); g.gain.value = ch ? -0.003 : 0.003; chLfo.connect(g); g.connect(d.delayTime);
      E.chIn.connect(d); d.connect(merger, 0, ch);
    });
    merger.connect(E.chWet); E.chWet.connect(E.chOut);
    // delay
    E.dIn = ctx.createGain(); E.chOut.connect(E.dIn);
    E.dly = ctx.createDelay(2); E.dFb = ctx.createGain(); E.dTone = ctx.createBiquadFilter(); E.dTone.type = 'lowpass'; E.dTone.frequency.value = 4200;
    E.dWet = ctx.createGain(); E.dOut = ctx.createGain();
    E.dIn.connect(E.dOut); E.dIn.connect(E.dly); E.dly.connect(E.dTone); E.dTone.connect(E.dFb); E.dFb.connect(E.dly); E.dTone.connect(E.dWet); E.dWet.connect(E.dOut);
    // reverb
    E.rev = ctx.createConvolver(); E.rWet = ctx.createGain(); E.master = ctx.createGain();
    E.dOut.connect(E.master); E.dOut.connect(E.rev); E.rev.connect(E.rWet); E.rWet.connect(E.master);
    // output
    E.limiter = ctx.createDynamicsCompressor(); E.limiter.threshold.value = -4; E.limiter.knee.value = 4; E.limiter.ratio.value = 16; E.limiter.attack.value = 0.003; E.limiter.release.value = 0.15;
    E.analyser = ctx.createAnalyser(); E.analyser.fftSize = 2048; E.analyser.smoothingTimeConstant = 0.78;
    E.master.connect(E.limiter); E.limiter.connect(E.analyser); E.analyser.connect(ctx.destination);
    E.recDest = ctx.createMediaStreamDestination(); E.limiter.connect(E.recDest);
    SOUND_KEYS.forEach(k => applyGlobal(k));
    E.rev.buffer = makeIR(P.revSize);
  }
  let irTimer = 0;
  function applyGlobal(k) {
    if (!ctx) return;
    const t = ctx.currentTime, v = P[k], sm = (param, val) => param.setTargetAtTime(val, t, 0.02);
    switch (k) {
      case 'lfoWave': E.lfo.type = v; break;
      case 'lfoRate': sm(E.lfo.frequency, v); break;
      case 'lfoDepth': case 'lfoTarget':
        sm(E.lfoPitch.gain, P.lfoTarget === 'pitch' ? P.lfoDepth * 60 : 0);
        sm(E.lfoFilter.gain, P.lfoTarget === 'filter' ? P.lfoDepth * 3600 : 0);
        sm(E.lfoAmp.gain, P.lfoTarget === 'amp' ? P.lfoDepth * 0.5 : 0);
        voices.forEach(vc => sm(vc.trem.gain, 1 - (P.lfoTarget === 'amp' ? P.lfoDepth * 0.5 : 0)));
        break;
      case 'drive': { E.drive.curve = driveCurve(v); const k = 1 + v * 40; sm(E.driveGain.gain, v < 0.001 ? 1 : Math.tanh(k) / k * (1 + v * 2.2)); break; }
      case 'bits': if (E.crush) E.crush.parameters.get('bits').setValueAtTime(v, t); break;
      case 'down': if (E.crush) E.crush.parameters.get('down').setValueAtTime(v, t); break;
      case 'chorus': sm(E.chWet.gain, v * 0.9); sm(E.chDry.gain, 1 - v * 0.45); break;
      case 'delayTime': E.dly.delayTime.setTargetAtTime(v, t, 0.08); break;
      case 'delayFb': sm(E.dFb.gain, v); break;
      case 'delayMix': sm(E.dWet.gain, v * 0.8); break;
      case 'revMix': sm(E.rWet.gain, v * 1.1); break;
      case 'revSize': clearTimeout(irTimer); irTimer = setTimeout(() => { E.rev.buffer = makeIR(P.revSize); }, 180); break;
      case 'volume': sm(E.master.gain, v * v * 1.2); break;
      default: voices.forEach(vc => vc.update(k));
    }
  }

  class Voice {
    constructor(note, vel, t) {
      this.note = note; this.vel = vel; this.t0 = t; this.released = false; this.dead = false;
      this.out = ctx.createGain(); this.out.gain.value = 0;
      this.trem = ctx.createGain(); this.trem.gain.value = 1 - (P.lfoTarget === 'amp' ? P.lfoDepth * 0.5 : 0);
      this.filter = ctx.createBiquadFilter();
      this.mix = ctx.createGain();
      this.o1 = ctx.createOscillator(); this.o2 = ctx.createOscillator(); this.sub = ctx.createOscillator();
      this.g1 = ctx.createGain(); this.g2 = ctx.createGain(); this.gs = ctx.createGain(); this.gn = ctx.createGain();
      this.nz = ctx.createBufferSource(); this.nz.buffer = E.noise; this.nz.loop = true; this.nz.loopStart = Math.random();
      this.sub.type = 'square';
      [[this.o1, this.g1], [this.o2, this.g2], [this.sub, this.gs], [this.nz, this.gn]].forEach(([s, g]) => { s.connect(g); g.connect(this.mix); });
      this.mix.connect(this.filter); this.filter.connect(this.out); this.out.connect(this.trem); this.trem.connect(E.bus);
      [this.o1, this.o2, this.sub].forEach(o => { E.lfoPitch.connect(o.detune); E.bend.connect(o.detune); });
      E.lfoFilter.connect(this.filter.detune); E.lfoAmp.connect(this.trem.gain);
      ['osc1Wave', 'osc2Wave', 'osc1Level', 'osc2Level', 'subLevel', 'noiseLevel', 'filterType', 'reso', 'osc2Detune'].forEach(k => this.update(k));
      this.setPitch(note, t, lastFreqNote != null && P.glide > 0 ? lastFreqNote : null);
      [this.o1, this.o2, this.sub, this.nz].forEach(s => s.start(t));
      this.trigger(t, vel);
    }
    freqs(n) { return [mtof(n + 12 * P.osc1Oct + P.osc1Semi), mtof(n + 12 * P.osc2Oct), mtof(n + 12 * P.osc1Oct + P.osc1Semi - 12)]; }
    setPitch(n, t, from) {
      const f = this.freqs(n), osc = [this.o1, this.o2, this.sub];
      osc.forEach((o, i) => {
        o.frequency.cancelScheduledValues(t);
        if (from != null) { o.frequency.setValueAtTime(this.freqs(from)[i], t); o.frequency.setTargetAtTime(f[i], t, Math.max(0.001, P.glide / 3)); }
        else o.frequency.setValueAtTime(f[i], t);
      });
      this.note = n;
    }
    baseCut(n) { return clamp(P.cutoff * Math.pow(2, P.keyTrack * (n - 60) / 12), 20, 20000); }
    trigger(t, vel) {
      const g = this.out.gain, peak = 0.25 + 0.75 * vel;
      g.cancelScheduledValues(t); g.setValueAtTime(this.released ? 0 : g.value, t);
      g.linearRampToValueAtTime(peak, t + P.ampA); g.setTargetAtTime(peak * P.ampS, t + P.ampA, Math.max(0.001, P.ampD / 3));
      const f = this.filter.frequency, b = this.baseCut(this.note), top = clamp(b * Math.pow(2, P.envAmt * 7), 20, 20000), sus = clamp(b * Math.pow(2, P.envAmt * 7 * P.fS), 20, 20000);
      f.cancelScheduledValues(t); f.setValueAtTime(b, t); f.exponentialRampToValueAtTime(top, t + P.fA); f.setTargetAtTime(sus, t + P.fA, Math.max(0.001, P.fD / 3));
      this.peak = peak;
    }
    release(t) {
      if (this.released) return; this.released = true; this.relT = t;
      const g = this.out.gain, f = this.filter.frequency;
      [g, f].forEach(p => { if (p.cancelAndHoldAtTime) p.cancelAndHoldAtTime(t); else { p.cancelScheduledValues(t); p.setValueAtTime(p.value, t); } });
      g.setTargetAtTime(0, t, Math.max(0.002, P.ampR / 4));
      f.setTargetAtTime(this.baseCut(this.note), t, Math.max(0.002, P.fR / 4));
      const end = t + P.ampR * 1.6 + 0.08;
      [this.o1, this.o2, this.sub, this.nz].forEach(s => { try { s.stop(end); } catch (e) { /* already stopped */ } });
      this.o1.onended = () => this.cleanup();
    }
    kill() { const t = ctx.currentTime; this.released = false; this.out.gain.cancelScheduledValues(t); this.out.gain.setTargetAtTime(0, t, 0.006); this.released = true; [this.o1, this.o2, this.sub, this.nz].forEach(s => { try { s.stop(t + 0.05); } catch (e) { /* noop */ } }); this.o1.onended = () => this.cleanup(); }
    cleanup() {
      if (this.dead) return; this.dead = true;
      [this.o1, this.o2, this.sub].forEach(o => { try { E.lfoPitch.disconnect(o.detune); E.bend.disconnect(o.detune); } catch (e) { /* noop */ } });
      try { E.lfoFilter.disconnect(this.filter.detune); E.lfoAmp.disconnect(this.trem.gain); } catch (e) { /* noop */ }
      this.trem.disconnect();
      const i = voices.indexOf(this); if (i >= 0) voices.splice(i, 1);
      if (monoVoice === this) monoVoice = null;
    }
    update(k) {
      const t = ctx.currentTime, sm = (p, v) => p.setTargetAtTime(v, t, 0.015);
      switch (k) {
        case 'osc1Wave': setWave(this.o1, P.osc1Wave); break;
        case 'osc2Wave': setWave(this.o2, P.osc2Wave); break;
        case 'osc1Level': sm(this.g1.gain, P.osc1Level); break;
        case 'osc2Level': sm(this.g2.gain, P.osc2Level); break;
        case 'subLevel': sm(this.gs.gain, P.subLevel * 0.8); break;
        case 'noiseLevel': sm(this.gn.gain, P.noiseLevel * 0.6); break;
        case 'osc2Detune': sm(this.o2.detune, P.osc2Detune); break;
        case 'filterType': this.filter.type = P.filterType; break;
        case 'reso': sm(this.filter.Q, P.reso); break;
        case 'osc1Oct': case 'osc1Semi': case 'osc2Oct': { const f = this.freqs(this.note); [this.o1, this.o2, this.sub].forEach((o, i) => sm(o.frequency, f[i])); break; }
        case 'cutoff': case 'keyTrack': case 'envAmt': case 'fS':
          if (!this.released) { const b = this.baseCut(this.note); this.filter.frequency.cancelScheduledValues(t); this.filter.frequency.setTargetAtTime(clamp(b * Math.pow(2, P.envAmt * 7 * P.fS), 20, 20000), t, 0.03); }
          break;
      }
    }
  }

  const MAXV = 8;
  function noteOn(note, vel = 0.8, t) {
    if (!ctx) return;
    t = Math.max(t || 0, ctx.currentTime);
    if (P.mode === 'mono') {
      if (monoVoice && !monoVoice.released) { monoVoice.setPitch(note, t, P.glide > 0 ? monoVoice.note : null); if (!held.length || P.glide === 0) monoVoice.trigger(t, vel); lastFreqNote = note; return; }
      monoVoice = new Voice(note, vel, t); voices.push(monoVoice); lastFreqNote = note; return;
    }
    // retrigger same note
    voices.filter(v => v.note === note && !v.released).forEach(v => v.release(t));
    const live = voices.filter(v => !v.dead);
    if (live.length >= MAXV) { const old = live.sort((a, b) => (b.released - a.released) || (a.t0 - b.t0))[0]; old.kill(); }
    voices.push(new Voice(note, vel, t)); lastFreqNote = note;
  }
  function noteOff(note, t) {
    if (!ctx) return;
    t = Math.max(t || 0, ctx.currentTime);
    if (P.mode === 'mono') {
      if (!monoVoice) return;
      const rest = held.filter(n => n !== note);
      if (monoVoice.note === note) { if (rest.length && !arpActive()) { monoVoice.setPitch(rest[rest.length - 1], t, P.glide > 0 ? note : null); lastFreqNote = rest[rest.length - 1]; } else monoVoice.release(t); }
      return;
    }
    voices.filter(v => v.note === note && !v.released).forEach(v => v.release(t));
  }
  function allOff() { if (!ctx) return; voices.slice().forEach(v => v.release(ctx.currentTime)); }

  /* ───────── Player input (keyboard / mouse / MIDI) ───────── */
  let kbBase = store.get('dot01:oct', 48), holdMode = false;
  const heldSet = new Set();
  function press(note, vel = 0.8) {
    if (!ctx) return;
    if (holdMode && heldSet.has(note)) { release(note, true); return; }
    if (heldSet.has(note)) return;
    heldSet.add(note); held.push(note);
    markKey(note, true);
    if (seq.rec) seqRecord(note);
    if (arpActive()) { arpNotesChanged(); return; }
    noteOn(note, vel);
  }
  function release(note, force) {
    if (!heldSet.has(note)) return;
    if (holdMode && !force) return;
    heldSet.delete(note); const i = held.indexOf(note); if (i >= 0) held.splice(i, 1);
    markKey(note, false);
    if (arpActive()) { arpNotesChanged(); return; }
    noteOff(note);
  }
  function releaseAll() { [...heldSet].forEach(n => release(n, true)); }

  /* ───────── Clock: arpeggiator + step sequencer ───────── */
  const seq = { steps: store.get('dot01:seq', null) || Array.from({ length: 16 }, (_, i) => ({ on: [0, 3, 6, 8, 10, 12, 14].includes(i), note: [48, 48, 55, 48, 58, 48, 60, 55, 48, 48, 55, 48, 58, 60, 63, 55][i] })), playing: false, rec: false, cursor: 0, pos: 0, next: 0 };
  const arp = { idx: 0, next: 0, pattern: [], running: false, dir: 1 };
  const arpActive = () => P.arpOn === 'on';
  function arpPattern() {
    const base = holdMode ? [...heldSet] : held.slice();
    const sorted = base.slice().sort((a, b) => a - b), oct = +P.arpOct, out = [];
    for (let o = 0; o < oct; o++) sorted.forEach(n => out.push(n + 12 * o));
    if (P.arpMode === 'down') out.reverse();
    if (P.arpMode === 'updown' && out.length > 2) return out.concat(out.slice(1, -1).reverse());
    return out;
  }
  function arpNotesChanged() {
    arp.pattern = arpPattern();
    if (arp.pattern.length && !arp.running) { arp.running = true; arp.idx = 0; arp.next = ctx.currentTime + 0.01; }
    if (!arp.pattern.length) arp.running = false;
  }
  function arpStep() { const r = P.arpRate; return 60 / P.bpm * (r === '4' ? 1 : r === '8' ? 0.5 : r === '8t' ? 1 / 3 : 0.25); }
  function tick() {
    if (!ctx) return;
    const ahead = ctx.currentTime + 0.12;
    if (arp.running && arpActive()) {
      while (arp.next < ahead) {
        const pat = arp.pattern; if (!pat.length) { arp.running = false; break; }
        const n = P.arpMode === 'random' ? pat[Math.floor(Math.random() * pat.length)] : pat[arp.idx % pat.length];
        const dur = arpStep();
        noteOn(n, 0.8, arp.next); noteOff(n, arp.next + dur * P.arpGate);
        flashKey(n, arp.next, dur * P.arpGate);
        arp.idx++; arp.next += dur;
      }
    }
    if (seq.playing) {
      while (seq.next < ahead) {
        const st = seq.steps[seq.pos], dur = 60 / P.bpm / 4;
        if (st.on) { noteOn(st.note, 0.85, seq.next); noteOff(st.note, seq.next + dur * 0.8); }
        const pos = seq.pos, at = seq.next;
        setTimeout(() => showStep(pos), Math.max(0, (at - ctx.currentTime) * 1000));
        seq.pos = (seq.pos + 1) % 16;
        seq.next += dur * (1 + (seq.pos % 2 ? P.swing : -P.swing));
      }
    }
  }
  setInterval(tick, 25);

  /* ───────── UI building ───────── */
  const ICON = {
    sine: 'M1 6 C4 -1 7 -1 10 6 S16 13 19 6', triangle: 'M1 6 L5.5 1 L14.5 11 L19 6', sawtooth: 'M1 11 L10 1 L10 11 L19 1 L19 6',
    square: 'M1 11 V1 H10 V11 H19 V1', pulse: 'M1 11 V1 H5 V11 H14 V1 H18'
  };
  const segHTML = (k) => {
    const d = PARAMS[k];
    return `<div class="seg" data-p="${k}" role="radiogroup" aria-label="${d.label}">${d.seg.map(v => `<button data-v="${v}" role="radio" aria-label="${v}" title="${v}">${ICON[v] && /Wave$/.test(k) ? `<svg viewBox="0 0 20 12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="${ICON[v]}"/></svg>` : (d.names && d.names[v]) || v.toUpperCase()}</button>`).join('')}</div>`;
  };
  const KN = 23, A0 = -135, A1 = 135;
  function knobHTML(k) {
    const d = PARAMS[k]; let dots = '';
    for (let i = 0; i < KN; i++) { const a = (A0 + (A1 - A0) * i / (KN - 1) - 90) * Math.PI / 180; dots += `<circle cx="${(30 + 26 * Math.cos(a)).toFixed(2)}" cy="${(30 + 26 * Math.sin(a)).toFixed(2)}" r="1.9"/>`; }
    return `<div class="knob" data-k="${k}" role="slider" tabindex="0" aria-label="${d.label}" aria-valuemin="${d.min}" aria-valuemax="${d.max}">
      <svg viewBox="0 0 60 60"><g class="ring">${dots}</g><circle class="cap" cx="30" cy="30" r="18"/><circle class="ind" cx="30" cy="16" r="2.6"/></svg>
      <span class="k-label">${d.label}</span><span class="k-val"></span></div>`;
  }
  const MODULES = [
    { t: 'OSC 1', span: 3, md: 3, segs: ['osc1Wave'], knobs: ['osc1Oct', 'osc1Semi', 'osc1Level'] },
    { t: 'OSC 2', span: 3, md: 3, segs: ['osc2Wave'], knobs: ['osc2Oct', 'osc2Detune', 'osc2Level'] },
    { t: 'MIXER', span: 2, md: 2, knobs: ['subLevel', 'noiseLevel'] },
    { t: 'FILTER', span: 4, md: 4, segs: ['filterType'], knobs: ['cutoff', 'reso', 'envAmt', 'keyTrack'] },
    { t: 'AMP ENV', span: 3, md: 3, knobs: ['ampA', 'ampD', 'ampS', 'ampR'], env: 'amp' },
    { t: 'FILTER ENV', span: 3, md: 3, knobs: ['fA', 'fD', 'fS', 'fR'], env: 'f' },
    { t: 'LFO', span: 3, md: 3, segs: ['lfoWave', 'lfoTarget'], knobs: ['lfoRate', 'lfoDepth'] },
    { t: 'MASTER', span: 3, md: 3, segs: ['mode'], knobs: ['volume', 'glide'] },
    { t: 'EFFECTS', span: 12, md: 6, knobs: ['drive', 'bits', 'down', 'chorus', 'delayTime', 'delayFb', 'delayMix', 'revSize', 'revMix'] }
  ];
  $('#rack').innerHTML = MODULES.map((m, i) => `<section class="card mod" style="--span:${m.span};--span-md:${m.md}">
      <div class="mod-title"><span class="idx">${String(i).padStart(2, '0')}</span>${m.t}</div>
      ${m.segs ? `<div class="mod-segs">${m.segs.map(segHTML).join('')}</div>` : ''}
      <div class="mod-row">${m.knobs.map(knobHTML).join('')}</div></section>`).join('');
  $('#arp').innerHTML = `<div class="mod-segs"><span class="lbl">ARP</span>${segHTML('arpOn')}</div>
    <div class="mod-segs"><span class="lbl">MODE</span>${segHTML('arpMode')}</div>
    <div class="mod-segs"><span class="lbl">RATE</span>${segHTML('arpRate')}<span class="lbl">OCT</span>${segHTML('arpOct')}</div>
    <div class="mod-row" style="justify-content:flex-start;gap:10px">${knobHTML('arpGate')}${knobHTML('bpm')}${knobHTML('swing')}</div>`;

  // readout
  let roTimer = 0;
  function readout(label, val) {
    $('#r-label').textContent = label; $('#r-val').textContent = val; $('#readout').classList.remove('dim');
    clearTimeout(roTimer); roTimer = setTimeout(() => { $('#r-label').textContent = 'PRESET'; $('#r-val').textContent = allPresets()[presetIdx] ? allPresets()[presetIdx].name : 'CUSTOM'; $('#readout').classList.add('dim'); }, 1600);
  }
  function renderKnob(el) {
    const k = el.dataset.k, d = PARAMS[k], v = P[k], n = clamp(toNorm(k, v), 0, 1), lit = Math.round(n * (KN - 1));
    const bip = d.min < 0 && d.max > 0, mid = Math.round(toNorm(k, 0) * (KN - 1));
    $$('.ring circle', el).forEach((c, i) => c.classList.toggle('lit', bip ? (i >= Math.min(mid, lit) && i <= Math.max(mid, lit)) : i <= lit));
    const a = (A0 + (A1 - A0) * n - 90) * Math.PI / 180, ind = $('.ind', el);
    ind.setAttribute('cx', (30 + 13 * Math.cos(a)).toFixed(2)); ind.setAttribute('cy', (30 + 13 * Math.sin(a)).toFixed(2));
    const txt = d.fmt ? d.fmt(v) : v; $('.k-val', el).textContent = txt;
    el.setAttribute('aria-valuenow', v); el.setAttribute('aria-valuetext', txt);
  }
  function renderSeg(el) { const k = el.dataset.p; $$('button', el).forEach(b => { const on = b.dataset.v === String(P[k]); b.classList.toggle('on', on); b.setAttribute('aria-checked', on); }); }
  function renderAll() { $$('.knob').forEach(renderKnob); $$('.seg[data-p]').forEach(renderSeg); $('#bpm-view').textContent = P.bpm; }
  let saveTimer = 0;
  function setParam(k, v, quiet) {
    if (P[k] === v) return;
    P[k] = v; applyGlobal(k);
    const kn = $(`.knob[data-k="${k}"]`); if (kn) renderKnob(kn);
    const sg = $(`.seg[data-p="${k}"]`); if (sg) renderSeg(sg);
    if (!quiet) { const d = PARAMS[k]; readout(d.label, d.fmt ? d.fmt(v) : (d.names && d.names[v]) || String(v).toUpperCase()); }
    if (k === 'bpm') $('#bpm-view').textContent = v;
    if (k === 'arpOn') { if (v === 'off') { arp.running = false; allOff(); held.forEach(n => noteOn(n)); } else { allOff(); if (ctx) arpNotesChanged(); } }
    if (k === 'arpMode' || k === 'arpOct') { if (ctx) arp.pattern = arpPattern(); }
    if (k === 'mode') allOff();
    clearTimeout(saveTimer); saveTimer = setTimeout(() => store.set('dot01:params', P), 300);
  }

  // knob interaction
  $$('.knob').forEach(el => {
    const k = el.dataset.k; let startY = 0, startN = 0, drag = false;
    el.addEventListener('pointerdown', e => { drag = true; startY = e.clientY; startN = toNorm(k, P[k]); el.setPointerCapture(e.pointerId); el.classList.add('active'); e.preventDefault(); el.focus({ preventScroll: true }); });
    el.addEventListener('pointermove', e => { if (!drag) return; const fine = e.shiftKey ? 0.25 : 1; setParam(k, fromNorm(k, startN + (startY - e.clientY) / 180 * fine)); });
    const end = () => { drag = false; el.classList.remove('active'); };
    el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
    el.addEventListener('dblclick', () => setParam(k, PARAMS[k].def));
    el.addEventListener('wheel', e => { e.preventDefault(); setParam(k, fromNorm(k, toNorm(k, P[k]) - Math.sign(e.deltaY) * (PARAMS[k].step ? 1 / ((PARAMS[k].max - PARAMS[k].min) / PARAMS[k].step) : 0.02))); }, { passive: false });
    el.addEventListener('keydown', e => {
      const d = PARAMS[k], unit = d.step ? d.step / (d.max - d.min) : 0.01, big = e.shiftKey ? 10 : 1;
      const map = { ArrowUp: unit * big, ArrowRight: unit * big, ArrowDown: -unit * big, ArrowLeft: -unit * big, PageUp: 0.1, PageDown: -0.1 };
      if (e.key in map) { e.preventDefault(); e.stopPropagation(); setParam(k, fromNorm(k, toNorm(k, P[k]) + map[e.key])); }
      else if (e.key === 'Home') setParam(k, d.min); else if (e.key === 'End') setParam(k, d.max);
    });
  });
  $$('.seg[data-p]').forEach(el => el.addEventListener('click', e => { const b = e.target.closest('button'); if (b) setParam(el.dataset.p, b.dataset.v); }));

  /* ───────── Presets UI ───────── */
  function presetSelect() {
    $('#preset-select').innerHTML = allPresets().map((p, i) => `<option value="${i}">${String(i + 1).padStart(2, '0')} ${p.name}${i >= PRESETS.length ? ' ★' : ''}</option>`).join('');
    $('#preset-select').value = presetIdx;
  }
  function loadPreset(i, quiet) {
    const list = allPresets(); presetIdx = (i + list.length) % list.length; const pr = list[presetIdx];
    allOff();
    const next = Object.assign(defaults(), pr); delete next.name;
    ['bpm', 'swing'].forEach(k => { if (!(k in pr)) next[k] = P[k]; });
    Object.keys(PARAMS).forEach(k => { P[k] = next[k]; applyGlobal(k); });
    if (ctx) arp.pattern = arpPattern();
    renderAll(); $('#preset-name').textContent = pr.name; $('#preset-select').value = presetIdx;
    store.set('dot01:preset', presetIdx); store.set('dot01:params', P);
    if (!quiet) readout('PRESET', pr.name);
  }
  $('#prev-preset').onclick = () => loadPreset(presetIdx - 1);
  $('#next-preset').onclick = () => loadPreset(presetIdx + 1);
  $('#preset-select').onchange = e => loadPreset(+e.target.value);
  $('#init-preset').onclick = () => loadPreset(0);
  $('#save-preset').onclick = () => {
    const name = (prompt('Preset name', 'MY SOUND ' + (userPresets.length + 1)) || '').trim().toUpperCase().slice(0, 16); if (!name) return;
    const snap = { name }; SOUND_KEYS.concat(['arpOn', 'arpMode', 'arpRate', 'arpOct', 'arpGate']).forEach(k => { snap[k] = P[k]; });
    userPresets.push(snap); store.set('dot01:user', userPresets); presetSelect(); loadPreset(allPresets().length - 1, true); toast('SAVED · ' + name);
  };
  $('#random-preset').onclick = () => {
    const r = Math.random, pick = a => a[Math.floor(r() * a.length)];
    allOff();
    SOUND_KEYS.forEach(k => { const d = PARAMS[k]; if (['volume', 'mode', 'bits', 'down', 'drive', 'noiseLevel', 'glide'].includes(k)) return; P[k] = d.seg ? pick(d.seg) : fromNorm(k, r()); });
    Object.assign(P, { ampA: fromNorm('ampA', r() * 0.55), ampR: fromNorm('ampR', 0.2 + r() * 0.5), cutoff: fromNorm('cutoff', 0.45 + r() * 0.45), reso: fromNorm('reso', r() * 0.6), osc1Level: 0.6 + r() * 0.4, lfoDepth: r() * 0.5, delayMix: r() * 0.35, revMix: r() * 0.4, bits: r() < 0.2 ? 4 + Math.floor(r() * 6) : 16, down: r() < 0.2 ? 1 + Math.floor(r() * 6) : 1, drive: r() < 0.3 ? r() * 0.6 : 0, noiseLevel: r() < 0.2 ? r() * 0.4 : 0, filterType: r() < 0.8 ? 'lowpass' : pick(['highpass', 'bandpass']), ampS: 0.3 + r() * 0.7 });
    SOUND_KEYS.forEach(applyGlobal); renderAll(); $('#preset-name').textContent = 'RANDOM'; readout('PRESET', 'RANDOM'); store.set('dot01:params', P);
  };
  $('#share-preset').onclick = async () => {
    const diff = {}; Object.keys(PARAMS).forEach(k => { if (P[k] !== PARAMS[k].def) diff[k] = P[k]; });
    const url = location.origin + location.pathname + '#p=' + btoa(unescape(encodeURIComponent(JSON.stringify(diff))));
    try { await navigator.clipboard.writeText(url); toast('LINK COPIED'); } catch { prompt('Copy this link', url); }
  };
  function loadFromHash() {
    const m = location.hash.match(/#p=([A-Za-z0-9+/=]+)/); if (!m) return false;
    try { const d = JSON.parse(decodeURIComponent(escape(atob(m[1])))); Object.keys(PARAMS).forEach(k => { P[k] = k in d ? d[k] : PARAMS[k].def; }); $('#preset-name').textContent = 'SHARED'; history.replaceState(null, '', location.pathname); return true; } catch { return false; }
  }

  /* ───────── Keyboard UI ───────── */
  const KEYMAP = 'awsedftgyhujkolp;'.split(''); // offsets 0..16 from kbBase
  function buildKeys() {
    const lo = kbBase - 12, hi = kbBase + 24, wrap = $('#keys');
    const whites = []; for (let n = lo; n <= hi; n++) if (![1, 3, 6, 8, 10].includes(n % 12)) whites.push(n);
    const ww = Math.max(34, Math.min(52, (wrap.parentElement.clientWidth - 2) / whites.length));
    wrap.style.width = ww * whites.length + 'px';
    let html = '', wi = 0;
    for (let n = lo; n <= hi; n++) {
      const black = [1, 3, 6, 8, 10].includes(n % 12), off = n - kbBase, lbl = off >= 0 && off < KEYMAP.length ? KEYMAP[off].toUpperCase() : '';
      if (!black) { html += `<div class="key w" data-n="${n}" style="left:${wi * ww}px;width:${ww}px"><span class="kd"></span>${n % 12 === 0 ? `<span class="kn">${noteName(n)}</span>` : ''}<span class="kl">${lbl}</span></div>`; wi++; }
      else html += `<div class="key b" data-n="${n}" style="left:${wi * ww - ww * 0.31}px;width:${ww * 0.62}px"><span class="kd"></span><span class="kl">${lbl}</span></div>`;
    }
    wrap.innerHTML = html;
    heldSet.forEach(n => markKey(n, true));
    $('#oct-view').textContent = noteName(kbBase);
  }
  function markKey(n, on) { const k = $(`.key[data-n="${n}"]`); if (k) k.classList.toggle('down', on); }
  function flashKey(n, at, dur) {
    if (!ctx) return; const d = Math.max(0, (at - ctx.currentTime) * 1000);
    setTimeout(() => { if (!heldSet.has(n)) markKey(n, true); }, d);
    setTimeout(() => { if (!heldSet.has(n)) markKey(n, false); }, d + dur * 1000);
  }
  const pointerNotes = new Map();
  function keyAt(x, y) { const el = document.elementFromPoint(x, y); return el && el.closest('.key'); }
  function velFrom(el, y) { const r = el.getBoundingClientRect(); return clamp(0.35 + 0.65 * (y - r.top) / r.height, 0.2, 1); }
  $('#keys').addEventListener('pointerdown', async e => {
    await power(); const k = e.target.closest('.key'); if (!k) return;
    $('#keys').setPointerCapture(e.pointerId); const n = +k.dataset.n; pointerNotes.set(e.pointerId, n); press(n, velFrom(k, e.clientY));
  });
  $('#keys').addEventListener('pointermove', e => {
    if (!pointerNotes.has(e.pointerId)) return; const k = keyAt(e.clientX, e.clientY); if (!k) return;
    const n = +k.dataset.n, prev = pointerNotes.get(e.pointerId); if (n === prev) return;
    release(prev); pointerNotes.set(e.pointerId, n); press(n, velFrom(k, e.clientY));
  });
  const pUp = e => { if (!pointerNotes.has(e.pointerId)) return; release(pointerNotes.get(e.pointerId)); pointerNotes.delete(e.pointerId); };
  $('#keys').addEventListener('pointerup', pUp); $('#keys').addEventListener('pointercancel', pUp);
  function shiftOct(d) { const nb = clamp(kbBase + 12 * d, 24, 84); if (nb === kbBase) return; releaseAll(); kbBase = nb; store.set('dot01:oct', kbBase); buildKeys(); readout('OCTAVE', noteName(kbBase)); }
  $('#oct-down').onclick = () => shiftOct(-1); $('#oct-up').onclick = () => shiftOct(1);
  $('#hold').onchange = e => { holdMode = e.target.checked; if (!holdMode) releaseAll(); readout('HOLD', holdMode ? 'ON' : 'OFF'); };
  const typing = () => { const a = document.activeElement; return a && (a.tagName === 'INPUT' && a.type !== 'checkbox' || a.tagName === 'SELECT' || a.tagName === 'TEXTAREA'); };
  document.addEventListener('keydown', async e => {
    if (e.metaKey || e.ctrlKey || e.altKey || typing()) return;
    const key = e.key.toLowerCase();
    if (key === 'z' || key === 'x') { shiftOct(key === 'z' ? -1 : 1); return; }
    if (key === ' ' && !e.repeat && !(document.activeElement && document.activeElement.classList.contains('knob'))) { e.preventDefault(); await power(); toggleSeq(); return; }
    const i = KEYMAP.indexOf(key); if (i < 0 || e.repeat) return;
    e.preventDefault(); await power(); press(kbBase + i, 0.8);
  });
  document.addEventListener('keyup', e => { const i = KEYMAP.indexOf(e.key.toLowerCase()); if (i >= 0) release(kbBase + i); });
  window.addEventListener('blur', () => { if (!holdMode) releaseAll(); });
  window.addEventListener('resize', () => { clearTimeout(buildKeys.t); buildKeys.t = setTimeout(buildKeys, 150); });

  /* ───────── Sequencer UI ───────── */
  function renderSteps() {
    $('#steps').innerHTML = seq.steps.map((s, i) => `<button class="step ${s.on ? 'on' : ''} ${seq.rec && i === seq.cursor ? 'cursor' : ''}" data-i="${i}" aria-pressed="${s.on}" aria-label="Step ${i + 1} ${noteName(s.note)}"><span class="si">${i + 1}</span><span class="sd"></span><span class="sn">${noteName(s.note)}</span></button>`).join('');
  }
  function showStep(i) { $$('.step').forEach((el, j) => el.classList.toggle('play', j === i && seq.playing)); }
  $('#steps').addEventListener('click', e => {
    const b = e.target.closest('.step'); if (!b) return; const i = +b.dataset.i;
    if (seq.rec) { seq.cursor = i; renderSteps(); return; }
    seq.steps[i].on = !seq.steps[i].on; renderSteps(); saveSeq();
  });
  $('#steps').addEventListener('wheel', e => {
    const b = e.target.closest('.step'); if (!b) return; e.preventDefault();
    const s = seq.steps[+b.dataset.i]; s.note = clamp(s.note - Math.sign(e.deltaY), 24, 96); renderSteps(); saveSeq(); readout('STEP ' + (+b.dataset.i + 1), noteName(s.note));
  }, { passive: false });
  function saveSeq() { store.set('dot01:seq', seq.steps); }
  function seqRecord(note) { seq.steps[seq.cursor] = { on: true, note }; seq.cursor = (seq.cursor + 1) % 16; renderSteps(); saveSeq(); }
  function toggleSeq() {
    if (!ctx) return;
    seq.playing = !seq.playing;
    if (seq.playing) { seq.pos = 0; seq.next = ctx.currentTime + 0.06; } else { showStep(-1); allOff(); }
    $('#seq-play').classList.toggle('on', seq.playing); $('#seq-led').classList.toggle('on', seq.playing); $('#seq-play-label').textContent = seq.playing ? 'STOP' : 'PLAY';
  }
  $('#seq-play').onclick = async () => { await power(); toggleSeq(); };
  $('#seq-rec').onclick = () => {
    seq.rec = !seq.rec; seq.cursor = 0; $('#seq-rec').classList.toggle('on', seq.rec); $('#seq-rec-led').classList.toggle('on', seq.rec);
    $('#seq-hint').textContent = seq.rec ? 'Play notes to fill steps · click a step to move the cursor' : 'Click a step to toggle it · scroll on a step to change its note';
    renderSteps();
  };
  $('#seq-clear').onclick = () => { seq.steps.forEach(s => { s.on = false; }); renderSteps(); saveSeq(); };
  $('#seq-random').onclick = () => {
    const scale = [0, 3, 5, 7, 10, 12, 15], root = kbBase;
    seq.steps = seq.steps.map((_, i) => ({ on: i % 4 === 0 || Math.random() < 0.45, note: root + scale[Math.floor(Math.random() * scale.length)] - (Math.random() < 0.25 ? 12 : 0) }));
    renderSteps(); saveSeq();
  };
  $('#seq-hint').textContent = 'Click a step to toggle it · scroll on a step to change its note';

  /* ───────── MIDI ───────── */
  $('#midi-btn').onclick = async () => {
    await power();
    if (!navigator.requestMIDIAccess) return toast('WEB MIDI NOT SUPPORTED IN THIS BROWSER');
    try {
      const acc = await navigator.requestMIDIAccess();
      const hook = () => { let n = 0; acc.inputs.forEach(inp => { inp.onmidimessage = onMidi; n++; }); $('#midi-led').classList.toggle('on', n > 0); $('#midi-btn').classList.toggle('on', n > 0); toast(n ? n + ' MIDI INPUT' + (n > 1 ? 'S' : '') + ' CONNECTED' : 'NO MIDI DEVICE FOUND'); };
      acc.onstatechange = hook; hook();
    } catch { toast('MIDI ACCESS DENIED'); }
  };
  function onMidi(m) {
    const [st, a, b] = m.data, cmd = st & 0xf0;
    $('#midi-led').classList.add('hot'); setTimeout(() => $('#midi-led').classList.remove('hot'), 80);
    if (cmd === 0x90 && b > 0) press(a, b / 127);
    else if (cmd === 0x80 || (cmd === 0x90 && b === 0)) release(a);
    else if (cmd === 0xe0) { const v = ((b << 7) | a) - 8192; E.bend.offset.setTargetAtTime(v / 8192 * 200, ctx.currentTime, 0.01); }
    else if (cmd === 0xb0) {
      if (a === 1) setParam('lfoDepth', +(b / 127).toFixed(3));
      else if (a === 74) setParam('cutoff', fromNorm('cutoff', b / 127));
      else if (a === 71) setParam('reso', fromNorm('reso', b / 127));
      else if (a === 7) setParam('volume', +(b / 127).toFixed(3));
      else if (a === 64) { holdMode = b >= 64; $('#hold').checked = holdMode; if (!holdMode) releaseAll(); }
      else if (a === 123) releaseAll();
    }
  }

  /* ───────── Recording ───────── */
  let rec = null, recStart = 0, recTimer = 0;
  $('#rec-btn').onclick = async () => {
    await power();
    if (rec) { rec.stop(); return; }
    if (!window.MediaRecorder) return toast('RECORDING NOT SUPPORTED HERE');
    const chunks = [], type = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'].find(t => MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t)) || '';
    rec = new MediaRecorder(E.recDest.stream, type ? { mimeType: type } : undefined);
    rec.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
    rec.onstop = () => {
      clearInterval(recTimer); $('#rec-led').classList.remove('on'); $('#rec-btn').classList.remove('on'); $('#rec-label').textContent = 'REC';
      const blob = new Blob(chunks, { type: rec.mimeType || 'audio/webm' }), ext = /mp4/.test(blob.type) ? 'm4a' : /ogg/.test(blob.type) ? 'ogg' : 'webm';
      const a = document.createElement('a'), d = new Date(); a.href = URL.createObjectURL(blob);
      a.download = `dot01-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}-${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}.${ext}`;
      document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      toast('RECORDING SAVED'); rec = null;
    };
    rec.start(); recStart = performance.now(); $('#rec-led').classList.add('on'); $('#rec-btn').classList.add('on');
    recTimer = setInterval(() => { const s = Math.floor((performance.now() - recStart) / 1000); $('#rec-label').textContent = String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); }, 250);
  };

  /* ───────── Visualizer (dot matrix) ───────── */
  let vizMode = store.get('dot01:viz', 'scope');
  $$('#viz-mode button').forEach(b => b.classList.toggle('on', b.dataset.v === vizMode));
  $('#viz-mode').onclick = e => { const b = e.target.closest('button'); if (!b) return; vizMode = b.dataset.v; store.set('dot01:viz', vizMode); $$('#viz-mode button').forEach(x => x.classList.toggle('on', x === b)); };
  const cv = $('#viz'), g2 = cv.getContext('2d');
  let tdata = null, fdata = null, idle = 0, bgGrid = null, lastVc = -1;
  function draw() {
    requestAnimationFrame(draw);
    const dpr = Math.min(2, window.devicePixelRatio || 1), w = cv.clientWidth, h = cv.clientHeight;
    if (!w) return;
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); bgGrid = null; }
    g2.setTransform(dpr, 0, 0, dpr, 0, 0); g2.clearRect(0, 0, w, h);
    const gap = 7, cols = Math.floor(w / gap), rows = Math.floor(h / gap), ox = (w - (cols - 1) * gap) / 2, oy = (h - (rows - 1) * gap) / 2;
    const lit = new Float32Array(cols * rows);
    if (ctx && E.analyser) {
      if (!tdata) { tdata = new Uint8Array(E.analyser.fftSize); fdata = new Uint8Array(E.analyser.frequencyBinCount); }
      if (vizMode === 'scope') {
        E.analyser.getByteTimeDomainData(tdata);
        let start = 0; for (let i = 1; i < 1024; i++) if (tdata[i - 1] < 128 && tdata[i] >= 128) { start = i; break; }
        let prev = null;
        for (let c = 0; c < cols; c++) {
          const v = (tdata[start + Math.floor(c / cols * 900)] - 128) / 128, r = Math.round((rows - 1) / 2 - v * (rows - 1) / 2 * 0.95);
          const a = prev == null ? r : prev; for (let y = Math.min(a, r); y <= Math.max(a, r); y++) lit[clamp(y, 0, rows - 1) * cols + c] = 1;
          prev = r;
        }
      } else {
        E.analyser.getByteFrequencyData(fdata);
        const n = fdata.length;
        for (let c = 0; c < cols; c++) {
          const f0 = Math.floor(Math.pow(n, c / cols)), f1 = Math.max(f0 + 1, Math.floor(Math.pow(n, (c + 1) / cols)));
          let m = 0; for (let i = f0; i < f1 && i < n; i++) m = Math.max(m, fdata[i]);
          const hgt = Math.round(m / 255 * rows);
          for (let y = 0; y < hgt; y++) lit[(rows - 1 - y) * cols + c] = y === hgt - 1 ? 1 : 0.55;
        }
      }
    } else {
      idle += 0.03; for (let c = 0; c < cols; c++) { const r = Math.round((rows - 1) / 2 - Math.sin(c / 5 + idle) * (rows - 1) / 4); lit[clamp(r, 0, rows - 1) * cols + c] = 0.6; }
    }
    if (!bgGrid || bgGrid.w !== w || bgGrid.h !== h) {
      bgGrid = document.createElement('canvas'); bgGrid.w = w; bgGrid.h = h; bgGrid.width = cv.width; bgGrid.height = cv.height;
      const b = bgGrid.getContext('2d'); b.setTransform(dpr, 0, 0, dpr, 0, 0); b.fillStyle = 'rgba(236,236,230,0.07)'; b.beginPath();
      for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) { b.moveTo(ox + x * gap + 1.2, oy + y * gap); b.arc(ox + x * gap, oy + y * gap, 1.2, 0, 6.283); }
      b.fill();
    }
    g2.setTransform(1, 0, 0, 1, 0, 0); g2.drawImage(bgGrid, 0, 0); g2.setTransform(dpr, 0, 0, dpr, 0, 0);
    [[1, 'rgba(236,236,230,1)'], [0.6, 'rgba(236,236,230,0.62)'], [0.55, 'rgba(236,236,230,0.55)']].forEach(([lv, col]) => {
      g2.fillStyle = col; g2.beginPath(); let any = false;
      for (let i = 0; i < lit.length; i++) if (lit[i] === lv) { const x = ox + (i % cols) * gap, y = oy + Math.floor(i / cols) * gap; g2.moveTo(x + 1.9, y); g2.arc(x, y, 1.9, 0, 6.283); any = true; }
      if (any) g2.fill();
    });
    const vc = voices.filter(v => !v.released).length; if (vc !== lastVc) { lastVc = vc; $('#voice-count').textContent = vc; }
  }
  requestAnimationFrame(draw);

  /* ───────── Theme, toast, power ───────── */
  const theme = store.get('dot01:theme', null); if (theme) document.documentElement.dataset.theme = theme;
  $('#theme-btn').onclick = () => {
    const dark = document.documentElement.dataset.theme ? document.documentElement.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.dataset.theme = dark ? 'light' : 'dark'; store.set('dot01:theme', dark ? 'light' : 'dark');
  };
  let toastT = 0;
  function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 1800); }
  async function power() {
    if (!ctx) { await initAudio(); $('#power').classList.add('off'); setTimeout(() => { $('#power').hidden = true; }, 500); readout('ENGINE', 'ON'); }
    if (ctx.state !== 'running') await ctx.resume();
  }
  $('#power-btn').onclick = () => power();
  document.addEventListener('visibilitychange', () => { if (document.hidden && !holdMode) releaseAll(); });

  /* ───────── Boot ───────── */
  const shared = loadFromHash();
  presetSelect(); renderAll(); buildKeys(); renderSteps();
  if (!shared) $('#preset-name').textContent = allPresets()[presetIdx] ? allPresets()[presetIdx].name : 'CUSTOM';
  $('#r-label').textContent = 'PRESET'; $('#r-val').textContent = $('#preset-name').textContent; $('#readout').classList.add('dim');
  window.DOT01 = { level() { if (!E.analyser) return 0; const d = new Float32Array(E.analyser.fftSize); E.analyser.getFloatTimeDomainData(d); return Math.sqrt(d.reduce((a, x) => a + x * x, 0) / d.length); }, P, setParam, noteOn, noteOff, press, release, power, loadPreset, voices, seq, get ctx() { return ctx; } };
})();
