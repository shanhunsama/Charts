// 图表工具函数
class ChartUtils {
    // 生成随机数据
    static generateRandomData(length = 6) {
        return Array.from({length}, () => Math.floor(Math.random() * 100) + 1);
    }
    
    // 计算统计数据
    static calculateStats(data) {
        const maxValue = Math.max(...data);
        const minValue = Math.min(...data);
        const sumValue = data.reduce((a, b) => a + b, 0);
        const avgValue = (sumValue / data.length).toFixed(1);
        
        // 计算标准差
        const variance = data.reduce((acc, val) => acc + Math.pow(val - avgValue, 2), 0) / data.length;
        const stdValue = Math.sqrt(variance).toFixed(1);
        
        return {
            dataPoints: data.length,
            maxValue,
            minValue,
            avgValue,
            sumValue,
            stdValue
        };
    }
    
    // 导出图表为图片
    static exportChart(canvas, chartType) {
        const link = document.createElement('a');
        link.download = `chart-${chartType}-${new Date().getTime()}.png`;
        link.href = canvas.toDataURL();
        link.click();
    }
    
    // 验证数据格式
    static validateData(data) {
        return Array.isArray(data) && data.every(item => typeof item === 'number' && !isNaN(item));
    }
    
    // 格式化数值
    static formatNumber(value, decimals = 1) {
        return Number(value).toFixed(decimals);
    }
    
    // 获取颜色渐变
    static createGradient(ctx, x0, y0, x1, y1, colorStops) {
        const gradient = ctx.createLinearGradient(x0, y0, x1, y1);
        colorStops.forEach(stop => {
            gradient.addColorStop(stop.position, stop.color);
        });
        return gradient;
    }
}