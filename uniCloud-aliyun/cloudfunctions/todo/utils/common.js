/**
 * utils/common.js
 * 通用工具函数
 */

/**
 * 生成一个符合 UUID v4 格式的唯一标识符。
 * @returns {string} UUID 字符串
 */
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * 记录订单编辑日志。
 * 此函数需要访问数据库，因此需要传入 db 实例或在内部获取。
 * 为了保持模块的独立性，我们让它在内部获取 db 实例。
 * @param {object} logData 日志数据，包含 orderId, operatorId, editType, changes, reason, editTime
 */
async function logOrderEdit(logData) {
  const db = uniCloud.database();
  try {
    // 获取操作人信息
    const operatorResult = await db.collection('uni-id-users')
      .doc(logData.operatorId)
      .field("nickname,username")
      .get();

    const operatorName = operatorResult.data.length > 0
      ? (operatorResult.data[0].nickname || operatorResult.data[0].username)
      : '未知用户';

    // 添加日志记录
    await db.collection('order-edit-logs').add({
      orderId: logData.orderId,
      operatorId: logData.operatorId,
      operatorName: operatorName,
      editType: logData.editType,
      changes: logData.changes,
      reason: logData.reason,
      editTime: logData.editTime || Date.now() // 如果没有提供，则使用当前时间
    });
    console.log("订单编辑日志记录成功:", logData);
  } catch (e) {
    console.error("记录订单编辑日志失败:", e);
    // 日志记录失败不影响主要业务逻辑，但需要记录错误
  }
}

module.exports = {
  generateUUID,
  logOrderEdit,
};
