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
## 部署要求

- **操作系统**: Windows 7/10/11 (64位)
- **无需Python环境**: 可执行文件已包含所有依赖
- **网络端口**: 默认使用8080-8090端口范围
- **防火墙**: 确保相关端口未被防火墙阻止

## 验证部署

1. 在Unreal Engine中启用ChartServer插件
2. 在蓝图中调用 `Start Chart Server` 节点
3. 检查输出日志，确认服务器启动成功
4. 在浏览器中访问 `http://localhost:8080` 验证图表显示

## 故障排除

### 端口占用
如果默认端口被占用，插件会自动尝试其他端口（8081, 8082...）

### 可执行文件缺失
确保 `chart_server.exe` 文件存在于正确路径：
`Plugins/ChartServer/Binaries/Win64/chart_server.exe`

### 权限问题
如果遇到权限错误，以管理员身份运行Unreal Engine
