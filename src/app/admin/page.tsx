'use client';

import { useState, useEffect } from 'react';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import RoleGuard from '@/components/auth/RoleGuard';

interface AdminStats {
  totalUsers: number;
  totalInsurers: number;
  totalPolicies: number;
  totalClaims: number;
}

export default function AdminDashboard() {
  const { user, userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalInsurers: 0,
    totalPolicies: 0,
    totalClaims: 0,
  });

  useEffect(() => {
    if (user && userProfile) {
      fetchAdminStats();
    }
  }, [user, userProfile]);

  const fetchAdminStats = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Fetch users
      const usersQuery = query(collection(db, 'users'));
      const usersSnapshot = await getDocs(usersQuery);
      const users = usersSnapshot.docs.map(doc => doc.data());
      
      // Count insurers
      const insurers = users.filter(user => user.role === 'insurer');
      
      // Fetch policies
      const policiesQuery = query(collection(db, 'policies'));
      const policiesSnapshot = await getDocs(policiesQuery);
      
      // Fetch claims
      const claimsQuery = query(collection(db, 'claims'));
      const claimsSnapshot = await getDocs(claimsQuery);
      
      setStats({
        totalUsers: users.length,
        totalInsurers: insurers.length,
        totalPolicies: policiesSnapshot.size,
        totalClaims: claimsSnapshot.size,
      });
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <RoleGuard allowedRoles={['admin']}>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900">Total Users</h3>
              <p className="mt-2 text-3xl font-bold text-indigo-600">{stats.totalUsers}</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900">Total Insurers</h3>
              <p className="mt-2 text-3xl font-bold text-indigo-600">{stats.totalInsurers}</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900">Total Policies</h3>
              <p className="mt-2 text-3xl font-bold text-indigo-600">{stats.totalPolicies}</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900">Total Claims</h3>
              <p className="mt-2 text-3xl font-bold text-indigo-600">{stats.totalClaims}</p>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
} 