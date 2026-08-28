/**
 * ResQNet AI Emergency Intelligence Service
 * 
 * Provides automated incident risk classification, first-aid protocol lookup,
 * and natural-language situation analysis for field operators and triage dispatchers.
 */

export interface AiTriageAnalysis {
  riskLevel: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  confidenceScore: number;
  recommendedActions: string[];
  summaryText: string;
}

export class AiEmergencyService {
  /**
   * Analyzes an emergency distress payload and computes triage risk
   */
  public static async analyzeDistressPayload(description: string, category: string): Promise<AiTriageAnalysis> {
    // Check environment variables for Gemini / OpenAI API Key
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.NEXT_PUBLIC_AI_API_KEY;

    if (!apiKey) {
      // Graceful local algorithmic fallback if API key is omitted
      return this.fallbackAnalysis(description, category);
    }

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are an AI Disaster Triage Expert for ResQNet. Analyze the following distress report and return a JSON response with keys: riskLevel (CRITICAL/HIGH/MODERATE/LOW), confidenceScore (number 1-100), recommendedActions (array of strings), summaryText (short 2-sentence summary). Report: Category=${category}, Text=${description}`
            }]
          }]
        })
      });

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]) as AiTriageAnalysis;
      }
      return this.fallbackAnalysis(description, category);
    } catch {
      return this.fallbackAnalysis(description, category);
    }
  }

  private static fallbackAnalysis(description: string, category: string): AiTriageAnalysis {
    const text = (description + ' ' + category).toLowerCase();
    
    if (text.includes('trapped') || text.includes('unconscious') || text.includes('severe') || text.includes('fire') || text.includes('cardiac')) {
      return {
        riskLevel: 'CRITICAL',
        confidenceScore: 94,
        recommendedActions: [
          'Immediate SAR Heavy Extraction Unit Dispatch',
          'Notify Level-1 Emergency Trauma Center',
          'Deploy Bluetooth P2P Mesh Beacon to track coordinates'
        ],
        summaryText: 'High-probability severe trauma or life hazard detected. Immediate priority dispatch required.'
      };
    }

    return {
      riskLevel: 'HIGH',
      confidenceScore: 82,
      recommendedActions: [
        'Dispatch Mobile Paramedic Squad',
        'Establish direct radio contact with victim or emergency contact'
      ],
      summaryText: 'Active emergency distress signal received. Standard triage dispatch initiated.'
    };
  }
}
