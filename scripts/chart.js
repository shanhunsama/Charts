// 图表核心类 - 负责图表绘制和交互
class LocalChart {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.chartType = 'line';
        this.data = [65, 59, 80, 81, 56, 55];
        this.labels = ['1月', '2月', '3月', '4月', '5月', '6月'];
        this.colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3'];
        
        // 交互状态
        this.hoveredIndex = -1;
        this.selectedIndex = -1;
        this.isDragging = false;
        this.dragStartIndex = -1;
        
        // 绑定事件
        this.bindEvents();
    }
    
    init() {
        this.resizeCanvas();
        this.drawChart();
        
        // 窗口调整大小
        window.addEventListener('resize', () => {
            this.resizeCanvas();
            this.drawChart();
        });
    }
    
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    // 绑定交互事件
    bindEvents() {
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        this.canvas.addEventListener('mouseleave', () => this.handleMouseLeave());
        
        // 添加CSS样式
        this.canvas.style.cursor = 'pointer';
    }
    
    // 鼠标移动处理
    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const oldHoveredIndex = this.hoveredIndex;
        this.hoveredIndex = this.getDataIndexAtPosition(mouseX, mouseY);
        
        // 如果悬停状态改变，重绘图表
        if (oldHoveredIndex !== this.hoveredIndex) {
            this.drawChart();
        }
        
        // 拖拽数据点
        if (this.isDragging && this.selectedIndex >= 0) {
            this.handleDataPointDrag(mouseX, mouseY);
        }
    }
    
    // 鼠标按下处理
    handleMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        this.dragStartIndex = this.getDataIndexAtPosition(mouseX, mouseY);
        if (this.dragStartIndex >= 0) {
            this.isDragging = true;
            this.selectedIndex = this.dragStartIndex;
            this.drawChart();
        }
    }
    
    // 鼠标释放处理
    handleMouseUp(e) {
        if (this.isDragging) {
            this.isDragging = false;
            this.drawChart();
        }
    }
    
    // 点击处理
    handleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const clickedIndex = this.getDataIndexAtPosition(mouseX, mouseY);
        if (clickedIndex >= 0) {
            this.selectedIndex = clickedIndex;
            this.showDataPointDetails(clickedIndex);
            this.drawChart();
        }
    }
    
    // 鼠标离开处理
    handleMouseLeave() {
        this.hoveredIndex = -1;
        this.drawChart();
    }
    
    // 获取鼠标位置对应的数据点索引
    getDataIndexAtPosition(x, y) {
        const padding = 80;
        const width = this.canvas.width;
        const height = this.canvas.height;
        const chartWidth = width - padding * 2;
        
        for (let i = 0; i < this.data.length; i++) {
            const dataX = padding + (i / (this.data.length - 1)) * chartWidth;
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
        const height = this.canvas.height;
        const chartHeight = height - padding * 2;
        const maxValue = Math.max(...this.data);
        const value = this.data[index];
        
        return height - padding - (value / maxValue) * chartHeight;
    }
    
    // 拖拽数据点
    handleDataPointDrag(mouseX, mouseY) {
        const padding = 80;
        const height = this.canvas.height;
        const chartHeight = height - padding * 2;
        const maxValue = Math.max(...this.data);
        
        // 计算新的数值
        const newValue = Math.max(0, Math.min(100, 
            ((height - padding - mouseY) / chartHeight) * maxValue
        ));
        
        // 更新数据
        this.data[this.selectedIndex] = Math.round(newValue);
        this.updateStats();
        this.drawChart();
    }
    
    // 显示数据点详情
    showDataPointDetails(index) {
        const value = this.data[index];
        const label = this.labels[index];
        
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
        const width = this.canvas.width;
        const chartWidth = width - padding * 2;
        const dataX = padding + (index / (this.data.length - 1)) * chartWidth;
        const dataY = this.getDataPointY(index);
        
        // 定位工具提示
        const rect = this.canvas.getBoundingClientRect();
        tooltip.style.left = (rect.left + dataX + 10) + 'px';
        tooltip.style.top = (rect.top + dataY - 60) + 'px';
        
        // 3秒后自动隐藏
        setTimeout(() => {
            if (tooltip) tooltip.style.display = 'none';
        }, 3000);
    }
    
    drawChart() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // 清空画布
        ctx.clearRect(0, 0, width, height);
        
        // 绘制渐变背景
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, '#1a1a1a');
        gradient.addColorStop(1, '#2d2d2d');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        switch(this.chartType) {
            case 'line':
                this.drawLineChart(width, height);
                break;
            case 'bar':
                this.drawBarChart(width, height);
                break;
            case 'pie':
                this.drawPieChart(width, height);
                break;
        }
        
        // 绘制交互效果
        this.drawInteractions(width, height);
    }
    
    drawLineChart(width, height) {
        const ctx = this.ctx;
        const padding = 80;
        const chartWidth = width - padding * 2;
        const chartHeight = height - padding * 2;
        const maxValue = Math.max(...this.data);
        
        // 绘制坐标轴
        this.drawAxes(width, height, padding, maxValue);
        
        // 绘制网格线
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        
        // 水平网格线
        for (let i = 0; i <= 5; i++) {
            const y = padding + (i / 5) * chartHeight;
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(width - padding, y);
            ctx.stroke();
        }
        
        // 垂直网格线
        for (let i = 0; i < this.data.length; i++) {
            const x = padding + (i / (this.data.length - 1)) * chartWidth;
            ctx.beginPath();
            ctx.moveTo(x, padding);
            ctx.lineTo(x, height - padding);
            ctx.stroke();
        }
        
        // 绘制数据线
        const lineGradient = ctx.createLinearGradient(0, padding, 0, height - padding);
        lineGradient.addColorStop(0, '#4ecdc4');
        lineGradient.addColorStop(1, '#45b7d1');
        
        ctx.strokeStyle = lineGradient;
        ctx.lineWidth = 3;
        ctx.fillStyle = '#4ecdc4';
        
        // 先绘制折线
        ctx.beginPath();
        this.data.forEach((value, index) => {
            const x = padding + (index / (this.data.length - 1)) * chartWidth;
            const y = height - padding - (value / maxValue) * chartHeight;
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        ctx.stroke();
        
        // 然后绘制数据点
        this.data.forEach((value, index) => {
            const x = padding + (index / (this.data.length - 1)) * chartWidth;
            const y = height - padding - (value / maxValue) * chartHeight;
            
            // 绘制数据点
            ctx.beginPath();
            ctx.arc(x, y, 6, 0, Math.PI * 2);
            ctx.fill();
            
            // 绘制标签
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(this.labels[index], x, height - padding + 25);
            ctx.fillText(value, x, y - 15);
        });
    }
    
    drawBarChart(width, height) {
        const ctx = this.ctx;
        const padding = 80;
        const chartWidth = width - padding * 2;
        const chartHeight = height - padding * 2;
        const maxValue = Math.max(...this.data);
        const barWidth = chartWidth / this.data.length * 0.6;
        
        // 绘制坐标轴
        this.drawAxes(width, height, padding, maxValue);
        
        // 绘制柱状图
        this.data.forEach((value, index) => {
            const x = padding + (index / this.data.length) * chartWidth + (chartWidth / this.data.length - barWidth) / 2;
            const barHeight = (value / maxValue) * chartHeight;
            const y = height - padding - barHeight;
            
            // 柱状图渐变
            const barGradient = ctx.createLinearGradient(x, y, x, height - padding);
            barGradient.addColorStop(0, this.colors[index % this.colors.length]);
            barGradient.addColorStop(1, this.colors[(index + 3) % this.colors.length]);
            
            ctx.fillStyle = barGradient;
            ctx.fillRect(x, y, barWidth, barHeight);
            
            // 绘制数值标签
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(value, x + barWidth / 2, y - 10);
            
            // 绘制月份标签
            ctx.fillText(this.labels[index], x + barWidth / 2, height - padding + 25);
        });
    }
    
    drawPieChart(width, height) {
        const ctx = this.ctx;
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) * 0.3;
        const total = this.data.reduce((sum, val) => sum + val, 0);
        
        let startAngle = 0;
        
        this.data.forEach((value, index) => {
            const sliceAngle = (value / total) * Math.PI * 2;
            const midAngle = startAngle + sliceAngle / 2;
            
            // 绘制扇形
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
            ctx.closePath();
            
            ctx.fillStyle = this.colors[index % this.colors.length];
            ctx.fill();
            
            // 绘制扇形边框
            ctx.strokeStyle = '#1a1a1a';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // 绘制标签线
            const labelX = centerX + Math.cos(midAngle) * (radius + 20);
            const labelY = centerY + Math.sin(midAngle) * (radius + 20);
            
            ctx.beginPath();
            ctx.moveTo(centerX + Math.cos(midAngle) * radius, centerY + Math.sin(midAngle) * radius);
            ctx.lineTo(labelX, labelY);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.lineWidth = 1;
            ctx.stroke();
            
            // 绘制百分比标签
            const percentage = ((value / total) * 100).toFixed(1);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.font = '12px Arial';
            ctx.textAlign = Math.cos(midAngle) > 0 ? 'left' : 'right';
            ctx.fillText(`${percentage}%`, labelX + (Math.cos(midAngle) > 0 ? 5 : -5), labelY + 4);
            
            startAngle += sliceAngle;
        });
    }
    
    // 绘制交互效果
    drawInteractions(width, height) {
        if (this.chartType !== 'pie') {
            this.drawHoverEffects(width, height);
            this.drawSelectionEffects(width, height);
        }
    }
    
    // 绘制悬停效果
    drawHoverEffects(width, height) {
        if (this.hoveredIndex >= 0) {
            const ctx = this.ctx;
            const padding = 80;
            const chartWidth = width - padding * 2;
            const chartHeight = height - padding * 2;
            const maxValue = Math.max(...this.data);
            
            const x = padding + (this.hoveredIndex / (this.data.length - 1)) * chartWidth;
            const y = height - padding - (this.data[this.hoveredIndex] / maxValue) * chartHeight;
            
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
    drawSelectionEffects(width, height) {
        if (this.selectedIndex >= 0) {
            const ctx = this.ctx;
            const padding = 80;
            const chartWidth = width - padding * 2;
            const chartHeight = height - padding * 2;
            const maxValue = Math.max(...this.data);
            
            const x = padding + (this.selectedIndex / (this.data.length - 1)) * chartWidth;
            const y = height - padding - (this.data[this.selectedIndex] / maxValue) * chartHeight;
            
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
    
    // 绘制坐标轴和刻度标记
    drawAxes(width, height, padding, maxValue) {
        const ctx = this.ctx;
        const chartWidth = width - padding * 2;
        const chartHeight = height - padding * 2;
        
        // 绘制坐标轴
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 2;
        
        // X轴
        ctx.beginPath();
        ctx.moveTo(padding, height - padding);
        ctx.lineTo(width - padding, height - padding);
        ctx.stroke();
        
        // Y轴
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, height - padding);
        ctx.stroke();
        
        // 绘制Y轴刻度标记
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = '14px Arial';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        
        // 计算合适的刻度间隔
        const tickInterval = this.calculateTickInterval(maxValue);
        const numTicks = Math.ceil(maxValue / tickInterval);
        
        for (let i = 0; i <= numTicks; i++) {
            const value = i * tickInterval;
            const y = height - padding - (value / maxValue) * chartHeight;
            
            // 绘制刻度线
            ctx.beginPath();
            ctx.moveTo(padding - 5, y);
            ctx.lineTo(padding, y);
            ctx.stroke();
            
            // 绘制刻度值
            ctx.fillText(value.toString(), padding - 10, y);
        }
        
        // 绘制X轴标签（月份）
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        this.data.forEach((_, index) => {
            const x = padding + (index / (this.data.length - 1)) * chartWidth;
            ctx.fillText(this.labels[index], x, height - padding + 10);
        });
        
        // 绘制坐标轴标题
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        
        // Y轴标题
        ctx.save();
        ctx.translate(padding - 40, height / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('数值', 0, 0);
        ctx.restore();
        
        // X轴标题
        ctx.fillText('月份', width / 2, height - padding + 40);
    }
    
    // 计算合适的刻度间隔
    calculateTickInterval(maxValue) {
        const niceIntervals = [1, 2, 5, 10, 20, 25, 50, 100, 200, 500, 1000];
        const magnitude = Math.pow(10, Math.floor(Math.log10(maxValue)));
        
        for (let interval of niceIntervals) {
            const candidate = interval * magnitude;
            if (maxValue / candidate <= 10) {
                return candidate;
            }
        }
        
        return Math.ceil(maxValue / 10);
    }
    
    switchChartType() {
        const types = ['line', 'bar', 'pie'];
        const currentIndex = types.indexOf(this.chartType);
        const newType = types[(currentIndex + 1) % types.length];
        this.setChartType(newType);
    }
    
    setChartType(type) {
        if (['line', 'bar', 'pie'].includes(type)) {
            this.chartType = type;
            this.drawChart();
        }
    }
    
    generateRandomData() {
        this.data = Array.from({length: 6}, () => Math.floor(Math.random() * 100) + 1);
        this.drawChart();
    }
    
    updateStats() {
        const maxValue = Math.max(...this.data);
        const minValue = Math.min(...this.data);
        const sumValue = this.data.reduce((a, b) => a + b, 0);
        const avgValue = (sumValue / this.data.length).toFixed(1);
        
        // 计算标准差
        const variance = this.data.reduce((acc, val) => acc + Math.pow(val - avgValue, 2), 0) / this.data.length;
        const stdValue = Math.sqrt(variance).toFixed(1);
        
        document.getElementById('dataPoints').textContent = this.data.length;
        document.getElementById('maxValue').textContent = maxValue;
        document.getElementById('minValue').textContent = minValue;
        document.getElementById('avgValue').textContent = avgValue;
        document.getElementById('sumValue').textContent = sumValue;
        document.getElementById('stdValue').textContent = stdValue;
    }
    
    exportChart() {
        const link = document.createElement('a');
        link.download = `chart-${this.chartType}-${new Date().getTime()}.png`;
        link.href = this.canvas.toDataURL();
        link.click();
    }
    
    // API方法 - 供后端调用
    updateData(newData) {
        if (Array.isArray(newData)) {
            this.data = newData;
            this.drawChart();
        }
    }
    
    switchType(type) {
        this.setChartType(type);
    }
}