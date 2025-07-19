export interface AuthLogEntry {
  id: string;
  timestamp: number;
  message: string;
  level: "info" | "error" | "warning" | "success";
  event:
    | "login"
    | "logout"
    | "register"
    | "session_restore"
    | "error"
    | "validation_error";
  details?: any;
}

class AuthLoggerService {
  private logs: AuthLogEntry[] = [];
  private maxLogs = 100;
  private listeners: Array<(logs: AuthLogEntry[]) => void> = [];

  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  log(
    message: string,
    level: AuthLogEntry["level"],
    event: AuthLogEntry["event"],
    details?: any
  ): void {
    const entry: AuthLogEntry = {
      id: this.generateId(),
      timestamp: Date.now(),
      message,
      level,
      event,
      details,
    };

    this.logs.unshift(entry);

    // Keep only the latest logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Notify listeners
    this.notifyListeners();

    // Console log for development
    if (process.env.NODE_ENV === "development") {
      const emoji = this.getEmojiForLevel(level);
      console.log(`${emoji} AuthLogger [${event}]:`, message, details || "");
    }
  }

  private getEmojiForLevel(level: AuthLogEntry["level"]): string {
    switch (level) {
      case "success":
        return "✅";
      case "error":
        return "❌";
      case "warning":
        return "⚠️";
      case "info":
        return "ℹ️";
      default:
        return "📝";
    }
  }

  // Convenience methods
  success(message: string, event: AuthLogEntry["event"], details?: any): void {
    this.log(message, "success", event, details);
  }

  error(message: string, event: AuthLogEntry["event"], details?: any): void {
    this.log(message, "error", event, details);
  }

  warning(message: string, event: AuthLogEntry["event"], details?: any): void {
    this.log(message, "warning", event, details);
  }

  info(message: string, event: AuthLogEntry["event"], details?: any): void {
    this.log(message, "info", event, details);
  }

  // Get logs
  getLogs(): AuthLogEntry[] {
    return [...this.logs];
  }

  getLatestLogs(count: number): AuthLogEntry[] {
    return this.logs.slice(0, count);
  }

  getLogsByEvent(event: AuthLogEntry["event"]): AuthLogEntry[] {
    return this.logs.filter((log) => log.event === event);
  }

  getLogsByLevel(level: AuthLogEntry["level"]): AuthLogEntry[] {
    return this.logs.filter((log) => log.level === level);
  }

  // Subscribe to log changes
  subscribe(listener: (logs: AuthLogEntry[]) => void): () => void {
    this.listeners.push(listener);

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener([...this.logs]));
  }

  // Clear logs
  clearLogs(): void {
    this.logs = [];
    this.notifyListeners();
  }

  // Get recent error messages for UI display
  getRecentErrors(minutes: number = 5): AuthLogEntry[] {
    const cutoff = Date.now() - minutes * 60 * 1000;
    return this.logs.filter(
      (log) => log.level === "error" && log.timestamp > cutoff
    );
  }
}

// Export singleton instance
export const authLogger = new AuthLoggerService();
