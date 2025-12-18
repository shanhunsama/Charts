# ChartServer插件部署说明

## 打包步骤

### 方法一：使用批处理文件（推荐）
1. 打开命令提示符
2. 进入 `Plugins/ChartServer/Script` 目录
3. 运行 `build.bat`
4. 等待打包完成

### 方法二：手动打包
1. 安装Python 3.7+
2. 安装依赖：`pip install -r requirements.txt`
3. 运行打包脚本：`python build_exe.py`

## 文件结构

打包完成后，将生成以下文件结构：