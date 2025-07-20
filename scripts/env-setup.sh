#!/bin/bash

# Environment setup script for TaDa project

ENV=$1

if [ -z "$ENV" ]; then
    echo "Usage: ./scripts/env-setup.sh [local|test|production]"
    exit 1
fi

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Setting up environment: $ENV${NC}"

# Backend setup
if [ -f "backend/config/env.${ENV}.example" ]; then
    if [ ! -f "backend/.env" ]; then
        cp backend/config/env.${ENV}.example backend/.env
        echo -e "${GREEN}✓ Backend .env created from env.${ENV}.example${NC}"
        echo -e "${YELLOW}⚠ Please update backend/.env with actual credentials${NC}"
    else
        echo -e "${YELLOW}⚠ Backend .env already exists. Please update manually if needed.${NC}"
    fi
else
    echo -e "${RED}✗ Backend config file not found: backend/config/env.${ENV}.example${NC}"
fi

# Frontend setup
if [ -f "frontend/config/env.${ENV}.example" ]; then
    if [ ! -f "frontend/.env.local" ]; then
        cp frontend/config/env.${ENV}.example frontend/.env.local
        echo -e "${GREEN}✓ Frontend .env.local created from env.${ENV}.example${NC}"
        echo -e "${YELLOW}⚠ Please update frontend/.env.local with actual credentials${NC}"
    else
        echo -e "${YELLOW}⚠ Frontend .env.local already exists. Please update manually if needed.${NC}"
    fi
else
    echo -e "${RED}✗ Frontend config file not found: frontend/config/env.${ENV}.example${NC}"
fi

# Environment-specific instructions
case $ENV in
    local)
        echo -e "\n${GREEN}Local environment setup:${NC}"
        echo "1. Make sure PostgreSQL is running locally on port 5432"
        echo "2. Create database: createdb rental_platform_local"
        echo "3. Run migrations: cd backend && npm run migration:run"
        echo "4. (Optional) Install LocalStack for S3 testing: pip install localstack"
        ;;
    test)
        echo -e "\n${GREEN}Test environment setup:${NC}"
        echo "1. Make sure VPN/SSH tunnel to Hetzner VPS is configured"
        echo "2. Ensure nginx is configured and SSL certificates are valid"
        echo "3. Deploy using: npm run deploy:test"
        ;;
    production)
        echo -e "\n${GREEN}Production environment setup:${NC}"
        echo "1. Configure AWS credentials: aws configure"
        echo "2. Set up AWS Secrets Manager for sensitive data"
        echo "3. Configure CloudFront/Route53 for frontend"
        echo "4. Deploy using CI/CD pipeline"
        ;;
esac

echo -e "\n${GREEN}Environment setup complete!${NC}" 