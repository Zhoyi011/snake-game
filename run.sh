#!/bin/bash

echo ""
echo "=================================================="
echo "           炫彩贪吃蛇游戏启动器"
echo "=================================================="
echo ""

if ! command -v python3 &> /dev/null; then
    echo "错误: 未检测到Python3，请先安装Python 3.6+"
    echo "下载地址: https://www.python.org/downloads/"
    exit 1
fi

if ! python3 -c "import flask" &> /dev/null; then
    echo "正在安装所需的依赖包..."
    pip3 install -r requirements.txt
fi

echo "正在启动游戏服务器..."
echo ""
echo "请勿关闭此窗口，游戏运行中..."
echo "在浏览器中访问: http://localhost:5000"
echo "按 Ctrl+C 可停止游戏"
echo ""
echo "=================================================="
python3 app.py