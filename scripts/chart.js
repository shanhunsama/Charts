class ChartApp {
    constructor() {
        this.chart = null;
        this.currentType = 'line';
        this.currentData = [];
        this.controlPanel = null;
        this.init();
    }

    async init() {
        await this.loadConfig();
        this.createChart();
        this.setupControls();
    }

    async loadConfig() {
        try {
            const response = await fetch('/api/config');
            const result = await response.json();
            
            if (result.success) {
                this.currentType = result.config.chart_type;
                this.currentData = result.config.data;
            }
        } catch (error) {
            console.error('加载配置失败:', error);
            this.currentData = [65, 59, 80, 81, 56, 55];
        }
    }

    createChart() {
        const ctx = document.getElementById('chartCanvas').getContext('2d');
        
        const chartConfig = {
            type: this.currentType,
            data: {
                labels: this.currentData.map((_, index) => `数据${index + 1}`),
                datasets: [{
                    label: '图表数据',
                    data: this.currentData,
                    backgroundColor: this.getBackgroundColors(),
                    borderColor: '#667eea',
                    borderWidth: 2,
                    fill: this.currentType === 'line'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: '数据图表展示',
                        font: {
                            size: 18
                        }
                    }
                },
                scales: this.currentType !== 'pie' ? {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0,0,0,0.1)'
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(0,0,0,0.1)'
                        }
                    }
                } : {}
            }
        };

        if (this.chart) {
            this.chart.destroy();
        }

        this.chart = new Chart(ctx, chartConfig);
    }

    getBackgroundColors() {
        if (this.currentType === 'line') {
            return 'rgba(102, 126, 234, 0.1)';
        }
        
        const colors = [
            '#667eea', '#764ba2', '#f093fb', '#f5576c',
            '#4facfe', '#00f2fe', '#43e97b', '#38f9d7',
            '#fa709a', '#fee140', '#a8edea', '#fed6e3'
        ];
        
        return this.currentData.map((_, index) => colors[index % colors.length]);
    }

    async updateData() {
        try {
            const response = await fetch('/api/random', { method: 'POST' });
            const result = await response.json();
            
            if (result.success) {
                this.currentData = result.data;
                this.updateChart();
            }
        } catch (error) {
            console.error('更新数据失败:', error);
        }
    }

    updateChart() {
        if (this.chart) {
            this.chart.data.datasets[0].data = this.currentData;
            this.chart.data.labels = this.currentData.map((_, index) => `数据${index + 1}`);
            this.chart.data.datasets[0].backgroundColor = this.getBackgroundColors();
            this.chart.update();
        }
    }

    async switchChartType(type) {
        try {
            const response = await fetch('/api/switch', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ type: type })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.currentType = result.type;
                this.updateTypeButtons();
                this.createChart();
            }
        } catch (error) {
            console.error('切换图表类型失败:', error);
        }
    }

    setupControls() {
        // 控制面板元素
        this.controlPanel = document.getElementById('controlPanel');
        const toggleBtn = document.getElementById('controlToggle');
        const closeBtn = document.getElementById('closePanel');
        const randomBtn = document.getElementById('randomData');
        const updateBtn = document.getElementById('updateChart');
        
        // 切换控制面板显示/隐藏
        toggleBtn.addEventListener('click', () => {
            this.controlPanel.classList.toggle('active');
        });
        
        closeBtn.addEventListener('click', () => {
            this.controlPanel.classList.remove('active');
        });
        
        // 点击面板外部关闭面板
        document.addEventListener('click', (e) => {
            if (!this.controlPanel.contains(e.target) && 
                !toggleBtn.contains(e.target) && 
                this.controlPanel.classList.contains('active')) {
                this.controlPanel.classList.remove('active');
            }
        });
        
        // 图表类型按钮
        const typeButtons = document.querySelectorAll('.type-btn');
        typeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const type = btn.dataset.type;
                this.switchChartType(type);
            });
        });
        
        // 随机数据按钮
        randomBtn.addEventListener('click', () => {
            this.updateData();
        });
        
        // 更新图表按钮
        updateBtn.addEventListener('click', () => {
            this.updateChart();
        });
        
        // 初始化类型按钮状态
        this.updateTypeButtons();
    }
    
    updateTypeButtons() {
        const typeButtons = document.querySelectorAll('.type-btn');
        typeButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.type === this.currentType) {
                btn.classList.add('active');
            }
        });
    }
}

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new ChartApp();
});