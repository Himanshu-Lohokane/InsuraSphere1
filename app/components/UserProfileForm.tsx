import { useState } from 'react';
import { UserProfile } from '../services/recommendationService';

interface UserProfileFormProps {
    onSubmit: (profile: UserProfile) => void;
    loading?: boolean;
}

export default function UserProfileForm({ onSubmit, loading = false }: UserProfileFormProps) {
    const [formData, setFormData] = useState<UserProfile>({
        age: 0,
        income: 0,
        occupation: '',
        family_size: 0,
        marital_status: '',
        education_level: '',
        risk_tolerance: 0,
        health_status: '',
        existing_conditions: 0,
        lifestyle: '',
        family_medical_history: '',
        smoking_status: '',
        bmi: 0,
        savings_rate: 0,
        debt: 0,
        investment_experience: 0,
        coverage_preference: '',
        policy_duration_preference: '',
        premium_budget: 0,
        location_type: '',
        property_ownership: '',
        vehicle_ownership: ''
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? parseFloat(value) || 0 : value
        }));
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Basic Information</h3>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Age</label>
                        <input
                            type="number"
                            name="age"
                            value={formData.age}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Income</label>
                        <input
                            type="number"
                            name="income"
                            value={formData.income}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Occupation</label>
                        <select
                            name="occupation"
                            value={formData.occupation}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            required
                        >
                            <option value="">Select Occupation</option>
                            <option value="professional">Professional</option>
                            <option value="business_owner">Business Owner</option>
                            <option value="employee">Employee</option>
                            <option value="student">Student</option>
                            <option value="retired">Retired</option>
                        </select>
                    </div>
                </div>

                {/* Health Information */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Health Information</h3>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Health Status</label>
                        <select
                            name="health_status"
                            value={formData.health_status}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            required
                        >
                            <option value="">Select Health Status</option>
                            <option value="excellent">Excellent</option>
                            <option value="good">Good</option>
                            <option value="fair">Fair</option>
                            <option value="poor">Poor</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">BMI</label>
                        <input
                            type="number"
                            name="bmi"
                            value={formData.bmi}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Smoking Status</label>
                        <select
                            name="smoking_status"
                            value={formData.smoking_status}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            required
                        >
                            <option value="">Select Smoking Status</option>
                            <option value="never">Never</option>
                            <option value="former">Former</option>
                            <option value="current">Current</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                >
                    {loading ? 'Getting Recommendations...' : 'Get Recommendations'}
                </button>
            </div>
        </form>
    );
} 