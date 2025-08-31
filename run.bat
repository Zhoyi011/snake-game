@echo off
chcp 65001 >nul
echo.
echo ==================================================
echo           炫彩贪吃蛇游戏启动器
echo ==================================================
echo.

python --version >nul 2>&1
if errorlevel 1 (
    echo 错误: 未检测到Python，请先安装Python 3.6+
    echo 下载地址: https://www.python.org/downloads/
    pause
    exit /b 1
)

python -c "import flask" >nul 2>&1
if errorlevel 1 (
    echo 正在安装所需的依赖包...
    pip install -r requirements.txt
)

echo 正在启动游戏服务器...
echo.
echo 请勿关闭此窗口，游戏运行中...
echo 在浏览器中访问: http://localhost:5000
echo 按 Ctrl+C 可停止游戏
echo.
echo ==================================================
python app.py
pause