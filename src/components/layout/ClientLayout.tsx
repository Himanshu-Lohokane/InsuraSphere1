'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      const path = window.location.pathname;

      // Handle unauthenticated users
      if (!user && !path.startsWith('/auth/')) {
        router.push('/auth/signin');
        return;
      }

      // Only handle redirects for authenticated users with profiles
      if (user && userProfile) {
        // Handle root path redirects
        if (path === '/') {
          switch (userProfile.role) {
            case 'insurer':
              router.push('/insurer');
              break;
            case 'admin':
              router.push('/admin');
              break;
            case 'user':
              router.push('/dashboard');
              break;
          }
          return;
        }

        // Handle incorrect section access
        const isInDashboard = path.startsWith('/dashboard');
        const isInInsurer = path.startsWith('/insurer');
        const isInAdmin = path.startsWith('/admin');

        if (
          (userProfile.role === 'user' && (isInInsurer || isInAdmin)) ||
          (userProfile.role === 'insurer' && (isInDashboard || isInAdmin)) ||
          (userProfile.role === 'admin' && (isInDashboard || isInInsurer))
        ) {
          switch (userProfile.role) {
            case 'insurer':
              router.push('/insurer');
              break;
            case 'admin':
              router.push('/admin');
              break;
            case 'user':
              router.push('/dashboard');
              break;
          }
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

  return children;
} 