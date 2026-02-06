import { useState } from "react";
import { 
  Network, Server, Cloud, Globe, Shield, Download, Copy, Check, 
  Router, Monitor, Users, ExternalLink, Lock,
  Laptop, Smartphone, ChevronRight, Terminal, Key, Mail, ArrowRight,
  Database, Activity, FileText, Zap, Info, BookOpen
} from "lucide-react";

// Connection flows - what connects to what
const connectionFlows = [
  {
    id: "public-web",
    name: "Public Web Access",
    description: "How users access GuardQuote website",
    color: "orange",
    steps: [
      { from: "Browser", to: "Cloudflare Pages", protocol: "HTTPS", port: 443, note: "CDN cached" },
      { from: "Cloudflare Pages", to: "Edge Worker", protocol: "Internal", note: "API routing" },
      { from: "Edge Worker", to: "Argo Tunnel", protocol: "HTTPS", note: "/api/* requests" },
      { from: "Argo Tunnel", to: "Pi1 (cloudflared)", protocol: "QUIC", note: "Encrypted tunnel" },
      { from: "cloudflared", to: "GuardQuote API", protocol: "HTTP", port: 3002, note: "localhost" },
    ],
  },
  {
    id: "protected-access",
    name: "Protected Service Access (Grafana, etc.)",
    description: "How team members access monitoring tools",
    color: "blue",
    steps: [
      { from: "Browser", to: "grafana.vandine.us", protocol: "HTTPS", port: 443 },
      { from: "Cloudflare", to: "Zero Trust Access", protocol: "Auth Check", note: "Email OTP required" },
      { from: "Zero Trust", to: "Argo Tunnel", protocol: "HTTPS", note: "After auth success" },
      { from: "Argo Tunnel", to: "Pi1 (cloudflared)", protocol: "QUIC" },
      { from: "cloudflared", to: "Grafana", protocol: "HTTP", port: 3000, note: "localhost" },
    ],
  },
  {
    id: "tailscale-ssh",
    name: "Admin SSH Access (Tailscale)",
    description: "How admins connect directly to servers",
    color: "purple",
    steps: [
      { from: "Your Device", to: "Tailscale Client", protocol: "Start", note: "Must be logged in" },
      { from: "Tailscale", to: "Tailscale Mesh", protocol: "WireGuard", note: "Encrypted P2P" },
      { from: "Mesh", to: "Pi1 (100.x.x.70)", protocol: "Direct", note: "Tailscale IP" },
      { from: "Your Terminal", to: "SSH Server", protocol: "SSH", port: 22, note: "Key auth" },
    ],
  },
];

// Tailscale setup instructions
const tailscaleSetup = {
  platforms: [
    {
      name: "macOS",
      icon: "🍎",
      steps: [
        "Download Tailscale from the Mac App Store",
        "Open Tailscale and click 'Get Started'",
        "Sign in with your account (ask Rafa for invite)",
        "Click 'Connect' to join the network",
        "You'll see a Tailscale icon in your menu bar when connected",
      ],
    },
    {
      name: "Windows",
      icon: "🪟",
      steps: [
        "Download Tailscale from tailscale.com/download",
        "Run the installer",
        "Click the Tailscale icon in the system tray",
        "Sign in with your account",
        "Click 'Connect' to join the network",
      ],
    },
    {
      name: "Linux",
      icon: "🐧",
      steps: [
        "Run: curl -fsSL https://tailscale.com/install.sh | sh",
        "Run: sudo tailscale up",
        "Open the URL shown to authenticate",
        "Verify with: tailscale status",
      ],
    },
    {
      name: "iOS/Android",
      icon: "📱",
      steps: [
        "Install Tailscale from App Store / Play Store",
        "Open the app and sign in",
        "Toggle the connection ON",
        "Allow VPN configuration when prompted",
      ],
    },
  ],
};

// Resources and how to access them
const resources = [
  {
    name: "GuardQuote Dashboard",
    type: "Web App",
    publicUrl: "https://guardquote.vandine.us",
    internalUrl: null,
    auth: "Email/Password login",
    whoCanAccess: ["All team members"],
    howToAccess: [
      "Go to guardquote.vandine.us",
      "Click 'Admin Login'",
      "Enter your @guardquote.com email and password",
    ],
  },
  {
    name: "Grafana Dashboards",
    type: "Monitoring",
    publicUrl: "https://grafana.vandine.us",
    internalUrl: "http://192.168.2.70:3000",
    auth: "Cloudflare Access (Email OTP)",
    whoCanAccess: ["All team members"],
    howToAccess: [
      "Go to grafana.vandine.us",
      "Enter your @guardquote.com email",
      "Check your email for the OTP code",
      "Enter the code to access",
      "Default dashboards: Matrix Lab Overview, GuardQuote Team",
    ],
  },
  {
    name: "Prometheus",
    type: "Metrics DB",
    publicUrl: "https://prometheus.vandine.us",
    internalUrl: "http://192.168.2.70:9090",
    auth: "Cloudflare Access (Email OTP)",
    whoCanAccess: ["All team members"],
    howToAccess: [
      "Go to prometheus.vandine.us",
      "Authenticate with email OTP",
      "Use PromQL to query metrics",
    ],
  },
  {
    name: "SSH to Pi1",
    type: "Server Access",
    publicUrl: null,
    internalUrl: "ssh johnmarston@100.x.x.70",
    auth: "Tailscale + SSH Key",
    whoCanAccess: ["Admins only (Rafa)"],
    howToAccess: [
      "Ensure Tailscale is connected",
      "Open terminal",
      "Run: ssh johnmarston@pi1",
      "Or use Tailscale IP: ssh johnmarston@100.x.x.70",
    ],
  },
  {
    name: "PostgreSQL Database",
    type: "Database",
    publicUrl: null,
    internalUrl: "postgresql://192.168.2.70:5432/guardquote",
    auth: "Tailscale + Password",
    whoCanAccess: ["Admins only (Rafa)"],
    howToAccess: [
      "Connect to Tailscale",
      "Run: psql -h pi1 -U postgres -d guardquote",
      "Or use a GUI like TablePlus/DBeaver with Tailscale IP",
    ],
  },
];

// Team access matrix
const teamMatrix = [
  { resource: "GuardQuote Dashboard", isaiah: "✅", milkias: "✅", xavier: "✅", rafa: "✅" },
  { resource: "Grafana Dashboards", isaiah: "✅", milkias: "✅", xavier: "✅", rafa: "✅" },
  { resource: "Prometheus", isaiah: "✅", milkias: "✅", xavier: "✅", rafa: "✅" },
  { resource: "Loki Logs", isaiah: "✅", milkias: "✅", xavier: "✅", rafa: "✅" },
  { resource: "GitHub Repo", isaiah: "✅", milkias: "✅", xavier: "✅", rafa: "✅" },
  { resource: "SSH to Servers", isaiah: "❌", milkias: "❌", xavier: "❌", rafa: "✅" },
  { resource: "Database Direct", isaiah: "❌", milkias: "❌", xavier: "❌", rafa: "✅" },
  { resource: "Tailscale VPN", isaiah: "❌", milkias: "❌", xavier: "❌", rafa: "✅" },
];

export default function NetworkPage() {
  const [activeTab, setActiveTab] = useState<"flows" | "howto" | "tailscale" | "matrix">("flows");
  const [copied, setCopied] = useState<string | null>(null);
  const [expandedFlow, setExpandedFlow] = useState<string | null>("public-web");

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="p-6 max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <Network className="w-7 h-7 text-accent" />
          Network & Access Guide
        </h1>
        <p className="text-text-secondary mt-1">
          Connection flows, access instructions, and team permissions
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-border overflow-x-auto">
        {[
          { id: "flows", label: "Connection Flows", icon: Zap },
          { id: "howto", label: "How to Connect", icon: BookOpen },
          { id: "tailscale", label: "Tailscale Setup", icon: Shield },
          { id: "matrix", label: "Access Matrix", icon: Users },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition whitespace-nowrap ${
              activeTab === tab.id 
                ? "border-accent text-accent" 
                : "border-transparent text-text-secondary hover:text-text-primary"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Connection Flows Tab */}
      {activeTab === "flows" && (
        <div className="space-y-4">
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-400 mt-0.5" />
              <div>
                <p className="text-sm text-text-secondary">
                  Click each flow to see exactly how data travels from your browser to the service.
                  This helps understand what's happening when you access different resources.
                </p>
              </div>
            </div>
          </div>

          {connectionFlows.map(flow => {
            const isExpanded = expandedFlow === flow.id;
            const colors: Record<string, string> = {
              orange: "border-orange-500/30 bg-orange-500/5",
              blue: "border-blue-500/30 bg-blue-500/5",
              purple: "border-purple-500/30 bg-purple-500/5",
            };
            const dotColors: Record<string, string> = {
              orange: "bg-orange-500",
              blue: "bg-blue-500",
              purple: "bg-purple-500",
            };
            
            return (
              <div 
                key={flow.id}
                className={`border rounded-xl overflow-hidden transition-all ${colors[flow.color] || colors.blue}`}
              >
                <button
                  onClick={() => setExpandedFlow(isExpanded ? null : flow.id)}
                  className="w-full p-4 flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${dotColors[flow.color]}`} />
                    <div>
                      <div className="font-semibold">{flow.name}</div>
                      <div className="text-sm text-text-muted">{flow.description}</div>
                    </div>
                  </div>
                  <ChevronRight className={`w-5 h-5 text-text-muted transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                </button>
                
                {isExpanded && (
                  <div className="px-4 pb-4">
                    <div className="bg-void/50 rounded-lg p-4 space-y-3">
                      {flow.steps.map((step, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className="flex items-center gap-2 min-w-[140px]">
                            <div className="w-8 h-8 rounded-lg bg-elevated flex items-center justify-center text-xs font-bold text-text-muted">
                              {i + 1}
                            </div>
                            <span className="text-sm font-medium">{step.from}</span>
                          </div>
                          
                          <div className="flex-1 flex items-center gap-2">
                            <div className="flex-1 h-px bg-gradient-to-r from-text-muted/50 to-transparent" />
                            <div className="px-2 py-0.5 bg-elevated rounded text-xs">
                              {step.protocol}
                              {step.port && <span className="text-accent ml-1">:{step.port}</span>}
                            </div>
                            <ArrowRight className="w-4 h-4 text-text-muted" />
                          </div>
                          
                          <div className="min-w-[140px]">
                            <span className="text-sm font-medium">{step.to}</span>
                            {step.note && (
                              <span className="text-xs text-text-muted ml-2">({step.note})</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Visual Summary */}
          <div className="mt-8 bg-surface border border-border rounded-xl p-6">
            <h3 className="font-semibold mb-4">Quick Reference</h3>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                <div className="font-medium text-orange-400 mb-2">🌐 Public Access</div>
                <div className="text-text-secondary">
                  Browser → Cloudflare → Tunnel → Pi1
                </div>
                <div className="text-xs text-text-muted mt-1">No auth for public pages</div>
              </div>
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <div className="font-medium text-blue-400 mb-2">🔒 Protected Services</div>
                <div className="text-text-secondary">
                  Browser → CF Access → Tunnel → Pi1
                </div>
                <div className="text-xs text-text-muted mt-1">Email OTP required</div>
              </div>
              <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                <div className="font-medium text-purple-400 mb-2">🔑 Admin Access</div>
                <div className="text-text-secondary">
                  Device → Tailscale → Pi directly
                </div>
                <div className="text-xs text-text-muted mt-1">VPN + SSH key required</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* How to Connect Tab */}
      {activeTab === "howto" && (
        <div className="space-y-6">
          {resources.map((resource, i) => (
            <div key={i} className="bg-surface border border-border rounded-xl overflow-hidden">
              <div className="p-4 border-b border-border bg-elevated/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {resource.type === "Web App" && <Globe className="w-5 h-5 text-orange-400" />}
                    {resource.type === "Monitoring" && <Activity className="w-5 h-5 text-green-400" />}
                    {resource.type === "Metrics DB" && <Database className="w-5 h-5 text-red-400" />}
                    {resource.type === "Server Access" && <Terminal className="w-5 h-5 text-purple-400" />}
                    {resource.type === "Database" && <Database className="w-5 h-5 text-blue-400" />}
                    <div>
                      <div className="font-semibold">{resource.name}</div>
                      <div className="text-xs text-text-muted">{resource.type}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Lock className="w-3 h-3 text-text-muted" />
                    <span className="text-xs text-text-muted">{resource.auth}</span>
                  </div>
                </div>
              </div>
              
              <div className="p-4">
                {/* URLs */}
                <div className="flex flex-wrap gap-4 mb-4">
                  {resource.publicUrl && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-text-muted">Public URL:</span>
                      <a 
                        href={resource.publicUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-accent hover:underline flex items-center gap-1"
                      >
                        {resource.publicUrl.replace("https://", "")}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                  {resource.internalUrl && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-text-muted">Internal:</span>
                      <code className="text-sm text-purple-400">{resource.internalUrl}</code>
                      <button
                        onClick={() => copyToClipboard(resource.internalUrl!, `internal-${i}`)}
                        className="p-1 hover:bg-elevated rounded"
                      >
                        {copied === `internal-${i}` ? (
                          <Check className="w-3 h-3 text-green-400" />
                        ) : (
                          <Copy className="w-3 h-3 text-text-muted" />
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* Who can access */}
                <div className="mb-4">
                  <span className="text-xs text-text-muted">Who can access: </span>
                  {resource.whoCanAccess.map((who, j) => (
                    <span key={j} className="inline-flex items-center gap-1 px-2 py-0.5 bg-elevated rounded text-xs ml-1">
                      <Users className="w-3 h-3" />
                      {who}
                    </span>
                  ))}
                </div>

                {/* Steps */}
                <div className="bg-elevated rounded-lg p-4">
                  <div className="text-xs font-medium text-text-muted mb-2">STEPS TO CONNECT:</div>
                  <ol className="space-y-2">
                    {resource.howToAccess.map((step, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm">
                        <span className="w-5 h-5 rounded-full bg-accent/20 text-accent flex items-center justify-center text-xs flex-shrink-0">
                          {j + 1}
                        </span>
                        <span className="text-text-secondary">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tailscale Setup Tab */}
      {activeTab === "tailscale" && (
        <div className="space-y-6">
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-purple-400 mt-0.5" />
              <div>
                <div className="font-medium text-purple-400">What is Tailscale?</div>
                <p className="text-sm text-text-secondary mt-1">
                  Tailscale is a mesh VPN that creates a secure network between your devices.
                  Once connected, you can access servers directly as if you were on the same local network.
                  <strong className="text-text-primary"> Currently only required for admin access (Rafa).</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Prerequisites */}
          <div className="bg-surface border border-border rounded-xl p-5">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Key className="w-4 h-4 text-accent" />
              Prerequisites
            </h3>
            <ul className="space-y-2 text-sm text-text-secondary">
              <li className="flex items-center gap-2">
                <ChevronRight className="w-4 h-4 text-accent" />
                Request Tailscale network invite from Rafa (rafael.garcia.contact.me@gmail.com)
              </li>
              <li className="flex items-center gap-2">
                <ChevronRight className="w-4 h-4 text-accent" />
                Once approved, you'll receive an email with login link
              </li>
              <li className="flex items-center gap-2">
                <ChevronRight className="w-4 h-4 text-accent" />
                For SSH access: provide your public SSH key to Rafa
              </li>
            </ul>
          </div>

          {/* Platform Instructions */}
          <div className="grid md:grid-cols-2 gap-4">
            {tailscaleSetup.platforms.map((platform, i) => (
              <div key={i} className="bg-surface border border-border rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">{platform.icon}</span>
                  <span className="font-semibold">{platform.name}</span>
                </div>
                <ol className="space-y-2">
                  {platform.steps.map((step, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm">
                      <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs flex-shrink-0">
                        {j + 1}
                      </span>
                      <span className="text-text-secondary">
                        {step.includes("curl") || step.includes("sudo") || step.includes("tailscale") ? (
                          <code className="bg-void px-1 rounded text-purple-300">{step}</code>
                        ) : (
                          step
                        )}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>

          {/* After Connected */}
          <div className="bg-surface border border-border rounded-xl p-5">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-accent" />
              After You're Connected
            </h3>
            
            <div className="space-y-4">
              <div className="p-4 bg-elevated rounded-lg">
                <div className="text-sm font-medium mb-2">Verify Connection</div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-void px-3 py-2 rounded text-sm text-green-400">
                    tailscale status
                  </code>
                  <button
                    onClick={() => copyToClipboard("tailscale status", "ts-status")}
                    className="p-2 hover:bg-void rounded"
                  >
                    {copied === "ts-status" ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-text-muted" />}
                  </button>
                </div>
              </div>

              <div className="p-4 bg-elevated rounded-lg">
                <div className="text-sm font-medium mb-2">SSH to Pi1 (Services)</div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-void px-3 py-2 rounded text-sm text-green-400">
                    ssh johnmarston@pi1
                  </code>
                  <button
                    onClick={() => copyToClipboard("ssh johnmarston@pi1", "ssh-pi1")}
                    className="p-2 hover:bg-void rounded"
                  >
                    {copied === "ssh-pi1" ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-text-muted" />}
                  </button>
                </div>
              </div>

              <div className="p-4 bg-elevated rounded-lg">
                <div className="text-sm font-medium mb-2">SSH to Pi0 (Monitoring)</div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-void px-3 py-2 rounded text-sm text-green-400">
                    ssh rafaeljg@pi0
                  </code>
                  <button
                    onClick={() => copyToClipboard("ssh rafaeljg@pi0", "ssh-pi0")}
                    className="p-2 hover:bg-void rounded"
                  >
                    {copied === "ssh-pi0" ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-text-muted" />}
                  </button>
                </div>
              </div>

              <div className="p-4 bg-elevated rounded-lg">
                <div className="text-sm font-medium mb-2">Connect to Database</div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-void px-3 py-2 rounded text-sm text-green-400 overflow-x-auto">
                    PGPASSWORD=guardquote123 psql -h pi1 -U postgres -d guardquote
                  </code>
                  <button
                    onClick={() => copyToClipboard("PGPASSWORD=guardquote123 psql -h pi1 -U postgres -d guardquote", "db-connect")}
                    className="p-2 hover:bg-void rounded"
                  >
                    {copied === "db-connect" ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-text-muted" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Tailscale Hosts */}
          <div className="bg-surface border border-border rounded-xl p-5">
            <h3 className="font-semibold mb-4">Network Hosts</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-text-muted border-b border-border">
                    <th className="pb-2">Host</th>
                    <th className="pb-2">Tailscale Name</th>
                    <th className="pb-2">Local IP</th>
                    <th className="pb-2">Services</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="py-3 font-medium">Pi1 - Services</td>
                    <td className="py-3"><code className="text-purple-400">pi1</code></td>
                    <td className="py-3"><code className="text-text-secondary">192.168.2.70</code></td>
                    <td className="py-3 text-text-muted">API, Grafana, Prometheus, PostgreSQL</td>
                  </tr>
                  <tr>
                    <td className="py-3 font-medium">Pi0 - Monitoring</td>
                    <td className="py-3"><code className="text-purple-400">pi0</code></td>
                    <td className="py-3"><code className="text-text-secondary">192.168.2.101</code></td>
                    <td className="py-3 text-text-muted">LDAP, Syslog, NFS</td>
                  </tr>
                  <tr>
                    <td className="py-3 font-medium">ThinkStation (WSL)</td>
                    <td className="py-3"><code className="text-purple-400">thinkstation</code></td>
                    <td className="py-3"><code className="text-text-secondary">192.168.2.80</code></td>
                    <td className="py-3 text-text-muted">OpenClaw, Development</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Access Matrix Tab */}
      {activeTab === "matrix" && (
        <div className="space-y-6">
          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-elevated">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium">Resource</th>
                    <th className="text-center px-4 py-3 font-medium">
                      <div className="flex flex-col items-center">
                        <span>Isaiah</span>
                        <span className="text-xs text-text-muted font-normal">Developer</span>
                      </div>
                    </th>
                    <th className="text-center px-4 py-3 font-medium">
                      <div className="flex flex-col items-center">
                        <span>Milkias</span>
                        <span className="text-xs text-text-muted font-normal">Developer</span>
                      </div>
                    </th>
                    <th className="text-center px-4 py-3 font-medium">
                      <div className="flex flex-col items-center">
                        <span>Xavier</span>
                        <span className="text-xs text-text-muted font-normal">Developer</span>
                      </div>
                    </th>
                    <th className="text-center px-4 py-3 font-medium">
                      <div className="flex flex-col items-center">
                        <span>Rafa</span>
                        <span className="text-xs text-text-muted font-normal">Admin</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {teamMatrix.map((row, i) => (
                    <tr key={i} className="hover:bg-elevated/30">
                      <td className="px-4 py-3 font-medium">{row.resource}</td>
                      <td className="px-4 py-3 text-center text-lg">{row.isaiah}</td>
                      <td className="px-4 py-3 text-center text-lg">{row.milkias}</td>
                      <td className="px-4 py-3 text-center text-lg">{row.xavier}</td>
                      <td className="px-4 py-3 text-center text-lg">{row.rafa}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Legend */}
          <div className="flex gap-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-lg">✅</span>
              <span className="text-text-muted">Has access</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">❌</span>
              <span className="text-text-muted">No access (admin only)</span>
            </div>
          </div>

          {/* Access Notes */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
              <div className="font-medium text-green-400 mb-2 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Web Access (Everyone)
              </div>
              <p className="text-sm text-text-secondary">
                Use your @guardquote.com email to access protected services.
                You'll receive a one-time code via email. No VPN needed.
              </p>
            </div>
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
              <div className="font-medium text-purple-400 mb-2 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Direct Access (Admin Only)
              </div>
              <p className="text-sm text-text-secondary">
                SSH and database access requires Tailscale VPN.
                Contact Rafa if you need elevated access for a specific task.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
