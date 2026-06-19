import { Injectable } from '@nestjs/common';

@Injectable()
export class AiService {
  async generateDescription(domainName: string, category: string) {
    // Mock AI Call
    return {
      description: `Unlock the potential of ${domainName}. This premium ${category} domain is short, memorable, and perfectly positioned for the next big startup. Secure this digital asset today and build your brand on a solid foundation.`
    };
  }

  async getValuation(domainName: string) {
    const prompt = `You are an expert domain name broker and appraiser. Appraise the domain name: "${domainName}". 
Provide your response strictly as a JSON object with the following schema:
{
  "value": number (the estimated market value in USD, use realistic numbers, no commas),
  "score": number (a score out of 10 evaluating the domain, e.g., 8.5),
  "reasoning": string (a short, concise paragraph explaining why it has this value, based on length, TLD, brandability, market trends, etc.),
  "extensions": number (estimated number of other TLDs this name is registered in, a guess is fine),
  "searchVol": number (estimated exact match search volume per month, a guess is fine),
  "syllables": number (number of syllables in the domain name),
  "comps": [
    { "name": string (a visually similar domain that sold), "price": string (e.g., "$10,000"), "date": string (e.g., "Jan 2024") },
    { "name": string, "price": string, "date": string },
    { "name": string, "price": string, "date": string }
  ]
}
Ensure the output is ONLY the JSON object and no markdown formatting.`;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is missing in backend environment.");
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const apiRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
      })
    });

    if (!apiRes.ok) {
      throw new Error(`Gemini API Error: ${await apiRes.text()}`);
    }

    const json = await apiRes.json();
    const text = json.candidates[0].content.parts[0].text;
    return JSON.parse(text);
  }

  async suggestDomains(keyword: string) {
    return {
      suggestions: [
        `${keyword}Hub.com`,
        `${keyword}AI.io`,
        `${keyword}Stack.co`,
        `The${keyword}.in`
      ]
    };
  }
}
