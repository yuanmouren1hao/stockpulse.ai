const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { TradingBot } = require('./src/backend/TradingBot.js');

// 保持对窗口对象的全局引用，如果不这样做，当 JavaScript 对象被垃圾回收时，窗口会被自动关闭
let mainWindow;
let tradingBot;

function createWindow() {
  // 创建浏览器窗口
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    },
    icon: path.join(__dirname, 'assets/icon.png') // 如果有图标的话
  });

  // 加载应用的 index.html
  // 目前先显示一个简单的页面
  mainWindow.loadFile(path.join(__dirname, 'src/frontend/index.html')).catch(() => {
    // 如果没有前端文件，创建一个简单的欢迎页面
    mainWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>StockPulse.AI - 加密货币交易机器人</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 20px; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-align: center;
          }
          .container { 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 40px;
            background: rgba(255,255,255,0.1);
            border-radius: 15px;
            backdrop-filter: blur(10px);
          }
          h1 { font-size: 2.5em; margin-bottom: 20px; }
          .status { 
            background: rgba(255,255,255,0.2); 
            padding: 20px; 
            border-radius: 10px; 
            margin: 20px 0;
          }
          button {
            background: #4CAF50;
            color: white;
            border: none;
            padding: 15px 30px;
            font-size: 16px;
            border-radius: 5px;
            cursor: pointer;
            margin: 10px;
          }
          button:hover { background: #45a049; }
          button:disabled { background: #cccccc; cursor: not-allowed; }
          .stop { background: #f44336; }
          .stop:hover { background: #da190b; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🚀 StockPulse.AI</h1>
          <h2>AI驱动的加密货币交易机器人</h2>
          
          <div class="status">
            <h3>机器人状态</h3>
            <p id="status">未启动</p>
            <p id="details">点击下方按钮启动交易机器人</p>
          </div>
          
          <div>
            <button id="startBtn" onclick="startBot()">启动机器人</button>
            <button id="stopBtn" onclick="stopBot()" disabled>停止机器人</button>
            <button onclick="getStatus()">刷新状态</button>
          </div>
          
          <div class="status">
            <h3>功能特性</h3>
            <ul style="text-align: left; display: inline-block;">
              <li>🔄 实时价格监控 (Binance, OKX, Huobi)</li>
              <li>🤖 AI智能分析 (DeepSeek)</li>
              <li>📊 技术指标计算 (RSI, MACD, 布林带等)</li>
              <li>📧 邮件和推送通知</li>
              <li>💾 数据存储和历史记录</li>
              <li>⚡ 自动化交易信号生成</li>
            </ul>
          </div>
        </div>
        
        <script>
          const { ipcRenderer } = require('electron');
          
          function startBot() {
            ipcRenderer.send('start-bot');
            document.getElementById('startBtn').disabled = true;
            document.getElementById('status').textContent = '启动中...';
          }
          
          function stopBot() {
            ipcRenderer.send('stop-bot');
            document.getElementById('stopBtn').disabled = true;
            document.getElementById('status').textContent = '停止中...';
          }
          
          function getStatus() {
            ipcRenderer.send('get-status');
          }
          
          // 监听来自主进程的消息
          ipcRenderer.on('bot-status', (event, status) => {
            document.getElementById('status').textContent = status.isRunning ? '运行中' : '已停止';
            document.getElementById('details').textContent = status.isRunning 
              ? \`监控交易对: \${status.monitoredSymbols?.join(', ') || '无'}\` 
              : '机器人已停止';
            document.getElementById('startBtn').disabled = status.isRunning;
            document.getElementById('stopBtn').disabled = !status.isRunning;
          });
          
          ipcRenderer.on('bot-error', (event, error) => {
            document.getElementById('status').textContent = '错误';
            document.getElementById('details').textContent = error;
            document.getElementById('startBtn').disabled = false;
            document.getElementById('stopBtn').disabled = true;
          });
          
          // 页面加载时获取状态
          window.onload = () => getStatus();
        </script>
      </body>
      </html>
    `));
  });

  // 自动打开开发者工具（调试面板）
  // 在开发环境或设置了 DEBUG 环境变量时打开
  if (process.env.NODE_ENV === 'development' || process.env.DEBUG === 'true') {
    mainWindow.webContents.openDevTools();
  }

  // 当 window 被关闭，这个事件会被触发
  mainWindow.on('closed', () => {
    // 取消引用 window 对象，如果你的应用支持多窗口的话，通常会把多个 window 对象存放在一个数组里面，与此同时，你应该删除相应的元素
    mainWindow = null;
  });
}

// Electron 会在初始化后并准备创建浏览器窗口时，调用这个函数
app.whenReady().then(createWindow);

// 当全部窗口关闭时退出
app.on('window-all-closed', () => {
  // 在 macOS 上，除非用户用 Cmd + Q 确定地退出，否则绝大部分应用及其菜单栏会保持激活
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // 在macOS上，当单击dock图标并且没有其他窗口打开时，通常在应用程序中重新创建一个窗口
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC 通信处理
ipcMain.on('start-bot', async (event) => {
  try {
    if (!tradingBot) {
      tradingBot = new TradingBot();
    }
    await tradingBot.start();
    event.reply('bot-status', tradingBot.getStatus());
  } catch (error) {
    console.error('启动机器人失败:', error);
    event.reply('bot-error', error.message);
  }
});

ipcMain.on('stop-bot', (event) => {
  try {
    if (tradingBot) {
      tradingBot.stop();
    }
    event.reply('bot-status', tradingBot ? tradingBot.getStatus() : { isRunning: false });
  } catch (error) {
    console.error('停止机器人失败:', error);
    event.reply('bot-error', error.message);
  }
});

ipcMain.on('get-status', (event) => {
  try {
    const status = tradingBot ? tradingBot.getStatus() : { isRunning: false, monitoredSymbols: [] };
    event.reply('bot-status', status);
  } catch (error) {
    console.error('获取状态失败:', error);
    event.reply('bot-error', error.message);
  }
});