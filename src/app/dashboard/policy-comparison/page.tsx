import { useState, useEffect } from 'react';
import { PolicyComparisonService, Policy } from '@/lib/policyComparison';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { UserRole } from '@/contexts/AuthContext';
import { Spinner } from '@/components/ui/Spinner';

export default function PolicyComparison() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [selectedPolicies, setSelectedPolicies] = useState<string[]>([]);
  const [comparisonResults, setComparisonResults] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [comparing, setComparing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const policyService = PolicyComparisonService.getInstance();

  useEffect(() => {
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      const allPolicies = await policyService.getAllPolicies();
      setPolicies(allPolicies);
    } catch (error) {
      setError('Failed to fetch policies. Please try again later.');
      console.error('Error fetching policies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePolicySelect = (policyId: string) => {
    setSelectedPolicies(prev => {
      if (prev.includes(policyId)) {
        return prev.filter(id => id !== policyId);
      }
      if (prev.length >= 3) {
        return prev;
      }
      return [...prev, policyId];
    });
  };

  const handleCompare = async () => {
    if (selectedPolicies.length < 2) {
      setError('Please select at least 2 policies to compare');
      return;
    }

    try {
      setComparing(true);
      setError(null);
      const results = await policyService.comparePolicies(selectedPolicies);
      setComparisonResults(results);
    } catch (error) {
      setError('Failed to compare policies. Please try again later.');
      console.error('Error comparing policies:', error);
    } finally {
      setComparing(false);
    }
  };

  return (
    <RoleGuard allowedRoles={[UserRole.USER, UserRole.ADMIN, UserRole.INSURER]}>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Policy Comparison</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Spinner />
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {policies.map(policy => (
                <div
                  key={policy.id}
                  className={`p-6 rounded-lg border ${
                    selectedPolicies.includes(policy.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200'
                  } cursor-pointer transition-colors`}
                  onClick={() => handlePolicySelect(policy.id)}
                >
                  <h3 className="text-xl font-semibold mb-2">{policy.type}</h3>
                  <p className="text-gray-600 mb-2">Provider: {policy.provider}</p>
                  <p className="text-gray-600 mb-2">
                    Premium: ${policy.premium.toLocaleString()}
                  </p>
                  <p className="text-gray-600">
                    Coverage: ${policy.coverage.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex justify-center">
              <button
                className={`px-6 py-3 rounded-lg font-semibold ${
                  selectedPolicies.length >= 2
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                } transition-colors`}
                onClick={handleCompare}
                disabled={selectedPolicies.length < 2 || comparing}
              >
                {comparing ? (
                  <span className="flex items-center">
                    <Spinner className="w-5 h-5 mr-2" />
                    Comparing...
                  </span>
                ) : (
                  'Compare Selected Policies'
                )}
              </button>
            </div>

            {comparisonResults.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">
                        Feature
                      </th>
                      {comparisonResults.map(policy => (
                        <th
                          key={policy.id}
                          className="px-6 py-3 text-left text-sm font-semibold text-gray-600"
                        >
                          {policy.provider} - {policy.type}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="px-6 py-4 text-sm text-gray-600">Premium</td>
                      {comparisonResults.map(policy => (
                        <td key={policy.id} className="px-6 py-4 text-sm">
                          ${policy.premium.toLocaleString()}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="px-6 py-4 text-sm text-gray-600">Coverage</td>
                      {comparisonResults.map(policy => (
                        <td key={policy.id} className="px-6 py-4 text-sm">
                          ${policy.coverage.toLocaleString()}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="px-6 py-4 text-sm text-gray-600">Term</td>
                      {comparisonResults.map(policy => (
                        <td key={policy.id} className="px-6 py-4 text-sm">
                          {policy.term} years
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        Claim Settlement Ratio
                      </td>
                      {comparisonResults.map(policy => (
                        <td key={policy.id} className="px-6 py-4 text-sm">
                          {policy.claimSettlementRatio}%
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="px-6 py-4 text-sm text-gray-600">Benefits</td>
                      {comparisonResults.map(policy => (
                        <td key={policy.id} className="px-6 py-4 text-sm">
                          <ul className="list-disc list-inside">
                            {policy.benefits.map((benefit, index) => (
                              <li key={index}>{benefit}</li>
                            ))}
                          </ul>
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="px-6 py-4 text-sm text-gray-600">Add-ons</td>
                      {comparisonResults.map(policy => (
                        <td key={policy.id} className="px-6 py-4 text-sm">
                          <ul className="list-disc list-inside">
                            {policy.addOns.map((addon, index) => (
                              <li key={index}>{addon}</li>
                            ))}
                          </ul>
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        Financial Goals
                      </td>
                      {comparisonResults.map(policy => (
                        <td key={policy.id} className="px-6 py-4 text-sm">
                          <ul className="list-disc list-inside">
                            {policy.financialGoals.map((goal, index) => (
                              <li key={index}>{goal}</li>
                            ))}
                          </ul>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </RoleGuard>
  );
} 