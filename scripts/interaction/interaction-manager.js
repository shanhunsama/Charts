// 交互管理器 - 负责管理不同图表类型的交互
class InteractionManager {
    constructor(chartCore) {
        this.chartCore = chartCore;
        this.currentInteraction = null;
        
        // 注册交互类
        this.interactions = {
            'line': LineInteraction,
            'bar': BarInteraction,
            'pie': PieInteraction
        };
        
        this.init();
    }
    
    init() {
        this.switchInteraction(this.chartCore.chartType);
    }
    
    // 切换交互类型
    switchInteraction(chartType) {
        if (this.currentInteraction) {
            // 清理当前交互
            this.currentInteraction = null;
        }
        
        const InteractionClass = this.interactions[chartType];
        if (InteractionClass) {
            this.currentInteraction = new InteractionClass(this.chartCore);
            this.currentInteraction.bindBaseEvents();
        }
    }
    
    // 代理方法到当前交互实例
    getCurrentInteraction() {
        return this.currentInteraction;
    }
    
}
// 导出交互管理器类
window.InteractionManager = InteractionManager;