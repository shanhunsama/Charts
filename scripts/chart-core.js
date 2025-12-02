// 图表绘制核心类
class ChartCore {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.chartType = 'line';
        this.data = [65, 59, 80, 81, 56, 55];
        this.labels = ['1月', '2月', '3月', '4月', '5月', '6月'];
        this.colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3'];
        this.chartInteraction = null; // 交互引用
    }
    
    setChartInteraction(chartInteraction) {
        this.chartInteraction = chartInteraction;
    }
    
    setChartType(type) {
        if (['line', 'bar', 'pie'].includes(type)) {
            this.chartType = type;
            // 通知交互管理器切换交互类型
            if (this.chartInteraction) {
                this.chartInteraction.switchChartType(type);
            }
            this.drawChart();
        }
    }
    
    init() {
        this.resizeCanvas();
        this.drawChart();
        
        window.addEventListener('resize', () => {
            this.resizeCanvas();
            this.drawChart();
        });
    }
    
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
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
    }
    
    drawLineChart(width, height) {
        const ctx = this.ctx;
        const padding = 80;
        const chartWidth = width - padding * 2;
        const chartHeight = height - padding * 2;
        const maxValue = Math.max(...this.data);
        
        // 绘制坐标轴
        ChartAxes.drawAxes(ctx, width, height, padding, maxValue, this.labels, this.data);
        
        // 绘制渐变背景区域
        const areaGradient = ctx.createLinearGradient(0, padding, 0, height - padding);
        areaGradient.addColorStop(0, 'rgba(78, 205, 196, 0.1)');
        areaGradient.addColorStop(1, 'rgba(69, 183, 209, 0.05)');
        
        // 绘制数据区域填充
        ctx.beginPath();
        this.data.forEach((value, index) => {
            const x = padding + (index / (this.data.length - 1)) * chartWidth;
            const y = height - padding - (value / maxValue) * chartHeight;
            
            if (index === 0) {
                ctx.moveTo(x, height - padding);
                ctx.lineTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
            
            if (index === this.data.length - 1) {
                ctx.lineTo(x, height - padding);
                ctx.closePath();
            }
        });
        ctx.fillStyle = areaGradient;
        ctx.fill();
        
        // 绘制网格线（更精细）
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 3]);
        
        // 水平网格线
        for (let i = 0; i <= 10; i++) {
            const y = padding + (i / 10) * chartHeight;
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
        ctx.setLineDash([]);
        
        // 绘制数据线（更细的线条，更简洁的样式）
        ctx.shadowColor = 'rgba(78, 205, 196, 0.2)';
        ctx.shadowBlur = 5;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        const lineGradient = ctx.createLinearGradient(0, padding, 0, height - padding);
        lineGradient.addColorStop(0, '#4ecdc4');
        lineGradient.addColorStop(0.5, '#45b7d1');
        lineGradient.addColorStop(1, '#6a89cc');
        
        ctx.strokeStyle = lineGradient;
        ctx.lineWidth = 2; // 更细的线条
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        // 绘制折线图（直线连接）
        ctx.beginPath();
        this.data.forEach((value, index) => {
            const x = padding + (index / (this.data.length - 1)) * chartWidth;
            const y = height - padding - (value / maxValue) * chartHeight;
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                // 使用直线连接数据点
                ctx.lineTo(x, y);
            }
        });
        ctx.stroke();
        
        // 重置阴影
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        
        // 绘制数据点（更简洁的样式）
        this.data.forEach((value, index) => {
            const x = padding + (index / (this.data.length - 1)) * chartWidth;
            const y = height - padding - (value / maxValue) * chartHeight;
            
            // 绘制简洁的数据点
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
            
            ctx.beginPath();
            ctx.arc(x, y, 2, 0, Math.PI * 2);
            ctx.fillStyle = lineGradient;
            ctx.fill();
            
            // 绘制数值标签（简洁样式）
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.fillText(value, x, y - 15);
            
            // 绘制月份标签
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.font = '11px Arial';
            ctx.textBaseline = 'top';
            ctx.fillText(this.labels[index], x, height - padding + 10);
        });
        
        // 绘制趋势线（如果数据点足够多）
        if (this.data.length >= 3) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 5]);
            
            // 简单线性回归计算趋势线
            const n = this.data.length;
            const sumX = this.data.reduce((sum, _, i) => sum + i, 0);
            const sumY = this.data.reduce((sum, val) => sum + val, 0);
            const sumXY = this.data.reduce((sum, val, i) => sum + i * val, 0);
            const sumX2 = this.data.reduce((sum, _, i) => sum + i * i, 0);
            
            const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
            const intercept = (sumY - slope * sumX) / n;
            
            ctx.beginPath();
            const startX = padding;
            const startY = height - padding - (intercept / maxValue) * chartHeight;
            const endX = width - padding;
            const endY = height - padding - ((intercept + slope * (n-1)) / maxValue) * chartHeight;
            
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }
    
    drawBarChart(width, height) {
        const ctx = this.ctx;
        const padding = 80;
        const chartWidth = width - padding * 2;
        const chartHeight = height - padding * 2;
        const maxValue = Math.max(...this.data);
        const barWidth = chartWidth / this.data.length * 0.6;
        
        // 绘制坐标轴
        ChartAxes.drawAxes(ctx, width, height, padding, maxValue, this.labels, this.data);
        
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
    
    // 切换图表类型
    switchChartType() {
        const types = ['line', 'bar', 'pie'];
        const currentIndex = types.indexOf(this.chartType);
        const newType = types[(currentIndex + 1) % types.length];
        this.setChartType(newType);
        
        // 更新下拉框
        document.getElementById('chartType').value = newType;
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