import { db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, query, where, Query, setDoc, deleteDoc } from 'firebase/firestore';
import { UserRole } from '@/contexts/AuthContext';

export interface Policy {
  id: string;
  type: string;
  provider: string;
  premium: number;
  coverage: number;
  term: number;
  claimSettlementRatio: number;
  benefits: string[];
  addOns: string[];
  exclusions: string[];
  goals: string[];
  eligibility: {
    minAge: number;
    maxAge: number;
    minIncome: number;
  };
  flexibility: {
    length: number;
    portability: boolean;
    partialWithdrawal: boolean;
    topUp: boolean;
  };
  tags: string[];
  documentUrl?: string;
}

export interface PolicyComparison {
  policies: Policy[];
  recommendations: Policy[];
  bestMatches: {
    premium: Policy;
    coverage: Policy;
    flexibility: Policy;
  };
}

export interface UserPreferences {
  age: number;
  occupation: string;
  income: number;
  maritalStatus: 'single' | 'married' | 'divorced' | 'widowed';
  dependents: number;
  financialGoals: string[];
  existingPolicies: string[];
  riskAppetite: 'low' | 'medium' | 'high';
}

export class PolicyComparisonService {
  private static instance: PolicyComparisonService;
  private policiesCollection = collection(db, 'policies');
  private favoritesCollection = collection(db, 'favorites');

  private constructor() {}

  public static getInstance(): PolicyComparisonService {
    if (!PolicyComparisonService.instance) {
      PolicyComparisonService.instance = new PolicyComparisonService();
    }
    return PolicyComparisonService.instance;
  }

  async getPolicyById(id: string): Promise<Policy | null> {
    try {
      const policyDoc = await getDoc(doc(this.policiesCollection, id));
      if (!policyDoc.exists()) {
        return null;
      }
      return { id: policyDoc.id, ...policyDoc.data() } as Policy;
    } catch (error) {
      console.error('Error fetching policy:', error);
      return null;
    }
  }

  async getPoliciesByType(type: string): Promise<Policy[]> {
    try {
      const policiesQuery = query(this.policiesCollection, where('type', '==', type));
      const querySnapshot = await getDocs(policiesQuery);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Policy[];
    } catch (error) {
      console.error('Error fetching policies by type:', error);
      throw error;
    }
  }

  async getPoliciesByProvider(provider: string): Promise<Policy[]> {
    try {
      const policiesQuery = query(this.policiesCollection, where('provider', '==', provider));
      const querySnapshot = await getDocs(policiesQuery);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Policy[];
    } catch (error) {
      console.error('Error fetching policies by provider:', error);
      throw error;
    }
  }

  async getPoliciesByFinancialGoal(goal: string): Promise<Policy[]> {
    try {
      const policiesQuery = query(this.policiesCollection, where('financialGoals', 'array-contains', goal));
      const querySnapshot = await getDocs(policiesQuery);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Policy[];
    } catch (error) {
      console.error('Error fetching policies by financial goal:', error);
      throw error;
    }
  }

  async getAllPolicies(): Promise<Policy[]> {
    try {
      const querySnapshot = await getDocs(this.policiesCollection);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Policy[];
    } catch (error) {
      console.error('Error fetching all policies:', error);
      throw error;
    }
  }

  async comparePolicies(policyIds: string[]): Promise<Policy[]> {
    try {
      const policies: Policy[] = [];
      for (const id of policyIds) {
        const policy = await this.getPolicyById(id);
        policies.push(policy);
      }
      return policies;
    } catch (error) {
      console.error('Error comparing policies:', error);
      throw error;
    }
  }

  async searchPolicies(criteria: {
    type?: string;
    minPremium?: number;
    maxPremium?: number;
    minCoverage?: number;
    maxCoverage?: number;
    minTerm?: number;
    maxTerm?: number;
    minClaimSettlementRatio?: number;
    financialGoals?: string[];
  }): Promise<Policy[]> {
    try {
      let policiesQuery: Query = this.policiesCollection;

      if (criteria.type) {
        policiesQuery = query(policiesQuery, where('type', '==', criteria.type));
      }

      if (criteria.minPremium !== undefined) {
        policiesQuery = query(policiesQuery, where('premium', '>=', criteria.minPremium));
      }

      if (criteria.maxPremium !== undefined) {
        policiesQuery = query(policiesQuery, where('premium', '<=', criteria.maxPremium));
      }

      if (criteria.minCoverage !== undefined) {
        policiesQuery = query(policiesQuery, where('coverage', '>=', criteria.minCoverage));
      }

      if (criteria.maxCoverage !== undefined) {
        policiesQuery = query(policiesQuery, where('coverage', '<=', criteria.maxCoverage));
      }

      if (criteria.minTerm !== undefined) {
        policiesQuery = query(policiesQuery, where('term', '>=', criteria.minTerm));
      }

      if (criteria.maxTerm !== undefined) {
        policiesQuery = query(policiesQuery, where('term', '<=', criteria.maxTerm));
      }

      if (criteria.minClaimSettlementRatio !== undefined) {
        policiesQuery = query(policiesQuery, where('claimSettlementRatio', '>=', criteria.minClaimSettlementRatio));
      }

      if (criteria.financialGoals?.length) {
        policiesQuery = query(policiesQuery, where('financialGoals', 'array-contains-any', criteria.financialGoals));
      }

      const querySnapshot = await getDocs(policiesQuery);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Policy[];
    } catch (error) {
      console.error('Error searching policies:', error);
      throw error;
    }
  }

  async getRecommendations(
    UserRole: UserRole,
    userPreferences: UserPreferences
  ): Promise<Policy[]> {
    try {
      // Get all policies
      const policiesQuery = query(collection(db, 'policies'));
      const snapshot = await getDocs(policiesQuery);
      const allPolicies = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Policy));

      // Score each policy based on user profile and preferences
      const scoredPolicies = allPolicies.map(policy => ({
        policy,
        score: this.calculatePolicyScore(policy, UserRole, userPreferences)
      }));

      // Sort by score and return top 5
      return scoredPolicies
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
        .map(sp => sp.policy);
    } catch (error) {
      console.error('Error getting recommendations:', error);
      return [];
    }
  }

  private calculatePolicyScore(
    policy: Policy,
    UserRole: UserRole,
    userPreferences: UserPreferences
  ): number {
    let score = 0;

    // Age suitability (30%)
    const ageScore = this.calculateAgeScore(
      userPreferences.age,
      policy.eligibility.minAge,
      policy.eligibility.maxAge
    );
    score += ageScore * 0.3;

    // Income to premium ratio (20%)
    const incomeScore = this.calculateIncomeScore(
      userPreferences.income,
      policy.premium
    );
    score += incomeScore * 0.2;

    // Goal matching (30%)
    const goalScore = this.calculateGoalScore(
      userPreferences.financialGoals,
      policy.goals
    );
    score += goalScore * 0.3;

    // Risk appetite matching (20%)
    const riskScore = this.calculateRiskScore(
      userPreferences.riskAppetite,
      policy
    );
    score += riskScore * 0.2;

    return score;
  }

  private calculateAgeScore(
    userAge: number,
    minAge: number,
    maxAge: number
  ): number {
    if (userAge < minAge || userAge > maxAge) return 0;
    
    const ageRange = maxAge - minAge;
    const optimalAge = (minAge + maxAge) / 2;
    const distanceFromOptimal = Math.abs(userAge - optimalAge);
    
    return 1 - (distanceFromOptimal / ageRange);
  }

  private calculateIncomeScore(income: number, premium: number): number {
    const ratio = premium / income;
    if (ratio > 0.3) return 0;
    if (ratio < 0.1) return 1;
    return 1 - (ratio - 0.1) / 0.2;
  }

  private calculateGoalScore(
    userGoals: string[],
    policyGoals: string[]
  ): number {
    if (!userGoals.length || !policyGoals.length) return 0;
    
    const matchingGoals = userGoals.filter(goal => 
      policyGoals.includes(goal)
    );
    
    return matchingGoals.length / userGoals.length;
  }

  private calculateRiskScore(
    riskAppetite: 'low' | 'medium' | 'high',
    policy: Policy
  ): number {
    const riskFactors = {
      low: ['stable', 'guaranteed', 'conservative'],
      medium: ['balanced', 'moderate', 'growth'],
      high: ['aggressive', 'high-yield', 'speculative']
    };

    const policyTags = policy.tags.map((tag: string) => tag.toLowerCase());
    const matchingFactors = riskFactors[riskAppetite].filter(factor =>
      policyTags.some((tag: string | string[]) => tag.includes(factor))
    );

    return matchingFactors.length / riskFactors[riskAppetite].length;
  }

  private findBestByPremium(policies: Policy[]): Policy {
    return policies.reduce((best, current) => 
      !best || current.premium < best.premium ? current : best
    );
  }

  private findBestByCoverage(policies: Policy[]): Policy {
    return policies.reduce((best, current) => 
      !best || current.coverage > best.coverage ? current : best
    );
  }

  private findBestByFlexibility(policies: Policy[]): Policy {
    return policies.reduce((best, current) => 
      !best || current.flexibility.length > best.flexibility.length ? current : best
    );
  }

  async isPolicyFavorite(userId: string, policyId: string): Promise<boolean> {
    try {
      const favoriteDoc = await getDoc(doc(this.favoritesCollection, `${userId}_${policyId}`));
      return favoriteDoc.exists();
    } catch (error) {
      console.error('Error checking favorite status:', error);
      throw error;
    }
  }

  async addToFavorites(userId: string, policyId: string): Promise<void> {
    try {
      await setDoc(doc(this.favoritesCollection, `${userId}_${policyId}`), {
        userId,
        policyId,
        createdAt: new Date()
      });
    } catch (error) {
      console.error('Error adding to favorites:', error);
      throw error;
    }
  }

  async removeFromFavorites(userId: string, policyId: string): Promise<void> {
    try {
      await deleteDoc(doc(this.favoritesCollection, `${userId}_${policyId}`));
    } catch (error) {
      console.error('Error removing from favorites:', error);
      throw error;
    }
  }

  async deletePolicy(policyId: string): Promise<void> {
    try {
      await deleteDoc(doc(this.policiesCollection, policyId));
    } catch (error) {
      console.error('Error deleting policy:', error);
      throw error;
    }
  }

  async addPolicy(policy: Omit<Policy, 'id'>): Promise<string> {
    try {
      const docRef = doc(this.policiesCollection);
      await setDoc(docRef, {
        ...policy,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding policy:', error);
      throw error;
    }
  }
} 