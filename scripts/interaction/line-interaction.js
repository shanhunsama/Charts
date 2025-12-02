// 折线图交互类
class LineInteraction extends BaseInteraction {
    getDataIndexAtPosition(x, y) {
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
    
    getDataPointY(index) {
        const padding = 80;
        const height = this.chartCore.canvas.height;
        const chartHeight = height - padding * 2;
        const maxValue = Math.max(...this.chartCore.data);
        const value = this.chartCore.data[index];
        
        return height - padding - (value / maxValue) * chartHeight;
    }
    
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
    
    drawInteractions() {
        this.drawHoverEffects();
        this.drawSelectionEffects();
    }
    
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
        tooltip.style.display = 'block';
        
        // 3秒后自动隐藏
        setTimeout(() => {
            if (tooltip) tooltip.style.display = 'none';
        }, 3000);
    }
}
window.LineInteraction = LineInteraction;