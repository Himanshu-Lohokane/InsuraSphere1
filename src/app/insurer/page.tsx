'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartBarIcon, DocumentTextIcon, ClockIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

interface InsurerStats {
  totalPolicies: number;
  activePolicies: number;
  pendingClaims: number;
  monthlyRevenue: number;
}

interface Policy {
  id: string;
  type: string;
  provider: string;
  description: string;
  coverage: number;
  premium: number;
  status: 'active' | 'inactive';
  createdAt: string;
}

export default function InsurerDashboard() {
  const { user, userProfile } = useAuth();
  const [stats, setStats] = useState<InsurerStats>({
    totalPolicies: 0,
    activePolicies: 0,
    pendingClaims: 0,
    monthlyRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentPolicies, setRecentPolicies] = useState<Policy[]>([]);

  useEffect(() => {
    if (user && userProfile) {
      fetchInsurerStats();
      fetchRecentPolicies();
    }
  }, [user, userProfile]);

  const fetchInsurerStats = async () => {
    if (!user) return;

    try {
      // Fetch policies
      const policiesQuery = query(
        collection(db, 'policies'),
        where('providerId', '==', user.uid)
      );
      const policiesSnapshot = await getDocs(policiesQuery);
      const policies = policiesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Fetch claims
      const claimsQuery = query(
        collection(db, 'claims'),
        where('providerId', '==', user.uid),
        where('status', '==', 'pending')
      );
      const claimsSnapshot = await getDocs(claimsQuery);

      // Calculate stats
      const activePolicies = policies.filter(p => p.status === 'active');
      const monthlyRevenue = activePolicies.reduce((sum, policy) => sum + (policy.premium || 0), 0);

      setStats({
        totalPolicies: policies.length,
        activePolicies: activePolicies.length,
        pendingClaims: claimsSnapshot.size,
        monthlyRevenue,
      });
    } catch (error) {
      console.error('Error fetching insurer stats:', error);
    }
  };

  const fetchRecentPolicies = async () => {
    if (!user) return;

    try {
      const policiesQuery = query(
        collection(db, 'policies'),
        where('providerId', '==', user.uid)
      );
      const snapshot = await getDocs(policiesQuery);
      const policies = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Policy[];

      setRecentPolicies(policies.slice(0, 5));
      setLoading(false);
    } catch (error) {
      console.error('Error fetching recent policies:', error);
      setLoading(false);
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
        <h1 className="text-2xl font-bold">Insurer Dashboard</h1>
        <Button asChild>
          <Link href="/insurer/policies/new">Add New Policy</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Policies Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Policies</CardTitle>
            <DocumentTextIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPolicies}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activePolicies} active
            </p>
          </CardContent>
        </Card>

        {/* Pending Claims Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Claims</CardTitle>
            <ClockIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingClaims}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting review
            </p>
          </CardContent>
        </Card>

        {/* Monthly Revenue Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <ChartBarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.monthlyRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              From active policies
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Policies */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Policies</CardTitle>
          <CardDescription>Your recently added insurance policies</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {recentPolicies.map((policy) => (
              <div key={policy.id} className="flex items-center">
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">{policy.type}</p>
                  <p className="text-sm text-muted-foreground">
                    Premium: ${policy.premium}/month
                  </p>
                </div>
                <div className="ml-auto font-medium">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    policy.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {policy.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Link href="/insurer/policies">
          <Card className="hover:bg-gray-50 transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle>Manage Policies</CardTitle>
              <CardDescription>View and manage all your insurance policies</CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/insurer/claims">
          <Card className="hover:bg-gray-50 transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle>Review Claims</CardTitle>
              <CardDescription>Process and manage insurance claims</CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/insurer/analytics">
          <Card className="hover:bg-gray-50 transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle>Analytics</CardTitle>
              <CardDescription>View detailed analytics and reports</CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  );
} 