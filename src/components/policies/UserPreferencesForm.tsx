import { useState } from 'react';
import { UserPreferences } from '@/lib/policyComparison';

interface UserPreferencesFormProps {
  initialPreferences?: UserPreferences;
  onSubmit: (preferences: UserPreferences) => void;
  onCancel: () => void;
}

const FINANCIAL_GOALS = [
  'Family Protection',
  'Retirement Planning',
  'Child Education',
  'Tax Saving',
  'Wealth Creation',
  'Emergency Fund',
  'Debt Protection',
  'Business Protection'
];

export default function UserPreferencesForm({
  initialPreferences,
  onSubmit,
  onCancel
}: UserPreferencesFormProps) {
  const [preferences, setPreferences] = useState<UserPreferences>(
    initialPreferences || {
      age: 30,
      occupation: '',
      income: 0,
      maritalStatus: 'single',
      dependents: 0,
      financialGoals: [],
      existingPolicies: [],
      riskAppetite: 'medium'
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(preferences);
  };

  const handleGoalToggle = (goal: string) => {
    setPreferences(prev => ({
      ...prev,
      financialGoals: prev.financialGoals.includes(goal)
        ? prev.financialGoals.filter(g => g !== goal)
        : [...prev.financialGoals, goal]
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* Age */}
        <div>
          <label htmlFor="age" className="block text-sm font-medium text-gray-700">
            Age
          </label>
          <input
            type="number"
            id="age"
            value={preferences.age}
            onChange={e => setPreferences(prev => ({ ...prev, age: parseInt(e.target.value) }))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            min="18"
            max="100"
            required
          />
        </div>

        {/* Occupation */}
        <div>
          <label htmlFor="occupation" className="block text-sm font-medium text-gray-700">
            Occupation
          </label>
          <input
            type="text"
            id="occupation"
            value={preferences.occupation}
            onChange={e => setPreferences(prev => ({ ...prev, occupation: e.target.value }))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
          />
        </div>

        {/* Income */}
        <div>
          <label htmlFor="income" className="block text-sm font-medium text-gray-700">
            Annual Income (₹)
          </label>
          <input
            type="number"
            id="income"
            value={preferences.income}
            onChange={e => setPreferences(prev => ({ ...prev, income: parseInt(e.target.value) }))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            min="0"
            required
          />
        </div>

        {/* Marital Status */}
        <div>
          <label htmlFor="maritalStatus" className="block text-sm font-medium text-gray-700">
            Marital Status
          </label>
          <select
            id="maritalStatus"
            value={preferences.maritalStatus}
            onChange={e => setPreferences(prev => ({ ...prev, maritalStatus: e.target.value as UserPreferences['maritalStatus'] }))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
          >
            <option value="single">Single</option>
            <option value="married">Married</option>
            <option value="divorced">Divorced</option>
            <option value="widowed">Widowed</option>
          </select>
        </div>

        {/* Dependents */}
        <div>
          <label htmlFor="dependents" className="block text-sm font-medium text-gray-700">
            Number of Dependents
          </label>
          <input
            type="number"
            id="dependents"
            value={preferences.dependents}
            onChange={e => setPreferences(prev => ({ ...prev, dependents: parseInt(e.target.value) }))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            min="0"
            required
          />
        </div>

        {/* Risk Appetite */}
        <div>
          <label htmlFor="riskAppetite" className="block text-sm font-medium text-gray-700">
            Risk Appetite
          </label>
          <select
            id="riskAppetite"
            value={preferences.riskAppetite}
            onChange={e => setPreferences(prev => ({ ...prev, riskAppetite: e.target.value as UserPreferences['riskAppetite'] }))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
          >
            <option value="low">Conservative</option>
            <option value="medium">Moderate</option>
            <option value="high">Aggressive</option>
          </select>
        </div>
      </div>

      {/* Financial Goals */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Financial Goals
        </label>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {FINANCIAL_GOALS.map(goal => (
            <div key={goal} className="flex items-center">
              <input
                type="checkbox"
                id={goal}
                checked={preferences.financialGoals.includes(goal)}
                onChange={() => handleGoalToggle(goal)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor={goal} className="ml-2 block text-sm text-gray-700">
                {goal}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Save Preferences
        </button>
      </div>
    </form>
  );
} 