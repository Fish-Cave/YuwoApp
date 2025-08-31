/**
 * utils/log.js
 * 日志相关工具函数
 * 提供统一的日志记录接口，方便未来扩展和集成第三方日志服务。
 */

/**
 * 获取当前时间戳并格式化为可读字符串
 * @returns {string} 格式化后的时间字符串 (ISO 8601 格式)
 */
function getTimestamp() {
  const now = new Date();
  return now.toISOString(); 
}

/**
 * 记录信息日志
 * @param {string} message 日志消息
 * @param {any[]} args 附加参数，将直接传递给 console.log
 */
function info(message, ...args) {
  console.log(`[INFO] [${getTimestamp()}] ${message}`, ...args);
}

/**
 * 记录警告日志
 * @param {string} message 日志消息
 * @param {any[]} args 附加参数，将直接传递给 console.warn
 */
function warn(message, ...args) {
  console.warn(`[WARN] [${getTimestamp()}] ${message}`, ...args);
}

/**
 * 记录错误日志
 * @param {string} message 日志消息
 * @param {any[]} args 附加参数，将直接传递给 console.error
 */
function error(message, ...args) {
  console.error(`[ERROR] [${getTimestamp()}] ${message}`, ...args);
}

module.exports = {
  info,
  warn,
  error,
  // 未来可以根据需要添加更多日志级别，例如 debug, verbose 等。
  // 也可以在这里集成第三方日志服务，如 Sentry, Loggly 等，而无需修改业务代码。
};
