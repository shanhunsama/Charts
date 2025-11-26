from flask import Flask, request, jsonify
import random

app = Flask(__name__)

# 当前数据状态
current_data = [65, 59, 80, 81, 56, 55]
current_chart_type = 'line'

@app.route('/')
def index():
    """服务HTML页面"""
    with open('index.html', 'r', encoding='utf-8') as f:
        return f.read()

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
    app.run(debug=True, host='127.0.0.1', port=5000)