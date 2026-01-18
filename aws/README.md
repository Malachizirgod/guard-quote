# GuardQuote AWS Deployment

Production-like deployment using CloudFormation stacks.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        AWS Cloud                                 │
│  ┌──────────────────┐    ┌──────────────────┐                   │
│  │   CloudFront     │───▶│    S3 Bucket     │                   │
│  │   (CDN + HTTPS)  │    │  (React Build)   │                   │
│  └────────┬─────────┘    └──────────────────┘                   │
│           │                                                      │
│           ▼                                                      │
│  ┌──────────────────┐    ┌──────────────────┐                   │
│  │   EC2 Backend    │───▶│   EC2 LDAP       │                   │
│  │   (Bun + Hono)   │    │  (OpenLDAP)      │                   │
│  │   Public Subnet  │    │  Private Subnet  │                   │
│  └────────┬─────────┘    └──────────────────┘                   │
│           │                                                      │
└───────────┼──────────────────────────────────────────────────────┘
            │ (VPN/Internet)
            ▼
┌───────────────────────────────────────────────────────────────────┐
│                    Pi Cluster (Home Network)                      │
│  ┌─────────────────┐         ┌─────────────────┐                 │
│  │  Pi1            │         │  Pi0            │                 │
│  │  PostgreSQL     │         │  GitHub Runner  │                 │
│  │  Redis          │         │  Backup Storage │                 │
│  │  Monitoring     │         │                 │                 │
│  └─────────────────┘         └─────────────────┘                 │
└───────────────────────────────────────────────────────────────────┘
```

## Stacks

| Stack | Purpose | Resources |
|-------|---------|-----------|
| `network` | VPC, Subnets, Security Groups | VPC, IGW, Subnets, Route Tables, SGs |
| `frontend` | Static site hosting | S3, CloudFront, OAI |
| `backend` | API server | EC2, EIP, IAM Role |
| `ldap` | Directory services | EC2 (OpenLDAP) |

## Prerequisites

1. **AWS CLI** configured with credentials
2. **EC2 Key Pair** created in your AWS region
3. **Bun** installed locally (for frontend build)

```bash
# Verify AWS CLI
aws sts get-caller-identity

# Create key pair (if needed)
aws ec2 create-key-pair --key-name guardquote-demo --query 'KeyMaterial' --output text > guardquote-demo.pem
chmod 400 guardquote-demo.pem
```

## Quick Deploy

```bash
cd aws

# Set required variables
export KEY_NAME=guardquote-demo
export DB_PASSWORD=WPU8bj3nbwFyZFEtHZQz
export JWT_SECRET=your_jwt_secret_here_32chars
export LDAP_ADMIN_PASSWORD=ldapadmin123

# Deploy everything
./deploy.sh demo deploy-all
```

## Step-by-Step Deploy

```bash
# 1. Deploy network first
./deploy.sh demo deploy-network

# 2. Deploy frontend (S3 + CloudFront)
./deploy.sh demo deploy-frontend

# 3. Deploy backend (EC2)
./deploy.sh demo deploy-backend

# 4. Deploy LDAP (EC2)
./deploy.sh demo deploy-ldap

# 5. Build and upload frontend
./deploy.sh demo upload-frontend

# 6. Show all outputs
./deploy.sh demo outputs
```

## Outputs

After deployment, you'll get:

| Output | Example |
|--------|---------|
| Frontend URL | `https://d1234567890.cloudfront.net` |
| Backend URL | `http://52.10.123.45:3000` |
| Backend SSH | `ssh -i guardquote-demo.pem ec2-user@52.10.123.45` |
| LDAP URL | `ldap://10.0.10.50:389` |

## Update Frontend

```bash
cd frontend
bun run build
cd ../aws
./deploy.sh demo upload-frontend
```

## Connecting AWS to Pi Cluster

The backend in AWS needs to reach PostgreSQL/Redis on Pi1. Options:

### Option 1: Tailscale VPN (Recommended)
```bash
# On Pi1
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up

# On EC2 backend
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up

# Use Tailscale IPs in backend config
```

### Option 2: WireGuard
```bash
# Set up WireGuard tunnel between AWS VPC and home network
# More complex but no third-party dependency
```

### Option 3: SSH Tunnel (Quick & Dirty)
```bash
# From EC2, tunnel to Pi1
ssh -L 5432:localhost:5432 -L 6379:localhost:6379 pi1

# Backend uses localhost:5432 and localhost:6379
```

### Option 4: Expose Pi1 (Not Recommended)
```bash
# Port forward on router (security risk)
# Only for demo, not production
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `KEY_NAME` | Yes | EC2 key pair name |
| `DB_PASSWORD` | Yes | PostgreSQL password |
| `JWT_SECRET` | Yes | JWT signing secret (32+ chars) |
| `LDAP_ADMIN_PASSWORD` | Yes | LDAP admin password |
| `AWS_REGION` | No | AWS region (default: us-west-2) |
| `DB_HOST` | No | PostgreSQL host (default: 192.168.2.70) |
| `REDIS_HOST` | No | Redis host (default: 192.168.2.70) |

## LDAP Users

Demo users created automatically:

| Username | Password | Group |
|----------|----------|-------|
| demo.admin | admin123 | admins |
| demo.user | user123 | users |

## Cleanup

```bash
# Delete all stacks
./deploy.sh demo delete-all
```

## Cost Estimate

| Resource | Monthly Cost |
|----------|--------------|
| EC2 t3.small (backend) | ~$15 |
| EC2 t3.micro (LDAP) | ~$8 |
| CloudFront | ~$1-5 (traffic based) |
| S3 | < $1 |
| **Total** | **~$25/month** |

## Troubleshooting

### Stack creation failed
```bash
# Check CloudFormation events
aws cloudformation describe-stack-events \
  --stack-name guardquote-demo-backend \
  --query 'StackEvents[?ResourceStatus==`CREATE_FAILED`]'
```

### Backend not responding
```bash
# SSH to instance
ssh -i guardquote-demo.pem ec2-user@<IP>

# Check service status
sudo systemctl status guardquote-backend
sudo journalctl -u guardquote-backend -f
```

### Frontend not loading
```bash
# Check CloudFront distribution status
aws cloudfront get-distribution --id <DIST_ID> --query 'Distribution.Status'

# Invalidate cache
aws cloudfront create-invalidation --distribution-id <DIST_ID> --paths "/*"
```

## Team Roles for AWS Deployment

| Role | Tasks |
|------|-------|
| **DevOps** | Run deploy.sh, manage stacks, set up VPN |
| **Backend** | Verify EC2 backend, check logs, update env vars |
| **Frontend** | Build React app, verify CloudFront CDN |
| **Security** | Configure LDAP users, verify security groups |
