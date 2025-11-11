/**
 * @file scheduler.js
 * @description 调度工具模块，提供延迟执行、定时任务等工具函数
 */

/**
 * 等待指定的毫秒数
 * @param {number} ms - 等待的毫秒数
 * @returns {Promise<void>} Promise对象
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 创建一个延迟执行的函数
 * @param {Function} func - 要延迟执行的函数
 * @param {number} delay - 延迟时间（毫秒）
 * @returns {Function} 包装后的函数
 */
function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

/**
 * 创建一个节流函数
 * @param {Function} func - 要节流的函数
 * @param {number} limit - 时间限制（毫秒）
 * @returns {Function} 包装后的函数
 */
function throttle(func, limit) {
    let inThrottle;
    return function (...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * 重试执行函数
 * @param {Function} func - 要重试的异步函数
 * @param {number} maxRetries - 最大重试次数
 * @param {number} delay - 重试间隔（毫秒）
 * @returns {Promise<any>} 函数执行结果
 */
async function retry(func, maxRetries = 3, delay = 1000) {
    let lastError;
    
    for (let i = 0; i <= maxRetries; i++) {
        try {
            return await func();
        } catch (error) {
            lastError = error;
            if (i < maxRetries) {
                await sleep(delay);
            }
        }
    }
    
    throw lastError;
}

module.exports = {
    sleep,
    debounce,
    throttle,
    retry
};