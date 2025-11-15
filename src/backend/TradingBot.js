// /usr/local/app/workspace/plan_4f847e0f743eb76638fb7ef4b6da871d/stage_2/crypto-trading-app/src/backend/TradingBot.js

const schedule = require('node-schedule');
const { ExchangeManager } = require('./api/ExchangeManager.js');
const { IndicatorEngine } = require('./indicators/IndicatorEngine.js');
const { DeepSeekClient } = require('./ai/DeepSeekClient.js');
const { StrategyEngine } = require('./strategy/StrategyEngine.js');
const { DatabaseManager } = require('./db/DatabaseManager.js');
const { SupabaseManager } = require('./db/SupabaseManager.js');
const { NotificationManager } = require('./notification/NotificationManager.js');
const { logger } = require('./utils/logger.js');
const { getConfig } = require('./utils/config.js');
const { KLINE_INTERVALS, STRATEGY_DECISIONS } = require('../common/constants.js');

/**
 * @class TradingBot
 * @description 交易机器人主控制器，负责协调所有后端模块，执行数据采集、指标计算、AI分析、策略生成、数据存储和通知推送等核心任务。
 * 采用ES6 Class语法，提供启动、停止和状态监控功能，并支持多交易对和错误恢复机制。
 */
class TradingBot {
    constructor() {
        this.config = getConfig();
        this.exchangeManager = new ExchangeManager();
        this.indicatorEngine = new IndicatorEngine();
        this.deepSeekClient = new DeepSeekClient();
        this.strategyEngine = new StrategyEngine();
        this.databaseManager = new DatabaseManager();
        this.supabaseManager = new SupabaseManager(); // Supabase 云数据库
        this.notificationManager = new NotificationManager();

        this.scheduledJobs = {}; // 存储所有定时任务
        this.isBotRunning = false; // 机器人运行状态
        this.monitoredSymbols = ['BTC/USDT', 'ETH/USDT', 'DOGE/USDT']; // 监控的交易对
        this.klineInterval = KLINE_INTERVALS.ONE_MINUTE; // 1分钟K线周期
        logger.info('TradingBot initialized with config:', this.config);
    }

    /**
     * @method start
     * @description 启动交易机器人，初始化数据库连接，并调度定时任务。
     * 每个交易对将独立运行其数据采集、分析和策略生成流程。
     */
    async start() {
        if (this.isBotRunning) {
            logger.warn('TradingBot is already running.');
            return;
        }

        logger.info('Starting TradingBot...');
        try {
            // 初始化本地 SQLite 数据库
            await this.databaseManager.initialize();
            logger.info('SQLite Database initialized successfully.');

            // 初始化 Supabase 云数据库
            try {
                await this.supabaseManager.initialize();
                logger.info('Supabase initialized successfully.');
            } catch (supabaseError) {
                logger.warn('Supabase initialization failed, continuing with local SQLite only:', supabaseError.message);
            }

            // 为每个交易对调度一个独立的定时任务
            this.monitoredSymbols.forEach(symbol => {
                const jobName = `trading_job_${symbol}`;
                // 每1分钟的第0秒执行一次任务
                this.scheduledJobs[symbol] = schedule.scheduleJob(jobName, '0 */1 * * * *', async () => {
                    logger.info(`Executing trading job for ${symbol} at ${new Date().toISOString()}`);
                    await this.executeTradingWorkflow(symbol);
                });
                logger.info(`Scheduled 1-minute trading job for symbol: ${symbol}`);
            });

            this.isBotRunning = true;
            logger.info('TradingBot started successfully. Monitoring symbols:', this.monitoredSymbols);
            this.notificationManager.sendSystemNotification('TradingBot Started', `TradingBot has started monitoring: ${this.monitoredSymbols.join(', ')}`);

        } catch (error) {
            logger.error('Failed to start TradingBot:', error);
            this.notificationManager.sendSystemNotification('TradingBot Start Failed', `Error: ${error.message}`);
            this.stop(); // 启动失败则停止所有任务
        }
    }

    /**
     * @method stop
     * @description 停止交易机器人，取消所有定时任务，并关闭数据库连接。
     */
    stop() {
        if (!this.isBotRunning) {
            logger.warn('TradingBot is not running.');
            return;
        }

        logger.info('Stopping TradingBot...');
        for (const symbol in this.scheduledJobs) {
            this.scheduledJobs[symbol].cancel();
            logger.info(`Cancelled scheduled job for symbol: ${symbol}`);
        }
        this.scheduledJobs = {};
        this.databaseManager.close(); // 关闭数据库连接
        this.isBotRunning = false;
        logger.info('TradingBot stopped successfully.');
        this.notificationManager.sendSystemNotification('TradingBot Stopped', 'TradingBot has been stopped.');
    }

    /**
     * @method getStatus
     * @description 获取交易机器人的当前运行状态。
     * @returns {object} 包含运行状态、监控交易对和活跃任务数量的信息。
     */
    getStatus() {
        const activeJobs = Object.keys(this.scheduledJobs).length;
        return {
            isRunning: this.isBotRunning,
            monitoredSymbols: this.monitoredSymbols,
            activeScheduledJobs: activeJobs,
            klineInterval: this.klineInterval,
            lastUpdateTime: new Date().toISOString() // 可以添加更多状态信息
        };
    }

    /**
     * @method executeTradingWorkflow
     * @description 执行单个交易对的完整交易工作流程：数据获取 -> 指标计算 -> AI分析 -> 策略生成 -> 数据存储 -> 通知。
     * @param {string} symbol - 交易对符号 (e.g., 'BTC/USDT')
     * @returns {Promise<void>}
     */
    async executeTradingWorkflow(symbol) {
        logger.info(`[${symbol}] Starting trading workflow.`);
        let decision = STRATEGY_DECISIONS.NEUTRAL; // 默认中性
        let decisionDetails = 'No specific strategy generated.';
        let klineData = null;
        let indicators = {};
        let aiAnalysisResult = null;

        try {
            // 1. 从交易所获取最新K线数据
            logger.info(`[${symbol}] Fetching latest kline data...`);
            // 获取最近的K线数据，确保有足够的数据用于指标计算
            const rawKlines = await this.exchangeManager.fetchKlines(symbol, this.klineInterval, 100); // 获取最近100根K线
            if (!rawKlines || rawKlines.length === 0) {
                logger.warn(`[${symbol}] No kline data fetched. Skipping workflow.`);
                decisionDetails = 'No kline data available.';
                return;
            }
            klineData = rawKlines[rawKlines.length - 1]; // 获取最新一根K线
            await this.databaseManager.saveKlineData(symbol, this.klineInterval, rawKlines); // 批量保存K线数据到本地
            
            // 同时保存到 Supabase 云数据库
            if (this.supabaseManager.isReady()) {
                try {
                    await this.supabaseManager.saveKlineData(symbol, this.klineInterval, rawKlines);
                } catch (supabaseError) {
                    logger.warn(`[${symbol}] Failed to save kline data to Supabase:`, supabaseError.message);
                }
            }
            
            logger.info(`[${symbol}] Latest kline data fetched and saved. Open: ${klineData.open}, Close: ${klineData.close}`);

            // 2. 计算技术指标
            logger.info(`[${symbol}] Calculating technical indicators...`);
            indicators = this.indicatorEngine.calculateAllIndicators(rawKlines);
            await this.databaseManager.saveIndicators(symbol, this.klineInterval, klineData.closeTime, indicators);
            
            // 同时保存到 Supabase 云数据库
            if (this.supabaseManager.isReady()) {
                try {
                    await this.supabaseManager.saveIndicators(symbol, this.klineInterval, klineData.closeTime, indicators);
                } catch (supabaseError) {
                    logger.warn(`[${symbol}] Failed to save indicators to Supabase:`, supabaseError.message);
                }
            }
            
            logger.info(`[${symbol}] Technical indicators calculated and saved. RSI: ${indicators.rsi ? indicators.rsi.slice(-1)[0] : 'N/A'}`);

            // 3. 调用DeepSeek AI分析
            logger.info(`[${symbol}] Calling DeepSeek AI for analysis...`);
            const prompt = this.deepSeekClient.buildPrompt(symbol, this.klineInterval, klineData, indicators);
            aiAnalysisResult = await this.deepSeekClient.getAnalysis(prompt);
            logger.info(`[${symbol}] DeepSeek AI analysis received: ${JSON.stringify(aiAnalysisResult)}`);

            // 4. 生成交易策略
            logger.info(`[${symbol}] Generating trading strategy...`);
            const strategyResult = this.strategyEngine.generateStrategy(symbol, klineData, indicators, aiAnalysisResult);
            decision = strategyResult.decision;
            decisionDetails = strategyResult.details;
            logger.info(`[${symbol}] Generated strategy: ${decision} - ${decisionDetails}`);

            // 5. 保存到数据库
            logger.info(`[${symbol}] Saving decision log to database...`);
            const decisionLogData = {
                symbol,
                interval: this.klineInterval,
                timestamp: klineData.closeTime,
                open: klineData.open,
                close: klineData.close,
                high: klineData.high,
                low: klineData.low,
                volume: klineData.volume,
                indicators: JSON.stringify(indicators), // 将指标对象转换为JSON字符串存储
                aiAnalysis: JSON.stringify(aiAnalysisResult), // 将AI分析结果转换为JSON字符串存储
                decision,
                decisionDetails
            };
            
            await this.databaseManager.saveDecisionLog(decisionLogData);
            
            // 同时保存到 Supabase 云数据库
            if (this.supabaseManager.isReady()) {
                try {
                    await this.supabaseManager.saveDecisionLog(decisionLogData);
                } catch (supabaseError) {
                    logger.warn(`[${symbol}] Failed to save decision log to Supabase:`, supabaseError.message);
                }
            }
            
            logger.info(`[${symbol}] Decision log saved.`);

            // 6. 发送通知
            logger.info(`[${symbol}] Sending notifications...`);
            const notificationSubject = `Trading Signal for ${symbol} (${this.klineInterval}): ${decision}`;
            const notificationBody = `
                Symbol: ${symbol}
                Interval: ${this.klineInterval}
                Timestamp: ${new Date(klineData.closeTime).toLocaleString()}
                Close Price: ${klineData.close}
                Decision: ${decision}
                Details: ${decisionDetails}
                RSI: ${indicators.rsi ? indicators.rsi.slice(-1)[0].toFixed(2) : 'N/A'}
                MACD: ${indicators.macd ? indicators.macd.MACD.slice(-1)[0].toFixed(2) : 'N/A'}
                BBands (Upper/Middle/Lower): ${indicators.bb ? `${indicators.bb.upper.slice(-1)[0].toFixed(2)} / ${indicators.bb.middle.slice(-1)[0].toFixed(2)} / ${indicators.bb.lower.slice(-1)[0].toFixed(2)}` : 'N/A'}
                AI Insights: ${aiAnalysisResult ? aiAnalysisResult.summary : 'N/A'}
            `;
            await this.notificationManager.sendEmail(notificationSubject, notificationBody);
            await this.notificationManager.sendNtfyNotification(notificationSubject, notificationBody, decision);
            await this.notificationManager.sendWeComNotification(notificationSubject, notificationBody);
            logger.info(`[${symbol}] Notifications sent for decision: ${decision}`);

        } catch (error) {
            logger.error(`[${symbol}] Error during trading workflow:`, error);
            // 错误恢复机制：记录错误并发送通知，但不中断整个机器人运行
            this.notificationManager.sendSystemNotification(
                `Trading Workflow Error for ${symbol}`,
                `An error occurred during the trading workflow for ${symbol}: ${error.message}`
            );
        } finally {
            logger.info(`[${symbol}] Trading workflow finished. Final Decision: ${decision}`);
        }
    }
}

module.exports = { TradingBot };