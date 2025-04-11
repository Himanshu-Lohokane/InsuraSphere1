'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import {
  ChartBarIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

interface Policy {
  id: string;
  type: string;
  status: 'active' | 'pending' | 'expired';
  provider: string;
  premium: number;
  startDate: string;
  endDate: string;
}

interface Recommendation {
  id: string;
  type: string;
  provider: string;
  description: string;
  matchScore: number;
}

export default function Dashboard() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('Dashboard mount/update:', {
      authLoading,
      user: user?.email,
      userProfile: userProfile?.role,
      loading
    });

    const loadData = async () => {
      if (!user || !userProfile) {
        console.log('No user or profile, skipping data load');
        return;
      }
      
      if (userProfile.role !== 'user') {
        console.log('Not a user role, skipping data load');
        return;
      }
      
      try {
        console.log('Starting data fetch...');
        setLoading(true);
        setError(null);
        
        // Fetch policies
        const policiesQuery = query(
          collection(db, 'policies'),
          where('userId', '==', user.uid)
        );
        const policiesSnapshot = await getDocs(policiesQuery);
        const policiesData = policiesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Policy[];
        console.log('Policies loaded:', policiesData.length);
        setPolicies(policiesData);

        // Fetch recommendations
        const recommendationsQuery = query(
          collection(db, 'recommendations'),
          where('userId', '==', user.uid)
        );
        const recommendationsSnapshot = await getDocs(recommendationsQuery);
        const recommendationsData = recommendationsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Recommendation[];
        console.log('Recommendations loaded:', recommendationsData.length);
        setRecommendations(recommendationsData);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error instanceof Error ? error.message : 'An error occurred while fetching data');
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      console.log('Auth ready, loading data...');
      loadData();
    }
  }, [user, userProfile, authLoading]);

  // Show loading state while auth is being checked
  if (authLoading) {
    console.log('Showing auth loading state');
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        <span className="ml-3">Checking authentication...</span>
      </div>
    );
  }

  // Show auth state messages
  if (!user || !userProfile) {
    console.log('Showing not signed in state');
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Please sign in to view your dashboard</p>
      </div>
    );
  }

  // Default to 'user' role if not specified
  const userRole = userProfile.role || 'user';
  
  if (userRole !== 'user') {
    console.log('Showing wrong role state');
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">You don't have access to this dashboard. Your role is: {userRole}</p>
      </div>
    );
  }

  // Show loading state while fetching data
  if (loading) {
    console.log('Showing data loading state');
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        <span className="ml-3">Loading your dashboard...</span>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Error loading dashboard</h3>
          <p className="mt-1 text-sm text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  // Show empty state if no data
  if (policies.length === 0 && recommendations.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
          <div className="text-center">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No policies or recommendations</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new policy or exploring recommendations.</p>
          </div>
        </div>
      </div>
    );
  }

  const activePolicies = policies.filter(p => p.status === 'active');
  const expiringPolicies = policies.filter(p => {
    const endDate = new Date(p.endDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Active Policies Card */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DocumentTextIcon className="h-6 w-6 text-gray-400" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Active Policies</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">{activePolicies.length}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Expiring Policies Card */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-6 w-6 text-yellow-400" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Expiring Soon</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">{expiringPolicies.length}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Recommendations Card */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-6 w-6 text-indigo-400" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Recommendations</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">{recommendations.length}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Policies */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Recent Policies</h3>
        </div>
        <div className="border-t border-gray-200">
          <ul role="list" className="divide-y divide-gray-200">
            {policies.slice(0, 5).map((policy) => (
              <li key={policy.id} className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <p className="text-sm font-medium text-indigo-600 truncate">{policy.type}</p>
                    <p className="ml-2 flex-shrink-0 text-sm text-gray-500">{policy.provider}</p>
                  </div>
                  <div className="ml-2 flex-shrink-0 flex">
                    <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${policy.status === 'active' ? 'bg-green-100 text-green-800' : 
                        policy.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-red-100 text-red-800'}`}>
                      {policy.status}
                    </p>
                  </div>
                </div>
                <div className="mt-2 sm:flex sm:justify-between">
                  <div className="sm:flex">
                    <p className="flex items-center text-sm text-gray-500">
                      Premium: ${policy.premium}/month
                    </p>
                  </div>
                  <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                    <p>
                      Expires: {new Date(policy.endDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Recommended Policies</h3>
        </div>
        <div className="border-t border-gray-200">
          <ul role="list" className="divide-y divide-gray-200">
            {recommendations.slice(0, 5).map((recommendation) => (
              <li key={recommendation.id} className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <p className="text-sm font-medium text-indigo-600 truncate">{recommendation.type}</p>
                    <p className="ml-2 flex-shrink-0 text-sm text-gray-500">{recommendation.provider}</p>
                  </div>
                  <div className="ml-2 flex-shrink-0 flex">
                    <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800">
                      {recommendation.matchScore}% Match
                    </p>
                  </div>
                </div>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">{recommendation.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
} 