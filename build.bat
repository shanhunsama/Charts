@echo off
chcp 65001 >nul
title ChartServer插件打包工具

echo ========================================
echo ChartServer插件可执行文件打包工具
echo ========================================

:: 检查Python是否安装
python --version >nul 2>&1
if errorlevel 1 (
    echo 错误：未找到Python，请先安装Python 3.7+
    pause
    exit /b 1
)

:: 安装依赖
echo 正在安装依赖包...
pip install -r requirements.txt

:: 运行打包脚本
echo 正在构建可执行文件...
python build_exe.py

if errorlevel 1 (
    echo.
    echo 打包失败！
    pause
    exit /b 1
) else (
    echo.
    echo 打包成功！
    echo 可执行文件已生成到：Plugins\ChartServer\Binaries\Win64\chart_server.exe
)

pause