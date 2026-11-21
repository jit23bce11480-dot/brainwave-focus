import { useCallback, useEffect, useRef, useState } from 'react';

// Humans can't hear 8-12 Hz directly (hearing starts around 20 Hz).
// A binaural beat plays an audible tone in each ear, slightly apart:
// left 200 Hz, right 210 Hz -> the brain perceives a 10 Hz "beat".
// Works best with headphones, because each ear must get only its own tone.
const CARRIER_HZ = 200;
const FADE_IN = 0.5; // seconds
const FADE_OUT = 0.3; // seconds

export default function useBinauralBeat(volume) {
  const contextRef = useRef(null); // the browser's sound engine (one per app)
  const nodesRef = useRef(null); // the tone currently playing: { left, right, gain }
  const [playing, setPlaying] = useState(false);

  // Browsers keep audio "suspended" until the user clicks something (autoplay policy),
  // so this must be called from a click handler.
  const getContext = useCallback(() => {
    if (!contextRef.current) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      contextRef.current = new AudioContext();
    }
    if (contextRef.current.state === 'suspended') contextRef.current.resume();
    return contextRef.current;
  }, []);

  const stop = useCallback(() => {
    const nodes = nodesRef.current;
    if (!nodes) return;
    nodesRef.current = null; // forget it now, so a new tone can't be stopped by mistake
    const ctx = contextRef.current;
    const now = ctx.currentTime;
    nodes.gain.gain.cancelScheduledValues(now);
    nodes.gain.gain.setValueAtTime(nodes.gain.gain.value, now);
    nodes.gain.gain.linearRampToValueAtTime(0, now + FADE_OUT); // fade out: no click
    nodes.left.stop(now + FADE_OUT); // scheduled stop of *these* oscillators only
    nodes.right.stop(now + FADE_OUT);
    setPlaying(false);
  }, []);

  const start = useCallback(
    (beatHz) => {
      try {
        const ctx = getContext();
        stop(); // only one tone at a time

        const left = ctx.createOscillator();
        const right = ctx.createOscillator();
        left.type = 'sine';
        right.type = 'sine';
        left.frequency.value = CARRIER_HZ;
        right.frequency.value = CARRIER_HZ + beatHz;

        // ChannelMerger builds one stereo signal: input 0 -> left ear, input 1 -> right ear.
        const merger = ctx.createChannelMerger(2);
        left.connect(merger, 0, 0);
        right.connect(merger, 0, 1);

        const gain = ctx.createGain(); // volume knob
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + FADE_IN); // fade in

        merger.connect(gain);
        gain.connect(ctx.destination); // speakers / headphones

        left.start();
        right.start();
        const nodes = { left, right, gain };
        nodesRef.current = nodes;
        setPlaying(true);
        return nodes;
      } catch (error) {
        console.error('Could not start audio:', error);
        window.alert('Unable to play audio. Click the page once, allow sound, and unmute this tab.');
        return null;
      }
    },
    [getContext, stop, volume]
  );

  // Plays a short sample so the user can check their sound before starting.
  const test = useCallback(
    (beatHz = 10) => {
      const nodes = start(beatHz);
      setTimeout(() => {
        if (nodes && nodesRef.current === nodes) stop(); // don't stop a newer tone
      }, 1500);
    },
    [start, stop]
  );

  // Move the volume while the tone is playing.
  useEffect(() => {
    const nodes = nodesRef.current;
    if (nodes) nodes.gain.gain.setTargetAtTime(volume, contextRef.current.currentTime, 0.05);
  }, [volume]);

  // When the component using this hook disappears, stop sound and free the audio engine.
  useEffect(
    () => () => {
      stop();
      if (contextRef.current) {
        contextRef.current.close();
        contextRef.current = null;
      }
    },
    [stop]
  );

  // `unlock` wakes the audio engine from a click, so later tones can play.
  return { playing, start, stop, test, unlock: getContext };
}
