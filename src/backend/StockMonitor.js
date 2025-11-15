/**
 * @file StockMonitor.js
 * @description 股票监控机器人，监控A股、港股、美股
 */

const schedule = require('node-schedule');
const { TushareClient } = require('./api/TushareClient.js');
const { IndicatorEngine } = require('./indicators/IndicatorEngine.js');
const { DeepSeekClient } = require('./ai/DeepSeekClient.js');
// const { DatabaseManager } = require('./db/DatabaseManager.js'); // SQLite已移除
const { NotificationManager } = require('./notification/NotificationManager.js');
const { logger } = require('./utils/logger.js');
const { getConfig } = require('./utils/config.js');

/**
 * @class StockMonitor
 * @description 股票监控机器人核心类
 */
class StockMonitor {
    constructor(mainWindow = null) {
        this.config = getConfig();
        this.tushareClient = new TushareClient();
        this.indicatorEngine = new IndicatorEngine();
        this.deepSeekClient = new DeepSeekClient();
        // this.databaseManager = new DatabaseManager(); // SQLite已移除
        this.notificationManager = new NotificationManager();
        this.mainWindow = mainWindow; // 保存主窗口引用，用于发送实时消息
        
        // 监控的股票列表
        this.monitoredStocks = this.initializeStocks();
        
        // 调度任务
        this.scheduledJobs = [];
        this.isRunning = false;
        
        logger.info('StockMonitor initialized');
    }

    /**
     * 初始化监控股票列表
     * @returns {Array} 股票列表
     */
    initializeStocks() {
        return [
            // 港股
            { symbol: '00700.HK', name: '腾讯控股', market: 'HK' },
            { symbol: '01810.HK', name: '小米集团', market: 'HK' },
            { symbol: '09988.HK', name: '阿里巴巴', market: 'HK' },
            
            // 美股（注意：需要Tushare高级权限，如果没有权限则注释掉）
            // { symbol: 'BTCS', name: 'BTCS Inc', market: 'US' },
            
            // A股
            { symbol: '600519.SH', name: '贵州茅台', market: 'CN' }
        ];
    }

    /**
     * 启动股票监控
     */
    async start() {
        if (this.isRunning) {
            logger.warn('StockMonitor 已经在运行中');
            return;
        }

        try {
            logger.info('========== StockMonitor 启动中 ==========');
            
            // 初始化数据库 (SQLite已移除)
            // await this.databaseManager.initialize();
            
            // 立即执行一次完整的监控流程
            logger.info('执行初始股票监控...');
            await this.runMonitoringCycle();
            
            // 设置定时任务
            this.setupScheduledJobs();
            
            this.isRunning = true;
            logger.info('✅ StockMonitor 启动成功');
            logger.info(`监控股票: ${this.monitoredStocks.map(s => s.name).join(', ')}`);
            logger.info(`定时任务: 每天 ${this.config.STOCK_MONITOR_TIME || '15:30'} 执行`);
            logger.info('=========================================');

            // 发送启动通知
            await this.notificationManager.sendSystemNotification(
                '股票监控机器人已启动',
                `监控股票: ${this.monitoredStocks.map(s => s.name).join(', ')}\n` +
                `监控时间: 每天 ${this.config.STOCK_MONITOR_TIME || '15:30'}`
            );

        } catch (error) {
            logger.error('StockMonitor 启动失败:', error);
            throw error;
        }
    }

    /**
     * 停止股票监控
     */
    stop() {
        logger.info('StockMonitor 停止中...');
        
        // 取消所有定时任务
        this.scheduledJobs.forEach(job => job.cancel());
        this.scheduledJobs = [];
        
        this.isRunning = false;
        logger.info('✅ StockMonitor 已停止');
    }

    /**
     * 设置定时任务
     */
    setupScheduledJobs() {
        // A股收盘后监控（15:30）
        const cnTime = this.config.STOCK_MONITOR_CN_TIME || '30 15 * * 1-5';
        const cnJob = schedule.scheduleJob(cnTime, async () => {
            logger.info('执行A股定时监控任务...');
            await this.monitorStocksByMarket('CN');
        });
        this.scheduledJobs.push(cnJob);
        
        // 港股收盘后监控（16:30）
        const hkTime = this.config.STOCK_MONITOR_HK_TIME || '30 16 * * 1-5';
        const hkJob = schedule.scheduleJob(hkTime, async () => {
            logger.info('执行港股定时监控任务...');
            await this.monitorStocksByMarket('HK');
        });
        this.scheduledJobs.push(hkJob);
        
        // 美股收盘后监控（次日05:00，美东时间16:00）
        const usTime = this.config.STOCK_MONITOR_US_TIME || '0 5 * * 2-6';
        const usJob = schedule.scheduleJob(usTime, async () => {
            logger.info('执行美股定时监控任务...');
            await this.monitorStocksByMarket('US');
        });
        this.scheduledJobs.push(usJob);
        
        logger.info(`定时任务已设置: CN(${cnTime}), HK(${hkTime}), US(${usTime})`);
    }

    /**
     * 执行完整的监控周期
     */
    async runMonitoringCycle() {
        logger.info('========== 开始完整监控周期 ==========');
        
        for (const stock of this.monitoredStocks) {
            await this.monitorSingleStock(stock);
        }
        
        logger.info('========== 完整监控周期结束 ==========');
    }

    /**
     * 按市场监控股票
     * @param {string} market - 市场类型（CN/HK/US）
     */
    async monitorStocksByMarket(market) {
        logger.info(`========== 监控${market}市场股票 ==========`);
        
        const stocks = this.monitoredStocks.filter(s => s.market === market);
        
        for (const stock of stocks) {
            await this.monitorSingleStock(stock);
        }
        
        logger.info(`========== ${market}市场监控结束 ==========`);
    }

    /**
     * 监控单个股票
     * @param {Object} stock - 股票信息
     */
    async monitorSingleStock(stock) {
        try {
            logger.info(`\n========== 监控股票: ${stock.name} (${stock.symbol}) ==========`);
            this.sendLogToUI('INFO', `开始分析 ${stock.name} (${stock.symbol})`);
            
            // 1. 获取K线数据
            const klineData = await this.tushareClient.fetchKlines(stock.symbol, 100);
            
            if (!klineData || klineData.length === 0) {
                logger.warn(`${stock.name} 无K线数据，跳过分析`);
                this.sendLogToUI('WARN', `${stock.name} 无K线数据`);
                return;
            }
            
            logger.info(`获取到 ${klineData.length} 条K线数据`);
            
            // 2. 计算技术指标
            const indicators = this.indicatorEngine.calculateAllIndicators(klineData);
            logger.info('技术指标计算完成');
            
            // 3. AI分析
            const latestKline = klineData[klineData.length - 1];
            const prompt = this.buildAnalysisPrompt(stock, latestKline, indicators);
            const aiAnalysis = await this.deepSeekClient.getAnalysis(prompt);
            
            logger.info(`AI分析决策: ${aiAnalysis.decision}`);
            logger.info(`AI分析理由: ${aiAnalysis.reasoning}`);
            
            // 发送分析结果到UI
            this.sendStockAnalysisToUI(stock, latestKline, indicators, aiAnalysis);
            
            // 4. 保存到数据库
            await this.saveStockData(stock, klineData, indicators, aiAnalysis);
            
            // 5. 发送通知
            await this.sendStockNotification(stock, latestKline, indicators, aiAnalysis);
            
            logger.info(`========== ${stock.name} 监控完成 ==========\n`);
            this.sendLogToUI('INFO', `✅ ${stock.name} 分析完成: ${aiAnalysis.decision}`);
            
        } catch (error) {
            logger.error(`监控 ${stock.name} 时出错:`, error);
            this.sendLogToUI('ERROR', `监控 ${stock.name} 失败: ${error.message}`);
        }
    }

    /**
     * 构建AI分析提示词
     * @param {Object} stock - 股票信息
     * @param {Object} kline - 最新K线数据
     * @param {Object} indicators - 技术指标
     * @returns {string} 提示词
     */
    buildAnalysisPrompt(stock, kline, indicators) {
        return `
作为专业的股票分析师，请分析 ${stock.name} (${stock.symbol}) 的市场情况：

当前价格数据：
- 收盘价: ${kline.close}
- 开盘价: ${kline.open}
- 最高价: ${kline.high}
- 最低价: ${kline.low}
- 成交量: ${kline.volume}
- 涨跌幅: ${kline.pctChange?.toFixed(2)}%

技术指标：
- RSI: ${indicators.rsi ? indicators.rsi.slice(-1)[0]?.toFixed(2) : 'N/A'}
- MACD: ${indicators.macd ? indicators.macd.MACD.slice(-1)[0]?.toFixed(4) : 'N/A'}
- 布林带上轨: ${indicators.bb ? indicators.bb.upper.slice(-1)[0]?.toFixed(2) : 'N/A'}
- 布林带中轨: ${indicators.bb ? indicators.bb.middle.slice(-1)[0]?.toFixed(2) : 'N/A'}
- 布林带下轨: ${indicators.bb ? indicators.bb.lower.slice(-1)[0]?.toFixed(2) : 'N/A'}

请给出交易建议，必须从以下选项中选择一个：
"强烈买入", "买入", "中性", "卖出", "强烈卖出"

请简要说明理由（100字以内）。
        `;
    }

    /**
     * 保存股票数据到数据库
     * @param {Object} stock - 股票信息
     * @param {Array} klineData - K线数据
     * @param {Object} indicators - 技术指标
     * @param {Object} aiAnalysis - AI分析结果
     */
    async saveStockData(stock, klineData, indicators, aiAnalysis) {
        try {
            // SQLite已移除，如需持久化可使用Supabase或其他方案
            logger.info(`✅ ${stock.name} 数据处理完成（SQLite已移除，未持久化存储）`);
            
            /* SQLite保存代码已移除
            // 保存K线数据
            await this.databaseManager.saveKlineData(stock.symbol, 'daily', klineData);
            
            // 保存技术指标
            const latestKline = klineData[klineData.length - 1];
            await this.databaseManager.saveIndicators(
                stock.symbol,
                'daily',
                latestKline.openTime,
                indicators
            );
            
            // 保存决策日志
            await this.databaseManager.saveDecisionLog({
                symbol: stock.symbol,
                interval: 'daily',
                timestamp: latestKline.openTime,
                open: latestKline.open,
                close: latestKline.close,
                high: latestKline.high,
                low: latestKline.low,
                volume: latestKline.volume,
                indicators: JSON.stringify(indicators),
                aiAnalysis: JSON.stringify(aiAnalysis),
                decision: aiAnalysis.decision,
                decisionDetails: aiAnalysis.reasoning
            });
            */
            
        } catch (error) {
            logger.error(`处理 ${stock.name} 数据失败:`, error);
        }
    }

    /**
     * 发送股票通知
     * @param {Object} stock - 股票信息
     * @param {Object} kline - K线数据
     * @param {Object} indicators - 技术指标
     * @param {Object} aiAnalysis - AI分析结果
     */
    async sendStockNotification(stock, kline, indicators, aiAnalysis) {
        try {
            const title = `【${stock.name}】${aiAnalysis.decision}`;
            
            const message = `
股票代码: ${stock.symbol}
当前价格: ${kline.close}
涨跌幅: ${kline.pctChange?.toFixed(2)}%

技术指标:
- RSI: ${indicators.rsi ? indicators.rsi.slice(-1)[0]?.toFixed(2) : 'N/A'}
- MACD: ${indicators.macd ? indicators.macd.MACD.slice(-1)[0]?.toFixed(4) : 'N/A'}

AI分析决策: ${aiAnalysis.decision}
决策理由: ${aiAnalysis.summary || aiAnalysis.reasoning}
            `;
            
            // 只在非中性决策时发送通知
            if (aiAnalysis.decision !== '中性') {
                await this.notificationManager.sendEmail(`[股票分析] ${title}`, message);
                await this.notificationManager.sendNtfyNotification(title, message, aiAnalysis.decision);
                await this.notificationManager.sendWeComNotification(title, message);
            } else {
                logger.info(`${stock.name} 决策为中性，跳过通知发送`);
            }
            
        } catch (error) {
            logger.error(`发送 ${stock.name} 通知失败:`, error);
        }
    }

    /**
     * 获取监控状态
     * @returns {Object} 状态信息
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            monitoredStocks: this.monitoredStocks.map(s => ({
                symbol: s.symbol,
                name: s.name,
                market: s.market
            })),
            activeScheduledJobs: this.scheduledJobs.length
        };
    }

    /**
     * 添加监控股票
     * @param {Object} stock - 股票信息
     */
    addStock(stock) {
        if (!stock.symbol || !stock.name || !stock.market) {
            throw new Error('股票信息不完整');
        }
        
        const exists = this.monitoredStocks.find(s => s.symbol === stock.symbol);
        if (exists) {
            logger.warn(`股票 ${stock.symbol} 已在监控列表中`);
            return;
        }
        
        this.monitoredStocks.push(stock);
        logger.info(`添加监控股票: ${stock.name} (${stock.symbol})`);
    }

    /**
     * 移除监控股票
     * @param {string} symbol - 股票代码
     */
    removeStock(symbol) {
        const index = this.monitoredStocks.findIndex(s => s.symbol === symbol);
        if (index === -1) {
            logger.warn(`股票 ${symbol} 不在监控列表中`);
            return;
        }
        
        const removed = this.monitoredStocks.splice(index, 1);
        logger.info(`移除监控股票: ${removed[0].name} (${removed[0].symbol})`);
    }

    /**
     * 发送日志到UI界面
     * @param {string} level - 日志级别
     * @param {string} message - 日志消息
     */
    sendLogToUI(level, message) {
        if (this.mainWindow && this.mainWindow.webContents) {
            this.mainWindow.webContents.send('bot-log', { level, message });
        }
    }

    /**
     * 发送股票分析结果到UI界面
     * @param {Object} stock - 股票信息
     * @param {Object} kline - K线数据
     * @param {Object} indicators - 技术指标
     * @param {Object} aiAnalysis - AI分析结果
     */
    sendStockAnalysisToUI(stock, kline, indicators, aiAnalysis) {
        const summary = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 ${stock.name} (${stock.symbol}) - ${stock.market}股
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📈 价格信息:
  • 当前价格: ${kline.close}
  • 涨跌幅: ${kline.pctChange ? kline.pctChange.toFixed(2) + '%' : 'N/A'}
  • 开盘: ${kline.open} | 最高: ${kline.high} | 最低: ${kline.low}
  • 成交量: ${kline.volume}

🔍 技术指标:
  • RSI: ${indicators.rsi ? indicators.rsi.slice(-1)[0]?.toFixed(2) : 'N/A'}
  • MACD: ${indicators.macd ? indicators.macd.MACD.slice(-1)[0]?.toFixed(4) : 'N/A'}
  • 布林带: ${indicators.bb ? `上${indicators.bb.upper.slice(-1)[0]?.toFixed(2)} | 中${indicators.bb.middle.slice(-1)[0]?.toFixed(2)} | 下${indicators.bb.lower.slice(-1)[0]?.toFixed(2)}` : 'N/A'}

🤖 AI分析决策: ${aiAnalysis.decision}
💡 决策理由: ${aiAnalysis.summary || aiAnalysis.reasoning}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        `;

        this.sendLogToUI('INFO', summary.trim());
    }

    /**
     * 设置主窗口引用
     * @param {BrowserWindow} mainWindow - 主窗口对象
     */
    setMainWindow(mainWindow) {
        this.mainWindow = mainWindow;
    }
}

module.exports = { StockMonitor };
