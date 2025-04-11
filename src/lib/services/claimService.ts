import { collection, addDoc, getDocs, query, where, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface Claim {
  id: string;
  userId: string;
  policyId: string;
  policyNumber: string;
  claimAmount: number;
  reason: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected' | 'in-review';
  documents: string[];
  submissionDate: string;
  lastUpdated: string;
}

export interface ClaimSubmission {
  policyId: string;
  policyNumber: string;
  claimAmount: number;
  reason: string;
  description: string;
  documents: string[];
}

export class ClaimService {
  private static COLLECTION_NAME = 'claims';

  static async submitClaim(userId: string, claim: ClaimSubmission): Promise<Claim> {
    try {
      const claimsRef = collection(db, this.COLLECTION_NAME);
      const now = new Date().toISOString();
      
      const newClaim = {
        userId,
        ...claim,
        status: 'pending',
        submissionDate: now,
        lastUpdated: now
      };

      const docRef = await addDoc(claimsRef, newClaim);
      return {
        id: docRef.id,
        ...newClaim
      } as Claim;
    } catch (error) {
      console.error('Error submitting claim:', error);
      throw error;
    }
  }

  static async getUserClaims(userId: string): Promise<Claim[]> {
    try {
      const claimsRef = collection(db, this.COLLECTION_NAME);
      const q = query(claimsRef, where('userId', '==', userId));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Claim[];
    } catch (error) {
      console.error('Error fetching user claims:', error);
      throw error;
    }
  }

  static async getPolicyClaims(policyId: string): Promise<Claim[]> {
    try {
      const claimsRef = collection(db, this.COLLECTION_NAME);
      const q = query(claimsRef, where('policyId', '==', policyId));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Claim[];
    } catch (error) {
      console.error('Error getting policy claims:', error);
      throw error;
    }
  }

  static async getAllClaims(): Promise<Claim[]> {
    try {
      const claimsRef = collection(db, this.COLLECTION_NAME);
      const snapshot = await getDocs(claimsRef);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Claim[];
    } catch (error) {
      console.error('Error getting all claims:', error);
      throw error;
    }
  }

  static async updateClaimStatus(claimId: string, newStatus: 'approved' | 'rejected' | 'in-review'): Promise<void> {
    try {
      const claimRef = doc(db, this.COLLECTION_NAME, claimId);
      await updateDoc(claimRef, {
        status: newStatus,
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating claim status:', error);
      throw error;
    }
  }
} 