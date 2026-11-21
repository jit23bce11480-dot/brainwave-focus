const fs = require('fs');
const path = require('path');
const {
  validateUserData,
  calculateBrainwaveProfile,
  generateRecommendations,
  calculateEfficiency,
} = require('../brainwaveProfile');

const sample = {
  age: 21,
  sleepHours: 7.5,
  stressLevel: 6,
  exerciseFrequency: 'weekly',
  caffeine: 'moderate',
  screenTime: 9,
  workType: 'analytical',
};

describe('calculateBrainwaveProfile', () => {
  test('worked example: 45 +10 +15 -18 +10 +5 -15 = 52', () => {
    expect(calculateBrainwaveProfile(sample)).toEqual({
      maxConcentration: 52,
      recommendedBreak: 16,
      breakInterval: 31,
      alphaFrequency: 10,
    });
  });

  test('accepts numbers sent as strings (what HTML inputs produce)', () => {
    const asStrings = { ...sample, age: '21', sleepHours: '7.5', stressLevel: '6', screenTime: '9' };
    expect(calculateBrainwaveProfile(asStrings)).toEqual(calculateBrainwaveProfile(sample));
  });

  test('never goes below 15 minutes', () => {
    const worst = { age: 60, sleepHours: 4, stressLevel: 10, exerciseFrequency: 'rarely', caffeine: 'high', screenTime: 12 };
    expect(calculateBrainwaveProfile(worst).maxConcentration).toBe(15);
  });

  test('never goes above 90 minutes', () => {
    const best = { age: 20, sleepHours: 8, stressLevel: 1, exerciseFrequency: 'daily', caffeine: 'low', screenTime: 2 };
    expect(calculateBrainwaveProfile(best).maxConcentration).toBe(90);
  });

  test.each([
    [1, 12], [4, 12], [5, 10], [7, 10], [8, 8], [10, 8],
  ])('stress %i gives a %i Hz beat', (stressLevel, hz) => {
    expect(calculateBrainwaveProfile({ ...sample, stressLevel }).alphaFrequency).toBe(hz);
  });
});

describe('validateUserData', () => {
  test('valid answers pass and come back as numbers', () => {
    const { errors, data } = validateUserData({ ...sample, age: '21' });
    expect(errors).toEqual([]);
    expect(data.age).toBe(21);
  });

  test('rejects missing, non-numeric and out-of-range values', () => {
    const { errors } = validateUserData({ ...sample, age: 'abc', stressLevel: 11, caffeine: 'lots' });
    expect(errors).toEqual([
      'age must be a number',
      'stressLevel must be between 1 and 10',
      'caffeine must be one of: none, low, moderate, high',
    ]);
  });

  test('rejects an empty body', () => {
    expect(validateUserData(undefined).errors).toHaveLength(7);
  });
});

describe('calculateEfficiency', () => {
  test('50 minutes with 3 breaks: 1 free, 2 extra -> 80%', () => {
    expect(calculateEfficiency(50 * 60, 3)).toBe(80);
  });
  test('stays between 0 and 100', () => {
    expect(calculateEfficiency(60, 20)).toBe(0);
    expect(calculateEfficiency(90 * 60, 0)).toBe(100);
  });
});

describe('frontend copy of the formula', () => {
  // The frontend uses `export function`, which plain Node can't load here.
  // We strip the word `export` and run the file's code to get its functions.
  const source = fs
    .readFileSync(path.join(__dirname, '../../frontend/src/brainwaveProfile.js'), 'utf8')
    .replace(/^export /gm, '');
  // eslint-disable-next-line no-new-func
  const frontend = new Function(`${source}\nreturn { calculateBrainwaveProfile, generateRecommendations };`)();

  const cases = [
    sample,
    { age: 60, sleepHours: 4, stressLevel: 10, exerciseFrequency: 'rarely', caffeine: 'high', screenTime: 12 },
    { age: 20, sleepHours: 8, stressLevel: 1, exerciseFrequency: 'daily', caffeine: 'low', screenTime: 2 },
    { age: 35, sleepHours: 6.5, stressLevel: 8, exerciseFrequency: 'occasionally', caffeine: 'none', screenTime: 6 },
  ];

  test.each(cases)('gives the same result as the backend (%o)', (input) => {
    const backendResult = calculateBrainwaveProfile(input);
    expect(frontend.calculateBrainwaveProfile(input)).toEqual(backendResult);
    expect(frontend.generateRecommendations(input, backendResult)).toEqual(
      generateRecommendations(input, backendResult)
    );
  });
});
