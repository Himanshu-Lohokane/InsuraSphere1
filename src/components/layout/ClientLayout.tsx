'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const path = window.location.pathname;
    const isAuthPath = path.startsWith('/auth/');

    // Allow access to public routes
    if (path === '/' || path === '/features') return;

    // Handle unauthenticated users
    if (!user && !isAuthPath) {
      router.push('/auth/signin');
      return;
    }

    // Allow authenticated users to access auth pages
    if (user && isAuthPath) {
      router.push('/dashboard');
      return;
    }

    // Only handle role-based redirects for authenticated users with profiles
    if (user && userProfile) {
      const isInDashboard = path.startsWith('/dashboard');
      const isInInsurer = path.startsWith('/insurer');
      const isInAdmin = path.startsWith('/admin');

      // Redirect based on role if accessing incorrect section
      if (
        (userProfile.role === 'user' && (isInInsurer || isInAdmin)) ||
        (userProfile.role === 'insurer' && (isInDashboard || isInAdmin)) ||
        (userProfile.role === 'admin' && (isInDashboard || isInInsurer))
      ) {
        const redirectPath = {
          insurer: '/insurer',
          admin: '/admin',
          user: '/dashboard'
        }[userProfile.role];
        
        router.push(redirectPath);
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