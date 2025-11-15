# SQLite 移除总结

## 问题背景
遇到 `better-sqlite3` 与 Electron 的 Node.js 版本不兼容问题：
```
NODE_MODULE_VERSION 108 vs NODE_MODULE_VERSION 121
```

## 解决方案
完全移除 SQLite 依赖，改用 Supabase 云数据库作为唯一的持久化存储方案。

## 已完成的修改

### 1. 依赖移除
- ✅ 从 `package.json` 中移除 `better-sqlite3` 依赖
- ✅ 执行 `npm uninstall better-sqlite3` 卸载模块

### 2. TradingBot.js 修改
- ✅ 注释 `DatabaseManager` 的引入
- ✅ 注释 `databaseManager` 实例化
- ✅ 移除数据库初始化调用
- ✅ 移除数据库关闭调用
- ✅ 移除所有 `saveKlineData()` 本地保存调用
- ✅ 移除所有 `saveIndicators()` 本地保存调用
- ✅ 移除所有 `saveDecisionLog()` 本地保存调用
- ✅ 保留 Supabase 云存储调用（作为唯一存储方案）

### 3. StockMonitor.js 修改
- ✅ 注释 `DatabaseManager` 的引入
- ✅ 注释 `databaseManager` 实例化
- ✅ 移除数据库初始化调用
- ✅ 修改 `saveStockData()` 方法，注释掉所有SQLite保存代码
- ✅ 添加说明注释，提示SQLite已移除

### 4. 保留文件
- ✅ 保留 `src/backend/db/DatabaseManager.js` 文件（仅作参考，未来可能需要）
- ✅ 保留 `db/` 目录中的历史数据文件

## 当前数据存储方案

### 加密货币监控（TradingBot）
- **主存储**: Supabase 云数据库
- **备用方案**: 无（如需要可重新启用SQLite或使用其他方案）

### 股票监控（StockMonitor）
- **主存储**: 无持久化存储（仅处理和通知）
- **备用方案**: 可集成 Supabase 或重新启用 SQLite

## 注意事项

1. **数据持久化**: 目前股票监控数据不会持久化存储，只做实时分析和通知
2. **Supabase依赖**: 加密货币监控依赖Supabase，如果Supabase不可用会记录警告但继续运行
3. **历史数据**: 之前存储在 `db/` 目录的SQLite数据仍然保留，未删除

## 如需恢复SQLite

如果将来需要恢复SQLite支持：

1. 重新安装依赖：
```bash
npm install better-sqlite3
```

2. 针对 Electron 重新编译：
```bash
npm install --save-dev electron-rebuild
npx electron-rebuild
```

3. 取消注释相关代码：
   - `TradingBot.js` 中的 DatabaseManager 调用
   - `StockMonitor.js` 中的 DatabaseManager 调用

## 测试建议

启动应用后验证：
- ✅ 加密货币监控可以正常启动
- ✅ 股票监控可以正常启动
- ✅ 不再出现 better-sqlite3 相关错误
- ✅ Supabase 连接正常（如已配置）

---
修改时间: 2025-11-15
修改原因: 解决 better-sqlite3 与 Electron Node.js 版本不兼容问题
