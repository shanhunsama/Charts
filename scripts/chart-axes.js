// 坐标轴系统类
class ChartAxes {
    // 绘制坐标轴和刻度标记
    static drawAxes(ctx, width, height, padding, maxValue, labels, data) {
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
        
        // 绘制X轴标签（月份）- 智能间距处理
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.font = '11px Arial';
        
        // 计算标签间距，避免重叠
        const minLabelSpacing = 60; // 最小标签间距（像素）
        const maxLabels = Math.floor(chartWidth / minLabelSpacing); // 最大可显示的标签数量
        
        if (data.length <= maxLabels) {
            // 数据点数量较少，显示所有标签
            data.forEach((_, index) => {
                const x = padding + (index / (data.length - 1)) * chartWidth;
                ctx.fillText(labels[index], x, height - padding + 10);
            });
        } else {
            // 数据点数量较多，间隔显示标签
            const step = Math.ceil(data.length / maxLabels);
            for (let index = 0; index < data.length; index += step) {
                const x = padding + (index / (data.length - 1)) * chartWidth;
                ctx.fillText(labels[index], x, height - padding + 10);
            }
            
            // 确保显示最后一个标签
            if (data.length - 1 % step !== 0) {
                const lastIndex = data.length - 1;
                const x = padding + (lastIndex / (data.length - 1)) * chartWidth;
                ctx.fillText(labels[lastIndex], x, height - padding + 10);
            }
        }
        
        // 绘制坐标轴标题
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        
        // Y轴标题
        ctx.save();
        ctx.translate(padding - 40, height / 2);
        ctx.rotate(-Math.PI / 2);
        //ctx.fillText('数值', 0, 0);
        ctx.restore();
        
        // X轴标题
        //ctx.fillText('月份', width / 2, height - padding + 40);
    }
    
    // 计算合适的刻度间隔
    static calculateTickInterval(maxValue) {
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
}