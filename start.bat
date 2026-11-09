@echo off
title LLM Chat Workspace
echo Starting LLM Chat Server...

REM Check if %APPDATA%\Antigravity\bin\agy-node.cmd exists
if exist "%APPDATA%\Antigravity\bin\agy-node.cmd" (
    echo Using Antigravity Node runtime...
    start http://localhost:3000
    "%APPDATA%\Antigravity\bin\agy-node.cmd" server.js
    goto end
)

REM Check if agy-node is on PATH
where agy-node >nul 2>nul
if %errorlevel% equ 0 (
    echo Using agy-node runtime...
    start http://localhost:3000
    agy-node server.js
    goto end
)

REM Check if standard node exists
where node >nul 2>nul
if %errorlevel% equ 0 (
    echo Using node runtime...
    start http://localhost:3000
    node server.js
    goto end
)

REM Fallback: Open index.html directly in browser
echo Node runtime not found on PATH.
echo Opening index.html directly in your default browser...
start index.html

:end
pause
