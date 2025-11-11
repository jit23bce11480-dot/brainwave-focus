import React, { useState, useEffect, useRef } from 'react';
import { Brain, Clock, Play, Pause, RotateCcw, Activity, User, Zap } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

const BrainwaveFocusSystem = () => {
  const [step, setStep] = useState('welcome');
  const [userData, setUserData] = useState({
    age: '',
    sleepHours: '',
    stressLevel: '5',
    exerciseFrequency: '',
    caffeine: '',
    screenTime: '',
    workType: '',
  });
  const [analysis, setAnalysis] = useState(null);
  const [sessionActive, setSessionActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [concentrationBreaks, setConcentrationBreaks] = useState(0);
  const [alphaWavePlaying, setAlphaWavePlaying] = useState(false);
  
  const audioContextRef = useRef(null);
  const oscillatorRef = useRef(null);
  const gainNodeRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (sessionActive && !isPaused) {
      timerRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [sessionActive, isPaused]);

  const handleInputChange = (field, value) => {
    setUserData(prev => ({ ...prev, [field]: value }));
  };

  const analyzeUser = async () => {
    try {
      const response = await fetch(`${API_URL}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      const data = await response.json();
      setAnalysis(data.analysis);
      setStep('results');
    } catch (error) {
      alert('Analysis failed. Using offline mode.');
      // Fallback offline calculation
      const baseConcentration = 45;
      setAnalysis({
        maxConcentration: baseConcentration,
        recommendedBreak: 15,
        breakInterval: 30,
        alphaFrequency: 10
      });
      setStep('results');
    }
  };

  const startAlphaWave = (frequency = 10) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    const ctx = audioContextRef.current;
    if (oscillatorRef.current) oscillatorRef.current.stop();
    
    oscillatorRef.current = ctx.createOscillator();
    gainNodeRef.current = ctx.createGain();
    
    oscillatorRef.current.type = 'sine';
    oscillatorRef.current.frequency.setValueAtTime(frequency, ctx.currentTime);
    gainNodeRef.current.gain.setValueAtTime(0.1, ctx.currentTime);
    
    oscillatorRef.current.connect(gainNodeRef.current);
    gainNodeRef.current.connect(ctx.destination);
    oscillatorRef.current.start();
    setAlphaWavePlaying(true);
  };

  const stopAlphaWave = () => {
    if (oscillatorRef.current) {
      oscillatorRef.current.stop();
      oscillatorRef.current = null;
    }
    setAlphaWavePlaying(false);
  };

  const startSession = () => {
    setSessionActive(true);
    setElapsedTime(0);
    setConcentrationBreaks(0);
    setIsPaused(false);
  };

  const handleConcentrationLoss = () => {
    setIsPaused(true);
    setConcentrationBreaks(prev => prev + 1);
    startAlphaWave(analysis.alphaFrequency);
  };

  const handleRefocused = () => {
    stopAlphaWave();
    setIsPaused(false);
  };

  const resetSession = () => {
    setSessionActive(false);
    setIsPaused(false);
    setElapsedTime(0);
    setConcentrationBreaks(0);
    stopAlphaWave();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (step === 'welcome') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
          <div className="flex justify-center mb-6">
            <Brain className="w-20 h-20 text-purple-600" />
          </div>
          <h1 className="text-4xl font-bold text-center mb-4 text-gray-800">BrainWave Focus</h1>
          <p className="text-center text-gray-600 mb-8">
            Discover your optimal concentration time and enhance your focus with personalized brainwave analysis
          </p>
          <button
            onClick={() => setStep('questionnaire')}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition duration-200"
          >
            Start Analysis
          </button>
        </div>
      </div>
    );
  }

  if (step === 'questionnaire') {
    const isComplete = userData.age && userData.sleepHours && userData.stressLevel && 
                       userData.exerciseFrequency && userData.caffeine && 
                       userData.screenTime && userData.workType;

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4 py-8">
        <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-2xl p-8">
          <div className="flex items-center mb-6">
            <User className="w-8 h-8 text-purple-600 mr-3" />
            <h2 className="text-3xl font-bold text-gray-800">Personal Analysis</h2>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Age</label>
              <input
                type="number"
                value={userData.age}
                onChange={(e) => handleInputChange('age', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-600 focus:outline-none"
                placeholder="Enter your age"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Average Sleep Hours per Night</label>
              <input
                type="number"
                step="0.5"
                value={userData.sleepHours}
                onChange={(e) => handleInputChange('sleepHours', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-600 focus:outline-none"
                placeholder="e.g., 7.5"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Stress Level (1-10)</label>
              <input
                type="range"
                min="1"
                max="10"
                value={userData.stressLevel}
                onChange={(e) => handleInputChange('stressLevel', e.target.value)}
                className="w-full"
              />
              <div className="text-center text-2xl font-bold text-purple-600">{userData.stressLevel}</div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Exercise Frequency</label>
              <select
                value={userData.exerciseFrequency}
                onChange={(e) => handleInputChange('exerciseFrequency', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-600 focus:outline-none"
              >
                <option value="">Select frequency</option>
                <option value="daily">Daily</option>
                <option value="weekly">3-5 times per week</option>
                <option value="occasionally">1-2 times per week</option>
                <option value="rarely">Rarely</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Caffeine Consumption</label>
              <select
                value={userData.caffeine}
                onChange={(e) => handleInputChange('caffeine', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-600 focus:outline-none"
              >
                <option value="">Select level</option>
                <option value="none">None</option>
                <option value="low">1 cup per day</option>
                <option value="moderate">2-3 cups per day</option>
                <option value="high">4+ cups per day</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Daily Screen Time (hours)</label>
              <input
                type="number"
                step="0.5"
                value={userData.screenTime}
                onChange={(e) => handleInputChange('screenTime', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-600 focus:outline-none"
                placeholder="e.g., 8"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Type of Work</label>
              <select
                value={userData.workType}
                onChange={(e) => handleInputChange('workType', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-600 focus:outline-none"
              >
                <option value="">Select type</option>
                <option value="creative">Creative/Design</option>
                <option value="analytical">Analytical/Technical</option>
                <option value="physical">Physical</option>
                <option value="mixed">Mixed</option>
              </select>
            </div>

            <button
              onClick={analyzeUser}
              disabled={!isComplete}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Analyze My Focus Capacity
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'results' && analysis) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-3xl shadow-2xl p-8 mb-6">
            <div className="flex items-center mb-6">
              <Activity className="w-8 h-8 text-purple-600 mr-3" />
              <h2 className="text-3xl font-bold text-gray-800">Your Focus Profile</h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gradient-to-br from-purple-100 to-purple-200 p-6 rounded-2xl">
                <Clock className="w-8 h-8 text-purple-600 mb-2" />
                <div className="text-sm text-gray-700 mb-1">Max Concentration</div>
                <div className="text-3xl font-bold text-purple-900">{analysis.maxConcentration} min</div>
              </div>

              <div className="bg-gradient-to-br from-blue-100 to-blue-200 p-6 rounded-2xl">
                <Zap className="w-8 h-8 text-blue-600 mb-2" />
                <div className="text-sm text-gray-700 mb-1">Recreation Break</div>
                <div className="text-3xl font-bold text-blue-900">{analysis.recommendedBreak} min</div>
              </div>

              <div className="bg-gradient-to-br from-indigo-100 to-indigo-200 p-6 rounded-2xl">
                <Brain className="w-8 h-8 text-indigo-600 mb-2" />
                <div className="text-sm text-gray-700 mb-1">Break Interval</div>
                <div className="text-3xl font-bold text-indigo-900">{analysis.breakInterval} min</div>
              </div>
            </div>

            {!sessionActive ? (
              <button
                onClick={startSession}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition duration-200 flex items-center justify-center"
              >
                <Play className="w-6 h-6 mr-2" />
                Start Focus Session
              </button>
            ) : (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-6 rounded-2xl text-white">
                  <div className="text-center mb-4">
                    <div className="text-6xl font-bold mb-2">{formatTime(elapsedTime)}</div>
                    <div className="text-sm opacity-90">
                      {isPaused ? '⏸️ Paused - Alpha Wave Active' : '▶️ Session Active'}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold">{concentrationBreaks}</div>
                      <div className="text-xs opacity-90">Focus Resets</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">
                        {Math.max(0, analysis.maxConcentration - Math.floor(elapsedTime / 60))}
                      </div>
                      <div className="text-xs opacity-90">Minutes Remaining</div>
                    </div>
                  </div>
                </div>

                {alphaWavePlaying && (
                  <div className="bg-yellow-50 border-2 border-yellow-400 p-4 rounded-xl">
                    <div className="flex items-center text-yellow-800">
                      <Zap className="w-5 h-5 mr-2 animate-pulse" />
                      <span className="font-semibold">Alpha Wave Playing - Focus on your breath</span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  {!isPaused ? (
                    <button
                      onClick={handleConcentrationLoss}
                      className="bg-orange-500 text-white py-3 rounded-xl font-semibold hover:bg-orange-600 transition flex items-center justify-center"
                    >
                      <Pause className="w-5 h-5 mr-2" />
                      Lost Focus
                    </button>
                  ) : (
                    <button
                      onClick={handleRefocused}
                      className="bg-green-500 text-white py-3 rounded-xl font-semibold hover:bg-green-600 transition flex items-center justify-center"
                    >
                      <Play className="w-5 h-5 mr-2" />
                      Refocused
                    </button>
                  )}

                  <button
                    onClick={resetSession}
                    className="bg-gray-500 text-white py-3 rounded-xl font-semibold hover:bg-gray-600 transition flex items-center justify-center"
                  >
                    <RotateCcw className="w-5 h-5 mr-2" />
                    End Session
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => { setStep('welcome'); resetSession(); }}
            className="w-full bg-white text-purple-600 py-3 rounded-xl font-semibold hover:shadow-lg transition"
          >
            Start New Analysis
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default BrainwaveFocusSystem;