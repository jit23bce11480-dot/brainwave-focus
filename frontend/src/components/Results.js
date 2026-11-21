import React, { useState } from 'react';
import { Volume1, Volume2, VolumeX, WifiOff } from 'lucide-react';
import FocusSession from './FocusSession';
import BrandMark from './BrandMark';
import useCountUp from '../hooks/useCountUp';
import useReveal from '../hooks/useReveal';

function VolumeIcon({ volume }) {
  if (volume === 0) return <VolumeX size={20} />;
  if (volume < 0.5) return <Volume1 size={20} />;
  return <Volume2 size={20} />;
}

function Stat({ value, unit, label, delay }) {
  const shown = useCountUp(value, 1400);
  return (
    <div className="stat reveal" style={{ '--delay': delay }}>
      <span className="value">
        {shown}
        <small>{unit}</small>
      </span>
      <span className="label">{label}</span>
    </div>
  );
}

export default function Results({
  analysis,
  recommendations,
  offline,
  userId,
  audio,
  volume,
  onVolumeChange,
  onNewAnalysis,
  onSessionActiveChange,
}) {
  const [showVolume, setShowVolume] = useState(false);
  const minutes = useCountUp(analysis.maxConcentration, 1800);
  useReveal(analysis);

  return (
    <main className="screen">
      <header className="topbar">
        <div className="brand">
          <BrandMark /> BrainWave
        </div>
        <button
          className="icon-btn"
          onClick={() => setShowVolume(!showVolume)}
          aria-pressed={showVolume}
          aria-label="Tone volume"
          title="Tone volume"
        >
          <VolumeIcon volume={volume} />
        </button>
      </header>

      <div className="results">
        <section className="result-hero">
          <p className="eyebrow fade-up" style={{ '--delay': '0.1s' }}>
            <span className="dot" />
            Your focus window
          </p>
          <h1 className="big-number" aria-label={`${analysis.maxConcentration} minutes`}>
            {minutes}
            <span className="serif">minutes</span>
          </h1>
          <p className="result-sentence fade-up" style={{ '--delay': '0.6s' }}>
            Work in <strong>{analysis.maxConcentration}-minute</strong> blocks, take a{' '}
            <strong>{analysis.recommendedBreak}-minute</strong> break between them, and pause briefly every{' '}
            <strong>{analysis.breakInterval} minutes</strong>.
          </p>

          {offline && (
            <div className="banner fade-up" style={{ '--delay': '0.8s' }}>
              <WifiOff size={20} />
              The server couldn’t be reached, so this was calculated in your browser. Sessions won’t be saved.
            </div>
          )}

          {showVolume && (
            <div className="volume-panel">
              <div className="volume-row">
                <label htmlFor="volume" className="eyebrow">
                  Tone volume
                </label>
                <output htmlFor="volume">{Math.round(volume * 100)}%</output>
              </div>
              <input
                id="volume"
                className="slider"
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                style={{ '--fill': `${volume * 100}%` }}
                onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              />
              <button className="link-btn" style={{ justifySelf: 'start' }} onClick={() => audio.test(analysis.alphaFrequency)}>
                Play a 1.5-second sample
              </button>
            </div>
          )}
        </section>

        <section className="stat-grid" aria-label="Your numbers">
          <Stat value={analysis.maxConcentration} unit="min" label="Focus block" delay="0s" />
          <Stat value={analysis.recommendedBreak} unit="min" label="Recreation break" delay="0.08s" />
          <Stat value={analysis.breakInterval} unit="min" label="Short pause every" delay="0.16s" />
          <Stat value={analysis.alphaFrequency} unit="Hz" label="Beat frequency" delay="0.24s" />
        </section>

        <section className="recs" aria-labelledby="recs-title">
          <div>
            <p className="eyebrow reveal">Recommendations</p>
            <h2 id="recs-title" className="h2 reveal" style={{ '--delay': '0.1s', marginTop: 16 }}>
              Made from <span className="serif">your answers.</span>
            </h2>
          </div>
          <ul className="rec-list">
            {recommendations.map((rec, i) => (
              <li className="rec reveal" style={{ '--delay': `${i * 0.08}s` }} key={rec.category}>
                <span className="cat">{rec.category}</span>
                <p>{rec.message}</p>
              </li>
            ))}
          </ul>
        </section>

        <FocusSession
          analysis={analysis}
          userId={userId}
          offline={offline}
          audio={audio}
          volume={volume}
          onActiveChange={onSessionActiveChange}
        />

        <footer className="results-foot">
          <button className="link-btn" onClick={onNewAnalysis}>
            Start a new analysis
          </button>
          <span className="q-hint">Rule-based estimate · Not medical advice</span>
        </footer>
      </div>
    </main>
  );
}
