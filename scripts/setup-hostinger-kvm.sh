#!/usr/bin/env bash
# ==============================================================================
# Lotus & Lion - Hostinger KVM VPS Total Automated Setup Script
# Works on Ubuntu 20.04 / 22.04 / 24.04 & Debian 11 / 12
# ==============================================================================
set -euo pipefail

REPO_URL="https://github.com/2300040331/lotusandlion.git"
APP_DIR="/srv/lotus-lion"
BRANCH="main"

echo "=================================================================="
echo "   🚀 Starting Lotus & Lion Hostinger KVM 2 Server Setup"
echo "=================================================================="

# Check root
if [ "$(id -u)" -ne 0 ]; then
  echo "❌ This script must be run as root. Run with: sudo bash $0"
  exit 1
fi

echo "==> [1/7] Updating system packages..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y curl wget git build-essential ufw nginx certbot python3-certbot-nginx redis-server

# Ensure Redis is running
systemctl enable redis-server || systemctl enable redis
systemctl start redis-server || systemctl start redis

echo "==> [2/7] Installing Node.js 20 LTS & PM2..."
if ! command -v node >/dev/null 2>&1 || [ "$(node -v | cut -d'.' -f1 | tr -d 'v')" -lt 20 ]; then
  echo "Installing Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

echo "Node version: $(node -v)"
echo "NPM version:  $(npm -v)"

# Install PM2 globally
npm install -g pm2

echo "==> [3/7] Setting up Firewall (UFW)..."
ufw allow OpenSSH || ufw allow 22/tcp
ufw allow 'Nginx Full' || (ufw allow 80/tcp && ufw allow 443/tcp)
echo "y" | ufw enable || true

echo "==> [4/7] Cloning / Updating Repository in $APP_DIR..."
git config --global --add safe.directory "$APP_DIR" || true
mkdir -p /srv
if [ ! -d "$APP_DIR/.git" ]; then
  echo "Cloning repository..."
  git clone -b "$BRANCH" "$REPO_URL" "$APP_DIR"
else
  echo "Repository exists. Updating..."
  cd "$APP_DIR"
  git fetch origin "$BRANCH"
  git checkout -B "$BRANCH" "origin/$BRANCH"
  git reset --hard "origin/$BRANCH"
fi

cd "$APP_DIR"
chmod +x "$APP_DIR/deploy.sh"

echo "==> [5/7] Preparing Environment Variables..."
# Backend environment setup
if [ ! -f "$APP_DIR/backend/.env" ]; then
  if [ -f "$APP_DIR/backend/.env.vercel.prod" ]; then
    echo "Creating backend/.env from .env.vercel.prod..."
    cp "$APP_DIR/backend/.env.vercel.prod" "$APP_DIR/backend/.env"
  else
    echo "Creating default backend/.env..."
    cat << 'EOF' > "$APP_DIR/backend/.env"
NODE_ENV=production
PORT=5000
CLIENT_URL=http://localhost:3000
EOF
  fi
fi

# Frontend environment setup
if [ ! -f "$APP_DIR/frontend/.env.local" ] && [ ! -f "$APP_DIR/frontend/.env.production" ]; then
  echo "Creating frontend/.env.local..."
  cat << 'EOF' > "$APP_DIR/frontend/.env.local"
NODE_ENV=production
NEXT_PUBLIC_API_URL=/api
EOF
  if [ -f "$APP_DIR/backend/.env" ]; then
    SB_URL=$(grep "^SUPABASE_URL=" "$APP_DIR/backend/.env" | cut -d'=' -f2- | tr -d '"' | tr -d "'")
    if [ -n "$SB_URL" ]; then
      echo "NEXT_PUBLIC_SUPABASE_URL=$SB_URL" >> "$APP_DIR/frontend/.env.local"
    fi
  fi
fi

echo "==> [6/7] Configuring Nginx Reverse Proxy..."
cp "$APP_DIR/nginx/lotus-lion.conf" /etc/nginx/sites-available/lotus-lion
ln -sf /etc/nginx/sites-available/lotus-lion /etc/nginx/sites-enabled/lotus-lion
rm -f /etc/nginx/sites-enabled/default

nginx -t
systemctl restart nginx

echo "==> [7/7] Installing Dependencies & Launching Services via PM2..."
bash "$APP_DIR/deploy.sh"

# Setup PM2 to survive server reboots
pm2 startup systemd -u root --hp /root || true
pm2 save

echo ""
echo "=================================================================="
echo "   ✅ Lotus & Lion Server Setup Complete!"
echo "=================================================================="
echo "Server Status:"
pm2 status
echo ""
echo "Nginx Status: $(systemctl is-active nginx)"
echo "Redis Status: $(systemctl is-active redis-server || systemctl is-active redis)"
echo ""
echo "Your website is now LIVE and accessible via your VPS IP address!"
echo ""
echo "Next Steps:"
echo "1. Point your domain (lotusandlion.in) A-Record to this server's IP in Hostinger DNS."
echo "2. Once pointed, run SSL setup with: certbot --nginx -d lotusandlion.in -d www.lotusandlion.in"
echo "=================================================================="
