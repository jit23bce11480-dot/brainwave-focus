import React from 'react';

// The logo: one wave, drawn as an SVG path.
export default function BrandMark({ className = 'brand-mark' }) {
  return (
    <svg className={className} viewBox="0 0 30 18" fill="none" aria-hidden="true">
      <path
        d="M1 9c2.5 0 2.5-7 5-7s2.5 14 5 14 2.5-11 5-11 2.5 8 5 8 2.5-4 5-4 2 2 3 2"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
