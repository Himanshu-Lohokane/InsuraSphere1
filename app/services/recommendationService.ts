import axios from 'axios';

export interface UserProfile {
    age: number;
    income: number;
    occupation: string;
    family_size: number;
    marital_status: string;
    education_level: string;
    risk_tolerance: number;
    health_status: string;
    existing_conditions: number;
    lifestyle: string;
    family_medical_history: string;
    smoking_status: string;
    bmi: number;
    savings_rate: number;
    debt: number;
    investment_experience: number;
    coverage_preference: string;
    policy_duration_preference: string;
    premium_budget: number;
    location_type: string;
    property_ownership: string;
    vehicle_ownership: string;
}

export interface PolicyRecommendation {
    policy_type: string;
    score: number;
    confidence: string;
    explanation: string;
}

class RecommendationService {
    private baseUrl: string;

    constructor() {
        this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
    }

    async getRecommendations(userProfile: UserProfile): Promise<PolicyRecommendation[]> {
        try {
            const response = await axios.post(`${this.baseUrl}/recommendations`, userProfile);
            return response.data;
        } catch (error) {
            console.error('Error getting recommendations:', error);
            throw error;
        }
    }

    async getModelMetrics(): Promise<any> {
        try {
            const response = await axios.get(`${this.baseUrl}/model/metrics`);
            return response.data;
        } catch (error) {
            console.error('Error getting model metrics:', error);
            throw error;
        }
    }

    async checkModelHealth(): Promise<boolean> {
        try {
            const response = await axios.get(`${this.baseUrl}/health`);
            return response.data.status === 'healthy';
        } catch (error) {
            console.error('Error checking model health:', error);
            return false;
        }
    }
}

export const recommendationService = new RecommendationService(); 