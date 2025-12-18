from flask import Flask, request, jsonify, send_from_directory
import os
import random
import threading
import webbrowser
import sys
import atexit
import signal
import socket
import time
import json
import configparser  # 新增INI配置文件支持

def get_resource_path(relative_path):
    """获取资源文件的正确路径（支持打包后运行）"""
    if hasattr(sys, '_MEIPASS'):
        # PyInstaller打包后的路径
        base_path = sys._MEIPASS
    else:
        # 开发环境路径
        base_path = os.path.dirname(os.path.abspath(__file__))
    return os.path.join(base_path, relative_path)

class ChartServer:
    def __init__(self, host='127.0.0.1', preferred_port=5000):
        self.app = Flask(__name__)
        self.host = host
        self.preferred_port = preferred_port
        self.actual_port = preferred_port  # 实际使用的端口
        self.server_thread = None
        self.is_running = False
        self.info_file = 'chart_server_info.ini'  # 改为INI格式
        
        # 当前数据状态
        self.current_data = {
            'values': [65, 59, 80, 81, 56, 55],
            'labels': ['1月', '2月', '3月', '4月', '5月', '6月']
        }
        self.current_chart_type = 'line'
        
        # 注册退出时的清理函数
        atexit.register(self.cleanup)
        signal.signal(signal.SIGINT, self.signal_handler)
        signal.signal(signal.SIGTERM, self.signal_handler)
        
        self.setup_routes()
    
    def signal_handler(self, signum, frame):
        """信号处理函数"""
        print(f"\n收到信号 {signum}，正在关闭服务器...")
        self.cleanup()
        sys.exit(0)
    
    def setup_routes(self):
        @self.app.route('/')
        def index():
            return send_from_directory(get_resource_path('.'), 'index.html')
        
        @self.app.route('/styles/<path:filename>')
        def serve_styles(filename):
            return send_from_directory(get_resource_path('styles'), filename)
        
        @self.app.route('/scripts/<path:filename>')
        def serve_scripts(filename):
            return send_from_directory(get_resource_path('scripts'), filename)
        
        @self.app.route('/api/status', methods=['GET'])
        def get_status():
            return jsonify({
                'success': True,
                'status': 'running',
                'host': self.host,
                'preferred_port': self.preferred_port,
                'actual_port': self.actual_port,
                'url': f'http://{self.host}:{self.actual_port}'
            })
        
        @self.app.route('/api/config', methods=['GET'])
        def get_config():
            return jsonify({
                'success': True,
                'config': {
                    'chart_type': self.current_chart_type,
                    'data': self.current_data
                }
            })
        
        @self.app.route('/api/update', methods=['POST'])
        def update_data():
            try:
                data = request.get_json()
                new_values = data.get('values', [])
                new_labels = data.get('labels', [])
                
                if new_values and new_labels:
                    if len(new_values) != len(new_labels):
                        return jsonify({
                            'success': False,
                            'error': 'values和labels数组长度必须一致'
                        })
                    
                    self.current_data = {
                        'values': new_values,
                        'labels': new_labels
                    }
                elif new_values:
                    self.current_data = {
                        'values': new_values,
                        'labels': [f'数据{i+1}' for i in range(len(new_values))]
                    }
                else:
                    return jsonify({
                        'success': False,
                        'error': '必须提供values数据'
                    })
                
                return jsonify({
                    'success': True,
                    'data': self.current_data
                })
            except Exception as e:
                return jsonify({
                    'success': False,
                    'error': str(e)
                })
        
        @self.app.route('/api/switch', methods=['POST'])
        def switch_chart():
            try:
                data = request.get_json()
                chart_type = data.get('type', 'line')
                
                valid_types = ['line', 'bar', 'pie']
                if chart_type in valid_types:
                    self.current_chart_type = chart_type
                
                return jsonify({
                    'success': True,
                    'type': self.current_chart_type
                })
            except Exception as e:
                return jsonify({
                    'success': False,
                    'error': str(e)
                })
        
        @self.app.route('/api/random', methods=['POST'])
        def random_data():
            try:
                values = [random.randint(-100, 100) for _ in range(60)]
                labels = [f'第{i+1}季度' for i in range(60)]
                
                self.current_data = {
                    'values': values,
                    'labels': labels
                }
                
                return jsonify({
                    'success': True,
                    'data': self.current_data
                })
            except Exception as e:
                return jsonify({
                    'success': False,
                    'error': str(e)
                })
        
        @self.app.route('/api/shutdown', methods=['POST'])
        def shutdown():
            """优雅关闭服务器"""
            def shutdown_server():
                import os
                import signal
                os.kill(os.getpid(), signal.SIGINT)
            
            threading.Thread(target=shutdown_server).start()
            return jsonify({'success': True, 'message': '服务器正在关闭'})
    
    def find_available_port(self, start_port=None, max_port=6000):
        """查找可用的端口"""
        if start_port is None:
            start_port = self.preferred_port
        
        # 先尝试首选端口
        if self._check_port_available(start_port):
            return start_port
        
        # 首选端口被占用，查找其他可用端口
        print(f"端口 {start_port} 被占用，正在查找可用端口...")
        for port in range(start_port + 1, max_port + 1):
            if self._check_port_available(port):
                print(f"找到可用端口: {port}")
                return port
        
        # 如果没有找到可用端口，返回首选端口（会启动失败）
        print(f"在端口范围 {start_port}-{max_port} 内未找到可用端口")
        return start_port
    
    def create_info_file(self):
        """创建端口信息文件（INI格式）"""
        config = configparser.ConfigParser()
        
        # 服务器信息部分
        config['Server'] = {
            'host': self.host,
            'preferred_port': str(self.preferred_port),
            'actual_port': str(self.actual_port),
            'url': f'http://{self.host}:{self.actual_port}',
            'pid': str(os.getpid()),
            'start_time': str(time.time()),
            'status': 'running'
        }
        
        # API接口部分
        config['APIs'] = {
            'status': '/api/status',
            'config': '/api/config',
            'update': '/api/update',
            'switch': '/api/switch',
            'random': '/api/random'
        }
        
        # 当前数据状态部分
        config['Data'] = {
            'chart_type': self.current_chart_type,
            'values': ','.join(map(str, self.current_data['values'])),
            'labels': ','.join(self.current_data['labels'])
        }
        
        try:
            with open(self.info_file, 'w', encoding='utf-8') as f:
                config.write(f)
            print(f"端口信息已保存到: {self.info_file}")
            return True
        except Exception as e:
            print(f"创建端口信息文件失败: {e}")
            return False
    
    def read_info_file(self):
        """读取端口信息文件（INI格式）"""
        try:
            if os.path.exists(self.info_file):
                config = configparser.ConfigParser()
                config.read(self.info_file, encoding='utf-8')
                
                info = {}
                
                # 读取服务器信息
                if config.has_section('Server'):
                    info.update(dict(config.items('Server')))
                
                # 读取API信息
                if config.has_section('APIs'):
                    info['apis'] = dict(config.items('APIs'))
                
                # 读取数据信息
                if config.has_section('Data'):
                    data_info = dict(config.items('Data'))
                    # 转换数据类型
                    if 'values' in data_info:
                        info['values'] = [float(x) for x in data_info['values'].split(',')]
                    if 'labels' in data_info:
                        info['labels'] = data_info['labels'].split(',')
                    if 'chart_type' in data_info:
                        info['chart_type'] = data_info['chart_type']
                
                return info
        except Exception as e:
            print(f"读取端口信息文件失败: {e}")
        return None
    
    def cleanup(self):
        """清理函数：删除端口信息文件"""
        try:
            if os.path.exists(self.info_file):
                os.remove(self.info_file)
                print(f"已清理端口信息文件: {self.info_file}")
        except Exception as e:
            print(f"清理端口信息文件失败: {e}")
    
    def _check_port_available(self, port):
        """检查指定端口是否可用"""
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.settimeout(1)
                result = s.connect_ex((self.host, port))
                return result != 0  # 0表示端口被占用
        except:
            return False
    
    def start(self, open_browser=False, create_info_file=True):
        """启动服务器"""
        if self.is_running:
            return {'success': False, 'error': '服务器已在运行'}
        
        # 查找可用端口
        self.actual_port = self.find_available_port()
        
        # 检查最终选择的端口是否可用
        if not self._check_port_available(self.actual_port):
            return {'success': False, 'error': f'端口 {self.actual_port} 已被占用'}
        
        def run_server():
            self.is_running = True
            try:
                self.app.run(
                    host=self.host, 
                    port=self.actual_port, 
                    debug=False, 
                    use_reloader=False
                )
            except Exception as e:
                print(f"服务器运行错误: {e}")
            finally:
                self.is_running = False
        
        self.server_thread = threading.Thread(target=run_server, daemon=True)
        self.server_thread.start()
        
        # 等待服务器启动
        time.sleep(2)
        
        # 检查服务器是否成功启动
        if not self._check_server_running():
            self.is_running = False
            return {'success': False, 'error': '服务器启动失败'}
        
        # 创建端口信息文件
        if create_info_file:
            self.create_info_file()
        
        if open_browser:
            webbrowser.open(f'http://{self.host}:{self.actual_port}')
        
        return {
            'success': True, 
            'message': f'服务器已启动在 http://{self.host}:{self.actual_port}',
            'preferred_port': self.preferred_port,
            'actual_port': self.actual_port,
            'url': f'http://{self.host}:{self.actual_port}',
            'info_file': self.info_file if create_info_file else None
        }
    
    def _check_server_running(self):
        """检查服务器是否在运行"""
        try:
            import requests
            response = requests.get(f'http://{self.host}:{self.actual_port}/api/status', timeout=2)
            return response.status_code == 200
        except:
            return False
    
    def stop(self):
        """停止服务器"""
        if not self.is_running:
            return {'success': False, 'error': '服务器未运行'}
        
        # 发送关闭请求
        try:
            import requests
            requests.post(f'http://{self.host}:{self.actual_port}/api/shutdown', timeout=2)
        except:
            pass
        
        # 等待服务器停止
        for i in range(5):
            if not self.is_running:
                break
            time.sleep(1)
        
        self.is_running = False
        self.cleanup()
        return {'success': True, 'message': '服务器已停止'}

def main():
    """主函数"""
    import argparse
    
    parser = argparse.ArgumentParser(description='图表服务器 - UE插件专用版')
    parser.add_argument('--host', default='127.0.0.1', help='服务器主机')
    parser.add_argument('--port', type=int, default=5000, help='首选服务器端口（默认5000）')
    parser.add_argument('--max-port', type=int, default=6000, help='最大端口号（默认6000）')
    parser.add_argument('--browser', action='store_true', help='启动后打开浏览器')
    parser.add_argument('--stop', action='store_true', help='停止服务器')
    parser.add_argument('--no-info-file', action='store_true', help='不创建端口信息文件')
    # 移除--no-info-file参数，因为不再使用配置文件
    
    args = parser.parse_args()
    
    # 创建服务器实例
    server = ChartServer(host=args.host, preferred_port=args.port)
    
    if args.stop:
        # 停止服务器
        result = server.stop()
        print(result.get('message', '操作完成'))
    else:
        # 启动服务器
        create_info_file = not args.no_info_file
        result = server.start(open_browser=args.browser, create_info_file=create_info_file)
        
        if result['success']:
            print("=" * 50)
            print(f"首选端口: {result['preferred_port']}")
            print(f"实际端口: {result['actual_port']}")
            print(result['message'])
            if create_info_file:
                print(f"端口信息文件: {server.info_file}")
            print("=" * 50)
            print("服务器运行中...")
            print("按 Ctrl+C 停止服务器")
            
            try:
                # 保持主线程运行
                while server.is_running:
                    time.sleep(1)
            except KeyboardInterrupt:
                print("\n正在停止服务器...")
                server.stop()
        else:
            print("启动失败:", result.get('error', '未知错误'))
            sys.exit(1)

if __name__ == "__main__":
    main()