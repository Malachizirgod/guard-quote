# GuardQuote - Claude Code Context

## Project Overview
ML-powered insurance quoting platform. Self-hosted on Raspberry Pi cluster with Cloudflare edge.

**Live Site:** https://guardquote.vandine.us  
**GitHub:** https://github.com/jag18729/guard-quote  
**Project Board:** https://github.com/users/jag18729/projects/1

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         CLOUDFLARE EDGE                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                   │
│  │    Pages     │  │   Workers    │  │    Tunnel    │                   │
│  │  (Frontend)  │  │  (Gateway)   │  │   (Origin)   │                   │
│  └──────────────┘  └──────────────┘  └──────────────┘                   │
└─────────────────────────────┬───────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌─────────────────────────┐     ┌─────────────────────────┐
│ pi0 (192.168.2.101)     │     │ pi1 (192.168.2.70)      │
│ ┌─────────────────────┐ │     │ ┌─────────────────────┐ │
│ │ Vector (logs)       │ │────►│ │ Deno API :3002      │ │
│ │ LDAP :389           │ │     │ │ PostgreSQL :5432    │ │
│ │ Syslog aggregation  │ │     │ │ Grafana :3000       │ │
│ │ Cloudflared         │ │     │ │ Prometheus :9090    │ │
│ └─────────────────────┘ │     │ │ Loki :3100          │ │
└─────────────────────────┘     │ │ Cloudflared         │ │
                                └─────────────────────────┘
```

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | React 18 + TypeScript + Vite + Tailwind |
| Backend | Deno 2.6 + Hono |
| Database | PostgreSQL 16 |
| Auth | bcrypt + JWT (djwt) |
| Hosting | Cloudflare Pages + Tunnel |
| Monitoring | Grafana + Prometheus + Loki |
| Diagrams | React Flow (@xyflow/react) |

## Key Locations

| What | Where |
|------|-------|
| Frontend | `frontend/src/` |
| Backend (prod) | `pi1:~/guardquote-deno/server.ts` |
| Docs | `docs/` |
| Roadmap | `docs/ROADMAP.md` |
| Team Tasks | `docs/TEAM-TASKS.md` |

## Servers

| Server | IP | User | Role |
|--------|-----|------|------|
| pi1 | 192.168.2.70 | johnmarston | API, Database, Monitoring |
| pi0 | 192.168.2.101 | rafaeljg | Logs, LDAP, Syslog |
| PA-220 | 192.168.2.14 | admin | Firewall |
| UDM | 192.168.2.1 | rafaeljg | Router |

## SSH Access

```bash
# SSH config (~/.ssh/config)
ssh pi0   # 192.168.2.101
ssh pi1   # 192.168.2.70

# With password
sshpass -p '481526' ssh johnmarston@192.168.2.70
```

## Database

```bash
# On pi1
PGPASSWORD=guardquote123 psql -h 127.0.0.1 -U postgres -d guardquote

# Tables: users, clients, quotes, blog_posts, blog_comments, feature_requests
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/status` | Health check |
| POST | `/api/auth/login` | Admin login |
| GET | `/api/quotes` | List quotes |
| GET | `/api/features` | Feature requests |
| POST | `/api/features/:id/vote` | Vote on feature |
| POST | `/api/features/sync-github-all` | Sync to GitHub |
| GET | `/api/blog-posts` | Blog posts |
| GET | `/api/admin/stats` | Dashboard stats |

## Development

### Frontend
```bash
cd frontend
npm install
npm run dev    # http://localhost:5173
npm run build  # Build to dist/
```

### Deploy Frontend
```bash
npm run build
npx wrangler pages deploy dist --project-name=guardquote
```

### Backend (on pi1)
```bash
ssh pi1
cd ~/guardquote-deno
deno run -A server.ts
```

## Team

| Member | GitHub | Role |
|--------|--------|------|
| Rafa | @jag18729 | Lead Dev / Infrastructure |
| Milkias | @Malachizirgod | Documentation / PM |
| Isaiah | @ibernal1815 | SIEM / Security |
| Xavier | TBD | Presentations |

## Milestones

| Milestone | Date |
|-----------|------|
| UAT Round 1 | Feb 14, 2026 |
| UAT Round 2 | Feb 19, 2026 |
| Presentation Ready | Feb 28, 2026 |

## Version
- **Current:** v3.0.0
- **Last Updated:** February 6, 2026
