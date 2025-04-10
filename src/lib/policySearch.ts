import { db } from './firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import OpenAI from 'openai';

interface PolicySearchResult {
  id: string;
  type: string;
  provider: string;
  premium: number;
  coverage: string;
  features: string[];
  rating: number;
  matchScore: number;
}

interface SearchQuery {
  type?: string;
  maxPremium?: number;
  coverage?: string;
  features?: string[];
  location?: string;
  age?: number;
  healthConditions?: string[];
}

export class PolicySearchService {
  private static instance: PolicySearchService;
  private openai: OpenAI;

  private constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  public static getInstance(): PolicySearchService {
    if (!PolicySearchService.instance) {
      PolicySearchService.instance = new PolicySearchService();
    }
    return PolicySearchService.instance;
  }

  async searchWithNaturalLanguage(query: string): Promise<PolicySearchResult[]> {
    try {
      // Parse natural language query using OpenAI
      const completion = await this.openai.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that converts natural language insurance queries into structured search parameters."
          },
          {
            role: "user",
            content: query
          }
        ],
        model: "gpt-3.5-turbo",
      });

      const searchParams = this.parseSearchParams(completion.choices[0].message.content);
      return this.searchPolicies(searchParams);
    } catch (error) {
      console.error('Error in natural language search:', error);
      return [];
    }
  }

  private parseSearchParams(llmResponse: string): SearchQuery {
    try {
      const params = JSON.parse(llmResponse);
      return {
        type: params.type,
        maxPremium: params.maxPremium,
        coverage: params.coverage,
        features: params.features,
        location: params.location,
        age: params.age,
        healthConditions: params.healthConditions
      };
    } catch (error) {
      console.error('Error parsing search params:', error);
      return {};
    }
  }

  private async searchPolicies(params: SearchQuery): Promise<PolicySearchResult[]> {
    try {
      let q = collection(db, 'policies');

      if (params.type) {
        q = query(q, where('type', '==', params.type));
      }

      if (params.maxPremium) {
        q = query(q, where('premium', '<=', params.maxPremium));
      }

      const snapshot = await getDocs(q);
      const results: PolicySearchResult[] = [];

      snapshot.forEach(doc => {
        const policy = doc.data();
        const matchScore = this.calculateMatchScore(policy, params);
        
        if (matchScore > 0.5) { // Only include relevant results
          results.push({
            id: doc.id,
            type: policy.type,
            provider: policy.provider,
            premium: policy.premium,
            coverage: policy.coverage,
            features: policy.features,
            rating: policy.rating,
            matchScore
          });
        }
      });

      return results.sort((a, b) => b.matchScore - a.matchScore);
    } catch (error) {
      console.error('Error searching policies:', error);
      return [];
    }
  }

  private calculateMatchScore(policy: any, params: SearchQuery): number {
    let score = 0;
    let totalFactors = 0;

    if (params.type && policy.type === params.type) {
      score += 1;
      totalFactors++;
    }

    if (params.maxPremium && policy.premium <= params.maxPremium) {
      score += 1;
      totalFactors++;
    }

    if (params.coverage && policy.coverage.includes(params.coverage)) {
      score += 1;
      totalFactors++;
    }

    if (params.features) {
      const matchingFeatures = params.features.filter(f => 
        policy.features.includes(f)
      ).length;
      score += matchingFeatures / params.features.length;
      totalFactors++;
    }

    return totalFactors > 0 ? score / totalFactors : 0;
  }
} 