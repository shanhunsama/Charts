@echo off
chcp 65001 >nul
title ChartServer插件本地虚拟环境打包工具

echo ========================================
echo ChartServer插件本地虚拟环境打包工具
echo ========================================

:: 检查Python是否安装
python --version >nul 2>&1
if errorlevel 1 (
    echo 错误：未找到Python，请先安装Python 3.7+
    pause
    exit /b 1
)

:: 运行本地虚拟环境打包脚本
echo 正在使用Script目录下的虚拟环境进行打包...
python venv_build_local.py

if errorlevel 1 (
    echo.
    echo 打包失败！
    pause
    exit /b 1
) else (
    echo.
    echo 打包成功！
    echo 虚拟环境位置: .venv
    echo 可执行文件位置: ..\Binaries\Win64\chart_server.exe
)

pause