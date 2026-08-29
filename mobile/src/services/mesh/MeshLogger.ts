export interface MeshLogRecord {
  timestamp: string;
  level: "INFO" | "WARN" | "ERROR" | "DEBUG";
  category: "DISCOVERY" | "ROUTING" | "RELAY" | "GATEWAY" | "SECURITY" | "SIMULATION";
  message: string;
  metadata?: Record<string, any>;
}

class MeshLoggerService {
  private logs: MeshLogRecord[] = [];
  private maxHistory: number = 500;
  private consoleOutput: boolean = __DEV__ ?? true;

  public log(level: MeshLogRecord["level"], category: MeshLogRecord["category"], message: string, metadata?: Record<string, any>) {
    const entry: MeshLogRecord = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      metadata
    };

    this.logs.unshift(entry);
    if (this.logs.length > this.maxHistory) {
      this.logs.pop();
    }

    if (this.consoleOutput) {
      const tag = `[ResQNet-Mesh][${category}][${level}]`;
      const extra = metadata ? JSON.stringify(metadata) : "";
      if (level === "ERROR") {
        console.error(`${tag} ${message}`, extra);
      } else if (level === "WARN") {
        console.warn(`${tag} ${message}`, extra);
      } else {
        console.log(`${tag} ${message}`, extra);
      }
    }
  }

  public info(category: MeshLogRecord["category"], message: string, metadata?: Record<string, any>) {
    this.log("INFO", category, message, metadata);
  }

  public warn(category: MeshLogRecord["category"], message: string, metadata?: Record<string, any>) {
    this.log("WARN", category, message, metadata);
  }

  public error(category: MeshLogRecord["category"], message: string, metadata?: Record<string, any>) {
    this.log("ERROR", category, message, metadata);
  }

  public debug(category: MeshLogRecord["category"], message: string, metadata?: Record<string, any>) {
    this.log("DEBUG", category, message, metadata);
  }

  public getRecentLogs(limit: number = 50, category?: MeshLogRecord["category"]): MeshLogRecord[] {
    if (category) {
      return this.logs.filter(log => log.category === category).slice(0, limit);
    }
    return this.logs.slice(0, limit);
  }

  public clearLogs() {
    this.logs = [];
  }
}

export const MeshLogger = new MeshLoggerService();
