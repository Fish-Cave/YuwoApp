// services/connectCodeService.js
const db = uniCloud.database();

// 引入工具模块
const authUtils = require('../utils/auth');

// 连接码有效期（毫秒），例如 5 分钟
const CODE_EXPIRATION_MS = 5 * 60 * 1000;

/**
 * @module connectCodeService
 * @description 连接码相关服务模块
 */
module.exports = {
  /**
   * 生成一个用于设备连接的唯一码。
   * @param {object} clientInfo - 客户端信息，用于获取当前用户ID。
   * @returns {Promise<object>} 操作结果，包含生成的连接码和有效期。
   */
  async generateConnectCode(clientInfo) {
    const authError = authUtils.checkUserOrAdminPermission(clientInfo);
    if (authError) {
      return authError;
    }
    const userId = clientInfo.uid;

    try {
      const collection = db.collection('connect-codes');
      let code;
      let isUnique = false;

      // 循环生成一个唯一的6位数字码
      while (!isUnique) {
        code = Math.floor(100000 + Math.random() * 900000).toString();
        const check = await collection.where({ code: code, status: 'pending' }).count();
        if (check.total === 0) {
          isUnique = true;
        }
      }

      const createdAt = Date.now();
      const expiresAt = createdAt + CODE_EXPIRATION_MS;

      await collection.add({
        code: code,
        user_id: userId,
        status: 'pending', // 'pending', 'used', 'expired'
        created_at: createdAt,
        expires_at: expiresAt
      });

      return {
        errCode: 0,
        errMsg: '连接码生成成功',
        data: {
          code: code,
          expiresIn: CODE_EXPIRATION_MS / 1000 // 返回秒
        }
      };
    } catch (e) {
      console.error("connectCodeService.generateConnectCode error:", e);
      return { errCode: 'DB_ERROR', errMsg: '生成连接码失败: ' + e.message };
    }
  },

  /**
   * 使用连接码进行验证。通常由待登录的设备调用。
   * @param {string} code - 用户输入的6位连接码。
   * @returns {Promise<object>} 验证结果，成功时包含用户信息。
   */
  async useConnectCode(code) {
    if (!code || code.length !== 6) {
      return { errCode: 'INVALID_CODE', errMsg: '无效的连接码格式' };
    }

    try {
      const collection = db.collection('connect-codes');
      const codeRecord = await collection.where({
        code: code,
        status: 'pending',
        expires_at: db.command.gt(Date.now())
      }).get();

      if (!codeRecord.data || codeRecord.data.length === 0) {
        return { errCode: 'CODE_NOT_FOUND_OR_EXPIRED', errMsg: '连接码无效或已过期' };
      }

      const record = codeRecord.data[0];

      // 将码状态更新为已使用
      await collection.doc(record._id).update({
        status: 'used'
      });

      // 返回关联的用户信息，以便设备端完成登录
      const userRes = await db.collection('uni-id-users')
        .doc(record.user_id)
        .field({ _id: true, nickname: true, avatar: true, avatar_file: true })
        .get();

      if (!userRes.data || userRes.data.length === 0) {
        return { errCode: 'USER_NOT_FOUND', errMsg: '连接码关联的用户不存在' };
      }

      return {
        errCode: 0,
        errMsg: '连接成功',
        data: {
          userInfo: userRes.data[0]
          // 在实际应用中，这里可能会返回一个JWT token
        }
      };
    } catch (e) {
      console.error("connectCodeService.useConnectCode error:", e);
      return { errCode: 'DB_ERROR', errMsg: '验证连接码失败: ' + e.message };
    }
  },

  /**
   * 检查连接码的状态。由生成码的客户端轮询调用。
   * @param {string} code - 要检查的连接码。
   * @param {object} clientInfo - 客户端信息，用于验证操作权限。
   * @returns {Promise<object>} 连接码的当前状态。
   */
  async checkCodeStatus(code, clientInfo) {
    const authError = authUtils.checkUserOrAdminPermission(clientInfo);
    if (authError) {
      return authError;
    }
    const userId = clientInfo.uid;

    if (!code) {
      return { errCode: 'PARAM_ERROR', errMsg: '缺少连接码' };
    }

    try {
      const collection = db.collection('connect-codes');
      const codeRecord = await collection.where({ code: code }).get();

      if (!codeRecord.data || codeRecord.data.length === 0) {
        return { errCode: 'NOT_FOUND', errMsg: '未找到该连接码' };
      }

      const record = codeRecord.data[0];

      // 安全检查：确保是生成该码的用户本人在查询
      if (record.user_id !== userId) {
        return { errCode: 'PERMISSION_DENIED', errMsg: '无权查询此连接码' };
      }

      // 如果码已过期但状态仍是 pending，则更新为 expired
      if (record.status === 'pending' && record.expires_at < Date.now()) {
        await collection.doc(record._id).update({ status: 'expired' });
        record.status = 'expired';
      }

      return {
        errCode: 0,
        data: {
          status: record.status // 'pending', 'used', 'expired'
        }
      };
    } catch (e) {
      console.error("connectCodeService.checkCodeStatus error:", e);
      return { errCode: 'DB_ERROR', errMsg: '检查连接码状态失败: ' + e.message };
    }
  }
};
