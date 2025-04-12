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
  ArcElement,
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface AnalyticsData {
  totalPolicies: number;
  activePolicies: number;
  totalRevenue: number;
  monthlyRevenue: { month: string; amount: number }[];
  policyTypes: { type: string; count: number }[];
  userBehavior: {
    searchTerms: { term: string; count: number }[];
    popularFeatures: { feature: string; count: number }[];
  };
}

export default function Analytics() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');

  useEffect(() => {
    fetchAnalytics();
  }, [user, timeRange]);

  const fetchAnalytics = async () => {
    if (!user) return;

    try {
      setLoading(true);
      // Fetch policies
      const policiesQuery = query(
        collection(db, 'policies'),
        where('insurerId', '==', user.uid)
      );
      const policiesSnapshot = await getDocs(policiesQuery);
      
      // Fetch user behavior data
      const behaviorQuery = query(
        collection(db, 'userBehavior'),
        where('insurerId', '==', user.uid)
      );
      const behaviorSnapshot = await getDocs(behaviorQuery);

      // Process data
      const analyticsData: AnalyticsData = {
        totalPolicies: policiesSnapshot.size,
        activePolicies: policiesSnapshot.docs.filter(doc => doc.data().status === 'active').length,
        totalRevenue: policiesSnapshot.docs.reduce((sum, doc) => sum + doc.data().premium, 0),
        monthlyRevenue: processMonthlyRevenue(policiesSnapshot.docs),
        policyTypes: processPolicyTypes(policiesSnapshot.docs),
        userBehavior: {
          searchTerms: processSearchTerms(behaviorSnapshot.docs),
          popularFeatures: processPopularFeatures(behaviorSnapshot.docs),
        },
      };

      setData(analyticsData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const processMonthlyRevenue = (docs: any[]) => {
    // Implementation for processing monthly revenue data
    return [];
  };

  const processPolicyTypes = (docs: any[]) => {
    // Implementation for processing policy types data
    return [];
  };

  const processSearchTerms = (docs: any[]) => {
    // Implementation for processing search terms data
    return [];
  };

  const processPopularFeatures = (docs: any[]) => {
    // Implementation for processing popular features data
    return [];
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
        <h1 className="text-2xl font-semibold text-gray-900">Analytics Dashboard</h1>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value as 'week' | 'month' | 'year')}
          className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        >
          <option value="week">Last Week</option>
          <option value="month">Last Month</option>
          <option value="year">Last Year</option>
        </select>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Policies</dt>
                  <dd className="text-lg font-medium text-gray-900">{data?.totalPolicies}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Active Policies</dt>
                  <dd className="text-lg font-medium text-gray-900">{data?.activePolicies}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Revenue</dt>
                  <dd className="text-lg font-medium text-gray-900">₹{data?.totalRevenue.toLocaleString()}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Monthly Revenue</h2>
          <Line
            data={{
              labels: data?.monthlyRevenue.map(item => item.month) || [],
              datasets: [
                {
                  label: 'Revenue',
                  data: data?.monthlyRevenue.map(item => item.amount) || [],
                  borderColor: 'rgb(99, 102, 241)',
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

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Policy Types Distribution</h2>
          <Pie
            data={{
              labels: data?.policyTypes.map(item => item.type) || [],
              datasets: [
                {
                  data: data?.policyTypes.map(item => item.count) || [],
                  backgroundColor: [
                    'rgb(99, 102, 241)',
                    'rgb(59, 130, 246)',
                    'rgb(16, 185, 129)',
                    'rgb(245, 158, 11)',
                  ],
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

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Popular Search Terms</h2>
          <Bar
            data={{
              labels: data?.userBehavior.searchTerms.map(item => item.term) || [],
              datasets: [
                {
                  label: 'Search Count',
                  data: data?.userBehavior.searchTerms.map(item => item.count) || [],
                  backgroundColor: 'rgb(99, 102, 241)',
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

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Popular Features</h2>
          <Bar
            data={{
              labels: data?.userBehavior.popularFeatures.map(item => item.feature) || [],
              datasets: [
                {
                  label: 'Feature Count',
                  data: data?.userBehavior.popularFeatures.map(item => item.count) || [],
                  backgroundColor: 'rgb(16, 185, 129)',
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