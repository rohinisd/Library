#!/usr/bin/env bash
# Deploy to Vercel (production). Uses VERCEL_TOKEN from env or .env.
set -e
cd "$(dirname "$0")/.."

if [ -z "$VERCEL_TOKEN" ] && [ -f .env ]; then
  set -a
  source .env
  set +a
fi

if [ -z "$VERCEL_TOKEN" ]; then
  echo "VERCEL_TOKEN is not set. Add it to .env or Cursor environment variables. See VERCEL_SETUP.md" >&2
  exit 1
fi

npx vercel deploy --prod --token="$VERCEL_TOKEN" --yes
