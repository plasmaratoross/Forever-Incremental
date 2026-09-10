@echo off
echo Starting Forever Incremental Web Server...
powershell -ExecutionPolicy Bypass -File "%~dp0server.ps1"
pause
