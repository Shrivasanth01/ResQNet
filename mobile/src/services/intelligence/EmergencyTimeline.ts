import { TimelineEvent } from "../../types/intelligence";
import { DatabaseService } from "../db";

const TIMELINE_STORAGE_KEY = "resqnet_forensic_timeline_ledger";

let memoryTimeline: TimelineEvent[] = [];

export const EmergencyTimeline = {
  /**
   * Appends an immutable forensic event to the chronological timeline ledger
   */
  logEvent: async (
    eventType: TimelineEvent["eventType"],
    summary: string,
    details?: Record<string, any>,
    ecsSnapshot?: number
  ): Promise<TimelineEvent> => {
    const now = new Date().toISOString();
    const id = `RQ-TIME-${Date.now().toString(16).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;
    
    const event: TimelineEvent = {
      id,
      timestamp: now,
      eventType,
      summary,
      ecsSnapshot,
      details: details || {},
    };

    memoryTimeline.unshift(event); // Newest events first
    if (memoryTimeline.length > 200) {
      memoryTimeline = memoryTimeline.slice(0, 200); // Retain latest 200 forensic milestones
    }

    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(TIMELINE_STORAGE_KEY, JSON.stringify(memoryTimeline));
      }
      await DatabaseService.saveAppSetting(TIMELINE_STORAGE_KEY, JSON.stringify(memoryTimeline));
    } catch (e) {
      // Offline fallback continues operating in-memory
    }

    return event;
  },

  /**
   * Reads complete historical emergency timeline for FastAPI upload and AI accident diagnosis
   */
  getTimeline: async (): Promise<TimelineEvent[]> => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const item = window.localStorage.getItem(TIMELINE_STORAGE_KEY);
        if (item) {
          memoryTimeline = JSON.parse(item);
          return [...memoryTimeline];
        }
      }
      const prof = await DatabaseService.getEmergencyProfile();
      const stored = prof.settings?.[TIMELINE_STORAGE_KEY];
      if (stored) {
        memoryTimeline = JSON.parse(stored);
      }
    } catch (e) {}
    return [...memoryTimeline];
  },

  /**
   * Clears historical timeline after incident closure or manual reset
   */
  clearTimeline: async (): Promise<void> => {
    memoryTimeline = [];
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.removeItem(TIMELINE_STORAGE_KEY);
      }
      await DatabaseService.saveAppSetting(TIMELINE_STORAGE_KEY, "[]");
    } catch (e) {}
  }
};
