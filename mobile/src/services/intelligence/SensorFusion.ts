import { SensorEvent, SensorEventType } from "../../types/intelligence";

const TIME_WINDOW_MS = 4000; // 4 second sliding correlation window for compound event detection

let eventBuffer: SensorEvent[] = [];

export interface FusedSensorPattern {
  hasImpact: boolean;
  hasFreeFall: boolean;
  hasImmobility: boolean;
  maxMagnitude: number;
  averageConfidence: number;
  compoundEvents: SensorEvent[];
  patternDescription: string;
}

export const SensorFusion = {
  /**
   * Ingests a raw sensor event into the sliding correlation window and prunes expired historical events
   */
  pushEvent: (event: SensorEvent): void => {
    const now = Date.now();
    eventBuffer.push(event);
    // Prune events older than our correlation window
    eventBuffer = eventBuffer.filter(e => {
      const evtTime = new Date(e.timestamp).getTime();
      return now - evtTime <= TIME_WINDOW_MS;
    });
  },

  /**
   * Evaluates the current sliding buffer to detect complex compound accident signatures
   */
  evaluatePattern: (): FusedSensorPattern => {
    if (eventBuffer.length === 0) {
      return {
        hasImpact: false,
        hasFreeFall: false,
        hasImmobility: false,
        maxMagnitude: 0,
        averageConfidence: 0,
        compoundEvents: [],
        patternDescription: "No sensor activity in active window.",
      };
    }

    let hasImpact = false;
    let hasFreeFall = false;
    let hasImmobility = false;
    let maxMagnitude = 0;
    let sumConfidence = 0;

    for (const evt of eventBuffer) {
      if (evt.type === "IMPACT_DETECTED" || evt.type === "LOUD_NOISE_CRASH") hasImpact = true;
      if (evt.type === "FREE_FALL" || evt.type === "RAPID_ALTITUDE_DROP") hasFreeFall = true;
      if (evt.type === "STATIONARY_IMMOBILITY") hasImmobility = true;
      const mag = evt.magnitude ?? 0;
      if (mag > maxMagnitude) maxMagnitude = mag;
      sumConfidence += evt.confidence;
    }

    const avgConf = parseFloat((sumConfidence / eventBuffer.length).toFixed(2));
    let description = "Isolated sensor anomaly detected.";

    if (hasFreeFall && hasImpact && hasImmobility) {
      description = "CRITICAL COMPOUND EVENT: Free-fall detected followed by severe impact and stationary immobility.";
    } else if (hasImpact && hasImmobility) {
      description = "HIGH RISK IMPACT: Sudden high-G collision accompanied by stationary position.";
    } else if (hasFreeFall && hasImpact) {
      description = "MODERATE FALL: Vertical drop and impact without confirmed immobility.";
    }

    return {
      hasImpact,
      hasFreeFall,
      hasImmobility,
      maxMagnitude,
      averageConfidence: avgConf,
      compoundEvents: [...eventBuffer],
      patternDescription: description,
    };
  },

  /**
   * Clears the event correlation buffer upon manual dismissal or successful SOS dispatch
   */
  clearBuffer: (): void => {
    eventBuffer = [];
  },

  /**
   * Returns all active events currently stored within the correlation window
   */
  getBufferedEvents: (): SensorEvent[] => {
    return [...eventBuffer];
  }
};
