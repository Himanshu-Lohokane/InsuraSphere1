'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { Policy } from '@/lib/policyComparison';

interface BenefitsAnalysisProps {
  policy: Policy;
}

export default function BenefitsAnalysis({ policy }: BenefitsAnalysisProps) {
  const [analysis, setAnalysis] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    analyzePolicy();
  }, [policy]);

  const analyzePolicy = async () => {
    setLoading(true);
    setError(null);

    try {
      const prompt = `
        Analyze this insurance policy and provide key insights and recommendations:
        
        Policy Type: ${policy.type}
        Provider: ${policy.provider}
        Coverage: ₹${policy.coverage.toLocaleString()}
        Premium: ₹${policy.premium.toLocaleString()}/month
        
        Benefits:
        ${policy.benefits.map(b => `- ${b}`).join('\n')}
        
        ${policy.addOns?.length ? `Add-ons:\n${policy.addOns.map(a => `- ${a}`).join('\n')}\n` : ''}
        ${policy.goals?.length ? `Goals:\n${policy.goals.map(g => `- ${g}`).join('\n')}\n` : ''}
        ${policy.exclusions?.length ? `Exclusions:\n${policy.exclusions.map(e => `- ${e}`).join('\n')}\n` : ''}
        
        Please provide:
        1. Key advantages of this policy
        2. Potential limitations or considerations
        3. Who this policy is best suited for
        4. Recommendations for maximizing benefits
      `;

      const response = await fetch('/api/analyze-policy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze policy');
      }

      const data = await response.json();
      setAnalysis(data.analysis);
    } catch (err) {
      console.error('Error analyzing policy:', err);
      setError('Unable to generate analysis at this time. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
        <CardTitle className="text-2xl">Benefits Analysis</CardTitle>
        <CardDescription className="text-purple-100">
          AI-powered analysis of policy benefits and recommendations
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
          </div>
        ) : error ? (
          <div className="text-red-500 py-4">{error}</div>
        ) : (
          <div className="prose max-w-none">
            {analysis.split('\n').map((paragraph, index) => (
              <p key={index} className="mb-4 text-slate-700">
                {paragraph}
              </p>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 