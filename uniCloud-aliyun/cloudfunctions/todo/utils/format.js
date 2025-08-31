/**
 * utils/format.js
 * 格式化相关工具函数
 */

/**
 * 根据订单状态码返回对应的文本描述。
 * @param {number|string} status 订单状态码 (0:待确认, 1:已完成, 2:未完成, 3:已退款)
 * @returns {string} 状态文本
 */
function getStatusText(status) {
  switch (parseInt(status)) {
    case 0: return '待确认';
    case 1: return '已完成';
    case 2: return '未完成';
    case 3: return '已退款';
    default: return '未知状态';
  }
}

/**
 * 将时间戳格式化为 "YYYY-MM-DD HH:mm" 格式的字符串。
 * @param {number|Date} timestamp 时间戳 (毫秒) 或 Date 对象
 * @returns {string} 格式化后的日期时间字符串，如果无效则返回 '--'
 */
function formatDateTime(timestamp) {
  if (!timestamp) return '--';
  const date = new Date(timestamp);
  // 检查日期是否有效
  if (isNaN(date.getTime())) {
    return '--';
  }
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

module.exports = {
  getStatusText,
  formatDateTime,
};
