@echo off
echo 🚀 Запуск туристичного сервісу...
echo.

REM Перевірка чи встановлені залежності Backend
if not exist "backend\node_modules\" (
    echo 📦 Встановлення залежностей Backend...
    cd backend
    call npm install
    cd ..
)

REM Перевірка чи встановлені залежності Frontend
if not exist "frontend\node_modules\" (
    echo 📦 Встановлення залежностей Frontend...
    cd frontend
    call npm install
    cd ..
)

echo.
echo ✅ Залежності встановлені!
echo.
echo 🔧 Запуск серверів...
echo.

REM Запуск Backend в новому вікні
start "Backend Server" cmd /k "cd backend && npm run dev"

REM Чекаємо 3 секунди
timeout /t 3 /nobreak > nul

REM Запуск Frontend в новому вікні
start "Frontend Server" cmd /k "cd frontend && npm run dev"

echo.
echo ✅ Сервери запущено!
echo.
echo 📍 Backend API: http://localhost:3000
echo 📍 Frontend: http://localhost:5173
echo.
echo 🌐 Відкрийте у браузері: http://localhost:5173
echo.
echo ⚠️  Щоб зупинити сервери, закрийте вікна Backend та Frontend
echo.

pause
