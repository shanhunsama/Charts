// 基础交互类 - 提供通用交互功能
class BaseInteraction {
    constructor(chartCore) {
        this.chartCore = chartCore;
        this.hoveredIndex = -1;
    }
    
    // 绑定基础事件 - 只保留基本的事件监听
    bindBaseEvents() {
        const canvas = this.chartCore.canvas;
        
        // 只保留基本的鼠标事件
        canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        canvas.addEventListener('click', (e) => this.handleClick(e));
        canvas.addEventListener('mouseleave', () => this.handleMouseLeave());
    }
    
    // 鼠标移动处理 - 只处理悬停效果
    handleMouseMove(e) {
        const rect = this.chartCore.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const oldHoveredIndex = this.hoveredIndex;
        this.hoveredIndex = this.getDataIndexAtPosition(mouseX, mouseY);
        
        // 如果悬停状态改变，重绘图表
        if (oldHoveredIndex !== this.hoveredIndex) {
            this.chartCore.drawChart();
            this.drawInteractions();
        }
    }
    
    // 点击处理 - 只显示工具提示，不设置选中状态
    handleClick(e) {
        const rect = this.chartCore.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const clickedIndex = this.getDataIndexAtPosition(mouseX, mouseY);
        if (clickedIndex >= 0) {
            this.showDataPointDetails(clickedIndex);
        }
    }
    
    // 鼠标离开处理
    handleMouseLeave() {
        this.hoveredIndex = -1;
        this.chartCore.drawChart();
        this.drawInteractions();
        
        // 隐藏工具提示
        const tooltip = document.getElementById('dataPointTooltip');
        if (tooltip) {
            tooltip.style.display = 'none';
        }
    }
    
    // 抽象方法 - 由子类实现
    getDataIndexAtPosition(x, y) {
        throw new Error('子类必须实现 getDataIndexAtPosition 方法');
    }
    
    drawInteractions() {
        throw new Error('子类必须实现 drawInteractions 方法');
    }
    
    showDataPointDetails(index) {
        throw new Error('子类必须实现 showDataPointDetails 方法');
    }
}
// 导出基础交互类
window.BaseInteraction = BaseInteraction;