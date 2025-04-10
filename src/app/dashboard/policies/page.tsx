'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { PolicyComparisonService, Policy } from '@/lib/policyComparison';
import RoleGuard from '@/components/auth/RoleGuard';
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
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

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

export default function PoliciesPage() {
  const router = useRouter();
  const { user, userProfile } = useAuth();
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
    fetchPolicies();
  }, []);

  useEffect(() => {
    filterPolicies();
  }, [policies, searchQuery, selectedType, selectedProvider, priceRange, selectedGoals]);

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      if (!user) return;

      let policiesQuery;
      if (userProfile?.role === 'insurer') {
        policiesQuery = query(
          collection(db, 'policies'),
          where('provider', '==', userProfile.name)
        );
      } else {
        policiesQuery = query(collection(db, 'policies'));
      }

      const querySnapshot = await getDocs(policiesQuery);
      const fetchedPolicies = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Policy[];

      setPolicies(fetchedPolicies);
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
        policy.benefits.some(benefit => benefit.toLowerCase().includes(query))
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
        selectedGoals.some(goal => policy.goals.includes(goal))
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <RoleGuard allowedRoles={['user', 'insurer', 'admin']}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">Insurance Policies</h1>
          {userProfile?.role === 'insurer' && (
            <Button onClick={() => router.push('/dashboard/policies/create')}>
              Add New Policy
            </Button>
          )}
        </div>

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
                        value={priceRange}
                        onValueChange={setPriceRange}
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
                    {policy.goals.slice(0, 3).map(goal => (
                      <Badge key={goal} variant="secondary">{goal}</Badge>
                    ))}
                    {policy.goals.length > 3 && (
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
    </RoleGuard>
  );
} 