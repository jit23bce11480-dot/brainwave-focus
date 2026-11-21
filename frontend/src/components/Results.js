import React, { useState } from 'react';
import { Activity, Clock, Zap, Brain, Sparkles, Volume1, Volume2, VolumeX, WifiOff } from 'lucide-react';
import FocusSession from './FocusSession';

function VolumeIcon({ volume }) {
  if (volume === 0) return <VolumeX className="w-6 h-6" />;
  if (volume < 0.5) return <Volume1 className="w-6 h-6" />;
  return <Volume2 className="w-6 h-6" />;
}

function ProfileCard({ icon: Icon, title, value, note, colors }) {
  return (
    <div className={`bg-gradient-to-br ${colors} p-6 rounded-2xl text-white shadow-xl`}>
      <Icon className="w-10 h-10 mb-3" />
      <div className="text-sm opacity-90 mb-1">{title}</div>
      <div className="text-4xl font-bold">{value} min</div>
      <div className="text-xs opacity-75 mt-2">{note}</div>
    </div>
  );
}

export default function Results({ analysis, recommendations, offline, userId, audio, volume, onVolumeChange, onNewAnalysis }) {
  const [showVolume, setShowVolume] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 p-4 py-8">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-3xl shadow-2xl p-8 mb-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <Activity className="w-10 h-10 text-purple-600 mr-3" />
              <div>
                <h2 className="text-4xl font-bold text-gray-800">Your Focus Profile</h2>
                <p className="text-gray-600">Estimated from your answers with a rule-based model</p>
              </div>
            </div>
            <button
              onClick={() => setShowVolume(!showVolume)}
              className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white p-3 rounded-xl hover:shadow-lg transition"
              title="Volume"
              aria-label="Volume"
            >
              <VolumeIcon volume={volume} />
            </button>
          </div>

          {offline && (
            <div className="bg-amber-50 border-2 border-amber-200 text-amber-800 rounded-2xl p-4 mb-6 flex items-center">
              <WifiOff className="w-5 h-5 mr-2" />
              The server couldn't be reached, so this was calculated in your browser. Sessions won't be saved.
            </div>
          )}

          {showVolume && (
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-2xl mb-6 border-2 border-purple-200">
              <div className="flex items-center justify-between mb-3">
                <label htmlFor="volume" className="text-sm font-bold text-gray-700">Focus tone volume</label>
                <span className="text-2xl font-bold text-purple-600">{Math.round(volume * 100)}%</span>
              </div>
              <input
                id="volume"
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                className="w-full h-3 cursor-pointer"
              />
              <button
                onClick={() => audio.test(analysis.alphaFrequency)}
                className="w-full mt-3 bg-yellow-500 text-white py-2 rounded-xl font-semibold hover:bg-yellow-600 transition"
              >
                Test Current Volume
              </button>
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <ProfileCard icon={Clock} title="Maximum Concentration" value={analysis.maxConcentration} note="Your peak focus duration" colors="from-purple-500 to-pink-500" />
            <ProfileCard icon={Zap} title="Recreation Break" value={analysis.recommendedBreak} note="Recharge your mind" colors="from-blue-500 to-cyan-500" />
            <ProfileCard icon={Brain} title="Break Interval" value={analysis.breakInterval} note="Optimal work segments" colors="from-indigo-500 to-purple-500" />
          </div>

          <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 p-6 rounded-2xl mb-6 border-2 border-purple-200">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center text-lg">
              <Sparkles className="w-6 h-6 mr-2 text-purple-600" /> Personalized Recommendations
            </h3>
            <div className="space-y-3">
              {recommendations.map((rec) => (
                <div key={rec.category} className="flex items-start bg-white p-4 rounded-xl shadow-sm">
                  <span className="text-xs font-bold uppercase tracking-wide text-purple-600 w-28 flex-none mt-1">{rec.category}</span>
                  <p className="text-gray-700">{rec.message}</p>
                </div>
              ))}
            </div>
          </div>

          <FocusSession analysis={analysis} userId={userId} offline={offline} audio={audio} volume={volume} />
        </div>

        <button
          onClick={onNewAnalysis}
          className="w-full bg-white text-purple-600 py-4 rounded-2xl font-bold hover:shadow-xl transition flex items-center justify-center"
        >
          <Brain className="w-6 h-6 mr-2" /> Start New Analysis
        </button>
      </div>
    </div>
  );
}
