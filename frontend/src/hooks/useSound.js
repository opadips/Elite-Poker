/* Shared AudioContext — browsers cap concurrent contexts (~6), so every
   sound must reuse one instance or audio silently stops working. */

let sharedCtx = null;
let masterGain = null;

function getCtx() {
  try {
    if (!sharedCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      sharedCtx = new AC();
      masterGain = sharedCtx.createGain();
      masterGain.gain.value = 0.9;
      masterGain.connect(sharedCtx.destination);
    }
    if (sharedCtx.state === 'suspended') {
      sharedCtx.resume();
    }
    return sharedCtx;
  } catch (e) {
    return null;
  }
}

function tone({ type = 'sine', freq = 440, endFreq = null, start = 0, duration = 0.15, volume = 0.2 }) {
  const ctx = getCtx();
  if (!ctx) return;
  const t0 = ctx.currentTime + start;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (endFreq) osc.frequency.exponentialRampToValueAtTime(Math.max(endFreq, 1), t0 + duration);
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(volume, t0 + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(gain);
  gain.connect(masterGain);
  osc.start(t0);
  osc.stop(t0 + duration + 0.05);
}

function noiseBurst({ duration = 0.08, volume = 0.15, filterFreq = 2200, start = 0 }) {
  const ctx = getCtx();
  if (!ctx) return;
  const t0 = ctx.currentTime + start;
  const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * duration));
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-4 * (i / bufferSize));
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = filterFreq;
  filter.Q.value = 0.8;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(masterGain);
  source.start(t0);
  source.stop(t0 + duration);
}

export function cardDeal() {
  noiseBurst({ duration: 0.09, volume: 0.14, filterFreq: 1800 });
  noiseBurst({ duration: 0.05, volume: 0.07, filterFreq: 3200, start: 0.03 });
}

export function chipClick() {
  tone({ type: 'triangle', freq: 1900, endFreq: 1100, duration: 0.045, volume: 0.14 });
  tone({ type: 'sine', freq: 950, endFreq: 620, duration: 0.07, volume: 0.1, start: 0.02 });
}

export function winnerFanfare() {
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((freq, i) => {
    tone({ type: 'triangle', freq, duration: 0.32, volume: 0.14, start: i * 0.11 });
    tone({ type: 'sine', freq: freq * 2, duration: 0.22, volume: 0.05, start: i * 0.11 });
  });
  tone({ type: 'sine', freq: 1318.5, duration: 0.5, volume: 0.1, start: notes.length * 0.11 });
}

export function timerBeep() {
  tone({ type: 'sine', freq: 880, duration: 0.09, volume: 0.1 });
  tone({ type: 'sine', freq: 880, duration: 0.09, volume: 0.08, start: 0.14 });
}

export function allInSound() {
  for (let i = 0; i < 10; i++) {
    const freq = 900 + Math.random() * 900;
    tone({ type: 'triangle', freq, endFreq: freq * 0.55, duration: 0.16, volume: 0.08, start: i * 0.035 });
  }
  noiseBurst({ duration: 0.35, volume: 0.06, filterFreq: 5000, start: 0.05 });
}

export function chipLandSound() {
  tone({ type: 'sine', freq: 1300, endFreq: 700, duration: 0.055, volume: 0.12 });
  tone({ type: 'triangle', freq: 2400, endFreq: 1600, duration: 0.03, volume: 0.06 });
}
