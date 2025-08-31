from flask import Flask, render_template
import os

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

if __name__ == '__main__':
    current_dir = os.path.dirname(os.path.abspath(__file__))
    print("=" * 50)
    print("炫彩贪吃蛇游戏已启动!")
    print("请在浏览器中访问: http://localhost:5000")
    print("按 Ctrl+C 停止游戏")
    print("=" * 50)
    app.run(debug=True, host='0.0.0.0', port=5000)