from flask import Flask, request, jsonify, send_from_directory
import os
import random

app = Flask(__name__)

# 当前数据状态
current_data = [65, 59, 80, 81, 56, 55]
current_chart_type = 'line'
# 拖拽功能开关 - 默认为启用
drag_enabled = True

@app.route('/')
def index():
    """服务HTML页面"""
    return send_from_directory('.', 'index.html')

@app.route('/styles/<path:filename>')
def serve_styles(filename):
    """服务样式文件"""
    return send_from_directory('styles', filename)

@app.route('/scripts/<path:filename>')
def serve_scripts(filename):
    """服务脚本文件"""
    return send_from_directory('scripts', filename)

@app.route('/api/config', methods=['GET'])
def get_config():
    """获取应用配置"""
    return jsonify({
        'success': True,
        'config': {
            'drag_enabled': drag_enabled,
            'chart_type': current_chart_type,
            'data': current_data
        }
    })

@app.route('/api/config/drag', methods=['POST'])
def toggle_drag():
    """切换拖拽功能开关"""
    global drag_enabled
    
    try:
        data = request.get_json()
        enabled = data.get('enabled')
        
        if enabled is not None:
            drag_enabled = bool(enabled)
        
        return jsonify({
            'success': True,
            'drag_enabled': drag_enabled
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        })

@app.route('/api/update', methods=['POST'])
def update_data():
    """更新图表数据"""
    global current_data
    
    try:
        data = request.get_json()
        new_data = data.get('data', [])
        
        if new_data:
            current_data = new_data
        
        return jsonify({
            'success': True,
            'data': current_data
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        })

@app.route('/api/switch', methods=['POST'])
def switch_chart():
    """切换图表类型"""
    global current_chart_type
    
    try:
        data = request.get_json()
        chart_type = data.get('type', 'line')
        
        valid_types = ['line', 'bar', 'pie']
        if chart_type in valid_types:
            current_chart_type = chart_type
        
        return jsonify({
            'success': True,
            'type': current_chart_type
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        })

@app.route('/api/random', methods=['POST'])
def random_data():
    """生成随机数据"""
    global current_data
    
    try:
        current_data = [random.randint(10, 100) for _ in range(6)]
        
        return jsonify({
            'success': True,
            'data': current_data
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        })

if __name__ == '__main__':
    # 确保必要的目录存在
    os.makedirs('styles', exist_ok=True)
    os.makedirs('scripts', exist_ok=True)
    
    app.run(debug=True, host='127.0.0.1', port=5000)