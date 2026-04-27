@echo off
echo === Project Reset Script ===
echo Stopping all processes...

for /f "tokens=2" %%i in ('tasklist /fi "imagename eq node.exe" /fo csv ^| find "node.exe"') do taskkill /f /pid %%i 2>nul
for /f "tokens=2" %%i in ('tasklist /fi "imagename eq tsx.exe" /fo csv ^| find "tsx.exe"') do taskkill /f /pid %%i 2>nul

echo Clearing ports 3000, 3001, 5173...
for /f "tokens=5" %%i in ('netstat -aon ^| find ":3000"') do taskkill /f /pid %%i 2>nul
for /f "tokens=5" %%i in ('netstat -aon ^| find ":3001"') do taskkill /f /pid %%i 2>nul
for /f "tokens=5" %%i in ('netstat -aon ^| find ":5173"') do taskkill /f /pid %%i 2>nul

echo Cleaning cache files...
if exist "node_modules\.vite" rmdir /s /q "node_modules\.vite" 2>nul
if exist "packages\server\dist" rmdir /s /q "packages\server\dist" 2>nul
if exist "packages\client\dist" rmdir /s /q "packages\client\dist" 2>nul
if exist "packages\server\node_modules\.vite" rmdir /s /q "packages\server\node_modules\.vite" 2>nul
if exist "packages\client\node_modules\.vite" rmdir /s /q "packages\client\node_modules\.vite" 2>nul

echo Waiting for processes to fully stop...
timeout /t 2 /nobreak >nul

echo Starting server...
cd packages\server
start "Server" cmd /c "pnpm run dev"
cd ..\..

echo Waiting for server to start...
timeout /t 3 /nobreak >nul

echo Starting client...
cd packages\client
start "Client" cmd /c "pnpm run dev"
cd ..\..

echo === Reset Complete ===
echo Server: http://localhost:3001
echo Client: http://localhost:5174
echo.
echo To stop: stop.bat
echo To reset again: reset.bat
