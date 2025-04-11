'use client';

import { useState, useEffect } from 'react';
import { Policy, UserPreferences } from '@/types/policy';
import { MLPolicyRecommendationEngine } from '@/lib/mlPolicyRecommendation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Loader2, Shield, TrendingUp } from 'lucide-react';
import { PolicyService } from '@/lib/services/policyService';

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
  const [policies, setPolicies] = useState<Policy[]>([]);
  const router = useRouter();

  // Fetch policies from database
  useEffect(() => {
    const fetchPolicies = async () => {
      try {
        const fetchedPolicies = await PolicyService.getAllPolicies();
        setPolicies(fetchedPolicies);
      } catch (error) {
        console.error('Error fetching policies:', error);
        setPolicies([]);
      }
    };

    fetchPolicies();
  }, []);

  // Generate recommendations when policies are loaded
  useEffect(() => {
    const loadRecommendations = async () => {
      try {
        setLoading(true);
        const engine = new MLPolicyRecommendationEngine();

        // Use fetched policies instead of availablePolicies
        const recommendations = await engine.recommendPolicies(userPreferences, policies);
        setRecommendations(recommendations);
      } catch (error) {
        console.error('Error loading recommendations:', error);
        setRecommendations([]);
      } finally {
        setLoading(false);
      }
    };

    if (policies.length > 0) {
      loadRecommendations();
    }
  }, [userPreferences, policies]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-IN').format(num);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            AI-Powered Recommendations
          </CardTitle>
          <CardDescription>Analyzing policies based on your preferences...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (recommendations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            AI-Powered Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            No recommendations available at this time.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600">
        <CardTitle className="flex items-center gap-2 text-white">
          <TrendingUp className="h-5 w-5" />
          AI-Powered Recommendations
        </CardTitle>
        <CardDescription className="text-blue-100">
          Personalized policy recommendations based on your preferences
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-6">
          {recommendations.map(({ policy, score }) => (
            <div 
              key={policy.id} 
              className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:border-blue-500 transition-colors"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1 mr-4">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">
                    {policy.name}
                  </h3>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-indigo-600">{policy.company}</p>
                    <span className="text-gray-300">•</span>
                    <p className="text-sm text-gray-500">{policy.category}</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-2xl font-semibold text-green-600">
                    {formatCurrency(policy.premium)}
                  </p>
                  <p className="text-sm text-gray-500">per year</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-700">AI Match Score</span>
                  <span className="font-semibold text-blue-600">{Math.round(score * 100)}%</span>
                </div>
                <Progress value={score * 100} className="h-2" />
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <Shield className="h-5 w-5 text-indigo-500" />
                  <div>
                    <p className="text-sm text-gray-500">Coverage</p>
                    <p className="font-semibold text-gray-900">{formatCurrency(policy.coverage)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm text-gray-500">Term</p>
                    <p className="font-semibold text-gray-900">{policy.term} years</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {policy.benefits?.slice(0, 3).map((benefit, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700"
                  >
                    {benefit}
                  </span>
                ))}
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={() => router.push(`/dashboard/policies/${policy.id}`)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
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