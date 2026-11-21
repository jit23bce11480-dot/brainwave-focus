// Pure logic: no files, no network. Easy to test.
// frontend/src/brainwaveProfile.js is a copy used when the server is unreachable.
// backend/tests/profile.test.js checks that both copies give identical results.

const EXERCISE_BONUS = { daily: 15, weekly: 10, occasionally: 5, rarely: -5 };
const CAFFEINE_EFFECT = { none: 0, low: 5, moderate: 5, high: -10 };
const WORK_TYPES = ['creative', 'analytical', 'physical', 'mixed'];

// Checks the questionnaire. Returns { errors, data } where data has real numbers.
function validateUserData(body) {
  const errors = [];
  const data = {};
  const input = body || {};

  const numberFields = [
    { key: 'age', min: 5, max: 120, integer: true },
    { key: 'sleepHours', min: 0, max: 24 },
    { key: 'stressLevel', min: 1, max: 10, integer: true },
    { key: 'screenTime', min: 0, max: 24 },
  ];
  for (const { key, min, max, integer } of numberFields) {
    const raw = input[key];
    const value = Number(raw);
    if (raw === undefined || raw === null || raw === '' || Number.isNaN(value)) {
      errors.push(`${key} must be a number`);
    } else if (value < min || value > max) {
      errors.push(`${key} must be between ${min} and ${max}`);
    } else if (integer && !Number.isInteger(value)) {
      errors.push(`${key} must be a whole number`);
    } else {
      data[key] = value;
    }
  }

  const choiceFields = [
    { key: 'exerciseFrequency', options: Object.keys(EXERCISE_BONUS) },
    { key: 'caffeine', options: Object.keys(CAFFEINE_EFFECT) },
    { key: 'workType', options: WORK_TYPES },
  ];
  for (const { key, options } of choiceFields) {
    if (!options.includes(input[key])) {
      errors.push(`${key} must be one of: ${options.join(', ')}`);
    } else {
      data[key] = input[key];
    }
  }

  return { errors, data };
}

// Rule-based model: start at 45 minutes, add/subtract points, clamp to 15-90.
function calculateBrainwaveProfile(userData) {
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
    // Beat frequency for the binaural tone: lower (calmer) for higher stress.
    alphaFrequency: stressLevel > 7 ? 8 : stressLevel > 4 ? 10 : 12,
  };
}

function generateRecommendations(userData, analysis) {
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

// One free break per 30 minutes; every extra break costs 10 points.
function calculateEfficiency(totalDurationSeconds, concentrationBreaks) {
  const expectedBreaks = Math.floor(totalDurationSeconds / (30 * 60));
  return Math.max(0, Math.min(100, 100 - (concentrationBreaks - expectedBreaks) * 10));
}

module.exports = {
  validateUserData,
  calculateBrainwaveProfile,
  generateRecommendations,
  calculateEfficiency,
};
