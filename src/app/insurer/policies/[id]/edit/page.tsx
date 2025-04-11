'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Policy {
  id: string;
  type: string;
  description: string;
  coverage: number;
  premium: number;
  status: 'active' | 'inactive';
}

export default function EditPolicyPage({ params }: { params: { id: string } }) {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<Policy>({
    id: params.id,
    type: '',
    description: '',
    coverage: 0,
    premium: 0,
    status: 'active',
  });

  useEffect(() => {
    if (user) {
      fetchPolicy();
    }
  }, [user, params.id]);

  const fetchPolicy = async () => {
    try {
      const policyDoc = await getDoc(doc(db, 'policies', params.id));
      if (policyDoc.exists()) {
        const policyData = policyDoc.data() as Policy;
        setFormData({
          ...policyData,
          id: policyDoc.id,
        });
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching policy:', error);
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const policyRef = doc(db, 'policies', params.id);
      await updateDoc(policyRef, {
        type: formData.type,
        description: formData.description,
        coverage: formData.coverage,
        premium: formData.premium,
        status: formData.status,
        updatedAt: new Date().toISOString(),
      });

      router.push('/insurer/policies');
    } catch (error) {
      console.error('Error updating policy:', error);
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'coverage' || name === 'premium' ? parseFloat(value) : value,
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Edit Policy</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="type">Policy Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select policy type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="health">Health Insurance</SelectItem>
                  <SelectItem value="auto">Auto Insurance</SelectItem>
                  <SelectItem value="home">Home Insurance</SelectItem>
                  <SelectItem value="life">Life Insurance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter policy description"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="coverage">Coverage Amount ($)</Label>
              <Input
                type="number"
                id="coverage"
                name="coverage"
                value={formData.coverage}
                onChange={handleChange}
                placeholder="Enter coverage amount"
                required
                min="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="premium">Monthly Premium ($)</Label>
              <Input
                type="number"
                id="premium"
                name="premium"
                value={formData.premium}
                onChange={handleChange}
                placeholder="Enter monthly premium"
                required
                min="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as 'active' | 'inactive' }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
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
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 