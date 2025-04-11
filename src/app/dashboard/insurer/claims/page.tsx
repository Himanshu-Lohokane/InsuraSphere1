'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ClaimService, Claim } from '@/lib/services/claimService';
import { toast } from 'sonner';
import { Search, Filter, CheckCircle, XCircle, Clock } from 'lucide-react';

export default function InsurerClaimsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    const fetchClaims = async () => {
      if (!user?.uid) return;

      try {
        setLoading(true);
        const allClaims = await ClaimService.getAllClaims();
        setClaims(allClaims);
      } catch (error) {
        console.error('Error fetching claims:', error);
        toast.error('Failed to load claims');
      } finally {
        setLoading(false);
      }
    };

    fetchClaims();
  }, [user?.uid]);

  const handleStatusChange = async (claimId: string, newStatus: 'approved' | 'rejected' | 'in-review') => {
    try {
      await ClaimService.updateClaimStatus(claimId, newStatus);
      toast.success('Claim status updated successfully');
      
      // Refresh claims list
      const updatedClaims = await ClaimService.getAllClaims();
      setClaims(updatedClaims);
    } catch (error) {
      console.error('Error updating claim status:', error);
      toast.error('Failed to update claim status');
    }
  };

  const filteredClaims = claims.filter(claim => {
    const matchesSearch = 
      claim.policyNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.reason.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || claim.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Insurance Claims</h1>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search claims..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-[#1a1f2e] text-white border-gray-700 focus:border-blue-500"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px] bg-[#1a1f2e] text-white border-gray-700">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1f2e] border-gray-700">
              <SelectItem value="all" className="text-gray-200">All Claims</SelectItem>
              <SelectItem value="pending" className="text-gray-200">Pending</SelectItem>
              <SelectItem value="in-review" className="text-gray-200">In Review</SelectItem>
              <SelectItem value="approved" className="text-gray-200">Approved</SelectItem>
              <SelectItem value="rejected" className="text-gray-200">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="bg-[#1a1f2e] border-gray-800">
        <CardContent className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-400">User</th>
                  <th className="text-left py-3 px-4 text-gray-400">Amount</th>
                  <th className="text-left py-3 px-4 text-gray-400">Description</th>
                  <th className="text-left py-3 px-4 text-gray-400">Status</th>
                  <th className="text-left py-3 px-4 text-gray-400">Date</th>
                  <th className="text-left py-3 px-4 text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredClaims.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-400">
                      No claims found
                    </td>
                  </tr>
                ) : (
                  filteredClaims.map((claim) => (
                    <tr key={claim.id} className="border-b border-gray-700">
                      <td className="py-4 px-4">
                        <div className="text-white">{claim.policyNumber}</div>
                        <div className="text-sm text-gray-400">{claim.reason}</div>
                      </td>
                      <td className="py-4 px-4 text-white">
                        {formatCurrency(claim.claimAmount)}
                      </td>
                      <td className="py-4 px-4 text-gray-200">
                        {claim.description.substring(0, 100)}
                        {claim.description.length > 100 ? '...' : ''}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                          ${claim.status === 'approved' ? 'bg-green-900 text-green-200' :
                            claim.status === 'rejected' ? 'bg-red-900 text-red-200' :
                            claim.status === 'in-review' ? 'bg-yellow-900 text-yellow-200' :
                            'bg-blue-900 text-blue-200'}`}>
                          {claim.status.charAt(0).toUpperCase() + claim.status.slice(1)}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-gray-200">
                        {formatDate(claim.submissionDate)}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-green-600 text-green-500 hover:bg-green-900 hover:text-green-200"
                            onClick={() => handleStatusChange(claim.id, 'approved')}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-600 text-red-500 hover:bg-red-900 hover:text-red-200"
                            onClick={() => handleStatusChange(claim.id, 'rejected')}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-yellow-600 text-yellow-500 hover:bg-yellow-900 hover:text-yellow-200"
                            onClick={() => handleStatusChange(claim.id, 'in-review')}
                          >
                            <Clock className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
