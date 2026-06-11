#!/usr/bin/env bash
set -e

# Ensure Node is on PATH
export PATH="/opt/homebrew/opt/node@26/bin:$PATH"

# Tokens
export RAILWAY_TOKEN="${RAILWAY_TOKEN:-your_railway_token_placeholder}"
export VERCEL_TOKEN="${VERCEL_TOKEN:-your_vercel_token_placeholder}"

# Project directory
cd "$HOME/Documents/CineHub"

# Railway backend deployment
npx railway login --api-key "$RAILWAY_TOKEN"
npx railway init --service backend --yes
npx railway link --yes
npx railway add postgresql --yes
RAILWAY_OUTPUT=$(npx railway up --service backend)
RAILWAY_URL=$(echo "$RAILWAY_OUTPUT" | grep -Eo "https://[a-z0-9-]+\\.railway\\.app" | head -n1)
echo "Railway URL: $RAILWAY_URL"

# Vercel frontend deployment
VERCEL_OUTPUT=$(npx vercel --prod --yes)
VERCEL_URL=$(echo "$VERCEL_OUTPUT" | grep -Eo "https://[a-z0-9-]+\\.vercel\\.app" | head -n1)
echo "Vercel URL: $VERCEL_URL"

# Save URLs
cat > deployment_urls.txt <<EOF
Railway Backend URL: $RAILWAY_URL
Vercel Frontend URL: $VERCEL_URL
EOF

echo "✅ URLs saved to deployment_urls.txt"
