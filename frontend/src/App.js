import React, { useState, useEffect, useRef } from 'react';
import { Brain, Clock, Play, Pause, RotateCcw, Activity, User, Zap, Sparkles, TrendingUp, Target, Coffee, Moon, Dumbbell, Monitor } from 'lucide-react';

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
      const age = parseInt(userData.age);
      const sleep = parseFloat(userData.sleepHours);
      const stress = parseInt(userData.stressLevel);
      let baseConcentration = 45;
      
      if (age < 25) baseConcentration += 10;
      else if (age > 50) baseConcentration -= 10;
      if (sleep >= 7 && sleep <= 9) baseConcentration += 15;
      else if (sleep < 6) baseConcentration -= 20;
      baseConcentration -= stress * 3;
      baseConcentration = Math.max(15, Math.min(90, baseConcentration));
      
      setAnalysis({
        maxConcentration: baseConcentration,
        recommendedBreak: Math.round(baseConcentration * 0.3),
        breakInterval: Math.round(baseConcentration * 0.6),
        alphaFrequency: stress > 7 ? 8 : 10
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
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{animationDelay: '2s'}}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{animationDelay: '4s'}}></div>
        </div>

        <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
          <div className="bg-white bg-opacity-10 backdrop-blur-xl rounded-3xl shadow-2xl p-8 md:p-12 max-w-2xl w-full border border-white border-opacity-20">
            <div className="flex justify-center mb-8">
              <div className="relative">
                <Brain className="w-24 h-24 text-white animate-pulse" />
                <Sparkles className="w-8 h-8 text-yellow-300 absolute -top-2 -right-2 animate-bounce" />
              </div>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold text-center mb-4 text-white">
              BrainWave Focus
            </h1>
            
            <p className="text-center text-purple-100 text-lg mb-8 leading-relaxed">
              Unlock your cognitive potential with AI-powered brainwave analysis. 
              Discover your optimal concentration time and master the art of deep focus.
            </p>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="text-center p-4 bg-white bg-opacity-10 rounded-2xl backdrop-blur-sm">
                <TrendingUp className="w-8 h-8 text-green-300 mx-auto mb-2" />
                <p className="text-white text-sm font-semibold">Boost Focus</p>
              </div>
              <div className="text-center p-4 bg-white bg-opacity-10 rounded-2xl backdrop-blur-sm">
                <Target className="w-8 h-8 text-blue-300 mx-auto mb-2" />
                <p className="text-white text-sm font-semibold">Track Progress</p>
              </div>
              <div className="text-center p-4 bg-white bg-opacity-10 rounded-2xl backdrop-blur-sm">
                <Zap className="w-8 h-8 text-yellow-300 mx-auto mb-2" />
                <p className="text-white text-sm font-semibold">Alpha Waves</p>
              </div>
            </div>

            <button
              onClick={() => setStep('questionnaire')}
              className="w-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white py-5 rounded-2xl font-bold text-lg hover:shadow-2xl transform hover:scale-105 transition duration-300 flex items-center justify-center group"
            >
              <Sparkles className="w-6 h-6 mr-2 group-hover:animate-spin" />
              Start Your Analysis
              <Sparkles className="w-6 h-6 ml-2 group-hover:animate-spin" />
            </button>

            <p className="text-center text-purple-200 text-sm mt-6">
              ✨ Scientifically designed • 🔒 Privacy focused • 🆓 100% Free
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'questionnaire') {
    const isComplete = userData.age && userData.sleepHours && userData.stressLevel && 
                       userData.exerciseFrequency && userData.caffeine && 
                       userData.screenTime && userData.workType;

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 p-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-10">
            <div className="flex items-center mb-8">
              <User className="w-10 h-10 text-indigo-600 mr-3" />
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-800">Personal Analysis</h2>
                <p className="text-gray-600 text-sm">Help us understand your lifestyle</p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-2xl">
                <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center">
                  <User className="w-5 h-5 mr-2 text-purple-600" />
                  How old are you?
                </label>
                <input
                  type="number"
                  value={userData.age}
                  onChange={(e) => handleInputChange('age', e.target.value)}
                  className="w-full px-6 py-4 border-2 border-purple-200 rounded-xl focus:border-purple-600 focus:outline-none text-lg transition"
                  placeholder="Enter your age"
                />
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl">
                <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center">
                  <Moon className="w-5 h-5 mr-2 text-blue-600" />
                  Average sleep per night (hours)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={userData.sleepHours}
                  onChange={(e) => handleInputChange('sleepHours', e.target.value)}
                  className="w-full px-6 py-4 border-2 border-blue-200 rounded-xl focus:border-blue-600 focus:outline-none text-lg transition"
                  placeholder="e.g., 7.5"
                />
              </div>

              <div className="bg-gradient-to-r from-red-50 to-orange-50 p-6 rounded-2xl">
                <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center">
                  <Activity className="w-5 h-5 mr-2 text-red-600" />
                  Current stress level
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={userData.stressLevel}
                  onChange={(e) => handleInputChange('stressLevel', e.target.value)}
                  className="w-full h-3 bg-gradient-to-r from-green-400 via-yellow-400 to-red-500 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-600 mt-2">
                  <span>😌 Relaxed</span>
                  <span className="text-2xl font-bold text-red-600">{userData.stressLevel}</span>
                  <span>😰 Stressed</span>
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-2xl">
                <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center">
                  <Dumbbell className="w-5 h-5 mr-2 text-green-600" />
                  How often do you exercise?
                </label>
                <select
                  value={userData.exerciseFrequency}
                  onChange={(e) => handleInputChange('exerciseFrequency', e.target.value)}
                  className="w-full px-6 py-4 border-2 border-green-200 rounded-xl focus:border-green-600 focus:outline-none text-lg transition appearance-none bg-white cursor-pointer"
                >
                  <option value="">Select frequency</option>
                  <option value="daily">💪 Daily (You're a champion!)</option>
                  <option value="weekly">🏃 3-5 times per week</option>
                  <option value="occasionally">🚶 1-2 times per week</option>
                  <option value="rarely">🛋️ Rarely</option>
                </select>
              </div>

              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 p-6 rounded-2xl">
                <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center">
                  <Coffee className="w-5 h-5 mr-2 text-amber-700" />
                  Daily caffeine intake
                </label>
                <select
                  value={userData.caffeine}
                  onChange={(e) => handleInputChange('caffeine', e.target.value)}
                  className="w-full px-6 py-4 border-2 border-amber-200 rounded-xl focus:border-amber-600 focus:outline-none text-lg transition appearance-none bg-white cursor-pointer"
                >
                  <option value="">Select level</option>
                  <option value="none">☕ None</option>
                  <option value="low">☕ 1 cup per day</option>
                  <option value="moderate">☕☕ 2-3 cups per day</option>
                  <option value="high">☕☕☕ 4+ cups per day</option>
                </select>
              </div>

              <div className="bg-gradient-to-r from-cyan-50 to-sky-50 p-6 rounded-2xl">
                <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center">
                  <Monitor className="w-5 h-5 mr-2 text-cyan-600" />
                  Daily screen time (hours)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={userData.screenTime}
                  onChange={(e) => handleInputChange('screenTime', e.target.value)}
                  className="w-full px-6 py-4 border-2 border-cyan-200 rounded-xl focus:border-cyan-600 focus:outline-none text-lg transition"
                  placeholder="e.g., 8"
                />
              </div>

              <div className="bg-gradient-to-r from-violet-50 to-purple-50 p-6 rounded-2xl">
                <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center">
                  <Brain className="w-5 h-5 mr-2 text-violet-600" />
                  Type of work you do
                </label>
                <select
                  value={userData.workType}
                  onChange={(e) => handleInputChange('workType', e.target.value)}
                  className="w-full px-6 py-4 border-2 border-violet-200 rounded-xl focus:border-violet-600 focus:outline-none text-lg transition appearance-none bg-white cursor-pointer"
                >
                  <option value="">Select type</option>
                  <option value="creative">🎨 Creative/Design</option>
                  <option value="analytical">💻 Analytical/Technical</option>
                  <option value="physical">🏗️ Physical</option>
                  <option value="mixed">🔄 Mixed</option>
                </select>
              </div>

              <button
                onClick={analyzeUser}
                disabled={!isComplete}
                className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white py-5 rounded-2xl font-bold text-xl hover:shadow-2xl transform hover:scale-105 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
              >
                {isComplete ? (
                  <>
                    <Sparkles className="w-6 h-6 mr-2 animate-spin" />
                    Analyze My Focus Capacity
                    <Sparkles className="w-6 h-6 ml-2 animate-spin" />
                  </>
                ) : (
                  '⚠️ Please complete all fields'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'results' && analysis) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 p-4 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-3xl shadow-2xl p-8 mb-6 relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full filter blur-3xl opacity-20"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-blue-200 to-indigo-200 rounded-full filter blur-3xl opacity-20"></div>

            <div className="relative z-10">
              <div className="flex items-center mb-8">
                <Activity className="w-10 h-10 text-purple-600 mr-3 animate-pulse" />
                <div>
                  <h2 className="text-4xl font-bold text-gray-800">Your Focus Profile</h2>
                  <p className="text-gray-600">Personalized insights based on your lifestyle</p>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-6 rounded-2xl text-white transform hover:scale-105 transition duration-300 shadow-xl">
                  <Clock className="w-10 h-10 mb-3" />
                  <div className="text-sm opacity-90 mb-1">Maximum Concentration</div>
                  <div className="text-4xl font-bold">{analysis.maxConcentration} min</div>
                  <div className="text-xs opacity-75 mt-2">Your peak focus duration</div>
                </div>

                <div className="bg-gradient-to-br from-blue-500 to-cyan-500 p-6 rounded-2xl text-white transform hover:scale-105 transition duration-300 shadow-xl">
                  <Zap className="w-10 h-10 mb-3" />
                  <div className="text-sm opacity-90 mb-1">Recreation Break</div>
                  <div className="text-4xl font-bold">{analysis.recommendedBreak} min</div>
                  <div className="text-xs opacity-75 mt-2">Recharge your mind</div>
                </div>

                <div className="bg-gradient-to-br from-indigo-500 to-purple-500 p-6 rounded-2xl text-white transform hover:scale-105 transition duration-300 shadow-xl">
                  <Brain className="w-10 h-10 mb-3" />
                  <div className="text-sm opacity-90 mb-1">Break Interval</div>
                  <div className="text-4xl font-bold">{analysis.breakInterval} min</div>
                  <div className="text-xs opacity-75 mt-2">Optimal work segments</div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 p-6 rounded-2xl mb-6 border-2 border-purple-200">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center text-lg">
                  <Sparkles className="w-6 h-6 mr-2 text-purple-600" />
                  Personalized Recommendations
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start bg-white p-4 rounded-xl shadow-sm">
                    <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 mr-3"></div>
                    <p className="text-gray-700">Work in focused sessions of <strong>{analysis.maxConcentration} minutes</strong> maximum</p>
                  </div>
                  <div className="flex items-start bg-white p-4 rounded-xl shadow-sm">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3"></div>
                    <p className="text-gray-700">Take short breaks every <strong>{analysis.breakInterval} minutes</strong></p>
                  </div>
                  <div className="flex items-start bg-white p-4 rounded-xl shadow-sm">
                    <div className="w-2 h-2 bg-pink-600 rounded-full mt-2 mr-3"></div>
                    <p className="text-gray-700">Schedule <strong>{analysis.recommendedBreak} minute</strong> recreation breaks between sessions</p>
                  </div>
                  <div className="flex items-start bg-white p-4 rounded-xl shadow-sm">
                    <div className="w-2 h-2 bg-indigo-600 rounded-full mt-2 mr-3"></div>
                    <p className="text-gray-700">Use <strong>{analysis.alphaFrequency} Hz</strong> alpha wave therapy when losing focus</p>
                  </div>
                </div>
              </div>

              {!sessionActive ? (
                <button
                  onClick={startSession}
                  className="w-full bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 text-white py-6 rounded-2xl font-bold text-xl hover:shadow-2xl transform hover:scale-105 transition duration-300 flex items-center justify-center group"
                >
                  <Play className="w-8 h-8 mr-3 group-hover:animate-bounce" />
                  Start Your Focus Session
                  <Sparkles className="w-6 h-6 ml-3 group-hover:animate-spin" />
                </button>
              ) : (
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 p-8 rounded-2xl text-white shadow-2xl">
                    <div className="text-center mb-6">
                      <div className="text-7xl font-bold mb-3 font-mono tracking-wider">{formatTime(elapsedTime)}</div>
                      <div className="text-lg opacity-90 flex items-center justify-center">
                        {isPaused ? (
                          <>
                            <Pause className="w-5 h-5 mr-2 animate-pulse" />
                            Paused - Alpha Wave Active
                          </>
                        ) : (
                          <>
                            <Play className="w-5 h-5 mr-2 animate-pulse" />
                            Session Active
                          </>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6 text-center bg-white bg-opacity-10 rounded-xl p-4 backdrop-blur-sm">
                      <div>
                        <div className="text-4xl font-bold mb-1">{concentrationBreaks}</div>
                        <div className="text-sm opacity-75">Focus Resets</div>
                      </div>
                      <div>
                        <div className="text-4xl font-bold mb-1">
                          {Math.max(0, analysis.maxConcentration - Math.floor(elapsedTime / 60))}
                        </div>
                        <div className="text-sm opacity-75">Minutes Left</div>
                      </div>
                    </div>
                  </div>

                  {alphaWavePlaying && (
                    <div className="bg-gradient-to-r from-yellow-400 to-orange-400 p-6 rounded-2xl shadow-xl animate-pulse">
                      <div className="flex items-center text-gray-900">
                        <Zap className="w-8 h-8 mr-3 animate-bounce" />
                        <div>
                          <p className="font-bold text-lg">Alpha Wave Therapy Active</p>
                          <p className="text-sm opacity-75">Focus on your breath and let distractions fade away</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    {!isPaused ? (
                      <button
                        onClick={handleConcentrationLoss}
                        className="bg-gradient-to-r from-orange-500 to-red-500 text-white py-4 rounded-xl font-bold hover:shadow-xl transition flex items-center justify-center text-lg"
                      >
                        <Pause className="w-6 h-6 mr-2" />
                        Lost Focus
                      </button>
                    ) : (
                      <button
                        onClick={handleRefocused}
                        className="bg-gradient-to-r from-green-500 to-emerald-500 text-white py-4 rounded-xl font-bold hover:shadow-xl transition flex items-center justify-center text-lg"
                      >
                        <Play className="w-6 h-6 mr-2" />
                        Refocused
                      </button>
                    )}

                    <button
                      onClick={resetSession}
                      className="bg-gradient-to-r from-gray-600 to-gray-700 text-white py-4 rounded-xl font-bold hover:shadow-xl transition flex items-center justify-center text-lg"
                    >
                      <RotateCcw className="w-6 h-6 mr-2" />
                      End Session
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => { setStep('welcome'); resetSession(); }}
            className="w-full bg-white text-purple-600 py-4 rounded-2xl font-bold hover:shadow-xl transition transform hover:scale-105 flex items-center justify-center"
          >
            <Brain className="w-6 h-6 mr-2" />
            Start New Analysis
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default BrainwaveFocusSystem;
