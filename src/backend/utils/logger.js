const winston = require('winston');
require('winston-daily-rotate-file');
const path = require('path');

// 定义日志文件存储路径，相对于项目根目录的data/logs文件夹  
const logDirectory = path.resolve(__dirname, '../../../logs');

// 定义日志格式
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.printf(({ level, message, timestamp, stack, module }) => {
        // 确保module字段存在，如果不存在则默认为'App'
        const moduleName = module || 'App';
        if (stack) {
            return `${timestamp} [${level.toUpperCase()}] [${moduleName}]: ${message}\n${stack}`;
        }
        return `${timestamp} [${level.toUpperCase()}] [${moduleName}]: ${message}`;
    })
);

// 配置Winston日志记录器
const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'development' ? 'debug' : 'info', // 根据环境设置默认日志级别
    format: logFormat,
    transports: [
        // 控制台输出
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(), // 在控制台输出中添加颜色
                logFormat
            )
        }),
        // 文件输出：所有级别日志
        new winston.transports.DailyRotateFile({
            level: 'info',
            filename: path.join(logDirectory, 'application-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m', // 单个日志文件最大20MB
            maxFiles: '14d', // 保留14天的日志文件
            format: logFormat
        }),
        // 文件输出：错误级别日志独立存储
        new winston.transports.DailyRotateFile({
            level: 'error',
            filename: path.join(logDirectory, 'error-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '14d',
            format: logFormat
        })
    ],
    exceptionHandlers: [
        new winston.transports.DailyRotateFile({
            filename: path.join(logDirectory, 'exceptions-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '14d',
            format: logFormat
        })
    ],
    rejectionHandlers: [
        new winston.transports.DailyRotateFile({
            filename: path.join(logDirectory, 'rejections-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '14d',
            format: logFormat
        })
    ]
});

/**
 * 创建一个带有特定模块名称的日志记录器实例。
 * 这允许在日志输出中标识消息来源。
 * @param {string} moduleName - 模块的名称，例如 'ExchangeManager', 'DeepSeekAI'。
 * @returns {winston.Logger} 配置好的Winston Logger实例。
 */
const createLogger = (moduleName) => {
    return logger.child({ module: moduleName });
};

// 导出logger实例和创建函数
module.exports = { logger, createLogger };
