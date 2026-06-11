#!/usr/bin/env bash
set -e

# -------------------------------------------------
# Automatic deployment of CineHub backend (Railway) and frontend (Vercel)
# -------------------------------------------------
# Ensure the correct Node binary is on PATH
export PATH="/opt/homebrew/opt/node@26/bin:$PATH"

# Authentication tokens (replace if you regenerate them)
export RAILWAY_TOKEN="${RAILWAY_TOKEN:-your_railway_token_placeholder}"
export VERCEL_TOKEN="${VERCEL_TOKEN:-your_vercel_token_placeholder}"

# Project directory
REPO_DIR="$HOME/Documents/CineHub"
cd "$REPO_DIR"

# -------------------------------------------------
# Railway backend deployment
# -------------------------------------------------
# Prepare Railway configuration files (required by the CLI)
mkdir -p .railway
touch .railway/railway.ts

# Login to Railway using the API key
npx railway login --api-key "$RAILWAY_TOKEN"

# Initialize the backend service (idempotent – does nothing if already initialized)
npx railway init --service backend --yes

# Link the local repo to the Railway project
npx railway link --yes

# Provision a PostgreSQL database
npx railway add postgresql --yes

# Deploy the backend (foreground) and capture the output
RAILWAY_OUTPUT=$(npx railway up --service backend)

# Extract the public Railway URL from the CLI output
RAILWAY_URL=$(echo "$RAILWAY_OUTPUT" | grep -Eo "https://[a-z0-9-]+\.railway\.app" | head -n1)

echo "--- Railway backend deployment complete ---"
echo "Railway URL: $RAILWAY_URL"

# -------------------------------------------------
# Vercel frontend deployment
# -------------------------------------------------
# Deploy the frontend to Vercel (production) – Vercel CLI will use VERCEL_TOKEN automatically
VERCEL_OUTPUT=$(npx vercel --prod --yes)

# Extract the Vercel URL from the CLI output
VERCEL_URL=$(echo "$VERCEL_OUTPUT" | grep -Eo "https://[a-z0-9-]+\.vercel\.app" | head -n1)

echo "--- Vercel frontend deployment complete ---"
echo "Vercel URL: $VERCEL_URL"

# Save both URLs to a file for quick reference
cat > deployment_urls.txt <<EOF
Railway Backend URL: $RAILWAY_URL
Vercel Frontend URL: $VERCEL_URL
EOF

echo "Deployment URLs saved to deployment_urls.txt"
