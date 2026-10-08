/* Shared music-theory + Web Audio chord synthesis — used by both
   prototype.html (the chord finder) and room.html (the 3D room), so
   a chord sounds identical everywhere it plays. */
const NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const QUALITY_INTERVALS = {
  '':     [0,4,7],      // major
  'm':    [0,3,7],      // minor
  '7':    [0,4,7,10],   // dominant 7
  'maj7': [0,4,7,11],
  'm7':   [0,3,7,10],
  'sus4': [0,5,7],
  '7sus4':[0,5,7,10],
  '6':    [0,4,7,9],
};
// Order matters: longer/more specific suffixes must be checked first.
const QUALITY_ORDER = ['maj7','7sus4','sus4','m7','6','7','m',''];

// Flat spellings (Bb, Eb, ...) resolve to the same chromatic index as their
// sharp equivalent — needed because parseChord/noteIndex only recognize the
// sharp-spelled NOTE_NAMES array. Fixes a real bug: "Bb" was matching the
// regex as root "B" with a stray, unrecognized "b" quality suffix, silently
// turning every Bb into a B major everywhere — display, diagram, and pitch.
const FLAT_TO_SHARP_INDEX = { 'Cb':11,'Db':1,'Eb':3,'Fb':4,'Gb':6,'Ab':8,'Bb':10 };
function parseChord(sym){
  // Splits e.g. "F#m7" or "Bbm" into { root, quality }, root kept in its
  // original spelling (sharp or flat) so display/lookup stays exact.
  const m = sym.match(/^([A-G][#b]?)(.*)$/);
  if (!m) return { root: 'C', quality: '' };
  const root = m[1];
  let rest = m[2];
  let quality = QUALITY_ORDER.find(q => rest === q) ?? '';
  return { root, quality };
}
function noteIndex(name){
  if (FLAT_TO_SHARP_INDEX[name] !== undefined) return FLAT_TO_SHARP_INDEX[name];
  return NOTE_NAMES.indexOf(name);
}
function transposeChordSymbol(sym, semitones){
  if (semitones === 0) return sym; // preserve the exact original spelling untouched
  const { root, quality } = parseChord(sym);
  const idx = (noteIndex(root) + semitones + 120) % 12;
  return NOTE_NAMES[idx] + quality;
}
function chordFrequencies(sym, octaveBase = 3){
  const { root, quality } = parseChord(sym);
  const intervals = QUALITY_INTERVALS[quality] || QUALITY_INTERVALS[''];
  const rootIdx = noteIndex(root);
  return intervals.map(semi => {
    const midi = 12 * (octaveBase + 1) + rootIdx + semi; // MIDI note number
    return 440 * Math.pow(2, (midi - 69) / 12);
  });
}

let actx = null;
function getActx(){ if (!actx) actx = new (window.AudioContext||window.webkitAudioContext)(); return actx; }
function strumChord(sym){
  const ctx = getActx();
  if (ctx.state === 'suspended') ctx.resume();
  const freqs = chordFrequencies(sym, 3);
  const now = ctx.currentTime;
  freqs.forEach((f, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = f;
    const start = now + i * 0.045;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.11, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0008, start + 1.3);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(start); osc.stop(start + 1.35);
    // a quiet octave-up partner on the top note, for a little shimmer
    if (i === freqs.length - 1) {
      const osc2 = ctx.createOscillator(), gain2 = ctx.createGain();
      osc2.type = 'sine'; osc2.frequency.value = f * 2;
      gain2.gain.setValueAtTime(0, start);
      gain2.gain.linearRampToValueAtTime(0.035, start + 0.015);
      gain2.gain.exponentialRampToValueAtTime(0.0006, start + 1.1);
      osc2.connect(gain2); gain2.connect(ctx.destination);
      osc2.start(start); osc2.stop(start + 1.15);
    }
  });
}

