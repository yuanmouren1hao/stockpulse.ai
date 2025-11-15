/**
 * @file test-stock-monitor.js
 * @description 测试股票监控功能
 */

const { StockMonitor } = require('./src/backend/StockMonitor.js');
const { logger } = require('./src/backend/utils/logger.js');

async function testStockMonitor() {
    console.log('========================================');
    console.log('开始测试股票监控功能');
    console.log('========================================\n');

    try {
        // 创建股票监控实例
        const monitor = new StockMonitor();
        
        // 显示监控状态
        console.log('初始状态:', monitor.getStatus());
        console.log('\n----------------------------------------\n');
        
        // 启动监控（会立即执行一次完整的监控周期）
        console.log('启动股票监控...\n');
        await monitor.start();
        
        console.log('\n----------------------------------------\n');
        console.log('监控状态:', monitor.getStatus());
        console.log('\n========================================');
        console.log('测试完成！检查日志文件获取详细信息');
        console.log('========================================\n');
        
        // 等待一段时间后停止
        setTimeout(() => {
            monitor.stop();
            process.exit(0);
        }, 5000);
        
    } catch (error) {
        console.error('测试失败:', error);
        process.exit(1);
    }
}

// 运行测试
testStockMonitor();
