'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, calculateAge } from '@/contexts/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Search, Filter, ChevronDown, ChevronUp, Star, StarOff } from 'lucide-react';
import MLPolicyRecommendations from '@/components/policies/MLPolicyRecommendations';

const POLICY_TYPES = [
  'Life Insurance',
  'Health Insurance',
  'Vehicle Insurance',
  'Travel Insurance',
  'Property Insurance',
  'Business Insurance'
];

const PROVIDERS = [
  'LIC',
  'HDFC Ergo',
  'ICICI Prudential',
  'SBI Life',
  'Bajaj Allianz',
  'Tata AIG',
  'Max Life',
  'Reliance General'
];

interface Policy {
  id: string;
  type: string;
  provider: string;
  premium: number;
  benefits: string[];
  goals?: string[];
  status: 'active' | 'pending' | 'expired';
  startDate: string;
  endDate: string;
  coverage: number;
  description?: string;
  term?: number;
  claimSettlementRatio?: number;
  addOns: string[];
  eligibility: {
    minAge: number;
    maxAge: number;
  };
}

export default function PoliciesPage() {
  const router = useRouter();
  const { user, userProfile, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [filteredPolicies, setFilteredPolicies] = useState<Policy[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPolicies, setSelectedPolicies] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('PoliciesPage - Initial render');
    console.log('Auth state:', { 
      user: user?.email, 
      userProfile: userProfile?.role,
      authLoading 
    });
    
    if (!authLoading) {
      if (!user || !userProfile) {
        console.log('No authenticated user or profile, redirecting to signin');
        router.push('/auth/signin');
        return;
      }
      
      console.log('User authenticated:', {
        email: user.email,
        role: userProfile.role,
        name: userProfile.name
      });
      
      fetchPolicies();
    }
  }, [user, userProfile, authLoading]);

  useEffect(() => {
    filterPolicies();
  }, [policies, searchQuery, selectedType, selectedProvider, priceRange, selectedGoals]);

  const fetchPolicies = async () => {
    try {
      console.log('Fetching policies...');
      setLoading(true);
      
      if (!user) {
        console.log('No user found during fetch');
        return;
      }

      let policiesQuery;
      if (userProfile?.role === 'insurer') {
        console.log('Fetching insurer policies for:', userProfile.name);
        policiesQuery = query(
          collection(db, 'policies'),
          where('provider', '==', userProfile.name)
        );
      } else {
        console.log('Fetching all policies for role:', userProfile?.role);
        policiesQuery = query(collection(db, 'policies'));
      }

      const querySnapshot = await getDocs(policiesQuery);
      console.log('Found policies:', querySnapshot.size);
      
      const fetchedPolicies = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          type: data.type || '',
          provider: data.provider || '',
          premium: data.premium || 0,
          benefits: data.benefits || [],
          goals: data.goals || [],
          status: data.status || 'active',
          startDate: data.startDate || '',
          endDate: data.endDate || '',
          coverage: data.coverage || 0,
          description: data.description || '',
          term: data.term,
          claimSettlementRatio: data.claimSettlementRatio,
          addOns: data.addOns || [],
          eligibility: {
            minAge: data.eligibility?.minAge || 18,
            maxAge: data.eligibility?.maxAge || 100,
          },
        } as Policy;
      });

      console.log('Processed policies:', {
        total: fetchedPolicies.length,
        types: [...new Set(fetchedPolicies.map(p => p.type))],
        providers: [...new Set(fetchedPolicies.map(p => p.provider))]
      });
      
      setPolicies(fetchedPolicies);
      setFilteredPolicies(fetchedPolicies);
    } catch (error) {
      console.error('Error fetching policies:', error);
      setError('Failed to fetch policies. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const filterPolicies = () => {
    let filtered = [...policies];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(policy => 
        policy.provider.toLowerCase().includes(query) ||
        policy.type.toLowerCase().includes(query) ||
        (policy.benefits && policy.benefits.some(benefit => benefit.toLowerCase().includes(query)))
      );
    }
    
    // Apply type filter
    if (selectedType) {
      filtered = filtered.filter(policy => policy.type === selectedType);
    }
    
    // Apply provider filter
    if (selectedProvider) {
      filtered = filtered.filter(policy => policy.provider === selectedProvider);
    }
    
    // Apply price range filter
    filtered = filtered.filter(policy => 
      policy.premium >= priceRange[0] && policy.premium <= priceRange[1]
    );
    
    // Apply goals filter
    if (selectedGoals.length > 0) {
      filtered = filtered.filter(policy => 
        policy.goals && selectedGoals.some(goal => policy.goals?.includes(goal))
      );
    }
    
    setFilteredPolicies(filtered);
  };

  const handlePolicySelect = (policyId: string) => {
    setSelectedPolicies(prev => {
      if (prev.includes(policyId)) {
        return prev.filter(id => id !== policyId);
      }
      if (prev.length >= 4) {
        return prev;
      }
      return [...prev, policyId];
    });
  };

  const handleCompare = () => {
    if (selectedPolicies.length >= 2) {
      router.push(`/dashboard/policies/compare?policies=${selectedPolicies.join(',')}`);
    }
  };

  const handleGoalToggle = (goal: string) => {
    setSelectedGoals(prev => {
      if (prev.includes(goal)) {
        return prev.filter(g => g !== goal);
      }
      return [...prev, goal];
    });
  };

  const handlePriceRangeChange = (values: number[]) => {
    setPriceRange([values[0], values[1]] as [number, number]);
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user || !userProfile) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Authentication Required</h3>
        <p className="mt-2 text-sm text-gray-500">
          Please sign in to view policies.
        </p>
        <Button
          onClick={() => router.push('/auth/signin')}
          className="mt-4"
        >
          Sign In
        </Button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Error</h3>
        <p className="mt-2 text-sm text-gray-500">{error}</p>
        <Button
          onClick={fetchPolicies}
          className="mt-4"
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Insurance Policies</h1>
        <Button onClick={() => router.push('/dashboard/policies/compare')}>
          Compare Policies
        </Button>
      </div>

      {/* ML Recommendations */}
      <MLPolicyRecommendations
        userPreferences={{
          age: userProfile.dateOfBirth ? calculateAge(userProfile.dateOfBirth) : 18,
          income: userProfile.income || 50000,
          occupation: userProfile.occupation || 'professional',
          familySize: userProfile.familyMembers || 1,
          riskTolerance: 0.5, // Default value since not in profile
          goals: ['Family Protection', 'Wealth Creation'], // Default goals since not in profile
        }}
        availablePolicies={policies}
      />

      {/* Search and Filter Bar */}
      <div className="flex flex-col space-y-4">
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search policies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {showFilters ? (
              <ChevronUp className="h-4 w-4 ml-2" />
            ) : (
              <ChevronDown className="h-4 w-4 ml-2" />
            )}
          </Button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Policy Type Filter */}
                <div className="space-y-2">
                  <Label>Policy Type</Label>
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Types</SelectItem>
                      {POLICY_TYPES.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Provider Filter */}
                <div className="space-y-2">
                  <Label>Provider</Label>
                  <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Providers" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Providers</SelectItem>
                      {PROVIDERS.map(provider => (
                        <SelectItem key={provider} value={provider}>{provider}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Price Range Filter */}
                <div className="space-y-2">
                  <Label>Premium Range (₹)</Label>
                  <div className="pt-2">
                    <Slider
                      min={0}
                      max={100000}
                      step={1000}
                      value={[priceRange[0], priceRange[1]]}
                      onValueChange={handlePriceRangeChange}
                    />
                    <div className="flex justify-between mt-2 text-sm text-gray-500">
                      <span>₹{priceRange[0].toLocaleString()}</span>
                      <span>₹{priceRange[1].toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Goals Filter */}
                <div className="space-y-2">
                  <Label>Financial Goals</Label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {['Family Protection', 'Retirement Planning', 'Child Education', 'Tax Saving', 'Wealth Creation', 'Emergency Fund', 'Debt Protection', 'Business Protection'].map(goal => (
                      <div key={goal} className="flex items-center space-x-2">
                        <Checkbox
                          id={goal}
                          checked={selectedGoals.includes(goal)}
                          onCheckedChange={() => handleGoalToggle(goal)}
                        />
                        <Label htmlFor={goal} className="text-sm">{goal}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Selected Policies Bar */}
      {selectedPolicies.length > 0 && (
        <div className="bg-indigo-50 p-4 rounded-lg flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-indigo-700 font-medium">
              {selectedPolicies.length} policy selected
            </span>
          </div>
          <Button onClick={handleCompare} disabled={selectedPolicies.length < 2}>
            Compare Selected
          </Button>
        </div>
      )}

      {/* Policies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPolicies.map(policy => (
          <Card key={policy.id} className="overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{policy.provider}</CardTitle>
                  <CardDescription>{policy.type}</CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={selectedPolicies.includes(policy.id)}
                    onCheckedChange={() => handlePolicySelect(policy.id)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Premium</span>
                  <span className="text-lg font-semibold">₹{policy.premium.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Coverage</span>
                  <span className="text-lg font-semibold">₹{policy.coverage.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Term</span>
                  <span className="text-lg font-semibold">{policy.term} years</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Claim Ratio</span>
                  <span className="text-lg font-semibold">{policy.claimSettlementRatio}%</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {policy.goals?.slice(0, 3).map(goal => (
                    <Badge key={goal} variant="secondary">{goal}</Badge>
                  ))}
                  {policy.goals && policy.goals.length > 3 && (
                    <Badge variant="outline">+{policy.goals.length - 3} more</Badge>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => router.push(`/dashboard/policies/${policy.id}`)}
              >
                View Details
              </Button>
              <Button
                onClick={() => router.push(`/dashboard/policies/${policy.id}/purchase`)}
              >
                Purchase
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredPolicies.length === 0 && (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900">No policies found</h3>
          <p className="mt-2 text-sm text-gray-500">
            Try adjusting your filters or search query
          </p>
        </div>
      )}
    </div>
  );
} 