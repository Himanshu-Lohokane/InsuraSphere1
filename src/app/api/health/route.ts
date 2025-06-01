import { NextResponse } from 'next/server';
import axios from 'axios';

const ML_API_URL = process.env.ML_API_URL || 'http://localhost:8000';

export async function GET() {
    try {
        const response = await axios.get(`${ML_API_URL}/health`);
        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error('Error checking ML service health:', error);
        return NextResponse.json(
            { 
                status: 'unhealthy',
                error: error.response?.data?.detail || 'Failed to check ML service health'
            },
            { status: error.response?.status || 500 }
        );
    }
} 