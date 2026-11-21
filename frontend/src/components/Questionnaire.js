import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import MagneticButton from './MagneticButton';
import BrandMark from './BrandMark';

// The questions, written as data. The screen below shows one at a time.
const QUESTIONS = [
  { field: 'age', title: 'How old are you?', type: 'number', min: 5, max: 120, step: 1, placeholder: '21', suffix: 'years' },
  { field: 'sleepHours', title: 'How many hours do you sleep a night?', type: 'number', min: 0, max: 24, step: 0.5, placeholder: '7.5', suffix: 'hours' },
  { field: 'stressLevel', title: 'How stressed do you feel right now?', type: 'range', min: 1, max: 10, low: 'Completely calm', high: 'Overwhelmed' },
  {
    field: 'exerciseFrequency',
    title: 'How often do you exercise?',
    type: 'choice',
    options: [
      ['daily', 'Every day'],
      ['weekly', '3–5 times a week'],
      ['occasionally', '1–2 times a week'],
      ['rarely', 'Rarely'],
    ],
  },
  {
    field: 'caffeine',
    title: 'How much caffeine do you have a day?',
    type: 'choice',
    options: [
      ['none', 'None'],
      ['low', '1 cup'],
      ['moderate', '2–3 cups'],
      ['high', '4 or more'],
    ],
  },
  { field: 'screenTime', title: 'How many hours of screen time a day?', type: 'number', min: 0, max: 24, step: 0.5, placeholder: '8', suffix: 'hours' },
  {
    field: 'workType',
    title: 'What kind of work do you do?',
    type: 'choice',
    options: [
      ['creative', 'Creative or design'],
      ['analytical', 'Analytical or technical'],
      ['physical', 'Physical'],
      ['mixed', 'A mix'],
    ],
  },
];

// Is this answer usable? Numbers must be inside their range; choices must be picked.
function isAnswered(question, value) {
  if (value === '' || value === undefined) return false;
  if (question.type === 'number') {
    const n = Number(value);
    return !Number.isNaN(n) && n >= question.min && n <= question.max;
  }
  return true;
}

export default function Questionnaire({ userData, onChange, onSubmit, onBack, submitting, errors }) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState('forward');
  const inputRef = useRef(null);
  const advanceTimer = useRef(null);

  const question = QUESTIONS[index];
  const value = userData[question.field];
  const answered = isAnswered(question, value);
  const isLast = index === QUESTIONS.length - 1;
  const allAnswered = QUESTIONS.every((q) => isAnswered(q, userData[q.field]));

  const goTo = (next) => {
    clearTimeout(advanceTimer.current);
    setDirection(next > index ? 'forward' : 'back');
    setIndex(next);
  };

  const next = () => {
    if (!answered) return;
    if (isLast) {
      if (allAnswered && !submitting) onSubmit();
    } else {
      goTo(index + 1);
    }
  };

  const back = () => (index === 0 ? onBack() : goTo(index - 1));

  // Focus the text box whenever a number question appears, so you can just type.
  useEffect(() => {
    if (question.type === 'number' && inputRef.current) inputRef.current.focus({ preventScroll: true });
  }, [index, question.type]);

  useEffect(() => () => clearTimeout(advanceTimer.current), []);

  // Keyboard: Enter = next; on choice questions, keys 1-4 pick an option.
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'BUTTON') return; // let Enter press the focused button normally
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        next();
      } else if (question.type === 'choice' && /^[1-9]$/.test(e.key)) {
        const option = question.options[Number(e.key) - 1];
        if (option) choose(option[0]);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // Picking an option saves it and moves on after a short pause, so you see your choice light up.
  const choose = (optionValue) => {
    onChange(question.field, optionValue);
    if (!isLast) {
      clearTimeout(advanceTimer.current);
      advanceTimer.current = setTimeout(() => {
        setDirection('forward');
        setIndex((i) => Math.min(i + 1, QUESTIONS.length - 1));
      }, 380);
    }
  };

  // Server errors start with the field name ("age must be..."), so we can jump to that question.
  const jumpToError = (message) => {
    const target = QUESTIONS.findIndex((q) => message.startsWith(q.field));
    if (target >= 0) goTo(target);
  };

  const outOfRange = question.type === 'number' && value !== '' && !answered;

  return (
    <main className="screen">
      <header className="topbar">
        <div className="brand">
          <BrandMark /> BrainWave
        </div>
        <button className="link-btn" onClick={onBack}>
          Exit
        </button>
      </header>

      <div className="quiz">
        <div className="quiz-progress" aria-label={`Question ${index + 1} of ${QUESTIONS.length}`}>
          <span>{String(index + 1).padStart(2, '0')}</span>
          <div className="quiz-bar">
            <span style={{ transform: `scaleX(${(index + 1) / QUESTIONS.length})` }} />
          </div>
          <span>{String(QUESTIONS.length).padStart(2, '0')}</span>
        </div>

        <form
          className="quiz-body"
          onSubmit={(e) => {
            e.preventDefault(); // stop the browser reloading the page
            next();
          }}
        >
          {/* key={question.field} makes React treat each question as new, so the slide-in replays. */}
          <div key={question.field} className={`question ${direction === 'back' ? 'from-left' : ''}`}>
            <h1 className="q-title" id="q-title">
              {question.title}
            </h1>

            {question.type === 'number' && (
              <div>
                <div className="q-field">
                  <input
                    ref={inputRef}
                    id={question.field}
                    className="q-input"
                    type="number"
                    inputMode="decimal"
                    min={question.min}
                    max={question.max}
                    step={question.step}
                    placeholder={question.placeholder}
                    value={value}
                    aria-labelledby="q-title"
                    onChange={(e) => onChange(question.field, e.target.value)}
                  />
                  <span className="q-suffix">{question.suffix}</span>
                </div>
                <p className={`q-hint ${outOfRange ? 'is-error' : ''}`} style={{ marginTop: 12 }}>
                  {outOfRange
                    ? `Enter a number between ${question.min} and ${question.max}.`
                    : `Between ${question.min} and ${question.max}.`}
                </p>
              </div>
            )}

            {question.type === 'range' && (
              <div className="q-range">
                <div className="q-range-value" aria-hidden="true">
                  {value}
                  <small>out of 10</small>
                </div>
                <input
                  id={question.field}
                  className="slider"
                  type="range"
                  min={question.min}
                  max={question.max}
                  value={value}
                  aria-labelledby="q-title"
                  style={{ '--fill': `${((value - 1) / 9) * 100}%` }}
                  onChange={(e) => onChange(question.field, e.target.value)}
                />
                <div className="q-range-ends">
                  <span>{question.low}</span>
                  <span>{question.high}</span>
                </div>
              </div>
            )}

            {question.type === 'choice' && (
              <div className="q-options" role="radiogroup" aria-labelledby="q-title">
                {question.options.map(([optionValue, label], i) => (
                  <button
                    type="button"
                    key={optionValue}
                    role="radio"
                    aria-checked={value === optionValue}
                    className="q-option"
                    onClick={() => choose(optionValue)}
                  >
                    <span className="key">{i + 1}</span>
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {errors.length > 0 && (
            <div className="error-box" role="alert">
              <strong>Please fix these answers:</strong>
              <ul>
                {errors.map((message) => (
                  <li key={message}>
                    <span>{message}</span>
                    <button type="button" onClick={() => jumpToError(message)}>
                      Fix
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="quiz-nav">
            <button type="button" className="link-btn" onClick={back}>
              <ArrowLeft size={16} style={{ verticalAlign: '-3px', marginRight: 6 }} />
              Back
            </button>
            <span className="kbd">
              Press <kbd>Enter</kbd> to continue
            </span>
            <MagneticButton
              type="submit"
              className="btn-primary"
              disabled={!answered || (isLast && (!allAnswered || submitting))}
            >
              {submitting && <Loader2 size={18} className="spin" />}
              {isLast ? 'See my focus window' : 'Next'}
              {!submitting && <ArrowRight className="arrow" size={18} />}
            </MagneticButton>
          </div>
        </form>
      </div>
    </main>
  );
}
