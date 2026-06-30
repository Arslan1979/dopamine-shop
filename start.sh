#!/bin/bash
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_DIR="/e/dopamine-shop"
cd "$PROJECT_DIR"

echo -e "${GREEN}🚀 DopamineShop — Quick Start${NC}"
echo ""

# === 1. Проверка Docker ===
echo -e "${YELLOW}▶ Проверка Docker...${NC}"
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker не запущен. Запустите Docker Desktop.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker работает${NC}"

# === 2. Убить старые процессы ===
echo -e "${YELLOW}▶ Остановка старых процессов...${NC}"
taskkill //F //IM node.exe > /dev/null 2>&1 || true
sleep 2

# === 3. Запуск Docker-контейнеров ===
echo -e "${YELLOW}▶ Запуск PostgreSQL и Redis...${NC}"
docker-compose up -d postgres redis

# Ожидание PostgreSQL (через docker exec)
echo -e "${YELLOW}▶ Ожидание PostgreSQL...${NC}"
for i in {1..60}; do
    if docker exec dopamine-shop-postgres-1 pg_isready -U postgres > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PostgreSQL готов${NC}"
        break
    fi
    printf "."
    sleep 1
    if [ $i -eq 60 ]; then
        echo ""
        echo -e "${RED}❌ PostgreSQL не запустился${NC}"
        docker logs dopamine-shop-postgres-1 --tail 10
        exit 1
    fi
done

# === 4. Экспорт переменных ===
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/dopamine_shop?schema=public"
export JWT_SECRET="dev-secret-change-me"
export JWT_REFRESH_SECRET="dev-refresh-change-me"
export PORT=3001
export WEB_URL="http://localhost:3000"

# === 5. Prisma: generate + migrate ===
echo -e "${YELLOW}▶ Prisma generate...${NC}"
cd "$PROJECT_DIR/packages/database"
npx prisma generate > /dev/null 2>&1

echo -e "${YELLOW}▶ Prisma migrate deploy...${NC}"
npx prisma migrate deploy > /dev/null 2>&1

# === 6. Seed (если products пустые) ===
PRODUCT_COUNT=$(docker exec dopamine-shop-postgres-1 psql -U postgres -d dopamine_shop -t -c "SELECT COUNT(*) FROM products;" 2>/dev/null | tr -d ' \n' || echo "0")
if [ "$PRODUCT_COUNT" = "0" ]; then
    echo -e "${YELLOW}▶ Заполнение БД (seed)...${NC}"
    npx tsx prisma/seed.ts > /dev/null 2>&1 || echo "Seed пропущен"
else
    echo -e "${GREEN}✓ Товары в БД: $PRODUCT_COUNT${NC}"
fi

# === 7. Создание .env для Web (если нет) ===
if [ ! -f "$PROJECT_DIR/apps/web/.env" ]; then
    echo 'VITE_API_URL="http://localhost:3001/api"' > "$PROJECT_DIR/apps/web/.env"
    echo -e "${YELLOW}▶ Создан apps/web/.env${NC}"
fi

# === 8. Запуск API в фоне ===
echo -e "${YELLOW}▶ Запуск API...${NC}"
cd "$PROJECT_DIR/apps/api"
nohup npx tsx src/index.ts > "$PROJECT_DIR/api.log" 2>&1 &
API_PID=$!
sleep 5

if curl -s http://localhost:3001/api/health > /dev/null; then
    echo -e "${GREEN}✓ API: http://localhost:3001${NC}"
else
    echo -e "${RED}❌ API не запустился. Логи: api.log${NC}"
    exit 1
fi

# === 9. Запуск Web в фоне ===
echo -e "${YELLOW}▶ Запуск Web...${NC}"
cd "$PROJECT_DIR/apps/web"
nohup pnpm run dev > "$PROJECT_DIR/web.log" 2>&1 &
WEB_PID=$!
sleep 5

if curl -s http://localhost:3000 > /dev/null; then
    echo -e "${GREEN}✓ Web: http://localhost:3000${NC}"
else
    echo -e "${RED}❌ Web не запустился. Логи: web.log${NC}"
fi

# === 10. Финал ===
echo ""
echo -e "${GREEN}✅ Всё запущено!${NC}"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "  ${GREEN}🌐 Откройте:${NC} http://localhost:3000"
echo -e "  ${GREEN}📡 API:${NC}      http://localhost:3001"
echo ""
echo -e "  ${YELLOW}Логи:${NC}"
echo -e "    API: $PROJECT_DIR/api.log"
echo -e "    Web: $PROJECT_DIR/web.log"
echo ""
echo -e "  ${YELLOW}Остановить:${NC}"
echo -e "    cd $PROJECT_DIR && ./stop.sh"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
