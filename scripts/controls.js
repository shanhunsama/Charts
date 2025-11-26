// 控制逻辑 - 负责用户交互和事件处理
class ChartControls {
    constructor(chart) {
        this.chart = chart;
        this.tooltip = document.getElementById('tooltip');
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
        chartTypeSelect.value = this.chart.chartType;
        chartTypeSelect.addEventListener('change', (e) => {
            this.chart.setChartType(e.target.value);
            this.chart.updateStats();
        });
    }
    
    initControlButtons() {
        // 随机数据按钮
        document.getElementById('randomDataBtn').addEventListener('click', () => {
            this.chart.generateRandomData();
            this.chart.updateStats();
        });
        
        // 导出按钮
        document.getElementById('exportBtn').addEventListener('click', () => {
            this.chart.exportChart();
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
                        this.chart.setChartType('line');
                        document.getElementById('chartType').value = 'line';
                        this.chart.updateStats();
                        break;
                    case '2':
                        this.chart.setChartType('bar');
                        document.getElementById('chartType').value = 'bar';
                        this.chart.updateStats();
                        break;
                    case '3':
                        this.chart.setChartType('pie');
                        document.getElementById('chartType').value = 'pie';
                        this.chart.updateStats();
                        break;
                    case 'r':
                        this.chart.generateRandomData();
                        this.chart.updateStats();
                        break;
                    case 'e':
                        this.chart.exportChart();
                        break;
                }
            }
        });
    }
    
    initChartInteractions() {
        // 双击切换图表类型
        this.chart.canvas.addEventListener('dblclick', () => {
            this.chart.switchChartType();
            document.getElementById('chartType').value = this.chart.chartType;
            this.chart.updateStats();
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