import os
import sys
import subprocess
import shutil
from pathlib import Path

def check_pyinstaller():
    """检查PyInstaller是否安装"""
    try:
        import PyInstaller
        return True
    except ImportError:
        return False

def install_pyinstaller():
    """安装PyInstaller"""
    print("正在安装PyInstaller...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "pyinstaller"])

def create_spec_file():
    """创建PyInstaller spec文件"""
    spec_content = '''# -*- mode: python ; coding: utf-8 -*-

import sys
from PyInstaller.utils.hooks import collect_data_files

block_cipher = None

a = Analysis(
    ['app.py'],
    pathex=[],
    binaries=[],
    datas=[
        ('index.html', '.'),
        ('styles', 'styles'),
        ('scripts', 'scripts')
    ],
    hiddenimports=[],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='chart_server',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=None,
)
'''

    with open('chart_server.spec', 'w', encoding='utf-8') as f:
        f.write(spec_content)

def build_executable():
    """构建可执行文件"""
    print("开始构建可执行文件...")
    
    # 使用spec文件构建
    result = subprocess.run([
        sys.executable, "-m", "PyInstaller",
        "chart_server.spec",
        "--onefile",
        "--noconsole"  # 隐藏控制台窗口
    ], capture_output=True, text=True)
    
    if result.returncode == 0:
        print("构建成功！")
        return True
    else:
        print("构建失败:", result.stderr)
        return False

def create_port_checker():
    """创建端口检查脚本"""
    port_checker_content = '''import socket
import sys

def check_port(port, host='127.0.0.1'):
    """检查端口是否被占用"""
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(1)
            result = s.connect_ex((host, port))
            return result == 0  # 0表示端口被占用
    except:
        return False

def find_available_port(start_port=5000, max_port=6000):
    """查找可用的端口"""
    for port in range(start_port, max_port + 1):
        if not check_port(port):
            return port
    return None

if __name__ == "__main__":
    port = find_available_port()
    if port:
        print(port)
    else:
        print("5000")  # 默认端口
'''

    with open('find_port.py', 'w', encoding='utf-8') as f:
        f.write(port_checker_content)

def create_launcher_script():
    """创建启动脚本"""
    launcher_content = '''@echo off
chcp 65001 >nul
title 图表服务器

echo 正在启动图表服务器...
echo.

:: 查找可用端口
for /f %%i in ('python find_port.py') do set AVAILABLE_PORT=%%i

echo 使用端口: %AVAILABLE_PORT%

:: 启动服务器
chart_server.exe --port %AVAILABLE_PORT%

pause
'''

    with open('launch_server.bat', 'w', encoding='utf-8') as f:
        f.write(launcher_content)

def main():
    """主函数"""
    print("图表服务器打包工具")
    print("=" * 50)
    
    # 检查PyInstaller
    if not check_pyinstaller():
        print("PyInstaller未安装，正在安装...")
        install_pyinstaller()
    
    # 创建必要的文件
    create_spec_file()
    create_port_checker()
    
    # 构建可执行文件
    if build_executable():
        create_launcher_script()
        
        # 创建分发目录
        dist_dir = "dist"
        if not os.path.exists(dist_dir):
            os.makedirs(dist_dir)
        
        # 复制必要文件到分发目录
        files_to_copy = [
            'chart_server.exe',
            'launch_server.bat',
            'find_port.py',
            'index.html',
            'styles',
            'scripts'
        ]
        
        for item in files_to_copy:
            if os.path.exists(item):
                if os.path.isdir(item):
                    shutil.copytree(item, os.path.join(dist_dir, item), dirs_exist_ok=True)
                else:
                    shutil.copy2(item, dist_dir)
        
        print("\\n打包完成！")
        print("可执行文件位置: dist/chart_server.exe")
        print("启动脚本: dist/launch_server.bat")
        print("\\n使用方法:")
        print("1. 将dist文件夹复制到目标电脑")
        print("2. 双击launch_server.bat启动服务器")
        print("3. 服务器会自动选择可用端口")
    else:
        print("打包失败，请检查错误信息")

if __name__ == "__main__":
    main()