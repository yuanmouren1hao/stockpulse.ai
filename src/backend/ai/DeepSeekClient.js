/**
 * @file DeepSeekClient.js
 * @description DeepSeek AI客户端
 */

const axios = require('axios');
const { logger } = require('../utils/logger.js');
const { getConfig } = require('../utils/config.js');
const { sleep } = require('../utils/scheduler.js');

/**
 * @class DeepSeekClient
 * @description DeepSeek AI分析客户端
 */
class DeepSeekClient {
    constructor() {
        this.config = getConfig();
        this.apiKey = this.config.DEEPSEEK_API_KEY;
        this.baseURL = 'https://api.deepseek.com';
        
        if (!this.apiKey) {
            logger.warn('DeepSeek API Key 未配置，AI分析功能将被禁用');
        }
        
        logger.info('DeepSeekClient initialized');
    }

    /**
     * 构建分析提示词
     * @param {string} symbol - 交易对
     * @param {string} interval - 时间周期
     * @param {Object} klineData - K线数据
     * @param {Object} indicators - 技术指标
     * @returns {string} 提示词
     */
    buildPrompt(symbol, interval, klineData, indicators) {
        return `
作为专业的加密货币分析师，请分析 ${symbol} 在 ${interval} 周期的市场情况：

当前价格数据：
- 开盘价: ${klineData.open}
- 最高价: ${klineData.high}  
- 最低价: ${klineData.low}
- 收盘价: ${klineData.close}
- 成交量: ${klineData.volume}

技术指标：
- RSI: ${indicators.rsi ? indicators.rsi.slice(-1)[0]?.toFixed(2) : 'N/A'}
- MACD: ${indicators.macd ? indicators.macd.MACD.slice(-1)[0]?.toFixed(4) : 'N/A'}
- 布林带上轨: ${indicators.bb ? indicators.bb.upper.slice(-1)[0]?.toFixed(2) : 'N/A'}
- 布林带下轨: ${indicators.bb ? indicators.bb.lower.slice(-1)[0]?.toFixed(2) : 'N/A'}

请给出交易建议，必须从以下选项中选择一个：
"强烈买入", "买入", "中性", "卖出", "强烈卖出"

请简要说明理由。
        `;
    }

    /**
     * 获取AI分析结果
     * @param {string} prompt - 分析提示词
     * @returns {Promise<Object>} AI分析结果
     */
    async getAnalysis(prompt) {
        if (!this.apiKey) {
            logger.warn('DeepSeek API Key 未配置，返回默认分析结果');
            return {
                decision: '中性',
                confidence: 0.5,
                reasoning: 'AI分析功能未配置'
            };
        }

        try {
            const response = await axios.post(`${this.baseURL}/chat/completions`, {
                model: 'deepseek-chat',
                messages: [
                    { role: 'user', content: prompt }
                ],
                temperature: 0.7,
                max_tokens: 200
            }, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            });

            const content = response.data.choices[0].message.content;
            const decision = this.parseDecision(content);
            
            return {
                decision,
                confidence: 0.8,
                reasoning: content,
                summary: content.substring(0, 100) + '...'
            };

        } catch (error) {
            logger.error('DeepSeek AI 分析失败:', error.message);
            return {
                decision: '中性',
                confidence: 0.5,
                reasoning: 'AI分析失败: ' + error.message
            };
        }
    }

    /**
     * 解析AI响应中的决策
     * @param {string} content - AI响应内容
     * @returns {string} 决策结果
     */
    parseDecision(content) {
        const decisions = ['强烈买入', '买入', '中性', '卖出', '强烈卖出'];
        
        for (const decision of decisions) {
            if (content.includes(decision)) {
                return decision;
            }
        }
        
        return '中性';
    }
}

module.exports = { DeepSeekClient };