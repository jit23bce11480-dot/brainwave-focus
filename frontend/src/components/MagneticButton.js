import React, { useRef } from 'react';

// A button that leans towards the mouse when you get close, then springs back.
// It passes every normal button prop (onClick, disabled, type...) straight through.
export default function MagneticButton({ strength = 0.3, className = '', children, ...props }) {
  const ref = useRef(null);

  const onPointerMove = (e) => {
    if (e.pointerType !== 'mouse') return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - (rect.left + rect.width / 2);
    const y = e.clientY - (rect.top + rect.height / 2);
    ref.current.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
  };

  const onPointerLeave = () => {
    ref.current.style.transform = '';
  };

  return (
    <button
      ref={ref}
      className={`btn ${className}`}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      {...props}
    >
      {children}
    </button>
  );
}
