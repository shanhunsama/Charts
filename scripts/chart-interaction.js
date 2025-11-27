// 图表交互功能类
class ChartInteraction {
    constructor(chartCore) {
        this.chartCore = chartCore;
        this.hoveredIndex = -1;
        this.selectedIndex = -1;
        this.isDragging = false;
        this.dragStartIndex = -1;
        this.dragEnabled = true; // 默认启用拖拽功能
        
        this.bindEvents();
        this.loadConfig(); // 加载配置
    }
    
    // 加载配置
    async loadConfig() {
        try {
            const response = await fetch('/api/config');
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    this.dragEnabled = data.config.drag_enabled;
                    this.updateDragState();
                }
            }
        } catch (error) {
            console.error('加载配置失败:', error);
        }
    }
    
    // 切换拖拽功能
    toggleDrag(enabled) {
        this.dragEnabled = enabled;
        this.updateDragState();
        
        // 更新页面拖拽状态类
        if (enabled) {
            document.body.classList.remove('drag-disabled');
        } else {
            document.body.classList.add('drag-disabled');
        }
        
        // 保存配置到后端
        this.saveDragConfig();
    }
    
    // 更新拖拽状态
    updateDragState() {
        const canvas = this.chartCore.canvas;
        if (this.dragEnabled) {
            canvas.style.cursor = 'pointer';
            document.body.classList.remove('drag-disabled');
        } else {
            canvas.style.cursor = 'default';
            document.body.classList.add('drag-disabled');
            // 如果正在拖拽，立即停止
            if (this.isDragging) {
                this.isDragging = false;
                this.selectedIndex = -1;
                this.chartCore.drawChart();
                this.drawInteractions();
            }
        }
    }
    
    // 保存拖拽配置到后端
    async saveDragConfig() {
        try {
            await fetch('/api/config/drag', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    enabled: this.dragEnabled
                })
            });
        } catch (error) {
            console.error('保存拖拽配置失败:', error);
        }
    }
    
    // 绑定交互事件
    bindEvents() {
        const canvas = this.chartCore.canvas;
        
        canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        canvas.addEventListener('click', (e) => this.handleClick(e));
        canvas.addEventListener('mouseleave', () => this.handleMouseLeave());
        
        this.updateDragState(); // 初始化光标状态
    }
    
    // 鼠标按下处理
    handleMouseDown(e) {
        if (!this.dragEnabled) return;
        
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
    
    // 拖拽数据点
    handleDataPointDrag(mouseX, mouseY) {
        if (!this.dragEnabled || this.selectedIndex < 0) return;
        
        // 根据图表类型使用不同的拖拽逻辑
        switch(this.chartCore.chartType) {
            case 'line':
            case 'bar':
                this.handleBarLineDrag(mouseX, mouseY);
                break;
            case 'pie':
                this.handlePieDrag(mouseX, mouseY);
                break;
        }
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
        const width = this.chartCore.canvas.width;
        const height = this.chartCore.canvas.height;
        
        // 根据图表类型使用不同的检测方法
        switch(this.chartCore.chartType) {
            case 'line':
                return this.getLineChartDataIndex(x, y);
            case 'bar':
                return this.getBarChartDataIndex(x, y);
            case 'pie':
                return this.getPieChartDataIndex(x, y);
            default:
                return -1;
        }
    }
    
    // 折线图数据点索引检测
    getLineChartDataIndex(x, y) {
        const padding = 80;
        const width = this.chartCore.canvas.width;
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
    
    // 柱状图数据点索引检测
    getBarChartDataIndex(x, y) {
        const padding = 80;
        const width = this.chartCore.canvas.width;
        const height = this.chartCore.canvas.height;
        const chartWidth = width - padding * 2;
        const chartHeight = height - padding * 2;
        const maxValue = Math.max(...this.chartCore.data);
        const barWidth = chartWidth / this.chartCore.data.length * 0.6;
        
        for (let i = 0; i < this.chartCore.data.length; i++) {
            const barX = padding + (i / this.chartCore.data.length) * chartWidth + (chartWidth / this.chartCore.data.length - barWidth) / 2;
            const barHeight = (this.chartCore.data[i] / maxValue) * chartHeight;
            const barY = height - padding - barHeight;
            
            // 检查是否在柱状图范围内
            if (x >= barX && x <= barX + barWidth && y >= barY && y <= height - padding) {
                return i;
            }
        }
        
        return -1;
    }
    
    // 饼图数据点索引检测
    getPieChartDataIndex(x, y) {
        const centerX = this.chartCore.canvas.width / 2;
        const centerY = this.chartCore.canvas.height / 2;
        const radius = Math.min(this.chartCore.canvas.width, this.chartCore.canvas.height) * 0.3;
        const total = this.chartCore.data.reduce((sum, val) => sum + val, 0);
        
        // 计算鼠标相对于圆心的角度和距离
        const dx = x - centerX;
        const dy = y - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // 如果距离大于半径，不在饼图范围内
        if (distance > radius) {
            return -1;
        }
        
        // 计算角度（0到2π）
        let angle = Math.atan2(dy, dx);
        if (angle < 0) angle += 2 * Math.PI;
        
        // 遍历每个扇形，检查是否在对应角度范围内
        let startAngle = 0;
        for (let i = 0; i < this.chartCore.data.length; i++) {
            const sliceAngle = (this.chartCore.data[i] / total) * Math.PI * 2;
            
            if (angle >= startAngle && angle <= startAngle + sliceAngle) {
                return i;
            }
            
            startAngle += sliceAngle;
        }
        
        return -1;
    }
    
    // 获取数据点的Y坐标（仅用于折线图）
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
        if (this.selectedIndex < 0) return;
        
        // 根据图表类型使用不同的拖拽逻辑
        switch(this.chartCore.chartType) {
            case 'line':
            case 'bar':
                this.handleBarLineDrag(mouseX, mouseY);
                break;
            case 'pie':
                this.handlePieDrag(mouseX, mouseY);
                break;
        }
    }
    
    // 柱状图和折线图的拖拽处理
    handleBarLineDrag(mouseX, mouseY) {
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
    
    // 饼图的拖拽处理（调整扇形大小）
    handlePieDrag(mouseX, mouseY) {
        const centerX = this.chartCore.canvas.width / 2;
        const centerY = this.chartCore.canvas.height / 2;
        const radius = Math.min(this.chartCore.canvas.width, this.chartCore.canvas.height) * 0.3;
        const total = this.chartCore.data.reduce((sum, val) => sum + val, 0);
        
        // 计算鼠标相对于圆心的角度
        const dx = mouseX - centerX;
        const dy = mouseY - centerY;
        let angle = Math.atan2(dy, dx);
        if (angle < 0) angle += 2 * Math.PI;
        
        // 计算当前选中扇形的中点和角度范围
        let startAngle = 0;
        for (let i = 0; i < this.selectedIndex; i++) {
            startAngle += (this.chartCore.data[i] / total) * Math.PI * 2;
        }
        
        const sliceAngle = (this.chartCore.data[this.selectedIndex] / total) * Math.PI * 2;
        const midAngle = startAngle + sliceAngle / 2;
        
        // 根据鼠标角度调整扇形大小
        const angleDiff = angle - midAngle;
        const sensitivity = 0.1; // 调整灵敏度
        
        // 调整数值，确保不会出现负值
        let newValue = this.chartCore.data[this.selectedIndex] + angleDiff * sensitivity;
        newValue = Math.max(1, Math.min(100, newValue)); // 最小值为1，最大值为100
        
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
        const total = this.chartCore.data.reduce((sum, val) => sum + val, 0);
        const percentage = this.chartCore.chartType === 'pie' ? ((value / total) * 100).toFixed(1) + '%' : '';
        
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
            ${percentage ? `<div>占比: ${percentage}</div>` : ''}
            <div style="font-size: 12px; opacity: 0.8;">点击并拖拽可调整数值</div>
        `;
        
        // 获取数据点位置
        let tooltipX, tooltipY;
        
        switch(this.chartCore.chartType) {
            case 'line':
                const padding = 80;
                const width = this.chartCore.canvas.width;
                const chartWidth = width - padding * 2;
                const dataX = padding + (index / (this.chartCore.data.length - 1)) * chartWidth;
                const dataY = this.getDataPointY(index);
                tooltipX = dataX + 10;
                tooltipY = dataY - 60;
                break;
                
            case 'bar':
                const barPadding = 80;
                const barWidth = this.chartCore.canvas.width;
                const barHeight = this.chartCore.canvas.height;
                const barChartWidth = barWidth - barPadding * 2;
                const barChartHeight = barHeight - barPadding * 2;
                const barMaxValue = Math.max(...this.chartCore.data);
                const barBarWidth = barChartWidth / this.chartCore.data.length * 0.6;
                
                const barX = barPadding + (index / this.chartCore.data.length) * barChartWidth + (barChartWidth / this.chartCore.data.length - barBarWidth) / 2;
                const barValueHeight = (this.chartCore.data[index] / barMaxValue) * barChartHeight;
                const barY = barHeight - barPadding - barValueHeight;
                
                tooltipX = barX + barBarWidth / 2;
                tooltipY = barY - 40;
                break;
                
            case 'pie':
                const centerX = this.chartCore.canvas.width / 2;
                const centerY = this.chartCore.canvas.height / 2;
                const radius = Math.min(this.chartCore.canvas.width, this.chartCore.canvas.height) * 0.3;
                
                let startAngle = 0;
                for (let i = 0; i < index; i++) {
                    startAngle += (this.chartCore.data[i] / total) * Math.PI * 2;
                }
                const sliceAngle = (this.chartCore.data[index] / total) * Math.PI * 2;
                const midAngle = startAngle + sliceAngle / 2;
                
                const labelX = centerX + Math.cos(midAngle) * (radius + 40);
                const labelY = centerY + Math.sin(midAngle) * (radius + 40);
                
                tooltipX = labelX;
                tooltipY = labelY - 30;
                break;
        }
        
        // 定位工具提示
        const rect = this.chartCore.canvas.getBoundingClientRect();
        tooltip.style.left = (rect.left + tooltipX) + 'px';
        tooltip.style.top = (rect.top + tooltipY) + 'px';
        tooltip.style.display = 'block';
        
        // 3秒后自动隐藏
        setTimeout(() => {
            if (tooltip) tooltip.style.display = 'none';
        }, 3000);
    }
    
    // 绘制交互效果
    drawInteractions() {
        // 为所有图表类型绘制交互效果
        switch(this.chartCore.chartType) {
            case 'line':
            case 'bar':
                this.drawBarLineInteractions();
                break;
            case 'pie':
                this.drawPieInteractions();
                break;
        }
    }
    
    // 绘制柱状图和折线图的交互效果
    drawBarLineInteractions() {
        this.drawHoverEffects();
        this.drawSelectionEffects();
    }
    
    // 绘制饼图的交互效果
    drawPieInteractions() {
        this.drawPieHoverEffects();
        this.drawPieSelectionEffects();
    }
    
    // 绘制饼图悬停效果
    drawPieHoverEffects() {
        if (this.hoveredIndex >= 0) {
            const ctx = this.chartCore.ctx;
            const centerX = this.chartCore.canvas.width / 2;
            const centerY = this.chartCore.canvas.height / 2;
            const radius = Math.min(this.chartCore.canvas.width, this.chartCore.canvas.height) * 0.3;
            const total = this.chartCore.data.reduce((sum, val) => sum + val, 0);
            
            // 计算悬停扇形的角度范围
            let startAngle = 0;
            for (let i = 0; i < this.hoveredIndex; i++) {
                startAngle += (this.chartCore.data[i] / total) * Math.PI * 2;
            }
            const sliceAngle = (this.chartCore.data[this.hoveredIndex] / total) * Math.PI * 2;
            
            // 绘制悬停高亮效果（扇形外扩）
            const highlightRadius = radius + 10;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, highlightRadius, startAngle, startAngle + sliceAngle);
            ctx.closePath();
            
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.lineWidth = 3;
            ctx.stroke();
            
            // 绘制扇形边框高亮
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }
    
    // 绘制饼图选中效果
    drawPieSelectionEffects() {
        if (this.selectedIndex >= 0) {
            const ctx = this.chartCore.ctx;
            const centerX = this.chartCore.canvas.width / 2;
            const centerY = this.chartCore.canvas.height / 2;
            const radius = Math.min(this.chartCore.canvas.width, this.chartCore.canvas.height) * 0.3;
            const total = this.chartCore.data.reduce((sum, val) => sum + val, 0);
            
            // 计算选中扇形的角度范围
            let startAngle = 0;
            for (let i = 0; i < this.selectedIndex; i++) {
                startAngle += (this.chartCore.data[i] / total) * Math.PI * 2;
            }
            const sliceAngle = (this.chartCore.data[this.selectedIndex] / total) * Math.PI * 2;
            
            // 绘制选中高亮效果（扇形分离）
            const separation = 15;
            const midAngle = startAngle + sliceAngle / 2;
            const offsetX = Math.cos(midAngle) * separation;
            const offsetY = Math.sin(midAngle) * separation;
            
            ctx.beginPath();
            ctx.moveTo(centerX + offsetX, centerY + offsetY);
            ctx.arc(centerX + offsetX, centerY + offsetY, radius, startAngle, startAngle + sliceAngle);
            ctx.closePath();
            
            ctx.strokeStyle = '#ff6b6b';
            ctx.lineWidth = 4;
            ctx.stroke();
            
            // 绘制拖拽指示器
            if (this.isDragging) {
                const labelX = centerX + Math.cos(midAngle) * (radius + 40) + offsetX;
                const labelY = centerY + Math.sin(midAngle) * (radius + 40) + offsetY;
                
                ctx.fillStyle = '#ff6b6b';
                ctx.font = 'bold 14px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('拖拽调整大小', labelX, labelY);
            }
        }
    }
    
    // 绘制悬停效果（折线图和柱状图）
    drawHoverEffects() {
        if (this.hoveredIndex >= 0) {
            const ctx = this.chartCore.ctx;
            const width = this.chartCore.canvas.width;
            const height = this.chartCore.canvas.height;
            const padding = 80;
            const chartWidth = width - padding * 2;
            const chartHeight = height - padding * 2;
            const maxValue = Math.max(...this.chartCore.data);
            
            let x, y;
            
            if (this.chartCore.chartType === 'line') {
                x = padding + (this.hoveredIndex / (this.chartCore.data.length - 1)) * chartWidth;
                y = height - padding - (this.chartCore.data[this.hoveredIndex] / maxValue) * chartHeight;
            } else { // bar chart
                const barWidth = chartWidth / this.chartCore.data.length * 0.6;
                x = padding + (this.hoveredIndex / this.chartCore.data.length) * chartWidth + (chartWidth / this.chartCore.data.length - barWidth) / 2 + barWidth / 2;
                const barHeight = (this.chartCore.data[this.hoveredIndex] / maxValue) * chartHeight;
                y = height - padding - barHeight / 2;
            }
            
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
    
    // 绘制选中效果（折线图和柱状图）
    drawSelectionEffects() {
        if (this.selectedIndex >= 0) {
            const ctx = this.chartCore.ctx;
            const width = this.chartCore.canvas.width;
            const height = this.chartCore.canvas.height;
            const padding = 80;
            const chartWidth = width - padding * 2;
            const chartHeight = height - padding * 2;
            const maxValue = Math.max(...this.chartCore.data);
            
            let x, y;
            
            if (this.chartCore.chartType === 'line') {
                x = padding + (this.selectedIndex / (this.chartCore.data.length - 1)) * chartWidth;
                y = height - padding - (this.chartCore.data[this.selectedIndex] / maxValue) * chartHeight;
            } else { // bar chart
                const barWidth = chartWidth / this.chartCore.data.length * 0.6;
                x = padding + (this.selectedIndex / this.chartCore.data.length) * chartWidth + (chartWidth / this.chartCore.data.length - barWidth) / 2 + barWidth / 2;
                const barHeight = (this.chartCore.data[this.selectedIndex] / maxValue) * chartHeight;
                y = height - padding - barHeight / 2;
            }
            
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