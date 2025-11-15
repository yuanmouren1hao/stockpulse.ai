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
            // 构建请求体
            const requestBody = {
                model: 'deepseek-chat',
                messages: [
                    { role: 'user', content: prompt }
                ],
                temperature: 0.7,
                max_tokens: 200
            };

            // 打印请求信息
            logger.info('========== DeepSeek API 请求开始 ==========');
            logger.info(`请求URL: ${this.baseURL}/chat/completions`);
            logger.info(`请求方法: POST`);
            logger.info(`请求头: Authorization: Bearer ${this.apiKey.substring(0, 10)}...`);
            logger.info('请求体:');
            logger.info(JSON.stringify(requestBody, null, 2));
            logger.info('===========================================');

            const startTime = Date.now();
            
            const response = await axios.post(`${this.baseURL}/chat/completions`, requestBody, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            });

            const endTime = Date.now();
            const duration = endTime - startTime;

            // 打印响应信息
            logger.info('========== DeepSeek API 响应开始 ==========');
            logger.info(`响应状态: ${response.status} ${response.statusText}`);
            logger.info(`响应耗时: ${duration}ms`);
            logger.info('响应头:');
            logger.info(JSON.stringify(response.headers, null, 2));
            logger.info('响应体:');
            logger.info(JSON.stringify(response.data, null, 2));
            logger.info('===========================================');

            const content = response.data.choices[0].message.content;
            const decision = this.parseDecision(content);
            
            const analysisResult = {
                decision,
                confidence: 0.8,
                reasoning: content,
                summary: content.substring(0, 100) + '...'
            };

            logger.info('========== AI 分析结果 ==========');
            logger.info(`决策: ${decision}`);
            logger.info(`置信度: ${analysisResult.confidence}`);
            logger.info(`推理摘要: ${analysisResult.summary}`);
            logger.info('================================');

            return analysisResult;

        } catch (error) {
            // 打印错误详情
            logger.error('========== DeepSeek API 请求失败 ==========');
            logger.error(`错误类型: ${error.name}`);
            logger.error(`错误消息: ${error.message}`);
            
            if (error.response) {
                logger.error(`响应状态: ${error.response.status}`);
                logger.error(`响应数据: ${JSON.stringify(error.response.data, null, 2)}`);
            } else if (error.request) {
                logger.error('未收到响应，请求详情:');
                logger.error(JSON.stringify(error.request, null, 2));
            }
            
            logger.error('堆栈跟踪:');
            logger.error(error.stack);
            logger.error('==========================================');

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