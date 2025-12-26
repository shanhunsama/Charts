# ChartServer - Unreal Engine 图表服务器插件

一个为Unreal Engine设计的实时图表显示插件，通过内置的Python服务器提供Web图表功能。

## 🚀 功能特性

- **实时图表显示**: 在Unreal Engine中实时显示折线图、柱状图、饼图
- **无需外部依赖**: 内置Python环境，无需安装额外软件
- **自动端口管理**: 智能端口分配，避免端口冲突
- **RESTful API**: 提供完整的API接口用于数据更新和控制
- **跨平台支持**: 支持Windows系统

## 📋 系统要求

- **操作系统**: Windows 7/10/11 (64位)
- **Unreal Engine**: 4.27+ 或 5.0+
- **网络端口**: 默认使用8080-8090端口范围
- **防火墙**: 确保相关端口未被防火墙阻止

## ⚠️ 重要依赖

**本插件需要配合Unreal Engine插件市场中的WebUI插件使用！**

### WebUI插件要求

- **插件名称**: WebUI (或类似的内置浏览器插件)
- **功能**: 在Unreal Engine界面中嵌入Web浏览器组件
- **获取方式**: 从Unreal Engine插件市场下载安装

### 为什么需要WebUI插件？

ChartServer插件本身只提供后端图表数据服务，需要在UE界面中显示图表时，必须通过WebUI插件来嵌入浏览器组件，才能正确显示图表内容。

## 🛠️ 安装与使用

### 1. 安装依赖插件

1. 从Unreal Engine插件市场安装WebUI插件
2. 启用WebUI插件

### 2. 安装ChartServer插件

1. 将 `ChartServer` 文件夹复制到项目的 `Plugins/` 目录
2. 重新启动Unreal Engine
3. 在插件管理器中启用 `ChartServer` 插件

### 3. 启动图表服务器

在蓝图中调用 `Start Chart Server` 节点：

```cpp
// C++ 示例
UChartServerManager::StartChartServer();
```

### 4. 在界面中显示图表

使用WebUI插件创建一个浏览器组件，并加载图表服务器URL：

```cpp
// 示例：在UMG中显示图表
// 1. 创建一个WebBrowser组件
// 2. 设置URL为图表服务器地址（如：http://localhost:8080）
// 3. 调整组件大小以适应图表显示
```

### 5. 验证部署

1. 检查输出日志，确认服务器启动成功
2. 在浏览器中访问 `http://localhost:5000` 验证图表显示
3. 服务器会自动选择可用端口（8080, 8081, 8082...）

## 📊 API 接口

服务器提供以下RESTful API接口：

### 获取服务器状态

```http
GET /api/status
```

### 获取当前配置

```http
GET /api/config
```

### 更新图表数据

```http
POST /api/update
Content-Type: application/json

{
    "values": [65, 59, 80, 81, 56, 55],
    "labels": ["1月", "2月", "3月", "4月", "5月", "6月"]
}
```

### 切换图表类型

```http
POST /api/switch
Content-Type: application/json

{
    "type": "line"  // line, bar, pie
}
```

### 生成随机数据

```http
POST /api/random
```

### 关闭服务器

```http
POST /api/shutdown
```

## 🔧 故障排除

### WebUI插件问题

- **问题**: 图表无法在UE界面中显示
- **解决**: 确保已正确安装并启用WebUI插件，浏览器组件URL设置正确

### 端口占用问题

如果默认端口被占用，插件会自动尝试其他端口（8081, 8082...）

### 可执行文件缺失

确保 `chart_server.exe` 文件存在于正确路径：
`Plugins/ChartServer/Binaries/Win64/chart_server.exe`

### 权限问题

如果遇到权限错误，以管理员身份运行Unreal Engine

### 防火墙阻止

确保Windows防火墙允许 `chart_server.exe` 的网络访问

## 📁 项目结构

ChartServer/ ├── Binaries/ # 编译后的可执行文件 │ └── Win64/ │ ├── chart_server.exe │ └── chart_server_info.ini ├── Script/ # Python源代码 │ ├── app.py # 主服务器应用 │ ├── build_exe.py # 打包脚本 │ ├── requirements.txt # Python依赖 │ ├── scripts/ # 前端JavaScript │ └── styles/ # 前端样式表 ├── Source/ # C++ 插件源代码 │ └── ChartServer/ │ ├── ChartServer.h │ └── ChartServerManager.h └── Content/ # UE资源文件

## 🎯 开发指南

### 重新构建可执行文件

如果需要修改Python代码，可以重新构建可执行文件：

```bash
cd Script/
python build_exe.py
```

### 自定义图表样式

修改 `Script/styles/chart.css` 文件来自定义图表外观。

### 添加新的图表类型

在 `Script/app.py` 中的 `switch_chart` 函数添加新的图表类型支持。

## 📄 许可证

## 🤝 贡献

欢迎提交Issue和Pull Request来改进这个项目。

## 📞 支持

如有问题，请通过以下方式联系：

- GitHub Issues: [项目地址](https://github.com/shanhunsama)
- 邮箱: [2509520041@qq.com]

---

**注意**: 首次使用前请确保防火墙允许程序运行，并检查端口8080-8090是否可用。
