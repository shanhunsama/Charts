@echo off
chcp 65001 >nul
title 图表服务器 - 简化版

echo 正在启动图表服务器...
echo.

:: 启动服务器（自动选择端口）
python app.py --browser

pause