import React from 'react';
import { User, Moon, Activity, Dumbbell, Coffee, Monitor, Brain, Loader2 } from 'lucide-react';

const inputClass =
  'w-full px-6 py-4 border-2 border-gray-200 rounded-xl focus:border-indigo-600 focus:outline-none text-lg transition bg-white';

// One coloured card with an icon and a label around an input.
function Field({ id, label, icon: Icon, children }) {
  return (
    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-2xl">
      <label htmlFor={id} className="block text-sm font-bold text-gray-700 mb-3 flex items-center">
        <Icon className="w-5 h-5 mr-2 text-indigo-600" />
        {label}
      </label>
      {children}
    </div>
  );
}

export default function Questionnaire({ userData, onChange, onSubmit, submitting, errors }) {
  const isComplete = Object.values(userData).every((value) => value !== '');

  // Controlled inputs: the value comes from state, every change goes back to state.
  const bind = (field) => ({
    id: field,
    value: userData[field],
    onChange: (e) => onChange(field, e.target.value),
  });

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

          <form
            className="space-y-6"
            onSubmit={(e) => {
              e.preventDefault(); // stop the browser reloading the page
              if (isComplete && !submitting) onSubmit();
            }}
          >
            <Field id="age" label="How old are you?" icon={User}>
              <input type="number" min="5" max="120" placeholder="Enter your age" className={inputClass} {...bind('age')} />
            </Field>

            <Field id="sleepHours" label="Average sleep per night (hours)" icon={Moon}>
              <input type="number" step="0.5" min="0" max="24" placeholder="e.g., 7.5" className={inputClass} {...bind('sleepHours')} />
            </Field>

            <Field id="stressLevel" label="Current stress level" icon={Activity}>
              <input type="range" min="1" max="10" className="w-full h-3 cursor-pointer" {...bind('stressLevel')} />
              <div className="flex justify-between text-xs text-gray-600 mt-2">
                <span>Relaxed</span>
                <span className="text-2xl font-bold text-red-600">{userData.stressLevel}</span>
                <span>Stressed</span>
              </div>
            </Field>

            <Field id="exerciseFrequency" label="How often do you exercise?" icon={Dumbbell}>
              <select className={inputClass} {...bind('exerciseFrequency')}>
                <option value="">Select frequency</option>
                <option value="daily">Daily</option>
                <option value="weekly">3-5 times per week</option>
                <option value="occasionally">1-2 times per week</option>
                <option value="rarely">Rarely</option>
              </select>
            </Field>

            <Field id="caffeine" label="Daily caffeine intake" icon={Coffee}>
              <select className={inputClass} {...bind('caffeine')}>
                <option value="">Select level</option>
                <option value="none">None</option>
                <option value="low">1 cup per day</option>
                <option value="moderate">2-3 cups per day</option>
                <option value="high">4+ cups per day</option>
              </select>
            </Field>

            <Field id="screenTime" label="Daily screen time (hours)" icon={Monitor}>
              <input type="number" step="0.5" min="0" max="24" placeholder="e.g., 8" className={inputClass} {...bind('screenTime')} />
            </Field>

            <Field id="workType" label="Type of work you do" icon={Brain}>
              <select className={inputClass} {...bind('workType')}>
                <option value="">Select type</option>
                <option value="creative">Creative/Design</option>
                <option value="analytical">Analytical/Technical</option>
                <option value="physical">Physical</option>
                <option value="mixed">Mixed</option>
              </select>
            </Field>

            {errors.length > 0 && (
              <div className="bg-red-50 border-2 border-red-200 text-red-700 rounded-2xl p-4" role="alert">
                <p className="font-bold mb-1">Please fix these answers:</p>
                <ul className="list-disc ml-5">
                  {errors.map((message) => (
                    <li key={message}>{message}</li>
                  ))}
                </ul>
              </div>
            )}

            <button
              type="submit"
              disabled={!isComplete || submitting}
              className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white py-5 rounded-2xl font-bold text-xl hover:shadow-2xl transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {submitting && <Loader2 className="w-6 h-6 mr-2 animate-spin" />}
              {isComplete ? 'Analyze My Focus Capacity' : 'Please complete all fields'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
