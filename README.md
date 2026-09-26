# DOT-01 Synthesizer

A retro, dot-matrix polyphonic synthesizer that runs entirely in the browser (Web Audio API, no dependencies).

- 2 oscillators (sine / triangle / saw / square / pulse) + sub + noise, 8-voice poly or mono with glide
- Filter (LP / HP / BP) with its own ADSR, key tracking, amp ADSR, LFO (pitch / filter / amp)
- Effects: drive, bit-crusher (AudioWorklet), chorus, delay, reverb
- Arpeggiator, 16-step sequencer with step recording and swing
- On-screen keyboard, computer keyboard (A–; / W E T Y U, Z/X octave, Space play), Web MIDI (notes, pitch bend, CC1/7/64/71/74)
- 13 presets, save your own, share by link, record and download what you play

## Studio (`/studio`)

A drag-and-drop EDM timeline with a built-in, step-by-step tutorial for complete beginners (reference track: Janji – Heroes Tonight, NCS). Patterns (P01, P02…) for drums, bass, chords, lead and arpeggio are placed as clips you can move, stretch and copy; the lead piano roll has draggable, resizable notes. Also: sidechain pump, a SLOWED control, reverb/echo/lo-fi, section markers with automatic risers and drops, mute/solo, and one-click recording of the whole song. Projects are saved in the browser.

Deployed as a static Cloudflare Worker: `npx wrangler deploy`.
