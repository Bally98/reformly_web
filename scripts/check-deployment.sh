#!/bin/bash

# Script to diagnose deployment issues
# Run this on the server to check what's wrong

echo "=== Deployment Diagnostic Script ==="
echo ""

echo "1. Checking container status..."
docker ps -a | grep reformly-web || echo "❌ Container reformly-web not found"
echo ""

echo "2. Checking if container is running..."
if docker ps | grep -q reformly-web; then
  echo "✅ Container is running"
else
  echo "❌ Container is NOT running"
  echo "   Trying to start..."
  cd /path/to/reformly_web  # Update this path
  make up-prod
fi
echo ""

echo "3. Checking container logs (last 20 lines)..."
docker logs --tail 20 reformly-web 2>&1 | tail -20
echo ""

echo "4. Checking if container responds on port 3000..."
docker exec reformly-web wget -qO- http://localhost:3000 2>&1 | head -c 200 || echo "❌ Container not responding on port 3000"
echo ""

echo "5. Checking Traefik network..."
docker network ls | grep traefik || echo "❌ Traefik network not found"
echo ""

echo "6. Checking if container is in Traefik network..."
docker inspect reformly-web 2>/dev/null | grep -A 10 "Networks" | grep traefik || echo "⚠️  Container might not be in Traefik network"
echo ""

echo "7. Checking Traefik labels..."
docker inspect reformly-web 2>/dev/null | grep -A 20 "Labels" | grep traefik || echo "❌ No Traefik labels found"
echo ""

echo "8. Checking Traefik container..."
docker ps | grep traefik || echo "❌ Traefik container not running"
echo ""

echo "9. Testing from inside container..."
docker exec reformly-web wget -qO- http://localhost:3000/onboarding 2>&1 | head -c 200 || echo "❌ /onboarding route not accessible"
echo ""

echo "=== Diagnostic complete ==="

