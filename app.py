from flask import Flask, request, jsonify, send_from_directory
import os
import random

app = Flask(__name__)

# 当前数据状态 - 修改为支持键值对数据
current_data = {
    'values': [65, 59, 80, 81, 56, 55],
    'labels': ['1月', '2月', '3月', '4月', '5月', '6月']
}
current_chart_type = 'line'

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
            'chart_type': current_chart_type,
            'data': current_data
        }
    })

@app.route('/api/update', methods=['POST'])
def update_data():
    """更新图表数据 - 支持键值对数据"""
    global current_data
    
    try:
        data = request.get_json()
        new_values = data.get('values', [])
        new_labels = data.get('labels', [])
        
        # 验证数据格式
        if new_values and new_labels:
            if len(new_values) != len(new_labels):
                return jsonify({
                    'success': False,
                    'error': 'values和labels数组长度必须一致'
                })
            
            current_data = {
                'values': new_values,
                'labels': new_labels
            }
        elif new_values:
            # 如果只提供了values，使用默认标签
            current_data = {
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
    """生成随机数据 - 更新为支持键值对格式"""
    global current_data
    
    try:
        # 生成随机数据和标签
        values = [random.randint(-100, 100) for _ in range(6)]
        labels = [f'第{i+1}季度' for i in range(6)]
        
        current_data = {
            'values': values,
            'labels': labels
        }
        
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