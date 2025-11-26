// 图表交互功能类
class ChartInteraction {
    constructor(chartCore) {
        this.chartCore = chartCore;
        this.hoveredIndex = -1;
        this.selectedIndex = -1;
        this.isDragging = false;
        this.dragStartIndex = -1;
        
        this.bindEvents();
    }
    
    // 绑定交互事件
    bindEvents() {
        const canvas = this.chartCore.canvas;
        
        canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        canvas.addEventListener('click', (e) => this.handleClick(e));
        canvas.addEventListener('mouseleave', () => this.handleMouseLeave());
        
        canvas.style.cursor = 'pointer';
    }
    
    // 鼠标移动处理
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
        
        // 拖拽数据点
        if (this.isDragging && this.selectedIndex >= 0) {
            this.handleDataPointDrag(mouseX, mouseY);
        }
    }
    
    // 鼠标按下处理
    handleMouseDown(e) {
        const rect = this.chartCore.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        this.dragStartIndex = this.getDataIndexAtPosition(mouseX, mouseY);
        if (this.dragStartIndex >= 0) {
            this.isDragging = true;
            this.selectedIndex = this.dragStartIndex;
            this.chartCore.drawChart();
            this.drawInteractions();
        }
    }
    
    // 鼠标释放处理
    handleMouseUp(e) {
        if (this.isDragging) {
            this.isDragging = false;
            this.chartCore.drawChart();
            this.drawInteractions();
        }
    }
    
    // 点击处理
    handleClick(e) {
        const rect = this.chartCore.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const clickedIndex = this.getDataIndexAtPosition(mouseX, mouseY);
        if (clickedIndex >= 0) {
            this.selectedIndex = clickedIndex;
            this.showDataPointDetails(clickedIndex);
            this.chartCore.drawChart();
            this.drawInteractions();
        }
    }
    
    // 鼠标离开处理
    handleMouseLeave() {
        this.hoveredIndex = -1;
        this.chartCore.drawChart();
        this.drawInteractions();
    }
    
    // 获取鼠标位置对应的数据点索引
    getDataIndexAtPosition(x, y) {
        const padding = 80;
        const width = this.chartCore.canvas.width;
        const height = this.chartCore.canvas.height;
        const chartWidth = width - padding * 2;
        
        for (let i = 0; i < this.chartCore.data.length; i++) {
            const dataX = padding + (i / (this.chartCore.data.length - 1)) * chartWidth;
            const dataY = this.getDataPointY(i);
            
            // 计算距离
            const distance = Math.sqrt(Math.pow(x - dataX, 2) + Math.pow(y - dataY, 2));
            
            // 如果距离小于阈值，返回索引
            if (distance < 20) {
                return i;
            }
        }
        
        return -1;
    }
    
    // 获取数据点的Y坐标
    getDataPointY(index) {
        const padding = 80;
        const height = this.chartCore.canvas.height;
        const chartHeight = height - padding * 2;
        const maxValue = Math.max(...this.chartCore.data);
        const value = this.chartCore.data[index];
        
        return height - padding - (value / maxValue) * chartHeight;
    }
    
    // 拖拽数据点
    handleDataPointDrag(mouseX, mouseY) {
        const padding = 80;
        const height = this.chartCore.canvas.height;
        const chartHeight = height - padding * 2;
        const maxValue = Math.max(...this.chartCore.data);
        
        // 计算新的数值
        const newValue = Math.max(0, Math.min(100, 
            ((height - padding - mouseY) / chartHeight) * maxValue
        ));
        
        // 更新数据
        this.chartCore.data[this.selectedIndex] = Math.round(newValue);
        this.chartCore.updateStats();
        this.chartCore.drawChart();
        this.drawInteractions();
    }
    
    // 显示数据点详情
    showDataPointDetails(index) {
        const value = this.chartCore.data[index];
        const label = this.chartCore.labels[index];
        
        // 创建或更新工具提示
        let tooltip = document.getElementById('dataPointTooltip');
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.id = 'dataPointTooltip';
            tooltip.style.cssText = `
                position: fixed;
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 10px;
                border-radius: 5px;
                font-size: 14px;
                z-index: 1000;
                pointer-events: none;
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.2);
            `;
            document.body.appendChild(tooltip);
        }
        
        tooltip.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 5px;">${label}</div>
            <div>数值: ${value}</div>
            <div style="font-size: 12px; opacity: 0.8;">点击并拖拽可调整数值</div>
        `;
        
        // 获取数据点位置
        const padding = 80;
        const width = this.chartCore.canvas.width;
        const chartWidth = width - padding * 2;
        const dataX = padding + (index / (this.chartCore.data.length - 1)) * chartWidth;
        const dataY = this.getDataPointY(index);
        
        // 定位工具提示
        const rect = this.chartCore.canvas.getBoundingClientRect();
        tooltip.style.left = (rect.left + dataX + 10) + 'px';
        tooltip.style.top = (rect.top + dataY - 60) + 'px';
        
        // 3秒后自动隐藏
        setTimeout(() => {
            if (tooltip) tooltip.style.display = 'none';
        }, 3000);
    }
    
    // 绘制交互效果
    drawInteractions() {
        if (this.chartCore.chartType !== 'pie') {
            this.drawHoverEffects();
            this.drawSelectionEffects();
        }
    }
    
    // 绘制悬停效果
    drawHoverEffects() {
        if (this.hoveredIndex >= 0) {
            const ctx = this.chartCore.ctx;
            const width = this.chartCore.canvas.width;
            const height = this.chartCore.canvas.height;
            const padding = 80;
            const chartWidth = width - padding * 2;
            const chartHeight = height - padding * 2;
            const maxValue = Math.max(...this.chartCore.data);
            
            const x = padding + (this.hoveredIndex / (this.chartCore.data.length - 1)) * chartWidth;
            const y = height - padding - (this.chartCore.data[this.hoveredIndex] / maxValue) * chartHeight;
            
            // 绘制悬停圆圈
            ctx.beginPath();
            ctx.arc(x, y, 12, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // 绘制垂直参考线
            ctx.beginPath();
            ctx.moveTo(x, padding);
            ctx.lineTo(x, height - padding);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 5]);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }
    
    // 绘制选中效果
    drawSelectionEffects() {
        if (this.selectedIndex >= 0) {
            const ctx = this.chartCore.ctx;
            const width = this.chartCore.canvas.width;
            const height = this.chartCore.canvas.height;
            const padding = 80;
            const chartWidth = width - padding * 2;
            const chartHeight = height - padding * 2;
            const maxValue = Math.max(...this.chartCore.data);
            
            const x = padding + (this.selectedIndex / (this.chartCore.data.length - 1)) * chartWidth;
            const y = height - padding - (this.chartCore.data[this.selectedIndex] / maxValue) * chartHeight;
            
            // 绘制选中圆圈
            ctx.beginPath();
            ctx.arc(x, y, 15, 0, Math.PI * 2);
            ctx.strokeStyle = '#ff6b6b';
            ctx.lineWidth = 3;
            ctx.stroke();
            
            // 绘制拖拽指示器
            if (this.isDragging) {
                ctx.beginPath();
                ctx.moveTo(x, y - 20);
                ctx.lineTo(x, y - 40);
                ctx.lineTo(x + 10, y - 35);
                ctx.closePath();
                ctx.fillStyle = '#ff6b6b';
                ctx.fill();
                
                ctx.fillStyle = '#ff6b6b';
                ctx.font = 'bold 14px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('拖拽调整', x, y - 50);
            }
        }
    }
}