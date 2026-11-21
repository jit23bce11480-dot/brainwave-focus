import { useEffect, useRef } from 'react';
import useReducedMotion from '../hooks/useReducedMotion';

// A custom cursor: a small dot that follows the mouse exactly and a ring that trails behind.
// The ring grows over anything clickable. Only for mouse users; touch screens keep the normal behaviour.
const INTERACTIVE = 'a, button, [role="button"], [role="radio"], input[type="range"], select, label';

export default function Cursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const finePointer = window.matchMedia('(pointer: fine)').matches;
    if (!finePointer || reducedMotion) return undefined;

    document.body.classList.add('has-custom-cursor');
    const dot = dotRef.current;
    const ring = ringRef.current;
    const pos = { x: -100, y: -100 };
    const ringPos = { x: -100, y: -100 };
    let frameId;

    const onMove = (e) => {
      pos.x = e.clientX;
      pos.y = e.clientY;
      dot.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
      const hovering = e.target.closest && e.target.closest(INTERACTIVE);
      ring.classList.toggle('is-hover', Boolean(hovering));
    };
    const onDown = () => ring.classList.add('is-down');
    const onUp = () => ring.classList.remove('is-down');

    // The ring moves 18% of the remaining distance each frame, which makes it trail smoothly.
    const loop = () => {
      ringPos.x += (pos.x - ringPos.x) * 0.18;
      ringPos.y += (pos.y - ringPos.y) * 0.18;
      ring.style.transform = `translate3d(${ringPos.x}px, ${ringPos.y}px, 0)`;
      frameId = requestAnimationFrame(loop);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);
    frameId = requestAnimationFrame(loop);

    return () => {
      document.body.classList.remove('has-custom-cursor');
      cancelAnimationFrame(frameId);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
    };
  }, [reducedMotion]);

  return (
    <>
      <div ref={ringRef} className="cursor-ring" aria-hidden="true" />
      <div ref={dotRef} className="cursor-dot" aria-hidden="true" />
    </>
  );
}
