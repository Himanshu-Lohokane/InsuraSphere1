'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import {
  DocumentTextIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

interface Claim {
  id: string;
  policyId: string;
  type: string;
  status: 'pending' | 'approved' | 'rejected' | 'in_progress';
  description: string;
  amount: number;
  submittedDate: string;
  lastUpdated: string;
  documents?: string[];
}

export default function Claims() {
  const { user } = useAuth();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewClaimForm, setShowNewClaimForm] = useState(false);
  const [newClaim, setNewClaim] = useState({
    type: '',
    description: '',
    amount: '',
  });

  useEffect(() => {
    if (user) {
      fetchClaims();
    }
  }, [user]);

  const fetchClaims = async () => {
    if (!user) return;

    try {
      const claimsQuery = query(
        collection(db, 'claims'),
        where('userId', '==', user.uid)
      );
      const claimsSnapshot = await getDocs(claimsQuery);
      const claimsData = claimsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Claim[];
      setClaims(claimsData);
    } catch (error) {
      console.error('Error fetching claims:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const amount = parseFloat(newClaim.amount);
      if (isNaN(amount)) {
        throw new Error('Invalid amount');
      }

      await addDoc(collection(db, 'claims'), {
        type: newClaim.type,
        description: newClaim.description,
        amount: amount,
        userId: user.uid,
        status: 'pending',
        submittedDate: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
      });

      setNewClaim({
        type: '',
        description: '',
        amount: '',
      });
      setShowNewClaimForm(false);
      await fetchClaims();
    } catch (error) {
      console.error('Error submitting claim:', error);
      alert(error instanceof Error ? error.message : 'Failed to submit claim');
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numbers and decimal point
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setNewClaim({ ...newClaim, amount: value });
    }
  };

  const getStatusIcon = (status: Claim['status']) => {
    switch (status) {
      case 'approved':
        return <CheckCircleIcon className="h-6 w-6 text-green-500" />;
      case 'rejected':
        return <XCircleIcon className="h-6 w-6 text-red-500" />;
      case 'in_progress':
        return <ClockIcon className="h-6 w-6 text-yellow-500" />;
      default:
        return <DocumentTextIcon className="h-6 w-6 text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* New Claim Button */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowNewClaimForm(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Submit New Claim
        </button>
      </div>

      {/* New Claim Form */}
      {showNewClaimForm && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Submit New Claim</h2>
          <form onSubmit={handleSubmitClaim} className="space-y-4">
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                Claim Type
              </label>
              <select
                id="type"
                value={newClaim.type}
                onChange={(e) => setNewClaim({ ...newClaim, type: e.target.value })}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                required
              >
                <option value="">Select a type</option>
                <option value="medical">Medical</option>
                <option value="property">Property</option>
                <option value="auto">Auto</option>
                <option value="life">Life</option>
              </select>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                value={newClaim.description}
                onChange={(e) => setNewClaim({ ...newClaim, description: e.target.value })}
                rows={3}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                required
              />
            </div>

            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                Amount
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="text"
                  id="amount"
                  value={newClaim.amount}
                  onChange={handleAmountChange}
                  className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                  placeholder="0.00"
                  required
                  pattern="^\d*\.?\d*$"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowNewClaimForm(false)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Submit Claim
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Claims List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Your Claims</h3>
        </div>
        <div className="border-t border-gray-200">
          <ul role="list" className="divide-y divide-gray-200">
            {claims.map((claim) => (
              <li key={claim.id} className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {getStatusIcon(claim.status)}
                    <div className="ml-4">
                      <p className="text-sm font-medium text-indigo-600 truncate">{claim.type}</p>
                      <p className="text-sm text-gray-500">
                        Submitted: {new Date(claim.submittedDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="ml-2 flex-shrink-0 flex">
                    <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${claim.status === 'approved' ? 'bg-green-100 text-green-800' : 
                        claim.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                        claim.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'}`}>
                      {claim.status.replace('_', ' ')}
                    </p>
                  </div>
                </div>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">{claim.description}</p>
                </div>
                <div className="mt-2 sm:flex sm:justify-between">
                  <div className="sm:flex">
                    <p className="flex items-center text-sm text-gray-500">
                      Amount: ${claim.amount}
                    </p>
                  </div>
                  <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                    <p>
                      Last Updated: {new Date(claim.lastUpdated).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
} 