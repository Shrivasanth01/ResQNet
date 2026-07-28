import { FusedSensorPattern } from "./SensorFusion";
import { ContextAwareness } from "./ContextAwareness";
import { BatteryIntelligence } from "./BatteryIntelligence";

export interface ScoreCalculationResult {
  score: number; // Integer between 0 and 100
  breakdown: {
    baseSensorScore: number;
    contextMultiplier: number;
    batteryMultiplier: number;
    immobilityBonus: number;
  };
  explanation: string;
}

export const EmergencyConfidenceCalculator = {
  /**
   * Computes standardized Emergency Confidence Score (ECS) fusing sensor severity, environmental risk, and power state
   * 
   * Mathematical Model:
   * Base = (Average Confidence * 50) + (Max Magnitude * 3.5)
   * Immobility Bonus = +25 if Stationary immobility follows impact
   * ECS = min(100, round( (Base + Bonus) * ContextMultiplier * BatteryMultiplier ))
   */
  computeScore: (pattern: FusedSensorPattern): ScoreCalculationResult => {
    if (pattern.compoundEvents.length === 0) {
      return {
        score: 0,
        breakdown: { baseSensorScore: 0, contextMultiplier: 1.0, batteryMultiplier: 1.0, immobilityBonus: 0 },
        explanation: "No active sensor events registered in the correlation window."
      };
    }

    // Calculate base score from sensor confidence and physical magnitude (G-forces)
    let base = pattern.averageConfidence * 40;
    base += Math.min(35, pattern.maxMagnitude * 3.5); // Cap magnitude contribution at 35 points

    // Add immediate bonus if sudden immobility or compound free-fall is present
    let immobilityBonus = 0;
    if (pattern.hasImpact && pattern.hasImmobility) {
      immobilityBonus += 25; // Severe indicator of patient unconsciousness or inability to stand
    } else if (pattern.hasFreeFall && pattern.hasImpact) {
      immobilityBonus += 15;
    }

    const contextMultiplier = ContextAwareness.computeRiskMultiplier();
    const batteryMultiplier = BatteryIntelligence.getDepletionUrgencyMultiplier();

    const rawScore = (base + immobilityBonus) * contextMultiplier * batteryMultiplier;
    const finalScore = Math.min(100, Math.max(0, Math.round(rawScore)));

    let explanation = `Normal diagnostic telemetry (ECS: ${finalScore}).`;
    if (finalScore >= 85) {
      explanation = `CRITICAL TRIAGE CONFIDENCE (${finalScore}/100): Compound fall/impact signature with persistent immobility in elevated risk context.`;
    } else if (finalScore >= 65) {
      explanation = `HIGH ACCIDENT LIKELIHOOD (${finalScore}/100): Strong G-force impact detected; recommending automatic alarm countdown.`;
    } else if (finalScore >= 35) {
      explanation = `MODERATE ANOMALY (${finalScore}/100): Minor jolt or abnormal motion; prompting user for status check-in.`;
    } else {
      explanation = `TRANSIENT NOISE (${finalScore}/100): Insufficient impact energy or immobility to warrant distress alert. Event ignored.`;
    }

    return {
      score: finalScore,
      breakdown: {
        baseSensorScore: parseFloat(base.toFixed(1)),
        contextMultiplier,
        batteryMultiplier,
        immobilityBonus,
      },
      explanation,
    };
  }
};
