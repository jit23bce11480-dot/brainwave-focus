import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Play, Pause, Square, Headphones, ArrowRight } from 'lucide-react';
import MagneticButton from './MagneticButton';
import BrandMark from './BrandMark';
import useTimer from '../hooks/useTimer';
import { startSession, recordBreak, endSession, getStats } from '../api';

export const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export default function FocusSession({ analysis, userId, offline, audio, volume, onActiveChange }) {
  const [active, setActive] = useState(false);
  const [paused, setPaused] = useState(false);
  const [breaks, setBreaks] = useState(0);
  const [summary, setSummary] = useState(null);
  const [elapsed, resetTimer] = useTimer(active && !paused);

  // Holds a Promise of the server's sessionId (or null when offline / if starting failed).
  // Using a Promise means "Lost focus" still gets recorded even if it's pressed
  // before the server has answered the start request.
  const sessionIdRef = useRef(Promise.resolve(null));
  const canSave = !offline && Boolean(userId);

  // Tell the parent (App) when a session starts or stops, so the background can calm down.
  useEffect(() => {
    if (onActiveChange) onActiveChange(active);
  }, [active, onActiveChange]);

  // While the full-screen session is open, stop the page behind it from scrolling.
  useEffect(() => {
    if (!active) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [active]);

  const begin = () => {
    audio.unlock(); // called from a click, so the browser lets us play sound later
    resetTimer();
    setBreaks(0);
    setPaused(false);
    setSummary(null);
    setActive(true);
    sessionIdRef.current = canSave
      ? startSession(userId).then((r) => r.sessionId).catch(() => null)
      : Promise.resolve(null);
  };

  const lostFocus = () => {
    setPaused(true);
    setBreaks((prev) => prev + 1);
    audio.start(analysis.alphaFrequency);
    sessionIdRef.current.then((id) => id && recordBreak(id).catch(() => {}));
  };

  const refocused = () => {
    audio.stop();
    setPaused(false);
  };

  const finish = async () => {
    audio.stop();
    setActive(false);
    setPaused(false);
    const local = { focusedSeconds: elapsed, breaks, saved: false, efficiency: null, stats: null };
    setSummary(local);

    const sessionId = await sessionIdRef.current;
    if (!sessionId) return;
    try {
      const { session } = await endSession(sessionId);
      const { stats } = await getStats(userId);
      setSummary({ ...local, saved: true, efficiency: session.efficiency, stats });
    } catch {
      // keep the local summary; it already says "not saved"
    }
  };

  const minutesLeft = Math.max(0, analysis.maxConcentration - Math.floor(elapsed / 60));
  const progress = Math.min(1, elapsed / (analysis.maxConcentration * 60));

  return (
    <section className="session-launch" aria-labelledby="session-title">
      <p className="eyebrow reveal">Focus session</p>
      <h2 id="session-title" className="h2 reveal" style={{ '--delay': '0.1s' }}>
        {summary ? 'Nice work.' : 'Ready to focus?'}{' '}
        <span className="serif">{summary ? 'Go again?' : `${analysis.maxConcentration} minutes.`}</span>
      </h2>

      {summary && <SessionSummary summary={summary} />}

      <div className="reveal" style={{ '--delay': '0.2s' }}>
        <MagneticButton className="btn-primary btn-lg" onClick={begin}>
          <Play size={20} /> {summary ? 'Start another session' : 'Start focus session'}
          <ArrowRight className="arrow" size={20} />
        </MagneticButton>
      </div>

      {/* createPortal draws the overlay directly inside <body>, outside the animated page,
          so position: fixed really covers the whole window. */}
      {active && createPortal(
        <div
          className={`focus-overlay ${paused ? 'is-paused' : ''}`}
          role="dialog"
          aria-modal="true"
          aria-label="Focus session"
        >
          <div className="focus-top">
            <div className="brand">
              <BrandMark /> BrainWave
            </div>
            {audio.playing ? (
              <span className="tone-chip">
                <Headphones size={16} /> {analysis.alphaFrequency} Hz beat · {Math.round(volume * 100)}%
              </span>
            ) : (
              <span className="tone-chip">Focus block · {analysis.maxConcentration} min</span>
            )}
          </div>

          <div className="focus-center">
            {paused && <div className="breath" aria-hidden="true" />}
            {paused ? (
              <div className="breath-words" aria-live="polite">
                <span className="in">Breathe in</span>
                <span className="out">Breathe out</span>
              </div>
            ) : (
              <p className="focus-state">You’re in it. Stay with it.</p>
            )}

            <div className="focus-timer" role="timer" aria-label={`Focused for ${formatTime(elapsed)}`}>
              {formatTime(elapsed)}
            </div>

            <div className="focus-progress" aria-hidden="true">
              <span style={{ transform: `scaleX(${progress})` }} />
            </div>

            <div className="focus-stats">
              <span>
                <b>{minutesLeft}</b>minutes left
              </span>
              <span>
                <b>{breaks}</b>focus resets
              </span>
            </div>
          </div>

          <div className="focus-actions">
            {paused ? (
              <MagneticButton className="btn-primary btn-lg" onClick={refocused}>
                <Play size={20} /> I’m refocused
              </MagneticButton>
            ) : (
              <MagneticButton className="btn-primary btn-lg" onClick={lostFocus}>
                <Pause size={20} /> I lost focus
              </MagneticButton>
            )}
            <MagneticButton className="btn-ghost btn-lg" onClick={finish} strength={0.2}>
              <Square size={18} /> End session
            </MagneticButton>
          </div>
        </div>,
        document.body
      )}
    </section>
  );
}

function SessionSummary({ summary }) {
  const { focusedSeconds, breaks, saved, efficiency, stats } = summary;
  return (
    <div className="summary screen">
      <p className="eyebrow">Session complete</p>
      <div className="summary-grid">
        <div>
          <b>{formatTime(focusedSeconds)}</b>
          <span>Focused time</span>
        </div>
        <div>
          <b>{breaks}</b>
          <span>Focus resets</span>
        </div>
        <div>
          <b>{efficiency === null ? '–' : `${efficiency}%`}</b>
          <span>Efficiency</span>
        </div>
      </div>
      {saved && stats ? (
        <p>
          All time: <strong>{stats.totalSessions}</strong> {stats.totalSessions === 1 ? 'session' : 'sessions'},{' '}
          <strong>{stats.totalFocusTime}</strong> min in total, average efficiency{' '}
          <strong>{stats.averageEfficiency}%</strong>.
        </p>
      ) : (
        <p>Not saved: the server couldn’t be reached.</p>
      )}
    </div>
  );
}
