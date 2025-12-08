from flask import Flask, request, jsonify, send_from_directory
import os
import random
import threading
import webbrowser
import sys

class ChartServer:
    def __init__(self, host='127.0.0.1', port=5000):
        self.app = Flask(__name__)
        self.host = host
        self.port = port
        self.server_thread = None
        self.is_running = False
        
        # 当前数据状态
        self.current_data = {
            'values': [65, 59, 80, 81, 56, 55],
            'labels': ['1月', '2月', '3月', '4月', '5月', '6月']
        }
        self.current_chart_type = 'line'
        
        self.setup_routes()
    
    def setup_routes(self):
        @self.app.route('/')
        def index():
            return send_from_directory('.', 'index.html')
        
        @self.app.route('/styles/<path:filename>')
        def serve_styles(filename):
            return send_from_directory('styles', filename)
        
        @self.app.route('/scripts/<path:filename>')
        def serve_scripts(filename):
            return send_from_directory('scripts', filename)
        
        @self.app.route('/api/status', methods=['GET'])
        def get_status():
            return jsonify({
                'success': True,
                'status': 'running',
                'host': self.host,
                'port': self.port
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
    
    def start(self, open_browser=False):
        """启动服务器"""
        if self.is_running:
            return {'success': False, 'error': '服务器已在运行'}
        
        def run_server():
            self.is_running = True
            self.app.run(
                host=self.host, 
                port=self.port, 
                debug=False, 
                use_reloader=False
            )
            self.is_running = False
        
        self.server_thread = threading.Thread(target=run_server, daemon=True)
        self.server_thread.start()
        
        # 等待服务器启动
        import time
        time.sleep(2)
        
        if open_browser:
            webbrowser.open(f'http://{self.host}:{self.port}')
        
        return {
            'success': True, 
            'message': f'服务器已启动在 http://{self.host}:{self.port}',
            'url': f'http://{self.host}:{self.port}'
        }
    
    def stop(self):
        """停止服务器"""
        if not self.is_running:
            return {'success': False, 'error': '服务器未运行'}
        
        # 发送关闭请求
        import requests
        try:
            requests.post(f'http://{self.host}:{self.port}/api/shutdown', timeout=2)
        except:
            pass
        
        self.is_running = False
        return {'success': True, 'message': '服务器已停止'}

# 命令行接口
def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='图表服务器')
    parser.add_argument('--host', default='127.0.0.1', help='服务器主机')
    parser.add_argument('--port', type=int, default=5000, help='服务器端口')
    parser.add_argument('--open-browser', action='store_true', help='自动打开浏览器')
    parser.add_argument('--stop', action='store_true', help='停止服务器')
    
    args = parser.parse_args()
    
    server = ChartServer(args.host, args.port)
    
    if args.stop:
        result = server.stop()
        print(result.get('message', '操作完成'))
    else:
        result = server.start(args.open_browser)
        print(result.get('message', '操作完成'))
        
        if result['success']:
            try:
                # 保持服务器运行
                while server.is_running:
                    import time
                    time.sleep(1)
            except KeyboardInterrupt:
                server.stop()
                print('服务器已停止')

if __name__ == '__main__':
    main()