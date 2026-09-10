const fs = require('fs');
const path = require('path');

// Ensure assets/sounds/bgm directory exists
const bgmDir = path.join(__dirname, '..', 'assets', 'sounds', 'bgm');
if (!fs.existsSync(bgmDir)) {
    fs.mkdirSync(bgmDir, { recursive: true });
}

const SAMPLE_RATE = 22050;
const BITS_PER_SAMPLE = 16;
const NUM_CHANNELS = 1;

/**
 * Generate a 16-bit PCM WAV File Buffer
 */
function createWavBuffer(samples) {
    const dataSize = samples.length * 2;
    const buffer = Buffer.alloc(44 + dataSize);

    // RIFF header
    buffer.write('RIFF', 0);
    buffer.writeUInt32LE(36 + dataSize, 4);
    buffer.write('WAVE', 8);

    // fmt subchunk
    buffer.write('fmt ', 12);
    buffer.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
    buffer.writeUInt16LE(1, 20);  // AudioFormat (1 for PCM)
    buffer.writeUInt16LE(NUM_CHANNELS, 22);
    buffer.writeUInt32LE(SAMPLE_RATE, 24);
    buffer.writeUInt32LE(SAMPLE_RATE * NUM_CHANNELS * (BITS_PER_SAMPLE / 8), 28);
    buffer.writeUInt16LE(NUM_CHANNELS * (BITS_PER_SAMPLE / 8), 32);
    buffer.writeUInt16LE(BITS_PER_SAMPLE, 34);

    // data subchunk
    buffer.write('data', 36);
    buffer.writeUInt32LE(dataSize, 40);

    for (let i = 0; i < samples.length; i++) {
        let val = Math.max(-1, Math.min(1, samples[i]));
        let intVal = val < 0 ? val * 32768 : val * 32767;
        buffer.writeInt16LE(Math.round(intVal), 44 + i * 2);
    }

    return buffer;
}

// Generate Track 1: "Midnight Lofi Chill" (12 seconds loop)
function generateTrack1() {
    const durationSec = 12;
    const numSamples = SAMPLE_RATE * durationSec;
    const samples = new Float32Array(numSamples);
    
    // E minor 9 chord frequencies: E3 (164.81), G3 (196.00), B3 (246.94), D4 (293.66), F#4 (369.99)
    // A minor 7 chord frequencies: A3 (220.00), C4 (261.63), E4 (329.63), G4 (392.00)
    const chord1 = [164.81, 196.00, 246.94, 293.66, 369.99];
    const chord2 = [220.00, 261.63, 329.63, 392.00];

    for (let i = 0; i < numSamples; i++) {
        const t = i / SAMPLE_RATE;
        const progress = (t % durationSec) / durationSec;
        const chord = progress < 0.5 ? chord1 : chord2;
        
        // Gentle pulse envelope
        const envelope = 0.5 + 0.5 * Math.sin(t * Math.PI * 2 * 0.25);
        
        let sample = 0;
        chord.forEach((freq) => {
            // Soft sine + warm 2nd harmonic
            sample += Math.sin(t * Math.PI * 2 * freq) * 0.08;
            sample += Math.sin(t * Math.PI * 2 * freq * 2) * 0.02;
        });

        // Subtle lofi click texture every 1.5 seconds
        if ((t % 1.5) < 0.015) {
            const clickNoise = (Math.random() * 2 - 1) * Math.exp(-(t % 1.5) * 200);
            sample += clickNoise * 0.12;
        }

        samples[i] = sample * envelope * 0.4;
    }

    fs.writeFileSync(path.join(bgmDir, 'track1.wav'), createWavBuffer(samples));
    console.log('Generated Track 1: Midnight Lofi Chill (track1.wav)');
}

// Generate Track 2: "Gentle Rain Clicks" (12 seconds loop)
function generateTrack2() {
    const durationSec = 12;
    const numSamples = SAMPLE_RATE * durationSec;
    const samples = new Float32Array(numSamples);
    
    // C major 7 / F major 7 melody: C4 (261.63), E4 (329.63), G4 (392.00), B4 (493.88), A4 (440.00)
    const melodyFreqs = [261.63, 329.63, 392.00, 493.88, 440.00, 392.00, 329.63, 261.63];

    for (let i = 0; i < numSamples; i++) {
        const t = i / SAMPLE_RATE;
        const noteIndex = Math.floor(t * 1.5) % melodyFreqs.length;
        const noteFreq = melodyFreqs[noteIndex];
        const noteT = (t * 1.5) % 1;
        const noteEnv = Math.exp(-noteT * 3);

        // Soft bell-like sine tone
        let sample = Math.sin(t * Math.PI * 2 * noteFreq) * noteEnv * 0.2;
        sample += Math.sin(t * Math.PI * 2 * noteFreq * 0.5) * noteEnv * 0.15; // Low sub-bass

        // Soft rain/dust background noise
        const rainNoise = (Math.random() * 2 - 1) * 0.015;
        sample += rainNoise;

        // Soft clicking accents every 0.75 seconds
        if ((t % 0.75) < 0.01) {
            const clickAcc = (Math.random() * 2 - 1) * Math.exp(-(t % 0.75) * 300);
            sample += clickAcc * 0.08;
        }

        samples[i] = sample * 0.4;
    }

    fs.writeFileSync(path.join(bgmDir, 'track2.wav'), createWavBuffer(samples));
    console.log('Generated Track 2: Gentle Rain Clicks (track2.wav)');
}

// Generate Track 3: "Cosmic Idle Groove" (12 seconds loop)
function generateTrack3() {
    const durationSec = 12;
    const numSamples = SAMPLE_RATE * durationSec;
    const samples = new Float32Array(numSamples);
    
    // Dreamy synth pad progression: D3 (146.83), F#3 (185.00), A3 (220.00), C#4 (277.18)
    const padFreqs = [146.83, 185.00, 220.00, 277.18];

    for (let i = 0; i < numSamples; i++) {
        const t = i / SAMPLE_RATE;
        const lfo = 0.5 + 0.5 * Math.sin(t * Math.PI * 2 * 0.2); // Slow cosmic swell

        let sample = 0;
        padFreqs.forEach((freq, idx) => {
            // Triangle-like synth harmonics
            sample += Math.sin(t * Math.PI * 2 * freq) * 0.07;
            sample += Math.sin(t * Math.PI * 2 * freq * 1.5) * 0.03;
        });

        // Rhythmic clicking beat tick every 0.5 seconds
        if ((t % 0.5) < 0.008) {
            const tick = Math.sin(t * Math.PI * 2 * 1200) * Math.exp(-(t % 0.5) * 400);
            sample += tick * 0.1;
        }

        samples[i] = sample * lfo * 0.45;
    }

    fs.writeFileSync(path.join(bgmDir, 'track3.wav'), createWavBuffer(samples));
    console.log('Generated Track 3: Cosmic Idle Groove (track3.wav)');
}

generateTrack1();
generateTrack2();
generateTrack3();
console.log('All BGM tracks generated successfully in assets/sounds/bgm/!');
