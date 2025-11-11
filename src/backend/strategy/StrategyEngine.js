/**
 * @file StrategyEngine.js
 * @description 交易策略引擎
 */

const { logger } = require('../utils/logger.js');

/**
 * @class StrategyEngine
 * @description 交易策略引擎，整合技术指标和AI分析生成交易策略
 */
class StrategyEngine {
    constructor() {
        logger.info('StrategyEngine initialized');
    }

    /**
     * 生成交易策略
     * @param {string} symbol - 交易对
     * @param {Object} klineData - K线数据
     * @param {Object} indicators - 技术指标
     * @param {Object} aiAnalysis - AI分析结果
     * @returns {Object} 策略结果
     */
    generateStrategy(symbol, klineData, indicators, aiAnalysis) {
        try {
            // 基于技术指标的评分
            const technicalScore = this.calculateTechnicalScore(indicators);
            
            // AI建议权重
            const aiWeight = 0.6;
            const technicalWeight = 0.4;
            
            // 综合决策
            let finalDecision = aiAnalysis.decision || '中性';
            let confidence = (aiAnalysis.confidence || 0.5) * aiWeight + technicalScore * technicalWeight;
            
            const details = `技术指标评分: ${technicalScore.toFixed(2)}, AI建议: ${aiAnalysis.decision}, 综合置信度: ${confidence.toFixed(2)}`;
            
            logger.info(`${symbol} 交易策略生成完成: ${finalDecision}`);
            
            return {
                decision: finalDecision,
                confidence: Math.min(Math.max(confidence, 0), 1),
                details: details,
                technicalScore: technicalScore,
                aiAnalysis: aiAnalysis
            };

        } catch (error) {
            logger.error('生成交易策略失败:', error);
            return {
                decision: '中性',
                confidence: 0.5,
                details: '策略生成失败: ' + error.message
            };
        }
    }

    /**
     * 计算技术指标评分
     * @param {Object} indicators - 技术指标
     * @returns {number} 评分 (0-1)
     */
    calculateTechnicalScore(indicators) {
        let score = 0.5; // 基础中性评分
        let factors = 0;

        try {
            // RSI 评分
            if (indicators.rsi && indicators.rsi.length > 0) {
                const rsi = indicators.rsi[indicators.rsi.length - 1];
                if (rsi < 30) score += 0.2; // 超卖，偏向买入
                else if (rsi > 70) score -= 0.2; // 超买，偏向卖出
                factors++;
            }

            // MACD 评分
            if (indicators.macd && indicators.macd.MACD && indicators.macd.signal) {
                const macd = indicators.macd.MACD;
                const signal = indicators.macd.signal;
                if (macd.length > 0 && signal.length > 0) {
                    const macdValue = macd[macd.length - 1];
                    const signalValue = signal[signal.length - 1];
                    if (macdValue > signalValue) score += 0.1; // 金叉，偏向买入
                    else score -= 0.1; // 死叉，偏向卖出
                    factors++;
                }
            }

            // 布林带评分
            if (indicators.bb && indicators.bb.upper && indicators.bb.lower) {
                const upper = indicators.bb.upper;
                const lower = indicators.bb.lower;
                if (upper.length > 0 && lower.length > 0) {
                    // 这里需要当前价格来判断，暂时跳过
                    factors++;
                }
            }

            // 确保评分在合理范围内
            return Math.min(Math.max(score, 0), 1);

        } catch (error) {
            logger.error('计算技术指标评分失败:', error);
            return 0.5;
        }
    }
}

module.exports = { StrategyEngine };