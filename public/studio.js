/* DOT-01 Studio — a drag-and-drop EDM timeline with a built-in, step-by-step guide. No dependencies. */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage unavailable */ } }
  };
  const cap = (el, id) => { try { el.setPointerCapture(id); } catch (e) { /* pointer already released */ } };
  const mtof = n => 440 * Math.pow(2, (n - 69) / 12);
  const z16 = () => Array(16).fill(0);
  const clone = o => JSON.parse(JSON.stringify(o));
  const SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'], FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
  const KEYNAME = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B'];
  const SCALES = {
    minor: { iv: [0, 2, 3, 5, 7, 8, 10], q: ['m', '°', '', 'm', 'm', '', ''], r: ['i', 'ii°', 'III', 'iv', 'v', 'VI', 'VII'], sharpKeys: [1, 4, 6, 8, 9, 11] },
    major: { iv: [0, 2, 4, 5, 7, 9, 11], q: ['', 'm', 'm', '', '', 'm', '°'], r: ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'], sharpKeys: [0, 2, 4, 6, 7, 9, 11] }
  };
  const TR = ['drums', 'bass', 'chords', 'lead', 'arp'];
  const TRNAME = { drums: 'DRUMS', bass: 'BASS', chords: 'CHORDS', lead: 'LEAD', arp: 'ARP' };
  const PATBARS = { drums: 1, bass: 1, chords: 4, lead: 2, arp: 1 };
  const MIXCH = ['kick', 'clap', 'hat', 'bass', 'chords', 'lead', 'arp'];
  const MIXNAME = { kick: 'KICK', clap: 'CLAP', hat: 'HATS', bass: 'BASS', chords: 'CHORDS', lead: 'LEAD', arp: 'ARP' };

  /* ───────── Sounds ───────── */
  const SOUNDS = {
    bass: {
      sub: { label: 'SUB', waves: ['sine', ['triangle', 12]], cutoff: 700, reso: 1, fenv: 0.6, fdec: 0.2, a: 0.004, d: 0.3, s: 0.9, r: 0.12, gain: 0.8 },
      reese: { label: 'REESE', waves: ['sawtooth'], unison: 2, spread: 16, cutoff: 520, reso: 3, fenv: 1.2, fdec: 0.3, a: 0.008, d: 0.4, s: 0.8, r: 0.15, gain: 0.5 },
      pluck: { label: 'PLUCK', waves: ['square'], cutoff: 480, reso: 7, fenv: 3, fdec: 0.14, a: 0.002, d: 0.25, s: 0.25, r: 0.1, gain: 0.5 }
    },
    chords: {
      saw: { label: 'SUPERSAW', waves: ['sawtooth'], unison: 5, spread: 24, cutoff: 3800, reso: 0.8, fenv: 0.6, fdec: 0.5, a: 0.01, d: 0.4, s: 0.75, r: 0.35, gain: 0.13 },
      pad: { label: 'PAD', waves: ['sawtooth'], unison: 3, spread: 14, cutoff: 1200, reso: 1, fenv: 0.7, fdec: 1.6, a: 0.35, d: 1, s: 0.8, r: 1.3, gain: 0.2 },
      keys: { label: 'PIANO', waves: ['triangle', ['sine', 12]], unison: 2, spread: 6, cutoff: 2600, reso: 0.7, fenv: 1, fdec: 0.6, a: 0.004, d: 1.3, s: 0.25, r: 0.5, gain: 0.26 }
    },
    lead: {
      pluck: { label: 'PLUCK', waves: ['sawtooth'], unison: 2, spread: 10, cutoff: 1600, reso: 3, fenv: 2.4, fdec: 0.18, a: 0.002, d: 0.35, s: 0.1, r: 0.3, gain: 0.28 },
      dream: { label: 'DREAM', waves: ['triangle', ['sine', 12]], unison: 2, spread: 8, cutoff: 3200, reso: 1, fenv: 0.8, fdec: 0.4, a: 0.02, d: 0.5, s: 0.65, r: 0.45, gain: 0.3, vib: true },
      bell: { label: 'BELL', waves: ['sine', ['sine', 24], ['triangle', 19]], cutoff: 9000, reso: 0.7, fenv: 0, fdec: 0.5, a: 0.001, d: 1.4, s: 0, r: 1, gain: 0.26 },
      saw: { label: 'SAW LEAD', waves: ['sawtooth', ['square', -12]], unison: 2, spread: 12, cutoff: 2400, reso: 2, fenv: 1.2, fdec: 0.3, a: 0.01, d: 0.3, s: 0.7, r: 0.3, gain: 0.18, vib: true }
    },
    arp: {
      glass: { label: 'GLASS', waves: ['triangle', ['sine', 12]], cutoff: 5000, reso: 1, fenv: 1, fdec: 0.1, a: 0.001, d: 0.2, s: 0, r: 0.22, gain: 0.2 },
      chip: { label: 'CHIP', waves: ['square'], cutoff: 5500, reso: 0.7, fenv: 0, fdec: 0.1, a: 0.001, d: 0.1, s: 0.25, r: 0.05, gain: 0.1 },
      pluck: { label: 'PLUCK', waves: ['sawtooth'], unison: 2, spread: 9, cutoff: 1400, reso: 4, fenv: 2.5, fdec: 0.12, a: 0.001, d: 0.2, s: 0, r: 0.2, gain: 0.18 }
    }
  };
  const lab = o => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, v.label]));
  const SEGS = {
    'chords.sound': lab(SOUNDS.chords), 'chords.rhythm': { hold: 'HOLD', pulse: 'PULSE', offbeat: 'OFFBEAT' },
    'bass.sound': lab(SOUNDS.bass), 'bass.mode': { root: 'ROOT', octave: 'OCTAVE JUMP' },
    'lead.sound': lab(SOUNDS.lead), 'lead.oct': { 0: 'LOW', 1: 'MID', 2: 'HIGH' },
    'arp.sound': lab(SOUNDS.arp), 'arp.rate': { 16: '1/16', 8: '1/8' }, 'arp.dir': { up: 'UP', down: 'DOWN', updown: 'UP/DOWN' }
  };

  /* ───────── Project ───────── */
  const NEWPAT = { drums: () => ({ kick: z16(), clap: z16(), hat: z16(), ohat: z16() }), bass: () => ({ steps: z16() }), chords: () => ({ prog: [0, 0, 0, 0] }), lead: () => ({ notes: [] }), arp: () => ({}) };
  const defaultMarks = () => [
    { name: 'Intro', type: 'intro', bars: 4 }, { name: 'Build', type: 'build', bars: 4 }, { name: 'Drop', type: 'drop', bars: 8 },
    { name: 'Break', type: 'break', bars: 4 }, { name: 'Build 2', type: 'build', bars: 4 }, { name: 'Drop 2', type: 'drop', bars: 8 }, { name: 'Outro', type: 'outro', bars: 4 }
  ];
  const defaultClips = () => {
    const c = [], add = (tr, list) => list.forEach(([start, len]) => c.push({ tr, p: 0, start, len }));
    add('chords', [[0, 4], [4, 4], [8, 8], [16, 4], [20, 4], [24, 8], [32, 4]]);
    add('drums', [[4, 4], [8, 8], [20, 4], [24, 8]]);
    add('bass', [[8, 8], [24, 8]]);
    add('lead', [[8, 8], [16, 4], [24, 8]]);
    return c;
  };
  const DEF = () => ({
    title: '', bpm: 110, slow: 0, key: 9, scale: 'minor',
    pats: Object.fromEntries(TR.map(t => [t, [NEWPAT[t]()]])), edit: Object.fromEntries(TR.map(t => [t, 0])),
    clips: defaultClips(), marks: defaultMarks(), sel: 2, loopSec: 2, mode: 'loop', cursor: 0, selClip: -1, mute: {}, solo: null,
    set: { chords: { sound: 'saw', rhythm: 'hold' }, bass: { sound: 'sub', mode: 'root' }, lead: { sound: 'pluck', oct: '1' }, arp: { sound: 'glass', rate: '16', dir: 'up' } },
    mix: { kick: 0.85, clap: 0.65, hat: 0.45, bass: 0.8, chords: 0.6, lead: 0.7, arp: 0.45, master: 0.8 },
    fx: { reverb: 0.2, size: 2.5, delay: 0.12, side: 0, lofi: 0 }, f: {}
  });
  const KEY = 'dot01studio:v2';
  const S = Object.assign(DEF(), store.get(KEY, {}));
  const F = S.f;
  let saveT = 0;
  function save() { clearTimeout(saveT); saveT = setTimeout(() => store.set(KEY, S), 250); }
  const pathGet = p => p.split('.').reduce((o, k) => o[k], S.set);
  const pathSet = (p, v) => { const [a, b] = p.split('.'); S.set[a][b] = v; };
  const pat = tr => S.pats[tr][S.edit[tr]] || S.pats[tr][0];
  const pname = i => 'P' + String(i + 1).padStart(2, '0');

  const SC = () => SCALES[S.scale];
  const nn = pc => (SC().sharpKeys.includes(S.key) ? SHARP : FLAT)[((pc % 12) + 12) % 12];
  const keyBase = () => 48 + S.key - (S.key >= 7 ? 12 : 0);
  const degMidi = (d, base) => base + SC().iv[((d % 7) + 7) % 7] + 12 * Math.floor(d / 7);
  const chordName = d => nn(S.key + SC().iv[d]) + SC().q[d];
  const effBpm = () => S.bpm * (1 - S.slow);
  const stepDur = () => 60 / effBpm() / 4;
  const markStart = i => S.marks.slice(0, i).reduce((a, m) => a + m.bars, 0);
  const marksEnd = () => markStart(S.marks.length);
  const songBars = () => Math.max(marksEnd(), ...S.clips.map(c => c.start + c.len), 1);
  function markAt(bar) { let b = 0; for (let i = 0; i < S.marks.length; i++) { const m = S.marks[i]; if (bar < b + m.bars) return { m, i, barIn: bar - b }; b += m.bars; } return null; }
  const clipAt = (tr, bar) => S.clips.find(c => c.tr === tr && bar >= c.start && bar < c.start + c.len);
  const overlaps = (tr, start, len, skip) => S.clips.some((c, i) => i !== skip && c.tr === tr && start < c.start + c.len && c.start < start + len);
  const audible = tr => S.solo ? S.solo === tr : !S.mute[tr];

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
    const nb = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate), nd0 = nb.getChannelData(0);
    for (let i = 0; i < nd0.length; i++) nd0[i] = Math.random() * 2 - 1;
    E.noise = nb;
    E.pitch = ctx.createConstantSource(); E.pitch.start();
    E.vib = ctx.createGain(); E.vib.gain.value = 7; const vo = ctx.createOscillator(); vo.frequency.value = 5.2; vo.connect(E.vib); vo.start();
    E.wob = ctx.createGain(); const wo = ctx.createOscillator(); wo.frequency.value = 0.55; wo.connect(E.wob); wo.start(); E.wob.connect(E.pitch.offset);
    E.mix = ctx.createGain(); E.duck = ctx.createGain(); E.duck.connect(E.mix);
    E.tone = ctx.createBiquadFilter(); E.tone.type = 'lowpass'; E.tone.Q.value = 0.5;
    E.master = ctx.createGain(); E.mix.connect(E.tone); E.tone.connect(E.master);
    E.rev = ctx.createConvolver(); E.revIn = ctx.createGain(); E.revOut = ctx.createGain();
    E.revIn.connect(E.rev); E.rev.connect(E.revOut); E.revOut.connect(E.tone);
    E.dly = ctx.createDelay(3); E.dlyIn = ctx.createGain(); E.dFb = ctx.createGain(); E.dFb.gain.value = 0.38; E.dTone = ctx.createBiquadFilter(); E.dTone.type = 'lowpass'; E.dTone.frequency.value = 3200; E.dOut = ctx.createGain();
    E.dlyIn.connect(E.dly); E.dly.connect(E.dTone); E.dTone.connect(E.dFb); E.dFb.connect(E.dly); E.dTone.connect(E.dOut); E.dOut.connect(E.tone); E.dOut.connect(E.revIn);
    E.lim = ctx.createDynamicsCompressor(); E.lim.threshold.value = -6; E.lim.knee.value = 6; E.lim.ratio.value = 12; E.lim.attack.value = 0.004; E.lim.release.value = 0.2;
    E.an = ctx.createAnalyser(); E.an.fftSize = 1024;
    E.master.connect(E.lim); E.lim.connect(E.an); E.an.connect(ctx.destination);
    E.rec = ctx.createMediaStreamDestination(); E.lim.connect(E.rec);
    E.bus = {};
    const REV = { kick: 0.04, clap: 0.5, hat: 0.25, bass: 0.03, chords: 1, lead: 0.8, arp: 0.9 }, DLY = { kick: 0, clap: 0.1, hat: 0, bass: 0, chords: 0.15, lead: 0.7, arp: 0.6 };
    MIXCH.forEach(t => {
      const gn = ctx.createGain(), r = ctx.createGain(), d = ctx.createGain();
      gn.connect(['kick', 'clap', 'hat'].includes(t) ? E.mix : E.duck); gn.connect(r); gn.connect(d); r.connect(E.revIn); d.connect(E.dlyIn);
      r.gain.value = REV[t]; d.gain.value = DLY[t]; E.bus[t] = gn;
    });
    E.rev.buffer = makeIR(S.fx.size);
    applyAll();
  }
  let irT = 0;
  function applyAll() {
    if (!ctx) return;
    const t = ctx.currentTime, sm = (p, v) => p.setTargetAtTime(v, t, 0.03);
    MIXCH.forEach(k => sm(E.bus[k].gain, Math.pow(S.mix[k], 1.6) * 1.1));
    sm(E.master.gain, S.mix.master * 1.1); sm(E.revOut.gain, S.fx.reverb * 1.3); sm(E.dOut.gain, S.fx.delay * 0.9);
    E.dly.delayTime.setTargetAtTime(stepDur() * 3, t, 0.05);
    sm(E.pitch.offset, 1200 * Math.log2(1 - S.slow)); sm(E.wob.gain, S.fx.lofi * 14); sm(E.tone.frequency, 20000 * Math.pow(0.12, S.fx.lofi));
  }
  function setIR() { if (!ctx) return; clearTimeout(irT); irT = setTimeout(() => { E.rev.buffer = makeIR(S.fx.size); }, 200); }
  const pf = () => 1 - S.slow;

  function tone(dest, snd, midi, t, dur, vel) {
    const out = ctx.createGain(), flt = ctx.createBiquadFilter(), mixg = ctx.createGain();
    flt.type = 'lowpass'; flt.Q.value = snd.reso || 1; mixg.connect(flt); flt.connect(out); out.connect(dest);
    const ws = snd.waves.map(w => Array.isArray(w) ? w : [w, 0]), uni = snd.unison || 1, spread = snd.spread || 0, oscs = [];
    mixg.gain.value = 1 / Math.sqrt(uni * ws.length);
    ws.forEach(([w, semi], wi) => {
      for (let u = 0; u < uni; u++) {
        const o = ctx.createOscillator(), gg = ctx.createGain(); o.type = w; o.frequency.value = mtof(midi + semi);
        o.detune.value = uni > 1 ? (u / (uni - 1) - 0.5) * 2 * spread : 0; gg.gain.value = wi ? 0.5 : 1;
        E.pitch.connect(o.detune); if (snd.vib) E.vib.connect(o.detune);
        o.connect(gg);
        if (uni > 1 && ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = (u / (uni - 1) - 0.5) * 1.3; gg.connect(p); p.connect(mixg); } else gg.connect(mixg);
        o.start(t); oscs.push(o);
      }
    });
    const peak = snd.gain * vel, end = Math.max(t + dur, t + snd.a + 0.01), gp = out.gain;
    gp.setValueAtTime(0, t); gp.linearRampToValueAtTime(peak, t + snd.a); gp.setTargetAtTime(peak * snd.s, t + snd.a, Math.max(0.005, snd.d / 3));
    gp.setTargetAtTime(0, end, Math.max(0.005, snd.r / 4));
    const base = clamp(snd.cutoff * Math.pow(2, (midi - 60) / 12 * 0.3), 40, 18000), top = clamp(base * Math.pow(2, snd.fenv || 0), 40, 18000), f = flt.frequency, fa = Math.max(0.004, snd.a * 0.6);
    f.setValueAtTime(base, t); f.exponentialRampToValueAtTime(top, t + fa); f.setTargetAtTime(base, t + fa, Math.max(0.01, snd.fdec / 3));
    const stopT = end + snd.r * 1.6 + 0.1;
    oscs.forEach(o => o.stop(stopT));
    oscs[0].onended = () => { oscs.forEach(o => { try { E.pitch.disconnect(o.detune); if (snd.vib) E.vib.disconnect(o.detune); } catch (e) { /* noop */ } }); out.disconnect(); };
  }
  function noiseSrc(t, dur) { const s = ctx.createBufferSource(); s.buffer = E.noise; s.loop = true; s.start(t, Math.random()); s.stop(t + dur); return s; }
  function kick(t, v = 1) {
    const o = ctx.createOscillator(), gn = ctx.createGain(), p = pf();
    o.type = 'sine'; o.frequency.setValueAtTime(170 * p, t); o.frequency.exponentialRampToValueAtTime(46 * p, t + 0.11);
    gn.gain.setValueAtTime(0.0001, t); gn.gain.exponentialRampToValueAtTime(v, t + 0.004); gn.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
    o.connect(gn); gn.connect(E.bus.kick); o.start(t); o.stop(t + 0.6);
    const n = noiseSrc(t, 0.02), hp = ctx.createBiquadFilter(), ng = ctx.createGain(); hp.type = 'highpass'; hp.frequency.value = 3000;
    ng.gain.setValueAtTime(0.25 * v, t); ng.gain.exponentialRampToValueAtTime(0.001, t + 0.015); n.connect(hp); hp.connect(ng); ng.connect(E.bus.kick);
    if (S.fx.side > 0) { const d = E.duck.gain; d.setValueAtTime(1 - S.fx.side * 0.85, t); d.setTargetAtTime(1, t + 0.03, 0.06 + S.fx.side * 0.08); }
  }
  function clap(t, v = 1) {
    const n = noiseSrc(t, 0.4), bp = ctx.createBiquadFilter(), gn = ctx.createGain(); bp.type = 'bandpass'; bp.frequency.value = 1500 * pf(); bp.Q.value = 0.9;
    gn.gain.setValueAtTime(0, t);
    [0, 0.011, 0.022].forEach(o => { gn.gain.setValueAtTime(0.9 * v, t + o); gn.gain.exponentialRampToValueAtTime(0.12 * v, t + o + 0.009); });
    gn.gain.setValueAtTime(0.7 * v, t + 0.032); gn.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    n.connect(bp); bp.connect(gn); gn.connect(E.bus.clap);
  }
  function hat(t, open, v = 1) {
    const d = open ? 0.32 : 0.045, n = noiseSrc(t, d + 0.05), hp = ctx.createBiquadFilter(), gn = ctx.createGain(); hp.type = 'highpass'; hp.frequency.value = 7200 * pf();
    gn.gain.setValueAtTime(0.5 * v, t); gn.gain.exponentialRampToValueAtTime(0.001, t + d); n.connect(hp); hp.connect(gn); gn.connect(E.bus.hat);
  }
  function crash(t) {
    const n = noiseSrc(t, 2.2), hp = ctx.createBiquadFilter(), gn = ctx.createGain(); hp.type = 'highpass'; hp.frequency.value = 4500;
    gn.gain.setValueAtTime(0.3, t); gn.gain.exponentialRampToValueAtTime(0.001, t + 2); n.connect(hp); hp.connect(gn); gn.connect(E.bus.hat); gn.connect(E.revIn);
  }
  function riser(t, len) {
    const n = noiseSrc(t, len), bp = ctx.createBiquadFilter(), gn = ctx.createGain(); bp.type = 'bandpass'; bp.Q.value = 1.4;
    bp.frequency.setValueAtTime(300, t); bp.frequency.exponentialRampToValueAtTime(9000, t + len);
    gn.gain.setValueAtTime(0.0001, t); gn.gain.exponentialRampToValueAtTime(0.28, t + len * 0.95); gn.gain.linearRampToValueAtTime(0, t + len);
    n.connect(bp); bp.connect(gn); gn.connect(E.mix); gn.connect(E.revIn);
  }
  const chordNotes = deg => { const b = keyBase(); return [degMidi(deg, b - 12), degMidi(deg, b), degMidi(deg + 2, b), degMidi(deg + 4, b)]; };
  const leadMidi = d => degMidi(d, keyBase() + 12 * (+S.set.lead.oct));
  function chordDegAt(bar) { const c = clipAt('chords', bar); if (!c) return 0; const p = S.pats.chords[c.p] || S.pats.chords[0]; return p.prog[(bar - c.start) % 4]; }

  /* ───────── Sequencer ───────── */
  let playing = false, gs = 0, nextT = 0, songEnd = null, arpI = 0, startBar = 0;
  const queue = [];
  function barFor(step) {
    if (S.mode === 'loop') { const i = clamp(S.loopSec, 0, S.marks.length - 1), m = S.marks[i]; return markStart(i) + (Math.floor(step / 16) % m.bars); }
    const b = startBar + Math.floor(step / 16); return b < songBars() ? b : -1;
  }
  function scheduleStep(bar, s, t) {
    const sd = stepDur(), mk = markAt(bar), deg = chordDegAt(bar);
    if (mk) {
      if (s === 0 && mk.barIn === 0) { if (mk.m.type === 'build') riser(t, mk.m.bars * 16 * sd); if (mk.m.type === 'drop') crash(t); }
      if (mk.m.type === 'build' && audible('drums')) { const rem = mk.m.bars - mk.barIn; if (rem === 2 && s % 4 === 0) clap(t, 0.45); if (rem === 1 && (s < 8 ? s % 2 === 0 : true)) clap(t, 0.35 + 0.6 * s / 15); }
    }
    let c = clipAt('drums', bar);
    if (c && audible('drums')) { const p = S.pats.drums[c.p]; if (p.kick[s]) kick(t); if (p.clap[s]) clap(t); if (p.hat[s]) hat(t, false); if (p.ohat[s]) hat(t, true); }
    c = clipAt('bass', bar);
    if (c && audible('bass')) {
      const st = S.pats.bass[c.p].steps;
      if (st[s]) { let len = 1; while (len < 4 && s + len < 16 && !st[s + len]) len++; tone(E.bus.bass, SOUNDS.bass[S.set.bass.sound], degMidi(deg, keyBase() - 12) + (S.set.bass.mode === 'octave' && s % 4 === 2 ? 12 : 0), t, len * sd * 0.92, 1); }
    }
    c = clipAt('chords', bar);
    if (c && audible('chords')) {
      const r = S.set.chords.rhythm, hit = r === 'hold' ? s === 0 : r === 'pulse' ? s % 4 === 0 : s % 4 === 2, len = r === 'hold' ? 16 : r === 'pulse' ? 3 : 1.6;
      if (hit) chordNotes(deg).forEach((n, i) => tone(E.bus.chords, SOUNDS.chords[S.set.chords.sound], n, t, len * sd * 0.98, i ? 0.8 : 0.55));
    }
    c = clipAt('lead', bar);
    if (c && audible('lead')) { const local = ((bar - c.start) % 2) * 16 + s; S.pats.lead[c.p].notes.forEach(n => { if (n.s === local) tone(E.bus.lead, SOUNDS.lead[S.set.lead.sound], leadMidi(n.d), t, n.l * sd * 0.95, 0.9); }); }
    c = clipAt('arp', bar);
    if (c && audible('arp') && (S.set.arp.rate === '16' || s % 2 === 0)) {
      const b = keyBase() + 12, up = [0, 2, 4, 7, 9, 11].map(k => degMidi(deg + k, b));
      const seq = S.set.arp.dir === 'down' ? up.slice().reverse() : S.set.arp.dir === 'updown' ? up.concat(up.slice(1, -1).reverse()) : up;
      tone(E.bus.arp, SOUNDS.arp[S.set.arp.sound], seq[arpI++ % seq.length], t, sd * (S.set.arp.rate === '8' ? 1.6 : 0.8), 0.8);
    }
  }
  function tick() {
    if (!playing || !ctx) return;
    while (nextT < ctx.currentTime + 0.12) {
      const bar = barFor(gs), s = gs % 16;
      if (bar < 0) { songEnd = nextT; playing = false; onSongEnd(); break; }
      scheduleStep(bar, s, nextT); queue.push({ t: nextT, bar, s });
      gs++; nextT += stepDur();
    }
  }
  setInterval(tick, 25);
  async function play() {
    await power(); if (playing) return;
    gs = 0; arpI = 0; startBar = S.mode === 'song' ? clamp(S.cursor, 0, songBars() - 1) : 0;
    playing = true; nextT = ctx.currentTime + 0.08; queue.length = 0; songEnd = null;
    $('#play').classList.add('on'); F.played = 1; commit(false);
  }
  function stop() {
    playing = false; queue.length = 0; songEnd = null; $('#play').classList.remove('on'); clearPH();
    if (ctx) { const t = ctx.currentTime; E.duck.gain.cancelScheduledValues(t); E.duck.gain.setValueAtTime(1, t); }
    if (recorder) finishRec(1.5);
  }
  function onSongEnd() { setTimeout(() => { $('#play').classList.remove('on'); clearPH(); if (recorder) finishRec(3); }, Math.max(0, (songEnd - ctx.currentTime) * 1000)); }

  /* ───────── Recording ───────── */
  let recorder = null, recChunks = [], recStart = 0, recTimer = 0;
  async function recSong() {
    await power();
    if (recorder) { stop(); return; }
    if (!window.MediaRecorder) return toast('Recording is not supported in this browser');
    if (playing) stop();
    S.mode = 'song'; S.cursor = 0; renderTransport(); renderTL();
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
    recTimer = setInterval(() => { $('#rec-info').textContent = fmtTime((performance.now() - recStart) / 1000) + ' / ' + fmtTime(total); }, 250);
    play();
  }
  function finishRec(tail) { const r = recorder; if (!r || r.state !== 'recording') return; setTimeout(() => { if (r.state === 'recording') r.stop(); }, tail * 1000); }
  const fmtTime = s => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');

  /* ───────── Knobs & segs ───────── */
  const KN = 21, A0 = -135, A1 = 135, knobs = [];
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
    const setV = v => { if (v === o.get()) return; o.set(v); render(); if (o.after) o.after(); commit(false); };
    let sy = 0, sn = 0, drag = false;
    el.addEventListener('pointerdown', e => { drag = true; sy = e.clientY; sn = norm(o.get()); cap(el, e.pointerId); el.classList.add('active'); e.preventDefault(); el.focus({ preventScroll: true }); });
    el.addEventListener('pointermove', e => { if (drag) setV(fromN(sn + (sy - e.clientY) / 170 * (e.shiftKey ? 0.25 : 1))); });
    const end = () => { drag = false; el.classList.remove('active'); };
    el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
    el.addEventListener('dblclick', () => setV(o.def));
    el.addEventListener('wheel', e => { e.preventDefault(); setV(fromN(norm(o.get()) - Math.sign(e.deltaY) * (o.step ? o.step / (o.max - o.min) : 0.02))); }, { passive: false });
    el.addEventListener('keydown', e => { const u = o.step ? o.step / (o.max - o.min) : 0.01, m = { ArrowUp: u, ArrowRight: u, ArrowDown: -u, ArrowLeft: -u }; if (e.key in m) { e.preventDefault(); e.stopPropagation(); setV(fromN(norm(o.get()) + m[e.key] * (e.shiftKey ? 10 : 1))); } });
    knobs.push(render); render();
  }
  const pct = v => Math.round(v * 100) + '%';
  function buildKnobs() {
    const tp = $('#tp-knobs');
    knob(tp, { id: 'bpm', label: 'BPM', min: 90, max: 140, step: 1, def: 128, get: () => S.bpm, set: v => { S.bpm = v; }, fmt: v => v, after: applyAll });
    knob(tp, { id: 'slow', label: 'SLOWED', min: 0, max: 0.35, step: 0.01, def: 0, get: () => S.slow, set: v => { S.slow = v; }, fmt: v => v ? '−' + Math.round(v * 100) + '%' : 'OFF', after: applyAll });
    const fx = $('#fx-knobs');
    knob(fx, { id: 'reverb', label: 'REVERB', min: 0, max: 1, def: 0.2, get: () => S.fx.reverb, set: v => { S.fx.reverb = v; }, fmt: pct, after: applyAll });
    knob(fx, { id: 'size', label: 'R.SIZE', min: 0.8, max: 8, step: 0.1, def: 2.5, get: () => S.fx.size, set: v => { S.fx.size = v; }, fmt: v => v.toFixed(1) + 's', after: setIR });
    knob(fx, { id: 'delay', label: 'ECHO', min: 0, max: 1, def: 0.12, get: () => S.fx.delay, set: v => { S.fx.delay = v; }, fmt: pct, after: applyAll });
    knob(fx, { id: 'side', label: 'PUMP', min: 0, max: 1, def: 0, get: () => S.fx.side, set: v => { S.fx.side = v; }, fmt: pct });
    knob(fx, { id: 'lofi', label: 'LO-FI', min: 0, max: 1, def: 0, get: () => S.fx.lofi, set: v => { S.fx.lofi = v; }, fmt: pct, after: applyAll });
    const mx = $('#mix-knobs');
    MIXCH.concat('master').forEach(t => knob(mx, { id: 'mix-' + t, label: t === 'master' ? 'MASTER' : MIXNAME[t], min: 0, max: 1, def: DEF().mix[t], get: () => S.mix[t], set: v => { S.mix[t] = v; F.mixed = 1; }, fmt: pct, after: applyAll }));
  }
  function buildSegs() {
    $$('.seg[data-p]').forEach(el => {
      const p = el.dataset.p;
      el.innerHTML = Object.entries(SEGS[p]).map(([v, l]) => `<button data-v="${v}">${l}</button>`).join('');
      el.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; pathSet(p, b.dataset.v); F['seg:' + p] = 1; renderSegs(); renderRoll(); commit(false); preview(p); });
    });
  }
  function renderSegs() { $$('.seg[data-p]').forEach(el => { const v = String(pathGet(el.dataset.p)); $$('button', el).forEach(b => b.classList.toggle('on', b.dataset.v === v)); }); }
  async function preview(p) {
    if (playing) return; await power(); const t = ctx.currentTime + 0.02, sd = stepDur(), d0 = pat('chords').prog[0];
    if (p.startsWith('chords')) chordNotes(d0).forEach((n, i) => tone(E.bus.chords, SOUNDS.chords[S.set.chords.sound], n, t, sd * 8, i ? 0.8 : 0.55));
    else if (p.startsWith('bass')) tone(E.bus.bass, SOUNDS.bass[S.set.bass.sound], degMidi(d0, keyBase() - 12), t, sd * 4, 1);
    else if (p.startsWith('lead')) [0, 2, 4].forEach((d, i) => tone(E.bus.lead, SOUNDS.lead[S.set.lead.sound], leadMidi(d), t + i * sd * 2, sd * 2, 0.9));
    else if (p.startsWith('arp')) [0, 2, 4, 7].forEach((d, i) => tone(E.bus.arp, SOUNDS.arp[S.set.arp.sound], degMidi(d0 + d, keyBase() + 12), t + i * sd, sd * 0.8, 0.8));
  }

  /* ───────── Pattern chips (select / new / copy / drag onto timeline) ───────── */
  function renderPbars() {
    $$('.pbar').forEach(el => {
      const tr = el.dataset.tr; el.style.setProperty('--tc', `var(--c-${tr})`);
      el.innerHTML = S.pats[tr].map((_, i) => `<button class="pchip ${i === S.edit[tr] ? 'on' : ''}" data-tr="${tr}" data-p="${i}" title="Click to edit · drag onto the ${TRNAME[tr]} row of the timeline">${pname(i)}</button>`).join('') +
        `<button class="pact" data-new="${tr}">+ NEW</button><button class="pact" data-copy="${tr}">COPY</button>`;
    });
  }
  document.addEventListener('click', e => {
    const n = e.target.closest('[data-new]'), c = e.target.closest('[data-copy]');
    if (!n && !c) return;
    const tr = n ? n.dataset.new : c.dataset.copy;
    if (S.pats[tr].length >= 16) return toast('Up to 16 patterns per track');
    S.pats[tr].push(n ? NEWPAT[tr]() : clone(pat(tr))); S.edit[tr] = S.pats[tr].length - 1;
    renderEditors(); commit(); toast((n ? 'New ' : 'Copied to ') + pname(S.edit[tr]) + ' · drag it onto the timeline');
  });
  let chipDrag = null;
  document.addEventListener('pointerdown', e => {
    const c = e.target.closest('.pchip'); if (!c) return;
    chipDrag = { tr: c.dataset.tr, p: +c.dataset.p, x0: e.clientX, y0: e.clientY, moved: false, ghost: null }; e.preventDefault();
  });
  document.addEventListener('pointermove', e => {
    if (!chipDrag) return;
    if (!chipDrag.moved && Math.hypot(e.clientX - chipDrag.x0, e.clientY - chipDrag.y0) > 5) {
      chipDrag.moved = true; const gh = document.createElement('div'); gh.className = 'drag-chip'; gh.textContent = TRNAME[chipDrag.tr] + ' · ' + pname(chipDrag.p);
      gh.style.setProperty('--tc', `var(--c-${chipDrag.tr})`); document.body.appendChild(gh); chipDrag.ghost = gh;
    }
    if (chipDrag.ghost) { chipDrag.ghost.style.left = e.clientX + 'px'; chipDrag.ghost.style.top = e.clientY + 'px'; }
  });
  document.addEventListener('pointerup', e => {
    if (!chipDrag) return; const d = chipDrag; chipDrag = null;
    if (d.ghost) d.ghost.remove();
    if (!d.moved) { S.edit[d.tr] = d.p; renderEditors(); commit(false); return; }
    const el = document.elementFromPoint(e.clientX, e.clientY), lane = el && el.closest('.lane');
    if (!lane) return;
    if (lane.dataset.tr !== d.tr) return toast(pname(d.p) + ' belongs on the ' + TRNAME[d.tr] + ' row');
    addClip(d.tr, d.p, Math.max(0, Math.floor((e.clientX - lane.getBoundingClientRect().left) / BW)));
  });
  function addClip(tr, p, bar) {
    if (clipAt(tr, bar)) { toast('That spot is taken. Drag the existing clip away first'); return false; }
    const next = S.clips.filter(c => c.tr === tr && c.start > bar).reduce((m, c) => Math.min(m, c.start), Infinity);
    S.clips.push({ tr, p, start: bar, len: Math.min(PATBARS[tr], next - bar) }); S.selClip = S.clips.length - 1; S.edit[tr] = p; F.arr = 1;
    renderTL(); renderEditors(); commit(false); return true;
  }

  /* ───────── Timeline ───────── */
  let BW = 32;
  const TYPES = { intro: 'INTRO', build: 'BUILD', drop: 'DROP', break: 'BREAK', outro: 'OUTRO' };
  function clipSVG(c, w) {
    const P = S.pats[c.tr][c.p]; if (!P) return '';
    const pb = PATBARS[c.tr], h = 24; let s = '';
    for (let r = 0; r * pb < c.len; r++) {
      const x0 = r * pb * BW;
      if (r > 0) s += `<line x1="${x0}" y1="0" x2="${x0}" y2="${h}" stroke="currentColor" stroke-opacity=".25"/>`;
      if (c.tr === 'drums') for (let i = 0; i < 16; i++) { const x = x0 + (i + 0.5) * BW / 16; if (P.kick[i]) s += `<rect x="${x - 1}" y="${h - 7}" width="2" height="7"/>`; if (P.clap[i]) s += `<rect x="${x - 1}" y="${h - 14}" width="2" height="5"/>`; if (P.hat[i] || P.ohat[i]) s += `<rect x="${x - 0.7}" y="2" width="1.4" height="3"/>`; }
      if (c.tr === 'bass') for (let i = 0; i < 16; i++) if (P.steps[i]) s += `<rect x="${x0 + i * BW / 16}" y="${h - 8}" width="${Math.max(1.5, BW / 16 - 1)}" height="4"/>`;
      if (c.tr === 'chords' && BW >= 26) for (let b = 0; b < 4 && r * 4 + b < c.len; b++) s += `<text x="${x0 + b * BW + 3}" y="${h - 6}" font-size="9" font-family="Space Mono, monospace" font-weight="700">${chordName(P.prog[b])}</text>`;
      if (c.tr === 'lead') P.notes.forEach(n => { const x = x0 + n.s / 16 * BW; if (x < w && x < x0 + pb * BW) s += `<rect x="${x}" y="${h - 3 - n.d * 1.9}" width="${Math.max(1.5, n.l / 16 * BW - 0.5)}" height="2.2" rx="1"/>`; });
      if (c.tr === 'arp') { let pts = ''; for (let i = 0; i <= 8; i++) pts += `${x0 + i * BW / 8},${h - 4 - (i % 4) * 4} `; s += `<polyline points="${pts}" fill="none" stroke="currentColor" stroke-width="1.2"/>`; }
    }
    return `<svg width="${w}" height="${h}" style="color:var(--ink)" fill="currentColor" fill-opacity=".7">${s}</svg>`;
  }
  function renderTL() {
    const scrollEl = $('.tl-scroll'), prevScroll = scrollEl ? scrollEl.scrollLeft : 0;
    const total = songBars() + 8, avail = ($('#tl').clientWidth || 800) - 94;
    BW = Math.max(26, Math.min(64, Math.floor(avail / Math.max(total, 20))));
    const W = total * BW, grid = `background-image:linear-gradient(90deg,var(--line) 1px,transparent 1px),linear-gradient(90deg,var(--line2) 1px,transparent 1px);background-size:${BW * 4}px 100%,${BW}px 100%`;
    let marks = '', b = 0;
    S.marks.forEach((m, i) => { marks += `<div class="mark t-${m.type} ${i === S.sel ? 'sel' : ''}" data-m="${i}" style="left:${b * BW + 1}px;width:${m.bars * BW - 2}px" title="${m.name}">${m.name.toUpperCase()}</div>`; b += m.bars; });
    let ruler = ''; for (let i = 0; i < total; i += (BW < 34 ? 2 : 1)) ruler += `<span style="left:${i * BW}px">${i + 1}</span>`;
    const lanes = TR.map(tr => `<div class="lane ${audible(tr) ? '' : 'muted'}" data-tr="${tr}" style="${grid}">${S.clips.map((c, i) => c.tr !== tr ? '' : `<div class="clip ${i === S.selClip ? 'sel' : ''}" data-id="${i}" style="left:${c.start * BW + 1}px;width:${c.len * BW - 2}px;--tc:var(--c-${tr})"><span class="cl">${pname(c.p)}</span>${clipSVG(c, c.len * BW - 2)}<span class="rs"></span></div>`).join('')}</div>`).join('');
    $('#tl').innerHTML = `<div class="tl-names"><div class="tl-h">SECTIONS</div><div class="tl-h">BAR</div>${TR.map(tr => `<div class="tl-name" style="--tc:var(--c-${tr})"><b><i></i>${TRNAME[tr]}</b><span class="ms"><button class="${S.mute[tr] ? 'on' : ''}" data-mute="${tr}" title="Mute">M</button><button class="solo ${S.solo === tr ? 'on' : ''}" data-solo="${tr}" title="Solo">S</button></span></div>`).join('')}</div>
      <div class="tl-scroll"><div class="tl-inner" style="width:${W}px"><div class="tl-marks">${marks}</div><div class="tl-ruler" title="Click to set where WHOLE SONG starts playing">${ruler}</div>${lanes}<div class="cur-line" style="left:${S.cursor * BW}px;${S.mode === 'song' ? '' : 'display:none'}"></div><div class="ph-line" style="display:none"></div></div></div>`;
    $('.tl-scroll').scrollLeft = prevScroll;
    renderClipBar(); renderSecEdit();
    $('#loop-section').innerHTML = S.marks.map((m, i) => `<option value="${i}">${i + 1}. ${m.name}</option>`).join('');
    $('#loop-section').value = S.loopSec;
  }
  function renderClipBar() {
    const c = S.clips[S.selClip];
    $('#clip-bar').innerHTML = c ? `<span style="width:10px;height:10px;border-radius:3px;background:var(--c-${c.tr})"></span><b>${TRNAME[c.tr]} · ${pname(c.p)}</b><span>bars ${c.start + 1}–${c.start + c.len}</span>
      <button class="chipb" data-ca="prevp">◀ PATTERN</button><button class="chipb" data-ca="nextp">PATTERN ▶</button><button class="chipb" data-ca="dup">DUPLICATE →</button><button class="chipb" data-ca="del">DELETE</button>`
      : '<span>Click a clip to select it · drag a pattern chip (P01…) from any editor below onto its row · Delete key removes the selected clip</span>';
  }
  function renderSecEdit() {
    const m = S.marks[S.sel];
    $('#sec-edit').innerHTML = m ? `<span class="lbl mono">SECTION</span><input id="sec-name" value="${m.name.replace(/"/g, '&quot;')}" maxlength="14" aria-label="Section name">
      <div class="seg" id="sec-type">${Object.entries(TYPES).map(([k, l]) => `<button data-v="${k}" class="${m.type === k ? 'on' : ''}">${l}</button>`).join('')}</div>
      <div class="seg" id="sec-bars">${[2, 4, 8, 16].map(n => `<button data-v="${n}" class="${m.bars === n ? 'on' : ''}">${n}</button>`).join('')}</div><span class="lbl mono">BARS</span>
      <div class="btn-row"><button class="chipb" data-a="left">◀</button><button class="chipb" data-a="right">▶</button><button class="chipb" data-a="add">+ SECTION</button><button class="chipb" data-a="del">DELETE</button></div>` : '';
  }
  let tlDrag = null;
  $('#tl').addEventListener('pointerdown', e => {
    const mu = e.target.closest('[data-mute]'), so = e.target.closest('[data-solo]');
    if (mu) { const t = mu.dataset.mute; S.mute[t] = !S.mute[t]; renderTL(); commit(false); return; }
    if (so) { const t = so.dataset.solo; S.solo = S.solo === t ? null : t; renderTL(); commit(false); return; }
    const mk = e.target.closest('.mark');
    if (mk) { S.sel = S.loopSec = +mk.dataset.m; renderTL(); commit(false); return; }
    const ru = e.target.closest('.tl-ruler');
    if (ru) { S.cursor = clamp(Math.floor((e.clientX - ru.getBoundingClientRect().left) / BW), 0, songBars() - 1); if (S.mode !== 'song') S.mode = 'song'; renderTL(); commit(false); if (playing) { stop(); play(); } return; }
    const cl = e.target.closest('.clip');
    if (!cl) return;
    e.preventDefault();
    const id = +cl.dataset.id, c = S.clips[id];
    tlDrag = { id, el: cl, mode: e.target.closest('.rs') ? 'resize' : 'move', x0: e.clientX, start: c.start, len: c.len, dup: e.altKey || e.ctrlKey || e.metaKey, moved: false, ns: c.start, nl: c.len };
    cap(cl, e.pointerId);
  });
  $('#tl').addEventListener('pointermove', e => {
    const d = tlDrag; if (!d) return;
    if (Math.abs(e.clientX - d.x0) > 4) d.moved = true; else return;
    const dx = Math.round((e.clientX - d.x0) / BW), c = S.clips[d.id];
    if (d.mode === 'move') { d.ns = Math.max(0, d.start + dx); d.el.style.left = (d.ns * BW + 1) + 'px'; }
    else { d.nl = Math.max(1, d.len + dx); d.el.style.width = (d.nl * BW - 2) + 'px'; }
    d.el.classList.toggle('bad', overlaps(c.tr, d.ns, d.nl, d.dup ? -1 : d.id));
    d.el.classList.add('ghost');
  });
  $('#tl').addEventListener('pointerup', () => {
    const d = tlDrag; if (!d) return; tlDrag = null;
    const c = S.clips[d.id];
    if (!d.moved) { S.selClip = d.id; S.edit[c.tr] = c.p; renderTL(); renderEditors(); commit(false); return; }
    if (overlaps(c.tr, d.ns, d.nl, d.dup ? -1 : d.id)) { toast('Clips on the same row can’t overlap'); renderTL(); return; }
    if (d.dup) { S.clips.push({ tr: c.tr, p: c.p, start: d.ns, len: d.nl }); S.selClip = S.clips.length - 1; } else { c.start = d.ns; c.len = d.nl; S.selClip = d.id; }
    F.arr = 1; renderTL(); commit(false);
  });
  $('#tl').addEventListener('pointercancel', () => { tlDrag = null; renderTL(); });
  $('#tl').addEventListener('dblclick', e => {
    const lane = e.target.closest('.lane'); if (!lane || e.target.closest('.clip')) return;
    const tr = lane.dataset.tr; addClip(tr, S.edit[tr], Math.floor((e.clientX - lane.getBoundingClientRect().left) / BW));
  });
  $('#clip-bar').addEventListener('click', e => {
    const b = e.target.closest('[data-ca]'), c = S.clips[S.selClip]; if (!b || !c) return;
    const a = b.dataset.ca, n = S.pats[c.tr].length;
    if (a === 'prevp' || a === 'nextp') { c.p = (c.p + (a === 'nextp' ? 1 : n - 1)) % n; S.edit[c.tr] = c.p; renderEditors(); }
    if (a === 'dup') { const start = c.start + c.len; if (overlaps(c.tr, start, c.len, -1)) return toast('No room right after this clip'); S.clips.push({ tr: c.tr, p: c.p, start, len: c.len }); S.selClip = S.clips.length - 1; }
    if (a === 'del') { S.clips.splice(S.selClip, 1); S.selClip = -1; }
    F.arr = 1; renderTL(); commit(false);
  });
  document.addEventListener('keydown', e => {
    const a = document.activeElement; if (a && (a.tagName === 'INPUT' || a.tagName === 'SELECT' || a.tagName === 'TEXTAREA')) return;
    if ((e.key === 'Delete' || e.key === 'Backspace') && S.clips[S.selClip]) { e.preventDefault(); S.clips.splice(S.selClip, 1); S.selClip = -1; F.arr = 1; renderTL(); commit(false); }
    if (e.key === ' ' && !(a && a.classList.contains('knob'))) { e.preventDefault(); if (playing) stop(); else play(); }
  });
  $('#sec-edit').addEventListener('click', e => {
    const m = S.marks[S.sel]; if (!m) return;
    const ty = e.target.closest('#sec-type button'), bs = e.target.closest('#sec-bars button'), a = e.target.closest('[data-a]');
    if (ty) m.type = ty.dataset.v; else if (bs) m.bars = +bs.dataset.v;
    else if (a) {
      const i = S.sel, A = a.dataset.a;
      if (A === 'left' && i > 0) { [S.marks[i - 1], S.marks[i]] = [S.marks[i], S.marks[i - 1]]; S.sel--; }
      if (A === 'right' && i < S.marks.length - 1) { [S.marks[i + 1], S.marks[i]] = [S.marks[i], S.marks[i + 1]]; S.sel++; }
      if (A === 'add') { S.marks.splice(i + 1, 0, { name: 'Section', type: 'break', bars: 4 }); S.sel++; }
      if (A === 'del' && S.marks.length > 1) { S.marks.splice(i, 1); S.sel = Math.min(i, S.marks.length - 1); }
      S.loopSec = S.sel;
    } else return;
    F.arr = 1; renderTL(); commit(false);
  });
  $('#sec-edit').addEventListener('input', e => { if (e.target.id !== 'sec-name') return; S.marks[S.sel].name = e.target.value || 'Section'; const el = $(`.mark[data-m="${S.sel}"]`); if (el) el.textContent = S.marks[S.sel].name.toUpperCase(); commit(false); });
  $('#song-reset').onclick = () => { if (!confirm('Reset the timeline to the default layout? Your patterns are kept.')) return; S.clips = defaultClips(); S.marks = defaultMarks(); S.sel = S.loopSec = 2; S.selClip = -1; S.cursor = 0; renderTL(); commit(); };
  let rzT = 0;
  window.addEventListener('resize', () => { clearTimeout(rzT); rzT = setTimeout(() => { renderTL(); renderRoll(); }, 150); });

  /* ───────── Editors ───────── */
  const DROWS = [['kick', 'KICK'], ['clap', 'CLAP'], ['hat', 'HAT'], ['ohat', 'OPEN HAT']];
  function renderDrums() { const P = pat('drums'); $('#drum-grid').innerHTML = DROWS.map(([k, l]) => `<div class="g-row"><span class="rl">${l}</span>${P[k].map((v, i) => `<button class="cell ${v ? 'on' : ''}" data-d="${k}" data-i="${i}" aria-label="${l} ${i + 1}"></button>`).join('')}</div>`).join(''); }
  function renderBass() { $('#bass-grid').innerHTML = `<div class="g-row">${pat('bass').steps.map((v, i) => `<button class="cell ${v ? 'on' : ''}" data-i="${i}" aria-label="Bass ${i + 1}"></button>`).join('')}</div>`; }
  let paint = null;
  function paintCell(cell) {
    const i = +cell.dataset.i, P = cell.dataset.d ? pat('drums')[cell.dataset.d] : pat('bass').steps;
    if (P[i] === paint.v) return; P[i] = paint.v; cell.classList.toggle('on', !!paint.v);
    if (paint.v && !playing && ctx) { const t = ctx.currentTime + 0.01, k = cell.dataset.d; if (k) { if (k === 'kick') kick(t); else if (k === 'clap') clap(t); else hat(t, k === 'ohat'); } else tone(E.bus.bass, SOUNDS.bass[S.set.bass.sound], degMidi(pat('chords').prog[0], keyBase() - 12), t, stepDur() * 2, 1); }
  }
  ['#drum-grid', '#bass-grid'].forEach(sel => {
    const host = $(sel);
    host.addEventListener('pointerdown', async e => { const c = e.target.closest('.cell'); if (!c) return; e.preventDefault(); await power(); const P = c.dataset.d ? pat('drums')[c.dataset.d] : pat('bass').steps; paint = { v: P[+c.dataset.i] ? 0 : 1 }; paintCell(c); cap(host, e.pointerId); });
    host.addEventListener('pointermove', e => { if (!paint) return; const el = document.elementFromPoint(e.clientX, e.clientY), c = el && el.closest(sel + ' .cell'); if (c) paintCell(c); });
    const end = () => { if (!paint) return; paint = null; renderTL(); commit(false); };
    host.addEventListener('pointerup', end); host.addEventListener('pointercancel', end);
  });
  const DRUM_PRESETS = { 'FOUR ON FLOOR': { kick: [0, 4, 8, 12], clap: [4, 12], hat: [2, 6, 10, 14], ohat: [] }, 'HALF-TIME': { kick: [0, 10], clap: [8], hat: [0, 2, 4, 6, 8, 10, 12, 14], ohat: [14] }, 'ROLLING': { kick: [0, 4, 8, 12], clap: [4, 12], hat: [2, 3, 6, 7, 10, 11, 14, 15], ohat: [2, 10] }, 'CLEAR': { kick: [], clap: [], hat: [], ohat: [] } };
  $('#drum-presets').innerHTML = Object.keys(DRUM_PRESETS).map(k => `<button class="chipb" data-k="${k}">${k}</button>`).join('');
  $('#drum-presets').addEventListener('click', e => { const b = e.target.closest('[data-k]'); if (!b) return; const pr = DRUM_PRESETS[b.dataset.k], P = pat('drums'); DROWS.forEach(([k]) => { P[k] = z16(); pr[k].forEach(i => { P[k][i] = 1; }); }); F.drumPreset = 1; renderDrums(); renderTL(); commit(); });
  const BASS_PRESETS = { OFFBEAT: [2, 6, 10, 14], ROLLING: [2, 3, 6, 7, 10, 11, 14, 15], EIGHTHS: [0, 2, 4, 6, 8, 10, 12, 14], LONG: [0, 8], CLEAR: [] };
  $('#bass-presets').innerHTML = Object.keys(BASS_PRESETS).map(k => `<button class="chipb" data-k="${k}">${k}</button>`).join('');
  $('#bass-presets').addEventListener('click', e => { const b = e.target.closest('[data-k]'); if (!b) return; const P = pat('bass'); P.steps = z16(); BASS_PRESETS[b.dataset.k].forEach(i => { P.steps[i] = 1; }); renderBass(); renderTL(); commit(); });

  function renderProg() { $('#prog').innerHTML = pat('chords').prog.map((d, i) => `<button class="chord" data-i="${i}" title="Click to change the chord"><small>BAR ${i + 1}</small><b>${chordName(d)}</b><small>${SC().r[d]}</small></button>`).join(''); }
  $('#prog').addEventListener('click', async e => {
    const b = e.target.closest('.chord'); if (!b) return; const i = +b.dataset.i, P = pat('chords');
    P.prog[i] = (P.prog[i] + 1) % 7; F.progSet = 1; renderProg(); renderTL(); commit(false);
    if (!playing) { await power(); chordNotes(P.prog[i]).forEach((n, k) => tone(E.bus.chords, SOUNDS.chords[S.set.chords.sound], n, ctx.currentTime + 0.02, stepDur() * 8, k ? 0.8 : 0.55)); }
  });
  const PROGS = {
    minor: { 'Epic i-VI-III-VII': [0, 5, 2, 6], 'Heroic VI-VII-i-i': [5, 6, 0, 0], 'Night i-VII-VI-VII': [0, 6, 5, 6], 'Sad i-v-VI-iv': [0, 4, 5, 3] },
    major: { 'Anthem vi-IV-I-V': [5, 3, 0, 4], 'Sunrise I-V-vi-IV': [0, 4, 5, 3], 'Lift IV-V-vi-vi': [3, 4, 5, 5], 'Glow I-vi-IV-V': [0, 5, 3, 4] }
  };
  function renderProgPresets() { $('#prog-presets').innerHTML = Object.keys(PROGS[S.scale]).map(k => `<button class="chipb" data-k="${k}">${k}</button>`).join(''); }
  $('#prog-presets').addEventListener('click', e => { const b = e.target.closest('[data-k]'); if (!b) return; pat('chords').prog = PROGS[S.scale][b.dataset.k].slice(); F.progSet = 1; renderProg(); renderTL(); commit(); preview('chords'); });

  /* lead piano roll with draggable notes */
  const ROWS = 11, GX = 36;
  const rollGeom = () => { const el = $('#roll'); return { el, cw: (el.clientWidth - GX) / 32, rh: el.clientHeight / ROWS }; };
  function renderRoll() {
    const G = rollGeom(), P = pat('lead'), base = keyBase() + 12 * (+S.set.lead.oct);
    let h = '';
    for (let r = 0; r < ROWS; r++) { const d = ROWS - 1 - r, m = degMidi(d, base), root = d % 7 === 0; h += `<div class="rrow ${root ? 'root' : ''}" style="top:${r * G.rh}px;height:${G.rh}px"></div><span class="rlab ${root ? 'root' : ''}" style="top:${r * G.rh + G.rh / 2 - 6}px">${nn(m)}${Math.floor(m / 12) - 1}</span>`; }
    for (let c = 0; c <= 32; c++) h += `<div class="vline ${c % 16 === 0 ? 'bar' : c % 4 === 0 ? 'beat' : ''}" style="left:${GX + c * G.cw}px"></div>`;
    P.notes.forEach((n, i) => { h += `<div class="note" data-n="${i}" style="left:${GX + n.s * G.cw + 1}px;top:${(ROWS - 1 - n.d) * G.rh + 2}px;width:${n.l * G.cw - 2}px;height:${G.rh - 4}px"><span class="nr"></span></div>`; });
    G.el.innerHTML = h + '<div class="rph"></div>';
  }
  let nd = null;
  const rollPos = (e, G) => { const r = G.el.getBoundingClientRect(); return { s: Math.floor((e.clientX - r.left - GX) / G.cw), d: ROWS - 1 - Math.floor((e.clientY - r.top) / G.rh) }; };
  $('#roll').addEventListener('pointerdown', async e => {
    e.preventDefault();
    const G = rollGeom(), pos = rollPos(e, G), P = pat('lead'), ne = e.target.closest('.note');
    if (pos.s < 0 && !ne) return;
    cap(G.el, e.pointerId);
    if (ne) { const i = +ne.dataset.n, n = P.notes[i]; nd = { i, mode: e.target.closest('.nr') ? 'resize' : 'move', offs: pos.s - n.s, moved: false }; }
    else { P.notes.push({ s: clamp(pos.s, 0, 31), d: clamp(pos.d, 0, ROWS - 1), l: 1 }); nd = { i: P.notes.length - 1, mode: 'resize', offs: 0, moved: true }; renderRoll(); }
    await power(); if (nd && !ne) playNote(P.notes[nd.i]);
  });
  $('#roll').addEventListener('pointermove', e => {
    if (!nd) return; const G = rollGeom(), pos = rollPos(e, G), n = pat('lead').notes[nd.i]; if (!n) return;
    if (nd.mode === 'resize') { const l = clamp(pos.s - n.s + 1, 1, 32 - n.s); if (l !== n.l) { n.l = l; nd.moved = true; } }
    else { const s = clamp(pos.s - nd.offs, 0, 32 - n.l), d = clamp(pos.d, 0, ROWS - 1); if (s !== n.s || d !== n.d) { const pd = n.d; n.s = s; n.d = d; nd.moved = true; if (d !== pd) playNote(n); } }
    const el = $(`.note[data-n="${nd.i}"]`); if (el) { el.style.left = (GX + n.s * G.cw + 1) + 'px'; el.style.top = ((ROWS - 1 - n.d) * G.rh + 2) + 'px'; el.style.width = (n.l * G.cw - 2) + 'px'; el.classList.add('drag'); }
  });
  const rollUp = () => {
    if (!nd) return; const d = nd; nd = null; const P = pat('lead');
    if (!d.moved && d.mode === 'move') P.notes.splice(d.i, 1);
    P.notes.sort((a, b) => a.s - b.s || b.d - a.d); renderRoll(); renderTL(); commit(false);
  };
  $('#roll').addEventListener('pointerup', rollUp); $('#roll').addEventListener('pointercancel', rollUp);
  function playNote(n) { if (!ctx || playing || !n) return; tone(E.bus.lead, SOUNDS.lead[S.set.lead.sound], leadMidi(n.d), ctx.currentTime + 0.01, stepDur() * Math.min(n.l, 4), 0.9); }
  function leadIdea() {
    const RH = [[[0, 3], [3, 3], [6, 2], [8, 2], [10, 2], [12, 4], [16, 3], [19, 3], [22, 2], [24, 4], [28, 4]], [[0, 2], [2, 2], [4, 4], [8, 3], [11, 3], [14, 2], [16, 2], [18, 2], [20, 4], [24, 8]], [[0, 4], [4, 2], [6, 2], [8, 4], [12, 4], [16, 4], [20, 2], [22, 2], [24, 2], [26, 2], [28, 4]]];
    const rh = RH[Math.floor(Math.random() * RH.length)], prog = pat('chords').prog, tones = d => [0, 2, 4].map(k => (d + k) % 7), notes = [];
    let cur = tones(prog[0])[Math.floor(Math.random() * 3)] + 2;
    rh.forEach(([s, l], i) => {
      const bd = prog[s < 16 ? 0 : 1];
      if (s % 4 === 0) { const ct = tones(bd).flatMap(x => [x, x + 7]).filter(x => x <= 10); cur = ct.reduce((a, b) => Math.abs(b - cur) < Math.abs(a - cur) ? b : a, ct[0]); }
      else cur = clamp(cur + [-2, -1, -1, 1, 1, 2][Math.floor(Math.random() * 6)], 0, 10);
      if (i === rh.length - 1) cur = tones(prog[1])[0] + (cur > 5 ? 7 : 0);
      notes.push({ s, d: clamp(cur, 0, 10), l });
    });
    pat('lead').notes = notes; renderRoll(); renderTL(); commit();
  }
  $('#lead-idea').onclick = async () => { await power(); leadIdea(); };
  $('#lead-clear').onclick = () => { pat('lead').notes = []; renderRoll(); renderTL(); commit(); };

  function renderEditors() { renderPbars(); renderDrums(); renderBass(); renderProg(); renderProgPresets(); renderRoll(); renderSegs(); }

  /* ───────── Transport ───────── */
  function renderTransport() {
    $$('#play-mode button').forEach(b => b.classList.toggle('on', b.dataset.v === S.mode));
    $$('#scale button').forEach(b => b.classList.toggle('on', b.dataset.v === S.scale));
    $('#loop-section').disabled = S.mode !== 'loop';
    $('#eff-bpm').textContent = Math.round(effBpm());
    $('#key-root').value = S.key;
    const cl = $('.cur-line'); if (cl) cl.style.display = S.mode === 'song' ? '' : 'none';
  }
  $('#key-root').innerHTML = KEYNAME.map((n, i) => `<option value="${i}">${n}</option>`).join('');
  $('#key-root').onchange = e => { S.key = +e.target.value; F.key = 1; renderEditors(); renderTL(); commit(); preview('chords'); };
  $('#scale').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; S.scale = b.dataset.v; F.key = 1; renderEditors(); renderTL(); commit(); preview('chords'); });
  $('#play').onclick = () => { if (playing) stop(); else play(); };
  $('#play-mode').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; const was = playing; if (was) stop(); S.mode = b.dataset.v; renderTransport(); commit(false); if (was) play(); });
  $('#loop-section').onchange = e => { S.loopSec = S.sel = +e.target.value; renderTL(); commit(false); };
  $('#rec-song').onclick = recSong;
  $('#proj-reset').onclick = () => { if (!confirm('Clear your whole project and start over?')) return; stop(); const d = DEF(); Object.keys(d).forEach(k => { if (k !== 'f') S[k] = d[k]; }); Object.keys(F).forEach(k => delete F[k]); renderEverything(); applyAll(); commit(); openStep(0); };
  $('#song-title').addEventListener('input', e => { S.title = e.target.value; commit(false); });

  /* ───────── Playhead + meter ───────── */
  function clearPH() { $$('.ph').forEach(el => el.classList.remove('ph')); const p = $('.ph-line'); if (p) p.style.display = 'none'; const r = $('#roll .rph'); if (r) r.style.display = 'none'; }
  const meter = $('#meter'), mg = meter.getContext('2d'); let mbuf = null, peakHold = 0;
  function frame() {
    requestAnimationFrame(frame);
    if (!ctx) return;
    let ev = null; while (queue.length && queue[0].t <= ctx.currentTime) ev = queue.shift();
    if (ev) {
      $$('.ph').forEach(el => el.classList.remove('ph'));
      const line = $('.ph-line'); if (line) { line.style.display = ''; line.style.left = ((ev.bar + ev.s / 16) * BW) + 'px'; }
      const on = tr => { const c = clipAt(tr, ev.bar); return c && c.p === S.edit[tr] ? c : null; };
      if (on('drums')) $$(`#drum-grid .cell[data-i="${ev.s}"]`).forEach(c => c.classList.add('ph'));
      if (on('bass')) $$(`#bass-grid .cell[data-i="${ev.s}"]`).forEach(c => c.classList.add('ph'));
      let c = on('chords'); if (c) { const el = $(`#prog .chord[data-i="${(ev.bar - c.start) % 4}"]`); if (el) el.classList.add('ph'); }
      c = on('lead'); const rph = $('#roll .rph');
      if (rph) { if (c) { const G = rollGeom(); rph.style.display = 'block'; rph.style.left = (GX + (((ev.bar - c.start) % 2) * 16 + ev.s) * G.cw) + 'px'; } else rph.style.display = 'none'; }
      $('#pos').textContent = (ev.bar + 1) + '.' + (Math.floor(ev.s / 4) + 1);
      const mk = markAt(ev.bar); if (S.mode === 'song' && mk && mk.m.type === 'drop' && !F.heardDrop) { F.heardDrop = 1; commit(false); }
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
  requestAnimationFrame(frame);

  /* ───────── Guide ───────── */
  const cnt = a => a.filter(Boolean).length;
  const REF = `<div class="ref" id="ref"><button class="ref-btn" id="ref-play"><img src="https://i.ytimg.com/vi/3nQNiWdeH2Q/mqdefault.jpg" alt="" loading="lazy"><span>Janji – Heroes Tonight (feat. Johnning)<small>▶ PLAY THE REFERENCE HERE</small></span></button>
    <div class="credit">Music: Janji – Heroes Tonight (feat. Johnning) [NCS Release]. Music provided by NoCopyrightSounds. <a href="https://www.youtube.com/watch?v=3nQNiWdeH2Q" target="_blank" rel="noopener">Watch on YouTube ↗</a></div></div>`;
  const STEPS = [
    { id: 'start', title: 'Listen to the reference', panel: 'p-song',
      body: `${REF}<p>Our reference is <b>Heroes Tonight</b> by Janji, a <b>progressive house</b> track released by NCS (NoCopyrightSounds), who let creators use their music with credit. Play it above and notice what makes it work: a steady <b>four-on-the-floor</b> beat, a rolling bass that <b>pumps</b>, big <b>emotional chords</b>, a catchy <b>lead melody</b>, and <b>build-ups</b> that explode into <b>drops</b>.</p>
        <p>We won’t copy its melody. We’ll use the same <b>recipe</b> to write <b>a track that’s all yours</b>.</p>
        <p class="why">Everything happens on the <b>timeline</b> at the top right. Each coloured block is a <b>clip</b>: a short pattern (P01, P02…) placed in time. You write patterns in the editors below, then drag them where you want them in the song.</p>`,
      tasks: [['Press ▶ play at the top left (it’s quiet for now, that’s normal)', () => F.played]],
      auto: () => play() },
    { id: 'tempo', title: 'Tempo: 128 BPM', panel: 'transport',
      body: `<p><b>BPM</b> means beats per minute. Progressive house almost always sits at <b>126–128 BPM</b>: fast enough to dance to, slow enough to feel big.</p><p class="why">Tip: drag knobs up and down, use the mouse wheel, or click one and use the arrow keys. Double-click resets it. The <b>SLOWED</b> knob is a bonus: it lowers tempo and pitch together for a “slowed + reverb” version later.</p>`,
      tasks: [['Set BPM between 126 and 128', () => S.bpm >= 126 && S.bpm <= 128]],
      auto: () => { S.bpm = 128; applyAll(); } },
    { id: 'key', title: 'Key and scale', panel: 'transport',
      body: `<p>The <b>KEY</b> is the home note of your song; the <b>scale</b> sets its mood. <b>MINOR</b> sounds emotional and bittersweet, the classic progressive house feeling. <b>MAJOR</b> sounds bright and sunny.</p><p>Every note in this studio automatically stays in your key and scale, so <b>you can’t play a wrong note</b>.</p>`,
      tasks: [['Choose a key or scale at the top', () => F.key]],
      auto: () => { S.key = 9; S.scale = 'minor'; F.key = 1; } },
    { id: 'chords', title: 'Chords: the emotion', panel: 'p-chords',
      body: `<p>A chord is several notes ringing together, and it carries the <b>emotion</b>. A chord pattern is 4 bars, one chord per bar.</p><p>Try a <b>preset</b> (“Epic” is one of the most common progressions in all of EDM), then click any chord to change it. <b>SUPERSAW</b> gives the huge, wide chords you hear in big drops.</p><p class="why">In minor, “m” chords are dark and chords without “m” are bright. Mixing them creates the rise and fall of emotion.</p>`,
      tasks: [['Pick a chord progression (or click out 4 chords yourself)', () => F.progSet], ['Try a chord sound or rhythm', () => F['seg:chords.sound'] || F['seg:chords.rhythm']]],
      auto: () => { pat('chords').prog = PROGS[S.scale][Object.keys(PROGS[S.scale])[0]].slice(); F.progSet = 1; S.set.chords.sound = 'saw'; F['seg:chords.sound'] = 1; } },
    { id: 'kick', title: 'Kick drum: the heartbeat', panel: 'p-drums',
      body: `<p>Each square is a 16th note; <b>every 4 squares is one beat</b>. Paint squares 1, 5, 9 and 13 on the <b>KICK</b> row (click, or drag across). That’s the <b>four on the floor</b> heartbeat of every progressive house track.</p><p class="why">You’re editing drum pattern <b>P01</b>, and every DRUMS clip on the timeline that uses P01 plays it.</p>`,
      tasks: [['Place at least 4 kicks', () => cnt(pat('drums').kick) >= 4], ['Kicks on 1, 5, 9 and 13 (or use a preset)', () => [0, 4, 8, 12].every(i => pat('drums').kick[i]) || F.drumPreset]],
      auto: () => { const P = pat('drums'); P.kick = z16(); [0, 4, 8, 12].forEach(i => { P.kick[i] = 1; }); } },
    { id: 'groove', title: 'Claps and hi-hats', panel: 'p-drums',
      body: `<p>Put <b>CLAP</b> on squares 5 and 13 (beats 2 and 4). Put <b>HAT</b> between the kicks (3, 7, 11, 15): that “tss” on the off-beat is what makes house music push forward. Add an <b>OPEN HAT</b> or two for extra energy.</p>`,
      tasks: [['Place at least 2 claps', () => cnt(pat('drums').clap) >= 2], ['Place at least 4 hi-hats', () => cnt(pat('drums').hat) + cnt(pat('drums').ohat) >= 4]],
      auto: () => { const P = pat('drums'); P.clap = z16(); [4, 12].forEach(i => { P.clap[i] = 1; }); P.hat = z16(); [2, 6, 10, 14].forEach(i => { P.hat[i] = 1; }); } },
    { id: 'bass', title: 'Bass and the pump', panel: 'p-bass',
      body: `<p>The bass <b>follows the root of each chord automatically</b>; you only choose when it plays. Try <b>OFFBEAT</b> or <b>ROLLING</b>: notes between the kicks.</p><p>Then turn up <b>PUMP</b> in the SPACE panel. Every kick now pushes the other sounds down for a moment, so the whole track breathes in time. That pumping (sidechain) is a signature of progressive house.</p>`,
      tasks: [['Make the bass play at least 4 times', () => cnt(pat('bass').steps) >= 4], ['Turn PUMP above 30%', () => S.fx.side >= 0.3]],
      auto: () => { const P = pat('bass'); P.steps = z16(); [2, 6, 10, 14].forEach(i => { P.steps[i] = 1; }); S.fx.side = 0.6; } },
    { id: 'lead', title: 'Melody: your hook', panel: 'p-lead',
      body: `<p>The lead is the part people remember. In the piano roll, <b>click</b> to add a note, <b>drag</b> it anywhere in time or pitch, and <b>drag its right edge</b> to hold it longer. Click a note without dragging to delete it.</p><p>Stuck? <b>✦ GIVE ME AN IDEA</b> writes a starting point that fits your chords. Then move a few notes and it becomes yours.</p><p class="why">Hooks are short and repetitive. Land on chord notes on the beat, and end a phrase on the red home note.</p>`,
      tasks: [['Place at least 6 notes', () => pat('lead').notes.length >= 6], ['Use both bars', () => pat('lead').notes.some(n => n.s < 16) && pat('lead').notes.some(n => n.s >= 16)]],
      auto: () => leadIdea() },
    { id: 'arp', title: 'Arpeggio: drag it into the song', panel: 'p-arp',
      body: `<p>An arpeggio sparkles over the chords. Pick a sound to preview it.</p><p>Now the fun part: <b>drag the P01 chip</b> in this panel up to the <b>ARP row of the timeline</b>, and drop it where you want it, for example over the Break or the second Drop. Then drag its right edge to make it longer.</p>`,
      tasks: [['Preview an arpeggio sound', () => F['seg:arp.sound'] || F['seg:arp.rate'] || F['seg:arp.dir']], ['Put at least one ARP clip on the timeline', () => S.clips.some(c => c.tr === 'arp')]],
      auto: () => { F['seg:arp.sound'] = 1; [[16, 4], [24, 8]].forEach(([s, l]) => { if (!overlaps('arp', s, l, -1)) S.clips.push({ tr: 'arp', p: 0, start: s, len: l }); }); } },
    { id: 'space', title: 'Space: reverb and echo', panel: 'p-fx',
      body: `<p><b>REVERB</b> puts your sounds in a big room; <b>ECHO</b> repeats notes in time with the beat, which makes leads and arpeggios feel wide and alive. <b>R.SIZE</b> sets how big the room is.</p><p class="why">Bonus: turn <b>SLOWED</b> down and <b>LO-FI</b> up and you get an instant “slowed + reverb” version of your track.</p>`,
      tasks: [['Turn REVERB above 30%', () => S.fx.reverb >= 0.3], ['Turn ECHO above 15%', () => S.fx.delay >= 0.15]],
      auto: () => { S.fx.reverb = 0.38; S.fx.size = 3.5; S.fx.delay = 0.22; setIR(); } },
    { id: 'arrange', title: 'Arrange your song', panel: 'p-song',
      body: `<p>A song needs a journey: <b>Intro</b> → <b>Build</b> (a rising whoosh and a speeding-up clap roll are added automatically) → <b>Drop</b> (everything hits) → <b>Break</b> → Build → Drop → <b>Outro</b>. The labels across the top are the sections; the clips below are what plays.</p>
        <p><b>Drag clips</b> to move them, <b>drag the right edge</b> to stretch them, <b>Alt-drag</b> to copy, <b>double-click</b> an empty spot to add, and press <b>Delete</b> to remove the selected clip. Use <b>+ NEW</b> in an editor to write a second pattern (P02) for variety, like a fuller drum beat for the drop.</p>
        <p>Then switch to <b>WHOLE SONG</b> and listen from the start. Click the bar numbers to start from a later point.</p>`,
      tasks: [['Move, stretch, add or delete at least one clip', () => F.arr], ['Play in WHOLE SONG mode until the first Drop', () => F.heardDrop]],
      auto: () => { S.mode = 'song'; S.cursor = 0; F.arr = 1; renderTransport(); if (playing) stop(); play(); } },
    { id: 'mix', title: 'Mix and name it', panel: 'p-mix',
      body: `<p>Balance the tracks so everything is heard: <b>kick and bass loudest</b>, the melody clear, chords and arpeggio underneath. Use <b>M</b> (mute) and <b>S</b> (solo) on the timeline to hear tracks on their own. <b>If the red dots of the meter light up, it’s too loud</b>, so turn MASTER down a little.</p><p>Finally, <b>name your song</b> at the top of this guide.</p>`,
      tasks: [['Adjust the volume of any track', () => F.mixed], ['Name your song', () => S.title.trim().length > 0]],
      auto: () => { Object.assign(S.mix, { kick: 0.85, clap: 0.6, hat: 0.42, bass: 0.8, chords: 0.55, lead: 0.72, arp: 0.42, master: 0.8 }); F.mixed = 1; if (!S.title.trim()) { S.title = 'Heroes Of My Own'; $('#song-title').value = S.title; } } },
    { id: 'export', title: 'Record your first song!', panel: 'p-export',
      body: `<p>Press <b>RECORD WHOLE SONG</b>. The studio plays everything from the start while recording, then downloads the audio file named after your song. Keep this tab open while it records.</p><p>Congratulations, you’ve produced your own EDM track. 🎧 Your project is saved on this device, so come back any time to keep changing it.</p>`,
      tasks: [['Record and download the whole song', () => F.recorded]],
      auto: () => recSong() }
  ];
  let openIdx = -1;
  const stepDone = st => st.tasks.every(([, f]) => f());
  // Built once; later updates only toggle classes so the embedded player never reloads.
  function buildGuide() {
    $('#g-steps').innerHTML = STEPS.map((st, i) => `<li class="g-step" data-i="${i}">
        <button class="g-sh"><span class="g-num">${i + 1}</span><b>${st.title}</b><span class="g-go">+</span></button>
        <div class="g-body">${st.body}<ul class="g-tasks">${st.tasks.map(([t]) => `<li>${t}</li>`).join('')}</ul>
          <div class="g-acts"><button class="g-btn" data-go="${i}">SHOW ME</button><button class="g-btn" data-auto="${i}">DO IT FOR ME</button>${i < STEPS.length - 1 ? `<button class="g-btn primary" data-next="${i}">NEXT →</button>` : ''}</div></div></li>`).join('');
  }
  function renderGuide() {
    const doneN = STEPS.filter(stepDone).length, cur = STEPS.findIndex(st => !stepDone(st));
    $('#g-bar').style.width = (doneN / STEPS.length * 100) + '%'; $('#g-count').textContent = doneN + ' / ' + STEPS.length;
    $$('.g-step').forEach((li, i) => {
      const st = STEPS[i], done = stepDone(st);
      li.classList.toggle('done', done); li.classList.toggle('cur', i === cur); li.classList.toggle('open', i === openIdx);
      $('.g-num', li).textContent = done ? '✓' : i + 1; $('.g-go', li).textContent = i === openIdx ? '−' : '+';
      $$('.g-tasks li', li).forEach((t, k) => t.classList.toggle('ok', !!st.tasks[k][1]()));
    });
  }
  function openStep(i, scroll = true) { openIdx = i; renderGuide(); const li = $(`.g-step[data-i="${i}"]`); if (li && scroll) li.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
  function focusPanel(id) { const p = document.getElementById(id); if (!p) return; p.scrollIntoView({ behavior: 'smooth', block: 'start' }); p.classList.add('focus'); setTimeout(() => p.classList.remove('focus'), 1800); }
  $('#g-steps').addEventListener('click', e => {
    const rp = e.target.closest('#ref-play');
    if (rp) { rp.outerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/3nQNiWdeH2Q?autoplay=1" title="Janji – Heroes Tonight (feat. Johnning) [NCS Release]" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>'; return; }
    const h = e.target.closest('.g-sh'), go = e.target.closest('[data-go]'), au = e.target.closest('[data-auto]'), nx = e.target.closest('[data-next]');
    if (h) { const i = +h.parentElement.dataset.i; openStep(openIdx === i ? -1 : i, false); if (openIdx === i) focusPanel(STEPS[i].panel); return; }
    if (go) focusPanel(STEPS[+go.dataset.go].panel);
    if (au) { const st = STEPS[+au.dataset.auto]; Promise.resolve(st.auto()).then(() => { renderEverything(); applyAll(); commit(); toast('Done for you: ' + st.title); focusPanel(st.panel); }); }
    if (nx) { const i = +nx.dataset.next + 1; openStep(i); focusPanel(STEPS[i].panel); }
  });
  let wasDone = new Set(), booted = false;
  function commit(full = true) {
    save(); renderTransport(); knobs.forEach(r => r()); if (full) renderSegs();
    const before = openIdx, nowDone = new Set(STEPS.filter(stepDone).map(st => st.id));
    renderGuide();
    if (booted) nowDone.forEach(id => { if (!wasDone.has(id)) { const i = STEPS.findIndex(s => s.id === id); if (i === before) { toast('✓ Done: ' + STEPS[i].title); const nxt = STEPS.findIndex(st => !stepDone(st)); if (nxt >= 0) setTimeout(() => openStep(nxt), 900); } } });
    wasDone = nowDone;
  }

  /* ───────── Theme, toast, power ───────── */
  const theme = store.get('dot01:theme', null); if (theme) document.documentElement.dataset.theme = theme;
  $('#theme-btn').onclick = () => {
    const dark = document.documentElement.dataset.theme ? document.documentElement.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.dataset.theme = dark ? 'light' : 'dark'; store.set('dot01:theme', dark ? 'light' : 'dark');
  };
  let toastT = 0;
  function toast(m) { const t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2200); }
  async function power() {
    if (!ctx) { initAudio(); try { sessionStorage.setItem('dot01:powered', '1'); } catch { /* storage unavailable */ } $('#power').classList.add('off'); setTimeout(() => { $('#power').hidden = true; }, 500); }
    if (ctx.state !== 'running') await ctx.resume();
  }
  if (document.documentElement.classList.contains('powered')) ['pointerdown', 'keydown'].forEach(ev => document.addEventListener(ev, () => power(), { once: true, capture: true }));
  $('#power-btn').onclick = () => power();

  /* ───────── Boot ───────── */
  function renderEverything() { renderEditors(); renderTL(); renderTransport(); knobs.forEach(r => r()); $('#song-title').value = S.title; }
  buildKnobs(); buildSegs(); buildGuide(); renderEverything();
  const first = STEPS.findIndex(st => !stepDone(st));
  openStep(first < 0 ? STEPS.length - 1 : first, false);
  wasDone = new Set(STEPS.filter(stepDone).map(st => st.id)); booted = true;
  window.STUDIO = { S, play, stop, power, STEPS, addClip, renderTL, get ctx() { return ctx; }, get BW() { return BW; }, level() { if (!E.an) return 0; const d = new Float32Array(E.an.fftSize); E.an.getFloatTimeDomainData(d); return Math.max(...d.map(Math.abs)); } };
})();
