"use client";

import React, { useState, useEffect } from "react";
import { authLogger, AuthLogEntry } from "@/app/services/authLogger";
import { AuthMessage } from "./ui/AuthMessage";
import { Clock, Eye, EyeOff, RefreshCw, Trash2 } from "lucide-react";
import { cn } from "@/app/lib/utils";

interface AuthLogRendererProps {
  maxLogs?: number;
  showTimestamp?: boolean;
  showEventType?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
  filterByLevel?: Array<AuthLogEntry["level"]>;
  filterByEvent?: Array<AuthLogEntry["event"]>;
  className?: string;
  compact?: boolean;
}

export const AuthLogRenderer: React.FC<AuthLogRendererProps> = ({
  maxLogs = 10,
  showTimestamp = true,
  showEventType = true,
  autoRefresh = true,
  refreshInterval = 5000,
  filterByLevel,
  filterByEvent,
  className,
  compact = false,
}) => {
  const [logs, setLogs] = useState<AuthLogEntry[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());

  useEffect(() => {
    // Subscribe to auth log updates
    const unsubscribe = authLogger.subscribe((newLogs) => {
      let filteredLogs = newLogs;

      // Apply filters
      if (filterByLevel && filterByLevel.length > 0) {
        filteredLogs = filteredLogs.filter((log) =>
          filterByLevel.includes(log.level)
        );
      }

      if (filterByEvent && filterByEvent.length > 0) {
        filteredLogs = filteredLogs.filter((log) =>
          filterByEvent.includes(log.event)
        );
      }

      // Limit logs
      filteredLogs = filteredLogs.slice(0, maxLogs);

      setLogs(filteredLogs);
      setLastUpdate(Date.now());
    });

    // Initial load
    const initialLogs = authLogger.getLogs();
    let filteredInitialLogs = initialLogs;

    if (filterByLevel && filterByLevel.length > 0) {
      filteredInitialLogs = filteredInitialLogs.filter((log) =>
        filterByLevel.includes(log.level)
      );
    }

    if (filterByEvent && filterByEvent.length > 0) {
      filteredInitialLogs = filteredInitialLogs.filter((log) =>
        filterByEvent.includes(log.event)
      );
    }

    setLogs(filteredInitialLogs.slice(0, maxLogs));

    return unsubscribe;
  }, [maxLogs, filterByLevel, filterByEvent]);

  // Auto refresh effect
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(() => {
        setLastUpdate(Date.now());
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  const getVariantFromLevel = (
    level: AuthLogEntry["level"]
  ): "success" | "error" | "warning" | "info" => {
    switch (level) {
      case "success":
        return "success";
      case "error":
        return "error";
      case "warning":
        return "warning";
      case "info":
        return "info";
      default:
        return "info";
    }
  };

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    if (compact) {
      return date.toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return date.toLocaleString();
  };

  const getEventDisplayName = (event: AuthLogEntry["event"]): string => {
    const eventNames = {
      login: "Login",
      logout: "Logout",
      register: "Registration",
      session_restore: "Session",
      error: "Error",
      validation_error: "Validation",
    };
    return eventNames[event] || event;
  };

  const handleRefresh = () => {
    setLastUpdate(Date.now());
  };

  const handleClear = () => {
    authLogger.clearLogs();
  };

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  if (logs.length === 0 && !isVisible) {
    return null;
  }

  return (
    <div className={cn("space-y-2", className)}>
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-700">
            Authentication Logs
            {logs.length > 0 && (
              <span className="ml-1 text-xs text-slate-500">
                ({logs.length})
              </span>
            )}
          </h3>
          {showTimestamp && (
            <span className="text-xs text-slate-400">
              <Clock className="w-3 h-3 inline mr-1" />
              {new Date(lastUpdate).toLocaleTimeString()}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {logs.length > 0 && (
            <>
              <button
                onClick={handleRefresh}
                className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
                title="Refresh logs"
              >
                <RefreshCw className="w-3 h-3" />
              </button>

              <button
                onClick={handleClear}
                className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                title="Clear logs"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </>
          )}

          <button
            onClick={toggleVisibility}
            className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
            title={isVisible ? "Hide logs" : "Show logs"}
          >
            {isVisible ? (
              <EyeOff className="w-3 h-3" />
            ) : (
              <Eye className="w-3 h-3" />
            )}
          </button>
        </div>
      </div>

      {/* Log Messages */}
      {isVisible && (
        <div className="space-y-1">
          {logs.length === 0 ? (
            <div className="text-center py-4 text-slate-500 text-sm">
              No authentication logs to display
            </div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className={cn(
                  "transition-all duration-200",
                  compact ? "space-y-0" : "space-y-1"
                )}
              >
                {/* Log Entry */}
                <AuthMessage
                  message={log.message}
                  variant={getVariantFromLevel(log.level)}
                  size={compact ? "sm" : "md"}
                  className={cn(compact && "p-2")}
                />

                {/* Metadata */}
                {(showTimestamp || showEventType) && !compact && (
                  <div className="flex items-center gap-3 text-xs text-slate-500 ml-8">
                    {showTimestamp && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTimestamp(log.timestamp)}
                      </span>
                    )}
                    {showEventType && (
                      <span className="bg-slate-100 px-2 py-0.5 rounded-full">
                        {getEventDisplayName(log.event)}
                      </span>
                    )}
                    {log.details && (
                      <span
                        className="text-slate-400"
                        title={JSON.stringify(log.details, null, 2)}
                      >
                        Details available
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Summary for collapsed view */}
      {!isVisible && logs.length > 0 && (
        <div className="text-xs text-slate-500 bg-slate-50 rounded p-2">
          {logs.filter((l) => l.level === "error").length} errors,{" "}
          {logs.filter((l) => l.level === "success").length} successful
          operations
        </div>
      )}
    </div>
  );
};

// Preset components for common use cases
export const RecentAuthErrors: React.FC<{ className?: string }> = ({
  className,
}) => (
  <AuthLogRenderer
    maxLogs={5}
    filterByLevel={["error"]}
    compact
    showEventType={false}
    className={className}
  />
);

export const AuthActivityLog: React.FC<{ className?: string }> = ({
  className,
}) => (
  <AuthLogRenderer
    maxLogs={20}
    showTimestamp
    showEventType
    className={className}
  />
);

export const CompactAuthLog: React.FC<{ className?: string }> = ({
  className,
}) => (
  <AuthLogRenderer
    maxLogs={3}
    compact
    showTimestamp={false}
    showEventType={false}
    className={className}
  />
);
