class ChartApp {
    constructor() {
        this.chart = null;
        this.currentType = 'line';
        this.currentData = { values: [], labels: [] };
        this.controlPanel = null;
        this.chartError = null;
        this.ueStatus = null;
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
            this.setupUEConnection();
            
            // 设置全局实例供UE调用
            if (typeof window.setChartAppInstance === 'function') {
                window.setChartAppInstance(this);
            }
        } catch (error) {
            this.showChartError('图表初始化失败: ' + error.message);
        }
    }

    // 设置UE连接状态显示
    setupUEConnection() {
        this.ueStatus = document.getElementById('ueStatus');
        if (this.ueStatus) {
            this.ueStatus.style.display = 'block';
            this.updateUEStatus('已连接', new Date().toLocaleTimeString());
        }
        
        // 检查UE接口是否可用
        if (typeof ue !== 'undefined' && typeof ue.interface !== 'undefined') {
            console.log('UE接口已连接');
        } else {
            console.warn('UE接口未连接，将使用本地模式');
            this.updateUEStatus('未连接', '-');
        }
    }

    // 更新UE状态显示
    updateUEStatus(status, lastUpdate) {
        if (this.ueStatus) {
            const statusElement = document.getElementById('ueConnectionStatus');
            const timeElement = document.getElementById('lastUpdateTime');
            
            if (statusElement) statusElement.textContent = status;
            if (timeElement) timeElement.textContent = lastUpdate;
        }
    }

    // 从UE更新数据的方法
    updateDataFromUE(ueData) {
        console.log('从UE接收数据:', ueData);
        
        try {
            // 支持多种数据格式
            if (ueData.values && Array.isArray(ueData.values)) {
                // 标准格式：包含values和labels的对象
                this.currentData = {
                    values: ueData.values,
                    labels: ueData.labels || ueData.values.map((_, index) => `数据${index + 1}`)
                };
            } else if (Array.isArray(ueData)) {
                // 简单数组格式
                this.currentData = {
                    values: ueData,
                    labels: ueData.map((_, index) => `数据${index + 1}`)
                };
            } else if (ueData.data && Array.isArray(ueData.data)) {
                // 嵌套数据格式
                this.currentData = {
                    values: ueData.data,
                    labels: ueData.labels || ueData.data.map((_, index) => `数据${index + 1}`)
                };
            } else {
                throw new Error('不支持的数据格式');
            }
            
            // 更新图表
            this.updateChart();
            
            // 更新状态显示
            this.updateUEStatus('已连接', new Date().toLocaleTimeString());
            
            console.log('UE数据更新成功，数据点数量:', this.currentData.values.length);
            
        } catch (error) {
            console.error('处理UE数据时发生错误:', error);
            this.showChartError('UE数据更新失败: ' + error.message);
        }
    }

    // 修改switchChartType方法，移除HTTP请求
    async switchChartType(type) {
        try {
            // 直接切换图表类型
            this.currentType = type;
            this.updateTypeButtons();
            this.createChart();
            this.updateUEStatus('已连接', new Date().toLocaleTimeString());
            
        } catch (error) {
            console.error('切换图表类型失败:', error);
            this.showChartError('图表类型切换失败: ' + error.message);
        }
    }

    // 修改updateData方法，移除HTTP请求
    async updateData(ueData) {
        // 如果提供了UE数据，直接使用
        if (ueData) {
            this.updateDataFromUE(ueData);
            return;
        }
        
        // 使用本地随机数据生成逻辑
        try {
            // 生成随机数据
            const dataCount = 6;
            const randomValues = Array.from({length: dataCount}, () => Math.floor(Math.random() * 100));
            const randomLabels = randomValues.map((_, index) => `数据${index + 1}`);
            
            this.currentData = {
                values: randomValues,
                labels: randomLabels
            };
            
            this.updateChart();
            
        } catch (error) {
            console.error('更新数据失败:', error);
            this.showChartError('数据更新失败: ' + error.message);
        }
    }

    // 修改loadConfig方法，移除HTTP请求
    async loadConfig() {
        try {
            // 使用本地默认配置
            this.currentType = 'line';
            this.currentData = {
                values: [65, 59, 80, 81, 56, 55],
                labels: ['数据1', '数据2', '数据3', '数据4', '数据5', '数据6']
            };
            
        } catch (error) {
            console.error('加载配置失败:', error);
            this.currentData = {
                values: [65, 59, 80, 81, 56, 55],
                labels: ['数据1', '数据2', '数据3', '数据4', '数据5', '数据6']
            };
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
                    labels: this.currentData.labels.length > 0 ? 
                           this.currentData.labels : 
                           this.currentData.values.map((_, index) => `数据${index + 1}`),
                    datasets: [{
                        label: '图表数据',
                        data: this.currentData.values,
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
                            text: '历史数据',
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
            this.hideChartError();
            
        } catch (error) {
            this.showChartError('图表创建失败: ' + error.message);
        }
    }

    updateChart() {
        if (this.chart) {
            this.chart.data.labels = this.currentData.labels.length > 0 ? 
                                   this.currentData.labels : 
                                   this.currentData.values.map((_, index) => `数据${index + 1}`);
            this.chart.data.datasets[0].data = this.currentData.values;
            this.chart.update();
        }
    }

    // 其他原有方法保持不变...
    showChartError(message) {
        if (!this.chartError) {
            this.chartError = document.getElementById('chartError');
            if (!this.chartError) return;
            
            const retryBtn = document.getElementById('retryChart');
            if (retryBtn) {
                retryBtn.onclick = () => {
                    location.reload();
                };
            }
        }
        
        const errorContent = this.chartError.querySelector('.error-content');
        if (errorContent) {
            const h3 = errorContent.querySelector('h3');
            if (h3) h3.textContent = '图表加载失败';
            
            const p = errorContent.querySelector('p');
            if (p) p.textContent = message || '图表加载过程中出现错误';
        }
        
        this.chartError.style.display = 'flex';
        
        const chartContainer = document.querySelector('.chart-container');
        if (chartContainer) {
            chartContainer.style.display = 'none';
        }
    }

    hideChartError() {
        if (this.chartError) {
            this.chartError.style.display = 'none';
        }
        
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
        
        return this.currentData.values.map((_, index) => colors[index % colors.length]);
    }

    setupControls() {
        this.controlPanel = document.getElementById('controlPanel');
        const toggleBtn = document.getElementById('controlToggle');
        const closeBtn = document.getElementById('closePanel');
        const randomBtn = document.getElementById('randomData');
        const updateBtn = document.getElementById('updateChart');
        
        toggleBtn.addEventListener('click', () => {
            this.controlPanel.classList.toggle('active');
        });
        
        closeBtn.addEventListener('click', () => {
            this.controlPanel.classList.remove('active');
        });
        
        document.addEventListener('click', (e) => {
            if (!this.controlPanel.contains(e.target) && 
                !toggleBtn.contains(e.target) && 
                this.controlPanel.classList.contains('active')) {
                this.controlPanel.classList.remove('active');
            }
        });
        
        const typeButtons = document.querySelectorAll('.type-btn');
        typeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const type = btn.dataset.type;
                this.switchChartType(type);
            });
        });
        
        randomBtn.addEventListener('click', () => {
            this.updateData();
        });
        
        updateBtn.addEventListener('click', () => {
            this.updateChart();
        });
        
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
    window.addEventListener('error', (event) => {
        if (event.error && event.error.message.includes('Chart')) {
            console.error('全局图表错误:', event.error);
        }
    });
    
    new ChartApp();
});