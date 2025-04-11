import { GoogleGenerativeAI } from '@google/generative-ai';
import { Policy, UserPreferences } from '@/types/policy';

interface TrainingData {
  policy: Policy;
  preferences: UserPreferences;
  score: number;
}

interface CacheEntry {
  score: number;
  timestamp: number;
}

export class MLPolicyRecommendationEngine {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private trainingData: TrainingData[] = [];
  private requestQueue: Promise<void> = Promise.resolve();
  private lastRequestTime: number = 0;
  private requestCount: number = 0;
  private cache: Map<string, CacheEntry> = new Map();
  private readonly RATE_LIMIT = 15; // requests per minute
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');
    this.model = this.genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash",
      generationConfig: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40
      }
    });
  }

  private async waitForRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < 60000) { // Less than a minute since last request
      if (this.requestCount >= this.RATE_LIMIT) {
        // Wait for the remaining time in the minute
        await new Promise(resolve => setTimeout(resolve, 60000 - timeSinceLastRequest));
        this.requestCount = 0;
      }
    } else {
      this.requestCount = 0;
    }
    
    this.lastRequestTime = Date.now();
    this.requestCount++;
  }

  private getCacheKey(policy: Policy, preferences: UserPreferences): string {
    return `${policy.id}-${JSON.stringify(preferences)}`;
  }

  private getCachedScore(policy: Policy, preferences: UserPreferences): number | null {
    const key = this.getCacheKey(policy, preferences);
    const entry = this.cache.get(key);
    
    if (entry && Date.now() - entry.timestamp < this.CACHE_TTL) {
      return entry.score;
    }
    
    return null;
  }

  private setCachedScore(policy: Policy, preferences: UserPreferences, score: number): void {
    const key = this.getCacheKey(policy, preferences);
    this.cache.set(key, {
      score,
      timestamp: Date.now()
    });
  }

  public async train(data: TrainingData[]): Promise<void> {
    this.trainingData = data;
  }

  public async recommendPolicies(
    preferences: UserPreferences,
    availablePolicies: Policy[]
  ): Promise<{ policy: Policy; score: number }[]> {
    try {
      // Get predictions for all policies
      const predictions = await Promise.all(
        availablePolicies.map(async (policy) => ({
          policy,
          score: await this.predict(policy, preferences)
        }))
      );

      // Sort by score in descending order
      return predictions.sort((a, b) => b.score - a.score);
    } catch (error) {
      console.error('Error making recommendations:', error);
      return [];
    }
  }

  private async getGeminiSuggestion(policy: Policy, preferences: UserPreferences): Promise<number> {
    try {
      // Check cache first
      const cachedScore = this.getCachedScore(policy, preferences);
      if (cachedScore !== null) {
        return cachedScore;
      }

      const prompt = `
        As an AI insurance advisor, analyze the compatibility between a policy and user preferences.
        
        Policy Details:
        - Name: ${policy.name}
        - Premium: ${policy.premium}/year
        - Coverage: ${policy.coverage}
        - Term: ${policy.term} years
        - Benefits: ${policy.benefits?.join(', ')}
        - Category: ${policy.category}
        
        User Preferences:
        - Age: ${preferences.age}
        - Annual Income: ${preferences.income}
        - Family Size: ${preferences.familySize}
        - Risk Tolerance (1-10): ${preferences.riskTolerance}
        
        Based on these details, calculate a match score between 0 and 1, where:
        - 1 represents a perfect match
        - 0 represents no match
        
        Consider factors like:
        1. Affordability (premium vs income)
        2. Coverage adequacy for family size
        3. Risk tolerance alignment
        4. Age-appropriate benefits
        
        Return only a number between 0 and 1, with no other text.
      `;

      // Queue the request and handle rate limiting
      await this.waitForRateLimit();
      
      let retries = 3;
      let lastError: any = null;
      
      while (retries > 0) {
        try {
          const result = await this.model.generateContent(prompt);
          const response = await result.response;
          const text = response.text().trim();
          const score = parseFloat(text);
          
          // Ensure the score is between 0 and 1
          const finalScore = Math.min(Math.max(isNaN(score) ? 0.5 : score, 0), 1);
          
          // Cache the result
          this.setCachedScore(policy, preferences, finalScore);
          
          return finalScore;
        } catch (error: any) {
          lastError = error;
          if (error.message?.includes('429')) {
            // Rate limit error - wait with exponential backoff
            const delay = Math.pow(2, 3 - retries) * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
            retries--;
          } else {
            throw error;
          }
        }
      }
      
      // If we've exhausted retries, fall back to basic scoring
      console.warn('Rate limit exceeded, falling back to basic scoring');
      return this.calculateBasicScore(policy, preferences);
      
    } catch (error) {
      console.error('Error getting Gemini suggestion:', error);
      // Return basic score on error
      return this.calculateBasicScore(policy, preferences);
    }
  }

  public async predict(policy: Policy, preferences: UserPreferences): Promise<number> {
    // Get AI-powered suggestion
    const aiScore = await this.getGeminiSuggestion(policy, preferences);
    
    // Calculate basic score based on simple rules
    const basicScore = this.calculateBasicScore(policy, preferences);
    
    // Find similar policies in training data
    const similarPolicies = this.trainingData.filter(td => 
      td.policy.category === policy.category &&
      Math.abs(td.policy.premium - policy.premium) / policy.premium < 0.2
    );
    
    // Calculate collaborative score if we have similar policies
    const collaborativeScore = similarPolicies.length > 0
      ? similarPolicies.reduce((sum, td) => sum + td.score, 0) / similarPolicies.length
      : 0.5;
    
    // Combine scores (60% AI, 20% basic rules, 20% collaborative)
    return 0.6 * aiScore + 0.2 * basicScore + 0.2 * collaborativeScore;
  }

  private calculateBasicScore(policy: Policy, preferences: UserPreferences): number {
    let score = 0;
    
    // Affordability (premium should be 5-10% of annual income)
    const premiumRatio = policy.premium / preferences.income;
    if (premiumRatio <= 0.1 && premiumRatio >= 0.05) {
      score += 0.25;
    }
    
    // Coverage adequacy (coverage should be 10x annual income)
    const coverageRatio = policy.coverage / preferences.income;
    if (coverageRatio >= 10) {
      score += 0.25;
    }
    
    // Risk assessment
    if (preferences.riskTolerance >= 7 && policy.category === 'ULIP') {
      score += 0.25;
    } else if (preferences.riskTolerance <= 4 && policy.category === 'Term') {
      score += 0.25;
    }
    
    // Family size consideration
    if (preferences.familySize > 1 && policy.coverage >= preferences.income * preferences.familySize * 5) {
      score += 0.25;
    }
    
    return score;
  }
} 