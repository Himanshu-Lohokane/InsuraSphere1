import { NextResponse } from 'next/server';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface UserProfile {
  income: number;
  age: number;
  occupation: string;
  searchHistory: string[];
}

interface Policy {
  id: string;
  type: string;
  coverage: number;
  premium: number;
  description: string;
  requirements: {
    minIncome?: number;
    maxIncome?: number;
    minAge?: number;
    maxAge?: number;
    occupations?: string[];
  };
}

export async function POST(request: Request) {
  try {
    const { userProfile } = await request.json();

    // Fetch all policies
    const policiesQuery = query(collection(db, 'policies'));
    const policiesSnapshot = await getDocs(policiesQuery);
    const policies = policiesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Policy[];

    // Calculate recommendation scores
    const recommendations = policies.map(policy => {
      let score = 0;

      // Income-based scoring
      if (policy.requirements.minIncome && userProfile.income >= policy.requirements.minIncome) {
        score += 2;
      }
      if (policy.requirements.maxIncome && userProfile.income <= policy.requirements.maxIncome) {
        score += 2;
      }

      // Age-based scoring
      if (policy.requirements.minAge && userProfile.age >= policy.requirements.minAge) {
        score += 2;
      }
      if (policy.requirements.maxAge && userProfile.age <= policy.requirements.maxAge) {
        score += 2;
      }

      // Occupation-based scoring
      if (policy.requirements.occupations?.includes(userProfile.occupation)) {
        score += 3;
      }

      // Search history matching
      const searchTerms = userProfile.searchHistory.join(' ').toLowerCase();
      const policyTerms = `${policy.type} ${policy.description}`.toLowerCase();
      if (searchTerms.includes(policyTerms)) {
        score += 5;
      }

      // Affordability score
      const affordability = userProfile.income / policy.premium;
      if (affordability > 10) {
        score += 3;
      } else if (affordability > 5) {
        score += 2;
      } else if (affordability > 2) {
        score += 1;
      }

      return {
        ...policy,
        score,
        matchPercentage: Math.min(100, (score / 20) * 100),
      };
    });

    // Sort by score and return top 5 recommendations
    const topRecommendations = recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    return NextResponse.json({ recommendations: topRecommendations });
  } catch (error) {
    console.error('Error generating recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to generate recommendations' },
      { status: 500 }
    );
  }
} 