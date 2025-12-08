class ChartApp {
    constructor() {
        this.chart = null;
        this.currentType = 'line';
        this.currentData = [];
        this.controlPanel = null;
        this.chartError = null;
        this.init();
    }

    async init() {
        // 检查Chart.js是否加载成功
        if (typeof Chart === 'undefined') {
            this.showChartError('Chart.js库加载失败，请检查网络连接');
            return;
        }
        
        try {
            await this.loadConfig();
            this.createChart();
            this.setupControls();
        } catch (error) {
            this.showChartError('图表初始化失败: ' + error.message);
        }
    }

    async loadConfig() {
        try {
            const response = await fetch('/api/config');
            if (!response.ok) {
                throw new Error('网络请求失败: ' + response.status);
            }
            const result = await response.json();
            
            if (result.success) {
                this.currentType = result.config.chart_type;
                this.currentData = result.config.data;
            } else {
                throw new Error('配置加载失败');
            }
        } catch (error) {
            console.error('加载配置失败:', error);
            this.currentData = [65, 59, 80, 81, 56, 55];
            // 不显示错误，使用默认数据继续
        }
    }

    createChart() {
        try {
            const canvas = document.getElementById('chartCanvas');
            if (!canvas) {
                throw new Error('找不到图表画布元素');
            }
            
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                throw new Error('无法获取画布上下文');
            }
            
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
            this.hideChartError(); // 成功创建图表后隐藏错误提示
            
        } catch (error) {
            this.showChartError('图表创建失败: ' + error.message);
        }
    }

    // 显示图表错误提示
    showChartError(message) {
        if (!this.chartError) {
            this.chartError = document.getElementById('chartError');
            if (!this.chartError) return;
            
            // 添加重试按钮事件
            const retryBtn = document.getElementById('retryChart');
            if (retryBtn) {
                retryBtn.onclick = () => {
                    location.reload();
                };
            }
        }
        
        // 更新错误消息
        const errorContent = this.chartError.querySelector('.error-content');
        if (errorContent) {
            const h3 = errorContent.querySelector('h3');
            if (h3) h3.textContent = '图表加载失败';
            
            const p = errorContent.querySelector('p');
            if (p) p.textContent = message || '图表加载过程中出现错误';
        }
        
        this.chartError.style.display = 'flex';
        
        // 隐藏图表容器
        const chartContainer = document.querySelector('.chart-container');
        if (chartContainer) {
            chartContainer.style.display = 'none';
        }
    }

    // 隐藏图表错误提示
    hideChartError() {
        if (this.chartError) {
            this.chartError.style.display = 'none';
        }
        
        // 显示图表容器
        const chartContainer = document.querySelector('.chart-container');
        if (chartContainer) {
            chartContainer.style.display = 'block';
        }
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
            if (!response.ok) {
                throw new Error('网络请求失败: ' + response.status);
            }
            const result = await response.json();
            
            if (result.success) {
                this.currentData = result.data;
                this.updateChart();
            } else {
                throw new Error('数据更新失败');
            }
        } catch (error) {
            console.error('更新数据失败:', error);
            this.showChartError('数据更新失败: ' + error.message);
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
            
            if (!response.ok) {
                throw new Error('网络请求失败: ' + response.status);
            }
            
            const result = await response.json();
            
            if (result.success) {
                this.currentType = result.type;
                this.updateTypeButtons();
                this.createChart();
            } else {
                throw new Error('图表类型切换失败');
            }
        } catch (error) {
            console.error('切换图表类型失败:', error);
            this.showChartError('图表类型切换失败: ' + error.message);
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
    // 添加全局错误处理
    window.addEventListener('error', (event) => {
        if (event.error && event.error.message.includes('Chart')) {
            console.error('全局图表错误:', event.error);
        }
    });
    
    new ChartApp();
});