// 主入口文件 - 应用程序初始化
class ChartApp {
    constructor() {
        this.chartCore = null;
        this.chartInteraction = null;
        this.controls = null;
    }
    
    init() {
        // 初始化图表核心
        this.chartCore = new ChartCore('chartCanvas');
        this.chartCore.init();
        this.chartCore.updateStats();
        
        // 初始化交互功能
        this.chartInteraction = new ChartInteraction(this.chartCore);
        
        // 初始化控制逻辑
        this.controls = new ChartControls(this.chartCore);
        this.controls.setChartInteraction(this.chartInteraction); // 设置交互引用
        this.controls.init();
        
        // 设置全局API
        this.setupGlobalAPI();
        
        console.log('图表应用初始化完成');
    }
    
    setupGlobalAPI() {
        // 全局函数供后端调用
        window.updateChart = (data) => {
            this.chartCore.updateData(data);
            this.chartCore.updateStats();
        };
        
        window.switchChart = (type) => {
            this.chartCore.setChartType(type);
            document.getElementById('chartType').value = type;
            this.chartCore.updateStats();
        };
    }
}

// 应用程序启动
document.addEventListener('DOMContentLoaded', () => {
    const app = new ChartApp();
    app.init();
});