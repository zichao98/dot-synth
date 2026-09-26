/* DOT-01 Studio — multitrack slowed-EDM sketchpad with a built-in step-by-step guide. No dependencies. */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage unavailable */ } }
  };
  const SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'], FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
  const KEYNAME = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B'];
  const nn = pc => ([1, 4, 6, 8, 9, 11].includes(S.key) ? SHARP : FLAT)[((pc % 12) + 12) % 12];
  const mtof = n => 440 * Math.pow(2, (n - 69) / 12);
  const SCALE = [0, 2, 3, 5, 7, 8, 10];                 // natural minor
  const QUAL = ['m', '°', '', 'm', 'm', '', ''];
  const ROMAN = ['i', 'ii°', 'III', 'iv', 'v', 'VI', 'VII'];
  const TRACKS = ['kick', 'clap', 'hat', 'bass', 'chords', 'lead', 'arp'];
  const TNAME = { kick: 'KICK', clap: 'CLAP', hat: 'HATS', bass: 'BASS', chords: 'CHORDS', lead: 'LEAD', arp: 'ARP' };
  const z16 = () => Array(16).fill(0);

  /* ───────── Sounds ───────── */
  const SOUNDS = {
    bass: {
      sub: { label: 'SUB', waves: ['sine', ['triangle', 12]], cutoff: 700, reso: 1, fenv: 0.6, fdec: 0.2, a: 0.004, d: 0.3, s: 0.9, r: 0.12, gain: 0.8 },
      reese: { label: 'REESE', waves: ['sawtooth'], unison: 2, spread: 16, cutoff: 520, reso: 3, fenv: 1.2, fdec: 0.3, a: 0.008, d: 0.4, s: 0.8, r: 0.15, gain: 0.5 },
      pluck: { label: 'PLUCK', waves: ['square'], cutoff: 480, reso: 7, fenv: 3, fdec: 0.14, a: 0.002, d: 0.25, s: 0.25, r: 0.1, gain: 0.5 }
    },
    chords: {
      pad: { label: 'DARK PAD', waves: ['sawtooth'], unison: 3, spread: 14, cutoff: 1200, reso: 1, fenv: 0.7, fdec: 1.6, a: 0.35, d: 1, s: 0.8, r: 1.3, gain: 0.2 },
      saw: { label: 'SUPERSAW', waves: ['sawtooth'], unison: 5, spread: 24, cutoff: 3800, reso: 0.8, fenv: 0.6, fdec: 0.5, a: 0.01, d: 0.4, s: 0.75, r: 0.35, gain: 0.13 },
      keys: { label: 'SOFT KEYS', waves: ['triangle', ['sine', 12]], unison: 2, spread: 6, cutoff: 2600, reso: 0.7, fenv: 1, fdec: 0.6, a: 0.004, d: 1.3, s: 0.25, r: 0.5, gain: 0.26 }
    },
    lead: {
      dream: { label: 'DREAM', waves: ['triangle', ['sine', 12]], unison: 2, spread: 8, cutoff: 3200, reso: 1, fenv: 0.8, fdec: 0.4, a: 0.02, d: 0.5, s: 0.65, r: 0.45, gain: 0.3, vib: true },
      pluck: { label: 'PLUCK', waves: ['sawtooth'], unison: 2, spread: 10, cutoff: 1600, reso: 3, fenv: 2.4, fdec: 0.18, a: 0.002, d: 0.35, s: 0.1, r: 0.3, gain: 0.28 },
      bell: { label: 'BELL', waves: ['sine', ['sine', 24], ['triangle', 19]], cutoff: 9000, reso: 0.7, fenv: 0, fdec: 0.5, a: 0.001, d: 1.4, s: 0, r: 1, gain: 0.26 },
      saw: { label: 'SAW LEAD', waves: ['sawtooth', ['square', -12]], unison: 2, spread: 12, cutoff: 2400, reso: 2, fenv: 1.2, fdec: 0.3, a: 0.01, d: 0.3, s: 0.7, r: 0.3, gain: 0.18, vib: true }
    },
    arp: {
      glass: { label: 'GLASS', waves: ['triangle', ['sine', 12]], cutoff: 5000, reso: 1, fenv: 1, fdec: 0.1, a: 0.001, d: 0.2, s: 0, r: 0.22, gain: 0.2 },
      chip: { label: 'CHIP', waves: ['square'], cutoff: 5500, reso: 0.7, fenv: 0, fdec: 0.1, a: 0.001, d: 0.1, s: 0.25, r: 0.05, gain: 0.1 },
      pluck: { label: 'PLUCK', waves: ['sawtooth'], unison: 2, spread: 9, cutoff: 1400, reso: 4, fenv: 2.5, fdec: 0.12, a: 0.001, d: 0.2, s: 0, r: 0.2, gain: 0.18 }
    }
  };
  const SEGS = {
    'chords.sound': Object.fromEntries(Object.entries(SOUNDS.chords).map(([k, v]) => [k, v.label])),
    'chords.rhythm': { hold: 'HOLD', pulse: 'PULSE', offbeat: 'OFFBEAT' },
    'bass.sound': Object.fromEntries(Object.entries(SOUNDS.bass).map(([k, v]) => [k, v.label])),
    'bass.mode': { root: 'ROOT', octave: 'OCTAVE JUMP' },
    'lead.sound': Object.fromEntries(Object.entries(SOUNDS.lead).map(([k, v]) => [k, v.label])),
    'lead.oct': { 0: 'LOW', 1: 'MID', 2: 'HIGH' },
    'arp.sound': Object.fromEntries(Object.entries(SOUNDS.arp).map(([k, v]) => [k, v.label])),
    'arp.rate': { 16: '1/16', 8: '1/8' },
    'arp.dir': { up: 'UP', down: 'DOWN', updown: 'UP/DOWN' }
  };

  /* ───────── Project state ───────── */
  const T = (o) => Object.assign(Object.fromEntries(TRACKS.map(t => [t, 0])), o);
  const defaultSong = () => [
    { name: 'Intro', bars: 4, type: 'intro', t: T({ chords: 1, hat: 1 }) },
    { name: 'Build', bars: 4, type: 'build', t: T({ kick: 1, chords: 1, hat: 1 }) },
    { name: 'Drop', bars: 8, type: 'drop', t: T({ kick: 1, clap: 1, hat: 1, bass: 1, chords: 1, lead: 1 }) },
    { name: 'Break', bars: 4, type: 'break', t: T({ chords: 1, lead: 1 }) },
    { name: 'Build 2', bars: 4, type: 'build', t: T({ kick: 1, chords: 1, hat: 1 }) },
    { name: 'Drop 2', bars: 8, type: 'drop', t: T({ kick: 1, clap: 1, hat: 1, bass: 1, chords: 1, lead: 1 }) },
    { name: 'Outro', bars: 4, type: 'outro', t: T({ chords: 1, hat: 1 }) }
  ];
  const DEF = () => ({
    title: '', bpm: 110, slow: 0, key: 9, prog: [0, 0, 0, 0],
    drums: { kick: z16(), clap: z16(), hat: z16(), ohat: z16() },
    bass: { steps: z16(), sound: 'sub', mode: 'root' },
    chords: { sound: 'pad', rhythm: 'hold' },
    lead: { notes: Array(32).fill(-1), sound: 'dream', oct: '1' },
    arp: { sound: 'glass', rate: '16', dir: 'up' },
    mix: { kick: 0.85, clap: 0.65, hat: 0.45, bass: 0.8, chords: 0.6, lead: 0.7, arp: 0.45, master: 0.8 },
    fx: { reverb: 0.2, size: 2.5, delay: 0.12, side: 0, lofi: 0 },
    song: defaultSong(), loopSec: 2, sel: 2, mode: 'loop', f: {}
  });
  const S = Object.assign(DEF(), store.get('dot01studio:project', {}));
  const F = S.f;
  let saveT = 0;
  function save() { clearTimeout(saveT); saveT = setTimeout(() => store.set('dot01studio:project', S), 250); }
  const get = (path) => path.split('.').reduce((o, k) => o[k], S);
  const set = (path, v) => { const ks = path.split('.'), last = ks.pop(); ks.reduce((o, k) => o[k], S)[last] = v; };

  const keyBase = () => { const k = S.key; return 48 + k - (k >= 7 ? 12 : 0); };  // chord octave root
  const degMidi = (d, base) => base + SCALE[((d % 7) + 7) % 7] + 12 * Math.floor(d / 7);
  const chordName = d => nn(S.key + SCALE[d]) + QUAL[d];
  const effBpm = () => S.bpm * (1 - S.slow);
  const stepDur = () => 60 / effBpm() / 4;

  /* ───────── Audio engine ───────── */
  let ctx = null; const E = {};
  function makeIR(sec) {
    const len = Math.floor(ctx.sampleRate * sec), b = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
    return b;
  }
  function initAudio() {
    if (ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)({ latencyHint: 'interactive' });
    const nb = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate), nd = nb.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    E.noise = nb;
    E.pitch = ctx.createConstantSource(); E.pitch.start();
    E.vib = ctx.createGain(); E.vib.gain.value = 7; const vo = ctx.createOscillator(); vo.frequency.value = 5.2; vo.connect(E.vib); vo.start();
    E.wob = ctx.createGain(); const wo = ctx.createOscillator(); wo.frequency.value = 0.55; wo.connect(E.wob); wo.start(); E.wob.connect(E.pitch.offset);
    E.mix = ctx.createGain();
    E.duck = ctx.createGain(); E.duck.connect(E.mix);
    E.tone = ctx.createBiquadFilter(); E.tone.type = 'lowpass'; E.tone.Q.value = 0.5;
    E.master = ctx.createGain();
    E.mix.connect(E.tone); E.tone.connect(E.master);
    E.rev = ctx.createConvolver(); E.revIn = ctx.createGain(); E.revOut = ctx.createGain();
    E.revIn.connect(E.rev); E.rev.connect(E.revOut); E.revOut.connect(E.tone);
    E.dly = ctx.createDelay(3); E.dlyIn = ctx.createGain(); E.dFb = ctx.createGain(); E.dFb.gain.value = 0.38; E.dTone = ctx.createBiquadFilter(); E.dTone.type = 'lowpass'; E.dTone.frequency.value = 3200; E.dOut = ctx.createGain();
    E.dlyIn.connect(E.dly); E.dly.connect(E.dTone); E.dTone.connect(E.dFb); E.dFb.connect(E.dly); E.dTone.connect(E.dOut); E.dOut.connect(E.tone); E.dOut.connect(E.revIn);
    E.lim = ctx.createDynamicsCompressor(); E.lim.threshold.value = -6; E.lim.knee.value = 6; E.lim.ratio.value = 12; E.lim.attack.value = 0.004; E.lim.release.value = 0.2;
    E.an = ctx.createAnalyser(); E.an.fftSize = 1024;
    E.master.connect(E.lim); E.lim.connect(E.an); E.an.connect(ctx.destination);
    E.rec = ctx.createMediaStreamDestination(); E.lim.connect(E.rec);
    E.bus = {}; E.rsend = {}; E.dsend = {};
    const REV = { kick: 0.04, clap: 0.5, hat: 0.25, bass: 0.03, chords: 1, lead: 0.8, arp: 0.9 }, DLY = { kick: 0, clap: 0.1, hat: 0, bass: 0, chords: 0.15, lead: 0.7, arp: 0.6 };
    TRACKS.forEach(t => {
      const g = ctx.createGain(), r = ctx.createGain(), d = ctx.createGain();
      g.connect(['kick', 'clap', 'hat'].includes(t) ? E.mix : E.duck); g.connect(r); g.connect(d); r.connect(E.revIn); d.connect(E.dlyIn);
      r.gain.value = REV[t]; d.gain.value = DLY[t]; E.bus[t] = g; E.rsend[t] = r; E.dsend[t] = d;
    });
    E.rev.buffer = makeIR(S.fx.size);
    applyAll();
  }
  let irT = 0;
  function applyAll() {
    if (!ctx) return;
    const t = ctx.currentTime, sm = (p, v) => p.setTargetAtTime(v, t, 0.03);
    TRACKS.forEach(k => sm(E.bus[k].gain, Math.pow(S.mix[k], 1.6) * 1.1));
    sm(E.master.gain, S.mix.master * 1.1);
    sm(E.revOut.gain, S.fx.reverb * 1.3);
    sm(E.dOut.gain, S.fx.delay * 0.9);
    E.dly.delayTime.setTargetAtTime(stepDur() * 3, t, 0.05);                // dotted eighth
    sm(E.pitch.offset, 1200 * Math.log2(1 - S.slow));
    sm(E.wob.gain, S.fx.lofi * 14);
    sm(E.tone.frequency, 20000 * Math.pow(0.12, S.fx.lofi));
  }
  function setIR() { if (!ctx) return; clearTimeout(irT); irT = setTimeout(() => { E.rev.buffer = makeIR(S.fx.size); }, 200); }
  const pf = () => Math.pow(2, (1200 * Math.log2(1 - S.slow)) / 1200);    // pitch factor for drums

  function tone(dest, snd, midi, t, dur, vel) {
    const out = ctx.createGain(), flt = ctx.createBiquadFilter(), mixg = ctx.createGain();
    flt.type = 'lowpass'; flt.Q.value = snd.reso || 1; mixg.connect(flt); flt.connect(out); out.connect(dest);
    const ws = snd.waves.map(w => Array.isArray(w) ? w : [w, 0]), uni = snd.unison || 1, spread = snd.spread || 0, oscs = [];
    mixg.gain.value = 1 / Math.sqrt(uni * ws.length);
    ws.forEach(([w, semi], wi) => {
      for (let u = 0; u < uni; u++) {
        const o = ctx.createOscillator(); o.type = w; o.frequency.value = mtof(midi + semi);
        o.detune.value = uni > 1 ? (u / (uni - 1) - 0.5) * 2 * spread : 0;
        E.pitch.connect(o.detune); if (snd.vib) E.vib.connect(o.detune);
        const lvl = wi ? 0.5 : 1;
        if (uni > 1 && ctx.createStereoPanner) { const p = ctx.createStereoPanner(), gg = ctx.createGain(); gg.gain.value = lvl; p.pan.value = (u / (uni - 1) - 0.5) * 1.3; o.connect(gg); gg.connect(p); p.connect(mixg); }
        else { const gg = ctx.createGain(); gg.gain.value = lvl; o.connect(gg); gg.connect(mixg); }
        o.start(t); oscs.push(o);
      }
    });
    const peak = snd.gain * vel, end = Math.max(t + dur, t + snd.a + 0.01), g = out.gain;
    g.setValueAtTime(0, t); g.linearRampToValueAtTime(peak, t + snd.a); g.setTargetAtTime(peak * snd.s, t + snd.a, Math.max(0.005, snd.d / 3));
    g.setTargetAtTime(0, end, Math.max(0.005, snd.r / 4));
    const base = clamp(snd.cutoff * Math.pow(2, (midi - 60) / 12 * 0.3), 40, 18000), top = clamp(base * Math.pow(2, snd.fenv || 0), 40, 18000), f = flt.frequency;
    f.setValueAtTime(base, t); f.exponentialRampToValueAtTime(top, t + Math.max(0.004, snd.a * 0.6)); f.setTargetAtTime(base, t + Math.max(0.004, snd.a * 0.6), Math.max(0.01, snd.fdec / 3));
    const stop = end + snd.r * 1.6 + 0.1;
    oscs.forEach(o => o.stop(stop));
    oscs[0].onended = () => { oscs.forEach(o => { try { E.pitch.disconnect(o.detune); if (snd.vib) E.vib.disconnect(o.detune); } catch (e) { /* noop */ } }); out.disconnect(); };
  }
  function noiseSrc(t, dur) { const s = ctx.createBufferSource(); s.buffer = E.noise; s.loop = true; s.start(t, Math.random()); s.stop(t + dur); return s; }
  function kick(t, v = 1) {
    const o = ctx.createOscillator(), g = ctx.createGain(), p = pf();
    o.type = 'sine'; o.frequency.setValueAtTime(170 * p, t); o.frequency.exponentialRampToValueAtTime(46 * p, t + 0.11);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.004); g.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
    o.connect(g); g.connect(E.bus.kick); o.start(t); o.stop(t + 0.6);
    const n = noiseSrc(t, 0.02), hp = ctx.createBiquadFilter(), ng = ctx.createGain(); hp.type = 'highpass'; hp.frequency.value = 3000;
    ng.gain.setValueAtTime(0.25 * v, t); ng.gain.exponentialRampToValueAtTime(0.001, t + 0.015); n.connect(hp); hp.connect(ng); ng.connect(E.bus.kick);
    if (S.fx.side > 0) { const d = E.duck.gain; d.setValueAtTime(1 - S.fx.side * 0.85, t); d.setTargetAtTime(1, t + 0.03, 0.06 + S.fx.side * 0.08); }
  }
  function clap(t, v = 1) {
    const n = noiseSrc(t, 0.4), bp = ctx.createBiquadFilter(), g = ctx.createGain(); bp.type = 'bandpass'; bp.frequency.value = 1500 * pf(); bp.Q.value = 0.9;
    g.gain.setValueAtTime(0, t);
    [0, 0.011, 0.022].forEach(o => { g.gain.setValueAtTime(0.9 * v, t + o); g.gain.exponentialRampToValueAtTime(0.12 * v, t + o + 0.009); });
    g.gain.setValueAtTime(0.7 * v, t + 0.032); g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    n.connect(bp); bp.connect(g); g.connect(E.bus.clap);
  }
  function hat(t, open, v = 1) {
    const d = open ? 0.32 : 0.045, n = noiseSrc(t, d + 0.05), hp = ctx.createBiquadFilter(), g = ctx.createGain(); hp.type = 'highpass'; hp.frequency.value = 7200 * pf();
    g.gain.setValueAtTime(0.5 * v, t); g.gain.exponentialRampToValueAtTime(0.001, t + d); n.connect(hp); hp.connect(g); g.connect(E.bus.hat);
  }
  function crash(t) {
    const n = noiseSrc(t, 2.2), hp = ctx.createBiquadFilter(), g = ctx.createGain(); hp.type = 'highpass'; hp.frequency.value = 4500;
    g.gain.setValueAtTime(0.3, t); g.gain.exponentialRampToValueAtTime(0.001, t + 2); n.connect(hp); hp.connect(g); g.connect(E.bus.hat); g.connect(E.revIn);
  }
  function riser(t, len) {
    const n = noiseSrc(t, len), bp = ctx.createBiquadFilter(), g = ctx.createGain(); bp.type = 'bandpass'; bp.Q.value = 1.4;
    bp.frequency.setValueAtTime(300, t); bp.frequency.exponentialRampToValueAtTime(9000, t + len);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.28, t + len * 0.95); g.gain.linearRampToValueAtTime(0, t + len);
    n.connect(bp); bp.connect(g); g.connect(E.mix); g.connect(E.revIn);
  }

  /* ───────── Sequencer ───────── */
  let playing = false, gstep = 0, nextT = 0, songEnd = null, arpI = 0;
  const queue = [];
  function sectionAt(bar) {
    if (S.mode === 'loop') { const i = clamp(S.loopSec, 0, S.song.length - 1), sec = S.song[i]; return { sec, idx: i, barIn: bar % sec.bars }; }
    let b = bar;
    for (let i = 0; i < S.song.length; i++) { const sec = S.song[i]; if (b < sec.bars) return { sec, idx: i, barIn: b }; b -= sec.bars; }
    return null;
  }
  function chordNotes(deg) { const b = keyBase(); return [degMidi(deg, b - 12), degMidi(deg, b), degMidi(deg + 2, b), degMidi(deg + 4, b)]; }
  function scheduleStep(pos, s, t) {
    const sec = pos.sec, on = sec.t, barIn = pos.barIn, deg = S.prog[barIn % 4], sd = stepDur();
    if (s === 0 && barIn === 0) { if (sec.type === 'build') riser(t, sec.bars * 16 * sd); if (sec.type === 'drop') crash(t); }
    if (on.kick && S.drums.kick[s]) kick(t);
    if (on.clap && S.drums.clap[s]) clap(t);
    if (sec.type === 'build') {
      const rem = sec.bars - barIn;
      if (rem === 2 && s % 4 === 0) clap(t, 0.45);
      if (rem === 1 && (s < 8 ? s % 2 === 0 : true)) clap(t, 0.35 + 0.6 * s / 15);
    }
    if (on.hat) { if (S.drums.hat[s]) hat(t, false); if (S.drums.ohat[s]) hat(t, true); }
    if (on.bass && S.bass.steps[s]) {
      let len = 1; while (len < 4 && !S.bass.steps[(s + len) % 16] && s + len < 16) len++;
      const root = degMidi(deg, keyBase() - 12) + (S.bass.mode === 'octave' && s % 4 === 2 ? 12 : 0);
      tone(E.bus.bass, SOUNDS.bass[S.bass.sound], root, t, len * sd * 0.92, 1);
    }
    if (on.chords) {
      const r = S.chords.rhythm, snd = SOUNDS.chords[S.chords.sound];
      const hit = r === 'hold' ? s === 0 : r === 'pulse' ? s % 4 === 0 : s % 4 === 2, len = r === 'hold' ? 16 : r === 'pulse' ? 3 : 1.6;
      if (hit) chordNotes(deg).forEach((n, i) => tone(E.bus.chords, snd, n, t, len * sd * 0.98, i ? 0.8 : 0.55));
    }
    if (on.lead) {
      const idx = (barIn % 2) * 16 + s, n = S.lead.notes[idx];
      if (n >= 0) {
        let len = 1; while (len < 6 && idx + len < 32 && S.lead.notes[idx + len] < 0) len++;
        tone(E.bus.lead, SOUNDS.lead[S.lead.sound], degMidi(n, keyBase() + 12 * (+S.lead.oct)), t, len * sd * 0.95, 0.9);
      }
    }
    if (on.arp && (S.arp.rate === '16' || s % 2 === 0)) {
      const b = keyBase() + 12, up = [0, 2, 4, 7, 9, 11].map(k => degMidi(deg + k, b));
      const seqN = S.arp.dir === 'down' ? up.slice().reverse() : S.arp.dir === 'updown' ? up.concat(up.slice(1, -1).reverse()) : up;
      tone(E.bus.arp, SOUNDS.arp[S.arp.sound], seqN[arpI++ % seqN.length], t, sd * (S.arp.rate === '8' ? 1.6 : 0.8), 0.8);
    }
  }
  function tick() {
    if (!playing || !ctx) return;
    while (nextT < ctx.currentTime + 0.12) {
      const bar = Math.floor(gstep / 16), s = gstep % 16, pos = sectionAt(bar);
      if (!pos) { songEnd = nextT; playing = false; onSongEnd(); break; }
      scheduleStep(pos, s, nextT);
      queue.push({ t: nextT, s, bar, idx: pos.idx, barIn: pos.barIn, secBars: pos.sec.bars });
      gstep++; nextT += stepDur();
    }
  }
  setInterval(tick, 25);
  async function play(fromStart = true) {
    await power();
    if (playing) return;
    if (fromStart) { gstep = 0; arpI = 0; }
    playing = true; nextT = ctx.currentTime + 0.08; queue.length = 0; songEnd = null;
    $('#play').classList.add('on');
    F.played = 1; if (S.mode === 'song') F.songPlayed = 1;
    commit(false);
  }
  function stop() {
    playing = false; queue.length = 0; songEnd = null; $('#play').classList.remove('on'); clearPH();
    if (ctx) { const t = ctx.currentTime; E.duck.gain.cancelScheduledValues(t); E.duck.gain.setValueAtTime(1, t); }
    if (recorder) finishRec(1.5);
  }
  function onSongEnd() {
    const wait = Math.max(0, (songEnd - ctx.currentTime) * 1000);
    setTimeout(() => { $('#play').classList.remove('on'); clearPH(); if (recorder) finishRec(3); }, wait);
  }

  /* ───────── Recording ───────── */
  let recorder = null, recChunks = [], recStart = 0, recTimer = 0;
  async function recSong() {
    await power();
    if (recorder) { stop(); return; }
    if (!window.MediaRecorder) return toast('Recording is not supported in this browser');
    if (playing) stop();
    S.mode = 'song'; renderTransport();
    const type = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'].find(t => MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t)) || '';
    recChunks = []; recorder = new MediaRecorder(E.rec.stream, type ? { mimeType: type } : undefined);
    recorder.ondataavailable = e => { if (e.data.size) recChunks.push(e.data); };
    recorder.onstop = () => {
      const blob = new Blob(recChunks, { type: recorder.mimeType || 'audio/webm' }), ext = /mp4/.test(blob.type) ? 'm4a' : /ogg/.test(blob.type) ? 'ogg' : 'webm';
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
      a.download = ((S.title || 'dot01-song').replace(/[\\/:*?"<>|]+/g, '').trim() || 'dot01-song') + '.' + ext;
      document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      recorder = null; clearInterval(recTimer); $('#rec-led').classList.remove('on'); $('#rec-song').classList.remove('on'); $('#rec-label').textContent = 'RECORD WHOLE SONG';
      $('#rec-info').textContent = 'Downloaded: ' + a.download; F.recorded = 1; commit(false); toast('Done! Your song was downloaded');
    };
    recorder.start(); recStart = performance.now();
    $('#rec-led').classList.add('on'); $('#rec-song').classList.add('on'); $('#rec-label').textContent = 'RECORDING… CLICK TO STOP';
    const total = songBars() * 16 * stepDur();
    recTimer = setInterval(() => { const s = (performance.now() - recStart) / 1000; $('#rec-info').textContent = fmtTime(s) + ' / ' + fmtTime(total); }, 250);
    play(true);
  }
  function finishRec(tail) { const r = recorder; if (!r || r.state !== 'recording') return; setTimeout(() => { if (r.state === 'recording') r.stop(); }, tail * 1000); }
  const fmtTime = s => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
  const songBars = () => S.song.reduce((a, s) => a + s.bars, 0);

  /* ───────── UI: knobs & segs ───────── */
  const KN = 21, A0 = -135, A1 = 135;
  function knob(host, o) {
    let dots = ''; for (let i = 0; i < KN; i++) { const a = (A0 + (A1 - A0) * i / (KN - 1) - 90) * Math.PI / 180; dots += `<circle cx="${(30 + 26 * Math.cos(a)).toFixed(2)}" cy="${(30 + 26 * Math.sin(a)).toFixed(2)}" r="1.9"/>`; }
    const el = document.createElement('div'); el.className = 'knob'; el.tabIndex = 0; el.setAttribute('role', 'slider'); el.setAttribute('aria-label', o.label); el.dataset.k = o.id;
    el.innerHTML = `<svg viewBox="0 0 60 60"><g class="ring">${dots}</g><circle class="cap" cx="30" cy="30" r="18"/><circle class="ind" cx="30" cy="16" r="2.6"/></svg><span class="k-label">${o.label}</span><span class="k-val"></span>`;
    host.appendChild(el);
    const norm = v => (v - o.min) / (o.max - o.min), fromN = n => { let v = o.min + clamp(n, 0, 1) * (o.max - o.min); if (o.step) v = Math.round(v / o.step) * o.step; return +v.toFixed(3); };
    const render = () => {
      const v = o.get(), n = clamp(norm(v), 0, 1), lit = Math.round(n * (KN - 1));
      $$('.ring circle', el).forEach((c, i) => c.classList.toggle('lit', i <= lit));
      const a = (A0 + (A1 - A0) * n - 90) * Math.PI / 180, ind = $('.ind', el); ind.setAttribute('cx', (30 + 13 * Math.cos(a)).toFixed(2)); ind.setAttribute('cy', (30 + 13 * Math.sin(a)).toFixed(2));
      const txt = o.fmt(v); $('.k-val', el).textContent = txt; el.setAttribute('aria-valuetext', txt);
    };
    const setV = v => { if (v === o.get()) return; o.set(v); render(); o.after && o.after(); commit(false); };
    let sy = 0, sn = 0, drag = false;
    el.addEventListener('pointerdown', e => { drag = true; sy = e.clientY; sn = norm(o.get()); el.setPointerCapture(e.pointerId); el.classList.add('active'); e.preventDefault(); el.focus({ preventScroll: true }); });
    el.addEventListener('pointermove', e => { if (drag) setV(fromN(sn + (sy - e.clientY) / 170 * (e.shiftKey ? 0.25 : 1))); });
    const end = () => { drag = false; el.classList.remove('active'); };
    el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
    el.addEventListener('dblclick', () => setV(o.def));
    el.addEventListener('wheel', e => { e.preventDefault(); setV(fromN(norm(o.get()) - Math.sign(e.deltaY) * (o.step ? o.step / (o.max - o.min) : 0.02))); }, { passive: false });
    el.addEventListener('keydown', e => { const u = o.step ? o.step / (o.max - o.min) : 0.01, m = { ArrowUp: u, ArrowRight: u, ArrowDown: -u, ArrowLeft: -u }; if (e.key in m) { e.preventDefault(); e.stopPropagation(); setV(fromN(norm(o.get()) + m[e.key] * (e.shiftKey ? 10 : 1))); } });
    knobs.push(render); render();
  }
  const knobs = [];
  const pct = v => Math.round(v * 100) + '%';
  function buildKnobs() {
    const tp = $('#tp-knobs');
    knob(tp, { id: 'bpm', label: 'BPM', min: 90, max: 140, step: 1, def: 128, get: () => S.bpm, set: v => { S.bpm = v; }, fmt: v => v, after: applyAll });
    knob(tp, { id: 'slow', label: 'SLOWED', min: 0, max: 0.35, step: 0.01, def: 0.2, get: () => S.slow, set: v => { S.slow = v; }, fmt: v => '−' + Math.round(v * 100) + '%', after: applyAll });
    const fx = $('#fx-knobs');
    knob(fx, { id: 'reverb', label: 'REVERB', min: 0, max: 1, def: 0.2, get: () => S.fx.reverb, set: v => { S.fx.reverb = v; }, fmt: pct, after: applyAll });
    knob(fx, { id: 'size', label: 'R.SIZE', min: 0.8, max: 8, step: 0.1, def: 2.5, get: () => S.fx.size, set: v => { S.fx.size = v; }, fmt: v => v.toFixed(1) + 's', after: setIR });
    knob(fx, { id: 'delay', label: 'ECHO', min: 0, max: 1, def: 0.12, get: () => S.fx.delay, set: v => { S.fx.delay = v; }, fmt: pct, after: applyAll });
    knob(fx, { id: 'side', label: 'PUMP', min: 0, max: 1, def: 0, get: () => S.fx.side, set: v => { S.fx.side = v; }, fmt: pct });
    knob(fx, { id: 'lofi', label: 'LO-FI', min: 0, max: 1, def: 0, get: () => S.fx.lofi, set: v => { S.fx.lofi = v; }, fmt: pct, after: applyAll });
    const mx = $('#mix-knobs');
    TRACKS.concat('master').forEach(t => knob(mx, { id: 'mix-' + t, label: t === 'master' ? 'MASTER' : TNAME[t], min: 0, max: 1, def: DEF().mix[t], get: () => S.mix[t], set: v => { S.mix[t] = v; F.mixed = 1; }, fmt: pct, after: applyAll }));
  }
  function buildSegs() {
    $$('.seg[data-p]').forEach(el => {
      const p = el.dataset.p, opts = SEGS[p];
      el.innerHTML = Object.entries(opts).map(([v, l]) => `<button data-v="${v}">${l}</button>`).join('');
      el.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; set(p, b.dataset.v); F['seg:' + p] = 1; renderSegs(); commit(false); preview(p); });
    });
  }
  function renderSegs() { $$('.seg[data-p]').forEach(el => { const v = String(get(el.dataset.p)); $$('button', el).forEach(b => b.classList.toggle('on', b.dataset.v === v)); }); }
  async function preview(p) {
    if (playing) return; await power(); const t = ctx.currentTime + 0.02, sd = stepDur();
    if (p.startsWith('chords')) chordNotes(S.prog[0]).forEach((n, i) => tone(E.bus.chords, SOUNDS.chords[S.chords.sound], n, t, sd * 8, i ? 0.8 : 0.55));
    else if (p.startsWith('bass')) tone(E.bus.bass, SOUNDS.bass[S.bass.sound], degMidi(S.prog[0], keyBase() - 12), t, sd * 4, 1);
    else if (p.startsWith('lead')) [0, 2, 4].forEach((d, i) => tone(E.bus.lead, SOUNDS.lead[S.lead.sound], degMidi(d, keyBase() + 12 * (+S.lead.oct)), t + i * sd * 2, sd * 2, 0.9));
    else if (p.startsWith('arp')) [0, 2, 4, 7].forEach((d, i) => tone(E.bus.arp, SOUNDS.arp[S.arp.sound], degMidi(d, keyBase() + 12), t + i * sd, sd * 0.8, 0.8));
  }

  /* ───────── UI: grids ───────── */
  const DROWS = [['kick', 'KICK'], ['clap', 'CLAP'], ['hat', 'HAT'], ['ohat', 'OPEN HAT']];
  function renderDrums() {
    $('#drum-grid').innerHTML = DROWS.map(([k, l]) => `<div class="g-row"><span class="rl">${l}</span>${S.drums[k].map((v, i) => `<button class="cell ${v ? 'on' : ''}" data-d="${k}" data-i="${i}" aria-label="${l} ${i + 1}" aria-pressed="${!!v}"></button>`).join('')}</div>`).join('');
  }
  $('#drum-grid').addEventListener('click', async e => {
    const b = e.target.closest('.cell'); if (!b) return; const k = b.dataset.d, i = +b.dataset.i;
    S.drums[k][i] = S.drums[k][i] ? 0 : 1; renderDrums(); commit(false);
    if (S.drums[k][i] && !playing) { await power(); const t = ctx.currentTime + 0.01; k === 'kick' ? kick(t) : k === 'clap' ? clap(t) : hat(t, k === 'ohat'); }
  });
  const DRUM_PRESETS = {
    'FOUR ON FLOOR': { kick: [0, 4, 8, 12], clap: [4, 12], hat: [2, 6, 10, 14], ohat: [] },
    'HALF-TIME': { kick: [0, 10], clap: [8], hat: [0, 2, 4, 6, 8, 10, 12, 14], ohat: [14] },
    'TRAP': { kick: [0, 7, 10], clap: [8], hat: [0, 2, 4, 6, 8, 9, 10, 12, 14, 15], ohat: [] },
    'CLEAR': { kick: [], clap: [], hat: [], ohat: [] }
  };
  $('#drum-presets').innerHTML = Object.keys(DRUM_PRESETS).map(k => `<button class="chipb" data-k="${k}">${k}</button>`).join('');
  $('#drum-presets').addEventListener('click', e => { const b = e.target.closest('[data-k]'); if (!b) return; const p = DRUM_PRESETS[b.dataset.k]; DROWS.forEach(([k]) => { S.drums[k] = z16(); p[k].forEach(i => { S.drums[k][i] = 1; }); }); renderDrums(); commit(); });

  function renderBass() { $('#bass-grid').innerHTML = `<div class="g-row">${S.bass.steps.map((v, i) => `<button class="cell ${v ? 'on' : ''}" data-i="${i}" aria-label="Bass ${i + 1}"></button>`).join('')}</div>`; }
  $('#bass-grid').addEventListener('click', e => { const b = e.target.closest('.cell'); if (!b) return; const i = +b.dataset.i; S.bass.steps[i] = S.bass.steps[i] ? 0 : 1; renderBass(); commit(false); });
  const BASS_PRESETS = { OFFBEAT: [2, 6, 10, 14], EIGHTHS: [0, 2, 4, 6, 8, 10, 12, 14], LONG: [0, 8], CLEAR: [] };
  $('#bass-presets').innerHTML = Object.keys(BASS_PRESETS).map(k => `<button class="chipb" data-k="${k}">${k}</button>`).join('');
  $('#bass-presets').addEventListener('click', e => { const b = e.target.closest('[data-k]'); if (!b) return; S.bass.steps = z16(); BASS_PRESETS[b.dataset.k].forEach(i => { S.bass.steps[i] = 1; }); renderBass(); commit(); });

  function renderProg() {
    $('#prog').innerHTML = S.prog.map((d, i) => `<button class="chord" data-i="${i}" title="Click to change the chord"><small>BAR ${i + 1}</small><b>${chordName(d)}</b><small>${ROMAN[d]}</small></button>`).join('');
  }
  $('#prog').addEventListener('click', async e => {
    const b = e.target.closest('.chord'); if (!b) return; const i = +b.dataset.i;
    S.prog[i] = (S.prog[i] + 1) % 7; F.progSet = 1; renderProg(); renderRoll(); commit(false);
    if (!playing) { await power(); chordNotes(S.prog[i]).forEach((n, k) => tone(E.bus.chords, SOUNDS.chords[S.chords.sound], n, ctx.currentTime + 0.02, stepDur() * 8, k ? 0.8 : 0.55)); }
  });
  const PROGS = { 'Epic i-VI-III-VII': [0, 5, 2, 6], 'Insomnia i-VII-VI-VII': [0, 6, 5, 6], 'Dream VI-VII-i-i': [5, 6, 0, 0], 'Sad i-v-VI-iv': [0, 4, 5, 3] };
  $('#prog-presets').innerHTML = Object.keys(PROGS).map(k => `<button class="chipb" data-k="${k}">${k}</button>`).join('');
  $('#prog-presets').addEventListener('click', e => { const b = e.target.closest('[data-k]'); if (!b) return; S.prog = PROGS[b.dataset.k].slice(); F.progSet = 1; renderProg(); commit(); });

  function renderRoll() {
    const base = keyBase() + 12 * (+S.lead.oct), notes = S.lead.notes, tails = new Set();
    notes.forEach((n, i) => { if (n < 0) return; for (let k = 1; k < 6 && i + k < 32 && notes[i + k] < 0; k++) tails.add((i + k) + ':' + n); });
    let h = '';
    for (let r = 7; r >= 0; r--) {
      const m = degMidi(r, base);
      h += `<div class="r-row"><span class="rl ${r % 7 === 0 ? 'root' : ''}">${nn(m)}${Math.floor(m / 12) - 1}</span>`;
      for (let c = 0; c < 32; c++) h += `<button class="rc ${c >= 16 ? 'bar2' : ''} ${notes[c] === r ? 'on' : tails.has(c + ':' + r) ? 'tail' : ''}" data-r="${r}" data-c="${c}" aria-label="${nn(m)} step ${c + 1}"></button>`;
      h += '</div>';
    }
    $('#roll').innerHTML = h;
  }
  $('#roll').addEventListener('click', async e => {
    const b = e.target.closest('.rc'); if (!b) return; const r = +b.dataset.r, c = +b.dataset.c;
    S.lead.notes[c] = S.lead.notes[c] === r ? -1 : r; renderRoll(); commit(false);
    if (S.lead.notes[c] >= 0 && !playing) { await power(); tone(E.bus.lead, SOUNDS.lead[S.lead.sound], degMidi(r, keyBase() + 12 * (+S.lead.oct)), ctx.currentTime + 0.01, stepDur() * 2, 0.9); }
  });
  function leadIdea() {
    const RH = [[0, 3, 6, 8, 10, 12, 16, 19, 22, 24, 28], [0, 2, 4, 8, 11, 14, 16, 18, 20, 24], [0, 4, 6, 8, 12, 16, 20, 22, 24, 26, 28], [0, 3, 6, 10, 12, 16, 19, 22, 26]];
    const rh = RH[Math.floor(Math.random() * RH.length)], notes = Array(32).fill(-1);
    const tone0 = d => [0, 2, 4].map(k => ((d + k) % 7)).map(x => x);
    let cur = tone0(S.prog[0])[Math.floor(Math.random() * 3)];
    rh.forEach((st, i) => {
      const barDeg = S.prog[st < 16 ? 0 : 1], strong = st % 4 === 0;
      if (strong) { const ct = tone0(barDeg).concat(tone0(barDeg).map(x => x + 7)).filter(x => x <= 7); cur = ct.reduce((a, b) => Math.abs(b - cur) < Math.abs(a - cur) ? b : a, ct[0]); }
      else cur = clamp(cur + [-2, -1, -1, 1, 1, 2][Math.floor(Math.random() * 6)], 0, 7);
      if (i === rh.length - 1) cur = tone0(S.prog[1])[0] % 7;
      notes[st] = cur;
    });
    for (let i = 0; i < 16; i++) if (Math.random() < 0.5 && notes[i] >= 0 && notes[i + 16] < 0) notes[i + 16] = notes[i];
    S.lead.notes = notes; renderRoll(); commit();
  }
  $('#lead-idea').onclick = leadIdea;
  $('#lead-clear').onclick = () => { S.lead.notes = Array(32).fill(-1); renderRoll(); commit(); };

  /* ───────── UI: song arrangement ───────── */
  const TYPES = { intro: 'INTRO', build: 'BUILD', drop: 'DROP', break: 'BREAK', outro: 'OUTRO' };
  function renderSong() {
    $('#timeline').innerHTML = S.song.map((s, i) => `<button class="sec ${s.bars === 8 ? 'w8' : ''} ${i === S.sel ? 'sel' : ''}" data-i="${i}"><small>${TYPES[s.type]} · ${s.bars} BARS</small><b>${s.name}</b><span class="dots">${TRACKS.map(t => `<i class="${s.t[t] ? 'on' : ''}" title="${TNAME[t]}"></i>`).join('')}</span><span class="prog-bar"></span></button>`).join('') + '<button class="sec add" id="sec-add">+ NEW SECTION</button>';
    const s = S.song[S.sel];
    $('#sec-edit').innerHTML = s ? `<input id="sec-name" value="${s.name.replace(/"/g, '&quot;')}" maxlength="14" aria-label="Section name">
      <div class="seg" id="sec-type">${Object.entries(TYPES).map(([k, l]) => `<button data-v="${k}" class="${s.type === k ? 'on' : ''}">${l}</button>`).join('')}</div>
      <div class="seg" id="sec-bars">${[2, 4, 8].map(b => `<button data-v="${b}" class="${s.bars === b ? 'on' : ''}">${b} BARS</button>`).join('')}</div>
      <div class="btn-row" id="sec-tracks">${TRACKS.map(t => `<button class="tt ${s.t[t] ? 'on' : ''}" data-t="${t}"><i></i>${TNAME[t]}</button>`).join('')}</div>
      <div class="btn-row"><button class="chipb" data-a="left">◀</button><button class="chipb" data-a="right">▶</button><button class="chipb" data-a="dup">DUPLICATE</button><button class="chipb" data-a="del">DELETE</button></div>` : '';
    $('#loop-section').innerHTML = S.song.map((s2, i) => `<option value="${i}">${i + 1}. ${s2.name}</option>`).join('');
    $('#loop-section').value = S.loopSec;
  }
  $('#timeline').addEventListener('click', e => {
    if (e.target.closest('#sec-add')) { S.song.push(JSON.parse(JSON.stringify(S.song[S.sel] || defaultSong()[2]))); S.sel = S.song.length - 1; S.loopSec = S.sel; F.arr = 1; renderSong(); commit(); return; }
    const b = e.target.closest('.sec'); if (!b) return; S.sel = +b.dataset.i; S.loopSec = S.sel; renderSong(); commit(false);
  });
  $('#sec-edit').addEventListener('click', e => {
    const s = S.song[S.sel]; if (!s) return;
    const tt = e.target.closest('[data-t]'), ty = e.target.closest('#sec-type button'), bs = e.target.closest('#sec-bars button'), a = e.target.closest('[data-a]');
    if (tt) { s.t[tt.dataset.t] = s.t[tt.dataset.t] ? 0 : 1; F.arr = 1; }
    else if (ty) { s.type = ty.dataset.v; F.arr = 1; }
    else if (bs) { s.bars = +bs.dataset.v; F.arr = 1; }
    else if (a) {
      const i = S.sel, A = a.dataset.a; F.arr = 1;
      if (A === 'left' && i > 0) { [S.song[i - 1], S.song[i]] = [S.song[i], S.song[i - 1]]; S.sel--; }
      if (A === 'right' && i < S.song.length - 1) { [S.song[i + 1], S.song[i]] = [S.song[i], S.song[i + 1]]; S.sel++; }
      if (A === 'dup') { S.song.splice(i + 1, 0, JSON.parse(JSON.stringify(s))); S.sel++; }
      if (A === 'del' && S.song.length > 1) { S.song.splice(i, 1); S.sel = Math.min(i, S.song.length - 1); }
      S.loopSec = S.sel;
    } else return;
    renderSong(); commit();
  });
  $('#sec-edit').addEventListener('input', e => { if (e.target.id === 'sec-name') { S.song[S.sel].name = e.target.value || 'Section'; F.arr = 1; const b = $(`.sec[data-i="${S.sel}"] b`); if (b) b.textContent = S.song[S.sel].name; $('#loop-section').options[S.sel].textContent = (S.sel + 1) + '. ' + S.song[S.sel].name; commit(false); } });
  $('#song-reset').onclick = () => { S.song = defaultSong(); S.sel = S.loopSec = 2; renderSong(); commit(); };

  /* ───────── Transport ───────── */
  function renderTransport() {
    $$('#play-mode button').forEach(b => b.classList.toggle('on', b.dataset.v === S.mode));
    $('#loop-section').disabled = S.mode !== 'loop';
    $('#eff-bpm').textContent = Math.round(effBpm());
    $('#key-root').value = S.key;
  }
  $('#key-root').innerHTML = KEYNAME.map((n, i) => `<option value="${i}">${n}</option>`).join('');
  $('#key-root').onchange = e => { S.key = +e.target.value; F.key = 1; renderProg(); renderRoll(); commit(); preview('chords'); };
  $('#play').onclick = () => playing ? stop() : play(true);
  $('#play-mode').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; const was = playing; if (was) stop(); S.mode = b.dataset.v; renderTransport(); commit(false); if (was) play(true); });
  $('#loop-section').onchange = e => { S.loopSec = S.sel = +e.target.value; renderSong(); commit(false); };
  $('#rec-song').onclick = recSong;
  $('#proj-reset').onclick = () => { if (!confirm('Clear your whole project and start over?')) return; stop(); const d = DEF(); Object.keys(d).forEach(k => { S[k] = d[k]; }); Object.keys(F).forEach(k => delete F[k]); S.f = F; renderEverything(); applyAll(); commit(); openStep(0); };
  $('#song-title').value = S.title;
  $('#song-title').addEventListener('input', e => { S.title = e.target.value; commit(false); });
  document.addEventListener('keydown', e => {
    const a = document.activeElement; if (a && (a.tagName === 'INPUT' || a.tagName === 'SELECT' || a.tagName === 'TEXTAREA' || a.classList.contains('knob'))) return;
    if (e.key === ' ') { e.preventDefault(); playing ? stop() : play(true); }
  });

  /* ───────── Playhead + meter ───────── */
  let lastPH = null;
  function clearPH() { $$('.ph').forEach(el => el.classList.remove('ph')); $$('.sec .prog-bar').forEach(el => { el.style.width = 0; }); lastPH = null; }
  const meter = $('#meter'), mg = meter.getContext('2d'); let mbuf = null, peakHold = 0;
  function frame() {
    requestAnimationFrame(frame);
    if (ctx) {
      let ev = null; while (queue.length && queue[0].t <= ctx.currentTime) ev = queue.shift();
      if (ev && playing !== null) {
        clearPH();
        $$(`#drum-grid .cell[data-i="${ev.s}"], #bass-grid .cell[data-i="${ev.s}"]`).forEach(c => c.classList.add('ph'));
        $$(`#roll .rc[data-c="${(ev.barIn % 2) * 16 + ev.s}"]`).forEach(c => c.classList.add('ph'));
        const ch = $(`#prog .chord[data-i="${ev.barIn % 4}"]`); if (ch) ch.classList.add('ph');
        const sec = $(`.sec[data-i="${ev.idx}"]`); if (sec) { sec.classList.add('ph'); $('.prog-bar', sec).style.width = ((ev.barIn * 16 + ev.s + 1) / (ev.secBars * 16) * 100) + '%'; }
        $('#pos').textContent = (ev.bar + 1) + '.' + (Math.floor(ev.s / 4) + 1);
        if (S.mode === 'song' && S.song[ev.idx] && S.song[ev.idx].type === 'drop' && !F.heardDrop) { F.heardDrop = 1; commit(false); }
        lastPH = ev;
      }
      if (!mbuf) mbuf = new Float32Array(E.an.fftSize);
      E.an.getFloatTimeDomainData(mbuf); let pk = 0; for (let i = 0; i < mbuf.length; i++) pk = Math.max(pk, Math.abs(mbuf[i]));
      peakHold = Math.max(pk, peakHold * 0.94);
      const w = meter.clientWidth, h = meter.clientHeight, dpr = Math.min(2, devicePixelRatio || 1);
      if (meter.width !== w * dpr) { meter.width = w * dpr; meter.height = h * dpr; }
      mg.setTransform(dpr, 0, 0, dpr, 0, 0); mg.clearRect(0, 0, w, h);
      const n = 20, lit = Math.round(peakHold * n), ink = getComputedStyle(document.documentElement).getPropertyValue('--ink').trim() || '#111';
      for (let i = 0; i < n; i++) { mg.fillStyle = i < lit ? (i >= n - 2 ? '#d71921' : ink) : 'rgba(128,128,128,.25)'; mg.beginPath(); mg.arc(4 + i * (w - 8) / (n - 1), h / 2, 2.6, 0, 6.283); mg.fill(); }
    }
  }
  requestAnimationFrame(frame);

  /* ───────── Guide ───────── */
  const cnt = a => a.filter(Boolean).length;
  const STEPS = [
    { id: 'start', title: 'Get to know the sound', panel: 'transport',
      body: `<p>Your reference, the slowed version of “INSOMNIA”, belongs to the <b>slowed + reverb</b> style: take an electronic dance track, <b>slow it down 15–25%</b> (which also lowers the pitch), then drown it in <b>big reverb</b>. The result feels hazy, late-night and a little sad.</p>
        <p>We won’t copy the original melody (that’s someone else’s work). Instead we’ll use the same <b>recipe</b> to make a <b>completely original song of your own</b>. Listen to the original a few times on your streaming app to soak up the mood.</p>
        <p class="why">An EDM track is usually built from 5 things: <b>drums</b> (rhythm), <b>bass</b> (low end), <b>chords</b> (emotion), <b>melody</b> (the hook) and <b>arrangement</b> (the rise and fall). We’ll stack them one at a time.</p>`,
      tasks: [['Press ▶ play at the top left (it’s quiet for now, that’s normal)', () => F.played]],
      auto: () => play(true) },
    { id: 'tempo', title: 'Tempo: fast first, then slow it down', panel: 'transport',
      body: `<p><b>BPM</b> means beats per minute. Most original EDM tracks sit around <b>124–128</b>.</p><p>The <b>SLOWED</b> knob imitates slowing down a record: tempo and pitch drop together, which is the signature sound of slowed edits. Watch the “REAL BPM” readout change.</p><p class="why">Tip: drag knobs up and down, use the mouse wheel, or click one and use the arrow keys. Double-click resets it.</p>`,
      tasks: [['Set BPM between 124 and 128', () => S.bpm >= 124 && S.bpm <= 128], ['Turn SLOWED to at least −15%', () => S.slow >= 0.15]],
      auto: () => { S.bpm = 128; S.slow = 0.2; applyAll(); } },
    { id: 'key', title: 'Key: pick a moody minor key', panel: 'transport',
      body: `<p>Slowed songs almost always use a <b>minor key</b>, which sounds naturally melancholic. The <b>KEY</b> menu at the top sets the home note of your whole song.</p><p>Not sure? <b>F</b> or <b>A</b> both work great. Good news: every note in this studio automatically stays in key, so <b>you can’t play a wrong note</b>.</p>`,
      tasks: [['Choose a key in the KEY menu at the top', () => F.key]],
      auto: () => { S.key = 5; F.key = 1; } },
    { id: 'chords', title: 'Chords: set the emotion', panel: 'p-chords',
      body: `<p>A chord is several notes ringing together, and it carries the <b>emotion</b>. Here you have a 4-bar loop with one chord per bar.</p><p>Try a ready-made <b>preset</b> first (for example “Insomnia”), then click any chord to swap it until the progression feels right to you.</p><p class="why">“m” means a minor chord (dark); no “m” means major (bright). Alternating dark and bright creates emotional movement.</p>`,
      tasks: [['Pick a chord progression (or click out 4 chords yourself)', () => F.progSet], ['Try a different chord sound or rhythm', () => F['seg:chords.sound'] || F['seg:chords.rhythm']]],
      auto: () => { S.prog = [0, 6, 5, 6]; F.progSet = 1; S.chords.sound = 'pad'; F['seg:chords.sound'] = 1; } },
    { id: 'kick', title: 'Kick drum: the heartbeat', panel: 'p-drums',
      body: `<p>Each square is a 16th note. <b>Every 4 squares make one beat</b>, and a bar has 4 beats.</p><p>Light up squares 1, 5, 9 and 13 on the <b>KICK</b> row. That’s the classic EDM <b>four on the floor</b>: boom, boom, boom, boom.</p><p class="why">For a slower, heavier feel, try the “HALF-TIME” preset above.</p>`,
      tasks: [['Place at least 4 kicks', () => cnt(S.drums.kick) >= 4], ['Put kicks on squares 1, 5, 9 and 13 (or use any preset)', () => [0, 4, 8, 12].every(i => S.drums.kick[i]) || F.drumPreset]],
      auto: () => { S.drums.kick = z16(); [0, 4, 8, 12].forEach(i => { S.drums.kick[i] = 1; }); } },
    { id: 'groove', title: 'Claps and hi-hats: make it move', panel: 'p-drums',
      body: `<p>Put the <b>CLAP</b> on squares 5 and 13 (beats 2 and 4) so it answers the kick.</p><p>Put the <b>HAT</b> between the kicks (squares 3, 7, 11, 15) for a driving groove. The <b>OPEN HAT</b> is a longer “tssss”; one now and then is enough.</p>`,
      tasks: [['Place at least 2 claps', () => cnt(S.drums.clap) >= 2], ['Place at least 4 hi-hats', () => cnt(S.drums.hat) + cnt(S.drums.ohat) >= 4]],
      auto: () => { S.drums.clap = z16(); [4, 12].forEach(i => { S.drums.clap[i] = 1; }); S.drums.hat = z16(); [2, 6, 10, 14].forEach(i => { S.drums.hat[i] = 1; }); } },
    { id: 'bass', title: 'Bass and the “pump”', panel: 'p-bass',
      body: `<p>The bass <b>automatically follows the root of each chord</b>. You only decide when it plays. Try “OFFBEAT”: between the kicks, boom-womm-boom-womm.</p><p>Then go to <b>SPACE</b> and turn up <b>PUMP</b>. Every time the kick hits, everything else ducks and swells back up. That breathing pump is the soul of EDM (producers call it sidechain).</p>`,
      tasks: [['Make the bass play at least 4 times', () => cnt(S.bass.steps) >= 4], ['Turn PUMP above 30%', () => S.fx.side >= 0.3]],
      auto: () => { S.bass.steps = z16(); [2, 6, 10, 14].forEach(i => { S.bass.steps[i] = 1; }); S.fx.side = 0.6; } },
    { id: 'lead', title: 'Melody: your song’s signature', panel: 'p-lead',
      body: `<p>The melody is the part people hum. This is a 2-bar “piano roll”: <b>higher rows are higher notes</b> and each column is a moment in time. Click to add a note, click again to remove it. Each note rings until the next one starts.</p><p>Stuck? Press <b>✦ GIVE ME AN IDEA</b> for a starting point, then change the notes you don’t like. Now it’s yours.</p><p class="why">Secrets of a good melody: <b>repeat</b> a short phrase, land on chord notes on strong beats (every 4 squares), and end on the red home note.</p>`,
      tasks: [['Place at least 6 notes', () => S.lead.notes.filter(n => n >= 0).length >= 6], ['Use both bars', () => S.lead.notes.slice(0, 16).some(n => n >= 0) && S.lead.notes.slice(16).some(n => n >= 0)]],
      auto: () => leadIdea() },
    { id: 'arp', title: 'Arpeggio: stars in the night sky', panel: 'p-arp',
      body: `<p>An arpeggio plays the chord notes one by one, quickly. It sparkles nicely in a drop or a breakdown.</p><p>Pick a sound to preview, then go to <b>SONG ARRANGEMENT</b> at the top, click a section (for example Break or Drop 2), and switch <b>ARP</b> on below it.</p>`,
      tasks: [['Preview an arpeggio sound', () => F['seg:arp.sound'] || F['seg:arp.rate'] || F['seg:arp.dir']], ['Turn ARP on in at least one section', () => S.song.some(s => s.t.arp)]],
      auto: () => { F['seg:arp.sound'] = 1; S.song.forEach(s => { if (s.type === 'break' || s.name === 'Drop 2') s.t.arp = 1; }); } },
    { id: 'space', title: 'The slowed + reverb magic', panel: 'p-fx',
      body: `<p>This step instantly gives your song “that feeling”.</p><p><b>REVERB</b>: how much echoing space, like a cathedral. <b>R.SIZE</b>: how big the space is. <b>LO-FI</b>: imitates an old tape, darker with a gentle pitch wobble. <b>ECHO</b>: repeating delay.</p><p class="why">Typical slowed settings: reverb above 50%, space above 4 seconds, plus a touch of lo-fi.</p>`,
      tasks: [['Turn REVERB above 40%', () => S.fx.reverb >= 0.4], ['Turn R.SIZE above 4 seconds', () => S.fx.size >= 4], ['Add some LO-FI', () => S.fx.lofi > 0.05]],
      auto: () => { S.fx.reverb = 0.55; S.fx.size = 5; S.fx.lofi = 0.3; S.fx.delay = 0.2; setIR(); } },
    { id: 'arrange', title: 'Arrangement: give it highs and lows', panel: 'p-song',
      body: `<p>So far you’ve been looping one section. A song needs <b>movement</b>: the <b>Intro</b> starts softly → the <b>Build</b> adds tension (a rising whoosh and faster and faster claps are added automatically) → the <b>Drop</b> hits with everything → the <b>Break</b> lets you breathe → do it again → the <b>Outro</b> winds down.</p><p>Click any section to switch tracks on or off, rename it or change its length. Then switch the mode at the top to <b>WHOLE SONG</b> and listen from the start.</p>`,
      tasks: [['Play in WHOLE SONG mode until the first Drop', () => F.heardDrop], ['Change at least one section (toggle a track, change its length or add one)', () => F.arr]],
      auto: () => { S.mode = 'song'; renderTransport(); play(true); } },
    { id: 'mix', title: 'Mix and name it', panel: 'p-mix',
      body: `<p>Mixing means balancing how loud each track is, so everything is heard without fighting. As a rule: <b>kick and bass loudest</b>, melody clear, chords and arpeggio underneath. The dots at the top right are a level meter. <b>If the red dots light up, it’s too loud</b>, so turn MASTER down a little.</p><p>Finally, <b>give your song a name</b> at the top of the guide.</p>`,
      tasks: [['Adjust the volume of any track', () => F.mixed], ['Name your song', () => S.title.trim().length > 0]],
      auto: () => { Object.assign(S.mix, { kick: 0.85, clap: 0.6, hat: 0.4, bass: 0.8, chords: 0.55, lead: 0.72, arp: 0.42, master: 0.8 }); F.mixed = 1; if (!S.title.trim()) { S.title = 'Sleepless Nights (Slowed)'; $('#song-title').value = S.title; } } },
    { id: 'export', title: 'Record your first song!', panel: 'p-export',
      body: `<p>Press <b>RECORD WHOLE SONG</b>. The studio plays the whole song from the start while recording, then downloads the audio file automatically, named after your song. Keep this tab open while it records.</p><p>Congratulations, you’ve made a slowed EDM track of your own. 🎧 Your project is saved on this device, so you can come back and keep changing it any time.</p>`,
      tasks: [['Record and download the whole song', () => F.recorded]],
      auto: () => recSong() }
  ];
  let openIdx = -1;
  function renderGuide() {
    const doneN = STEPS.filter(st => st.tasks.every(([, f]) => f())).length;
    $('#g-bar').style.width = (doneN / STEPS.length * 100) + '%'; $('#g-count').textContent = doneN + ' / ' + STEPS.length;
    const cur = STEPS.findIndex(st => !st.tasks.every(([, f]) => f()));
    $('#g-steps').innerHTML = STEPS.map((st, i) => {
      const done = st.tasks.every(([, f]) => f());
      return `<li class="g-step ${done ? 'done' : ''} ${i === cur ? 'cur' : ''} ${i === openIdx ? 'open' : ''}" data-i="${i}">
        <button class="g-sh"><span class="g-num">${done ? '✓' : i + 1}</span><b>${st.title}</b><span class="g-go">${i === openIdx ? '−' : '+'}</span></button>
        <div class="g-body">${st.body}<ul class="g-tasks">${st.tasks.map(([t, f]) => `<li class="${f() ? 'ok' : ''}">${t}</li>`).join('')}</ul>
          <div class="g-acts"><button class="g-btn" data-go="${i}">SHOW ME</button><button class="g-btn" data-auto="${i}">DO IT FOR ME</button>${i < STEPS.length - 1 ? `<button class="g-btn primary" data-next="${i}">NEXT →</button>` : ''}</div></div></li>`;
    }).join('');
  }
  function openStep(i, scroll = true) {
    openIdx = i; renderGuide(); const st = STEPS[i]; if (!st) return;
    const li = $(`.g-step[data-i="${i}"]`); if (li && scroll) li.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
  function focusPanel(id) {
    const p = document.getElementById(id); if (!p) return;
    p.scrollIntoView({ behavior: 'smooth', block: 'start' }); p.classList.add('focus'); setTimeout(() => p.classList.remove('focus'), 1800);
  }
  $('#g-steps').addEventListener('click', e => {
    const h = e.target.closest('.g-sh'), go = e.target.closest('[data-go]'), au = e.target.closest('[data-auto]'), nx = e.target.closest('[data-next]');
    if (h) { const i = +h.parentElement.dataset.i; openStep(openIdx === i ? -1 : i, false); if (openIdx === i) focusPanel(STEPS[i].panel); return; }
    if (go) focusPanel(STEPS[+go.dataset.go].panel);
    if (au) { const st = STEPS[+au.dataset.auto]; Promise.resolve(st.auto()).then(() => { renderEverything(); applyAll(); commit(); toast('Done for you: ' + st.title); focusPanel(st.panel); }); }
    if (nx) { const i = +nx.dataset.next + 1; openStep(i); focusPanel(STEPS[i].panel); }
  });
  let wasDone = new Set();
  function commit(full = true) {
    save(); renderTransport(); knobs.forEach(r => r()); if (full) { renderSegs(); }
    const before = openIdx;
    const nowDone = new Set(STEPS.filter(st => st.tasks.every(([, f]) => f())).map(st => st.id));
    renderGuide();
    nowDone.forEach(id => { if (!wasDone.has(id) && wasDone.size + 0 >= 0 && booted) { const i = STEPS.findIndex(s => s.id === id); if (i === before) { toast('✓ Done: ' + STEPS[i].title); const nxt = STEPS.findIndex(st => !st.tasks.every(([, f]) => f())); if (nxt >= 0) setTimeout(() => openStep(nxt), 900); } } });
    wasDone = nowDone;
  }
  // mark drum preset usage
  $('#drum-presets').addEventListener('click', e => { if (e.target.closest('[data-k]')) { F.drumPreset = 1; commit(false); } });

  /* ───────── Theme, toast, power ───────── */
  const theme = store.get('dot01:theme', null); if (theme) document.documentElement.dataset.theme = theme;
  $('#theme-btn').onclick = () => {
    const dark = document.documentElement.dataset.theme ? document.documentElement.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.dataset.theme = dark ? 'light' : 'dark'; store.set('dot01:theme', dark ? 'light' : 'dark');
  };
  let toastT = 0;
  function toast(m) { const t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2000); }
  async function power() {
    if (!ctx) { initAudio(); try { sessionStorage.setItem('dot01:powered', '1'); } catch { /* storage unavailable */ } $('#power').classList.add('off'); setTimeout(() => { $('#power').hidden = true; }, 500); }
    if (ctx.state !== 'running') await ctx.resume();
  }

  // After the first POWER ON in this browser session, skip the overlay and start audio on the first gesture.
  if (document.documentElement.classList.contains('powered')) ['pointerdown', 'keydown'].forEach(ev => document.addEventListener(ev, () => power(), { once: true, capture: true }));
  $('#power-btn').onclick = () => power();

  /* ───────── Boot ───────── */
  let booted = false;
  function renderEverything() { renderDrums(); renderBass(); renderProg(); renderRoll(); renderSong(); renderSegs(); renderTransport(); knobs.forEach(r => r()); $('#song-title').value = S.title; }
  buildKnobs(); buildSegs(); renderEverything();
  const first = STEPS.findIndex(st => !st.tasks.every(([, f]) => f()));
  openStep(first < 0 ? STEPS.length - 1 : first, false);
  wasDone = new Set(STEPS.filter(st => st.tasks.every(([, f]) => f())).map(st => st.id));
  booted = true;
  window.STUDIO = { S, play, stop, power, STEPS, get ctx() { return ctx; }, level() { if (!E.an) return 0; const d = new Float32Array(E.an.fftSize); E.an.getFloatTimeDomainData(d); return Math.max(...d.map(Math.abs)); } };
})();
