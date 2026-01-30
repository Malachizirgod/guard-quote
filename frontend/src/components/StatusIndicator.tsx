import { useState, useEffect } from "react";
import styles from "./StatusIndicator.module.css";

interface SystemStatus {
  mode: "demo" | "development" | "production";
  database: { connected: boolean; local: boolean };
  mlEngine: { connected: boolean; version: string | null };
}

interface StatusIndicatorProps {
  compact?: boolean;
}

export default function StatusIndicator({ compact = false }: StatusIndicatorProps) {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch("/api/status");
        if (res.ok) {
          const data = await res.json();
          setStatus(data);
        } else {
          // Backend not reachable - demo mode
          setStatus({
            mode: "demo",
            database: { connected: false, local: true },
            mlEngine: { connected: false, version: null },
          });
        }
      } catch {
        // Network error - demo mode
        setStatus({
          mode: "demo",
          database: { connected: false, local: true },
          mlEngine: { connected: false, version: null },
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
    // Refresh every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className={`${styles.indicator} ${styles.loading} ${compact ? styles.compact : ""}`}>
        <span className={styles.dot} />
        <span className={styles.label}>Checking...</span>
      </div>
    );
  }

  const isDemo = status?.mode === "demo" || !status?.database.connected;
  const isLive = status?.database.connected && !status?.database.local;

  const getModeLabel = () => {
    if (isLive) return "Live";
    if (status?.database.connected) return "Local DB";
    return "Demo Mode";
  };

  const getModeColor = () => {
    if (isLive) return "#22c55e"; // green
    if (status?.database.connected) return "#3b82f6"; // blue
    return "#fdb927"; // yellow/amber for demo
  };

  return (
    <div className={styles.wrapper}>
      <button
        className={`${styles.indicator} ${compact ? styles.compact : ""}`}
        onClick={() => setExpanded(!expanded)}
        style={{ borderColor: getModeColor() }}
      >
        <span className={styles.dot} style={{ backgroundColor: getModeColor() }} />
        <span className={styles.label}>{getModeLabel()}</span>
      </button>

      {expanded && (
        <div className={styles.dropdown}>
          <div className={styles.dropdownHeader}>
            <span>System Status</span>
            <button className={styles.closeBtn} onClick={() => setExpanded(false)}>×</button>
          </div>

          <div className={styles.statusItem}>
            <span className={styles.statusLabel}>Database</span>
            <span className={`${styles.statusValue} ${status?.database.connected ? styles.connected : styles.disconnected}`}>
              {status?.database.connected ? "Connected" : "Not Connected"}
              {status?.database.connected && status?.database.local && " (Local)"}
            </span>
          </div>

          <div className={styles.statusItem}>
            <span className={styles.statusLabel}>ML Engine</span>
            <span className={`${styles.statusValue} ${status?.mlEngine.connected ? styles.connected : styles.disconnected}`}>
              {status?.mlEngine.connected ? `v${status.mlEngine.version}` : "Not Connected"}
            </span>
          </div>

          {isDemo && (
            <div className={styles.demoNotice}>
              <strong>Demo Mode</strong>
              <p>Running with mock data. Connect to a database for full functionality.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
