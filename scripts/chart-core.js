// 图表绘制核心类
class ChartCore {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.chartType = 'line';
        this.data = [65, 59, 80, 81, 56, 55];
        this.labels = ['1月', '2月', '3月', '4月', '5月', '6月'];
        this.colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3'];
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