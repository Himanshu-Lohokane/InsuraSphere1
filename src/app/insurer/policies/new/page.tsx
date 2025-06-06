'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';

export default function NewPolicyPage() {
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    premium: '',
    coverage: '',
    term: '',
    claimSettlementRatio: '',
    company: '',
    category: '',
    benefits: [] as string[],
    goals: [] as string[],
    features: [] as string[],
    exclusions: [] as string[],
    documents: [] as string[],
    flexibility: {
      partialWithdrawal: false,
      topUp: false,
      premiumHoliday: false
    },
    status: 'active'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'policies'), {
        ...formData,
        providerId: user.uid,
        provider: userProfile?.companyName || userProfile?.name || 'Unknown Provider',
        premium: parseFloat(formData.premium) || 0,
        coverage: parseFloat(formData.coverage) || 0,
        term: parseFloat(formData.term) || 0,
        claimSettlementRatio: parseFloat(formData.claimSettlementRatio) || 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      router.push('/insurer/policies');
    } catch (error) {
      console.error('Error creating policy:', error);
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayInput = (field: 'benefits' | 'goals' | 'features' | 'exclusions' | 'documents', value: string) => {
    const items = value.split(',').map(item => item.trim()).filter(Boolean);
    handleChange(field, items);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card className="bg-white shadow-lg">
        <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-900 text-white">
          <CardTitle className="text-2xl">Create New Policy</CardTitle>
          <CardDescription className="text-slate-200">
            Add a new insurance policy to your portfolio
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
                    value={formData.premium}
                    onChange={(e) => handleChange('premium', e.target.value)}
                    placeholder="Enter annual premium"
                    className="bg-white text-slate-900 placeholder:text-slate-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-base font-medium text-slate-900">Coverage Amount (₹)</Label>
                  <Input
                    type="number"
                    required
                    value={formData.coverage}
                    onChange={(e) => handleChange('coverage', e.target.value)}
                    placeholder="Enter coverage amount"
                    className="bg-white text-slate-900 placeholder:text-slate-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-base font-medium text-slate-900">Term (years)</Label>
                  <Input
                    type="number"
                    required
                    value={formData.term}
                    onChange={(e) => handleChange('term', e.target.value)}
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
                    value={formData.claimSettlementRatio}
                    onChange={(e) => handleChange('claimSettlementRatio', e.target.value)}
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
                    value={formData.benefits.join(', ')}
                    onChange={(e) => handleArrayInput('benefits', e.target.value)}
                    placeholder="Enter benefits, separated by commas"
                    className="bg-white text-slate-900 placeholder:text-slate-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-base font-medium text-slate-900">Financial Goals (comma-separated)</Label>
                  <Textarea
                    value={formData.goals.join(', ')}
                    onChange={(e) => handleArrayInput('goals', e.target.value)}
                    placeholder="Enter financial goals, separated by commas"
                    className="bg-white text-slate-900 placeholder:text-slate-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-base font-medium text-slate-900">Features (comma-separated)</Label>
                  <Textarea
                    value={formData.features.join(', ')}
                    onChange={(e) => handleArrayInput('features', e.target.value)}
                    placeholder="Enter features, separated by commas"
                    className="bg-white text-slate-900 placeholder:text-slate-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-base font-medium text-slate-900">Exclusions (comma-separated)</Label>
                  <Textarea
                    value={formData.exclusions.join(', ')}
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
                    checked={formData.flexibility.partialWithdrawal}
                    onCheckedChange={(checked) => 
                      handleChange('flexibility', { ...formData.flexibility, partialWithdrawal: checked })}
                  />
                </div>
                <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-slate-200">
                  <Label className="text-base font-medium text-slate-900">Top-up Option</Label>
                  <Switch
                    checked={formData.flexibility.topUp}
                    onCheckedChange={(checked) => 
                      handleChange('flexibility', { ...formData.flexibility, topUp: checked })}
                  />
                </div>
                <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-slate-200">
                  <Label className="text-base font-medium text-slate-900">Premium Holiday</Label>
                  <Switch
                    checked={formData.flexibility.premiumHoliday}
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
                disabled={loading}
                className="border-slate-300 text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={loading}
                className="bg-slate-800 hover:bg-slate-700 text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  'Create Policy'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 