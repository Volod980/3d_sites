#!/bin/bash

echo "🚀 Запуск туристичного сервісу..."
echo ""

# Перевірка чи встановлені залежності
if [ ! -d "backend/node_modules" ]; then
    echo "📦 Встановлення залежностей Backend..."
    cd backend && npm install && cd ..
fi

if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Встановлення залежностей Frontend..."
    cd frontend && npm install && cd ..
fi

echo ""
echo "✅ Залежності встановлені!"
echo ""
echo "🔧 Запуск серверів..."
echo ""

# Запуск Backend в фоні
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# Чекаємо 3 секунди щоб Backend встиг запуститись
sleep 3

# Запуск Frontend
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ Сервери запущено!"
echo ""
echo "📍 Backend API: http://localhost:3000"
echo "📍 Frontend: http://localhost:5173"
echo ""
echo "🌐 Відкрийте у браузері: http://localhost:5173"
echo ""
echo "⚠️  Щоб зупинити сервери, натисніть Ctrl+C"
echo ""

# Функція для зупинки серверів
cleanup() {
    echo ""
    echo "🛑 Зупинка серверів..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "✅ Сервери зупинено"
    exit 0
}

# Ловимо Ctrl+C
trap cleanup SIGINT SIGTERM

# Чекаємо
wait
