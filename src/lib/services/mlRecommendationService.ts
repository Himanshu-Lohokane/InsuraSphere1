interface UserProfile {
  age: number;
  income: number;
  occupation: string;
  family_size: number;
  risk_tolerance: number;
  health_status: string;
  existing_conditions: number;
  lifestyle: string;
  coverage_preference: string;
}

interface PolicyRecommendation {
  policy_type: string;
  score: number;
  confidence: 'High' | 'Medium' | 'Low';
}

interface RecommendationResponse {
  recommendations: PolicyRecommendation[];
  user_profile: UserProfile;
}

export class MLRecommendationService {
  private static API_URL = process.env.NEXT_PUBLIC_ML_API_URL || 'http://localhost:8000';

  static async getRecommendations(userProfile: UserProfile): Promise<PolicyRecommendation[]> {
    try {
      const response = await fetch(`${this.API_URL}/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userProfile),
      });

      if (!response.ok) {
        throw new Error('Failed to get recommendations');
      }

      const data: RecommendationResponse = await response.json();
      return data.recommendations;
    } catch (error) {
      console.error('Error getting recommendations:', error);
      throw error;
    }
  }

  static async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.API_URL}/health`);
      const data = await response.json();
      return data.status === 'healthy' && data.model_loaded;
    } catch (error) {
      console.error('Error checking ML service health:', error);
      return false;
    }
  }

  // Helper method to map user data to ML model features
  static mapUserDataToProfile(userData: any): UserProfile {
    return {
      age: userData.age || 30,
      income: userData.income || 50000,
      occupation: userData.occupation || 'professional',
      family_size: userData.familySize || 1,
      risk_tolerance: userData.riskTolerance || 0.5,
      health_status: userData.healthStatus || 'good',
      existing_conditions: userData.existingConditions || 0,
      lifestyle: userData.lifestyle || 'moderate',
      coverage_preference: userData.coveragePreference || 'medium'
    };
  }
} 