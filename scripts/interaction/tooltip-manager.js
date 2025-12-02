// 工具提示管理器 - 统一管理所有图表类型的工具提示
class TooltipManager {
    constructor() {
        this.mainTooltip = null;
        this.dataPointTooltip = null;
        this.dragStatusIndicator = null;
        this.init();
    }
    
    init() {
        this.createMainTooltip();
        this.createDataPointTooltip();
        this.createDragStatusIndicator();
    }
    
    // 创建主工具提示（用于按钮等界面元素）
    createMainTooltip() {
        this.mainTooltip = document.createElement('div');
        this.mainTooltip.id = 'mainTooltip';
        this.mainTooltip.style.cssText = `
            position: fixed;
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 12px;
            z-index: 1000;
            pointer-events: none;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.3);
            opacity: 0;
            transition: opacity 0.2s ease;
            max-width: 200px;
            text-align: center;
            font-family: Arial, sans-serif;
        `;
        document.body.appendChild(this.mainTooltip);
    }
    
    // 创建数据点工具提示（用于图表数据点）
    createDataPointTooltip() {
        this.dataPointTooltip = document.createElement('div');
        this.dataPointTooltip.id = 'dataPointTooltip';
        this.dataPointTooltip.style.cssText = `
            position: fixed;
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            font-size: 14px;
            z-index: 1001;
            pointer-events: none;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.3);
            opacity: 0;
            transition: opacity 0.2s ease;
            max-width: 250px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            font-family: Arial, sans-serif;
        `;
        document.body.appendChild(this.dataPointTooltip);
    }
    
    // 创建拖拽状态指示器
    createDragStatusIndicator() {
        this.dragStatusIndicator = document.createElement('div');
        this.dragStatusIndicator.id = 'dragStatusIndicator';
        this.dragStatusIndicator.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 8px 12px;
            border-radius: 20px;
            font-size: 12px;
            z-index: 999;
            pointer-events: none;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            opacity: 0;
            transition: opacity 0.3s ease;
            display: flex;
            align-items: center;
            gap: 8px;
            font-family: Arial, sans-serif;
        `;
        
        const icon = document.createElement('div');
        icon.innerHTML = '↔️';
        icon.style.fontSize = '14px';
        
        const text = document.createElement('span');
        text.textContent = '拖拽已启用';
        
        this.dragStatusIndicator.appendChild(icon);
        this.dragStatusIndicator.appendChild(text);
        document.body.appendChild(this.dragStatusIndicator);
    }
    
    // 显示主工具提示
    showMainTooltip(content, x, y) {
        if (!this.mainTooltip) return;
        
        this.mainTooltip.innerHTML = content;
        this.mainTooltip.style.left = x + 'px';
        this.mainTooltip.style.top = y + 'px';
        this.mainTooltip.style.opacity = '1';
    }
    
    // 隐藏主工具提示
    hideMainTooltip() {
        if (this.mainTooltip) {
            this.mainTooltip.style.opacity = '0';
        }
    }
    
    // 显示数据点工具提示
    showDataPointTooltip(content, x, y, chartType = 'line') {
        if (!this.dataPointTooltip) return;
        
        // 根据图表类型调整样式
        this.dataPointTooltip.innerHTML = content;
        this.dataPointTooltip.style.left = x + 'px';
        this.dataPointTooltip.style.top = y + 'px';
        this.dataPointTooltip.style.opacity = '1';
        
        // 添加特定图表类型的样式类
        this.dataPointTooltip.className = `tooltip-${chartType}`;
    }
    
    // 隐藏数据点工具提示
    hideDataPointTooltip() {
        if (this.dataPointTooltip) {
            this.dataPointTooltip.style.opacity = '0';
            this.dataPointTooltip.className = '';
        }
    }
    
    // 显示拖拽状态指示器
    showDragStatus(enabled) {
        if (!this.dragStatusIndicator) return;
        
        const text = this.dragStatusIndicator.querySelector('span');
        const icon = this.dragStatusIndicator.querySelector('div');
        
        if (enabled) {
            text.textContent = '拖拽已启用';
            icon.innerHTML = '↔️';
            this.dragStatusIndicator.style.background = 'rgba(76, 175, 80, 0.9)';
        } else {
            text.textContent = '拖拽已禁用';
            icon.innerHTML = '🔒';
            this.dragStatusIndicator.style.background = 'rgba(244, 67, 54, 0.9)';
        }
        
        this.dragStatusIndicator.style.opacity = '1';
        
        // 3秒后自动隐藏
        setTimeout(() => {
            this.hideDragStatus();
        }, 3000);
    }
    
    // 隐藏拖拽状态指示器
    hideDragStatus() {
        if (this.dragStatusIndicator) {
            this.dragStatusIndicator.style.opacity = '0';
        }
    }
    
    // 为折线图生成数据点工具提示内容
    generateLineTooltipContent(label, value, index, total) {
        const percentage = ((value / Math.max(...total)) * 100).toFixed(1);
        return `
            <div style="font-weight: bold; margin-bottom: 6px; color: #4CAF50;">${label}</div>
            <div style="margin-bottom: 4px;">数值: <strong>${value}</strong></div>
            <div style="margin-bottom: 4px;">占比: <strong>${percentage}%</strong></div>
        `;
    }
    
    // 为柱状图生成数据点工具提示内容
    generateBarTooltipContent(label, value, index, total) {
        const percentage = ((value / Math.max(...total)) * 100).toFixed(1);
        return `
            <div style="font-weight: bold; margin-bottom: 6px; color: #2196F3;">${label}</div>
            <div style="margin-bottom: 4px;">数值: <strong>${value}</strong></div>
            <div style="margin-bottom: 4px;">占比: <strong>${percentage}%</strong></div>
        `;
    }
    
    // 为饼图生成数据点工具提示内容
    generatePieTooltipContent(label, value, index, total) {
        const sum = total.reduce((a, b) => a + b, 0);
        const percentage = ((value / sum) * 100).toFixed(1);
        return `
            <div style="font-weight: bold; margin-bottom: 6px; color: #FF9800;">${label}</div>
            <div style="margin-bottom: 4px;">数值: <strong>${value}</strong></div>
            <div style="margin-bottom: 4px;">占比: <strong>${percentage}%</strong></div>
        `;
    }
    
    // 清理所有工具提示
    cleanup() {
        if (this.mainTooltip && this.mainTooltip.parentNode) {
            this.mainTooltip.parentNode.removeChild(this.mainTooltip);
        }
        if (this.dataPointTooltip && this.dataPointTooltip.parentNode) {
            this.dataPointTooltip.parentNode.removeChild(this.dataPointTooltip);
        }
        if (this.dragStatusIndicator && this.dragStatusIndicator.parentNode) {
            this.dragStatusIndicator.parentNode.removeChild(this.dragStatusIndicator);
        }
    }
}

// 导出工具提示管理器
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TooltipManager;
}

// 导出工具提示管理器
window.TooltipManager = TooltipManager;