'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { PolicyComparisonService, Policy, UserPreferences } from '@/lib/policyComparison';
import RoleGuard from '@/components/auth/RoleGuard';

export default function PolicyComparison() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [recommendations, setRecommendations] = useState<Policy[]>([]);
  const [bestMatches, setBestMatches] = useState<{
    premium: Policy | null;
    coverage: Policy | null;
    flexibility: Policy | null;
  }>({
    premium: null,
    coverage: null,
    flexibility: null
  });
  const [userPreferences, setUserPreferences] = useState<UserPreferences>({
    age: 30,
    occupation: '',
    income: 0,
    maritalStatus: 'single',
    dependents: 0,
    financialGoals: [],
    existingPolicies: [],
    riskAppetite: 'medium'
  });

  useEffect(() => {
    const policyIds = searchParams.get('policies')?.split(',') || [];
    if (policyIds.length < 2) {
      router.push('/dashboard/policies');
      return;
    }

    fetchComparisonData(policyIds);
  }, [searchParams]);

  const fetchComparisonData = async (policyIds: string[]) => {
    try {
      setLoading(true);
      const comparisonService = PolicyComparisonService.getInstance();
      
      // Get policy comparison
      const comparison = await comparisonService.comparePolicies(policyIds);
      setPolicies(comparison.policies);
      setBestMatches(comparison.bestMatches);

      // Get recommendations if user is logged in
      if (user && userProfile) {
        const recommendations = await comparisonService.getRecommendations(
          userProfile,
          userPreferences
        );
        setRecommendations(recommendations);
      }
    } catch (error) {
      console.error('Error fetching comparison data:', error);
    } finally {
      setLoading(false);
    }
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
          <h1 className="text-2xl font-semibold text-gray-900">Policy Comparison</h1>
          <button
            onClick={() => router.push('/dashboard/policies')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Back to Policies
          </button>
        </div>

        {/* Best Matches Section */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {bestMatches.premium && (
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <h3 className="text-lg font-medium text-gray-900">Best Premium</h3>
                <p className="mt-1 text-sm text-gray-500">{bestMatches.premium.provider}</p>
                <p className="mt-2 text-2xl font-semibold text-indigo-600">
                  ₹{bestMatches.premium.premium.toLocaleString()}
                </p>
              </div>
            </div>
          )}

          {bestMatches.coverage && (
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <h3 className="text-lg font-medium text-gray-900">Best Coverage</h3>
                <p className="mt-1 text-sm text-gray-500">{bestMatches.coverage.provider}</p>
                <p className="mt-2 text-2xl font-semibold text-indigo-600">
                  ₹{bestMatches.coverage.coverage.toLocaleString()}
                </p>
              </div>
            </div>
          )}

          {bestMatches.flexibility && (
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <h3 className="text-lg font-medium text-gray-900">Most Flexible</h3>
                <p className="mt-1 text-sm text-gray-500">{bestMatches.flexibility.provider}</p>
                <p className="mt-2 text-sm text-gray-500">
                  {bestMatches.flexibility.flexibility.length} features
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Comparison Table */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Feature
                </th>
                {policies.map(policy => (
                  <th
                    key={policy.id}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {policy.provider}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Premium
                </td>
                {policies.map(policy => (
                  <td
                    key={policy.id}
                    className={`px-6 py-4 whitespace-nowrap text-sm ${
                      policy.id === bestMatches.premium?.id
                        ? 'text-green-600 font-semibold'
                        : 'text-gray-500'
                    }`}
                  >
                    ₹{policy.premium.toLocaleString()}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Coverage
                </td>
                {policies.map(policy => (
                  <td
                    key={policy.id}
                    className={`px-6 py-4 whitespace-nowrap text-sm ${
                      policy.id === bestMatches.coverage?.id
                        ? 'text-green-600 font-semibold'
                        : 'text-gray-500'
                    }`}
                  >
                    ₹{policy.coverage.toLocaleString()}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Term (Years)
                </td>
                {policies.map(policy => (
                  <td key={policy.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {policy.term}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Claim Settlement Ratio
                </td>
                {policies.map(policy => (
                  <td key={policy.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {policy.claimSettlementRatio}%
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Add-ons
                </td>
                {policies.map(policy => (
                  <td key={policy.id} className="px-6 py-4 text-sm text-gray-500">
                    <ul className="list-disc list-inside">
                      {policy.addOns.map((addon, index) => (
                        <li key={index}>{addon}</li>
                      ))}
                    </ul>
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Benefits
                </td>
                {policies.map(policy => (
                  <td key={policy.id} className="px-6 py-4 text-sm text-gray-500">
                    <ul className="list-disc list-inside">
                      {policy.benefits.map((benefit, index) => (
                        <li key={index}>{benefit}</li>
                      ))}
                    </ul>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Recommendations Section */}
        {recommendations.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-gray-900">Recommended for You</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {recommendations.map(policy => (
                <div
                  key={policy.id}
                  className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow duration-300"
                >
                  <div className="p-5">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-900">{policy.provider}</h3>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Best Match
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">{policy.type} Insurance</p>
                    <div className="mt-4">
                      <p className="text-2xl font-semibold text-indigo-600">
                        ₹{policy.premium.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-500">per year</p>
                    </div>
                    <div className="mt-4">
                      <button
                        onClick={() => router.push(`/dashboard/policies/${policy.id}`)}
                        className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
} 