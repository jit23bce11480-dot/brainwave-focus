import React, { useRef, useState } from 'react';
import { Play, Pause, Square, Zap, Sparkles, BarChart3 } from 'lucide-react';
import useTimer from '../hooks/useTimer';
import { startSession, recordBreak, endSession, getStats } from '../api';

export const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export default function FocusSession({ analysis, userId, offline, audio, volume }) {
  const [active, setActive] = useState(false);
  const [paused, setPaused] = useState(false);
  const [breaks, setBreaks] = useState(0);
  const [summary, setSummary] = useState(null);
  const [elapsed, resetTimer] = useTimer(active && !paused);

  // Holds a Promise of the server's sessionId (or null when offline / if starting failed).
  // Using a Promise means "Lost Focus" still gets recorded even if it's pressed
  // before the server has answered the start request.
  const sessionIdRef = useRef(Promise.resolve(null));

  const canSave = !offline && Boolean(userId);

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

  if (!active) {
    return (
      <div className="space-y-4">
        {summary && <SessionSummary summary={summary} />}
        <button
          onClick={begin}
          className="w-full bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 text-white py-6 rounded-2xl font-bold text-xl hover:shadow-2xl transform hover:scale-105 transition duration-300 flex items-center justify-center"
        >
          <Play className="w-8 h-8 mr-3" />
          {summary ? 'Start Another Session' : 'Start Your Focus Session'}
          <Sparkles className="w-6 h-6 ml-3" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 p-8 rounded-2xl text-white shadow-2xl">
        <div className="text-center mb-6">
          <div className="text-7xl font-bold mb-3 font-mono tracking-wider">{formatTime(elapsed)}</div>
          <div className="text-lg opacity-90 flex items-center justify-center">
            {paused ? (
              <>
                <Pause className="w-5 h-5 mr-2" /> Paused · Focus tone playing
              </>
            ) : (
              <>
                <Play className="w-5 h-5 mr-2" /> Session active
              </>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-6 text-center bg-white bg-opacity-10 rounded-xl p-4">
          <div>
            <div className="text-4xl font-bold mb-1">{breaks}</div>
            <div className="text-sm opacity-75">Focus Resets</div>
          </div>
          <div>
            <div className="text-4xl font-bold mb-1">
              {Math.max(0, analysis.maxConcentration - Math.floor(elapsed / 60))}
            </div>
            <div className="text-sm opacity-75">Minutes Left</div>
          </div>
        </div>
      </div>

      {audio.playing && (
        <div className="bg-gradient-to-r from-yellow-400 to-orange-400 p-6 rounded-2xl shadow-xl">
          <div className="flex items-center justify-between text-gray-900">
            <div className="flex items-center flex-1">
              <Zap className="w-8 h-8 mr-3" />
              <div>
                <p className="font-bold text-lg">{analysis.alphaFrequency} Hz binaural tone</p>
                <p className="text-sm opacity-75">Breathe slowly. Headphones give the full effect.</p>
              </div>
            </div>
            <div className="text-right ml-4">
              <div className="text-2xl font-bold">{Math.round(volume * 100)}%</div>
              <div className="text-xs opacity-75">Volume</div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {!paused ? (
          <button onClick={lostFocus} className="bg-gradient-to-r from-orange-500 to-red-500 text-white py-4 rounded-xl font-bold hover:shadow-xl transition flex items-center justify-center text-lg">
            <Pause className="w-6 h-6 mr-2" /> Lost Focus
          </button>
        ) : (
          <button onClick={refocused} className="bg-gradient-to-r from-green-500 to-emerald-500 text-white py-4 rounded-xl font-bold hover:shadow-xl transition flex items-center justify-center text-lg">
            <Play className="w-6 h-6 mr-2" /> Refocused
          </button>
        )}
        <button onClick={finish} className="bg-gradient-to-r from-gray-600 to-gray-700 text-white py-4 rounded-xl font-bold hover:shadow-xl transition flex items-center justify-center text-lg">
          <Square className="w-6 h-6 mr-2" /> End Session
        </button>
      </div>
    </div>
  );
}

function SessionSummary({ summary }) {
  const { focusedSeconds, breaks, saved, efficiency, stats } = summary;
  return (
    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-2xl p-6">
      <h3 className="font-bold text-gray-800 mb-4 flex items-center text-lg">
        <BarChart3 className="w-6 h-6 mr-2 text-emerald-600" /> Session complete
      </h3>
      <div className="grid grid-cols-3 gap-4 text-center mb-4">
        <Stat value={formatTime(focusedSeconds)} label="Focused time" />
        <Stat value={breaks} label="Focus resets" />
        <Stat value={efficiency === null ? '–' : `${efficiency}%`} label="Efficiency" />
      </div>
      {saved && stats ? (
        <p className="text-sm text-gray-700">
          All time: <strong>{stats.totalSessions}</strong> {stats.totalSessions === 1 ? 'session' : 'sessions'},{' '}
          <strong>{stats.totalFocusTime}</strong> min in total,
          average efficiency <strong>{stats.averageEfficiency}%</strong>.
        </p>
      ) : (
        <p className="text-sm text-gray-600">Not saved: the server couldn't be reached.</p>
      )}
    </div>
  );
}

function Stat({ value, label }) {
  return (
    <div className="bg-white rounded-xl p-3 shadow-sm">
      <div className="text-2xl font-bold text-gray-800">{value}</div>
      <div className="text-xs text-gray-600">{label}</div>
    </div>
  );
}
