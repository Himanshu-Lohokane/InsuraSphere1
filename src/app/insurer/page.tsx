'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface InsurerStats {
  totalPolicies: number;
  activePolicies: number;
  totalRevenue: number;
  monthlyRevenue: { month: string; amount: number }[];
  policyTypes: { type: string; count: number }[];
  claims: { status: string; count: number }[];
}

export default function InsurerDashboard() {
  const { user, userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<InsurerStats>({
    totalPolicies: 0,
    activePolicies: 0,
    totalRevenue: 0,
    monthlyRevenue: [],
    policyTypes: [],
    claims: [],
  });

  useEffect(() => {
    if (user && userProfile) {
      fetchInsurerStats();
    }
  }, [user, userProfile]);

  const fetchInsurerStats = async () => {
    if (!user) return;

    try {
      setLoading(true);
      // Fetch policies
      const policiesQuery = query(
        collection(db, 'policies'),
        where('insurerId', '==', user.uid)
      );
      const policiesSnapshot = await getDocs(policiesQuery);
      const policies = policiesSnapshot.docs.map(doc => doc.data());

      // Calculate stats
      const activePolicies = policies.filter(policy => policy.status === 'active');
      const totalRevenue = policies.reduce((sum, policy) => sum + (policy.premium || 0), 0);

      // Process monthly revenue
      const monthlyRevenue = processMonthlyRevenue(policies);
      const policyTypes = processPolicyTypes(policies);

      // Fetch and process claims
      const claimsQuery = query(
        collection(db, 'claims'),
        where('insurerId', '==', user.uid)
      );
      const claimsSnapshot = await getDocs(claimsQuery);
      const claims = claimsSnapshot.docs.map(doc => doc.data());
      const claimsStats = processClaims(claims);

      setStats({
        totalPolicies: policies.length,
        activePolicies: activePolicies.length,
        totalRevenue,
        monthlyRevenue,
        policyTypes,
        claims: claimsStats,
      });
    } catch (error) {
      console.error('Error fetching insurer stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const processMonthlyRevenue = (policies: any[]) => {
    // Process monthly revenue logic here
    return [];
  };

  const processPolicyTypes = (policies: any[]) => {
    // Process policy types logic here
    return [];
  };

  const processClaims = (claims: any[]) => {
    // Process claims logic here
    return [];
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Insurer Dashboard</h1>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">Total Policies</h3>
          <p className="mt-2 text-3xl font-bold text-indigo-600">{stats.totalPolicies}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">Active Policies</h3>
          <p className="mt-2 text-3xl font-bold text-indigo-600">{stats.activePolicies}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">Total Revenue</h3>
          <p className="mt-2 text-3xl font-bold text-indigo-600">
            ${stats.totalRevenue.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Revenue</h3>
          <Line
            data={{
              labels: stats.monthlyRevenue.map(item => item.month),
              datasets: [
                {
                  label: 'Revenue',
                  data: stats.monthlyRevenue.map(item => item.amount),
                  borderColor: 'rgb(79, 70, 229)',
                  tension: 0.1,
                },
              ],
            }}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  position: 'top' as const,
                },
              },
            }}
          />
        </div>

        {/* Policy Types Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Policy Distribution</h3>
          <Bar
            data={{
              labels: stats.policyTypes.map(item => item.type),
              datasets: [
                {
                  label: 'Policies',
                  data: stats.policyTypes.map(item => item.count),
                  backgroundColor: 'rgb(79, 70, 229)',
                },
              ],
            }}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  position: 'top' as const,
                },
              },
            }}
          />
        </div>
      </div>
    </div>
  );
} 