import { useState, useEffect } from "react";
import styles from "./StatusIndicator.module.css";

interface StatusData {
  mode: "demo" | "development";
  database: { connected: boolean; local: boolean };
  mlEngine: { connected: boolean; version: string | null };
}

export default function StatusIndicator() {
  const [status, setStatus] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch("http://localhost:3000/api/status");
        if (res.ok) {
          setStatus(await res.json());
        }
      } catch {
        setStatus(null);
      } finally {
        setLoading(false);
      }
    };

    checkStatus();
    // Poll every 30 seconds
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className={styles.status}>
        <span className={styles.dot + " " + styles.loading} />
        <span>Checking...</span>
      </div>
    );
  }

  if (!status) {
    return (
      <div className={styles.status}>
        <span className={styles.dot + " " + styles.error} />
        <span>API Offline</span>
      </div>
    );
  }

  const allConnected = status.database.connected && status.mlEngine.connected;

  return (
    <div className={styles.status}>
      <span className={styles.modeBadge} data-mode={status.mode}>
        {status.mode === "demo" ? "DEMO" : "DEV"}
      </span>
      <div className={styles.indicators}>
        <span
          className={styles.indicator}
          title={`Database: ${status.database.connected ? "Connected" : "Disconnected"}${status.database.local ? " (Local)" : " (Pi)"}`}
        >
          <span className={styles.dot + " " + (status.database.connected ? styles.ok : styles.error)} />
          DB
        </span>
        <span
          className={styles.indicator}
          title={`ML Engine: ${status.mlEngine.connected ? `v${status.mlEngine.version}` : "Disconnected"}`}
        >
          <span className={styles.dot + " " + (status.mlEngine.connected ? styles.ok : styles.error)} />
          ML
        </span>
      </div>
      <span className={styles.allStatus + " " + (allConnected ? styles.ok : styles.warn)}>
        {allConnected ? "All Systems Go" : "Degraded"}
      </span>
    </div>
  );
}
