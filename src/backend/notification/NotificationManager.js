/**
 * @file NotificationManager.js
 * @description 通知管理器
 */

const nodemailer = require('nodemailer');
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
        if (!this.emailTransporter) {
            logger.warn('邮件传输器未配置，跳过邮件发送');
            return;
        }

        try {
            const mailOptions = {
                from: this.config.SMTP_USER,
                to: this.config.NOTIFICATION_EMAIL_TO,
                subject: subject,
                text: text
            };

            await this.emailTransporter.sendMail(mailOptions);
            logger.info(`邮件发送成功: ${subject}`);

        } catch (error) {
            logger.error('邮件发送失败:', error);
        }
    }

    /**
     * 发送ntfy推送通知
     * @param {string} title - 通知标题
     * @param {string} message - 通知内容
     * @param {string} priority - 优先级
     */
    async sendNtfyNotification(title, message, priority = 'default') {
        if (!this.config.NTFY_TOPIC) {
            logger.warn('ntfy配置不完整，跳过推送发送');
            return;
        }

        try {
            const url = `${this.config.NTFY_BASE_URL}/${this.config.NTFY_TOPIC}`;
            
            await axios.post(url, message, {
                headers: {
                    'Title': title,
                    'Priority': this.getPriorityLevel(priority),
                    'Tags': 'trading,crypto'
                }
            });

            logger.info(`ntfy推送发送成功: ${title}`);

        } catch (error) {
            logger.error('ntfy推送发送失败:', error);
        }
    }

    /**
     * 发送系统通知
     * @param {string} title - 通知标题
     * @param {string} message - 通知内容
     */
    async sendSystemNotification(title, message) {
        logger.info(`系统通知: ${title} - ${message}`);
        
        // 同时发送邮件和推送
        await Promise.all([
            this.sendEmail(`[系统通知] ${title}`, message),
            this.sendNtfyNotification(title, message, 'high')
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