#!/bin/bash

# TaDa Platform Deployment Script
# This script deploys the TaDa platform on a VPS using Docker Compose

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root"
   exit 1
fi

print_status "Starting TaDa Platform deployment..."

# Check if Docker and Docker Compose are installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    print_error ".env file not found!"
    print_warning "Please copy env.production.template to .env and fill in the values:"
    print_warning "cp env.production.template .env"
    print_warning "nano .env"
    exit 1
fi

# Load environment variables
source .env

# Validate required environment variables
required_vars=("DB_USERNAME" "DB_PASSWORD" "DB_NAME" "JWT_SECRET" "DOMAIN" "EMAIL")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        print_error "Required environment variable $var is not set in .env file"
        exit 1
    fi
done

# Create necessary directories
print_status "Creating necessary directories..."
mkdir -p logs/nginx
mkdir -p ssl
mkdir -p uploads

# Update nginx configuration with actual domain
print_status "Updating nginx configuration with domain: $DOMAIN"
sed -i "s/your-domain.com/$DOMAIN/g" nginx/conf.d/default.conf

# Stop any existing containers
print_status "Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down --remove-orphans || true

# Build and start the application
print_status "Building and starting the application..."
docker-compose -f docker-compose.prod.yml up -d --build

# Wait for services to be ready
print_status "Waiting for services to start..."
sleep 30

# Check if services are running
if ! docker-compose -f docker-compose.prod.yml ps | grep -q "Up"; then
    print_error "Some services failed to start. Check logs:"
    docker-compose -f docker-compose.prod.yml logs
    exit 1
fi

print_status "Application is running!"

# Instructions for SSL setup
print_warning "IMPORTANT: SSL Setup Required!"
echo ""
echo "To set up SSL certificates, run the following commands:"
echo ""
echo "1. Install certbot:"
echo "   sudo apt update && sudo apt install certbot"
echo ""
echo "2. Get SSL certificates:"
echo "   sudo certbot certonly --webroot --webroot-path=/var/www/certbot -d $DOMAIN"
echo ""
echo "3. Copy certificates to ssl directory:"
echo "   sudo cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem ssl/"
echo "   sudo cp /etc/letsencrypt/live/$DOMAIN/privkey.pem ssl/"
echo "   sudo chown \$(whoami):\$(whoami) ssl/*.pem"
echo ""
echo "4. Restart nginx:"
echo "   docker-compose -f docker-compose.prod.yml restart nginx"
echo ""
echo "5. Set up auto-renewal:"
echo "   echo '0 2 * * * root certbot renew --quiet && docker-compose -f $(pwd)/docker-compose.prod.yml restart nginx' | sudo tee -a /etc/crontab"
echo ""

print_status "Deployment completed successfully!"
print_status "Your application should be accessible at: https://$DOMAIN"
print_status "Check logs with: docker-compose -f docker-compose.prod.yml logs -f" 