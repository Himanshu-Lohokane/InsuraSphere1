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
import UserPolicies from '@/components/dashboard/UserPolicies';

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

export default function DashboardPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      <div className="grid gap-6">
        <UserPolicies />
      </div>
    </div>
  );
} 