/**
 * @file IndicatorEngine.js
 * @description 技术指标计算引擎
 */

const { RSI, MACD, BollingerBands, SMA, EMA } = require('technicalindicators');
const { logger } = require('../utils/logger.js');

/**
 * @class IndicatorEngine  
 * @description 技术指标计算引擎
 */
class IndicatorEngine {
    constructor() {
        logger.info('IndicatorEngine initialized');
    }

    /**
     * 计算所有技术指标
     * @param {Array} klineData - K线数据数组
     * @returns {Object} 包含所有指标的对象
     */
    calculateAllIndicators(klineData) {
        if (!klineData || klineData.length < 20) {
            logger.warn('K线数据不足，无法计算指标');
            return {};
        }

        const closes = klineData.map(k => k.close);
        const highs = klineData.map(k => k.high);
        const lows = klineData.map(k => k.low);

        const indicators = {};

        try {
            // RSI
            indicators.rsi = RSI.calculate({ values: closes, period: 14 });
            
            // MACD
            const macdResult = MACD.calculate({
                values: closes,
                fastPeriod: 12,
                slowPeriod: 26,
                signalPeriod: 9,
                SimpleMAOscillator: false,
                SimpleMASignal: false
            });
            
            if (macdResult.length > 0) {
                indicators.macd = {
                    MACD: macdResult.map(m => m.MACD),
                    signal: macdResult.map(m => m.signal),
                    histogram: macdResult.map(m => m.histogram)
                };
            }

            // 布林带
            const bbResult = BollingerBands.calculate({
                period: 20,
                values: closes,
                stdDev: 2
            });
            
            if (bbResult.length > 0) {
                indicators.bb = {
                    upper: bbResult.map(b => b.upper),
                    middle: bbResult.map(b => b.middle),
                    lower: bbResult.map(b => b.lower)
                };
            }

            // 移动平均线
            indicators.sma20 = SMA.calculate({ period: 20, values: closes });
            indicators.ema12 = EMA.calculate({ period: 12, values: closes });
            indicators.ema26 = EMA.calculate({ period: 26, values: closes });

            logger.info('技术指标计算完成');
            return indicators;

        } catch (error) {
            logger.error('计算技术指标时出错:', error);
            return {};
        }
    }
}

module.exports = { IndicatorEngine };