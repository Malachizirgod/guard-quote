# SIEM Integration Rollout Plan

> Step-by-step guide for rolling out SIEM integration with Isaiah.

## Overview

This document outlines the phased rollout of log shipping from the Vandine home lab to Isaiah's SIEM system.

## Timeline

| Phase | Duration | Milestone |
|-------|----------|-----------|
| Phase 1 | Day 1-2 | Sample data testing |
| Phase 2 | Day 3-4 | Tailscale setup + connectivity |
| Phase 3 | Day 5-6 | Live syslog forwarding |
| Phase 4 | Day 7+ | Monitoring & tuning |

---

## Phase 1: Sample Data Testing

**Goal:** Isaiah's SIEM can ingest and parse sample logs.

### Tasks

- [x] Create sample log files (auth.log, api.log)
- [x] Create JSON export format
- [x] Document log formats
- [ ] Share sample files with Isaiah
- [ ] Isaiah confirms successful ingest
- [ ] Isaiah creates initial detection rules

### Deliverables
- `docs/integrations/siem/samples/` directory with sample files
- Isaiah's SIEM shows sample data in dashboards

### Verification
```bash
# Isaiah runs on his SIEM
curl -X GET "localhost:9200/vandine-logs/_search" | jq '.hits.total'
# Should show > 0 documents
```

---

## Phase 2: Tailscale Setup

**Goal:** Isaiah's bastion host connected to Tailscale with restricted ACLs.

### Pre-requisites
- [ ] Isaiah installs Tailscale on bastion host
- [ ] Isaiah provides email for invite

### Tasks

- [ ] Send Tailscale invite to Isaiah
- [ ] Isaiah connects and appears in network
- [ ] Configure ACL to restrict to pi0:514 only
- [ ] Test connectivity from Isaiah's bastion

### ACL Configuration

```json
{
  "acls": [
    {
      "action": "accept",
      "src": ["isaiah@guardquote.com"],
      "dst": ["pi0:514"]
    }
  ]
}
```

### Verification
```bash
# From Isaiah's bastion (connected to Tailscale)
tailscale status | grep pi0  # Should show pi0

nc -vz pi0 514   # Should succeed
nc -vz pi0 22    # Should FAIL (blocked by ACL)
nc -vz pi1 3000  # Should FAIL (blocked by ACL)
```

---

## Phase 3: Live Syslog Forwarding

**Goal:** Logs flowing from pi0 to Isaiah's SIEM in real-time.

### Tasks

- [ ] Configure rsyslog on pi0 to forward to Isaiah's SIEM
- [ ] Isaiah configures SIEM to receive syslog
- [ ] Verify log flow
- [ ] Test detection rules with live data

### Pi0 Configuration

```bash
# /etc/rsyslog.d/60-forward-siem.conf
# Forward to Isaiah's SIEM via Tailscale
*.* @<isaiah-bastion-tailscale-ip>:514
```

```bash
sudo systemctl restart rsyslog
```

### Isaiah's SIEM Configuration

```bash
# /etc/rsyslog.conf (on bastion/SIEM)
module(load="imudp")
input(type="imudp" port="514")

# Or for Elastic
# Use Filebeat with syslog input
```

### Verification
```bash
# Generate test log on pi0
logger -p auth.info "SIEM test from pi0"

# Check on Isaiah's SIEM (within 30 seconds)
grep "SIEM test from pi0" /var/log/messages
```

---

## Phase 4: Monitoring & Tuning

**Goal:** Stable operation with alerts and documentation.

### Tasks

- [ ] Monitor log volume for 48 hours
- [ ] Tune detection rules (reduce false positives)
- [ ] Document final architecture
- [ ] Create runbook for common issues

### Metrics to Track

| Metric | Target | Current |
|--------|--------|---------|
| Log events/day | ~5,000 | TBD |
| Latency (pi0 → SIEM) | < 5 sec | TBD |
| Detection rules active | ≥ 10 | TBD |
| False positive rate | < 10% | TBD |

### Alerting

Configure alerts for:
- [ ] Log flow stopped (no events for 5 min)
- [ ] Spike in auth failures (> 10/min)
- [ ] SIEM disk usage (> 80%)

---

## Rollback Plan

If issues arise:

### Level 1: Pause Forwarding
```bash
# On pi0
sudo mv /etc/rsyslog.d/60-forward-siem.conf /etc/rsyslog.d/60-forward-siem.conf.disabled
sudo systemctl restart rsyslog
```

### Level 2: Revoke Tailscale Access
```bash
# In Tailscale admin console
# Remove Isaiah's device from network
```

### Level 3: Full Disconnect
- Remove all SIEM-related configs
- Document lessons learned

---

## Backup Path: Webhook Push

If Tailscale doesn't work, fall back to webhook push:

1. Deploy log-shipper.py on pi0
2. Configure NordVPN egress
3. Isaiah exposes webhook endpoint
4. Configure IP allowlisting

See: `scripts/siem/log-shipper.py`

---

## Success Criteria

- [ ] Isaiah's SIEM receives logs in real-time (< 5 sec latency)
- [ ] Detection rules trigger on simulated attacks
- [ ] No impact on pi0/pi1 performance
- [ ] Access restricted to syslog only (ACL verified)
- [ ] Documentation complete

---

## Contacts

| Role | Contact | Availability |
|------|---------|--------------|
| Network Admin | Rafa | Discord / Email |
| SIEM Admin | Isaiah | Discord |

---

*Created: 2026-02-06*
