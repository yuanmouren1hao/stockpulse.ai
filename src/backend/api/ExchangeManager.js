/**
 * @file ExchangeManager.js
 * @description 交易所API管理器模块，负责集成多个交易所API
 */

const ccxt = require('ccxt');
const { SocksProxyAgent } = require('socks-proxy-agent');
const { sleep } = require('../utils/scheduler.js');
const { logger } = require('../utils/logger.js');
const { getConfig } = require('../utils/config.js');

/**
 * @class ExchangeManager
 * @description 交易所管理器，负责所有交易所相关的操作。
 */
class ExchangeManager {
    constructor() {
        this.exchanges = {};
        this.config = getConfig();
        this.initializeExchanges();
    }

    /**
     * 初始化交易所实例
     */
    initializeExchanges() {
        logger.info('正在初始化交易所...');
        
        // 优先初始化 OKX（改为主要交易所）
        if (this.config.OKX_API_KEY && this.config.OKX_SECRET_KEY) {
            try {
                // 创建 SOCKS5 代理 Agent
                const proxyUrl = 'socks5://127.0.0.1:1080';
                const agent = new SocksProxyAgent(proxyUrl);
                
                this.exchanges.okx = new ccxt.okx({
                    apiKey: this.config.OKX_API_KEY,
                    secret: this.config.OKX_SECRET_KEY,
                    password: this.config.OKX_PASSWORD,
                    sandbox: false,
                    enableRateLimit: true,
                    timeout: 30000, // 增加超时时间到 30 秒
                    agent: agent, // 使用 SOCKS5 代理 Agent
                    options: {
                        defaultType: 'spot', // 现货交易
                    },
                });
                logger.info(`✅ OKX 交易所初始化成功（主要交易所）- 使用 SOCKS5 代理: ${proxyUrl}`);
            } catch (error) {
                logger.error('❌ OKX 交易所初始化失败:', error.message);
            }
        }
        
        // 初始化 Binance（备用）
        if (this.config.BINANCE_API_KEY && this.config.BINANCE_SECRET_KEY) {
            try {
                this.exchanges.binance = new ccxt.binance({
                    apiKey: this.config.BINANCE_API_KEY,
                    secret: this.config.BINANCE_SECRET_KEY,
                    sandbox: false,
                    enableRateLimit: true,
                });
                logger.info('Binance 交易所初始化成功（备用）');
            } catch (error) {
                logger.error('Binance 交易所初始化失败:', error);
            }
        }
    }

    /**
     * 获取K线数据
     * @param {string} symbol - 交易对符号（如 'BTC/USDT'）
     * @param {string} timeframe - 时间周期
     * @param {number} limit - 数据条数
     * @returns {Promise<Array>} K线数据数组
     */
    async fetchKlines(symbol, timeframe, limit = 100) {
        // 优先使用 OKX 交易所
        const preferredExchange = 'okx';
        
        if (this.exchanges[preferredExchange]) {
            const exchange = this.exchanges[preferredExchange];
            try {
                logger.info(`📊 从 OKX 获取 ${symbol} 的 ${timeframe} K线数据 (${limit}条)`);
                const ohlcv = await exchange.fetchOHLCV(symbol, timeframe, undefined, limit);
                
                // 计算 closeTime：根据不同的时间周期
                const timeframeMs = this.getTimeframeInMs(timeframe);
                
                const klineData = ohlcv.map(candle => ({
                    openTime: candle[0],
                    open: candle[1],
                    high: candle[2],
                    low: candle[3],
                    close: candle[4],
                    volume: candle[5],
                    closeTime: candle[0] + timeframeMs - 1
                }));
                
                logger.info(`✅ 成功从 OKX 获取 ${klineData.length} 条K线数据`);
                return klineData;
            } catch (error) {
                logger.error(`❌ 从 OKX 获取K线数据失败:`, error.message);
                // 如果 OKX 失败，尝试备用交易所
            }
        }
        
        // 备用：使用其他可用交易所
        const exchangeNames = Object.keys(this.exchanges).filter(name => name !== preferredExchange);
        
        if (exchangeNames.length === 0) {
            throw new Error('没有可用的交易所');
        }

        const exchangeName = exchangeNames[0];
        const exchange = this.exchanges[exchangeName];

        try {
            logger.info(`⚠️ 使用备用交易所 ${exchangeName} 获取 ${symbol} 的 ${timeframe} K线数据`);
            const ohlcv = await exchange.fetchOHLCV(symbol, timeframe, undefined, limit);
            
            const timeframeMs = this.getTimeframeInMs(timeframe);
            
            return ohlcv.map(candle => ({
                openTime: candle[0],
                open: candle[1],
                high: candle[2],
                low: candle[3],
                close: candle[4],
                volume: candle[5],
                closeTime: candle[0] + timeframeMs - 1
            }));
        } catch (error) {
            logger.error(`❌ 获取K线数据失败 (${exchangeName}):`, error.message);
            throw error;
        }
    }

    /**
     * 获取当前价格
     * @param {string} symbol - 交易对符号（如 'BTC/USDT'）
     * @returns {Promise<number>} 当前价格
     */
    async getCurrentPrice(symbol) {
        // 优先使用 OKX 交易所
        const preferredExchange = 'okx';
        
        if (this.exchanges[preferredExchange]) {
            const exchange = this.exchanges[preferredExchange];
            try {
                logger.info(`💰 从 OKX 获取 ${symbol} 当前价格`);
                const ticker = await exchange.fetchTicker(symbol);
                logger.info(`✅ ${symbol} 当前价格: ${ticker.last}`);
                return ticker.last;
            } catch (error) {
                logger.error(`❌ 从 OKX 获取价格失败: ${error.message}`);
                if (error.message.includes('API-key')) {
                    logger.error('提示: 请检查 OKX API Key 是否正确配置');
                }
                // 如果 OKX 失败，尝试备用交易所
            }
        }
        
        // 备用：使用其他可用交易所
        const exchangeNames = Object.keys(this.exchanges).filter(name => name !== preferredExchange);
        
        if (exchangeNames.length === 0) {
            throw new Error('没有可用的交易所');
        }

        const exchangeName = exchangeNames[0];
        const exchange = this.exchanges[exchangeName];

        try {
            logger.info(`⚠️ 使用备用交易所 ${exchangeName} 获取 ${symbol} 价格`);
            const ticker = await exchange.fetchTicker(symbol);
            return ticker.last;
        } catch (error) {
            logger.error(`❌ 获取当前价格失败 (${exchangeName}):`, error.message);
            throw error;
        }
    }
    
    /**
     * 获取交易所名称
     * @returns {string} 当前使用的主要交易所名称
     */
    getActiveExchange() {
        if (this.exchanges.okx) {
            return 'OKX';
        }
        const exchangeNames = Object.keys(this.exchanges);
        return exchangeNames.length > 0 ? exchangeNames[0].toUpperCase() : 'None';
    }
    
    /**
     * 将时间周期字符串转换为毫秒
     * @param {string} timeframe - 时间周期（如 '1m', '5m', '1h' 等）
     * @returns {number} 毫秒数
     */
    getTimeframeInMs(timeframe) {
        const timeframeMap = {
            '1m': 60 * 1000,
            '5m': 5 * 60 * 1000,
            '10m': 10 * 60 * 1000,
            '15m': 15 * 60 * 1000,
            '30m': 30 * 60 * 1000,
            '1h': 60 * 60 * 1000,
            '4h': 4 * 60 * 60 * 1000,
            '1d': 24 * 60 * 60 * 1000,
            '1w': 7 * 24 * 60 * 60 * 1000,
            '1M': 30 * 24 * 60 * 60 * 1000
        };
        return timeframeMap[timeframe] || 60 * 1000; // 默认1分钟
    }
}

module.exports = { ExchangeManager };