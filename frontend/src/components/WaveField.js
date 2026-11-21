import React, { useEffect, useRef } from 'react';
import useReducedMotion from '../hooks/useReducedMotion';

// The living background: many horizontal "brainwave" lines drawn on a <canvas>
// about 60 times a second with requestAnimationFrame.
//
// mode = 'idle'  -> lively waves that bend away from the mouse
// mode = 'focus' -> calmer, flatter waves (you're working)
// mode = 'tone'  -> waves slowly swell and settle every 10 s, matching the breathing guide.
//
// Nothing ever flashes or flickers: 3-30 Hz flashing can trigger seizures,
// so the visuals stay slow even though the tone is 8-12 Hz.

const LINE_COUNT = 18;
const MODES = {
  idle: { amplitude: 26, speed: 1, mouse: 1, warmth: 0.25 },
  focus: { amplitude: 10, speed: 0.45, mouse: 0.35, warmth: 0.15 },
  tone: { amplitude: 14, speed: 0.3, mouse: 0.2, warmth: 0.85 },
};

// Mix two [r, g, b] colours. t = 0 gives a, t = 1 gives b.
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
const LILAC = [169, 156, 255];
const CORAL = [255, 106, 77];

export default function WaveField({ mode = 'idle' }) {
  const canvasRef = useRef(null);
  const modeRef = useRef(mode);
  const reducedMotion = useReducedMotion();

  // Keep the latest mode in a ref so the animation loop can read it without restarting.
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let width = 0;
    let height = 0;
    let frameId = null;

    // Current values glide towards the target mode's values (no sudden jumps).
    const current = { ...MODES[modeRef.current] };
    // Mouse position, smoothed. Starts off-screen.
    const mouse = { x: -9999, y: -9999, targetX: -9999, targetY: -9999 };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2); // sharp on retina, capped for speed
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const onPointerMove = (e) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
    };
    const onPointerLeave = () => {
      mouse.targetX = -9999;
      mouse.targetY = -9999;
    };

    const draw = (timeMs) => {
      const t = timeMs / 1000;
      const target = MODES[modeRef.current] || MODES.idle;

      // Ease every setting 4% of the way to its target each frame.
      for (const key of Object.keys(target)) {
        current[key] += (target[key] - current[key]) * 0.04;
      }
      mouse.x += (mouse.targetX - mouse.x) * 0.08;
      mouse.y += (mouse.targetY - mouse.y) * 0.08;

      // In tone mode the waves swell and settle over 10 s (4 s up, 6 s down), like the breath.
      const cycle = (t % 10) / 10;
      const breath = cycle < 0.4 ? cycle / 0.4 : 1 - (cycle - 0.4) / 0.6;
      const swell = 1 + current.warmth * 1.2 * (Math.sin((breath - 0.5) * Math.PI) * 0.5 + 0.5);
      const scroll = window.scrollY * 0.0015; // scrolling nudges the wave phase (parallax)

      ctx.clearRect(0, 0, width, height);
      ctx.lineWidth = 1.2;

      for (let i = 0; i < LINE_COUNT; i += 1) {
        const p = i / (LINE_COUNT - 1); // 0 at the top line, 1 at the bottom
        const baseY = height * (0.08 + p * 0.84);
        const centre = 1 - Math.abs(p - 0.5) * 2; // middle lines are brighter
        const amp = current.amplitude * swell * (0.5 + centre * 0.9);
        const phase = t * current.speed + i * 0.55 + scroll;

        const gradient = ctx.createLinearGradient(0, 0, width, 0);
        const left = mix(LILAC, CORAL, current.warmth * 0.5);
        const right = mix(LILAC, CORAL, 0.35 + current.warmth * 0.65);
        const alpha = 0.08 + centre * 0.32;
        gradient.addColorStop(0, `rgba(${left.join(',')},${alpha * 0.4})`);
        gradient.addColorStop(0.5, `rgba(${left.join(',')},${alpha})`);
        gradient.addColorStop(1, `rgba(${right.join(',')},${alpha})`);
        ctx.strokeStyle = gradient;

        ctx.beginPath();
        for (let x = 0; x <= width + 8; x += 8) {
          // Two sine waves at different speeds make a natural, EEG-like shape.
          let y =
            baseY +
            Math.sin(x * 0.006 + phase) * amp +
            Math.sin(x * 0.017 - phase * 1.6 + i) * amp * 0.35;

          // Near the mouse, lines are pushed away (a soft bump, strongest at the pointer).
          const dx = x - mouse.x;
          const dy = baseY - mouse.y;
          const pull = Math.exp(-(dx * dx) / 26000 - (dy * dy) / 9000);
          y += pull * 70 * current.mouse * (dy >= 0 ? 1 : -1);

          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      if (!reducedMotion) frameId = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener('resize', resize);
    if (reducedMotion) {
      draw(4000); // one still frame, no loop, no mouse effect
    } else {
      window.addEventListener('pointermove', onPointerMove);
      document.addEventListener('pointerleave', onPointerLeave);
      frameId = requestAnimationFrame(draw);
    }

    // Cleanup: stop the loop and remove listeners when the component goes away.
    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerleave', onPointerLeave);
    };
  }, [reducedMotion]);

  return <canvas ref={canvasRef} className="wave-field" aria-hidden="true" />;
}
