#!/bin/bash
PROJECT_DIR="/e/dopamine-shop"

echo "🛑 Остановка DopamineShop..."

# Убить node процессы
taskkill //F //IM node.exe > /dev/null 2>&1 || true

# Остановить Docker
cd "$PROJECT_DIR"
docker-compose down > /dev/null 2>&1 || true

echo "✅ Остановлено"
