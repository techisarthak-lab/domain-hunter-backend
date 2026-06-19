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
    try {
      const prompt = `You are an expert domain name broker and appraiser. Appraise the domain name: "${domainName}". 
Provide your response strictly as a JSON object with the following schema:
{
  "value": number,
  "score": number,
  "reasoning": string,
  "extensions": number,
  "searchVol": number,
  "syllables": number,
  "comps": [
    { "name": string, "price": string, "date": string }
  ]
}
Ensure the output is ONLY the JSON object and no markdown formatting.`;

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return { error: "GEMINI_API_KEY is missing in backend environment." };
      }

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`;
      
      const apiRes = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" }
        })
      });

      if (!apiRes.ok) {
        const err = await apiRes.text();
        return { error: `Gemini API Error: ${err}` };
      }

      const json = await apiRes.json();
      const text = json.candidates[0].content.parts[0].text;
      return JSON.parse(text);
    } catch (e: any) {
      return { error: `Internal Server Error: ${e.message}` };
    }
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
