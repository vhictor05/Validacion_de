@echo off
title Lanzador - Validador de Texto
setlocal

echo ======================================================
echo          INICIANDO VALIDADOR DE TEXTO
echo ======================================================
echo.

:: 1. Verificar si existe el entorno virtual
if not exist ".venv" (
    echo [ERROR] No se encontro la carpeta .venv.
    echo Asegurate de haber instalado las dependencias primero.
    echo.
    pause
    exit /b
)

:: 2. Intentar abrir el navegador por defecto
echo [+] Abriendo navegador en http://127.0.0.1:8000...
start http://127.0.0.1:8000

:: 3. Ejecutar el servidor Python
echo [+] Iniciando servidor backend...
echo.
echo [INFO] Para apagar la aplicacion, simplemente cierra esta ventana.
echo.

.\.venv\Scripts\python.exe -m uvicorn main:app

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] El servidor se detuvo inesperadamente.
    pause
)
