import React from 'react';
import { Brain, Sparkles, TrendingUp, Target, Zap, Headphones } from 'lucide-react';

export default function Welcome({ onStart, onTestAudio }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="bg-white bg-opacity-10 backdrop-blur-xl rounded-3xl shadow-2xl p-8 md:p-12 max-w-2xl w-full border border-white border-opacity-20">
          <div className="flex justify-center mb-8">
            <div className="relative">
              <Brain className="w-24 h-24 text-white animate-pulse" />
              <Sparkles className="w-8 h-8 text-yellow-300 absolute -top-2 -right-2 animate-bounce" />
            </div>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-center mb-4 text-white">BrainWave Focus</h1>

          <p className="text-center text-purple-100 text-lg mb-8 leading-relaxed">
            Answer seven quick questions about your lifestyle to get your ideal focus-session length.
            Then focus with a timer and a calming binaural tone for when your attention drifts.
          </p>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="text-center p-4 bg-white bg-opacity-10 rounded-2xl">
              <TrendingUp className="w-8 h-8 text-green-300 mx-auto mb-2" />
              <p className="text-white text-sm font-semibold">Focus Plan</p>
            </div>
            <div className="text-center p-4 bg-white bg-opacity-10 rounded-2xl">
              <Target className="w-8 h-8 text-blue-300 mx-auto mb-2" />
              <p className="text-white text-sm font-semibold">Track Sessions</p>
            </div>
            <div className="text-center p-4 bg-white bg-opacity-10 rounded-2xl">
              <Zap className="w-8 h-8 text-yellow-300 mx-auto mb-2" />
              <p className="text-white text-sm font-semibold">Binaural Tone</p>
            </div>
          </div>

          <button
            onClick={onTestAudio}
            className="w-full mb-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-3 rounded-2xl font-semibold hover:shadow-lg transition flex items-center justify-center"
          >
            <Headphones className="w-5 h-5 mr-2" />
            Test Audio (headphones recommended)
          </button>

          <button
            onClick={onStart}
            className="w-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white py-5 rounded-2xl font-bold text-lg hover:shadow-2xl transform hover:scale-105 transition duration-300 flex items-center justify-center"
          >
            Start Your Analysis
          </button>

          <p className="text-center text-purple-200 text-sm mt-6">
            Rule-based estimate · Not medical advice · Free
          </p>
        </div>
      </div>
    </div>
  );
}
