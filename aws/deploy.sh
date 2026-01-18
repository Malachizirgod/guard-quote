#!/bin/bash
# GuardQuote AWS Deployment Script
# Usage: ./deploy.sh [environment] [action]
# Example: ./deploy.sh demo deploy-all

set -e

# Configuration
ENVIRONMENT=${1:-demo}
ACTION=${2:-help}
REGION=${AWS_REGION:-us-west-2}
STACK_PREFIX="guardquote-${ENVIRONMENT}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[INFO]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# Check prerequisites
check_prereqs() {
    command -v aws >/dev/null 2>&1 || error "AWS CLI not installed"
    aws sts get-caller-identity >/dev/null 2>&1 || error "AWS credentials not configured"
    log "AWS CLI configured for account: $(aws sts get-caller-identity --query Account --output text)"
}

# Deploy network stack
deploy_network() {
    log "Deploying network stack..."
    aws cloudformation deploy \
        --stack-name "${STACK_PREFIX}-network" \
        --template-file cloudformation/network.yaml \
        --parameter-overrides Environment=${ENVIRONMENT} \
        --capabilities CAPABILITY_NAMED_IAM \
        --region ${REGION}
    log "Network stack deployed!"
}

# Deploy frontend stack
deploy_frontend() {
    log "Deploying frontend stack..."
    aws cloudformation deploy \
        --stack-name "${STACK_PREFIX}-frontend" \
        --template-file cloudformation/frontend.yaml \
        --parameter-overrides Environment=${ENVIRONMENT} \
        --region ${REGION}

    # Get outputs
    BUCKET=$(aws cloudformation describe-stacks \
        --stack-name "${STACK_PREFIX}-frontend" \
        --query 'Stacks[0].Outputs[?OutputKey==`BucketName`].OutputValue' \
        --output text --region ${REGION})
    CDN_URL=$(aws cloudformation describe-stacks \
        --stack-name "${STACK_PREFIX}-frontend" \
        --query 'Stacks[0].Outputs[?OutputKey==`FrontendUrl`].OutputValue' \
        --output text --region ${REGION})

    log "Frontend stack deployed!"
    log "S3 Bucket: ${BUCKET}"
    log "CloudFront URL: ${CDN_URL}"
}

# Upload frontend build
upload_frontend() {
    log "Building frontend..."
    cd ../frontend
    bun install
    bun run build

    BUCKET=$(aws cloudformation describe-stacks \
        --stack-name "${STACK_PREFIX}-frontend" \
        --query 'Stacks[0].Outputs[?OutputKey==`BucketName`].OutputValue' \
        --output text --region ${REGION})

    log "Uploading to S3..."
    aws s3 sync dist/ "s3://${BUCKET}/" --delete --region ${REGION}

    # Invalidate CloudFront cache
    DIST_ID=$(aws cloudformation describe-stacks \
        --stack-name "${STACK_PREFIX}-frontend" \
        --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDistributionId`].OutputValue' \
        --output text --region ${REGION})

    log "Invalidating CloudFront cache..."
    aws cloudfront create-invalidation \
        --distribution-id ${DIST_ID} \
        --paths "/*" \
        --region ${REGION}

    log "Frontend uploaded!"
    cd ../aws
}

# Deploy backend stack
deploy_backend() {
    log "Deploying backend stack..."

    # Check for required parameters
    if [ -z "$KEY_NAME" ]; then
        error "KEY_NAME environment variable required (EC2 key pair name)"
    fi
    if [ -z "$DB_PASSWORD" ]; then
        error "DB_PASSWORD environment variable required"
    fi
    if [ -z "$JWT_SECRET" ]; then
        error "JWT_SECRET environment variable required"
    fi

    aws cloudformation deploy \
        --stack-name "${STACK_PREFIX}-backend" \
        --template-file cloudformation/backend.yaml \
        --parameter-overrides \
            Environment=${ENVIRONMENT} \
            NetworkStackName="${STACK_PREFIX}-network" \
            KeyName=${KEY_NAME} \
            DbHost=${DB_HOST:-192.168.2.70} \
            DbPassword=${DB_PASSWORD} \
            RedisHost=${REDIS_HOST:-192.168.2.70} \
            RedisPassword=${REDIS_PASSWORD:-guardquote_redis_2024} \
            JwtSecret=${JWT_SECRET} \
        --capabilities CAPABILITY_NAMED_IAM \
        --region ${REGION}

    # Get outputs
    BACKEND_URL=$(aws cloudformation describe-stacks \
        --stack-name "${STACK_PREFIX}-backend" \
        --query 'Stacks[0].Outputs[?OutputKey==`BackendUrl`].OutputValue' \
        --output text --region ${REGION})

    log "Backend stack deployed!"
    log "Backend URL: ${BACKEND_URL}"
}

# Deploy LDAP stack
deploy_ldap() {
    log "Deploying LDAP stack..."

    if [ -z "$KEY_NAME" ]; then
        error "KEY_NAME environment variable required"
    fi
    if [ -z "$LDAP_ADMIN_PASSWORD" ]; then
        error "LDAP_ADMIN_PASSWORD environment variable required"
    fi

    aws cloudformation deploy \
        --stack-name "${STACK_PREFIX}-ldap" \
        --template-file cloudformation/ldap.yaml \
        --parameter-overrides \
            Environment=${ENVIRONMENT} \
            NetworkStackName="${STACK_PREFIX}-network" \
            KeyName=${KEY_NAME} \
            LdapAdminPassword=${LDAP_ADMIN_PASSWORD} \
            LdapDomain=${LDAP_DOMAIN:-guardquote.local} \
        --region ${REGION}

    log "LDAP stack deployed!"
}

# Deploy all stacks
deploy_all() {
    check_prereqs
    deploy_network
    deploy_frontend
    deploy_backend
    deploy_ldap
    upload_frontend
    show_outputs
}

# Show all stack outputs
show_outputs() {
    log "============================================"
    log "DEPLOYMENT COMPLETE"
    log "============================================"

    echo ""
    log "Frontend:"
    aws cloudformation describe-stacks \
        --stack-name "${STACK_PREFIX}-frontend" \
        --query 'Stacks[0].Outputs[*].[OutputKey,OutputValue]' \
        --output table --region ${REGION} 2>/dev/null || warn "Frontend stack not deployed"

    echo ""
    log "Backend:"
    aws cloudformation describe-stacks \
        --stack-name "${STACK_PREFIX}-backend" \
        --query 'Stacks[0].Outputs[*].[OutputKey,OutputValue]' \
        --output table --region ${REGION} 2>/dev/null || warn "Backend stack not deployed"

    echo ""
    log "LDAP:"
    aws cloudformation describe-stacks \
        --stack-name "${STACK_PREFIX}-ldap" \
        --query 'Stacks[0].Outputs[*].[OutputKey,OutputValue]' \
        --output table --region ${REGION} 2>/dev/null || warn "LDAP stack not deployed"
}

# Delete all stacks
delete_all() {
    warn "Deleting all ${ENVIRONMENT} stacks..."
    read -p "Are you sure? (y/N) " confirm
    [ "$confirm" != "y" ] && exit 0

    aws cloudformation delete-stack --stack-name "${STACK_PREFIX}-ldap" --region ${REGION} 2>/dev/null || true
    aws cloudformation delete-stack --stack-name "${STACK_PREFIX}-backend" --region ${REGION} 2>/dev/null || true
    aws cloudformation delete-stack --stack-name "${STACK_PREFIX}-frontend" --region ${REGION} 2>/dev/null || true

    log "Waiting for stacks to delete..."
    aws cloudformation wait stack-delete-complete --stack-name "${STACK_PREFIX}-ldap" --region ${REGION} 2>/dev/null || true
    aws cloudformation wait stack-delete-complete --stack-name "${STACK_PREFIX}-backend" --region ${REGION} 2>/dev/null || true
    aws cloudformation wait stack-delete-complete --stack-name "${STACK_PREFIX}-frontend" --region ${REGION} 2>/dev/null || true

    aws cloudformation delete-stack --stack-name "${STACK_PREFIX}-network" --region ${REGION}
    log "All stacks deleted!"
}

# Help
show_help() {
    echo "GuardQuote AWS Deployment"
    echo ""
    echo "Usage: ./deploy.sh [environment] [action]"
    echo ""
    echo "Environments: demo, staging, prod"
    echo ""
    echo "Actions:"
    echo "  deploy-all      Deploy all stacks"
    echo "  deploy-network  Deploy VPC and networking"
    echo "  deploy-frontend Deploy S3 + CloudFront"
    echo "  deploy-backend  Deploy EC2 backend"
    echo "  deploy-ldap     Deploy OpenLDAP server"
    echo "  upload-frontend Build and upload frontend"
    echo "  outputs         Show all stack outputs"
    echo "  delete-all      Delete all stacks"
    echo ""
    echo "Required Environment Variables:"
    echo "  KEY_NAME             EC2 key pair name"
    echo "  DB_PASSWORD          PostgreSQL password"
    echo "  JWT_SECRET           JWT signing secret"
    echo "  LDAP_ADMIN_PASSWORD  LDAP admin password"
    echo ""
    echo "Optional Environment Variables:"
    echo "  AWS_REGION           AWS region (default: us-west-2)"
    echo "  DB_HOST              Database host (default: 192.168.2.70)"
    echo "  REDIS_HOST           Redis host (default: 192.168.2.70)"
    echo "  LDAP_DOMAIN          LDAP domain (default: guardquote.local)"
    echo ""
    echo "Example:"
    echo "  KEY_NAME=my-key DB_PASSWORD=secret JWT_SECRET=mysecret \\"
    echo "  LDAP_ADMIN_PASSWORD=ldapadmin ./deploy.sh demo deploy-all"
}

# Main
case ${ACTION} in
    deploy-all)     deploy_all ;;
    deploy-network) check_prereqs && deploy_network ;;
    deploy-frontend) check_prereqs && deploy_frontend ;;
    deploy-backend) check_prereqs && deploy_backend ;;
    deploy-ldap)    check_prereqs && deploy_ldap ;;
    upload-frontend) check_prereqs && upload_frontend ;;
    outputs)        show_outputs ;;
    delete-all)     delete_all ;;
    *)              show_help ;;
esac
