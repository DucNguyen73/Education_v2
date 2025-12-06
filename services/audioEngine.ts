// A simple synthesizer to generate ambient background noise based on the era.
// This avoids needing external MP3 files and provides an infinite soundscape.

let audioCtx: AudioContext | null = null;
let oscillators: OscillatorNode[] = [];
let gainNodes: GainNode[] = [];

const setupContext = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
};

const stopAll = () => {
  oscillators.forEach(osc => {
    try { osc.stop(); } catch (e) {}
    osc.disconnect();
  });
  gainNodes.forEach(g => g.disconnect());
  oscillators = [];
  gainNodes = [];
};

const createDrone = (freq: number, type: OscillatorType, volume: number, lfoFreq: number = 0) => {
  if (!audioCtx) return;

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  const lfo = audioCtx.createOscillator();
  const lfoGain = audioCtx.createGain();

  osc.type = type;
  osc.frequency.value = freq;

  gain.gain.value = volume;

  // LFO for movement
  if (lfoFreq > 0) {
      lfo.frequency.value = lfoFreq;
      lfoGain.gain.value = volume * 0.3; // Depth of modulation
      lfo.connect(lfoGain);
      lfoGain.connect(gain.gain);
      lfo.start();
      oscillators.push(lfo);
      gainNodes.push(lfoGain);
  }

  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();

  oscillators.push(osc);
  gainNodes.push(gain);
};

export const playAtmosphere = (type: 'ancient' | 'war' | 'peace' | 'modern') => {
  setupContext();
  stopAll();

  if (!audioCtx) return;

  const now = audioCtx.currentTime;

  switch (type) {
    case 'ancient': // Mystical, deep
      createDrone(110, 'sine', 0.1, 0.1); // A2
      createDrone(164.8, 'sine', 0.05, 0.2); // E3
      break;
    case 'war': // Dissonant, low rumble
      createDrone(55, 'sawtooth', 0.05, 5); // Low rumble
      createDrone(88, 'square', 0.02, 1);
      break;
    case 'peace': // Bright, major chord pads
      createDrone(261.6, 'sine', 0.05, 0.5); // C4
      createDrone(329.6, 'sine', 0.05, 0.4); // E4
      createDrone(392.0, 'sine', 0.05, 0.3); // G4
      break;
    case 'modern': // Electronic, pulsing
      createDrone(110, 'triangle', 0.05, 2);
      createDrone(220, 'square', 0.02, 4);
      break;
  }
};

export const stopAtmosphere = () => {
  stopAll();
};

export const setMasterVolume = (val: number) => {
    // In a real app we'd have a master gain node, simplifying here
    gainNodes.forEach(g => {
        // approximate relative volume scaling
        if (g.gain.value > 0.001) g.gain.value = val * 0.1; 
    });
};