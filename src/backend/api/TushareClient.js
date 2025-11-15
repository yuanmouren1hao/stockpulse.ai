/**
 * @file TushareClient.js
 * @description Tushare数据接口客户端，用于获取A股、港股、美股数据
 */

const axios = require('axios');
const { logger } = require('../utils/logger.js');
const { getConfig } = require('../utils/config.js');

/**
 * @class TushareClient
 * @description Tushare API客户端，支持股票数据获取
 */
class TushareClient {
    constructor() {
        this.config = getConfig();
        this.token = this.config.TUSHARE_TOKEN;
        this.baseURL = 'http://api.tushare.pro';
        
        if (!this.token) {
            logger.warn('Tushare Token 未配置，股票数据获取功能将被禁用');
        }
        
        logger.info('TushareClient initialized');
    }

    /**
     * 调用Tushare API
     * @param {string} apiName - API接口名称
     * @param {Object} params - 请求参数
     * @param {string} fields - 返回字段
     * @returns {Promise<Object>} API响应数据
     */
    async callAPI(apiName, params = {}, fields = '') {
        if (!this.token) {
            throw new Error('Tushare Token 未配置');
        }

        try {
            logger.info(`========== Tushare API 请求开始 ==========`);
            logger.info(`接口名称: ${apiName}`);
            logger.info(`请求参数: ${JSON.stringify(params, null, 2)}`);

            const requestBody = {
                api_name: apiName,
                token: this.token,
                params: params,
                fields: fields
            };

            const response = await axios.post(this.baseURL, requestBody, {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            });

            logger.info(`响应状态: ${response.status}`);
            
            if (response.data.code !== 0) {
                logger.error(`API返回错误: ${response.data.msg}`);
                throw new Error(response.data.msg);
            }

            logger.info(`✅ 成功获取数据，记录数: ${response.data.data?.items?.length || 0}`);
            logger.info(`==========================================`);

            return response.data.data;

        } catch (error) {
            logger.error(`❌ Tushare API 请求失败`);
            logger.error(`错误消息: ${error.message}`);
            if (error.response) {
                logger.error(`响应状态: ${error.response.status}`);
                logger.error(`响应数据: ${JSON.stringify(error.response.data, null, 2)}`);
            }
            throw error;
        }
    }

    /**
     * 获取股票日线数据
     * @param {string} tsCode - 股票代码（如：000001.SZ）
     * @param {string} startDate - 开始日期（如：20240101）
     * @param {string} endDate - 结束日期（如：20241231）
     * @returns {Promise<Array>} 日线数据数组
     */
    async getDailyData(tsCode, startDate, endDate) {
        try {
            logger.info(`获取股票日线数据: ${tsCode}, ${startDate} - ${endDate}`);

            const data = await this.callAPI('daily', {
                ts_code: tsCode,
                start_date: startDate,
                end_date: endDate
            });

            if (!data || !data.items) {
                return [];
            }

            // 转换为标准K线格式
            const klines = data.items.map(item => {
                const [ts_code, trade_date, open, high, low, close, pre_close, change, pct_chg, vol, amount] = item;
                
                return {
                    symbol: ts_code,
                    openTime: new Date(trade_date.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3')).getTime(),
                    closeTime: new Date(trade_date.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3')).getTime() + 86400000 - 1,
                    open: parseFloat(open),
                    high: parseFloat(high),
                    low: parseFloat(low),
                    close: parseFloat(close),
                    volume: parseFloat(vol) * 100, // 手转为股
                    amount: parseFloat(amount) * 1000, // 千元转为元
                    preClose: parseFloat(pre_close),
                    change: parseFloat(change),
                    pctChange: parseFloat(pct_chg)
                };
            });

            logger.info(`✅ 成功获取 ${klines.length} 条日线数据`);
            return klines;

        } catch (error) {
            logger.error(`获取日线数据失败: ${error.message}`);
            return [];
        }
    }

    /**
     * 获取港股日线数据
     * @param {string} tsCode - 港股代码（如：00700.HK）
     * @param {string} startDate - 开始日期
     * @param {string} endDate - 结束日期
     * @returns {Promise<Array>} 日线数据数组
     */
    async getHKDailyData(tsCode, startDate, endDate) {
        try {
            logger.info(`获取港股日线数据: ${tsCode}, ${startDate} - ${endDate}`);

            const data = await this.callAPI('hk_daily', {
                ts_code: tsCode,
                start_date: startDate,
                end_date: endDate
            });

            if (!data || !data.items) {
                return [];
            }

            // 转换为标准K线格式
            const klines = data.items.map(item => {
                const [ts_code, trade_date, open, high, low, close, pre_close, change, pct_chg, vol, amount] = item;
                
                return {
                    symbol: ts_code,
                    openTime: new Date(trade_date.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3')).getTime(),
                    closeTime: new Date(trade_date.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3')).getTime() + 86400000 - 1,
                    open: parseFloat(open),
                    high: parseFloat(high),
                    low: parseFloat(low),
                    close: parseFloat(close),
                    volume: parseFloat(vol),
                    amount: parseFloat(amount),
                    preClose: parseFloat(pre_close),
                    change: parseFloat(change),
                    pctChange: parseFloat(pct_chg)
                };
            });

            logger.info(`✅ 成功获取 ${klines.length} 条港股日线数据`);
            return klines;

        } catch (error) {
            logger.error(`获取港股日线数据失败: ${error.message}`);
            return [];
        }
    }

    /**
     * 获取美股日线数据
     * @param {string} tsCode - 美股代码（如：AAPL）
     * @param {string} startDate - 开始日期
     * @param {string} endDate - 结束日期
     * @returns {Promise<Array>} 日线数据数组
     */
    async getUSDailyData(tsCode, startDate, endDate) {
        try {
            logger.info(`获取美股日线数据: ${tsCode}, ${startDate} - ${endDate}`);

            const data = await this.callAPI('us_daily', {
                ts_code: tsCode,
                start_date: startDate,
                end_date: endDate
            });

            if (!data || !data.items) {
                return [];
            }

            // 转换为标准K线格式
            const klines = data.items.map(item => {
                const [ts_code, trade_date, open, high, low, close, pre_close, change, pct_chg, vol, amount] = item;
                
                return {
                    symbol: ts_code,
                    openTime: new Date(trade_date.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3')).getTime(),
                    closeTime: new Date(trade_date.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3')).getTime() + 86400000 - 1,
                    open: parseFloat(open),
                    high: parseFloat(high),
                    low: parseFloat(low),
                    close: parseFloat(close),
                    volume: parseFloat(vol),
                    amount: parseFloat(amount),
                    preClose: parseFloat(pre_close),
                    change: parseFloat(change),
                    pctChange: parseFloat(pct_chg)
                };
            });

            logger.info(`✅ 成功获取 ${klines.length} 条美股日线数据`);
            return klines;

        } catch (error) {
            logger.error(`获取美股日线数据失败: ${error.message}`);
            return [];
        }
    }

    /**
     * 根据股票类型获取对应的日线数据
     * @param {string} symbol - 股票代码
     * @param {number} limit - 获取数据条数
     * @returns {Promise<Array>} K线数据数组
     */
    async fetchKlines(symbol, limit = 100) {
        try {
            // 计算日期范围
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - limit * 2); // 考虑非交易日，取两倍天数

            const start = this.formatDate(startDate);
            const end = this.formatDate(endDate);

            logger.info(`获取股票K线数据: ${symbol}, 条数: ${limit}`);

            let klines = [];

            // 根据股票代码判断市场类型
            if (symbol.endsWith('.HK')) {
                // 港股
                klines = await this.getHKDailyData(symbol, start, end);
            } else if (symbol.endsWith('.SZ') || symbol.endsWith('.SH')) {
                // A股
                klines = await this.getDailyData(symbol, start, end);
            } else {
                // 美股（不带后缀或其他）
                // 注意：美股数据需要Tushare更高权限
                logger.warn(`美股数据 ${symbol} 可能需要更高的Tushare权限`);
                klines = await this.getUSDailyData(symbol, start, end);
            }

            // 按时间排序并限制数量
            klines.sort((a, b) => a.openTime - b.openTime);
            return klines.slice(-limit);

        } catch (error) {
            logger.error(`获取K线数据失败: ${error.message}`);
            return [];
        }
    }

    /**
     * 格式化日期为Tushare要求的格式（YYYYMMDD）
     * @param {Date} date - 日期对象
     * @returns {string} 格式化后的日期字符串
     */
    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}${month}${day}`;
    }

    /**
     * 获取股票基本信息
     * @param {string} tsCode - 股票代码
     * @returns {Promise<Object>} 股票基本信息
     */
    async getStockBasic(tsCode) {
        try {
            const data = await this.callAPI('stock_basic', {
                ts_code: tsCode
            });

            if (data && data.items && data.items.length > 0) {
                const [ts_code, symbol, name, area, industry, market, list_date] = data.items[0];
                return {
                    tsCode: ts_code,
                    symbol: symbol,
                    name: name,
                    area: area,
                    industry: industry,
                    market: market,
                    listDate: list_date
                };
            }

            return null;

        } catch (error) {
            logger.error(`获取股票基本信息失败: ${error.message}`);
            return null;
        }
    }
}

module.exports = { TushareClient };
