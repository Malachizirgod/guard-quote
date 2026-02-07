import { useCallback, useState } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  Panel,
  NodeProps,
  Handle,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { 
  Server, 
  Shield, 
  Database, 
  Activity, 
  Wifi,
  MonitorDot,
  HardDrive,
  Network,
  AlertTriangle,
  Eye,
  FileText,
  Zap,
  Cloud,
  X
} from 'lucide-react';

// Custom Node Component
const DeviceNode = ({ data, selected }: NodeProps) => {
  const Icon = data.icon;
  const statusColors: Record<string, string> = {
    online: 'bg-green-500',
    offline: 'bg-red-500',
    warning: 'bg-yellow-500',
    processing: 'bg-blue-500 animate-pulse',
  };

  return (
    <div 
      className={`
        relative px-4 py-3 rounded-lg border-2 min-w-[140px]
        transition-all duration-200 cursor-pointer
        ${selected ? 'border-orange-500 shadow-lg shadow-orange-500/30' : 'border-zinc-600'}
        ${data.category === 'source' ? 'bg-zinc-800' : ''}
        ${data.category === 'processor' ? 'bg-indigo-900/50' : ''}
        ${data.category === 'destination' ? 'bg-emerald-900/50' : ''}
        ${data.category === 'security' ? 'bg-red-900/50' : ''}
        hover:border-orange-400 hover:shadow-md
      `}
    >
      {/* Handles for connections */}
      <Handle type="target" position={Position.Left} className="!bg-orange-500 !w-3 !h-3" />
      <Handle type="source" position={Position.Right} className="!bg-orange-500 !w-3 !h-3" />
      
      {/* Status indicator */}
      <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${statusColors[data.status] || 'bg-gray-500'}`} />
      
      {/* Content */}
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${data.iconBg || 'bg-zinc-700'}`}>
          {Icon && <Icon className={`w-5 h-5 ${data.iconColor || 'text-white'}`} />}
        </div>
        <div>
          <div className="font-semibold text-sm text-white">{data.label}</div>
          <div className="text-xs text-zinc-400">{data.sublabel}</div>
        </div>
      </div>
      
      {/* Data flow indicator */}
      {data.throughput && (
        <div className="mt-2 text-xs text-zinc-500 flex items-center gap-1">
          <Activity className="w-3 h-3" />
          {data.throughput}
        </div>
      )}
    </div>
  );
};

// Node types registration
const nodeTypes = {
  device: DeviceNode,
};

// Initial nodes for the SIEM pipeline
const initialNodes: Node[] = [
  // Data Sources (Left)
  {
    id: 'pa220',
    type: 'device',
    position: { x: 50, y: 50 },
    data: {
      label: 'PA-220',
      sublabel: '192.168.2.14',
      icon: Shield,
      iconBg: 'bg-red-600',
      iconColor: 'text-white',
      category: 'source',
      status: 'online',
      throughput: 'SNMP, Syslog',
      details: {
        type: 'Palo Alto Firewall',
        version: 'PAN-OS 10.1.9-h3',
        ports: ['SNMP 161/udp', 'Syslog 514/udp'],
        metrics: ['Interface stats', 'Threat logs', 'Traffic logs'],
      }
    },
  },
  {
    id: 'udm',
    type: 'device',
    position: { x: 50, y: 170 },
    data: {
      label: 'UDM',
      sublabel: '192.168.2.1',
      icon: Wifi,
      iconBg: 'bg-blue-600',
      iconColor: 'text-white',
      category: 'source',
      status: 'online',
      throughput: 'SNMP, NetFlow',
      details: {
        type: 'UniFi Dream Machine',
        ports: ['SNMP 161/udp', 'NetFlow 2055/udp', 'Syslog 514/udp'],
        metrics: ['Interface traffic', 'Client stats', 'IDS alerts'],
      }
    },
  },
  {
    id: 'pi0',
    type: 'device',
    position: { x: 50, y: 290 },
    data: {
      label: 'pi0',
      sublabel: '192.168.2.101',
      icon: Server,
      iconBg: 'bg-purple-600',
      iconColor: 'text-white',
      category: 'source',
      status: 'online',
      throughput: 'Syslog, Metrics',
      details: {
        type: 'Raspberry Pi 5',
        os: 'Ubuntu 25.10',
        services: ['Vector', 'LDAP', 'rsyslog'],
        ports: ['Syslog 514', 'LDAP 389', 'Node Exporter 9100'],
      }
    },
  },
  {
    id: 'pi1',
    type: 'device',
    position: { x: 50, y: 410 },
    data: {
      label: 'pi1',
      sublabel: '192.168.2.70',
      icon: Server,
      iconBg: 'bg-purple-600',
      iconColor: 'text-white',
      category: 'source',
      status: 'online',
      throughput: 'App Logs, Metrics',
      details: {
        type: 'Raspberry Pi 4',
        os: 'Ubuntu 25.10',
        services: ['GuardQuote API', 'Docker', 'Monitoring Stack'],
        ports: ['API 3002', 'Grafana 3000', 'Prometheus 9090'],
      }
    },
  },

  // Collectors/Processors (Middle)
  {
    id: 'vector',
    type: 'device',
    position: { x: 320, y: 120 },
    data: {
      label: 'Vector',
      sublabel: 'Log Pipeline',
      icon: Zap,
      iconBg: 'bg-amber-600',
      iconColor: 'text-black',
      category: 'processor',
      status: 'processing',
      throughput: '~5k events/min',
      details: {
        type: 'Vector v0.43',
        location: 'pi0',
        sources: ['journald', 'file', 'syslog'],
        sinks: ['Loki', 'Local archive', 'Wazuh (pending)'],
      }
    },
  },
  {
    id: 'prometheus',
    type: 'device',
    position: { x: 320, y: 260 },
    data: {
      label: 'Prometheus',
      sublabel: 'Metrics Store',
      icon: Database,
      iconBg: 'bg-orange-600',
      iconColor: 'text-white',
      category: 'processor',
      status: 'online',
      throughput: '16 targets',
      details: {
        type: 'Prometheus',
        location: 'pi1:9090',
        retention: '7 days',
        targets: ['SNMP', 'Node exporters', 'Blackbox probes'],
      }
    },
  },
  {
    id: 'snmp-exporter',
    type: 'device',
    position: { x: 320, y: 400 },
    data: {
      label: 'SNMP Exporter',
      sublabel: 'SNMP → Metrics',
      icon: Activity,
      iconBg: 'bg-teal-600',
      iconColor: 'text-white',
      category: 'processor',
      status: 'online',
      throughput: 'UDM + PA-220',
      details: {
        type: 'SNMP Exporter v0.30',
        location: 'pi1:9116',
        modules: ['if_mib', 'system'],
        auths: ['udm_v3 (SHA/AES)', 'pa220_v2'],
      }
    },
  },

  // Storage/Visualization (Right-Middle)
  {
    id: 'loki',
    type: 'device',
    position: { x: 580, y: 120 },
    data: {
      label: 'Loki',
      sublabel: 'Log Storage',
      icon: FileText,
      iconBg: 'bg-yellow-600',
      iconColor: 'text-black',
      category: 'processor',
      status: 'online',
      throughput: 'Indexed logs',
      details: {
        type: 'Grafana Loki',
        location: 'pi1:3100',
        retention: '14 days',
        labels: ['host', 'service', 'level'],
      }
    },
  },
  {
    id: 'alertmanager',
    type: 'device',
    position: { x: 580, y: 260 },
    data: {
      label: 'Alertmanager',
      sublabel: 'Alert Routing',
      icon: AlertTriangle,
      iconBg: 'bg-red-500',
      iconColor: 'text-white',
      category: 'processor',
      status: 'online',
      throughput: 'Slack, Email',
      details: {
        type: 'Prometheus Alertmanager',
        location: 'pi1:9093',
        routes: ['Slack #alerts'],
        rules: ['Host down', 'Disk space', 'Service health'],
      }
    },
  },

  // Destinations (Right)
  {
    id: 'grafana',
    type: 'device',
    position: { x: 850, y: 170 },
    data: {
      label: 'Grafana',
      sublabel: 'Visualization',
      icon: MonitorDot,
      iconBg: 'bg-orange-500',
      iconColor: 'text-white',
      category: 'destination',
      status: 'online',
      throughput: 'Dashboards',
      details: {
        type: 'Grafana OSS',
        location: 'pi1:3000',
        external: 'grafana.vandine.us',
        datasources: ['Prometheus', 'Loki'],
        dashboards: ['Matrix Lab Overview', 'GuardQuote Team'],
      }
    },
  },
  {
    id: 'wazuh',
    type: 'device',
    position: { x: 850, y: 320 },
    data: {
      label: 'Wazuh SIEM',
      sublabel: "Isaiah's Instance",
      icon: Eye,
      iconBg: 'bg-cyan-600',
      iconColor: 'text-white',
      category: 'security',
      status: 'warning',
      throughput: 'Pending setup',
      details: {
        type: 'Wazuh 4.x',
        location: 'Tailscale mesh',
        features: ['FIM', 'Rootkit detection', 'Vulnerability scan', 'IDS/IPS'],
        agents: ['pi0 (pending)', 'pi1 (pending)'],
        owner: 'Isaiah Bernal',
      }
    },
  },
  {
    id: 'cloudflare',
    type: 'device',
    position: { x: 850, y: 450 },
    data: {
      label: 'Cloudflare',
      sublabel: 'Edge Access',
      icon: Cloud,
      iconBg: 'bg-orange-400',
      iconColor: 'text-white',
      category: 'destination',
      status: 'online',
      throughput: 'Tunnel + Access',
      details: {
        type: 'Cloudflare Zero Trust',
        tunnel: 'vandine-tunnel',
        apps: ['grafana.vandine.us', 'prometheus.vandine.us'],
        auth: 'Email OTP',
      }
    },
  },
];

// Edges with animations
const initialEdges: Edge[] = [
  // PA-220 flows
  { id: 'pa220-snmp', source: 'pa220', target: 'snmp-exporter', animated: true, style: { stroke: '#f97316' }, label: 'SNMP v2c', labelStyle: { fill: '#999', fontSize: 10 } },
  { id: 'pa220-syslog', source: 'pa220', target: 'vector', animated: true, style: { stroke: '#8b5cf6' }, label: 'Syslog' },
  
  // UDM flows
  { id: 'udm-snmp', source: 'udm', target: 'snmp-exporter', animated: true, style: { stroke: '#f97316' }, label: 'SNMP v3' },
  { id: 'udm-netflow', source: 'udm', target: 'vector', animated: true, style: { stroke: '#22c55e' }, label: 'NetFlow' },
  
  // Pi flows
  { id: 'pi0-vector', source: 'pi0', target: 'vector', animated: true, style: { stroke: '#8b5cf6' } },
  { id: 'pi1-prom', source: 'pi1', target: 'prometheus', animated: true, style: { stroke: '#f97316' }, label: 'Metrics' },
  
  // Processor connections
  { id: 'snmp-prom', source: 'snmp-exporter', target: 'prometheus', animated: true, style: { stroke: '#f97316' } },
  { id: 'vector-loki', source: 'vector', target: 'loki', animated: true, style: { stroke: '#eab308' }, label: 'Logs' },
  { id: 'vector-wazuh', source: 'vector', target: 'wazuh', style: { stroke: '#06b6d4', strokeDasharray: '5 5' }, label: 'Pending' },
  { id: 'prom-alert', source: 'prometheus', target: 'alertmanager', animated: true, style: { stroke: '#ef4444' }, label: 'Alerts' },
  
  // To Grafana
  { id: 'prom-grafana', source: 'prometheus', target: 'grafana', animated: true, style: { stroke: '#f97316' } },
  { id: 'loki-grafana', source: 'loki', target: 'grafana', animated: true, style: { stroke: '#eab308' } },
  { id: 'alert-grafana', source: 'alertmanager', target: 'grafana', style: { stroke: '#ef4444' } },
  
  // External
  { id: 'grafana-cf', source: 'grafana', target: 'cloudflare', animated: true, style: { stroke: '#fb923c' }, label: 'Tunnel' },
];

// Legend Component
const Legend = () => (
  <div className="bg-zinc-900/90 backdrop-blur border border-zinc-700 rounded-lg p-4 text-sm">
    <h4 className="font-semibold text-white mb-3">Data Flow Legend</h4>
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="w-8 h-0.5 bg-orange-500" />
        <span className="text-zinc-400">SNMP Metrics</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-8 h-0.5 bg-purple-500" />
        <span className="text-zinc-400">Syslog</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-8 h-0.5 bg-green-500" />
        <span className="text-zinc-400">NetFlow</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-8 h-0.5 bg-yellow-500" />
        <span className="text-zinc-400">Log Storage</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-8 h-0.5 bg-red-500" />
        <span className="text-zinc-400">Alerts</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-8 h-0.5 bg-cyan-500 border-dashed" style={{ borderStyle: 'dashed' }} />
        <span className="text-zinc-400">Pending</span>
      </div>
    </div>
    <div className="mt-4 pt-3 border-t border-zinc-700">
      <h5 className="font-medium text-white mb-2">Status</h5>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-zinc-400">Online</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-yellow-500" />
          <span className="text-zinc-400">Warning</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-zinc-400">Processing</span>
        </div>
      </div>
    </div>
  </div>
);

// Detail Panel Component
const DetailPanel = ({ node, onClose }: { node: Node | null; onClose: () => void }) => {
  if (!node) return null;
  const { data } = node;
  const Icon = data.icon;

  return (
    <div className="absolute top-4 right-4 w-80 bg-zinc-900/95 backdrop-blur border border-zinc-700 rounded-lg shadow-xl z-50">
      <div className="flex items-center justify-between p-4 border-b border-zinc-700">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${data.iconBg}`}>
            <Icon className={`w-5 h-5 ${data.iconColor}`} />
          </div>
          <div>
            <h3 className="font-semibold text-white">{data.label}</h3>
            <p className="text-xs text-zinc-400">{data.sublabel}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-zinc-700 rounded">
          <X className="w-4 h-4 text-zinc-400" />
        </button>
      </div>
      
      {data.details && (
        <div className="p-4 space-y-3 text-sm">
          {Object.entries(data.details).map(([key, value]) => (
            <div key={key}>
              <dt className="text-zinc-500 capitalize">{key.replace(/_/g, ' ')}</dt>
              <dd className="text-white mt-0.5">
                {Array.isArray(value) ? (
                  <ul className="list-disc list-inside text-zinc-300">
                    {(value as string[]).map((item, i) => (
                      <li key={i} className="text-xs">{item}</li>
                    ))}
                  </ul>
                ) : (
                  String(value)
                )}
              </dd>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Main Component
export function DataFlowDiagram() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  return (
    <div className="w-full h-[600px] bg-zinc-950 rounded-xl border border-zinc-800 relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.5}
        maxZoom={1.5}
        defaultEdgeOptions={{
          type: 'smoothstep',
          markerEnd: { type: MarkerType.ArrowClosed, color: '#666' },
        }}
      >
        <Background color="#333" gap={20} />
        <Controls className="!bg-zinc-800 !border-zinc-700 !rounded-lg" />
        <MiniMap 
          nodeColor={(node) => {
            switch (node.data?.category) {
              case 'source': return '#3f3f46';
              case 'processor': return '#312e81';
              case 'destination': return '#064e3b';
              case 'security': return '#7f1d1d';
              default: return '#27272a';
            }
          }}
          className="!bg-zinc-900 !border-zinc-700"
        />
        
        {/* Legend */}
        <Panel position="bottom-left">
          <Legend />
        </Panel>
        
        {/* Title */}
        <Panel position="top-left">
          <div className="bg-zinc-900/90 backdrop-blur px-4 py-2 rounded-lg border border-zinc-700">
            <h2 className="text-lg font-bold text-white">SIEM Data Pipeline</h2>
            <p className="text-xs text-zinc-400">Matrix Lab Infrastructure → Security Monitoring</p>
          </div>
        </Panel>
      </ReactFlow>
      
      {/* Detail Panel */}
      <DetailPanel node={selectedNode} onClose={() => setSelectedNode(null)} />
    </div>
  );
}

export default DataFlowDiagram;
