'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import RoleGuard from '@/components/auth/RoleGuard';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface AdminStats {
  totalUsers: number;
  totalPolicies: number;
  activeUsers: number;
}

export default function AdminDashboard() {
  const { user, userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalPolicies: 0,
    activeUsers: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const policiesSnapshot = await getDocs(collection(db, 'policies'));
        
        setStats({
          totalUsers: usersSnapshot.size,
          totalPolicies: policiesSnapshot.size,
          activeUsers: usersSnapshot.docs.filter(doc => doc.data().lastLogin).length
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    if (userProfile?.role === 'admin') {
      fetchStats();
    }
  }, [userProfile]);

  if (!userProfile) {
    return null;
  }

  return (
    <RoleGuard requiredRole="admin">
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
        
        {loading ? (
          <div>Loading stats...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-2">Total Users</h2>
              <p className="text-3xl">{stats.totalUsers}</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-2">Total Policies</h2>
              <p className="text-3xl">{stats.totalPolicies}</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-2">Active Users</h2>
              <p className="text-3xl">{stats.activeUsers}</p>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
} 