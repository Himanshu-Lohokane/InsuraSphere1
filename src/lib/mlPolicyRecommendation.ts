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

  public async predict(policy: Policy, preferences: UserPreferences): Promise<number> {
    // Ensure no Gemini-related logic is present here
    return Math.random(); // Placeholder logic for prediction
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