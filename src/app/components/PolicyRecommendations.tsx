import { useState } from 'react';
import { recommendationService, UserProfile, PolicyRecommendation } from '../services/recommendationService';

export default function PolicyRecommendations() {
    const [recommendations, setRecommendations] = useState<PolicyRecommendation[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getRecommendations = async (userProfile: UserProfile) => {
        setLoading(true);
        setError(null);
        try {
            const results = await recommendationService.getRecommendations(userProfile);
            setRecommendations(results);
        } catch (err: any) {
            setError(err.message || 'Failed to get recommendations');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold">Policy Recommendations</h2>
            
            {loading && (
                <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
            )}

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
            )}

            {recommendations.length > 0 && (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {recommendations.map((recommendation, index) => (
                        <div 
                            key={index}
                            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
                        >
                            <h3 className="text-xl font-semibold mb-2">{recommendation.policy_type}</h3>
                            <div className="space-y-2">
                                <p className="text-sm">
                                    <span className="font-medium">Score:</span>{' '}
                                    {(recommendation.score * 100).toFixed(1)}%
                                </p>
                                <p className="text-sm">
                                    <span className="font-medium">Confidence:</span>{' '}
                                    {recommendation.confidence}
                                </p>
                                <p className="text-sm text-gray-600">
                                    {recommendation.explanation}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {recommendations.length === 0 && !loading && !error && (
                <p className="text-gray-500">
                    No recommendations available. Please complete your profile to get personalized recommendations.
                </p>
            )}
        </div>
    );
} 