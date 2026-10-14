@echo off
rem Builds the game and puts it where steamcmd expects it:  steam\content\windows\  (and, if you built it on Linux, steam\content\linux\)
rem Needs Node.js 18+. Put your AppID into steam\steam_appid.txt first (it is read by the game to start Steamworks).
cd /d "%~dp0..\..\desktop"
call npm install || goto :err
call npx electron-builder --win dir --x64 || goto :err
if exist "%~dp0..\content\windows" rmdir /s /q "%~dp0..\content\windows"
xcopy /e /i /y "dist\win-unpacked" "%~dp0..\content\windows" >nul
echo.
echo Ready: steam\content\windows  - now edit steam\build\app_build.vdf and run steam\build\upload.bat
pause
exit /b 0
:err
echo build failed
pause
exit /b 1
