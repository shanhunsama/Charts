// 主入口文件 - 应用程序初始化
class ChartApp {
    constructor() {
        this.chart = null;
        this.controls = null;
    }
    
    init() {
        // 初始化图表
        this.chart = new LocalChart('chartCanvas');
        this.chart.init();
        this.chart.updateStats();
        
        // 初始化控制逻辑
        this.controls = new ChartControls(this.chart);
        this.controls.init();
        
        // 设置全局API
        this.setupGlobalAPI();
        
        console.log('图表应用初始化完成');
    }
    
    setupGlobalAPI() {
        // 全局函数供后端调用
        window.updateChart = (data) => {
            this.chart.updateData(data);
            this.chart.updateStats();
        };
        
        window.switchChart = (type) => {
            this.chart.switchType(type);
            document.getElementById('chartType').value = type;
            this.chart.updateStats();
        };
    }
}

// 应用程序启动
document.addEventListener('DOMContentLoaded', () => {
    const app = new ChartApp();
    app.init();
});