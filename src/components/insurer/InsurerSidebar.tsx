'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import {
  HomeIcon,
  DocumentTextIcon,
  ClipboardDocumentCheckIcon,
  ChartBarIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Dashboard', href: '/insurer', icon: HomeIcon },
  { name: 'Policies', href: '/insurer/policies', icon: DocumentTextIcon },
  { name: 'Claims', href: '/insurer/claims', icon: ClipboardDocumentCheckIcon },
  { name: 'Analytics', href: '/insurer/analytics', icon: ChartBarIcon },
  { name: 'Profile', href: '/insurer/profile', icon: UserCircleIcon },
  { name: 'Settings', href: '/insurer/settings', icon: Cog6ToothIcon },
];

export default function InsurerSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, userProfile } = useAuth();

  const handleSignOut = async () => {
    await logout();
    router.push('/auth/signin');
  };

  return (
    <div className="flex h-full w-64 flex-col bg-white shadow-lg">
      <div className="flex h-16 items-center justify-center border-b px-4">
        <Link href="/insurer" className="flex items-center space-x-2">
          <span className="text-xl font-bold text-indigo-600">InsuraSphere</span>
        </Link>
      </div>
      <nav className="flex-1 space-y-1 px-2 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'group flex items-center rounded-md px-2 py-2 text-sm font-medium',
                isActive
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-indigo-600'
              )}
            >
              <item.icon
                className={cn(
                  'mr-3 h-5 w-5 flex-shrink-0',
                  isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-indigo-600'
                )}
                aria-hidden="true"
              />
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-4 space-y-4">
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
            <span className="text-sm font-medium text-indigo-600">
              {userProfile?.name?.[0] || 'I'}
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">
              {userProfile?.name || 'Insurer'}
            </p>
            <p className="text-xs text-gray-500">Insurer Account</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="flex w-full items-center rounded-md px-2 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-indigo-600"
        >
          <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5 flex-shrink-0 text-gray-400 group-hover:text-indigo-600" />
          Sign Out
        </button>
      </div>
    </div>
  );
} 