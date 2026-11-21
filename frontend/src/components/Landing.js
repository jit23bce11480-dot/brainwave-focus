import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Headphones } from 'lucide-react';
import MagneticButton from './MagneticButton';
import BrandMark from './BrandMark';
import useReveal from '../hooks/useReveal';
import useReducedMotion from '../hooks/useReducedMotion';

// The five EEG bands. `cycles` is how many waves we draw across the scope:
// a picture of "faster" vs "slower", not a real-speed signal (that would flicker).
const BANDS = [
  { name: 'Delta', hz: '0.5–4 Hz', cycles: 2, state: 'Deep, dreamless sleep', text: 'The slowest rhythm. Big, rolling waves while you are fully asleep.' },
  { name: 'Theta', hz: '4–8 Hz', cycles: 4, state: 'Drowsy and drifting', text: 'Shows up as you fall asleep, daydream or zone out.' },
  { name: 'Alpha', hz: '8–12 Hz', cycles: 7, state: 'Relaxed but awake', text: 'Calm, alert rest. The band BrainWave’s tone aims for when you lose focus.' },
  { name: 'Beta', hz: '12–30 Hz', cycles: 14, state: 'Busy, active thinking', text: 'Problem solving, talking, concentrating hard. Too much feels like stress.' },
  { name: 'Gamma', hz: '30+ Hz', cycles: 26, state: 'Intense processing', text: 'The fastest rhythm, linked to binding information together.' },
];

// Builds an SVG path of `cycles` sine waves across a 1000 x 150 box, twice over
// (so the strip can slide left by half its width and loop without a seam).
function wavePath(cycles) {
  const width = 2000;
  const points = [];
  for (let x = 0; x <= width; x += 4) {
    const y = 75 + Math.sin((x / 1000) * cycles * Math.PI * 2) * 48;
    points.push(`${x === 0 ? 'M' : 'L'}${x} ${y.toFixed(1)}`);
  }
  return points.join(' ');
}

const MARQUEE = [
  { text: 'Focus', style: '' },
  { text: 'breathe', style: 'serif' },
  { text: 'Refocus', style: 'outline' },
  { text: '8–12 Hz', style: '' },
  { text: 'drift & return', style: 'serif' },
  { text: 'Deep work', style: 'outline' },
];

function Marquee() {
  const ref = useRef(null);
  const reducedMotion = useReducedMotion();

  // Skews the strip slightly in the direction you scroll, then eases back: a sense of speed.
  useEffect(() => {
    if (reducedMotion) return undefined;
    let lastY = window.scrollY;
    let skew = 0;
    let frameId;
    const loop = () => {
      const y = window.scrollY;
      const velocity = y - lastY;
      lastY = y;
      skew += (Math.max(-12, Math.min(12, velocity * 0.4)) - skew) * 0.1;
      if (ref.current) ref.current.style.setProperty('--skew', `${skew.toFixed(2)}deg`);
      frameId = requestAnimationFrame(loop);
    };
    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [reducedMotion]);

  const group = (hidden) => (
    <div className="marquee-group" aria-hidden={hidden || undefined}>
      {MARQUEE.map((item) => (
        <React.Fragment key={item.text}>
          <span className={item.style}>{item.text}</span>
          <BrandMark className="sep" />
        </React.Fragment>
      ))}
    </div>
  );

  return (
    <div className="marquee">
      <div className="marquee-track" ref={ref}>
        {group(false)}
        {group(true)}
      </div>
    </div>
  );
}

export default function Landing({ onStart, onTestAudio }) {
  const [active, setActive] = useState(2); // start on Alpha
  const band = BANDS[active];
  const path = useMemo(() => wavePath(band.cycles), [band.cycles]);
  useReveal();

  return (
    <main className="screen">
      <header className="topbar">
        <div className="brand">
          <BrandMark /> BrainWave
        </div>
        <button className="link-btn" onClick={onStart}>
          Start analysis
        </button>
      </header>

      <section className="hero">
        <p className="eyebrow fade-up" style={{ '--delay': '0.1s' }}>
          <span className="dot" />A focus timer built around how you live
        </p>

        <h1 className="display hero-title">
          <span className="row"><span style={{ '--i': 0 }}>Find</span></span>
          <span className="row indent">
            <span style={{ '--i': 1 }}><span className="serif">your</span> focus</span>
          </span>
          <span className="row"><span style={{ '--i': 2 }}>window.</span></span>
        </h1>

        <div className="hero-bottom">
          <p className="lead fade-up" style={{ '--delay': '0.75s' }}>
            Seven quick questions give you an estimate of how long you can really concentrate. Then a timer
            holds you to it, and a binaural tone helps you reset when your mind drifts.
          </p>
          <div className="hero-actions fade-up" style={{ '--delay': '0.9s' }}>
            <MagneticButton className="btn-primary btn-lg" onClick={onStart}>
              Start your analysis <ArrowRight className="arrow" size={20} />
            </MagneticButton>
            <MagneticButton className="btn-ghost btn-lg" onClick={onTestAudio} strength={0.2}>
              <Headphones size={20} /> Test audio
            </MagneticButton>
          </div>
        </div>

        <div className="hero-meta fade-up" style={{ '--delay': '1.2s' }}>
          <span className="scroll-cue">
            <span className="bar" /> Scroll
          </span>
          <span className="hide-sm">Rule-based estimate · Not medical advice · Free</span>
        </div>
      </section>

      <Marquee />

      <section className="section" aria-labelledby="how-title">
        <div className="section-head">
          <p className="eyebrow reveal">How it works</p>
          <h2 id="how-title" className="h2 reveal" style={{ '--delay': '0.1s' }}>
            Three steps. <span className="serif">No sign-up.</span>
          </h2>
        </div>
        <ol className="steps" style={{ listStyle: 'none' }}>
          {[
            ['Answer seven questions', 'Age, sleep, stress, exercise, caffeine, screen time and the kind of work you do. About a minute.'],
            ['Get your focus window', 'A rule-based model turns your answers into a focus length, a break length and a beat frequency.'],
            ['Focus, drift, return', 'Start the timer. When your mind wanders, press one button: the timer pauses and a calming tone plays.'],
          ].map(([title, text], i) => (
            <li className="step reveal" style={{ '--delay': `${i * 0.12}s` }} key={title}>
              <span className="step-num">0{i + 1}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="section" aria-labelledby="bands-title">
        <div className="section-head">
          <p className="eyebrow reveal">The science, honestly</p>
          <h2 id="bands-title" className="h2 reveal" style={{ '--delay': '0.1s' }}>
            Your brain hums at <span className="serif">different speeds.</span>
          </h2>
        </div>

        <div className="bands">
          <ul className="band-list reveal">
            {BANDS.map((b, i) => (
              <li className="band-item" key={b.name}>
                <button
                  className="band-btn"
                  aria-pressed={i === active}
                  onClick={() => setActive(i)}
                  onPointerEnter={(e) => e.pointerType === 'mouse' && setActive(i)}
                >
                  <span className="name">{b.name}</span>
                  <span className="hz">{b.hz}</span>
                </button>
              </li>
            ))}
          </ul>

          <div className="band-visual reveal" style={{ '--delay': '0.15s' }} aria-live="polite">
            <div className="band-scope">
              <svg viewBox="0 0 2000 150" preserveAspectRatio="none" aria-hidden="true">
                <defs>
                  <linearGradient id="scope-gradient" x1="0" x2="1">
                    <stop offset="0" stopColor="#a99cff" />
                    <stop offset="1" stopColor="#ff6a4d" />
                  </linearGradient>
                </defs>
                <path d={path} fill="none" stroke="url(#scope-gradient)" strokeWidth="3" vectorEffect="non-scaling-stroke" />
              </svg>
            </div>
            <p className="eyebrow">{band.name} · {band.hz}</p>
            <p className="state">{band.state}</p>
            <p>{band.text}</p>
          </div>
        </div>

        <p className="note reveal">
          <strong>You can’t hear 10 Hz.</strong> Human hearing starts around 20 Hz. So BrainWave plays 200 Hz in one
          ear and 210 Hz in the other, and your brain perceives the 10 Hz difference as a slow beat. Research on
          whether this improves focus is mixed: treat it as a calming cue, not medicine.
        </p>
      </section>

      <section className="cta">
        <p className="eyebrow reveal">One minute to start</p>
        <h2 className="display cta-title reveal" style={{ '--delay': '0.1s' }}>
          Ready <span className="serif">when</span>
          <br />
          you are.
        </h2>
        <div className="reveal" style={{ '--delay': '0.2s' }}>
          <MagneticButton className="btn-primary btn-lg" onClick={onStart}>
            Start your analysis <ArrowRight className="arrow" size={20} />
          </MagneticButton>
        </div>
      </section>

      <footer className="site-foot">
        <span>BrainWave Focus</span>
        <span>Rule-based estimate · Not medical advice</span>
      </footer>
    </main>
  );
}
