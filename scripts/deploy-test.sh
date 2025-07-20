#!/bin/bash

# Test environment deployment script

# Configuration
VPS_HOST="95.217.7.37"
VPS_USER="root"
DEPLOY_PATH="/opt/tada"
DOCKER_REGISTRY="registry.gitlab.com/tada-project"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}Starting deployment to test environment...${NC}"

# Build and push Docker images
echo -e "${YELLOW}Building Docker images...${NC}"

# Build backend
cd backend
docker build -t ${DOCKER_REGISTRY}/backend:test -f Dockerfile .
docker push ${DOCKER_REGISTRY}/backend:test
cd ..

# Build frontend
cd frontend
docker build -t ${DOCKER_REGISTRY}/frontend:test \
  --build-arg NEXT_PUBLIC_API_URL=https://api.tada.illiacodes.com/api \
  --build-arg NEXT_PUBLIC_APP_URL=https://tada.illiacodes.dev \
  -f Dockerfile .
docker push ${DOCKER_REGISTRY}/frontend:test
cd ..

echo -e "${GREEN}Docker images built and pushed successfully${NC}"

# Deploy to VPS
echo -e "${YELLOW}Deploying to VPS...${NC}"

ssh ${VPS_USER}@${VPS_HOST} << 'ENDSSH'
cd /opt/tada

# Pull latest images
docker pull registry.gitlab.com/tada-project/backend:test
docker pull registry.gitlab.com/tada-project/frontend:test

# Stop current containers
docker-compose -f docker-compose.test.yml down

# Start new containers
docker-compose -f docker-compose.test.yml up -d

# Run migrations
docker-compose -f docker-compose.test.yml exec -T backend npm run migration:run

# Check container status
docker-compose -f docker-compose.test.yml ps

echo "Deployment completed!"
ENDSSH

echo -e "${GREEN}Test deployment completed successfully!${NC}"

# Check deployment
echo -e "${YELLOW}Checking deployment status...${NC}"
curl -s -o /dev/null -w "%{http_code}" https://api.tada.illiacodes.com/health

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ API is responding${NC}"
else
    echo -e "${RED}✗ API is not responding${NC}"
fi 