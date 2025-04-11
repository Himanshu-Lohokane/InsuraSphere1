'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import InsurerSidebar from '@/components/insurer/InsurerSidebar';

export default function InsurerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, userProfile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user || userProfile?.role !== 'insurer') {
      router.push('/auth/signin');
    }
  }, [user, userProfile, router]);

  if (!user || userProfile?.role !== 'insurer') {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <InsurerSidebar />
      <main className="flex-1 overflow-y-auto p-8">
        {children}
      </main>
    </div>
  );
} 