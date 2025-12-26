// data_list.js - 数据列表页面JavaScript逻辑

// 全局数据存储
let currentData = {};
let nameMapping = {}; // 存储名字1到名字2的映射
let selectedDataItem = null;

// 初始化函数
function init() {
    setupUEConnection();
    // 初始加载示例数据
    loadSampleData();
}

// 设置UE连接
function setupUEConnection() {
    const ueStatus = document.getElementById('ueStatus');
    if (ueStatus) {
        ueStatus.style.display = 'block';
        updateUEStatus('未连接', '-');
    }
    
    if (typeof ue !== 'undefined' && typeof ue.interface !== 'undefined') {
        console.log('UE接口已连接');
        updateUEStatus('已连接', new Date().toLocaleTimeString());
    }
}

// 更新UE状态
function updateUEStatus(status, lastUpdate) {
    const statusElement = document.getElementById('ueConnectionStatus');
    const timeElement = document.getElementById('lastUpdateTime');
    
    if (statusElement) statusElement.textContent = status;
    if (timeElement) timeElement.textContent = lastUpdate;
}

// 修改示例数据，添加非数值类型
function loadSampleData() {
    // 示例数据 - 模拟UE发送的两个映射
    const nameToDisplayMap = {
        "temp_sensor_001": "温度传感器",
        "humidity_sensor_001": "湿度传感器", 
        "pressure_sensor_001": "压力传感器",
        "light_sensor_001": "光照强度",
        "wind_sensor_001": "风速",
        "voltage_sensor_001": "电压",
        "current_sensor_001": "电流",
        "power_sensor_001": "功率",
        "device_status": "设备状态",
        "last_update": "最后更新时间",
        "location": "设备位置"
    };
    
    const nameToDataMap = {
        "temp_sensor_001": 25.6,
        "humidity_sensor_001": 65.2,
        "pressure_sensor_001": 1013.2,
        "light_sensor_001": 850,
        "wind_sensor_001": 3.2,
        "voltage_sensor_001": 12.5,
        "current_sensor_001": 2.3,
        "power_sensor_001": 28.8,
        "device_status": "运行中",
        "last_update": "2024-01-15 14:30:25",
        "location": "实验室A区"
    };
    
    updateDataTable(nameToDisplayMap, nameToDataMap);
    
    // 在控制台输出测试数据，方便调试
    console.log("测试数据 - 名字映射:", nameToDisplayMap);
    console.log("测试数据 - 数据映射:", nameToDataMap);
}

// 检测值是否为可图表化的数值类型（排除时间戳）
function isChartableValue(value) {
    if (value === null || value === undefined) return false;
    
    // 检查是否为数值类型
    if (typeof value === 'number') {
        // 检测是否为时间戳（通常时间戳是很大的数字）
        const currentTimestamp = Date.now();
        const oneYearInMs = 365 * 24 * 60 * 60 * 1000; // 一年的毫秒数
        
        // 如果数值接近当前时间戳（在一年范围内），则认为是时间戳
        if (Math.abs(value - currentTimestamp) < oneYearInMs) {
            return false; // 时间戳不可图表化
        }
        
        // 如果数值非常大（可能是秒级时间戳）
        if (value > 1000000000 && value < 2000000000) {
            return false; // 秒级时间戳不可图表化
        }
        
        return true; // 其他数值可图表化
    }
    
    // 检查是否为可转换为数值的字符串
    if (typeof value === 'string') {
        // 尝试转换为数值
        const numValue = Number(value);
        if (isNaN(numValue) || !isFinite(numValue)) {
            return false; // 无法转换为有效数值
        }
        
        // 检测字符串格式的时间戳
        const currentTimestamp = Date.now();
        const oneYearInMs = 365 * 24 * 60 * 60 * 1000;
        
        // 如果转换后的数值接近当前时间戳
        if (Math.abs(numValue - currentTimestamp) < oneYearInMs) {
            return false; // 时间戳不可图表化
        }
        
        // 如果数值非常大（可能是秒级时间戳）
        if (numValue > 1000000000 && numValue < 2000000000) {
            return false; // 秒级时间戳不可图表化
        }
        
        return true; // 其他可转换为数值的字符串可图表化
    }
    
    // 其他类型（布尔值、对象等）不可图表化
    return false;
}

// 检测是否为时间戳
function isTimestamp(value) {
    if (value === null || value === undefined) return false;
    
    const currentTimestamp = Date.now();
    const oneYearInMs = 365 * 24 * 60 * 60 * 1000;
    
    if (typeof value === 'number') {
        // 检测毫秒级时间戳
        if (Math.abs(value - currentTimestamp) < oneYearInMs) {
            return true;
        }
        // 检测秒级时间戳
        if (value > 1000000000 && value < 2000000000) {
            return true;
        }
    }
    
    if (typeof value === 'string') {
        const numValue = Number(value);
        if (!isNaN(numValue) && isFinite(numValue)) {
            // 检测毫秒级时间戳
            if (Math.abs(numValue - currentTimestamp) < oneYearInMs) {
                return true;
            }
            // 检测秒级时间戳
            if (numValue > 1000000000 && numValue < 2000000000) {
                return true;
            }
        }
    }
    
    return false;
}

// 更新数据表格 - 处理两个映射数据
function updateDataTable(nameToDisplayMap, nameToDataMap) {
    // 存储映射关系
    nameMapping = nameToDisplayMap;
    currentData = nameToDataMap;
    
    const tableBody = document.getElementById('dataTableBody');
    tableBody.innerHTML = '';

    // 遍历名字1到数据的映射
    Object.entries(nameToDataMap).forEach(([name1, value]) => {
        // 获取对应的显示名字（名字2）
        const displayName = nameToDisplayMap[name1] || name1; // 如果没有映射，使用名字1
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${displayName}</td>
            <td>${value}</td>
            <td>
                <button class="select-btn" onclick="selectDataItem('${name1}')">
                    查看历史
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// 选择数据项 - 显示该行的所有数据
function selectDataItem(name1) {
    selectedDataItem = name1;
    const displayName = nameMapping[name1] || name1;
    const currentValue = currentData[name1] || 'N/A';
    
    console.log('选择数据项:', name1, '显示名称:', displayName, '当前值:', currentValue);
    
    // 构建详细数据信息
    const dataDetails = `
数据项详细信息:
- 内部变量名: ${name1}
- 显示名称: ${displayName}
- 当前值: ${currentValue}
- 数据映射状态: ${nameMapping[name1] ? '已映射' : '未映射'}
    `;
    
    // 显示详细数据信息
    alert(`已选择数据项: ${displayName}\n\n${dataDetails}\n\nUE将发送该数据的历史值到图表页面`);
    
    // 在控制台也输出详细信息
    console.log('数据项详细信息:', dataDetails);
    
    // 向UE发送选择事件（发送名字1）
    if (typeof ue5 === 'function') {
        ue5('DataItemSelected', name1);
        console.log('已向UE发送数据项选择事件:', name1);
    }
    
    // 更新状态
    updateUEStatus('已连接', new Date().toLocaleTimeString());
}

// 导航到图表页面
function goToChartPage() {
    window.location.href = 'history_chart.html';
}

// 刷新数据
function refreshData() {
    if (typeof ue5 === 'function') {
        ue5('RequestDataRefresh');
        console.log('已请求UE刷新数据');
    }
    updateUEStatus('已连接', new Date().toLocaleTimeString());
}

// UE调用此方法来更新数据 - 修改为接收两个映射
ue.interface.UpdateDataList = function(nameToDisplayMap, nameToDataMap) {
    console.log('收到UE数据更新 - 名字映射:', nameToDisplayMap, '数据映射:', nameToDataMap);
    
    try {
        // 解析JSON数据（如果UE发送的是字符串）
        const parsedNameMap = typeof nameToDisplayMap === 'string' ? JSON.parse(nameToDisplayMap) : nameToDisplayMap;
        const parsedDataMap = typeof nameToDataMap === 'string' ? JSON.parse(nameToDataMap) : nameToDataMap;
        
        updateDataTable(parsedNameMap, parsedDataMap);
        updateUEStatus('已连接', new Date().toLocaleTimeString());
        
        return { success: true, message: '数据列表更新成功' };
    } catch (error) {
        console.error('处理数据时发生错误:', error);
        return { success: false, message: '数据处理错误: ' + error.message };
    }
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', init);