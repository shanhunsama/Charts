#!/usr/bin/env python3
"""
ChartServer插件可执行文件打包脚本
使用PyInstaller将Python Flask应用打包成独立的可执行文件
"""

import os
import sys
import subprocess
import shutil
from pathlib import Path

def check_pyinstaller():
    """检查PyInstaller是否已安装"""
    try:
        import PyInstaller
        print("✓ PyInstaller已安装")
        return True
    except ImportError:
        print("✗ PyInstaller未安装，正在安装...")
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", "pyinstaller"])
            print("✓ PyInstaller安装成功")
            return True
        except subprocess.CalledProcessError:
            print("✗ PyInstaller安装失败")
            return False

def create_spec_file():
    """创建PyInstaller spec文件"""
    spec_content = '''
# -*- mode: python ; coding: utf-8 -*-

block_cipher = None

a = Analysis(
    ['app.py'],
    pathex=[],
    binaries=[],
    datas=[
        ('index.html', '.'),
        ('scripts/chart.js', 'scripts'),
        ('scripts/chart.umd.min.js', 'scripts'),
        ('styles/chart.css', 'styles')
    ],
    hiddenimports=['flask', 'werkzeug', 'requests'],
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
    console=False,  # 设置为False以隐藏控制台窗口
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
'''
    
    with open('chart_server.spec', 'w', encoding='utf-8') as f:
        f.write(spec_content)
    print("✓ 已创建spec文件")

def build_executable():
    """构建可执行文件"""
    print("开始构建可执行文件...")
    
    # 使用spec文件构建
    result = subprocess.run([
        sys.executable, "-m", "PyInstaller",
        "chart_server.spec",
        "--clean",
        "--noconfirm"
    ], capture_output=True, text=True)
    
    if result.returncode == 0:
        print("✓ 可执行文件构建成功")
        return True
    else:
        print(f"✗ 构建失败: {result.stderr}")
        return False

def copy_to_target():
    """复制可执行文件到目标位置"""
    dist_dir = Path("dist")
    target_dir = Path("../../Binaries/Win64")
    
    # 创建目标目录
    target_dir.mkdir(parents=True, exist_ok=True)
    
    # 复制可执行文件
    exe_file = dist_dir / "chart_server.exe"
    if exe_file.exists():
        shutil.copy2(exe_file, target_dir / "chart_server.exe")
        print(f"✓ 已复制可执行文件到: {target_dir / 'chart_server.exe'}")
        
        # 复制依赖文件
        for data_file in ['index.html', 'scripts/chart.js', 'scripts/chart.umd.min.js', 'styles/chart.css']:
            src_path = Path(data_file)
            if src_path.exists():
                dst_path = target_dir / data_file
                dst_path.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(src_path, dst_path)
                print(f"✓ 已复制资源文件: {data_file}")
        
        return True
    else:
        print("✗ 可执行文件未找到")
        return False

def cleanup():
    """清理临时文件"""
    for temp_dir in ['build', 'dist', '__pycache__']:
        if Path(temp_dir).exists():
            shutil.rmtree(temp_dir)
            print(f"✓ 已清理目录: {temp_dir}")
    
    spec_file = Path("chart_server.spec")
    if spec_file.exists():
        spec_file.unlink()
        print("✓ 已清理spec文件")

def main():
    """主函数"""
    print("=" * 50)
    print("ChartServer插件可执行文件打包工具")
    print("=" * 50)
    
    # 检查当前目录
    if not Path("app.py").exists():
        print("错误：请在Script目录下运行此脚本")
        return 1
    
    # 检查依赖
    if not check_pyinstaller():
        return 1
    
    # 创建spec文件
    create_spec_file()
    
    # 构建可执行文件
    if not build_executable():
        return 1
    
    # 复制到目标位置
    if not copy_to_target():
        return 1
    
    # 清理临时文件
    cleanup()
    
    print("=" * 50)
    print("✓ 打包完成！")
    print("可执行文件位置: Plugins/ChartServer/Binaries/Win64/chart_server.exe")
    print("=" * 50)
    return 0

if __name__ == "__main__":
    sys.exit(main())