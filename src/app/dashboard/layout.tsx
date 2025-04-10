'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/auth/signin');
        return;
      }

      // Redirect based on user role
      if (userProfile) {
        const path = window.location.pathname;
        if (userProfile.role === 'insurer' && !path.startsWith('/insurer')) {
          router.push('/insurer');
          return;
        } else if (userProfile.role === 'admin' && !path.startsWith('/admin')) {
          router.push('/admin');
          return;
        } else if (userProfile.role === 'user' && (path.startsWith('/insurer') || path.startsWith('/admin'))) {
          router.push('/dashboard');
          return;
        }
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

  if (!user || !userProfile) {
    return null;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
} 