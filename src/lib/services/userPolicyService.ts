import { collection, getDocs, query, where, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Policy } from '@/types/policy';

export interface UserPolicy extends Policy {
  userId: string;
  purchaseDate: string;
  nextPaymentDate: string;
  status: 'active' | 'pending' | 'expired';
  policyNumber: string;
  purchaseDetails: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    purchaseTimestamp: any;
  };
}

export interface PurchaseDetails {
  fullName: string;
  email: string;
  phone: string;
  address: string;
}

export class UserPolicyService {
  private static COLLECTION_NAME = 'userPolicies';

  static async getUserPolicies(userId: string): Promise<UserPolicy[]> {
    try {
      const userPoliciesRef = collection(db, this.COLLECTION_NAME);
      const q = query(userPoliciesRef, where('userId', '==', userId));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as UserPolicy[];
    } catch (error) {
      console.error('Error fetching user policies:', error);
      throw error;
    }
  }

  static async purchasePolicy(
    userId: string,
    policy: Policy,
    purchaseDetails: PurchaseDetails
  ): Promise<UserPolicy> {
    try {
      const now = new Date();
      const nextPaymentDate = new Date(now);
      nextPaymentDate.setFullYear(now.getFullYear() + 1); // Set next payment to 1 year from now

      const userPolicy: Omit<UserPolicy, 'id'> = {
        ...policy,
        userId,
        purchaseDate: now.toISOString(),
        nextPaymentDate: nextPaymentDate.toISOString(),
        status: 'active',
        policyNumber: `POL-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        purchaseDetails: {
          ...purchaseDetails,
          purchaseTimestamp: serverTimestamp(),
        }
      };

      const docRef = await addDoc(collection(db, this.COLLECTION_NAME), userPolicy);
      
      return {
        id: docRef.id,
        ...userPolicy
      };
    } catch (error) {
      console.error('Error purchasing policy:', error);
      throw error;
    }
  }
} 