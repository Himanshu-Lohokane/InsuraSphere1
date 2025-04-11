'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

interface AnalyticsData {
  totalPolicies: number;
  activePolicies: number;
  totalClaims: number;
  approvedClaims: number;
  rejectedClaims: number;
  monthlyRevenue: number;
  claimsByMonth: { month: string; count: number }[];
  revenueByMonth: { month: string; amount: number }[];
}

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalPolicies: 0,
    activePolicies: 0,
    totalClaims: 0,
    approvedClaims: 0,
    rejectedClaims: 0,
    monthlyRevenue: 0,
    claimsByMonth: [],
    revenueByMonth: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user]);

  const fetchAnalytics = async () => {
    if (!user) return;

    try {
      // Fetch policies
      const policiesQuery = query(
        collection(db, 'policies'),
        where('providerId', '==', user.uid)
      );
      const policiesSnapshot = await getDocs(policiesQuery);
      const policies = policiesSnapshot.docs.map(doc => doc.data());

      // Fetch claims
      const claimsQuery = query(
        collection(db, 'claims'),
        where('providerId', '==', user.uid)
      );
      const claimsSnapshot = await getDocs(claimsQuery);
      const claims = claimsSnapshot.docs.map(doc => doc.data());

      // Calculate monthly data
      const lastSixMonths = Array.from({ length: 6 }, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        return format(date, 'MMM yyyy');
      }).reverse();

      const claimsByMonth = lastSixMonths.map(month => ({
        month,
        count: claims.filter(claim => 
          format(new Date(claim.createdAt), 'MMM yyyy') === month
        ).length,
      }));

      const revenueByMonth = lastSixMonths.map(month => ({
        month,
        amount: policies
          .filter(policy => 
            policy.status === 'active' && 
            format(new Date(policy.createdAt), 'MMM yyyy') === month
          )
          .reduce((sum, policy) => sum + (policy.premium || 0), 0),
      }));

      setAnalytics({
        totalPolicies: policies.length,
        activePolicies: policies.filter(p => p.status === 'active').length,
        totalClaims: claims.length,
        approvedClaims: claims.filter(c => c.status === 'approved').length,
        rejectedClaims: claims.filter(c => c.status === 'rejected').length,
        monthlyRevenue: policies
          .filter(p => p.status === 'active')
          .reduce((sum, p) => sum + (p.premium || 0), 0),
        claimsByMonth,
        revenueByMonth,
      });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching analytics:', error);
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
      <h1 className="text-2xl font-bold">Analytics Dashboard</h1>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Policies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{analytics.totalPolicies}</div>
            <p className="text-sm text-muted-foreground">
              {analytics.activePolicies} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Claims</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{analytics.totalClaims}</div>
            <p className="text-sm text-muted-foreground">
              {analytics.approvedClaims} approved, {analytics.rejectedClaims} rejected
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              ${analytics.monthlyRevenue.toLocaleString()}
            </div>
            <p className="text-sm text-muted-foreground">
              From active policies
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Claims by Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.claimsByMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue by Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.revenueByMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="amount" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 