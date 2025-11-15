/**
 * @file constants.js
 * @description 定义了整个应用中使用的常量，包括交易所名称、交易策略信号、K线时间周期、技术指标、系统配置等。
 *              这些常量有助于提高代码的可读性、可维护性和减少硬编码。
 */

// 1. 交易所名称常量
// 定义了系统支持的虚拟币交易所名称，这些名称将用于API集成和数据标识。
const EXCHANGES = {
  BINANCE: 'binance',
  OKX: 'okx',
  HUOBI: 'huobi',
  // 可以在此处添加更多交易所
};

// 2. 交易策略信号类型
// 定义了AI分析模块生成的交易策略信号类型，用于指导用户进行交易决策。
const STRATEGY_SIGNAL = {
  STRONG_BUY: '强烈买入',
  BUY: '买入',
  NEUTRAL: '中性',
  SELL: '卖出',
  STRONG_SELL: '强烈卖出',
};

// 3. K线时间周期常量
// 定义了系统支持的K线数据时间周期，用于数据采集、技术指标计算和图表展示。
const KLINE_INTERVALS = {
  ONE_MINUTE: '1m',
  FIVE_MINUTES: '5m',
  TEN_MINUTES: '10m', // 核心业务逻辑采用的周期
  FIFTEEN_MINUTES: '15m',
  THIRTY_MINUTES: '30m',
  ONE_HOUR: '1h',
  FOUR_HOURS: '4h',
  ONE_DAY: '1d',
  ONE_WEEK: '1w',
  ONE_MONTH: '1M',
};

// 4. 技术指标名称常量
// 定义了系统支持和计算的各种技术分析指标的名称。
const TECHNICAL_INDICATORS = {
  SMA: 'SMA', // 简单移动平均线
  EMA: 'EMA', // 指数移动平均线
  RSI: 'RSI', // 相对强弱指数
  MACD: 'MACD', // 平滑异同移动平均线
  KDJ: 'KDJ', // 随机指标
  BOLLINGER_BANDS: 'BB', // 布林带
  ATR: 'ATR', // 平均真实波幅
  VOLUME: 'VOLUME', // 成交量
  // 可以在此处添加更多技术指标
};

// 5. 系统配置常量
// 包含了系统运行时的核心配置参数，如数据更新间隔、AI分析频率等。
const SYSTEM_CONFIG = {
  DATA_FETCH_INTERVAL_MS: 60000, // 数据采集和指标计算间隔，1分钟 = 1 * 60 * 1000 毫秒
  AI_ANALYSIS_INTERVAL_MS: 60000, // AI分析和策略生成间隔，与数据采集间隔一致
  DEFAULT_KLINE_LIMIT: 500, // 默认获取K线数据的数量
  MAX_KLINE_LIMIT: 1000, // 最大获取K线数据的数量
  DB_PATH: '/Users/goldenli/Documents/github/stockpulse.ai/db/trading.db', // SQLite数据库文件路径
  LOG_FILE_PATH: '/Users/goldenli/Documents/github/stockpulse.ai/logs/app.log', // 应用日志文件路径
};

// 6. API相关配置常量
// 定义了与外部API交互时的通用配置，如超时时间、重试次数等，以提高API调用的健壮性。
const API_CONFIG = {
  DEFAULT_TIMEOUT_MS: 10000, // 默认API请求超时时间 10秒
  MAX_RETRIES: 3, // API请求失败后的最大重试次数
  RETRY_DELAY_MS: 2000, // 每次重试之间的延迟时间 2秒
  DEEPSEEK_API_BASE_URL: 'https://api.deepseek.com/chat/completions', // DeepSeek AI API基础URL
  NTFY_BASE_URL: 'https://ntfy.sh/', // ntfy服务基础URL
};

// 7. IPC通信通道常量
// 定义了Electron主进程和渲染进程之间进行通信时使用的IPC通道名称，确保通信的规范性。
const IPC_CHANNELS = {
  GET_KLINE_DATA: 'get-kline-data',
  GET_INDICATOR_DATA: 'get-indicator-data',
  GET_DECISION_LOGS: 'get-decision-logs',
  SAVE_SETTINGS: 'save-settings',
  LOAD_SETTINGS: 'load-settings',
  SEND_NOTIFICATION: 'send-notification',
  START_TRADING_BOT: 'start-trading-bot',
  STOP_TRADING_BOT: 'stop-trading-bot',
  BOT_STATUS_UPDATE: 'bot-status-update',
  NEW_DECISION_SIGNAL: 'new-decision-signal',
  ERROR_OCCURRED: 'error-occurred',
};

// 添加策略决策常量
const STRATEGY_DECISIONS = {
  STRONG_BUY: '强烈买入',
  BUY: '买入', 
  NEUTRAL: '中性',
  SELL: '卖出',
  STRONG_SELL: '强烈卖出'
};

// 导出所有常量
module.exports = {
  EXCHANGES,
  STRATEGY_SIGNAL,
  KLINE_INTERVALS,
  TECHNICAL_INDICATORS,
  SYSTEM_CONFIG,
  API_CONFIG,
  IPC_CHANNELS,
  STRATEGY_DECISIONS
};