@echo off
setlocal ENABLEDELAYEDEXPANSION

echo === MultiDev Reset Script (Port 5174) ===
echo Stopping existing server/client processes...

for /f "tokens=5" %%i in ('netstat -aon ^| findstr ":5174"') do taskkill /f /pid %%i >nul 2>&1
for /f "tokens=5" %%i in ('netstat -aon ^| findstr ":5173"') do taskkill /f /pid %%i >nul 2>&1

timeout /t 1 /nobreak >nul

echo Starting multiplayer server on port 5174...
start "Mugen MultiDev Server" cmd /k "pnpm --filter @mugen/server dev"

echo Waiting for port 5174 to become available...
set PORT_READY=0
for /l %%a in (1,1,40) do (
  netstat -aon | findstr ":5174" | findstr "LISTENING" >nul && (
    set PORT_READY=1
    goto :port_ready
  )
  timeout /t 1 /nobreak >nul
)

:port_ready
if "%PORT_READY%"=="1" (
  echo Port 5174 is listening.
) else (
  echo WARNING: Timed out waiting for port 5174. Continuing anyway...
)

echo Starting client in beta mode...
start "Mugen MultiDev Client" cmd /k "pnpm --filter @mugen/client dev:beta"

echo.
echo === MultiDev Ready ===
echo Host Dev URL:    http://localhost:5173
echo LAN Player URL:  http://YOUR_LOCAL_IP:5174
echo Public Player URL: http://YOUR_PUBLIC_IP:5174
echo Health Check: http://YOUR_PUBLIC_IP:5174/health
echo.
echo Note: External players should use the port-5174 URL only after port forwarding 5174/TCP to this PC.
