// 饼图交互类
class PieInteraction extends BaseInteraction {
    getDataIndexAtPosition(x, y) {
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
    
    handleDataPointDrag(mouseX, mouseY) {
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
    
    drawInteractions() {
        this.drawPieHoverEffects();
        this.drawPieSelectionEffects();
    }
    
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
    
    showDataPointDetails(index) {
        const value = this.chartCore.data[index];
        const label = this.chartCore.labels[index];
        const total = this.chartCore.data.reduce((sum, val) => sum + val, 0);
        const percentage = ((value / total) * 100).toFixed(1) + '%';
        
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
            <div>占比: ${percentage}</div>
            <div style="font-size: 12px; opacity: 0.8;">点击并拖拽可调整数值</div>
        `;
        
        // 获取数据点位置
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
        
        const tooltipX = labelX;
        const tooltipY = labelY - 30;
        
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
}

window.PieInteraction = PieInteraction;