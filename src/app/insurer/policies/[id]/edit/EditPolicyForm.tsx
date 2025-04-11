'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Policy } from '@/types/policy';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';

interface EditPolicyFormProps {
  policyId: string;
}

export default function EditPolicyForm({ policyId }: EditPolicyFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<Policy>>({
    name: '',
    description: '',
    premium: 0,
    coverage: 0,
    term: 0,
    claimSettlementRatio: 0,
    company: '',
    category: '',
    benefits: [],
    goals: [],
    features: [],
    exclusions: [],
    documents: [],
    flexibility: {
      partialWithdrawal: false,
      topUp: false,
      premiumHoliday: false
    }
  });

  useEffect(() => {
    const fetchPolicy = async () => {
      try {
        const policyDoc = await getDoc(doc(db, 'policies', policyId));
        if (policyDoc.exists()) {
          const policyData = policyDoc.data() as Policy;
          setFormData({
            ...policyData,
            flexibility: policyData.flexibility || {
              partialWithdrawal: false,
              topUp: false,
              premiumHoliday: false
            }
          });
        } else {
          console.error('Policy not found');
          router.push('/dashboard/policies');
        }
      } catch (error) {
        console.error('Error fetching policy:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPolicy();
  }, [policyId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await updateDoc(doc(db, 'policies', policyId), {
        ...formData,
        updatedAt: new Date().toISOString()
      });
      router.push('/dashboard/policies');
    } catch (error) {
      console.error('Error updating policy:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof Policy, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayInput = (field: 'benefits' | 'goals' | 'features' | 'exclusions' | 'documents', value: string) => {
    const items = value.split(',').map(item => item.trim()).filter(Boolean);
    handleChange(field, items);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card className="bg-white shadow-lg">
        <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-900 text-white">
          <CardTitle className="text-2xl">Edit Policy</CardTitle>
          <CardDescription className="text-slate-200">
            Update the insurance policy details
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-slate-800">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-base font-medium text-slate-900">Policy Name</Label>
                  <Input
                    required
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="Enter policy name"
                    className="bg-white text-slate-900 placeholder:text-slate-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-base font-medium text-slate-900">Insurance Company</Label>
                  <Input
                    required
                    value={formData.company}
                    onChange={(e) => handleChange('company', e.target.value)}
                    placeholder="Enter insurance company name"
                    className="bg-white text-slate-900 placeholder:text-slate-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-base font-medium text-slate-900">Category</Label>
                  <Input
                    required
                    value={formData.category}
                    onChange={(e) => handleChange('category', e.target.value)}
                    placeholder="e.g., Life, Health, Term"
                    className="bg-white text-slate-900 placeholder:text-slate-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-base font-medium text-slate-900">Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="Enter policy description"
                    className="bg-white text-slate-900 placeholder:text-slate-400"
                  />
                </div>
              </div>
            </div>

            {/* Financial Details */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-slate-800">Financial Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-base font-medium text-slate-900">Premium (₹/year)</Label>
                  <Input
                    type="number"
                    required
                    value={formData.premium?.toString()}
                    onChange={(e) => handleChange('premium', Number(e.target.value))}
                    placeholder="Enter annual premium"
                    className="bg-white text-slate-900 placeholder:text-slate-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-base font-medium text-slate-900">Coverage Amount (₹)</Label>
                  <Input
                    type="number"
                    required
                    value={formData.coverage?.toString()}
                    onChange={(e) => handleChange('coverage', Number(e.target.value))}
                    placeholder="Enter coverage amount"
                    className="bg-white text-slate-900 placeholder:text-slate-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-base font-medium text-slate-900">Term (years)</Label>
                  <Input
                    type="number"
                    required
                    value={formData.term?.toString()}
                    onChange={(e) => handleChange('term', Number(e.target.value))}
                    placeholder="Enter policy term"
                    className="bg-white text-slate-900 placeholder:text-slate-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-base font-medium text-slate-900">Claim Settlement Ratio (%)</Label>
                  <Input
                    type="number"
                    required
                    min="0"
                    max="100"
                    value={formData.claimSettlementRatio?.toString()}
                    onChange={(e) => handleChange('claimSettlementRatio', Number(e.target.value))}
                    placeholder="Enter claim settlement ratio"
                    className="bg-white text-slate-900 placeholder:text-slate-400"
                  />
                </div>
              </div>
            </div>

            {/* Benefits and Features */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-slate-800">Benefits and Features</h3>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label className="text-base font-medium text-slate-900">Benefits (comma-separated)</Label>
                  <Textarea
                    value={formData.benefits?.join(', ')}
                    onChange={(e) => handleArrayInput('benefits', e.target.value)}
                    placeholder="Enter benefits, separated by commas"
                    className="bg-white text-slate-900 placeholder:text-slate-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-base font-medium text-slate-900">Financial Goals (comma-separated)</Label>
                  <Textarea
                    value={formData.goals?.join(', ')}
                    onChange={(e) => handleArrayInput('goals', e.target.value)}
                    placeholder="Enter financial goals, separated by commas"
                    className="bg-white text-slate-900 placeholder:text-slate-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-base font-medium text-slate-900">Features (comma-separated)</Label>
                  <Textarea
                    value={formData.features?.join(', ')}
                    onChange={(e) => handleArrayInput('features', e.target.value)}
                    placeholder="Enter features, separated by commas"
                    className="bg-white text-slate-900 placeholder:text-slate-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-base font-medium text-slate-900">Exclusions (comma-separated)</Label>
                  <Textarea
                    value={formData.exclusions?.join(', ')}
                    onChange={(e) => handleArrayInput('exclusions', e.target.value)}
                    placeholder="Enter exclusions, separated by commas"
                    className="bg-white text-slate-900 placeholder:text-slate-400"
                  />
                </div>
              </div>
            </div>

            {/* Flexibility Options */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-slate-800">Flexibility Options</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-slate-200">
                  <Label className="text-base font-medium text-slate-900">Partial Withdrawal</Label>
                  <Switch
                    checked={formData.flexibility?.partialWithdrawal}
                    onCheckedChange={(checked) => 
                      handleChange('flexibility', { ...formData.flexibility, partialWithdrawal: checked })}
                  />
                </div>
                <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-slate-200">
                  <Label className="text-base font-medium text-slate-900">Top-up Option</Label>
                  <Switch
                    checked={formData.flexibility?.topUp}
                    onCheckedChange={(checked) => 
                      handleChange('flexibility', { ...formData.flexibility, topUp: checked })}
                  />
                </div>
                <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-slate-200">
                  <Label className="text-base font-medium text-slate-900">Premium Holiday</Label>
                  <Switch
                    checked={formData.flexibility?.premiumHoliday}
                    onCheckedChange={(checked) => 
                      handleChange('flexibility', { ...formData.flexibility, premiumHoliday: checked })}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={saving}
                className="border-slate-300 text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={saving}
                className="bg-slate-800 hover:bg-slate-700 text-white"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 