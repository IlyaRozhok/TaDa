#!/bin/bash

# SSL Setup Script for TaDa Platform
# This script sets up SSL certificates using Let's Encrypt

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

# Check if .env file exists
if [ ! -f ".env" ]; then
    print_error ".env file not found!"
    exit 1
fi

# Load environment variables
source .env

# Validate required environment variables
if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
    print_error "DOMAIN and EMAIL must be set in .env file"
    exit 1
fi

print_status "Setting up SSL certificates for domain: $DOMAIN"

# Install certbot if not already installed
if ! command -v certbot &> /dev/null; then
    print_status "Installing certbot..."
    sudo apt update
    sudo apt install -y certbot
fi

# Create webroot directory for Let's Encrypt challenges
sudo mkdir -p /var/www/certbot

# Get SSL certificates
print_status "Requesting SSL certificates from Let's Encrypt..."
sudo certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    --force-renewal \
    -d $DOMAIN

# Check if certificates were created
if [ ! -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    print_error "Failed to obtain SSL certificates"
    exit 1
fi

# Copy certificates to ssl directory
print_status "Copying certificates to ssl directory..."
sudo cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem ssl/
sudo cp /etc/letsencrypt/live/$DOMAIN/privkey.pem ssl/
sudo chown $(whoami):$(whoami) ssl/*.pem

# Restart nginx container
print_status "Restarting nginx container..."
docker-compose -f docker-compose.prod.yml restart nginx

# Set up auto-renewal
print_status "Setting up automatic certificate renewal..."
CRON_LINE="0 2 * * * root certbot renew --quiet && docker-compose -f $(pwd)/docker-compose.prod.yml restart nginx"

# Check if cron job already exists
if ! sudo crontab -l | grep -q "certbot renew"; then
    echo "$CRON_LINE" | sudo tee -a /etc/crontab
    print_status "Auto-renewal cron job added"
else
    print_warning "Auto-renewal cron job already exists"
fi

print_status "SSL setup completed successfully!"
print_status "Your site should now be accessible at: https://$DOMAIN"

# Test SSL configuration
print_status "Testing SSL configuration..."
if curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN/health | grep -q "200"; then
    print_status "SSL configuration is working correctly!"
else
    print_warning "SSL test failed. Please check your configuration."
fi 