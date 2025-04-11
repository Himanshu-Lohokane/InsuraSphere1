'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Policy } from '@/types/policy';

export default function NewPolicy() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [policy, setPolicy] = useState<Partial<Policy>>({
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const docRef = await addDoc(collection(db, 'policies'), {
        ...policy,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      router.push('/dashboard/policies');
    } catch (error) {
      console.error('Error adding policy:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof Policy, value: any) => {
    setPolicy(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayInput = (field: 'benefits' | 'goals' | 'features' | 'exclusions' | 'documents', value: string) => {
    const items = value.split(',').map(item => item.trim()).filter(Boolean);
    handleChange(field, items);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card className="bg-white shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
          <CardTitle>Add New Policy</CardTitle>
          <CardDescription className="text-blue-100">
            Enter the details of the new insurance policy
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Policy Name</Label>
                  <Input
                    required
                    value={policy.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="Enter policy name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Insurance Company</Label>
                  <Input
                    required
                    value={policy.company}
                    onChange={(e) => handleChange('company', e.target.value)}
                    placeholder="Enter insurance company name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Input
                    required
                    value={policy.category}
                    onChange={(e) => handleChange('category', e.target.value)}
                    placeholder="e.g., Life, Health, Term"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={policy.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="Enter policy description"
                  />
                </div>
              </div>
            </div>

            {/* Financial Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Financial Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Premium (₹/year)</Label>
                  <Input
                    type="number"
                    required
                    value={policy.premium}
                    onChange={(e) => handleChange('premium', Number(e.target.value))}
                    placeholder="Enter annual premium"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Coverage Amount (₹)</Label>
                  <Input
                    type="number"
                    required
                    value={policy.coverage}
                    onChange={(e) => handleChange('coverage', Number(e.target.value))}
                    placeholder="Enter coverage amount"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Term (years)</Label>
                  <Input
                    type="number"
                    required
                    value={policy.term}
                    onChange={(e) => handleChange('term', Number(e.target.value))}
                    placeholder="Enter policy term"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Claim Settlement Ratio (%)</Label>
                  <Input
                    type="number"
                    required
                    min="0"
                    max="100"
                    value={policy.claimSettlementRatio}
                    onChange={(e) => handleChange('claimSettlementRatio', Number(e.target.value))}
                    placeholder="Enter claim settlement ratio"
                  />
                </div>
              </div>
            </div>

            {/* Benefits and Features */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Benefits and Features</h3>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label>Benefits (comma-separated)</Label>
                  <Textarea
                    value={policy.benefits?.join(', ')}
                    onChange={(e) => handleArrayInput('benefits', e.target.value)}
                    placeholder="Enter benefits, separated by commas"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Financial Goals (comma-separated)</Label>
                  <Textarea
                    value={policy.goals?.join(', ')}
                    onChange={(e) => handleArrayInput('goals', e.target.value)}
                    placeholder="Enter financial goals, separated by commas"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Features (comma-separated)</Label>
                  <Textarea
                    value={policy.features?.join(', ')}
                    onChange={(e) => handleArrayInput('features', e.target.value)}
                    placeholder="Enter features, separated by commas"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Exclusions (comma-separated)</Label>
                  <Textarea
                    value={policy.exclusions?.join(', ')}
                    onChange={(e) => handleArrayInput('exclusions', e.target.value)}
                    placeholder="Enter exclusions, separated by commas"
                  />
                </div>
              </div>
            </div>

            {/* Flexibility Options */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Flexibility Options</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <Label>Partial Withdrawal</Label>
                  <Switch
                    checked={policy.flexibility?.partialWithdrawal}
                    onCheckedChange={(checked) => 
                      handleChange('flexibility', { ...policy.flexibility, partialWithdrawal: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Top-up Option</Label>
                  <Switch
                    checked={policy.flexibility?.topUp}
                    onCheckedChange={(checked) => 
                      handleChange('flexibility', { ...policy.flexibility, topUp: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Premium Holiday</Label>
                  <Switch
                    checked={policy.flexibility?.premiumHoliday}
                    onCheckedChange={(checked) => 
                      handleChange('flexibility', { ...policy.flexibility, premiumHoliday: checked })}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Policy'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 