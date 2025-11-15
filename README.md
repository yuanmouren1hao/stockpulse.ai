# 🚀 StockPulse.AI - AI驱动的加密货币和股票交易分析系统

<div align="center">

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node.js](https://img.shields.io/badge/node.js-18.20.8-green.svg)
![Electron](https://img.shields.io/badge/electron-29.1.4-blue.svg)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)

*一个功能强大的加密货币和股票交易分析系统，集成AI智能分析、实时数据监控和自动化交易信号生成*

</div>

## 📋 目录

- [✨ 功能特性](#-功能特性)
- [🏗️ 系统架构](#-系统架构)
- [🛠️ 技术栈](#-技术栈)
- [📋 系统要求](#-系统要求)
- [⚡ 快速开始](#-快速开始)
- [🔧 配置说明](#-配置说明)
- [📖 使用指南](#-使用指南)
- [🔍 API文档](#-api文档)
- [🤝 贡献指南](#-贡献指南)
- [📄 许可证](#-许可证)

## ✨ 功能特性

### 🤖 AI智能分析
- **DeepSeek AI集成**: 基于最新的AI技术进行市场分析
- **智能决策生成**: 自动生成5级交易信号（强烈买入/买入/中性/卖出/强烈卖出）
- **上下文感知分析**: 结合技术指标和市场数据进行综合分析

### 📈 股票监控（新功能！）
- **多市场支持**: A股、港股、美股全覆盖
- **Tushare数据源**: 稳定可靠的股票数据接口
- **定时监控**: 根据不同市场交易时间自动监控
- **完整分析**: 技术指标计算 + AI分析 + 交易建议
- **默认监控股票**:
  - 港股: 腾讯控股(00700.HK)、小米集团(01810.HK)、阿里巴巴(09988.HK)
  - 美股: BTCS
  - A股: 贵州茅台(600519.SH)

> 📖 详细使用指南: [STOCK_MONITOR_GUIDE.md](./STOCK_MONITOR_GUIDE.md)

### 📊 技术指标引擎
- **丰富的技术指标**: RSI、MACD、KDJ、布林带、ATR等
- **移动平均线**: SMA、EMA多周期分析
- **实时计算**: 基于最新K线数据动态计算指标
- **历史数据支持**: 支持大量历史数据的指标计算

### 🌐 多交易所支持
- **主要交易所**: OKX（主要数据源）
- **备用交易所**: Binance（币安）、Huobi（火币）
- **智能切换**: OKX 失败时自动切换到备用交易所
- **统一API接口**: 基于CCXT库的标准化交易所接口
- **实时数据获取**: WebSocket和REST API双重数据获取
- **多交易对监控**: 同时监控多个加密货币交易对

> 📝 **配置说明**: 查看 [OKX_SETUP_GUIDE.md](./OKX_SETUP_GUIDE.md) 了解 OKX 配置详情

### ⚡ 自动化交易机器人
- **定时任务调度**: 可配置的数据采集和分析间隔
- **完整工作流**: 数据获取 → 指标计算 → AI分析 → 策略生成 → 通知推送
- **错误恢复机制**: 自动处理网络异常和API限制
- **状态监控**: 实时监控机器人运行状态

### 💾 数据管理
- **双重数据库架构**: 本地 SQLite + Supabase 云数据库
- **本地 SQLite**: 快速读写、离线可用、作为主数据源
- **Supabase 云数据库**: 云端备份、远程访问、多设备同步
- **自动同步**: 数据自动保存到两个数据库
- **完整历史记录**: K线数据、技术指标、决策日志
- **数据持久化**: 自动保存分析结果和交易历史
- **查询优化**: 高效的数据检索和统计功能

### 📱 通知系统
- **邮件通知**: SMTP邮件推送交易信号和系统状态
- **即时推送**: ntfy.sh服务实现手机实时通知
- **多级通知**: 根据信号重要性设置不同优先级
- **自定义模板**: 可配置的通知内容和格式

### 🖥️ 桌面应用界面
- **Electron框架**: 跨平台桌面应用
- **实时状态显示**: 机器人运行状态和监控信息
- **一键控制**: 简单的启动/停止操作
- **开发者工具**: 内置调试面板支持

## 🏗️ 系统架构

```
StockPulse.AI/
├── 🖥️ 前端界面 (Electron)
│   ├── 控制面板
│   ├── 状态监控
│   └── 实时数据展示
│
├── 🧠 核心引擎
│   ├── 📈 交易机器人 (TradingBot) - 加密货币
│   ├── 📊 股票监控器 (StockMonitor) - 股票市场
│   ├── 🔗 交易所管理器 (ExchangeManager)
│   ├── 💹 Tushare客户端 (TushareClient)
│   ├── 🤖 AI分析客户端 (DeepSeekClient)
│   ├── 📊 指标计算引擎 (IndicatorEngine)
│   ├── 🎯 策略生成引擎 (StrategyEngine)
│   └── 📱 通知管理器 (NotificationManager)
│
├── 💾 数据层
│   ├── 🗄️ 本地 SQLite 数据库
│   ├── ☁️ Supabase 云数据库
│   ├── 📋 K线数据存储（加密货币+股票）
│   ├── 📈 技术指标存储
│   └── 📝 决策日志存储
│
└── 🔧 工具模块
    ├── ⚙️ 配置管理
    ├── 📝 日志系统
    ├── ⏰ 任务调度
    └── 🛠️ 工具函数
```

## 🛠️ 技术栈

### 核心技术
- **Node.js** `18.20.8` - JavaScript运行时环境
- **Electron** `29.1.4` - 跨平台桌面应用框架
- **SQLite** `better-sqlite3` - 本地轻量级数据库
- **Supabase** `@supabase/supabase-js` - PostgreSQL 云数据库

### AI & 数据分析
- **DeepSeek AI** - 智能市场分析
- **Technical Indicators** - 技术指标计算库
- **CCXT** - 统一交易所API接口
- **Tushare** - 股票数据接口

### 通知服务
- **Nodemailer** - 邮件发送服务
- **Axios** - HTTP请求库（ntfy推送）

### 开发工具
- **Winston** - 专业日志管理
- **Node-schedule** - Cron风格任务调度
- **Dotenv** - 环境变量管理

## 📋 系统要求

### 最低配置
- **操作系统**: Windows 10+ / macOS 10.14+ / Linux (Ubuntu 16.04+)
- **Node.js**: 18.0.0 或更高版本
- **内存**: 4GB RAM
- **存储**: 1GB 可用空间
- **网络**: 稳定的互联网连接

### 推荐配置
- **Node.js**: 18.20.8 LTS
- **内存**: 8GB RAM 或更高
- **存储**: SSD硬盘，2GB 可用空间
- **网络**: 高速稳定网络连接

## ⚡ 快速开始

### 1. 克隆项目
```bash
git clone https://github.com/your-username/stockpulse.ai.git
cd stockpulse.ai
```

### 2. 安装依赖
```bash
# 确保使用 Node.js 18.x
nvm use 18  # 如果使用 nvm

# 安装项目依赖
npm install
```

### 3. 环境配置
```bash
# 复制环境配置文件
cp .env.example .env

# 编辑配置文件
nano .env
```

### 4. 配置API密钥
在 `.env` 文件中配置以下必要信息：

```env
# DeepSeek AI API
DEEPSEEK_API_KEY="your_deepseek_api_key"

# Tushare 股票数据（新增！）
TUSHARE_TOKEN="your_tushare_token"

# 至少配置一个交易所（用于加密货币）
BINANCE_API_KEY="your_binance_api_key"
BINANCE_SECRET_KEY="your_binance_secret_key"

# 通知配置（可选）
NOTIFICATION_EMAIL_TO="your_email@example.com"
NTFY_TOPIC="your_ntfy_topic"
```

### 5. 启动应用
```bash
# 开发模式启动
npm start

# 或者
npm run dev
```

### 6. 构建应用
```bash
# 构建生产版本
npm run build
```

## 🚀 快速测试

### 测试股票监控功能

```bash
# 运行股票监控测试
npm run test:stock
```

这将立即执行一次完整的股票监控流程，包括：
- 获取所有监控股票的数据
- 计算技术指标
- AI分析生成交易建议
- 保存到数据库
- 发送通知（如果启用）

### 查看测试结果

```bash
# 查看应用日志
tail -f logs/application-$(date +%Y-%m-%d).log

# 查看错误日志
tail -f logs/error-$(date +%Y-%m-%d).log
```

## 🔧 配置说明

### 环境变量配置

#### AI服务配置
```env
DEEPSEEK_API_KEY="sk-xxxxxxxxxxxxxxxx"    # DeepSeek AI API密钥
```

#### Supabase 云数据库配置
```env
VITE_SUPABASE_URL="https://your-project.supabase.co"    # Supabase 项目 URL
VITE_SUPABASE_ANON_KEY="your-anon-key-here"             # Supabase Anon Key
```

> 📝 **Supabase 设置**: 查看 [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) 获取完整的 Supabase 集成指南

#### 交易所API配置
```env
# Binance
BINANCE_API_KEY="your_api_key"
BINANCE_SECRET_KEY="your_secret_key"

# OKX
OKX_API_KEY="your_api_key" 
OKX_SECRET_KEY="your_secret_key"
OKX_PASSWORD="your_passphrase"

# Huobi
HUOBI_API_KEY="your_api_key"
HUOBI_SECRET_KEY="your_secret_key"
```

#### 通知服务配置
```env
# 邮件通知
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your_email@gmail.com"
SMTP_PASS="your_app_password"
NOTIFICATION_EMAIL_TO="recipient@example.com"

# ntfy推送
NTFY_BASE_URL="https://ntfy.sh"
NTFY_TOPIC="crypto_trading_signals"
```

#### 系统配置
```env
# 数据库和日志
DATABASE_PATH="./db/trading.db"
LOG_PATH="./logs"

# 运行参数
DATA_COLLECTION_INTERVAL_MINUTES="10"
NODE_ENV="development"
DEBUG="true"
LOG_LEVEL="info"
```

### 交易对配置

在代码中可以修改监控的交易对：

```javascript
// src/backend/TradingBot.js
this.monitoredSymbols = ['BTC/USDT', 'ETH/USDT', 'BNB/USDT'];
```

## 📖 使用指南

### 启动机器人

1. **启动应用**: 运行 `npm start` 启动Electron应用
2. **检查状态**: 在界面中查看机器人状态和配置
3. **启动监控**: 点击"启动机器人"按钮开始自动化监控
4. **查看日志**: 通过开发者工具或日志文件查看运行详情

### 监控和通知

- **实时监控**: 机器人每10分钟执行一次完整的分析流程
- **交易信号**: 基于AI分析和技术指标生成交易建议
- **通知推送**: 通过邮件和ntfy推送重要信号和系统状态
- **历史记录**: 所有分析结果和决策都保存在数据库中

### 数据查看

```sql
-- 查看最近的交易信号
SELECT * FROM decision_logs ORDER BY created_at DESC LIMIT 10;

-- 查看技术指标历史
SELECT * FROM indicators WHERE symbol = 'BTC/USDT' ORDER BY timestamp DESC;

-- 查看K线数据
SELECT * FROM kline_data WHERE symbol = 'BTC/USDT' ORDER BY open_time DESC;
```

## 🔍 API文档

### TradingBot API

#### 启动机器人
```javascript
const bot = new TradingBot();
await bot.start();
```

#### 获取状态
```javascript
const status = bot.getStatus();
console.log(status);
// {
//   isRunning: true,
//   monitoredSymbols: ['BTC/USDT', 'ETH/USDT'],
//   activeScheduledJobs: 2,
//   klineInterval: '10m'
// }
```

#### 停止机器人
```javascript
bot.stop();
```

### ExchangeManager API

#### 获取K线数据
```javascript
const exchangeManager = new ExchangeManager();
const klines = await exchangeManager.fetchKlines('BTC/USDT', '10m', 100);
```

#### 获取当前价格
```javascript
const price = await exchangeManager.getCurrentPrice('BTC/USDT');
```

### IndicatorEngine API

#### 计算技术指标
```javascript
const indicatorEngine = new IndicatorEngine();
const indicators = indicatorEngine.calculateAllIndicators(klineData);
```

## 🚀 高级功能

### 自定义策略

可以在 `StrategyEngine` 中实现自定义交易策略：

```javascript
// src/backend/strategy/StrategyEngine.js
generateCustomStrategy(symbol, klineData, indicators, aiAnalysis) {
    // 实现你的自定义策略逻辑
    return {
        decision: 'BUY',
        confidence: 0.85,
        details: 'Custom strategy triggered'
    };
}
```

### 扩展交易所

添加新的交易所支持：

```javascript
// src/backend/api/ExchangeManager.js
initializeNewExchange() {
    this.exchanges.newExchange = new ccxt.newexchange({
        apiKey: this.config.NEW_EXCHANGE_API_KEY,
        secret: this.config.NEW_EXCHANGE_SECRET_KEY,
        enableRateLimit: true,
    });
}
```

### 自定义通知

扩展通知功能：

```javascript
// src/backend/notification/NotificationManager.js
async sendCustomNotification(message) {
    // 实现自定义通知逻辑
    // 例如：Telegram Bot, Discord Webhook, 短信等
}
```

## 🔧 开发指南

### 项目结构
```
src/
├── backend/              # 后端核心逻辑
│   ├── api/             # 交易所API管理
│   ├── ai/              # AI分析模块
│   ├── db/              # 数据库管理
│   ├── indicators/      # 技术指标引擎
│   ├── notification/    # 通知系统
│   ├── strategy/        # 策略引擎
│   └── utils/           # 工具函数
├── common/              # 共享常量和工具
└── frontend/            # 前端界面（待扩展）
```

### 开发环境设置

```bash
# 安装开发依赖
npm install --save-dev

# 启用调试模式
export DEBUG=true
export NODE_ENV=development

# 启动开发服务
npm run dev
```

### 代码规范

- 使用 ESLint 进行代码检查
- 遵循 JavaScript Standard Style
- 添加详细的JSDoc注释
- 编写单元测试

### 测试

```bash

解决: 使用 nvm install 18 切换到稳定的 Node.js v18.20.8

# 运行测试
npm test

# 运行测试覆盖率
npm run test:coverage

# 运行集成测试
npm run test:integration
```

## 🐛 问题排查

### 常见问题

#### 1. npm install 失败
```bash
# 解决方案：切换到Node.js 18.x
nvm install 18
nvm use 18
rm -rf node_modules package-lock.json
npm install
```

#### 2. 交易所API连接失败
- 检查API密钥是否正确
- 确认API权限设置
- 检查网络连接和防火墙设置

#### 3. AI分析失败
- 验证DeepSeek API密钥
- 检查API配额和限制
- 查看网络连接状态

#### 4. 数据库错误
```bash
# 重置数据库
rm db/trading.db
# 重新启动应用，会自动创建新的数据库
```

### 日志查看

```bash
# 查看应用日志
tail -f logs/application-$(date +%Y-%m-%d).log

# 查看错误日志
tail -f logs/error-$(date +%Y-%m-%d).log
```

## 📊 性能优化

### 数据库优化
- 定期清理历史数据
- 创建适当的索引
- 使用事务批量操作

### 网络优化
- 实现请求缓存
- 使用连接池
- 设置合理的超时时间

### 内存优化
- 及时释放不用的对象
- 使用流式处理大量数据
- 监控内存使用情况

## 🔒 安全注意事项

### API密钥安全
- 永远不要将API密钥提交到版本控制系统
- 使用环境变量存储敏感信息
- 定期轮换API密钥
- 设置最小权限原则

### 数据安全
- 定期备份数据库
- 加密敏感数据
- 实施访问控制

### 网络安全
- 使用HTTPS连接
- 验证SSL证书
- 实施请求限制

## 🤝 贡献指南

我们欢迎所有形式的贡献！

### 如何贡献

1. **Fork** 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 **Pull Request**

### 贡献类型

- 🐛 **Bug修复**
- ✨ **新功能开发** 
- 📚 **文档改进**
- 🎨 **UI/UX改进**
- ⚡ **性能优化**
- 🧪 **测试覆盖**

### 开发规范

- 遵循现有代码风格
- 添加适当的测试
- 更新相关文档
- 确保所有测试通过

## 📈 路线图

### v1.1.0 (计划中)
- [ ] Web界面支持
- [ ] 更多技术指标
- [ ] 策略回测功能
- [ ] 风险管理模块

### v1.2.0 (计划中)
- [ ] 多账户管理
- [ ] 实盘交易支持
- [ ] 高级图表分析
- [ ] 移动端应用

### v2.0.0 (长期规划)
- [ ] 机器学习模型
- [ ] 量化策略平台
- [ ] 社区策略分享
- [ ] 云端部署支持

## 📄 许可证

本项目基于 [MIT License](LICENSE) 开源。

```
MIT License

Copyright (c) 2024 StockPulse.AI

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## 🙏 致谢

感谢以下开源项目和服务：

- [CCXT](https://github.com/ccxt/ccxt) - 统一的加密货币交易库
- [Technical Indicators](https://github.com/anandanand84/technicalindicators) - 技术指标计算库
- [DeepSeek AI](https://www.deepseek.com/) - AI分析服务
- [Winston](https://github.com/winstonjs/winston) - 日志管理库
- [Better SQLite3](https://github.com/WiseLibs/better-sqlite3) - 高性能SQLite库
- [Electron](https://www.electronjs.org/) - 跨平台桌面应用框架

## 📞 联系我们

- **GitHub Issues**: [项目问题反馈](https://github.com/your-username/stockpulse.ai/issues)
- **Email**: support@stockpulse.ai
- **Discord**: [加入我们的社区](https://discord.gg/stockpulse-ai)

---

<div align="center">

**[⬆ 回到顶部](#-stockpulseai---ai驱动的加密货币交易机器人)**

Made with ❤️ by the StockPulse.AI Team

</div>