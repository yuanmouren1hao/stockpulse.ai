/**
 * @file NotificationManager.js
 * @description 通知管理器
 */

// 尝试不同的导入方式以兼容不同版本的 nodemailer
let nodemailer;
try {
    nodemailer = require('nodemailer');
    // 如果是 ES 模块，可能需要访问 default
    if (nodemailer.default) {
        nodemailer = nodemailer.default;
    }
} catch (error) {
    console.error('无法加载 nodemailer:', error);
}

const axios = require('axios');
const { logger } = require('../utils/logger.js');
const { getConfig } = require('../utils/config.js');

/**
 * @class NotificationManager
 * @description 通知管理器，负责邮件和推送通知
 */
class NotificationManager {
    constructor() {
        this.config = getConfig();
        this.emailTransporter = null;
        this.initializeEmailTransporter();
        logger.info('NotificationManager initialized');
    }

    /**
     * 初始化邮件传输器
     */
    initializeEmailTransporter() {
        // 检查 nodemailer 是否正确加载
        if (!nodemailer || typeof nodemailer.createTransporter !== 'function') {
            logger.warn('nodemailer 未正确加载，邮件通知功能将被禁用');
            return;
        }
        
        if (this.config.SMTP_HOST && this.config.SMTP_USER && this.config.SMTP_PASS) {
            try {
                this.emailTransporter = nodemailer.createTransporter({
                    host: this.config.SMTP_HOST,
                    port: this.config.SMTP_PORT,
                    secure: this.config.SMTP_SECURE,
                    auth: {
                        user: this.config.SMTP_USER,
                        pass: this.config.SMTP_PASS
                    }
                });
                logger.info('邮件传输器初始化成功');
            } catch (error) {
                logger.error('邮件传输器初始化失败:', error);
            }
        } else {
            logger.warn('邮件配置不完整，邮件通知功能将被禁用');
        }
    }

    /**
     * 发送邮件通知
     * @param {string} subject - 邮件主题
     * @param {string} text - 邮件内容
     */
    async sendEmail(subject, text) {
        // 检查是否启用邮件通知
        if (!this.config.ENABLE_EMAIL_NOTIFICATION) {
            logger.debug('邮件通知已禁用，跳过邮件发送');
            return;
        }

        if (!this.emailTransporter) {
            logger.warn('邮件传输器未配置，跳过邮件发送');
            return;
        }

        try {
            logger.info('========== 开始发送邮件通知 ==========');
            logger.info(`收件人: ${this.config.NOTIFICATION_EMAIL_TO}`);
            logger.info(`主题: ${subject}`);
            logger.info(`内容: ${text.substring(0, 200)}...`);

            const mailOptions = {
                from: this.config.SMTP_USER,
                to: this.config.NOTIFICATION_EMAIL_TO,
                subject: subject,
                text: text
            };

            const info = await this.emailTransporter.sendMail(mailOptions);
            
            logger.info(`✅ 邮件发送成功`);
            logger.info(`消息ID: ${info.messageId}`);
            logger.info(`响应: ${info.response}`);
            logger.info('======================================');

        } catch (error) {
            logger.error('❌ 邮件发送失败:');
            logger.error(`错误消息: ${error.message}`);
            logger.error(`错误详情: ${JSON.stringify(error, null, 2)}`);
        }
    }

    /**
     * 发送ntfy推送通知
     * @param {string} title - 通知标题
     * @param {string} message - 通知内容
     * @param {string} priority - 优先级
     */
    async sendNtfyNotification(title, message, priority = 'default') {
        // 检查是否启用ntfy通知
        if (!this.config.ENABLE_NTFY_NOTIFICATION) {
            logger.debug('ntfy通知已禁用，跳过推送发送');
            return;
        }

        if (!this.config.NTFY_TOPIC) {
            logger.warn('ntfy配置不完整，跳过推送发送');
            return;
        }

        try {
            logger.info('========== 开始发送 ntfy 推送通知 ==========');
            const url = `${this.config.NTFY_BASE_URL}/${this.config.NTFY_TOPIC}`;
            logger.info(`推送URL: ${url}`);
            logger.info(`标题: ${title}`);
            logger.info(`内容: ${message.substring(0, 200)}...`);
            logger.info(`优先级: ${priority} -> ${this.getPriorityLevel(priority)}`);
            
            // 对包含中文的 Header 进行 Base64 编码
            const encodedTitle = Buffer.from(title, 'utf-8').toString('base64');
            
            const headers = {
                'Title': `=?UTF-8?B?${encodedTitle}?=`,
                'Priority': this.getPriorityLevel(priority),
                'Tags': 'trading,crypto'
            };

            logger.info(`请求头: ${JSON.stringify(headers, null, 2)}`);

            const response = await axios.post(url, message, { headers });

            logger.info(`✅ ntfy推送发送成功`);
            logger.info(`响应状态: ${response.status} ${response.statusText}`);
            logger.info(`响应数据: ${JSON.stringify(response.data, null, 2)}`);
            logger.info('==========================================');

        } catch (error) {
            logger.error('❌ ntfy推送发送失败:');
            logger.error(`错误消息: ${error.message}`);
            if (error.response) {
                logger.error(`响应状态: ${error.response.status}`);
                logger.error(`响应数据: ${JSON.stringify(error.response.data, null, 2)}`);
            }
            logger.error(`错误详情: ${JSON.stringify(error, null, 2)}`);
        }
    }

    /**
     * 发送企业微信机器人通知
     * @param {string} title - 通知标题
     * @param {string} message - 通知内容
     */
    async sendWeComNotification(title, message) {
        // 检查是否启用企业微信通知
        if (!this.config.ENABLE_WECOM_NOTIFICATION) {
            logger.debug('企业微信通知已禁用，跳过消息发送');
            return;
        }

        if (!this.config.WECOM_WEBHOOK_URL) {
            logger.warn('企业微信Webhook配置不完整，跳过消息发送');
            return;
        }

        try {
            logger.info('========== 开始发送企业微信通知 ==========');
            logger.info(`Webhook URL: ${this.config.WECOM_WEBHOOK_URL}`);
            logger.info(`标题: ${title}`);
            logger.info(`内容: ${message.substring(0, 200)}...`);

            // 企业微信支持 Markdown 格式
            const content = `### ${title}\n${message}`;
            
            const requestBody = {
                msgtype: 'markdown',
                markdown: {
                    content: content
                }
            };

            logger.info(`请求体: ${JSON.stringify(requestBody, null, 2)}`);

            const response = await axios.post(this.config.WECOM_WEBHOOK_URL, requestBody);

            logger.info(`✅ 企业微信消息发送成功`);
            logger.info(`响应状态: ${response.status} ${response.statusText}`);
            logger.info(`响应数据: ${JSON.stringify(response.data, null, 2)}`);
            logger.info('=========================================');

        } catch (error) {
            logger.error('❌ 企业微信消息发送失败:');
            logger.error(`错误消息: ${error.message}`);
            if (error.response) {
                logger.error(`响应状态: ${error.response.status}`);
                logger.error(`响应数据: ${JSON.stringify(error.response.data, null, 2)}`);
            }
            logger.error(`错误详情: ${JSON.stringify(error, null, 2)}`);
        }
    }

    /**
     * 发送系统通知
     * @param {string} title - 通知标题
     * @param {string} message - 通知内容
     */
    async sendSystemNotification(title, message) {
        logger.info(`系统通知: ${title} - ${message}`);
        
        // 同时发送邮件、推送和企业微信
        await Promise.all([
            this.sendEmail(`[系统通知] ${title}`, message),
            this.sendNtfyNotification(title, message, 'high'),
            this.sendWeComNotification(title, message)
        ]);
    }

    /**
     * 获取优先级级别
     * @param {string} priority - 优先级字符串
     * @returns {string} 数字优先级
     */
    getPriorityLevel(priority) {
        const priorityMap = {
            '强烈买入': '5',
            '买入': '4', 
            '中性': '3',
            '卖出': '4',
            '强烈卖出': '5',
            'high': '4',
            'default': '3',
            'low': '2'
        };
        
        return priorityMap[priority] || '3';
    }
}

module.exports = { NotificationManager };