@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"

echo ==========================================================
echo   Antigravity 简体中文汉化 + 算力/配额 HUD 拓展包安装器
echo ==========================================================
echo.

where node >nul 2>nul
if errorlevel 1 (
    echo [错误] 未检测到 Node.js，请先安装 Node.js 18 或以上版本: https://nodejs.org/
    pause
    exit /b 1
)

tasklist /FI "IMAGENAME eq Antigravity.exe" 2>NUL | find /I "Antigravity.exe" >NUL
if "%ERRORLEVEL%"=="0" (
    echo [提示] 检测到 Antigravity.exe 正在运行！
    echo 请先完全退出 Antigravity 客户端（含系统托盘图标），再按任意键继续...
    pause
)

if not exist "node_modules\@electron\asar" (
    echo [准备] 首次运行，正在安装依赖 @electron/asar ...
    call npm install --omit=dev
    if errorlevel 1 (
        echo [错误] 依赖安装失败，请检查网络连接或 npm 配置。
        pause
        exit /b 1
    )
)

echo.
node bin\install.js %*
echo.
pause
