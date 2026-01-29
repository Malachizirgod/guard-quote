import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface ServiceStatus {
  mlEngine: "online" | "offline" | "checking";
  database: "online" | "offline" | "checking";
  demoMode: boolean;
}

interface ServiceStatusContextType {
  status: ServiceStatus;
  checkServices: () => void;
}

const ServiceStatusContext = createContext<ServiceStatusContextType | null>(null);

export function ServiceStatusProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<ServiceStatus>({
    mlEngine: "checking",
    database: "checking",
    demoMode: false,
  });

  const checkServices = async () => {
    try {
      const res = await fetch("/api/status", {
        signal: AbortSignal.timeout(5000)
      });
      if (res.ok) {
        const data = await res.json();
        setStatus({
          database: data.database?.connected ? "online" : "offline",
          mlEngine: data.mlEngine?.connected ? "online" : "offline",
          demoMode: data.mode === "demo",
        });
      } else {
        setStatus({ database: "offline", mlEngine: "offline", demoMode: true });
      }
    } catch {
      setStatus({ database: "offline", mlEngine: "offline", demoMode: true });
    }
  };

  useEffect(() => {
    checkServices();

    // Re-check every 30 seconds
    const interval = setInterval(checkServices, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <ServiceStatusContext.Provider value={{ status, checkServices }}>
      {children}
    </ServiceStatusContext.Provider>
  );
}

export function useServiceStatus() {
  const context = useContext(ServiceStatusContext);
  if (!context) {
    throw new Error("useServiceStatus must be used within ServiceStatusProvider");
  }
  return context;
}
