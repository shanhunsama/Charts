// 图表配置和状态管理
class ChartManager {
    constructor() {
        this.chart = null;
        this.currentType = 'line'; // 默认图表类型
        this.data = {
            labels: ['一月', '二月', '三月', '四月', '五月', '六月'],
            datasets: [{
                label: '数据系列',
                data: [65, 59, 80, 81, 56, 55],
                backgroundColor: 'rgba(102, 126, 234, 0.6)',
                borderColor: 'rgba(102, 126, 234, 1)',
                borderWidth: 3,
                tension: 0.4,
                pointRadius: 6,
                pointHoverRadius: 10
            }]
        };
        
        this.init();
    }

    // 初始化图表
    async init() {
        try {
            // 从后端获取初始数据
            await this.fetchInitialData();
            this.createChart();
            this.setupEventListeners();
            this.hideLoading();
        } catch (error) {
            console.error('初始化失败:', error);
            this.showError('图表初始化失败，请检查后端服务');
        }
    }

    // 从后端获取初始数据
    async fetchInitialData() {
        const response = await fetch('/api/chart/data');
        if (!response.ok) {
            throw new Error('获取数据失败');
        }
        const result = await response.json();
        
        if (result.success) {
            this.data = result.data;
            this.currentType = result.chartType || 'line';
        }
    }

    // 创建图表
    createChart() {
        const ctx = document.getElementById('myChart').getContext('2d');
        
        if (this.chart) {
            this.chart.destroy();
        }

        const config = this.getChartConfig();
        this.chart = new Chart(ctx, config);
    }

    // 获取图表配置
    getChartConfig() {
        return {
            type: this.currentType,
            data: this.data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            font: {
                                size: 14,
                                weight: 'bold'
                            },
                            color: '#333'
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: '#667eea',
                        borderWidth: 2,
                        cornerRadius: 8
                    }
                },
                animation: {
                    duration: 1000,
                    easing: 'easeOutQuart'
                },
                scales: this.getScalesConfig()
            }
        };
    }

    // 获取坐标轴配置
    getScalesConfig() {
        if (['pie', 'doughnut', 'polarArea'].includes(this.currentType)) {
            return {};
        }

        if (this.currentType === 'radar') {
            return {
                r: {
                    angleLines: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    },
                    pointLabels: {
                        font: {
                            size: 12
                        }
                    },
                    ticks: {
                        backdropColor: 'transparent'
                    }
                }
            };
        }

        return {
            x: {
                grid: {
                    color: 'rgba(0, 0, 0, 0.1)'
                },
                ticks: {
                    font: {
                        size: 12
                    }
                }
            },
            y: {
                grid: {
                    color: 'rgba(0, 0, 0, 0.1)'
                },
                ticks: {
                    font: {
                        size: 12
                    }
                },
                beginAtZero: true
            }
        };
    }

    // 更新图表数据
    async updateChartData(key, values) {
        this.showLoading();
        
        try {
            const response = await fetch('/api/chart/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    key: key,
                    values: values
                })
            });

            if (!response.ok) {
                throw new Error('更新数据失败');
            }

            const result = await response.json();
            
            if (result.success) {
                this.data = result.data;
                this.chart.data = this.data;
                this.chart.update('active');
                this.hideLoading();
                return true;
            } else {
                throw new Error(result.message || '更新失败');
            }
        } catch (error) {
            console.error('更新数据失败:', error);
            this.showError('数据更新失败');
            this.hideLoading();
            return false;
        }
    }

    // 切换图表类型
    async switchChartType(chartType) {
        this.showLoading();
        
        try {
            const response = await fetch('/api/chart/switch', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    chartType: chartType
                })
            });

            if (!response.ok) {
                throw new Error('切换图表失败');
            }

            const result = await response.json();
            
            if (result.success) {
                this.currentType = chartType;
                this.data = result.data || this.data;
                this.createChart();
                this.hideLoading();
                return true;
            } else {
                throw new Error(result.message || '切换失败');
            }
        } catch (error) {
            console.error('切换图表失败:', error);
            this.showError('图表切换失败');
            this.hideLoading();
            return false;
        }
    }

    // 设置事件监听器
    setupEventListeners() {
        // 键盘快捷键
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey) {
                switch(e.key) {
                    case '1':
                        e.preventDefault();
                        this.switchChartType('line');
                        break;
                    case '2':
                        e.preventDefault();
                        this.switchChartType('bar');
                        break;
                    case '3':
                        e.preventDefault();
                        this.switchChartType('pie');
                        break;
                    case 'r':
                        e.preventDefault();
                        this.generateRandomData();
                        break;
                }
            }
        });

        // 窗口调整大小
        window.addEventListener('resize', () => {
            if (this.chart) {
                setTimeout(() => {
                    this.chart.resize();
                }, 100);
            }
        });

        // 点击图表切换类型（双击切换）
        document.getElementById('myChart').addEventListener('dblclick', (e) => {
            const chartTypes = ['line', 'bar', 'pie', 'doughnut', 'radar', 'polarArea'];
            const currentIndex = chartTypes.indexOf(this.currentType);
            const nextIndex = (currentIndex + 1) % chartTypes.length;
            this.switchChartType(chartTypes[nextIndex]);
        });
    }

    // 生成随机数据（演示用）
    async generateRandomData() {
        const randomValues = Array.from({length: 6}, () => 
            Math.floor(Math.random() * 100) + 1
        );
        await this.updateChartData('data', randomValues);
    }

    // 显示加载动画
    showLoading() {
        document.getElementById('loading').classList.remove('hidden');
    }

    // 隐藏加载动画
    hideLoading() {
        document.getElementById('loading').classList.add('hidden');
    }

    // 显示错误信息
    showError(message) {
        // 简单的错误提示
        alert(message);
    }
}

// 全局图表管理器实例
let chartManager;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    chartManager = new ChartManager();
});

// 全局函数供外部调用
window.updateChart = function(key, values) {
    return chartManager.updateChartData(key, values);
};

window.switchChart = function(chartType) {
    return chartManager.switchChartType(chartType);
};