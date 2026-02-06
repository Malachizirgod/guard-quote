import { Shield, Server, Database, Cloud, Cpu, Zap, Globe, Lock, ArrowRight } from "lucide-react";

const techStack = {
  frontend: {
    title: "Frontend",
    icon: Globe,
    color: "text-blue-400",
    items: [
      { name: "React 18", desc: "UI framework with concurrent features" },
      { name: "TypeScript", desc: "Type-safe development" },
      { name: "Vite", desc: "Lightning-fast build tool" },
      { name: "TailwindCSS", desc: "Utility-first styling" },
      { name: "React Router 7", desc: "Client-side navigation" },
      { name: "Lucide Icons", desc: "Beautiful icon set" },
    ]
  },
  edge: {
    title: "Edge & CDN",
    icon: Cloud,
    color: "text-orange-400",
    items: [
      { name: "Cloudflare Pages", desc: "Global static hosting" },
      { name: "Cloudflare Workers", desc: "Edge API proxy" },
      { name: "Argo Tunnel", desc: "Secure origin connection" },
      { name: "Zero Trust Access", desc: "Identity-aware protection" },
    ]
  },
  backend: {
    title: "Backend API",
    icon: Server,
    color: "text-green-400",
    items: [
      { name: "Hono", desc: "Ultrafast web framework" },
      { name: "Deno 2.6", desc: "Secure TypeScript runtime" },
      { name: "Node.js 22", desc: "Fallback runtime" },
      { name: "RFC 7807", desc: "Standard error responses" },
    ]
  },
  data: {
    title: "Data Layer",
    icon: Database,
    color: "text-purple-400",
    items: [
      { name: "PostgreSQL 16", desc: "Primary database" },
      { name: "Redis", desc: "Caching & sessions" },
      { name: "Zod", desc: "Runtime validation" },
    ]
  },
  infra: {
    title: "Infrastructure",
    icon: Cpu,
    color: "text-pink-400",
    items: [
      { name: "Raspberry Pi 4", desc: "ARM64 compute cluster" },
      { name: "Ubuntu 25.10", desc: "Server OS" },
      { name: "Docker Compose", desc: "Container orchestration" },
      { name: "systemd", desc: "Service management" },
    ]
  },
  security: {
    title: "Security",
    icon: Lock,
    color: "text-red-400",
    items: [
      { name: "Cloudflare Access", desc: "Zero Trust auth" },
      { name: "bcrypt", desc: "Password hashing" },
      { name: "JWT", desc: "Stateless sessions" },
      { name: "CORS", desc: "Cross-origin protection" },
    ]
  }
};

const benchmarks = [
  { 
    label: "Runtime Comparison", 
    desc: "Concurrent request throughput (req/s)",
    data: [
      { name: "Deno + Hono", value: 93.5, color: "bg-green-500" },
      { name: "Node.js + Express", value: 76.3, color: "bg-yellow-500" },
      { name: "Bun", value: 0, color: "bg-red-500", note: "Incompatible with Pi4" },
    ]
  },
  {
    label: "Cold Start",
    desc: "Time to first response (ms)",
    data: [
      { name: "Cloudflare Workers", value: 12, color: "bg-green-500" },
      { name: "Deno Deploy", value: 45, color: "bg-yellow-500" },
      { name: "Node.js (Docker)", value: 180, color: "bg-orange-500" },
    ]
  }
];

const architecture = `
┌─────────────────────────────────────────────────────────────┐
│                    CLOUDFLARE EDGE                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │    Pages    │  │   Worker    │  │    Argo Tunnel      │ │
│  │  (Frontend) │  │ (API Proxy) │  │  (Secure Connect)   │ │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘ │
└─────────┼────────────────┼─────────────────────┼───────────┘
          │                │                     │
          └────────────────┴─────────────────────┘
                           │
                    ┌──────▼──────┐
                    │   PI1 Host  │
                    │  (ARM64)    │
                    ├─────────────┤
                    │ ┌─────────┐ │
                    │ │  Hono   │ │
                    │ │   API   │ │
                    │ └────┬────┘ │
                    │      │      │
                    │ ┌────▼────┐ │
                    │ │Postgres │ │
                    │ └─────────┘ │
                    └─────────────┘
`;

export default function TechStack() {
  return (
    <div className="py-16 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-block mb-4 px-4 py-1.5 bg-accent/20 rounded text-accent text-xs font-mono font-medium tracking-wider">
            INFRASTRUCTURE
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Tech Stack</h1>
          <p className="text-zinc-400 max-w-2xl mx-auto">
            Built on modern, battle-tested technologies. Self-hosted on Raspberry Pi, 
            globally distributed via Cloudflare's edge network.
          </p>
        </div>

        {/* Architecture Diagram */}
        <div className="mb-16 p-6 bg-zinc-900 border border-zinc-800 rounded-xl overflow-x-auto">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-accent" />
            Architecture Overview
          </h2>
          <pre className="text-xs md:text-sm text-zinc-400 font-mono leading-relaxed">
            {architecture}
          </pre>
        </div>

        {/* Tech Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {Object.entries(techStack).map(([key, category]) => (
            <div key={key} className="p-6 bg-zinc-900 border border-zinc-800 rounded-xl">
              <div className="flex items-center gap-3 mb-4">
                <category.icon className={`w-6 h-6 ${category.color}`} />
                <h3 className="text-lg font-semibold">{category.title}</h3>
              </div>
              <ul className="space-y-3">
                {category.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <ArrowRight className="w-4 h-4 text-zinc-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-zinc-200 font-medium">{item.name}</span>
                      <span className="text-zinc-500 text-sm ml-2">— {item.desc}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Benchmarks */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-8 text-center">Performance Benchmarks</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {benchmarks.map((benchmark, i) => (
              <div key={i} className="p-6 bg-zinc-900 border border-zinc-800 rounded-xl">
                <h3 className="text-lg font-semibold mb-1">{benchmark.label}</h3>
                <p className="text-sm text-zinc-500 mb-4">{benchmark.desc}</p>
                <div className="space-y-3">
                  {benchmark.data.map((item, j) => (
                    <div key={j}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-zinc-300">{item.name}</span>
                        <span className="text-zinc-400">
                          {item.value > 0 ? item.value : item.note}
                        </span>
                      </div>
                      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${item.color} rounded-full transition-all`}
                          style={{ width: `${(item.value / Math.max(...benchmark.data.map(d => d.value))) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Key Decisions */}
        <div className="p-8 bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 rounded-xl">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <Shield className="w-6 h-6 text-accent" />
            Key Architecture Decisions
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-accent mb-2">Why Deno over Bun?</h4>
              <p className="text-sm text-zinc-400">
                Bun requires ARMv8.1+ instructions, but Raspberry Pi 4 uses ARMv8.0. 
                Deno runs natively on ARM64 with full TypeScript support.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-accent mb-2">Why Cloudflare Pages?</h4>
              <p className="text-sm text-zinc-400">
                Global CDN with edge functions, automatic SSL, and seamless integration 
                with Workers for API proxying. Zero cold starts for static assets.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-accent mb-2">Why Self-Hosted Backend?</h4>
              <p className="text-sm text-zinc-400">
                Full control over data, PostgreSQL with custom ML models, and no vendor 
                lock-in. Argo Tunnel provides secure, NAT-traversing connectivity.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-accent mb-2">Why Docker Compose over K8s?</h4>
              <p className="text-sm text-zinc-400">
                For a 2-node home lab, Kubernetes adds unnecessary complexity. Docker 
                Compose provides sufficient orchestration with simpler debugging.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-zinc-600">
          <p>
            Built with ❤️ by the <a href="https://vandine.us" className="text-accent hover:underline">Vandine</a> infrastructure team
          </p>
          <p className="mt-1">
            Last updated: February 2026
          </p>
        </div>
      </div>
    </div>
  );
}
