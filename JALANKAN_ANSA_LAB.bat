@echo off
title ANSA LAB - Server Mekanika Tanah
cd /d "%~dp0"
echo ========================================================
echo         LABORATORIUM MEKANIKA TANAH ANSA-LAB
echo         PT. TERRAFORMA GEOTEKNIK INDONESIA
echo ========================================================
echo.
echo [1/2] Membuka browser ke http://localhost:5175 ...
echo [2/2] Menjalankan Server Local...
echo.

start "" "http://localhost:5175"

call npm run dev

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Terjadi kesalahan saat menjalankan server.
    pause
)
