'use client';

import { useState, useEffect } from 'react';
import { Policy, UserPreferences } from '@/types/policy';
import { MLPolicyRecommendationEngine } from '@/lib/mlPolicyRecommendation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface MLPolicyRecommendationsProps {
  userPreferences: UserPreferences;
  availablePolicies: Policy[];
}

export default function MLPolicyRecommendations({
  userPreferences,
  availablePolicies,
}: MLPolicyRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<{ policy: Policy; score: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadRecommendations = async () => {
      try {
        setLoading(true);
        const engine = new MLPolicyRecommendationEngine();
        
        // In a real application, you would load training data from your backend
        // For now, we'll use a simple mock training data
        const mockTrainingData = availablePolicies.map(policy => ({
          policy,
          preferences: userPreferences,
          score: Math.random(), // In a real app, this would be based on actual user feedback
        }));

        await engine.train(mockTrainingData);
        const recommendations = await engine.recommendPolicies(userPreferences, availablePolicies);
        setRecommendations(recommendations);
      } catch (error) {
        console.error('Error loading recommendations:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRecommendations();
  }, [userPreferences, availablePolicies]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AI-Powered Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI-Powered Recommendations</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {recommendations.map(({ policy, score }) => (
            <div key={policy.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{policy.provider}</h3>
                  <p className="text-sm text-muted-foreground">{policy.type}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">₹{policy.premium.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">per year</p>
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span>AI Match Score</span>
                  <span>{Math.round(score * 100)}%</span>
                </div>
                <Progress value={score * 100} className="h-2" />
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Coverage</p>
                  <p className="font-medium">₹{policy.coverage.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Term</p>
                  <p className="font-medium">{policy.term || 'N/A'} years</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {policy.benefits.slice(0, 3).map((benefit, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700"
                  >
                    {benefit}
                  </span>
                ))}
              </div>

              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/dashboard/policies/${policy.id}`)}
                >
                  View Details
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 