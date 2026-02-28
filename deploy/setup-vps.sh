#!/usr/bin/env bash
#
# Cafe Vitalia — VPS initial setup script
# Run on a fresh Ubuntu 22.04/24.04 server as root
#
# Usage:
#   curl -sSL https://raw.githubusercontent.com/alatyr-school/alatyr-school.github.io/main/deploy/setup-vps.sh | bash -s -- YOUR_DOMAIN YOUR_EMAIL
#
# Example:
#   bash setup-vps.sh cafevitalia.ua admin@cafevitalia.ua

set -euo pipefail

DOMAIN="${1:?Usage: $0 <domain> <email>}"
EMAIL="${2:?Usage: $0 <domain> <email>}"
APP_DIR="/opt/cafe-vitalia"
DEPLOY_USER="deploy"

echo "========================================="
echo "  Cafe Vitalia — VPS Setup"
echo "  Domain: $DOMAIN"
echo "  Email:  $EMAIL"
echo "========================================="

# ─── 1. System updates ───
echo "[1/8] Updating system..."
apt-get update -qq && apt-get upgrade -y -qq

# ─── 2. Install Docker ───
echo "[2/8] Installing Docker..."
if ! command -v docker &>/dev/null; then
    curl -fsSL https://get.docker.com | sh
    systemctl enable --now docker
fi

# ─── 3. Create deploy user ───
echo "[3/8] Creating deploy user..."
if ! id "$DEPLOY_USER" &>/dev/null; then
    useradd -m -s /bin/bash -G docker "$DEPLOY_USER"
    mkdir -p /home/$DEPLOY_USER/.ssh
    cp /root/.ssh/authorized_keys /home/$DEPLOY_USER/.ssh/ 2>/dev/null || true
    chown -R $DEPLOY_USER:$DEPLOY_USER /home/$DEPLOY_USER/.ssh
    chmod 700 /home/$DEPLOY_USER/.ssh
    chmod 600 /home/$DEPLOY_USER/.ssh/authorized_keys 2>/dev/null || true
fi

# ─── 4. Firewall ───
echo "[4/8] Configuring firewall..."
apt-get install -y -qq ufw
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
echo "y" | ufw enable

# ─── 5. Clone repository ───
echo "[5/8] Cloning repository..."
mkdir -p "$APP_DIR"
if [ ! -d "$APP_DIR/.git" ]; then
    git clone https://github.com/alatyr-school/alatyr-school.github.io.git "$APP_DIR"
else
    cd "$APP_DIR" && git pull origin main
fi
chown -R $DEPLOY_USER:$DEPLOY_USER "$APP_DIR"

# ─── 6. Configure Nginx with domain ───
echo "[6/8] Configuring Nginx for $DOMAIN..."
cd "$APP_DIR"

# Start with HTTP-only config for initial certbot
cp deploy/nginx/conf.d/app.nossl.conf deploy/nginx/conf.d/default.conf

# ─── 7. Start services (HTTP only first) ───
echo "[7/8] Starting services..."
docker compose -f docker-compose.prod.yml up -d --build

echo "Waiting for services to be healthy..."
sleep 15

# ─── 8. Obtain SSL certificate ───
echo "[8/8] Obtaining SSL certificate for $DOMAIN..."
docker compose -f docker-compose.prod.yml run --rm certbot \
    certbot certonly --webroot \
    --webroot-path=/var/www/certbot \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    -d "$DOMAIN" \
    -d "www.$DOMAIN"

# Switch to SSL config
sed "s/\${DOMAIN}/$DOMAIN/g" deploy/nginx/conf.d/app.conf > deploy/nginx/conf.d/default.conf

# Restart nginx with SSL
docker compose -f docker-compose.prod.yml restart nginx

echo ""
echo "========================================="
echo "  Setup complete!"
echo ""
echo "  Your site is live at:"
echo "    https://$DOMAIN"
echo ""
echo "  SSL auto-renewal is configured."
echo ""
echo "  To redeploy manually:"
echo "    cd $APP_DIR"
echo "    git pull origin main"
echo "    docker compose -f docker-compose.prod.yml up -d --build"
echo ""
echo "  GitHub Actions will auto-deploy on push."
echo "  Add these secrets to your repository:"
echo "    VPS_HOST     = your server IP"
echo "    VPS_USER     = deploy"
echo "    VPS_SSH_KEY  = (private SSH key)"
echo "========================================="
