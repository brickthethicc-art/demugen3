@echo off
echo === Stopping Project ===
echo Stopping server and client processes...

for /f "tokens=2" %%i in ('tasklist /fi "imagename eq node.exe" /fo csv ^| find "node.exe"') do taskkill /f /pid %%i 2>nul
for /f "tokens=2" %%i in ('tasklist /fi "imagename eq tsx.exe" /fo csv ^| find "tsx.exe"') do taskkill /f /pid %%i 2>nul

echo Clearing ports...
for /f "tokens=5" %%i in ('netstat -aon ^| find ":3000"') do taskkill /f /pid %%i 2>nul
for /f "tokens=5" %%i in ('netstat -aon ^| find ":3001"') do taskkill /f /pid %%i 2>nul
for /f "tokens=5" %%i in ('netstat -aon ^| find ":5173"') do taskkill /f /pid %%i 2>nul

echo === Stopped ===
