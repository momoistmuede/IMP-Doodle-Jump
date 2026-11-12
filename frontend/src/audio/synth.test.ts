import { describe, expect, it } from 'vitest';
import { EFFECTS } from './effects';
import { TRACKS } from './music';
import { noteFrequency, renderTones, renderTrack, type Track } from './synth';

const RATE = 22050;

function expectValidSamples(samples: Float32Array) {
  expect(samples.length).toBeGreaterThan(0);
  // One expect per array, not per sample: the music loops have millions of samples.
  let peak = 0;
  let finite = true;
  for (const value of samples) {
    finite &&= Number.isFinite(value);
    peak = Math.max(peak, Math.abs(value));
  }
  expect(finite).toBe(true);
  expect(peak).toBeLessThanOrEqual(1);
  expect(peak).toBeGreaterThan(0.01);
}

describe('synth', () => {
  it('knows note frequencies', () => {
    expect(noteFrequency('A4')).toBeCloseTo(440);
    expect(noteFrequency('C4')).toBeCloseTo(261.63, 1);
    expect(noteFrequency('Bb2')).toBeCloseTo(noteFrequency('A#2'));
    expect(() => noteFrequency('H4')).toThrow();
  });

  it('renders tones one after another', () => {
    const samples = renderTones(
      [
        { wave: 'square', freq: 440, duration: 0.1 },
        { wave: 'noise', freq: 4000, duration: 0.2 },
      ],
      RATE,
    );
    expect(Math.abs(samples.length - 0.3 * RATE)).toBeLessThanOrEqual(1);
    expectValidSamples(samples);
  });

  it('renders every effect', () => {
    for (const [name, tones] of Object.entries(EFFECTS)) {
      const samples = renderTones(tones, RATE);
      // Effects are short; only the intro wind and the jetpack engine last as long as what they accompany.
      const limit = { wind: 11, jetpackLoop: 4 }[name] ?? 3;
      expect(samples.length / RATE, name).toBeLessThan(limit);
      expectValidSamples(samples);
    }
  });

  it('renders every track as a seamless loop of whole bars', () => {
    for (const [name, track] of Object.entries(TRACKS) as [string, Track][]) {
      const steps = track.lead.trim().split(/\s+/).length;
      expect(steps % 16, name).toBe(0);
      for (const channel of [track.harmony, track.bass, track.drums]) {
        if (channel) expect(channel.trim().split(/\s+/).length, name).toBe(steps);
      }
      const samples = renderTrack(track, RATE);
      expect(samples.length).toBe(Math.round(steps * (60 / track.bpm / 4) * RATE));
      expectValidSamples(samples);
    }
  });
});
