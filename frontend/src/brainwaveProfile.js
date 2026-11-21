// Copy of the scoring rules in backend/brainwaveProfile.js, used only when the server
// can't be reached. backend/tests/profile.test.js checks that both copies match,
// so if you change one, change the other and run `npm test` in backend/.

const EXERCISE_BONUS = { daily: 15, weekly: 10, occasionally: 5, rarely: -5 };
const CAFFEINE_EFFECT = { none: 0, low: 5, moderate: 5, high: -10 };

export function calculateBrainwaveProfile(userData) {
  const age = Number(userData.age);
  const sleepHours = Number(userData.sleepHours);
  const stressLevel = Number(userData.stressLevel);
  const screenTime = Number(userData.screenTime);
  const { exerciseFrequency, caffeine } = userData;

  let baseConcentration = 45;

  if (age < 25) baseConcentration += 10;
  else if (age > 50) baseConcentration -= 10;

  if (sleepHours >= 7 && sleepHours <= 9) baseConcentration += 15;
  else if (sleepHours < 6) baseConcentration -= 20;

  baseConcentration -= stressLevel * 3;
  baseConcentration += EXERCISE_BONUS[exerciseFrequency] || 0;
  baseConcentration += CAFFEINE_EFFECT[caffeine] || 0;

  if (screenTime > 8) baseConcentration -= 15;
  else if (screenTime < 4) baseConcentration += 10;

  baseConcentration = Math.max(15, Math.min(90, baseConcentration));

  return {
    maxConcentration: baseConcentration,
    recommendedBreak: Math.round(baseConcentration * 0.3),
    breakInterval: Math.round(baseConcentration * 0.6),
    alphaFrequency: stressLevel > 7 ? 8 : stressLevel > 4 ? 10 : 12,
  };
}

export function generateRecommendations(userData, analysis) {
  const recommendations = [];

  if (Number(userData.sleepHours) < 7) {
    recommendations.push({
      category: 'Sleep',
      priority: 'high',
      message: 'Aim for 7-9 hours of sleep. In this model it is one of the biggest factors.',
    });
  }

  if (Number(userData.stressLevel) > 7) {
    recommendations.push({
      category: 'Stress',
      priority: 'high',
      message: 'Try a few minutes of slow breathing or meditation before you start.',
    });
  }

  recommendations.push({
    category: 'Work Pattern',
    priority: 'high',
    message: `Work in ${analysis.maxConcentration} min blocks with ${analysis.recommendedBreak} min breaks`,
  });

  recommendations.push({
    category: 'Focus Tone',
    priority: 'medium',
    message: `When you lose focus, use the ${analysis.alphaFrequency} Hz binaural tone (headphones work best)`,
  });

  return recommendations;
}
