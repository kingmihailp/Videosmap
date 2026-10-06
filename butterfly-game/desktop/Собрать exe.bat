@echo off
rem Builds Flora0world-Butterflies.exe (needs Node.js 18+ from nodejs.org). Result: desktop\dist\Flora0world-Butterflies.exe
cd /d "%~dp0"
call npm install || goto :err
call npm run dist || goto :err
echo.
echo Готово: %~dp0dist\Flora0world-Butterflies.exe
pause
exit /b 0
:err
echo Сборка не удалась.
pause
exit /b 1
