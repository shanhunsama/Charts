# ChartServer插件虚拟环境部署说明

## 虚拟环境优势

- **环境隔离**: 依赖包安装在项目虚拟环境中，不影响系统环境
- **版本控制**: 可以精确控制Python和依赖包的版本
- **易于维护**: 可以轻松删除和重建虚拟环境
- **团队协作**: 确保团队成员使用相同的环境配置

## 打包步骤

### 方法一：使用批处理文件（推荐）
```bash
cd Plugins/ChartServer/Script
build.bat
```

### 方法二：使用项目管理工具
```bash
# 在项目根目录执行
python manage_venv.py create    # 创建虚拟环境
python manage_venv.py install   # 安装依赖
python manage_venv.py build     # 构建可执行文件
```

### 方法三：手动操作
```bash
# 1. 创建虚拟环境
python -m venv .venv

# 2. 激活虚拟环境（Windows）
.venv\Scripts\activate

# 3. 安装依赖
pip install -r Plugins/ChartServer/Script/requirements.txt
pip install pyinstaller

# 4. 构建可执行文件
python Plugins/ChartServer/Script/venv_build.py
```

## 文件结构

打包完成后，项目结构如下：