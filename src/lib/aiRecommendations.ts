import { GoogleGenerativeAI } from '@google/generative-ai';
import { Policy } from './policyComparison';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');

export interface UserBehavior {
  viewedPolicies: string[];
  searchQueries: string[];
  clickedCategories: string[];
  timeSpentOnPages: { [key: string]: number };
}

export class AIRecommendationService {
  private static instance: AIRecommendationService;

  private constructor() {}

  public static getInstance(): AIRecommendationService {
    if (!AIRecommendationService.instance) {
      AIRecommendationService.instance = new AIRecommendationService();
    }
    return AIRecommendationService.instance;
  }

  async getPersonalizedRecommendations(
    availablePolicies: Policy[],
    userBehavior: UserBehavior,
    userProfile?: {
      age?: number;
      occupation?: string;
      income?: number;
      location?: string;
    }
  ): Promise<{ recommendations: Policy[]; explanation: string }> {
    try {
      // Prepare context for Gemini
      const context = {
        userBehavior,
        userProfile,
        availablePolicies: availablePolicies.map(policy => ({
          id: policy.id,
          type: policy.type,
          provider: policy.provider,
          premium: policy.premium,
          coverage: policy.coverage,
          benefits: policy.benefits,
          financialGoals: policy.financialGoals
        }))
      };

      // Generate prompt for Gemini
      const prompt = `
        As an AI insurance recommendation system, analyze the following user data and available policies:
        
        User Profile:
        ${JSON.stringify(userProfile, null, 2)}
        
        User Behavior:
        - Viewed Policies: ${userBehavior.viewedPolicies.join(', ')}
        - Search Queries: ${userBehavior.searchQueries.join(', ')}
        - Clicked Categories: ${userBehavior.clickedCategories.join(', ')}
        
        Available Policies:
        ${JSON.stringify(context.availablePolicies, null, 2)}
        
        Please provide:
        1. A list of the top 3 recommended policy IDs based on the user's profile and behavior
        2. A brief explanation of why these policies are recommended
        
        Format your response as JSON with the following structure:
        {
          "recommendedPolicyIds": ["id1", "id2", "id3"],
          "explanation": "explanation text"
        }
      `;

      // Get response from Gemini
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();
      
      // Parse Gemini's response
      const aiResponse = JSON.parse(text);
      
      // Get the recommended policies
      const recommendedPolicies = availablePolicies.filter(policy => 
        aiResponse.recommendedPolicyIds.includes(policy.id)
      );

      return {
        recommendations: recommendedPolicies,
        explanation: aiResponse.explanation
      };
    } catch (error) {
      console.error('Error getting AI recommendations:', error);
      
      // Fallback to basic recommendation logic if AI fails
      return this.getBasicRecommendations(availablePolicies, userProfile);
    }
  }

  private getBasicRecommendations(
    availablePolicies: Policy[],
    userProfile?: {
      age?: number;
      occupation?: string;
      income?: number;
      location?: string;
    }
  ): { recommendations: Policy[]; explanation: string } {
    let recommendations = [...availablePolicies];
    
    if (userProfile?.income) {
      // Filter policies based on affordability (premium should not exceed 10% of monthly income)
      const monthlyIncome = userProfile.income / 12;
      recommendations = recommendations.filter(
        policy => policy.premium <= monthlyIncome * 0.1
      );
    }

    if (userProfile?.age) {
      // Filter age-appropriate policies
      recommendations = recommendations.filter(
        policy => 
          userProfile.age >= policy.eligibility.minAge &&
          userProfile.age <= policy.eligibility.maxAge
      );
    }

    // Sort by claim settlement ratio and coverage
    recommendations.sort((a, b) => {
      const scoreA = a.claimSettlementRatio * 0.7 + (a.coverage / 1000000) * 0.3;
      const scoreB = b.claimSettlementRatio * 0.7 + (b.coverage / 1000000) * 0.3;
      return scoreB - scoreA;
    });

    return {
      recommendations: recommendations.slice(0, 3),
      explanation: "These policies are recommended based on your age, income, and our assessment of policy reliability and coverage."
    };
  }

  async trainModel(historicalData: {
    user: {
      age: number;
      occupation: string;
      income: number;
      location: string;
    };
    purchasedPolicy: Policy;
    satisfaction: number;
  }[]): Promise<void> {
    // In a real implementation, you would:
    // 1. Prepare the training data
    // 2. Train a machine learning model (e.g., using TensorFlow.js)
    // 3. Save the model weights
    // 4. Use the trained model for future predictions
    
    // For now, we'll just log the training request
    console.log('Training data received:', historicalData.length, 'records');
  }
} 