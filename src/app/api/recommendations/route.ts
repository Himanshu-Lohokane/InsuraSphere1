import { NextResponse } from 'next/server';
import axios from 'axios';

const ML_API_URL = process.env.ML_API_URL || 'http://localhost:8000';

export async function POST(request: Request) {
    try {
        const userProfile = await request.json();
        
        // Forward the request to the ML service
        const response = await axios.post(`${ML_API_URL}/recommend`, userProfile);
        
        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error('Error getting recommendations:', error);
        return NextResponse.json(
            { error: error.response?.data?.detail || 'Failed to get recommendations' },
            { status: error.response?.status || 500 }
        );
    }
}

export async function GET() {
    try {
        // Get model metrics
        const response = await axios.get(`${ML_API_URL}/model/metrics`);
        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error('Error getting model metrics:', error);
        return NextResponse.json(
            { error: error.response?.data?.detail || 'Failed to get model metrics' },
            { status: error.response?.status || 500 }
        );
    }
} 