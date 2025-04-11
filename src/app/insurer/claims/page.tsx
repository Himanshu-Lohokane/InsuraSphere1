'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface Claim {
  id: string;
  policyId: string;
  userId: string;
  userName: string;
  amount: number;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export default function ClaimsPage() {
  const { user } = useAuth();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);

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
        where('providerId', '==', user.uid)
      );
      const snapshot = await getDocs(claimsQuery);
      const claimsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Claim[];

      setClaims(claimsData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching claims:', error);
      setLoading(false);
    }
  };

  const handleUpdateClaimStatus = async (claimId: string, newStatus: 'approved' | 'rejected') => {
    try {
      const claimRef = doc(db, 'claims', claimId);
      await updateDoc(claimRef, {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });

      setClaims(claims.map(claim => 
        claim.id === claimId 
          ? { ...claim, status: newStatus, updatedAt: new Date().toISOString() }
          : claim
      ));
    } catch (error) {
      console.error('Error updating claim status:', error);
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
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Manage Claims</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Insurance Claims</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {claims.map((claim) => (
                <TableRow key={claim.id}>
                  <TableCell className="font-medium">{claim.userName}</TableCell>
                  <TableCell>${claim.amount.toLocaleString()}</TableCell>
                  <TableCell>{claim.description}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        claim.status === 'approved'
                          ? 'default'
                          : claim.status === 'rejected'
                          ? 'destructive'
                          : 'secondary'
                      }
                    >
                      {claim.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {format(new Date(claim.createdAt), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>
                    {claim.status === 'pending' && (
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateClaimStatus(claim.id, 'approved')}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateClaimStatus(claim.id, 'rejected')}
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
} 