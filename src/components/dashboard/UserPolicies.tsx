import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Calendar, AlertCircle } from 'lucide-react';
import { UserPolicy, UserPolicyService } from '@/lib/services/userPolicyService';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function UserPolicies() {
  const [policies, setPolicies] = useState<UserPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const fetchUserPolicies = async () => {
      if (!user?.uid) return;
      
      try {
        setLoading(true);
        const userPolicies = await UserPolicyService.getUserPolicies(user.uid);
        setPolicies(userPolicies);
      } catch (error) {
        console.error('Error fetching user policies:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserPolicies();
  }, [user?.uid]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Policies</CardTitle>
          <CardDescription>Loading your insurance policies...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (policies.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Policies</CardTitle>
          <CardDescription>Get started with your first insurance policy</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No policies yet</h3>
            <p className="text-gray-500 mb-4">
              Get started by exploring our recommended policies tailored for you.
            </p>
            <Button
              onClick={() => router.push('/dashboard/policies/recommendations')}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Explore Policies
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-2xl">Your Policies</CardTitle>
            <CardDescription>Manage your active insurance policies</CardDescription>
          </div>
          <Button
            onClick={() => router.push('/dashboard/policies/recommendations')}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Add New Policy
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-6">
          {policies.map((policy) => (
            <div
              key={policy.id}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:border-blue-500 transition-colors shadow-sm hover:shadow-md"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{policy.name}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-600">Policy #</span>
                    <span className="text-sm font-semibold text-blue-600">{policy.policyNumber}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(policy.premium)}
                  </p>
                  <p className="text-sm font-medium text-gray-600">per year</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mt-6">
                <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-4">
                  <Calendar className="h-6 w-6 text-blue-500" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900 mb-1">Next Payment</p>
                    <p className="text-base font-medium text-blue-600">{formatDate(policy.nextPaymentDate)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-4">
                  <Shield className="h-6 w-6 text-green-500" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900 mb-1">Status</p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium
                      ${policy.status === 'active' ? 'bg-green-100 text-green-800' :
                        policy.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'}`}>
                      {policy.status.charAt(0).toUpperCase() + policy.status.slice(1)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-blue-500" />
                  <span className="text-sm font-medium text-gray-600">
                    Coverage: {formatCurrency(policy.coverage)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/dashboard/policies/${policy.id}/claims`)}
                    className="border-blue-200 text-blue-700 hover:bg-blue-50"
                  >
                    File Claim
                  </Button>
                  <Button
                    onClick={() => router.push(`/dashboard/policies/${policy.id}`)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    View Details
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 