import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface RoleGuardProps {
  children: React.ReactNode;
  requiredRole?: string;
}

export default function RoleGuard({ children, requiredRole = 'admin' }: RoleGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const checkUserRole = async () => {
      if (!user) {
        router.push('/login');
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.data();
        
        if (!userData || userData.role !== requiredRole) {
          router.push('/unauthorized');
        }
      } catch (error) {
        console.error('Error checking user role:', error);
        router.push('/unauthorized');
      }
    };

    if (!loading) {
      checkUserRole();
    }
  }, [user, loading, router, requiredRole]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return <>{children}</>;
} 