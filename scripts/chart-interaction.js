// 重构后的主交互类 - 现在作为适配器层
class ChartInteraction {
    constructor(chartCore) {
        this.chartCore = chartCore;
        this.interactionManager = new InteractionManager(chartCore);
    }
    
    // 切换图表类型时调用
    switchChartType(chartType) {
        this.interactionManager.switchInteraction(chartType);
    }
    
    // 获取当前交互实例（供其他模块使用）
    getCurrentInteraction() {
        return this.interactionManager.getCurrentInteraction();
    }
}