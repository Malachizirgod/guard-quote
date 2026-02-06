# Tailscale VPN Configuration

> Zero-trust mesh VPN for secure admin and SIEM access.

## Overview

Tailscale provides a WireGuard-based mesh VPN that connects all infrastructure nodes. It enables:

- **Admin access** - SSH to servers without public exposure
- **SIEM integration** - Secure log forwarding to external systems
- **RBAC** - Access Control Lists (ACLs) for granular permissions

## Network Topology

```
┌─────────────────────────────────────────────────────────────────┐
│                    Tailscale Mesh Network                        │
│                                                                  │
│   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐      │
│   │ ThinkStation│     │     Pi0     │     │     Pi1     │      │
│   │ 100.x.x.80  │◄───►│ 100.x.x.101 │◄───►│ 100.x.x.70  │      │
│   │             │     │             │     │             │      │
│   │ - WSL Dev   │     │ - Syslog    │     │ - API       │      │
│   │ - OpenClaw  │     │ - LDAP      │     │ - Grafana   │      │
│   └─────────────┘     └─────────────┘     └─────────────┘      │
│          │                   │                   │              │
│          │                   │                   │              │
│   ┌──────┴───────────────────┴───────────────────┴──────┐      │
│   │                   Tailscale Mesh                     │      │
│   │                  (WireGuard Encrypted)               │      │
│   └──────┬───────────────────┬───────────────────┬──────┘      │
│          │                   │                   │              │
│   ┌──────▼─────┐      ┌──────▼─────┐      ┌─────▼──────┐      │
│   │   iPhone   │      │   SIEM     │      │  Future    │      │
│   │ 100.x.x.50 │      │  Client    │      │  Devices   │      │
│   │            │      │ 100.x.x.200│      │            │      │
│   │ Admin Only │      │ pi0:514    │      │            │      │
│   │            │      │ only       │      │            │      │
│   └────────────┘      └────────────┘      └────────────┘      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Nodes

| Node | Tailscale IP | Role | Services Exposed |
|------|--------------|------|------------------|
| thinkstation | 100.x.x.80 | Admin workstation | SSH, OpenClaw |
| pi0 | 100.x.x.101 | Log aggregator | Syslog (514), SSH (22) |
| pi1 | 100.x.x.70 | App server | SSH (22), Grafana (3000), API (3002) |
| rafa-iphone | 100.x.x.50 | Mobile admin | Client only |

## ACL Policy

The ACL policy defines who can access what:

```json
{
  "acls": [
    {
      // SIEM clients can only reach syslog
      "action": "accept",
      "src": ["tag:siem-client"],
      "dst": ["tag:log-server:514"]
    },
    {
      // Developers can reach monitoring only
      "action": "accept",
      "src": ["tag:developer"],
      "dst": [
        "tag:monitoring:3000",   // Grafana
        "tag:monitoring:9090",   // Prometheus
        "tag:monitoring:3100"    // Loki
      ]
    },
    {
      // Admins have full access
      "action": "accept",
      "src": ["group:admin"],
      "dst": ["*:*"]
    }
  ],
  "tagOwners": {
    "tag:siem-client": ["rafael.garcia.contact.me@gmail.com"],
    "tag:developer": ["rafael.garcia.contact.me@gmail.com"],
    "tag:log-server": ["rafael.garcia.contact.me@gmail.com"],
    "tag:monitoring": ["rafael.garcia.contact.me@gmail.com"]
  },
  "groups": {
    "group:admin": ["rafael.garcia.contact.me@gmail.com"]
  }
}
```

## Adding a New User

### 1. Send Invite

```bash
# Via Tailscale admin console
# https://login.tailscale.com/admin/users
```

### 2. Assign Tags

After user joins, assign appropriate tags:

```bash
# Via admin console or API
# Add tag:siem-client for SIEM integration
# Add tag:developer for team members
```

### 3. Verify Access

```bash
# On the new device
tailscale status

# Test connectivity
ping pi0
nc -vz pi0 514  # For SIEM client
```

## Installation

### Linux (Ubuntu/Debian)

```bash
# Install
curl -fsSL https://tailscale.com/install.sh | sh

# Start and authenticate
sudo tailscale up

# Verify
tailscale status
tailscale ip
```

### macOS

```bash
# Via Homebrew
brew install tailscale

# Or download from App Store
```

### Windows

Download installer from https://tailscale.com/download/windows

## Common Commands

```bash
# Check status
tailscale status

# Get your Tailscale IP
tailscale ip -4

# Check connectivity to a peer
tailscale ping pi0

# View current ACL-allowed connections
tailscale status --peers

# Disconnect (but stay logged in)
sudo tailscale down

# Reconnect
sudo tailscale up

# Logout completely
sudo tailscale logout
```

## Troubleshooting

### Can't Connect to Peer

```bash
# Check if peer is online
tailscale status | grep <peer-name>

# Check ACLs allow your connection
# (ACL denials are logged in admin console)

# Try direct ping
tailscale ping <peer-name>
```

### Connection Slow

```bash
# Check if using relay vs direct
tailscale status

# "relay" means NAT traversal needed
# "direct" is optimal
```

### Logs

```bash
# View Tailscale logs
journalctl -u tailscaled -f

# On macOS
log show --predicate 'subsystem == "com.tailscale.ipn.macos"' --last 1h
```

## Security Considerations

1. **MFA**: Tailscale inherits MFA from your identity provider
2. **Key Expiry**: Keys expire periodically (configurable)
3. **ACLs**: Always use least-privilege ACLs
4. **Logging**: All connections logged in admin console

## Resources

- [Tailscale Documentation](https://tailscale.com/kb/)
- [ACL Reference](https://tailscale.com/kb/1018/acls/)
- [Admin Console](https://login.tailscale.com/admin)

---

*Last updated: 2026-02-06*
