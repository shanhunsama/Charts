#!/usr/bin/env python3
"""
ChartServer插件本地虚拟环境打包脚本
在Script目录下创建虚拟环境进行打包
"""

import os
import sys
import subprocess
import shutil
import venv
from pathlib import Path

class LocalVenvBuilder:
    def __init__(self):
        self.script_dir = Path(__file__).parent
        self.venv_dir = self.script_dir / ".venv"  # 虚拟环境在Script目录下
        self.requirements_file = self.script_dir / "requirements.txt"
        
    def create_virtualenv(self):
        """在Script目录下创建虚拟环境"""
        if self.venv_dir.exists():
            print("✓ Script目录下的虚拟环境已存在")
            return True
            
        print("正在Script目录下创建虚拟环境...")
        try:
            venv.create(self.venv_dir, with_pip=True)
            print("✓ 虚拟环境创建成功")
            return True
        except Exception as e:
            print(f"✗ 虚拟环境创建失败: {e}")
            return False
    
    def get_venv_python(self):
        """获取虚拟环境中的Python路径"""
        if sys.platform == "win32":
            return self.venv_dir / "Scripts" / "python.exe"
        else:
            return self.venv_dir / "bin" / "python"
    
    def get_venv_pip(self):
        """获取虚拟环境中的pip路径"""
        if sys.platform == "win32":
            return self.venv_dir / "Scripts" / "pip.exe"
        else:
            return self.venv_dir / "bin" / "pip"
    
    def install_dependencies(self):
        """在虚拟环境中安装依赖"""
        venv_pip = self.get_venv_pip()
        
        if not venv_pip.exists():
            print("✗ 虚拟环境pip未找到")
            return False
        
        print("正在安装依赖包...")
        try:
            subprocess.check_call([
                str(venv_pip), "install", 
                "pyinstaller", 
                "-r", str(self.requirements_file)
            ])
            print("✓ 依赖安装成功")
            return True
        except subprocess.CalledProcessError as e:
            print(f"✗ 依赖安装失败: {e}")
            return False
    
    def create_spec_file(self):
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
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
'''
        
        spec_file = self.script_dir / "chart_server.spec"
        with open(spec_file, 'w', encoding='utf-8') as f:
            f.write(spec_content)
        print("✓ 已创建spec文件")
    
    def build_executable(self):
        """在虚拟环境中构建可执行文件"""
        venv_python = self.get_venv_python()
        
        print("正在构建可执行文件...")
        
        try:
            result = subprocess.run([
                str(venv_python), "-m", "PyInstaller",
                str(self.script_dir / "chart_server.spec"),
                "--clean",
                "--noconfirm"
            ], capture_output=True, text=True, cwd=self.script_dir)
            
            if result.returncode == 0:
                print("✓ 可执行文件构建成功")
                return True
            else:
                print(f"✗ 构建失败: {result.stderr}")
                return False
        except Exception as e:
            print(f"✗ 构建过程出错: {e}")
            return False
    
    def copy_to_target(self):
        """复制可执行文件到目标位置"""
        dist_dir = self.script_dir / "dist"
        target_dir = self.script_dir.parent / "Binaries" / "Win64"
        
        # 创建目标目录
        target_dir.mkdir(parents=True, exist_ok=True)
        
        # 复制可执行文件
        exe_file = dist_dir / "chart_server.exe"
        if exe_file.exists():
            shutil.copy2(exe_file, target_dir / "chart_server.exe")
            print(f"✓ 已复制可执行文件到: {target_dir / 'chart_server.exe'}")
            
            # 复制依赖文件
            for data_file in ['index.html', 'scripts/chart.js', 'scripts/chart.umd.min.js', 'styles/chart.css']:
                src_path = self.script_dir / data_file
                if src_path.exists():
                    dst_path = target_dir / data_file
                    dst_path.parent.mkdir(parents=True, exist_ok=True)
                    shutil.copy2(src_path, dst_path)
                    print(f"✓ 已复制资源文件: {data_file}")
            
            return True
        else:
            print("✗ 可执行文件未找到")
            return False
    
    def cleanup(self):
        """清理临时文件"""
        temp_dirs = ['build', 'dist', '__pycache__']
        
        for temp_dir in temp_dirs:
            temp_path = self.script_dir / temp_dir
            if temp_path.exists():
                shutil.rmtree(temp_path)
                print(f"✓ 已清理目录: {temp_dir}")
        
        spec_file = self.script_dir / "chart_server.spec"
        if spec_file.exists():
            spec_file.unlink()
            print("✓ 已清理spec文件")
    
    def run(self):
        """运行完整的打包流程"""
        print("=" * 60)
        print("ChartServer插件本地虚拟环境打包工具")
        print(f"虚拟环境位置: {self.venv_dir}")
        print("=" * 60)
        
        # 检查当前目录
        if not (self.script_dir / "app.py").exists():
            print("错误：请在Script目录下运行此脚本")
            return 1
        
        # 创建虚拟环境
        if not self.create_virtualenv():
            return 1
        
        # 安装依赖
        if not self.install_dependencies():
            return 1
        
        # 创建spec文件
        self.create_spec_file()
        
        # 构建可执行文件
        if not self.build_executable():
            return 1
        
        # 复制到目标位置
        if not self.copy_to_target():
            return 1
        
        # 清理临时文件
        self.cleanup()
        
        print("=" * 60)
        print("✓ 打包完成！")
        print(f"虚拟环境位置: {self.venv_dir}")
        print(f"可执行文件位置: {self.script_dir.parent / 'Binaries/Win64/chart_server.exe'}")
        print("=" * 60)
        return 0

def main():
    builder = LocalVenvBuilder()
    sys.exit(builder.run())

if __name__ == "__main__":
    main()