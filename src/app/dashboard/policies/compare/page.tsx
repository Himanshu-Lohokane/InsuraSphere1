'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { collection, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Policy } from '@/types/policy';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export default function PolicyComparison() {
  const searchParams = useSearchParams();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);

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

        setPolicies(policiesData.filter((p): p is Policy => p !== null));
      } catch (error) {
        console.error('Error fetching policies:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPolicies();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
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
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Policy Comparison</h1>

      <div className="grid grid-cols-1 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-[200px_repeat(auto-fit,minmax(200px,1fr))] gap-4">
              <div className="font-medium text-gray-500">Provider</div>
              {policies.map(policy => (
                <div key={`${policy.id}-provider`} className="font-medium">
                  {policy.provider}
                </div>
              ))}

              <div className="font-medium text-gray-500">Type</div>
              {policies.map(policy => (
                <div key={`${policy.id}-type`}>{policy.type}</div>
              ))}

              <div className="font-medium text-gray-500">Premium</div>
              {policies.map(policy => (
                <div key={`${policy.id}-premium`} className="text-green-600 font-medium">
                  {formatCurrency(policy.premium)}/year
                </div>
              ))}

              <div className="font-medium text-gray-500">Coverage</div>
              {policies.map(policy => (
                <div key={`${policy.id}-coverage`} className="font-medium">
                  {formatCurrency(policy.coverage)}
                </div>
              ))}

              {policies.some(p => p.term) && (
                <>
                  <div className="font-medium text-gray-500">Term</div>
                  {policies.map(policy => (
                    <div key={`${policy.id}-term`}>
                      {policy.term ? `${policy.term} years` : 'N/A'}
                    </div>
                  ))}
                </>
              )}

              {policies.some(p => p.claimSettlementRatio) && (
                <>
                  <div className="font-medium text-gray-500">Claim Settlement Ratio</div>
                  {policies.map(policy => (
                    <div key={`${policy.id}-csr`}>
                      {policy.claimSettlementRatio ? `${policy.claimSettlementRatio}%` : 'N/A'}
                    </div>
                  ))}
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Benefits */}
        <Card>
          <CardHeader>
            <CardTitle>Benefits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-[200px_repeat(auto-fit,minmax(200px,1fr))] gap-4">
              <div className="font-medium text-gray-500">Key Benefits</div>
              {policies.map(policy => (
                <div key={`${policy.id}-benefits`} className="space-y-2">
                  {policy.benefits.map(benefit => (
                    <Badge key={benefit} variant="secondary">
                      {benefit}
                    </Badge>
                  ))}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Goals */}
        {policies.some(p => p.goals && p.goals.length > 0) && (
          <Card>
            <CardHeader>
              <CardTitle>Financial Goals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-[200px_repeat(auto-fit,minmax(200px,1fr))] gap-4">
                <div className="font-medium text-gray-500">Supported Goals</div>
                {policies.map(policy => (
                  <div key={`${policy.id}-goals`} className="space-y-2">
                    {policy.goals?.map(goal => (
                      <Badge key={goal} variant="outline">
                        {goal}
                      </Badge>
                    ))}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 