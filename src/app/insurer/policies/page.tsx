'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

interface Policy {
  id: string;
  category: string;
  provider: string;
  description: string;
  coverage: number;
  premium: number;
  status: 'active' | 'inactive';
  createdAt: string;
}

export default function PoliciesPage() {
  const { user } = useAuth();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchPolicies();
    }
  }, [user]);

  const fetchPolicies = async () => {
    if (!user) return;

    try {
      const policiesQuery = query(
        collection(db, 'policies'),
        where('providerId', '==', user.uid)
      );
      const snapshot = await getDocs(policiesQuery);
      const policiesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Policy[];

      setPolicies(policiesData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching policies:', error);
      setLoading(false);
    }
  };

  const handleDeletePolicy = async (policyId: string) => {
    if (!confirm('Are you sure you want to delete this policy?')) return;

    try {
      await deleteDoc(doc(db, 'policies', policyId));
      setPolicies(policies.filter(policy => policy.id !== policyId));
    } catch (error) {
      console.error('Error deleting policy:', error);
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Manage Policies</h1>
        <Button asChild>
          <Link href="/insurer/policies/new">Add New Policy</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Policies</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Coverage</TableHead>
                <TableHead>Premium</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {policies.map((policy) => (
                <TableRow key={policy.id}>
                  <TableCell className="font-medium">{policy.category}</TableCell>
                  <TableCell>{policy.description}</TableCell>
                  <TableCell>₹{policy.coverage.toLocaleString()}</TableCell>
                  <TableCell>₹{policy.premium.toLocaleString()}/month</TableCell>
                  <TableCell>
                    <Badge variant={policy.status === 'active' ? 'default' : 'secondary'}>
                      {policy.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/insurer/policies/${policy.id}/edit`}>
                          <PencilIcon className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeletePolicy(policy.id)}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}