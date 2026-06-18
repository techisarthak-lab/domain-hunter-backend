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
    // Mock AI Valuation logic based on string length and TLD
    const tld = domainName.split('.').pop();
    const length = domainName.split('.')[0].length;
    
    let baseValue = 50000;
    if (tld === 'com') baseValue += 100000;
    if (tld === 'ai') baseValue += 150000;
    if (tld === 'io') baseValue += 80000;
    
    if (length <= 4) baseValue *= 3;
    else if (length <= 6) baseValue *= 1.5;

    return {
      valuation: baseValue,
      confidence: 'High',
      factors: [
        'Short length',
        'High-value TLD',
        'Strong brandability'
      ]
    };
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
