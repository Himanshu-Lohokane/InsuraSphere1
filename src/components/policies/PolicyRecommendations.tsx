import { Policy } from '@/lib/policyComparison';
import { useRouter } from 'next/navigation';

interface PolicyRecommendationsProps {
  recommendations: Policy[];
  onCompare: (policyIds: string[]) => void;
}

export default function PolicyRecommendations({
  recommendations,
  onCompare
}: PolicyRecommendationsProps) {
  const router = useRouter();
  const [selectedPolicies, setSelectedPolicies] = useState<string[]>([]);

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
      onCompare(selectedPolicies);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-900">Recommended for You</h2>
        {selectedPolicies.length >= 2 && (
          <button
            onClick={handleCompare}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Compare Selected ({selectedPolicies.length})
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {recommendations.map(policy => (
          <div
            key={policy.id}
            className={`bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow duration-300 ${
              selectedPolicies.includes(policy.id) ? 'ring-2 ring-indigo-500' : ''
            }`}
          >
            <div className="p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">{policy.provider}</h3>
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Best Match
                  </span>
                  <input
                    type="checkbox"
                    checked={selectedPolicies.includes(policy.id)}
                    onChange={() => handlePolicySelect(policy.id)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                </div>
              </div>
              <p className="mt-1 text-sm text-gray-500">{policy.type} Insurance</p>
              <div className="mt-4">
                <p className="text-2xl font-semibold text-indigo-600">
                  ₹{policy.premium.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500">per year</p>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex items-center text-sm text-gray-500">
                  <svg className="h-5 w-5 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Coverage: ₹{policy.coverage.toLocaleString()}
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <svg className="h-5 w-5 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Term: {policy.term} years
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <svg className="h-5 w-5 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Claim Ratio: {policy.claimSettlementRatio}%
                </div>
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
  );
} 