'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import RoleGuard from '@/components/auth/RoleGuard';

export default function InsurerLayout({ children }: { children: React.ReactNode }) {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/auth/signin');
        return;
      }

      // Ensure user is an insurer
      if (userProfile && userProfile.role !== 'insurer') {
        router.push('/dashboard');
        return;
      }
    }
  }, [user, userProfile, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user || !userProfile || userProfile.role !== 'insurer') {
    return null;
  }

  return (
    <RoleGuard allowedRoles={['insurer']}>
      <DashboardLayout>{children}</DashboardLayout>
    </RoleGuard>
  );
} 