@echo off
chcp 65001 >nul
echo ==========================================================
echo   Antigravity 对话历史标题批量汉化工具
echo ==========================================================
echo.
tasklist /FI "IMAGENAME eq Antigravity.exe" 2>NUL | find /I "Antigravity.exe" >NUL
if "%ERRORLEVEL%"=="0" (
    echo [警告] 检测到 Antigravity.exe 正在运行！
    echo 请先完全退出 Antigravity 客户端（含系统托盘），再按任意键继续，
    echo 否则客户端退出或重启时会用内存缓存覆盖数据库。
    pause
)
echo.
echo 正在备份并同步更新 conversation_summaries.db 与 agyhub_summaries_proto.pb ...
python "%~dp0update_titles.py" --apply
echo.
pause
