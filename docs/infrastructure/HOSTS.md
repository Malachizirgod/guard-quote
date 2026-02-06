# Host Inventory

> Complete inventory of all infrastructure hosts.

## Summary

| Host | IP | OS | Role | Status |
|------|-----|-----|------|--------|
| pi0 | 192.168.2.101 | Ubuntu 25.10 | Monitoring/Logs | 🟢 Active |
| pi1 | 192.168.2.70 | Ubuntu 25.10 | Application Server | 🟢 Active |
| ThinkStation | 192.168.2.80 | Windows 11 + WSL2 | Development | 🟢 Active |
| PA-220 | 192.168.2.14 | PAN-OS | Firewall | 🟢 Active |
| UDM | 192.168.2.1 | UniFi OS | Core Router | 🟢 Active |

---

## Pi0 - Monitoring Host

| Property | Value |
|----------|-------|
| **Hostname** | pi0.vandine.local |
| **IP Address** | 192.168.2.101 |
| **Tailscale IP** | 100.x.x.101 |
| **OS** | Ubuntu 25.10 (aarch64) |
| **Hardware** | Raspberry Pi 4 (4GB) |
| **SSH User** | rafaeljg |
| **Role** | Centralized logging, LDAP, NFS |

### Services

| Service | Port | Protocol | Description |
|---------|------|----------|-------------|
| SSH | 22 | TCP | Remote access |
| Rsyslog | 514 | UDP/TCP | Syslog aggregator |
| LDAP | 389 | TCP | OpenLDAP |
| LDAPS | 636 | TCP | LDAP over TLS |
| NFS | 2049 | TCP | Network file share |
| LAM | 8080 | HTTP | LDAP Account Manager UI |
| Node Exporter | 9100 | HTTP | Prometheus metrics |
| NetFlow | 2055 | UDP | Flow collector |

### Key Paths

| Path | Purpose |
|------|---------|
| `/var/log/syslog` | System logs |
| `/var/log/auth.log` | Authentication logs |
| `/var/log/remote/` | Logs from other hosts |
| `/srv/nfs/` | NFS exports |

---

## Pi1 - Application Server

| Property | Value |
|----------|-------|
| **Hostname** | pi1.vandine.local |
| **IP Address** | 192.168.2.70 |
| **Tailscale IP** | 100.x.x.70 |
| **OS** | Ubuntu 25.10 (aarch64) |
| **Hardware** | Raspberry Pi 4 (8GB) |
| **SSH User** | johnmarston |
| **Role** | Application hosting, monitoring stack |

### Services

| Service | Port | Protocol | Description |
|---------|------|----------|-------------|
| SSH | 22 | TCP | Remote access |
| Nginx | 80 | HTTP | Reverse proxy |
| GuardQuote API | 3002 | HTTP | Main application |
| PostgreSQL | 5432 | TCP | Database |
| Redis | 6379 | TCP | Cache |
| Grafana | 3000 | HTTP | Metrics visualization |
| Prometheus | 9090 | HTTP | Metrics collection |
| Loki | 3100 | HTTP | Log aggregation |
| Alertmanager | 9093 | HTTP | Alert routing |
| Node Exporter | 9100 | HTTP | System metrics |
| Cloudflared | - | QUIC | Cloudflare tunnel |

### Docker Containers

| Container | Image | Ports | Status |
|-----------|-------|-------|--------|
| grafana | grafana/grafana | 3000 | 🟢 Running |
| prometheus | prom/prometheus | 9090 | 🟢 Running |
| loki | grafana/loki | 3100 | 🟢 Running |
| alertmanager | prom/alertmanager | 9093 | 🟢 Running |
| node-exporter | prom/node-exporter | 9100 | 🟢 Running |

### Key Paths

| Path | Purpose |
|------|---------|
| `~/guardquote-deno/` | Application source |
| `/tmp/gq.log` | API logs |
| `~/monitoring/` | Docker compose for monitoring |
| `/var/log/nginx/` | Nginx logs |

---

## ThinkStation - Development Workstation

| Property | Value |
|----------|-------|
| **Hostname** | thinkstation.vandine.local |
| **IP Address** | 192.168.2.80 |
| **Tailscale IP** | 100.x.x.80 |
| **OS** | Windows 11 Pro + WSL2 (Ubuntu) |
| **Hardware** | Lenovo ThinkStation |
| **Role** | Development, OpenClaw gateway |

### WSL Services

| Service | Port | Description |
|---------|------|-------------|
| SSH | 22 | WSL remote access |
| OpenClaw Gateway | 3333 | AI assistant |

---

## Network Infrastructure

### PA-220 Firewall

| Property | Value |
|----------|-------|
| **IP Address** | 192.168.2.14 |
| **Management** | HTTPS :443, SSH :22 |
| **Role** | Edge firewall (or internal, pending cutover) |

### UniFi Dream Machine

| Property | Value |
|----------|-------|
| **IP Address** | 192.168.2.1 |
| **Role** | Core router, DHCP, DNS |
| **Management** | HTTPS :443 |

### USW Flex

| Property | Value |
|----------|-------|
| **IP Address** | 192.168.2.2 |
| **Role** | PoE switch for Pi cluster |

---

## VLAN Layout

| VLAN | Name | Subnet | Purpose |
|------|------|--------|---------|
| 1 | Default | 192.168.1.0/24 | Legacy |
| 2 | Matrix | 192.168.2.0/27 | Infrastructure |

---

## External Access Points

| Domain | Target | Access Method |
|--------|--------|---------------|
| guardquote.vandine.us | Pi1 (via tunnel) | Cloudflare Pages + Tunnel |
| grafana.vandine.us | Pi1:3000 | CF Tunnel + Access |
| prometheus.vandine.us | Pi1:9090 | CF Tunnel + Access |
| loki.vandine.us | Pi1:3100 | CF Tunnel + Access |
| ldap.vandine.us | Pi0:8080 | CF Tunnel + Access |

---

*Last updated: 2026-02-06*
