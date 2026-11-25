@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"

echo ==========================================================
echo   Antigravity 汉化 + HUD 拓展包 一键卸载还原器
echo ==========================================================
echo.

tasklist /FI "IMAGENAME eq Antigravity.exe" 2>NUL | find /I "Antigravity.exe" >NUL
if "%ERRORLEVEL%"=="0" (
    echo [提示] 检测到 Antigravity.exe 正在运行！
    echo 请先完全退出 Antigravity 客户端（含系统托盘图标），再按任意键继续...
    pause
)

if not exist "node_modules\@electron\asar" (
    call npm install --omit=dev
)

echo.
node bin\uninstall.js %*
echo.
pause
