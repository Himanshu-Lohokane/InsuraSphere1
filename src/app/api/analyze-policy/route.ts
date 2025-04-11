import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');

export async function POST(request: Request) {
  try {
    const { policyText } = await request.json();

    if (!policyText) {
      return NextResponse.json(
        { error: 'Policy text is required' },
        { status: 400 }
      );
    }

    if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API key is not configured' },
        { status: 500 }
      );
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `
      Analyze this insurance policy text and provide:
      1. Key coverage points
      2. Important exclusions
      3. Main benefits
      4. Potential limitations
      5. Overall assessment (in 2-3 sentences)

      Policy text:
      ${policyText}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({
      analysis: text,
      success: true
    });
  } catch (error: any) {
    console.error('Error analyzing policy:', error);
    return NextResponse.json(
      { 
        error: 'Failed to analyze policy',
        details: error.message 
      },
      { status: 500 }
    );
  }
} 