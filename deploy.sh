#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/srv/lotus-lion}"
BRANCH="${BRANCH:-main}"

# Ensure standard path and load NVM if present
export PATH="/usr/local/bin:/usr/bin:/bin:$PATH"
for nvm_path in "$HOME/.nvm" "/home/deploy/.nvm" "/root/.nvm"; do
  if [ -s "$nvm_path/nvm.sh" ]; then
    export NVM_DIR="$nvm_path"
    # shellcheck disable=SC1090
    \. "$nvm_path/nvm.sh"
    break
  fi
done

echo "=================================================="
echo "==> Starting deployment: $(date -u)"
echo "==> Working directory: $APP_DIR"
echo "==> Target branch: $BRANCH"
echo "=================================================="

cd "$APP_DIR"
git config --global --add safe.directory "$APP_DIR" || true

echo "==> Fetching latest changes from Git..."
git fetch origin "$BRANCH"
git checkout -B "$BRANCH" "origin/$BRANCH"
git reset --hard "origin/$BRANCH"

echo "==> Installing backend dependencies..."
(cd backend && npm install --omit=dev)

echo "==> Installing frontend dependencies..."
(cd frontend && npm install)

echo "==> Building Next.js frontend..."
(cd frontend && npm run build)

echo "==> Starting/reloading PM2 services..."
pm2 startOrReload "$APP_DIR/ecosystem.config.cjs" --update-env
pm2 save

echo "=================================================="
echo "==> Deployment completed successfully: $(date -u)"
echo "=================================================="
