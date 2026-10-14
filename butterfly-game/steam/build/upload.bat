@echo off
rem Uploads the build to Steam. Needs steamcmd (https://developer.valvesoftware.com/wiki/SteamCMD) and the content from prepare_content.bat.
rem Edit build\app_build.vdf first (AppID and depot ids from Steamworks), then:  upload.bat <steam-login>
if "%~1"=="" (echo usage: upload.bat ^<steamworks-login^> & exit /b 1)
steamcmd +login %1 +run_app_build "%~dp0app_build.vdf" +quit
