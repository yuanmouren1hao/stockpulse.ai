const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// 加载 .env 文件中的环境变量
// 优先加载项目根目录的 .env 文件，如果不存在则加载当前模块目录的 .env 文件
const rootDir = path.resolve(__dirname, '../../../..');
const envPath = path.join(rootDir, '.env');

if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
} else {
    dotenv.config(); // 加载当前工作目录或默认路径的 .env
}

/**
 * @module config
 * @description 统一的配置管理工具，负责加载环境变量、提供配置访问接口、配置验证以及默认值设置。
 */

/**
 * 应用程序的配置对象。
 * 包含DeepSeek API密钥、交易所API密钥、邮件SMTP配置、ntfy配置、数据库路径等。
 * @typedef {object} AppConfig
 * @property {string} DEEPSEEK_API_KEY - DeepSeek AI的API密钥。
 * @property {string} BINANCE_API_KEY - 币安交易所的API密钥。
 * @property {string} BINANCE_SECRET_KEY - 币安交易所的Secret密钥。
 * @property {string} OKX_API_KEY - OKX交易所的API密钥。
 * @property {string} OKX_SECRET_KEY - OKX交易所的Secret密钥。
 * @property {string} OKX_PASSWORD - OKX交易所的交易密码（如果有）。
 * @property {string} HUOBI_API_KEY - 火币交易所的API密钥。
 * @property {string} HUOBI_SECRET_KEY - 火币交易所的Secret密钥。
 * @property {string} SMTP_HOST - 邮件SMTP服务器地址。
 * @property {number} SMTP_PORT - 邮件SMTP服务器端口。
 * @property {boolean} SMTP_SECURE - 邮件SMTP是否使用SSL/TLS。
 * @property {string} SMTP_USER - 邮件SMTP认证用户名。
 * @property {string} SMTP_PASS - 邮件SMTP认证密码。
 * @property {string} NOTIFICATION_EMAIL_TO - 接收通知邮件的邮箱地址。
 * @property {boolean} ENABLE_EMAIL_NOTIFICATION - 是否启用邮件通知功能。
 * @property {string} NTFY_BASE_URL - ntfy服务的基URL。
 * @property {string} NTFY_TOPIC - ntfy推送的主题。
 * @property {boolean} ENABLE_NTFY_NOTIFICATION - 是否启用ntfy推送通知功能。
 * @property {string} WECOM_WEBHOOK_URL - 企业微信机器人Webhook地址。
 * @property {boolean} ENABLE_WECOM_NOTIFICATION - 是否启用企业微信通知功能。
 * @property {string} DATABASE_PATH - SQLite数据库文件的绝对路径。
 * @property {string} LOG_PATH - 日志文件存储目录的绝对路径。
 * @property {number} DATA_COLLECTION_INTERVAL_MINUTES - 数据采集和分析的间隔时间（分钟）。
 */

/**
 * 默认配置值，用于在环境变量未设置时提供回退。
 * @type {AppConfig}
 */
const defaultConfig = {
    DEEPSEEK_API_KEY: '',
    BINANCE_API_KEY: '',
    BINANCE_SECRET_KEY: '',
    OKX_API_KEY: '',
    OKX_SECRET_KEY: '',
    OKX_PASSWORD: '',
    HUOBI_API_KEY: '',
    HUOBI_SECRET_KEY: '',
    SMTP_HOST: 'smtp.example.com',
    SMTP_PORT: 587,
    SMTP_SECURE: false,
    SMTP_USER: 'user@example.com',
    SMTP_PASS: 'password',
    NOTIFICATION_EMAIL_TO: 'your_email@example.com',
    ENABLE_EMAIL_NOTIFICATION: false,
    NTFY_BASE_URL: 'https://ntfy.sh',
    NTFY_TOPIC: 'my_crypto_trading_alerts',
    ENABLE_NTFY_NOTIFICATION: false,
    WECOM_WEBHOOK_URL: '',
    ENABLE_WECOM_NOTIFICATION: true,
    DATABASE_PATH: path.join(rootDir, 'data', 'trading.db'),
    LOG_PATH: path.join(rootDir, 'data', 'logs'),
    DATA_COLLECTION_INTERVAL_MINUTES: 10, // 默认10分钟
};

/**
 * 从环境变量中加载配置，并与默认配置合并。
 * 环境变量会覆盖默认配置。
 * @type {AppConfig}
 */
const config = {
    DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY || defaultConfig.DEEPSEEK_API_KEY,
    BINANCE_API_KEY: process.env.BINANCE_API_KEY || defaultConfig.BINANCE_API_KEY,
    BINANCE_SECRET_KEY: process.env.BINANCE_SECRET_KEY || defaultConfig.BINANCE_SECRET_KEY,
    OKX_API_KEY: process.env.OKX_API_KEY || defaultConfig.OKX_API_KEY,
    OKX_SECRET_KEY: process.env.OKX_SECRET_KEY || defaultConfig.OKX_SECRET_KEY,
    OKX_PASSWORD: process.env.OKX_PASSWORD || defaultConfig.OKX_PASSWORD,
    HUOBI_API_KEY: process.env.HUOBI_API_KEY || defaultConfig.HUOBI_API_KEY,
    HUOBI_SECRET_KEY: process.env.HUOBI_SECRET_KEY || defaultConfig.HUOBI_SECRET_KEY,
    SMTP_HOST: process.env.SMTP_HOST || defaultConfig.SMTP_HOST,
    SMTP_PORT: parseInt(process.env.SMTP_PORT, 10) || defaultConfig.SMTP_PORT,
    SMTP_SECURE: process.env.SMTP_SECURE === 'true' || defaultConfig.SMTP_SECURE,
    SMTP_USER: process.env.SMTP_USER || defaultConfig.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS || defaultConfig.SMTP_PASS,
    NOTIFICATION_EMAIL_TO: process.env.NOTIFICATION_EMAIL_TO || defaultConfig.NOTIFICATION_EMAIL_TO,
    ENABLE_EMAIL_NOTIFICATION: process.env.ENABLE_EMAIL_NOTIFICATION === 'true',
    NTFY_BASE_URL: process.env.NTFY_BASE_URL || defaultConfig.NTFY_BASE_URL,
    NTFY_TOPIC: process.env.NTFY_TOPIC || defaultConfig.NTFY_TOPIC,
    ENABLE_NTFY_NOTIFICATION: process.env.ENABLE_NTFY_NOTIFICATION === 'true',
    WECOM_WEBHOOK_URL: process.env.WECOM_WEBHOOK_URL || defaultConfig.WECOM_WEBHOOK_URL,
    ENABLE_WECOM_NOTIFICATION: process.env.ENABLE_WECOM_NOTIFICATION === 'true',
    DATABASE_PATH: process.env.DATABASE_PATH || defaultConfig.DATABASE_PATH,
    LOG_PATH: process.env.LOG_PATH || defaultConfig.LOG_PATH,
    DATA_COLLECTION_INTERVAL_MINUTES: parseInt(process.env.DATA_COLLECTION_INTERVAL_MINUTES, 10) || defaultConfig.DATA_COLLECTION_INTERVAL_MINUTES,
};

/**
 * 验证关键配置项是否存在。
 * 如果缺少必要的配置项，将抛出错误。
 * @throws {Error} 当缺少必要的配置项时。
 */
function validateConfig() {
    const requiredConfig = [
        'DEEPSEEK_API_KEY',
        // 至少一个交易所的API密钥对是必需的
        // 'BINANCE_API_KEY', 'BINANCE_SECRET_KEY',
        // 'OKX_API_KEY', 'OKX_SECRET_KEY',
        // 'HUOBI_API_KEY', 'HUOBI_SECRET_KEY',
        'NOTIFICATION_EMAIL_TO',
        'NTFY_TOPIC',
        'DATABASE_PATH',
        'LOG_PATH',
    ];

    const missingConfig = requiredConfig.filter(key => !config[key] || config[key] === defaultConfig[key]);

    // 检查至少一个交易所的API密钥对是否存在
    const hasExchangeConfig = (config.BINANCE_API_KEY && config.BINANCE_SECRET_KEY) ||
                              (config.OKX_API_KEY && config.OKX_SECRET_KEY) ||
                              (config.HUOBI_API_KEY && config.HUOBI_SECRET_KEY);

    if (!hasExchangeConfig) {
        missingConfig.push('至少一个交易所的API密钥对 (Binance/OKX/Huobi) ');
    }

    if (missingConfig.length > 0) {
        console.error('❌ 错误：缺少以下必要的配置项，请检查 .env 文件或环境变量：');
        missingConfig.forEach(key => console.error(`- ${key}`));
        throw new Error('配置验证失败：缺少必要的环境变量。');
    }

    // 确保日志目录存在
    if (!fs.existsSync(config.LOG_PATH)) {
        try {
            fs.mkdirSync(config.LOG_PATH, { recursive: true });
            console.log(`✅ 日志目录创建成功: ${config.LOG_PATH}`);
        } catch (error) {
            console.error(`❌ 无法创建日志目录 ${config.LOG_PATH}:`, error);
            throw new Error(`无法创建日志目录: ${config.LOG_PATH}`);
        }
    }
}

// 在模块加载时进行配置验证
try {
    validateConfig();
    console.log('✅ 配置加载和验证成功。');
} catch (error) {
    console.error(error.message);
    // 在生产环境中，可能需要退出进程
    // process.exit(1);
}

function getConfig() {
    return config;
}

module.exports = { getConfig, config };