const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { TradingBot } = require('./src/backend/TradingBot.js');
const { StockMonitor } = require('./src/backend/StockMonitor.js');
const { getConfig } = require('./src/backend/utils/config.js');
const { logger } = require('./src/backend/utils/logger.js');

// 保持对窗口对象的全局引用，如果不这样做，当 JavaScript 对象被垃圾回收时，窗口会被自动关闭
let mainWindow;
let tradingBot;
let stockMonitor;

// 重写console方法以捕获日志
function setupLogCapture() {
  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;

  console.log = function(...args) {
    originalLog.apply(console, args);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('bot-log', { 
        level: 'INFO', 
        message: args.join(' ') 
      });
    }
  };

  console.error = function(...args) {
    originalError.apply(console, args);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('bot-log', { 
        level: 'ERROR', 
        message: args.join(' ') 
      });
    }
  };

  console.warn = function(...args) {
    originalWarn.apply(console, args);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('bot-log', { 
        level: 'WARN', 
        message: args.join(' ') 
      });
    }
  };
}

// 拦截logger的日志输出
function setupLoggerCapture() {
  const originalInfo = logger.info;
  const originalError = logger.error;
  const originalWarn = logger.warn;
  const originalDebug = logger.debug;

  logger.info = function(message, ...args) {
    originalInfo.call(logger, message, ...args);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('bot-log', { 
        level: 'INFO', 
        message: typeof message === 'string' ? message : JSON.stringify(message)
      });
    }
  };

  logger.error = function(message, ...args) {
    originalError.call(logger, message, ...args);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('bot-log', { 
        level: 'ERROR', 
        message: typeof message === 'string' ? message : JSON.stringify(message)
      });
    }
  };

  logger.warn = function(message, ...args) {
    originalWarn.call(logger, message, ...args);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('bot-log', { 
        level: 'WARN', 
        message: typeof message === 'string' ? message : JSON.stringify(message)
      });
    }
  };

  logger.debug = function(message, ...args) {
    originalDebug.call(logger, message, ...args);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('bot-log', { 
        level: 'DEBUG', 
        message: typeof message === 'string' ? message : JSON.stringify(message)
      });
    }
  };
}

function createWindow() {
  // 创建浏览器窗口
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    },
    icon: path.join(__dirname, 'assets/icon.png') // 如果有图标的话
  });

  // 设置日志捕获
  setupLogCapture();
  setupLoggerCapture();

  // 加载应用的 index.html
  mainWindow.loadFile(path.join(__dirname, 'src/frontend/index.html')).catch((err) => {
    console.error('无法加载前端页面:', err);
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

// 获取配置
ipcMain.on('get-config', (event) => {
  try {
    const config = getConfig();
    // 只发送通知相关的配置信息
    const safeConfig = {
      ENABLE_EMAIL_NOTIFICATION: config.ENABLE_EMAIL_NOTIFICATION,
      ENABLE_NTFY_NOTIFICATION: config.ENABLE_NTFY_NOTIFICATION,
      ENABLE_WECOM_NOTIFICATION: config.ENABLE_WECOM_NOTIFICATION,
      NOTIFICATION_EMAIL_TO: config.NOTIFICATION_EMAIL_TO,
      NTFY_TOPIC: config.NTFY_TOPIC,
      WECOM_WEBHOOK_URL: config.WECOM_WEBHOOK_URL ? '已配置' : '未配置'
    };
    event.reply('bot-config', safeConfig);
  } catch (error) {
    console.error('获取配置失败:', error);
    event.reply('bot-error', error.message);
  }
});

// ============================================================================
// 股票监控相关 IPC 处理
// ============================================================================

// 启动股票监控
ipcMain.on('start-stock-monitor', async (event) => {
  try {
    if (!stockMonitor) {
      stockMonitor = new StockMonitor(mainWindow); // 传入主窗口引用
    } else {
      stockMonitor.setMainWindow(mainWindow); // 设置主窗口引用
    }
    await stockMonitor.start();
    event.reply('stock-monitor-status', stockMonitor.getStatus());
  } catch (error) {
    console.error('启动股票监控失败:', error);
    event.reply('stock-monitor-error', error.message);
  }
});

// 停止股票监控
ipcMain.on('stop-stock-monitor', (event) => {
  try {
    if (stockMonitor) {
      stockMonitor.stop();
    }
    event.reply('stock-monitor-status', stockMonitor ? stockMonitor.getStatus() : { isRunning: false });
  } catch (error) {
    console.error('停止股票监控失败:', error);
    event.reply('stock-monitor-error', error.message);
  }
});

// 获取股票监控状态
ipcMain.on('get-stock-monitor-status', (event) => {
  try {
    const status = stockMonitor ? stockMonitor.getStatus() : { isRunning: false, monitoredStocks: [] };
    event.reply('stock-monitor-status', status);
  } catch (error) {
    console.error('获取股票监控状态失败:', error);
    event.reply('stock-monitor-error', error.message);
  }
});

// 添加监控股票
ipcMain.on('add-stock', (event, stock) => {
  try {
    if (!stockMonitor) {
      stockMonitor = new StockMonitor();
    }
    stockMonitor.addStock(stock);
    event.reply('stock-monitor-status', stockMonitor.getStatus());
  } catch (error) {
    console.error('添加监控股票失败:', error);
    event.reply('stock-monitor-error', error.message);
  }
});

// 移除监控股票
ipcMain.on('remove-stock', (event, symbol) => {
  try {
    if (stockMonitor) {
      stockMonitor.removeStock(symbol);
      event.reply('stock-monitor-status', stockMonitor.getStatus());
    }
  } catch (error) {
    console.error('移除监控股票失败:', error);
    event.reply('stock-monitor-error', error.message);
  }
});
