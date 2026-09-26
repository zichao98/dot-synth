# DOT-01 Synthesizer

A retro, dot-matrix polyphonic synthesizer that runs entirely in the browser (Web Audio API, no dependencies).

- 2 oscillators (sine / triangle / saw / square / pulse) + sub + noise, 8-voice poly or mono with glide
- Filter (LP / HP / BP) with its own ADSR, key tracking, amp ADSR, LFO (pitch / filter / amp)
- Effects: drive, bit-crusher (AudioWorklet), chorus, delay, reverb
- Arpeggiator, 16-step sequencer with step recording and swing
- On-screen keyboard, computer keyboard (A–; / W E T Y U, Z/X octave, Space play), Web MIDI (notes, pitch bend, CC1/7/64/71/74)
- 13 presets, save your own, share by link, record and download what you play

Deployed as a static Cloudflare Worker: `npx wrangler deploy`.
