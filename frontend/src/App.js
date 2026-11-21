import React, { useCallback, useEffect, useState } from 'react';
import Landing from './components/Landing';
import Questionnaire from './components/Questionnaire';
import Results from './components/Results';
import WaveField from './components/WaveField';
import Cursor from './components/Cursor';
import useBinauralBeat from './hooks/useBinauralBeat';
import { analyzeProfile } from './api';
import { calculateBrainwaveProfile, generateRecommendations } from './brainwaveProfile';

const EMPTY_FORM = {
  age: '',
  sleepHours: '',
  stressLevel: '5',
  exerciseFrequency: '',
  caffeine: '',
  screenTime: '',
  workType: '',
};

// localStorage can throw (private windows, blocked storage), so always wrap it.
const USER_ID_KEY = 'brainwave-userId';
function loadUserId() {
  try {
    return localStorage.getItem(USER_ID_KEY);
  } catch {
    return null;
  }
}
function saveUserId(id) {
  try {
    localStorage.setItem(USER_ID_KEY, id);
  } catch {
    // not fatal: the user just gets a new ID next visit
  }
}

export default function App() {
  const [step, setStep] = useState('welcome'); // 'welcome' | 'questionnaire' | 'results'
  const [userData, setUserData] = useState(EMPTY_FORM);
  const [analysis, setAnalysis] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [userId, setUserId] = useState(loadUserId);
  const [offline, setOffline] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState([]);
  const [volume, setVolume] = useState(0.5);
  const [sessionActive, setSessionActive] = useState(false);
  const audio = useBinauralBeat(volume);

  // The background reacts to what you're doing.
  const waveMode = audio.playing ? 'tone' : sessionActive ? 'focus' : 'idle';

  // Each new screen starts at the top of the page.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step]);

  const handleInputChange = (field, value) => {
    setUserData((prev) => ({ ...prev, [field]: value }));
  };

  const analyzeUser = async () => {
    setSubmitting(true);
    setErrors([]);
    try {
      const data = await analyzeProfile(userData, userId);
      setAnalysis(data.analysis);
      setRecommendations(data.recommendations);
      setUserId(data.userId);
      saveUserId(data.userId);
      setOffline(false);
      setStep('results');
    } catch (error) {
      if (error.status === 400) {
        // The server rejected the answers: show why and stay on the form.
        setErrors(error.details.length > 0 ? error.details : [error.message]);
      } else {
        // Server down or broken: calculate the same thing in the browser.
        const localAnalysis = calculateBrainwaveProfile(userData);
        setAnalysis(localAnalysis);
        setRecommendations(generateRecommendations(userData, localAnalysis));
        setOffline(true);
        setStep('results');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const startNewAnalysis = () => {
    audio.stop();
    setAnalysis(null);
    setStep('welcome');
  };

  // useCallback keeps this function the same between renders, so FocusSession's effect
  // (which lists it as a dependency) doesn't re-run for no reason.
  const handleSessionActiveChange = useCallback((active) => setSessionActive(active), []);

  let screen = null;
  if (step === 'welcome') {
    screen = <Landing onStart={() => setStep('questionnaire')} onTestAudio={() => audio.test(10)} />;
  } else if (step === 'questionnaire') {
    screen = (
      <Questionnaire
        userData={userData}
        onChange={handleInputChange}
        onSubmit={analyzeUser}
        onBack={() => setStep('welcome')}
        submitting={submitting}
        errors={errors}
      />
    );
  } else if (step === 'results' && analysis) {
    screen = (
      <Results
        analysis={analysis}
        recommendations={recommendations}
        offline={offline}
        userId={userId}
        audio={audio}
        volume={volume}
        onVolumeChange={setVolume}
        onNewAnalysis={startNewAnalysis}
        onSessionActiveChange={handleSessionActiveChange}
      />
    );
  }

  return (
    <>
      <WaveField mode={waveMode} />
      {/* key={step} gives each screen a fresh start, so its entrance animation plays */}
      <div className={`app ${sessionActive ? 'is-behind' : ''}`} key={step}>
        {screen}
      </div>
      <div className="grain" aria-hidden="true" />
      <Cursor />
    </>
  );
}
