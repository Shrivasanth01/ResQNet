/**
 * ResQNet AI Emergency Intelligence Service
 * 
 * Provides automated incident risk classification, first-aid protocol lookup,
 * and natural-language situation analysis for field operators and triage dispatchers.
 * 
 * Powered primarily by OpenAI GPT-6 Astra via OpenRouter with graceful fallbacks.
 */

export interface AiTriageAnalysis {
  riskLevel: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  confidenceScore: number;
  recommendedActions: string[];
  summaryText: string;
  modelUsed?: string;
}

export class AiEmergencyService {
  private static readonly DEFAULT_OPENROUTER_MODEL = 'openai/gpt-6-astra';

  /**
   * Analyzes an emergency distress payload and computes triage risk
   */
  public static async analyzeDistressPayload(description: string, category: string): Promise<AiTriageAnalysis> {
    const openRouterKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY;
    const model = process.env.NEXT_PUBLIC_OPENROUTER_MODEL || this.DEFAULT_OPENROUTER_MODEL;

    // 1. Primary: Try OpenRouter with OpenAI GPT-6 Astra
    if (openRouterKey) {
      try {
        const analysis = await this.queryOpenRouter(openRouterKey, model, description, category);
        if (analysis) {
          return {
            ...analysis,
            modelUsed: `${model} (OpenRouter)`
          };
        }
      } catch (e) {
        console.warn('[AiEmergencyService] OpenRouter query failed, attempting secondary fallbacks:', e);
      }
    }

    // 2. Secondary: Try Google Gemini API if configured
    const geminiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.NEXT_PUBLIC_AI_API_KEY;
    if (geminiKey) {
      try {
        const analysis = await this.queryGemini(geminiKey, description, category);
        if (analysis) {
          return {
            ...analysis,
            modelUsed: 'gemini-2.5-flash'
          };
        }
      } catch (e) {
        console.warn('[AiEmergencyService] Gemini query failed, falling back to local heuristic:', e);
      }
    }

    // 3. Tertiary: Algorithmic local heuristic fallback
    return {
      ...this.fallbackAnalysis(description, category),
      modelUsed: 'ResQNet Heuristic Engine (Offline Fallback)'
    };
  }

  /**
   * Queries OpenRouter for OpenAI GPT-6 Astra structured triage
   */
  private static async queryOpenRouter(apiKey: string, model: string, description: string, category: string): Promise<AiTriageAnalysis | null> {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://resqnet.emergency',
        'X-Title': 'ResQNet Incident Triage'
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'system',
            content: 'You are an AI Disaster Triage Expert for ResQNet. Analyze the incoming distress report. Output ONLY a raw valid JSON object with EXACT keys: "riskLevel" ("CRITICAL" | "HIGH" | "MODERATE" | "LOW"), "confidenceScore" (integer 1-100), "recommendedActions" (array of 3 specific actionable field directives), "summaryText" (concise 2-sentence tactical summary).'
          },
          {
            role: 'user',
            content: `Category: ${category}\nDescription: ${description}`
          }
        ],
        // Explicitly set max_tokens to preserve credits and avoid OpenRouter credit reservation errors
        max_tokens: 400,
        temperature: 0.2
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenRouter HTTP ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content || '';

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        riskLevel: parsed.riskLevel || 'HIGH',
        confidenceScore: Number(parsed.confidenceScore) || 85,
        recommendedActions: Array.isArray(parsed.recommendedActions) ? parsed.recommendedActions : [],
        summaryText: parsed.summaryText || 'Incident prioritized for standard dispatch.'
      };
    }
    return null;
  }

  /**
   * Queries Google Gemini API as secondary fallback
   */
  private static async queryGemini(apiKey: string, description: string, category: string): Promise<AiTriageAnalysis | null> {
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

    if (!response.ok) return null;
    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as AiTriageAnalysis;
    }
    return null;
  }

  /**
   * Fast, reliable local algorithmic heuristic fallback (zero latency, zero external dependencies)
   */
  private static fallbackAnalysis(description: string, category: string): AiTriageAnalysis {
    const text = (description + ' ' + category).toLowerCase();
    
    if (text.includes('trapped') || text.includes('unconscious') || text.includes('severe') || text.includes('fire') || text.includes('cardiac') || text.includes('bleed')) {
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
