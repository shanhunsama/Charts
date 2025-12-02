// 控制逻辑 - 负责用户交互和事件处理
class ChartControls {
    constructor(chartCore) {
        this.chartCore = chartCore;
        this.tooltip = document.getElementById('tooltip');
        this.chartInteraction = null; // 稍后设置
    }
    
    setChartInteraction(chartInteraction) {
        this.chartInteraction = chartInteraction;
    }
    
    init() {
        this.initChartTypeControls();
        this.initControlButtons();
        this.initTooltips();
        this.initKeyboardShortcuts();
        this.initChartInteractions();
    }
    
    initChartTypeControls() {
        // 图表类型下拉框
        const chartTypeSelect = document.getElementById('chartType');
        chartTypeSelect.value = this.chartCore.chartType;
        chartTypeSelect.addEventListener('change', (e) => {
            this.chartCore.setChartType(e.target.value);
            this.chartCore.updateStats();
        });
    }
    
    initControlButtons() {
        // 随机数据按钮
        document.getElementById('randomDataBtn').addEventListener('click', () => {
            this.chartCore.generateRandomData();
            this.chartCore.updateStats();
        });
        
        // 导出按钮
        document.getElementById('exportBtn').addEventListener('click', () => {
            this.chartCore.exportChart();
        });
    }
    
    initTooltips() {
        // 为所有按钮添加工具提示
        document.querySelectorAll('.control-btn').forEach(btn => {
            const title = btn.getAttribute('title');
            if (title) {
                btn.addEventListener('mouseenter', (e) => {
                    this.showTooltip(title, e.pageX, e.pageY);
                });
                
                btn.addEventListener('mouseleave', () => {
                    this.hideTooltip();
                });
                
                btn.addEventListener('mousemove', (e) => {
                    this.moveTooltip(e.pageX, e.pageY);
                });
            }
        });
    }
    
    initKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey) {
                e.preventDefault();
                switch(e.key) {
                    case '1':
                        this.chartCore.setChartType('line');
                        document.getElementById('chartType').value = 'line';
                        this.chartCore.updateStats();
                        break;
                    case '2':
                        this.chartCore.setChartType('bar');
                        document.getElementById('chartType').value = 'bar';
                        this.chartCore.updateStats();
                        break;
                    case '3':
                        this.chartCore.setChartType('pie');
                        document.getElementById('chartType').value = 'pie';
                        this.chartCore.updateStats();
                        break;
                    case 'r':
                        this.chartCore.generateRandomData();
                        this.chartCore.updateStats();
                        break;
                    case 'e':
                        this.chartCore.exportChart();
                        break;
                }
            }
        });
    }
    
    initChartInteractions() {
        // 双击切换图表类型
        this.chartCore.canvas.addEventListener('dblclick', () => {
            this.chartCore.switchChartType();
            document.getElementById('chartType').value = this.chartCore.chartType;
            this.chartCore.updateStats();
        });
    }
    
    showTooltip(text, x, y) {
        this.tooltip.textContent = text;
        this.tooltip.style.left = x + 'px';
        this.tooltip.style.top = (y - 40) + 'px';
        this.tooltip.classList.add('show');
    }
    
    hideTooltip() {
        this.tooltip.classList.remove('show');
    }
    
    moveTooltip(x, y) {
        this.tooltip.style.left = x + 'px';
        this.tooltip.style.top = (y - 40) + 'px';
    }
}