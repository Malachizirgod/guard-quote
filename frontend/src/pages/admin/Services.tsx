import { useState, useEffect, useCallback } from "react";
import { getAuthHeaders } from "../../context/AuthContext";
import { Server, RefreshCw, Play, Square, RotateCcw, ScrollText, Cpu, HardDrive, Thermometer, Activity, Wifi, WifiOff, BarChart3, Info } from "lucide-react";

interface Service {
  name: string;
  displayName: string;
  desc: string;
  status: "running" | "stopped" | "error";
  port?: number;
  host: string;
}

interface HostInfo {
  name: string;
  ip: string;
  status: "online" | "offline";
  uptime?: string;
  loadAvg?: string;
  memoryUsed?: string;
  memoryTotal?: string;
  memoryPercent?: number;
  diskUsed?: string;
  diskTotal?: string;
  diskPercent?: number;
  cpuTemp?: string;
  services: Service[];
}

interface InfraData {
  hosts: HostInfo[];
  summary: {
    online: number;
    offline: number;
    running: number;
    stopped: number;
    error: number;
  };
  prometheus?: {
    status: "up" | "down";
    targets?: number;
    upTargets?: number;
  };
}

export default function Services() {
  const [data, setData] = useState<InfraData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedHost, setSelectedHost] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<{host: string; name: string} | null>(null);
  const [logs, setLogs] = useState<{ service: string; content: string } | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [prometheusStatus, setPrometheusStatus] = useState<"up" | "down" | "checking">("checking");
  
  const checkPrometheus = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/prometheus/health", { headers: getAuthHeaders() });
      const json = await res.json();
      setPrometheusStatus(json.healthy ? "up" : "down");
    } catch {
      setPrometheusStatus("down");
    }
  }, []);
  
  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/infrastructure", { headers: getAuthHeaders() });
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error("Failed to fetch infrastructure:", e);
    }
    setLoading(false);
  }, []);
  
  useEffect(() => {
    fetchData();
    checkPrometheus();
    const interval = setInterval(() => {
      fetchData();
      checkPrometheus();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchData, checkPrometheus]);
  
  const handleAction = async (host: string, service: string, action: string) => {
    setActionLoading(`${host}-${service}-${action}`);
    await fetch(`/api/admin/infrastructure/${host}/${service}/${action}`, { 
      method: "POST", 
      headers: getAuthHeaders() 
    });
    await new Promise(r => setTimeout(r, 2000)); // Wait for service to change state
    await fetchData();
    setActionLoading(null);
  };
  
  const viewLogs = async (host: string, service: string) => {
    const res = await fetch(`/api/admin/infrastructure/${host}/${service}/logs?lines=100`, { 
      headers: getAuthHeaders() 
    });
    const data = await res.json();
    setLogs({ service: `${host}/${service}`, content: data.logs || "No logs available" });
  };
  
  const statusColors: Record<string, string> = {
    running: "bg-emerald-500",
    stopped: "bg-zinc-500",
    error: "bg-red-500",
    online: "bg-emerald-500",
    offline: "bg-red-500",
  };
  
  const statusText: Record<string, string> = {
    running: "text-emerald-400",
    stopped: "text-zinc-400",
    error: "text-red-400",
  };
  
  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <RefreshCw className="w-6 h-6 animate-spin text-zinc-500" />
      </div>
    );
  }
  
  if (!data) {
    return <div className="p-8 text-red-400">Failed to load infrastructure data</div>;
  }
  
  const activeHost = selectedHost ? data.hosts.find(h => h.name === selectedHost) : null;
  const activeSvc = selectedService 
    ? data.hosts.find(h => h.name === selectedService.host)?.services.find(s => s.name === selectedService.name)
    : null;
  
  return (
    <div className="p-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Infrastructure</h1>
          <p className="text-zinc-400 text-sm">Monitor Pi0 and Pi1 services</p>
        </div>
        <button 
          onClick={fetchData} 
          className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg transition text-sm"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>
      
      {/* Prometheus Status Indicator */}
      <div className="mb-6 p-4 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-between group relative">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-lg ${prometheusStatus === "up" ? "bg-emerald-500/20" : prometheusStatus === "down" ? "bg-red-500/20" : "bg-zinc-800"}`}>
            <BarChart3 className={`w-6 h-6 ${prometheusStatus === "up" ? "text-emerald-400" : prometheusStatus === "down" ? "text-red-400" : "text-zinc-500"}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">Prometheus</span>
              <div className="relative group/tooltip">
                <Info className="w-4 h-4 text-zinc-500 hover:text-zinc-300 cursor-help" />
                <div className="absolute left-6 top-0 z-50 w-72 p-3 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-200 text-sm">
                  <p className="font-medium text-zinc-200 mb-1">Time-Series Metrics Database</p>
                  <p className="text-zinc-400 text-xs leading-relaxed">
                    Prometheus collects and stores metrics from all monitored services. 
                    It powers Grafana dashboards, triggers alerts, and tracks system health over time.
                  </p>
                </div>
              </div>
            </div>
            <div className="text-xs text-zinc-500">Monitoring & Alerting Core</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {prometheusStatus === "checking" ? (
            <span className="flex items-center gap-2 text-zinc-400 text-sm">
              <RefreshCw className="w-4 h-4 animate-spin" /> Checking...
            </span>
          ) : prometheusStatus === "up" ? (
            <span className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-full text-sm font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Healthy
            </span>
          ) : (
            <span className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 text-red-400 rounded-full text-sm font-medium">
              <span className="w-2 h-2 rounded-full bg-red-400" /> Down
            </span>
          )}
          <a 
            href="https://prometheus.vandine.us" 
            target="_blank" 
            rel="noopener noreferrer"
            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-sm transition"
          >
            Open →
          </a>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg text-center">
          <div className="text-2xl font-bold text-emerald-400">{data.summary.online}</div>
          <div className="text-xs text-zinc-500 uppercase">Hosts Online</div>
        </div>
        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg text-center">
          <div className="text-2xl font-bold text-emerald-400">{data.summary.running}</div>
          <div className="text-xs text-zinc-500 uppercase">Running</div>
        </div>
        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg text-center">
          <div className="text-2xl font-bold text-zinc-400">{data.summary.stopped}</div>
          <div className="text-xs text-zinc-500 uppercase">Stopped</div>
        </div>
        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg text-center">
          <div className="text-2xl font-bold text-red-400">{data.summary.error}</div>
          <div className="text-xs text-zinc-500 uppercase">Error</div>
        </div>
        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg text-center">
          <div className="text-2xl font-bold text-red-400">{data.summary.offline}</div>
          <div className="text-xs text-zinc-500 uppercase">Offline</div>
        </div>
      </div>
      
      {/* Hosts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {data.hosts.map(host => (
          <div 
            key={host.name}
            className={`bg-zinc-900 border rounded-xl overflow-hidden transition cursor-pointer ${
              selectedHost === host.name ? "border-orange-500" : "border-zinc-800 hover:border-zinc-700"
            }`}
            onClick={() => setSelectedHost(selectedHost === host.name ? null : host.name)}
          >
            {/* Host Header */}
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {host.status === "online" ? (
                  <Wifi className="w-5 h-5 text-emerald-400" />
                ) : (
                  <WifiOff className="w-5 h-5 text-red-400" />
                )}
                <div>
                  <div className="font-semibold text-lg">{host.name}</div>
                  <div className="text-xs text-zinc-500 font-mono">{host.ip}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${statusColors[host.status]}`} />
                <span className={`text-sm ${host.status === "online" ? "text-emerald-400" : "text-red-400"}`}>
                  {host.status}
                </span>
              </div>
            </div>
            
            {/* Host Stats */}
            {host.status === "online" && (
              <div className="p-4 grid grid-cols-4 gap-4 border-b border-zinc-800 bg-zinc-950/50">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-zinc-500" />
                  <div>
                    <div className="text-[10px] text-zinc-500 uppercase">Load</div>
                    <div className="text-sm font-mono">{host.loadAvg || "—"}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-zinc-500" />
                  <div>
                    <div className="text-[10px] text-zinc-500 uppercase">Memory</div>
                    <div className="text-sm font-mono">{host.memoryUsed} / {host.memoryTotal}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-zinc-500" />
                  <div>
                    <div className="text-[10px] text-zinc-500 uppercase">Disk</div>
                    <div className="text-sm font-mono">{host.diskUsed} / {host.diskTotal}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Thermometer className="w-4 h-4 text-zinc-500" />
                  <div>
                    <div className="text-[10px] text-zinc-500 uppercase">Temp</div>
                    <div className="text-sm font-mono">{host.cpuTemp}</div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Services Grid */}
            <div className="p-4 grid grid-cols-5 gap-2">
              {host.services.map(svc => (
                <button
                  key={svc.name}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedService(
                      selectedService?.host === host.name && selectedService?.name === svc.name 
                        ? null 
                        : { host: host.name, name: svc.name }
                    );
                  }}
                  className={`p-2 rounded-lg border text-left transition ${
                    selectedService?.host === host.name && selectedService?.name === svc.name
                      ? "border-orange-500 bg-orange-500/10"
                      : "border-zinc-800 hover:border-zinc-700 bg-zinc-800/50"
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${statusColors[svc.status]}`} />
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {svc.port ? `:${svc.port}` : ""}
                    </span>
                  </div>
                  <div className="text-xs font-medium truncate">{svc.displayName}</div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      {/* Selected Service Panel */}
      {activeSvc && selectedService && (
        <div className="p-5 bg-zinc-900 border border-orange-500/50 rounded-xl">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${statusColors[activeSvc.status]}`} />
                <h3 className="text-lg font-semibold">{activeSvc.displayName}</h3>
                <span className="text-xs text-zinc-500 font-mono">({selectedService.host})</span>
              </div>
              <p className="text-sm text-zinc-400 mt-1">{activeSvc.desc}</p>
            </div>
            <button 
              onClick={() => setSelectedService(null)} 
              className="text-zinc-500 hover:text-white text-xl"
            >
              ×
            </button>
          </div>
          
          <div className="flex gap-4 mb-4 text-sm text-zinc-400">
            {activeSvc.port && (
              <span className="flex items-center gap-1">
                <Server className="w-4 h-4" /> Port {activeSvc.port}
              </span>
            )}
            <span className={`flex items-center gap-1 ${statusText[activeSvc.status]}`}>
              <Activity className="w-4 h-4" /> {activeSvc.status}
            </span>
          </div>
          
          <div className="flex gap-2">
            {activeSvc.status === "running" ? (
              <>
                <button 
                  onClick={() => handleAction(selectedService.host, activeSvc.name, "restart")} 
                  disabled={!!actionLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 rounded text-sm transition disabled:opacity-50"
                >
                  <RotateCcw className="w-4 h-4" /> 
                  {actionLoading === `${selectedService.host}-${activeSvc.name}-restart` ? "..." : "Restart"}
                </button>
                <button 
                  onClick={() => handleAction(selectedService.host, activeSvc.name, "stop")} 
                  disabled={!!actionLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded text-sm transition disabled:opacity-50"
                >
                  <Square className="w-4 h-4" /> 
                  {actionLoading === `${selectedService.host}-${activeSvc.name}-stop` ? "..." : "Stop"}
                </button>
              </>
            ) : (
              <button 
                onClick={() => handleAction(selectedService.host, activeSvc.name, "start")} 
                disabled={!!actionLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded text-sm transition disabled:opacity-50"
              >
                <Play className="w-4 h-4" /> 
                {actionLoading === `${selectedService.host}-${activeSvc.name}-start` ? "..." : "Start"}
              </button>
            )}
            <button 
              onClick={() => viewLogs(selectedService.host, activeSvc.name)}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-zinc-700 hover:bg-zinc-800 rounded text-sm transition"
            >
              <ScrollText className="w-4 h-4" /> Logs
            </button>
          </div>
        </div>
      )}
      
      {/* Logs Modal */}
      {logs && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" 
          onClick={() => setLogs(null)}
        >
          <div 
            className="w-full max-w-5xl max-h-[80vh] bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden" 
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800">
              <h3 className="font-semibold">Logs: {logs.service}</h3>
              <button onClick={() => setLogs(null)} className="text-zinc-500 hover:text-white text-xl">×</button>
            </div>
            <pre className="p-4 text-xs font-mono text-zinc-300 overflow-auto max-h-[60vh] bg-black/50">
              {logs.content}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
