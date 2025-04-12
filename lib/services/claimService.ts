import { db } from '@/lib/firebase';
import { collection, getDocs, doc, updateDoc, query, where, orderBy } from 'firebase/firestore';

export interface Claim {
  id: string;
  policyNumber: string;
  reason: string;
  description: string;
  claimAmount: number;
  status: 'pending' | 'approved' | 'rejected' | 'in-review';
  submissionDate: string;
  userId: string;
  documents?: string[];
}

export class ClaimService {
  private static claimsCollection = 'claims';

  static async getAllClaims(): Promise<Claim[]> {
    try {
      const claimsRef = collection(db, this.claimsCollection);
      const q = query(claimsRef, orderBy('submissionDate', 'desc'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Claim[];
    } catch (error) {
      console.error('Error fetching claims:', error);
      throw error;
    }
  }

  static async updateClaimStatus(claimId: string, newStatus: 'approved' | 'rejected' | 'in-review'): Promise<void> {
    try {
      const claimRef = doc(db, this.claimsCollection, claimId);
      await updateDoc(claimRef, {
        status: newStatus,
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating claim status:', error);
      throw error;
    }
  }

  static async getClaimsByUser(userId: string): Promise<Claim[]> {
    try {
      const claimsRef = collection(db, this.claimsCollection);
      const q = query(
        claimsRef,
        where('userId', '==', userId),
        orderBy('submissionDate', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Claim[];
    } catch (error) {
      console.error('Error fetching user claims:', error);
      throw error;
    }
  }
}