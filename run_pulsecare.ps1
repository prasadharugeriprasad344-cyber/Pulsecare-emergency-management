# PulseCare One-Click Launcher for Windows PowerShell
$nodePath = "C:\Users\prasa\.gemini\antigravity\scratch\nodejs\node-v20.18.0-win-x64"
$env:PATH = "$nodePath;$env:PATH"
$env:PYTHONPATH = "."

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   Starting PulseCare - Smart Emergency Operations        " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Start FastAPI Backend in background job
Write-Host "--> Launching FastAPI Backend on http://127.0.0.1:8000..." -ForegroundColor Yellow
Start-Process -FilePath "python" -ArgumentList "-m uvicorn server:app --host 127.0.0.1 --port 8000" -WindowStyle Minimized

# 2. Wait 2 seconds for backend to initialize
Start-Sleep -Seconds 2

# 3. Start Vite React Frontend
Write-Host "--> Launching React Vite Frontend on http://127.0.0.1:5173..." -ForegroundColor Green
Write-Host "--> Opening browser..." -ForegroundColor Cyan
Start-Process "http://localhost:5173"

Set-Location "frontend"
npm run dev -- --host 127.0.0.1 --port 5173
