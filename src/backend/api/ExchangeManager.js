/**
 * @file ExchangeManager.js
 * @description 交易所API管理器模块，负责集成多个交易所API
 */

const ccxt = require('ccxt');
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
        
        // 初始化 Binance
        if (this.config.BINANCE_API_KEY && this.config.BINANCE_SECRET_KEY) {
            try {
                this.exchanges.binance = new ccxt.binance({
                    apiKey: this.config.BINANCE_API_KEY,
                    secret: this.config.BINANCE_SECRET_KEY,
                    sandbox: false,
                    enableRateLimit: true,
                });
                logger.info('Binance 交易所初始化成功');
            } catch (error) {
                logger.error('Binance 交易所初始化失败:', error);
            }
        }

        // 初始化 OKX
        if (this.config.OKX_API_KEY && this.config.OKX_SECRET_KEY) {
            try {
                this.exchanges.okx = new ccxt.okx({
                    apiKey: this.config.OKX_API_KEY,
                    secret: this.config.OKX_SECRET_KEY,
                    password: this.config.OKX_PASSWORD,
                    sandbox: false,
                    enableRateLimit: true,
                });
                logger.info('OKX 交易所初始化成功');
            } catch (error) {
                logger.error('OKX 交易所初始化失败:', error);
            }
        }
    }

    /**
     * 获取K线数据
     * @param {string} symbol - 交易对符号
     * @param {string} timeframe - 时间周期
     * @param {number} limit - 数据条数
     * @returns {Promise<Array>} K线数据数组
     */
    async fetchKlines(symbol, timeframe, limit = 100) {
        const exchangeNames = Object.keys(this.exchanges);
        
        if (exchangeNames.length === 0) {
            throw new Error('没有可用的交易所');
        }

        // 使用第一个可用的交易所
        const exchangeName = exchangeNames[0];
        const exchange = this.exchanges[exchangeName];

        try {
            logger.info(`从 ${exchangeName} 获取 ${symbol} 的 ${timeframe} K线数据`);
            const ohlcv = await exchange.fetchOHLCV(symbol, timeframe, undefined, limit);
            
            return ohlcv.map(candle => ({
                openTime: candle[0],
                open: candle[1],
                high: candle[2],
                low: candle[3],
                close: candle[4],
                volume: candle[5],
                closeTime: candle[0] + exchange.timeframes[timeframe] * 1000 - 1
            }));
        } catch (error) {
            logger.error(`获取K线数据失败 (${exchangeName}):`, error);
            throw error;
        }
    }

    /**
     * 获取当前价格
     * @param {string} symbol - 交易对符号
     * @returns {Promise<number>} 当前价格
     */
    async getCurrentPrice(symbol) {
        const exchangeNames = Object.keys(this.exchanges);
        
        if (exchangeNames.length === 0) {
            throw new Error('没有可用的交易所');
        }

        const exchangeName = exchangeNames[0];
        const exchange = this.exchanges[exchangeName];

        try {
            const ticker = await exchange.fetchTicker(symbol);
            return ticker.last;
        } catch (error) {
            logger.error(`获取当前价格失败 (${exchangeName}):`, error);
            throw error;
        }
    }
}

module.exports = { ExchangeManager };