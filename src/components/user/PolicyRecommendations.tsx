'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface PolicyRecommendation {
  id: string;
  type: string;
  coverage: number;
  premium: number;
  description: string;
  matchPercentage: number;
}

export default function PolicyRecommendations() {
  const [recommendations, setRecommendations] = useState<PolicyRecommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        // Get user profile from localStorage or context
        const userProfile = {
          income: Number(localStorage.getItem('income')) || 50000,
          age: Number(localStorage.getItem('age')) || 30,
          occupation: localStorage.getItem('occupation') || 'Professional',
          searchHistory: JSON.parse(localStorage.getItem('searchHistory') || '[]'),
        };

        const response = await fetch('/api/recommendations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userProfile }),
        });

        const data = await response.json();
        setRecommendations(data.recommendations);
      } catch (error) {
        console.error('Error fetching recommendations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recommended Policies</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {recommendations.map((policy) => (
            <div key={policy.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">{policy.type}</h3>
                <span className="text-sm text-muted-foreground">
                  ${policy.premium}/month
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{policy.description}</p>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span>Match Score</span>
                  <span>{Math.round(policy.matchPercentage)}%</span>
                </div>
                <Progress value={policy.matchPercentage} className="h-2" />
              </div>
              <div className="flex justify-end">
                <Button asChild size="sm">
                  <Link href={`/policies/${policy.id}`}>View Details</Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 