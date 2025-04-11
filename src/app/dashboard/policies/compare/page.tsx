'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { collection, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Policy, UserPreferences } from '@/types/policy';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { MLPolicyRecommendationEngine } from '@/lib/mlPolicyRecommendation';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { 
  Loader2,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Shield,
  Clock,
  Wallet,
  Users,
  Target,
  ShoppingCart,
  Bell
} from 'lucide-react';

interface RefinedBenefits {
  original: string[];
  explanation: string;
  recommendations: string[];
}

export default function PolicyComparison() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [refinedBenefits, setRefinedBenefits] = useState<{[key: string]: RefinedBenefits}>({});
  const [analyzingBenefits, setAnalyzingBenefits] = useState(false);
  const [userPreferences, setUserPreferences] = useState<UserPreferences>({
    age: 30,
    income: 500000,
    occupation: '',
    familySize: 2,
    riskTolerance: 5,
    goals: []
  });
  const [matchScores, setMatchScores] = useState<{[key: string]: number}>({});
  const [showPreferences, setShowPreferences] = useState(true);

  useEffect(() => {
    const fetchPolicies = async () => {
      const policyIds = searchParams.get('policies')?.split(',') || [];
      if (policyIds.length === 0) return;

      try {
        const policiesData = await Promise.all(
          policyIds.map(async (id) => {
            const docRef = doc(collection(db, 'policies'), id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              return { id: docSnap.id, ...docSnap.data() } as Policy;
            }
            return null;
          })
        );

        const validPolicies = policiesData.filter((p): p is Policy => p !== null);
        setPolicies(validPolicies);
        
        // Analyze benefits for each policy
        await analyzeBenefits(validPolicies);
      } catch (error) {
        console.error('Error fetching policies:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPolicies();
  }, [searchParams]);

  const analyzeBenefits = async (policies: Policy[]) => {
    setAnalyzingBenefits(true);
    try {
      const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.0-flash",
        generationConfig: {
          temperature: 0.7,
          topP: 0.8,
          topK: 40
        }
      });

      const refinedBenefitsMap: {[key: string]: RefinedBenefits} = {};

      for (const policy of policies) {
        if (!policy.benefits || policy.benefits.length === 0) continue;

        const prompt = `
          You are an expert insurance advisor. Please analyze these insurance policy benefits and provide:
          1. A clear, concise explanation of what these benefits mean for the policyholder (2-3 sentences)
          2. 2-3 additional recommended benefits that would complement the existing benefits well

          Policy Name: ${policy.name}
          Policy Category: ${policy.category}
          Current Benefits: ${policy.benefits.join(', ')}

          Please respond in this exact JSON format:
          {
            "explanation": "your explanation here",
            "recommendations": ["recommended benefit 1", "recommended benefit 2", "recommended benefit 3"]
          }

          Keep the explanation under 200 characters and ensure each recommended benefit is under 50 characters.
        `;

        try {
          const result = await model.generateContent(prompt);
          const response = await result.response;
          const text = response.text().trim();
          
          try {
            const analysis = JSON.parse(text);
            refinedBenefitsMap[policy.id] = {
              original: policy.benefits,
              explanation: analysis.explanation || 'Analysis not available.',
              recommendations: Array.isArray(analysis.recommendations) ? analysis.recommendations : []
            };
          } catch (parseError) {
            console.error('Error parsing Gemini response:', parseError);
            refinedBenefitsMap[policy.id] = {
              original: policy.benefits,
              explanation: 'Unable to analyze benefits at this time.',
              recommendations: []
            };
          }
        } catch (apiError) {
          console.error('Error calling Gemini API:', apiError);
          refinedBenefitsMap[policy.id] = {
            original: policy.benefits,
            explanation: 'Unable to analyze benefits at this time.',
            recommendations: []
          };
        }
      }

      setRefinedBenefits(refinedBenefitsMap);
    } catch (error) {
      console.error('Error initializing Gemini API:', error);
    } finally {
      setAnalyzingBenefits(false);
    }
  };

  useEffect(() => {
    const calculateMatchScores = async () => {
      if (policies.length === 0) return;
      
      const mlEngine = new MLPolicyRecommendationEngine();
      const scores: {[key: string]: number} = {};
      
      for (const policy of policies) {
        const score = await mlEngine.predict(policy, userPreferences);
        scores[policy.id] = score;
      }
      
      setMatchScores(scores);
    };

    calculateMatchScores();
  }, [policies, userPreferences]);

  const handlePreferencesUpdate = async (field: keyof UserPreferences, value: any) => {
    setUserPreferences(prev => ({
      ...prev,
      [field]: value
    }));

    // Recalculate match scores with updated preferences
    if (policies.length > 0) {
      const mlEngine = new MLPolicyRecommendationEngine();
      const scores: {[key: string]: number} = {};
      
      for (const policy of policies) {
        const score = await mlEngine.predict(policy, {
          ...userPreferences,
          [field]: value
        });
        scores[policy.id] = score;
      }
      
      setMatchScores(scores);
    }
  };

  // Add useEffect to handle policy updates when preferences change
  useEffect(() => {
    const updatePolicies = async () => {
      if (policies.length === 0) return;
      
      try {
        // Re-analyze benefits with current preferences
        await analyzeBenefits(policies);
        
        // Recalculate match scores
        const mlEngine = new MLPolicyRecommendationEngine();
        const scores: {[key: string]: number} = {};
        
        for (const policy of policies) {
          const score = await mlEngine.predict(policy, userPreferences);
          scores[policy.id] = score;
        }
        
        setMatchScores(scores);
      } catch (error) {
        console.error('Error updating policies:', error);
      }
    };

    updatePolicies();
  }, [userPreferences]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (policies.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">No policies to compare</h3>
        <p className="mt-2 text-sm text-gray-500">
          Please select policies to compare from the policies page
        </p>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50 space-y-8 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Policy Comparison</h1>
          <Button
            variant="outline"
            onClick={() => setShowPreferences(!showPreferences)}
            className="bg-white hover:bg-gray-100"
          >
            {showPreferences ? 'Hide Preferences' : 'Show Preferences'}
          </Button>
        </div>

        {showPreferences && (
          <Card className="bg-white border border-gray-200 shadow-sm mb-8">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600">
              <CardTitle className="text-white">Personalize Your Comparison</CardTitle>
              <CardDescription className="text-blue-100">
                Adjust your preferences to get personalized policy recommendations
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6 bg-white">
              <div className="space-y-2">
                <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-1">
                  Age
                </label>
                <Input
                  id="age"
                  type="number"
                  value={userPreferences.age}
                  onChange={(e) => handlePreferencesUpdate('age', parseInt(e.target.value))}
                  className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  min="18"
                  max="100"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="income" className="block text-sm font-medium text-gray-700 mb-1">
                  Annual Income (₹)
                </label>
                <Input
                  id="income"
                  type="number"
                  value={userPreferences.income}
                  onChange={(e) => handlePreferencesUpdate('income', parseInt(e.target.value))}
                  className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  min="0"
                  step="10000"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="familySize" className="block text-sm font-medium text-gray-700 mb-1">
                  Family Size
                </label>
                <Input
                  id="familySize"
                  type="number"
                  value={userPreferences.familySize}
                  onChange={(e) => handlePreferencesUpdate('familySize', parseInt(e.target.value))}
                  className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  min="1"
                  max="10"
                />
              </div>
              <div className="space-y-4 col-span-full">
                <label htmlFor="riskTolerance" className="block text-sm font-medium text-gray-700 mb-1">
                  Risk Tolerance (1-10)
                </label>
                <div className="px-2">
                  <Slider
                    id="riskTolerance"
                    value={[userPreferences.riskTolerance]}
                    onValueChange={([value]) => handlePreferencesUpdate('riskTolerance', value)}
                    max={10}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                </div>
                <div className="text-sm text-gray-600 text-center">
                  Current Risk Tolerance: {userPreferences.riskTolerance}
                  <span className="ml-2 text-gray-500">
                    ({userPreferences.riskTolerance <= 3 ? 'Conservative' : 
                      userPreferences.riskTolerance <= 7 ? 'Moderate' : 'Aggressive'})
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 gap-8">
          {/* Benefits Analysis */}
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-600">
              <CardTitle className="text-white">Benefits Analysis</CardTitle>
              <CardDescription className="text-purple-100">
                AI-powered analysis of policy benefits and recommendations
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {analyzingBenefits ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500 mr-2" />
                  <span>Analyzing benefits...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {policies.map(policy => (
                    <div key={`${policy.id}-benefits-analysis`} 
                      className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">{policy.name}</h3>
                      
                      {refinedBenefits[policy.id] ? (
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium text-gray-700 mb-2">Current Benefits</h4>
                            <div className="flex flex-wrap gap-2">
                              {refinedBenefits[policy.id].original.map(benefit => (
                                <Badge key={benefit} variant="secondary">
                                  {benefit}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          <div>
                            <h4 className="font-medium text-gray-700 mb-2">What This Means</h4>
                            <p className="text-gray-600 text-sm">
                              {refinedBenefits[policy.id].explanation}
                            </p>
                          </div>

                          <div>
                            <h4 className="font-medium text-gray-700 mb-2">Recommended Additional Benefits</h4>
                            <div className="flex flex-wrap gap-2">
                              {refinedBenefits[policy.id].recommendations.map(benefit => (
                                <Badge key={benefit} variant="outline" className="bg-green-50">
                                  {benefit}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-gray-500 italic">
                          No benefits analysis available
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Match Scores */}
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader className="bg-gradient-to-r from-emerald-500 to-green-600">
              <CardTitle className="flex items-center gap-2 text-white">
                <Target className="h-5 w-5" />
                ML-Based Match Scores
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {policies.map(policy => (
                  <div key={`${policy.id}-match`} 
                    className="bg-gradient-to-br from-white to-gray-50 rounded-lg shadow-sm p-6 border border-gray-200">
                    <div className="text-lg font-medium text-gray-900 mb-2">{policy.name}</div>
                    <div className="text-3xl font-bold text-emerald-600">
                      {Math.round(matchScores[policy.id] * 100)}%
                    </div>
                    <div className="text-sm text-gray-600 mt-1">Match Score</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Basic Information */}
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600">
              <CardTitle className="flex items-center gap-2 text-white">
                <Shield className="h-5 w-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {policies.map(policy => (
                  <div key={`${policy.id}-basic`} 
                    className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                    <div className="text-xl font-semibold text-gray-900 mb-4">{policy.name}</div>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                        <Wallet className="h-5 w-5 text-blue-500" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">Premium</div>
                          <div className="text-lg font-semibold text-green-600">
                            {formatCurrency(policy.premium)}/year
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                        <Shield className="h-5 w-5 text-indigo-500" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">Coverage</div>
                          <div className="text-lg font-semibold text-gray-900">
                            {formatCurrency(policy.coverage)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                        <Clock className="h-5 w-5 text-purple-500" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">Term</div>
                          <div className="text-lg font-semibold text-gray-900">
                            {policy.term} years
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">Claim Settlement Ratio</div>
                          <div className="text-lg font-semibold text-gray-900">
                            {policy.claimSettlementRatio}%
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Benefits */}
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-600">
              <CardTitle className="flex items-center gap-2 text-white">
                <TrendingUp className="h-5 w-5" />
                Benefits & Features
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {policies.map(policy => (
                  <div key={`${policy.id}-benefits`} 
                    className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">{policy.name}</h3>
                    <div className="space-y-3">
                      {(policy.benefits || []).map(benefit => (
                        <div key={benefit} 
                          className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                          <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                          <span className="text-gray-700">{benefit}</span>
                        </div>
                      ))}
                      {(!policy.benefits || policy.benefits.length === 0) && (
                        <div className="text-gray-500 italic">No benefits listed</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Direct Purchase & Tracking */}
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader className="bg-gradient-to-r from-teal-500 to-cyan-600">
              <CardTitle className="flex items-center gap-2 text-white">
                <ShoppingCart className="h-5 w-5" />
                Direct Purchase & Tracking
              </CardTitle>
              <CardDescription className="text-teal-100">
                Purchase policies directly and track renewals & claims
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {policies.map(policy => (
                  <div key={`${policy.id}-purchase-tracking`} 
                    className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">{policy.name}</h3>
                    
                    {/* Direct Purchase Section */}
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Direct Purchase</h4>
                      <Button 
                        className="w-full bg-teal-600 hover:bg-teal-700 text-white"
                        onClick={() => router.push(`/dashboard/policies/${policy.id}/purchase`)}
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Purchase Now
                      </Button>
                      <p className="text-xs text-gray-500 mt-2">
                        Secure online purchase with instant policy issuance
                      </p>
                    </div>

                    {/* Renewal Tracking */}
                    <div className="space-y-3 mb-4">
                      <h4 className="text-sm font-medium text-gray-700">Renewal & Claims</h4>
                      <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                        <Bell className="h-5 w-5 text-blue-500" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">Renewal Reminders</div>
                          <div className="text-xs text-gray-600">
                            Automated notifications 30 days before due date
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">Claim Tracking</div>
                          <div className="text-xs text-gray-600">
                            Real-time status updates and documentation
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        className="flex-1 text-sm"
                        onClick={() => window.location.href = `/dashboard/policies/${policy.id}/claims`}
                      >
                        View Claims
                      </Button>
                      <Button 
                        variant="outline" 
                        className="flex-1 text-sm"
                        onClick={() => window.location.href = `/dashboard/policies/${policy.id}/renewals`}
                      >
                        Renewals
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Flexibility Features */}
          {policies.some(p => p.flexibility) && (
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardHeader className="bg-gradient-to-r from-orange-500 to-amber-600">
                <CardTitle className="flex items-center gap-2 text-white">
                  <Users className="h-5 w-5" />
                  Flexibility Features
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {policies.map(policy => (
                    <div key={`${policy.id}-flexibility`} 
                      className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">{policy.name}</h3>
                      {policy.flexibility ? (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                            {policy.flexibility.partialWithdrawal ? (
                              <CheckCircle2 className="h-5 w-5 text-green-500" />
                            ) : (
                              <AlertCircle className="h-5 w-5 text-red-500" />
                            )}
                            <span className="text-gray-700">Partial Withdrawal</span>
                          </div>
                          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                            {policy.flexibility.topUp ? (
                              <CheckCircle2 className="h-5 w-5 text-green-500" />
                            ) : (
                              <AlertCircle className="h-5 w-5 text-red-500" />
                            )}
                            <span className="text-gray-700">Top-up Option</span>
                          </div>
                          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                            {policy.flexibility.premiumHoliday ? (
                              <CheckCircle2 className="h-5 w-5 text-green-500" />
                            ) : (
                              <AlertCircle className="h-5 w-5 text-red-500" />
                            )}
                            <span className="text-gray-700">Premium Holiday</span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-gray-500 italic p-4 bg-gray-50 rounded-lg">
                          No flexibility features available
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
} 