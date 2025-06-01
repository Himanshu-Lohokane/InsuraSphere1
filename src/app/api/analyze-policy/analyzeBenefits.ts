// pages/api/analyzeBenefits.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({
  model: 'gemini-2.0-flash-001',
  generationConfig: {
    temperature: 0.7,
    topP: 0.8,
    topK: 40,
  },
});

interface Policy {
  id: string;
  name: string;
  category: string;
  benefits: string[];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    const { policies } = req.body as { policies: Policy[] };
    const refined: Record<string, any> = {};

    for (const policy of policies) {
      if (!policy.benefits?.length) continue;

      const prompt = `
You are an expert insurance advisor. Please analyze these insurance policy benefits and provide:
1. A clear, concise explanation of what these benefits mean for the policyholder (2-3 sentences)
2. 2-3 additional recommended benefits that would complement the existing benefits well

Policy Name: ${policy.name}
Policy Category: ${policy.category}
Current Benefits: ${policy.benefits.join(', ')}

Respond in JSON:
{
  "explanation": "…",
  "recommendations": ["…", "…"]
}
      `;

      try {
        const result = await model.generateContent([prompt]);
        const text   = await result.response.text();
        const json   = JSON.parse(text);

        refined[policy.id] = {
          original:        policy.benefits,
          explanation:     json.explanation,
          recommendations: json.recommendations,
        };
      } catch (e) {
        console.error('Gemini parse/generation error:', e);
        refined[policy.id] = {
          original:        policy.benefits,
          explanation:     'Unable to analyze benefits at this time.',
          recommendations: [],
        };
      }
    }

    return res.status(200).json({ refined });
  } catch (e) {
    console.error('API route error:', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
