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
        this.initDraggablePanel();
        this.initCollapseToggle(); // 添加折叠功能初始化
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
        // 随机数据按钮（修改为生成键值对数据）
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
    
    // 移除双击切换图表功能
    // initChartInteractions() 方法已被删除
    
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
    initCollapseToggle() {
        const collapseBtn = document.getElementById('collapseBtn');
        const controlPanel = document.querySelector('.control-panel');
        const panelContent = document.querySelector('.panel-content');
        
        if (!collapseBtn || !controlPanel || !panelContent) return;
        
        // 加载保存的折叠状态
        const savedState = localStorage.getItem('controlPanelCollapsed');
        if (savedState === 'true') {
            controlPanel.classList.add('collapsed');
            collapseBtn.textContent = '⚙️';
        } else {
            controlPanel.classList.remove('collapsed');
            collapseBtn.textContent = '⬆️';
        }
        
        // 折叠/展开函数
        const toggleCollapse = () => {
            controlPanel.classList.toggle('collapsed');
            
            // 更新按钮图标
            if (controlPanel.classList.contains('collapsed')) {
                collapseBtn.textContent = '⚙️';
                localStorage.setItem('controlPanelCollapsed', 'true');
            } else {
                collapseBtn.textContent = '⬆️';
                localStorage.setItem('controlPanelCollapsed', 'false');
            }
        };
        
        // 手动折叠按钮点击事件
        collapseBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleCollapse();
        });
        
        // 双击面板标题也可以折叠/展开
        const chartTypeLabel = document.querySelector('.chart-type-selector label');
        if (chartTypeLabel) {
            chartTypeLabel.addEventListener('dblclick', (e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleCollapse();
            });
        }
    }
    initDraggablePanel() {
        const panel = document.querySelector('.control-panel');
        if (!panel) return;
        
        let isDragging = false;
        let startX, startY, initialLeft, initialTop;
    
        // 边界检查函数
        const checkBoundaries = (left, top) => {
            const rect = panel.getBoundingClientRect();
            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;
            
            let newLeft = Math.max(0, Math.min(left, windowWidth - rect.width));
            let newTop = Math.max(0, Math.min(top, windowHeight - rect.height));
            
            return { left: newLeft, top: newTop };
        };
    
        // 鼠标按下事件
        panel.addEventListener('mousedown', (e) => {
            if (e.target === panel || 
                e.target.closest('.collapse-toggle') || 
                e.target.closest('.chart-type-selector')) {
                
                e.preventDefault();
                e.stopPropagation();
                
                isDragging = true;
                startX = e.clientX;
                startY = e.clientY;
                
                const rect = panel.getBoundingClientRect();
                initialLeft = rect.left;
                initialTop = rect.top;
                
                panel.classList.add('dragging');
                panel.style.cursor = 'grabbing';
                panel.style.transition = 'none';
                
                document.body.style.userSelect = 'none';
            }
        });
    
        // 鼠标移动事件
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            e.preventDefault();
            
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            
            const newLeft = initialLeft + deltaX;
            const newTop = initialTop + deltaY;
            
            const boundedPos = checkBoundaries(newLeft, newTop);
            
            panel.style.left = boundedPos.left + 'px';
            panel.style.top = boundedPos.top + 'px';
            panel.style.right = 'auto';
        });
    
        // 鼠标释放事件
        document.addEventListener('mouseup', (e) => {
            if (isDragging) {
                e.preventDefault();
                isDragging = false;
                panel.classList.remove('dragging');
                panel.style.cursor = 'grab';
                panel.style.transition = 'all 0.3s ease';
                document.body.style.userSelect = '';
            }
        });
    
        // 鼠标离开窗口时停止拖拽
        document.addEventListener('mouseleave', () => {
            if (isDragging) {
                isDragging = false;
                panel.classList.remove('dragging');
                panel.style.cursor = 'grab';
                panel.style.transition = 'all 0.3s ease';
                document.body.style.userSelect = '';
            }
        });
    
        // 初始化光标样式
        panel.style.cursor = 'grab';
    }
}