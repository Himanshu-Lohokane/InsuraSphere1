'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Upload, AlertCircle, Clock, CheckCircle, XCircle } from 'lucide-react';
import { ClaimService, Claim, ClaimSubmission } from '@/lib/services/claimService';
import { UserPolicyService, UserPolicy } from '@/lib/services/userPolicyService';
import { toast } from 'sonner';

const CLAIM_REASONS = [
  'Medical Expenses',
  'Accident',
  'Critical Illness',
  'Hospitalization',
  'Death',
  'Property Damage',
  'Vehicle Damage',
  'Other'
];

export default function ClaimsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [policy, setPolicy] = useState<UserPolicy | null>(null);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<Omit<ClaimSubmission, 'policyId' | 'policyNumber'>>({
    claimAmount: 0,
    reason: '',
    description: '',
    documents: []
  });

  useEffect(() => {
    const fetchPolicyAndClaims = async () => {
      if (!user?.uid || !params.id) return;

      try {
        setLoading(true);
        // Fetch policy details
        const userPolicies = await UserPolicyService.getUserPolicies(user.uid);
        const currentPolicy = userPolicies.find(p => p.id === params.id);
        if (currentPolicy) {
          setPolicy(currentPolicy);
          // Fetch claims for this policy
          const policyClaims = await ClaimService.getPolicyClaims(params.id as string);
          setClaims(policyClaims);
        }
      } catch (error) {
        console.error('Error fetching policy and claims:', error);
        toast.error('Failed to load policy details');
      } finally {
        setLoading(false);
      }
    };

    fetchPolicyAndClaims();
  }, [user?.uid, params.id]);

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid || !policy) return;

    try {
      setSubmitting(true);
      const claimData: ClaimSubmission = {
        ...formData,
        policyId: policy.id,
        policyNumber: policy.policyNumber
      };

      await ClaimService.submitClaim(user.uid, claimData);
      toast.success('Claim submitted successfully');
      
      // Redirect to insurer claims page with updated route
      router.push('/insurer/claims');
    } catch (error) {
      console.error('Error submitting claim:', error);
      toast.error('Failed to submit claim');
    } finally {
      setSubmitting(false);
    }
  };

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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (!policy) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Policy not found</h3>
        <Button
          onClick={() => router.back()}
          className="mt-4"
          variant="outline"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">File a Claim</h1>
          <p className="text-gray-600">{policy.name} - {policy.policyNumber}</p>
        </div>
        <Button
          onClick={() => router.back()}
          variant="outline"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Policy
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Claim Form */}
        <div className="lg:col-span-2">
          <Card className="bg-[#1a1f2e] border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">New Claim</CardTitle>
              <CardDescription className="text-gray-400">Fill in the details to submit your claim</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="reason" className="text-gray-200">Reason for Claim</Label>
                    <Select
                      value={formData.reason}
                      onValueChange={(value) => handleInputChange('reason', value)}
                    >
                      <SelectTrigger className="bg-[#1a1f2e] text-white border-gray-700">
                        <SelectValue placeholder="Select reason" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a1f2e] border-gray-700">
                        {CLAIM_REASONS.map(reason => (
                          <SelectItem 
                            key={reason} 
                            value={reason}
                            className="text-gray-200 hover:bg-blue-600 focus:bg-blue-600 cursor-pointer"
                          >
                            {reason}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="claimAmount" className="text-gray-200">Claim Amount</Label>
                    <Input
                      id="claimAmount"
                      type="number"
                      value={formData.claimAmount}
                      onChange={(e) => handleInputChange('claimAmount', Number(e.target.value))}
                      min={0}
                      max={policy.coverage}
                      required
                      className="bg-[#1a1f2e] text-white border-gray-700 focus:border-blue-500"
                    />
                    <p className="text-sm text-gray-400 mt-1">
                      Maximum coverage: {formatCurrency(policy.coverage)}
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="description" className="text-gray-200">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      required
                      className="w-full h-32 bg-[#1a1f2e] text-white border-gray-700 focus:border-blue-500"
                      placeholder="Provide detailed information about your claim..."
                    />
                  </div>

                  <div>
                    <Label className="text-gray-200">Supporting Documents</Label>
                    <div className="mt-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        className="w-full border-gray-700 text-gray-200 hover:bg-blue-600 hover:text-white"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Documents
                      </Button>
                      <p className="text-sm text-gray-400 mt-1">
                        Upload relevant documents (bills, reports, etc.)
                      </p>
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={submitting}
                >
                  {submitting ? 'Submitting...' : 'Submit Claim'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Claims History */}
        <div>
          <Card className="bg-[#1a1f2e] border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Claims History</CardTitle>
              <CardDescription className="text-gray-400">Previous claims for this policy</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {claims.length === 0 ? (
                  <p className="text-gray-400 text-center py-4">No claims filed yet</p>
                ) : (
                  claims.map((claim) => (
                    <div
                      key={claim.id}
                      className="p-4 rounded-lg border border-gray-700 space-y-2 bg-[#232838]"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-white">{claim.reason}</span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                          ${claim.status === 'approved' ? 'bg-green-900 text-green-200' :
                            claim.status === 'rejected' ? 'bg-red-900 text-red-200' :
                            claim.status === 'in-review' ? 'bg-yellow-900 text-yellow-200' :
                            'bg-blue-900 text-blue-200'}`}>
                          {claim.status.charAt(0).toUpperCase() + claim.status.slice(1)}
                        </span>
                      </div>
                      <div className="text-sm text-gray-400">
                        Amount: {formatCurrency(claim.claimAmount)}
                      </div>
                      <div className="text-sm text-gray-400">
                        Submitted: {formatDate(claim.submissionDate)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 