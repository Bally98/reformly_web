.PHONY: help up down clean logs build rebuild ps restart force-reload shell up-prod down-prod up-prod-local down-prod-local check-prod check-files verify-sync

# Default target
help:
	@echo "Available commands:"
	@echo "  make up          - Build and start containers with hot reload (dev)"
	@echo "  make up-prod     - Build and start production containers (server)"
	@echo "  make up-prod-local - Build and start production containers locally (with port 3000)"
	@echo "  make down        - Stop and remove containers"
	@echo "  make down-prod   - Stop and remove production containers"
	@echo "  make clean       - Full cleanup: stop containers, remove volumes, images, and clear Next.js cache"
	@echo "  make logs        - View container logs"
	@echo "  make build       - Build image"
	@echo "  make rebuild     - Rebuild image without cache"
	@echo "  make ps          - Show running containers"
	@echo "  make restart     - Restart containers"
	@echo "  make force-reload - Clear Next.js cache and restart (for hot reload issues)"
	@echo "  make shell       - Open shell in container"
	@echo "  make check-files - Check if files are synced in container"
	@echo "  make verify-sync - Compare local and container file contents"

# Commands
up:
	docker compose down || true
	docker compose up --build -d

up-fast:
	docker compose up -d

down:
	docker compose down

clean:
	@echo "=== Stopping containers ==="
	docker compose down -v || true
	@echo "=== Removing containers ==="
	docker compose rm -f || true
	docker rm -f reformly-web || true
	@echo "=== Clearing Next.js cache (if container exists) ==="
	docker exec reformly-web sh -c "rm -rf /app/.next" 2>/dev/null || echo "Container not running, skipping cache clear"
	@echo "=== Removing unused images ==="
	docker image prune -f
	@echo "=== Removing unused volumes ==="
	docker volume prune -f
	@echo "=== Clean complete! ==="

logs:
	docker compose logs -f web

build:
	docker compose build web

rebuild:
	docker compose build --no-cache web

restart:
	docker compose restart web

force-reload:
	@echo "=== Force reload: clearing cache and restarting ==="
	docker exec reformly-web sh -c "rm -rf /app/.next" 2>/dev/null || echo "Container not running"
	docker compose restart web
	@echo "=== Wait 5 seconds for server to restart, then hard refresh browser (Ctrl+Shift+R) ==="

ps:
	docker compose ps

shell:
	docker exec -it reformly-web sh

check-files:
	@echo "=== Checking file in container ==="
	@docker exec reformly-web cat /app/components/onboarding/Step12RatingModal.tsx | grep -A 3 "We'll create" || echo "File not found or text not present"

verify-sync:
	@echo "=== Verifying file synchronization ==="
	@echo "Local file (first 5 lines around line 143):"
	@sed -n '140,145p' components/onboarding/Step12RatingModal.tsx || head -n 145 components/onboarding/Step12RatingModal.tsx | tail -n 6
	@echo ""
	@echo "Container file (first 5 lines around line 143):"
	@docker exec reformly-web sed -n '140,145p' /app/components/onboarding/Step12RatingModal.tsx 2>/dev/null || docker exec reformly-web head -n 145 /app/components/onboarding/Step12RatingModal.tsx | tail -n 6 || echo "Cannot read file from container"

# Production commands
up-prod:
	docker compose -f docker-compose.prod.yml down || true
	docker rm -f reformly-web || true
	docker compose -f docker-compose.prod.yml up --build -d

down-prod:
	docker compose -f docker-compose.prod.yml down

# Production local testing commands
up-prod-local:
	docker compose -f docker-compose.prod.local.yml down || true
	docker rm -f reformly-web || true
	docker compose -f docker-compose.prod.local.yml up --build -d

down-prod-local:
	docker compose -f docker-compose.prod.local.yml down

# Diagnostic commands
check-prod:
	@echo "=== Container Status ==="
	@docker ps | grep reformly-web || echo "Container not running"
	@echo ""
	@echo "=== Container IP ==="
	@docker inspect reformly-web 2>/dev/null | grep -A 5 "NetworkSettings" | grep "IPAddress" || echo "Cannot get IP"
	@echo ""
	@echo "=== Testing from inside container ==="
	@docker exec reformly-web wget -qO- http://localhost:3000/onboarding 2>/dev/null | head -c 200 || echo "Connection failed"
	@echo ""
	@echo "=== Network info ==="
	@docker network ls | grep reformly || echo "No reformly network found"
