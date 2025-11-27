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
        this.initDragControls(); // 初始化拖拽控制
    }
    
    initDragControls() {
        // 创建拖拽功能开关
        this.createDragToggle();
    }
    
    createDragToggle() {
        // 查找控制面板容器
        const controlPanel = document.querySelector('.control-panel');
        if (!controlPanel) return;
        
        // 创建拖拽开关容器
        const dragControlContainer = document.createElement('div');
        dragControlContainer.className = 'drag-control';
        
        // 创建开关标签
        const label = document.createElement('label');
        label.textContent = '启用拖拽调整';
        label.style.cssText = `
            color: #333;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            user-select: none;
            flex: 1;
        `;
        
        // 创建开关按钮
        const toggle = document.createElement('input');
        toggle.type = 'checkbox';
        toggle.checked = true;
        
        // 添加切换事件
        toggle.addEventListener('change', (e) => {
            if (this.chartInteraction) {
                this.chartInteraction.toggleDrag(e.target.checked);
                this.showDragStatus(e.target.checked);
            }
        });
        
        // 添加到容器
        dragControlContainer.appendChild(toggle);
        dragControlContainer.appendChild(label);
        
        // 插入到控制面板
        const chartTypeSelect = document.getElementById('chartType');
        if (chartTypeSelect && chartTypeSelect.parentNode) {
            chartTypeSelect.parentNode.insertBefore(dragControlContainer, chartTypeSelect.nextSibling);
        }
        
        // 创建拖拽状态指示器
        this.createDragStatusIndicator();
    }
    
    createDragStatusIndicator() {
        const statusIndicator = document.createElement('div');
        statusIndicator.id = 'dragStatus';
        statusIndicator.className = 'drag-status hidden';
        statusIndicator.textContent = '拖拽功能已启用';
        document.body.appendChild(statusIndicator);
    }
    
    showDragStatus(enabled) {
        const statusIndicator = document.getElementById('dragStatus');
        if (!statusIndicator) return;
        
        statusIndicator.textContent = enabled ? '拖拽功能已启用' : '拖拽功能已禁用';
        statusIndicator.className = enabled ? 'drag-status visible' : 'drag-status hidden';
        
        // 3秒后自动隐藏
        setTimeout(() => {
            statusIndicator.className = 'drag-status hidden';
        }, 3000);
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