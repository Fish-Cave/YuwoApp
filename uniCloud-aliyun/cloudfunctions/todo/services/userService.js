// services/userService.js
const db = uniCloud.database();
const dbCmd = db.command;

// 引入工具模块
const authUtils = require('../utils/auth');

/**
 * @module userService
 * @description 用户相关服务模块
 */
module.exports = {
  /**
   * 获取用户的基本信息（昵称、头像）。
   * @param {string} userId - 要查询的用户ID。
   * @param {object} clientInfo - 客户端信息，用于权限验证。
   * @returns {Promise<object>} 包含用户信息的查询结果。
   */
  async getUserInfo(userId, clientInfo) {
    // 权限检查：用户只能获取自己的信息，或管理员可获取任何人的信息
    const authResult = authUtils.checkSelfOrAdmin(clientInfo, userId);
    if (authResult.errCode) {
      return authResult;
    }

    if (!userId) {
      return { errCode: 'PARAM_ERROR', errMsg: '缺少用户ID' };
    }

    try {
      const res = await db.collection('uni-id-users').where({
        _id: userId
      }).field({
        "nickname": true,
        "avatar": true,
        "avatar_file": true
      }).get();

      if (res.data.length === 0) {
        return { errCode: 'NOT_FOUND', errMsg: '未找到该用户' };
      }
      return { errCode: 0, errMsg: '获取用户信息成功', data: res.data[0] };
    } catch (e) {
      console.error("userService.getUserInfo error:", e);
      return { errCode: 'DB_ERROR', errMsg: '获取用户信息失败: ' + e.message };
    }
  },

  /**
   * 获取用户的会员信息（会员卡、周/月卡）。
   * @param {string} userId - 要查询的用户ID。
   * @param {object} clientInfo - 客户端信息，用于权限验证。
   * @returns {Promise<object>} 包含会员信息的对象。
   */
  async getUserMembershipInfo(userId, clientInfo) {
    // 权限检查：用户只能获取自己的信息，或管理员可获取任何人的信息
    const authResult = authUtils.checkSelfOrAdmin(clientInfo, userId);
    if (authResult.errCode) {
      return authResult;
    }

    const dbJQL = uniCloud.databaseForJQL({ clientInfo });
    try {
      const membershipRes = await dbJQL.collection('membership')
        .where({
          userID: userId,
          status: true,
          validthru: dbJQL.command.gt(Date.now())
        }).get();

      const subscriptionPackageRes = await dbJQL.collection('subscription-package')
        .where({
          userID: userId,
          status: true,
          validthru: dbJQL.command.gt(Date.now())
        }).get();

      return {
        errCode: 0,
        errMsg: '获取会员信息成功',
        data: {
          membership: membershipRes.data || [],
          subscriptionPackage: subscriptionPackageRes.data || [],
        }
      };
    } catch (e) {
      console.error("userService.getUserMembershipInfo error:", e);
      return { errCode: 'DB_ERROR', errMsg: '获取会员信息失败: ' + e.message };
    }
  },

  /**
   * 更新用户的收藏列表。
   * @param {string} userId - 用户ID。
   * @param {string} content - 要添加的收藏内容。
   * @param {object} clientInfo - 客户端信息，用于权限验证。
   * @returns {Promise<object>} 操作结果。
   */
  async updateLoved(userId, content, clientInfo) {
    // 权限检查：用户只能更新自己的收藏
    const authResult = authUtils.checkSelfOrAdmin(clientInfo, userId);
    if (authResult.errCode) {
      return authResult;
    }

    try {
      const collection = db.collection('loved');
      const userLoved = await collection.where({ userid: userId }).get();

      if (userLoved.data.length === 0) {
        // 用户没有收藏记录，先创建
        await collection.add({ userid: userId, love: [content] });
      } else {
        // 用户已有收藏记录，检查是否已存在
        const isExist = userLoved.data[0].love.includes(content);
        if (!isExist) {
          await collection.where({ userid: userId }).update({
            love: dbCmd.push(content)
          });
        }
      }
      return { errCode: 0, errMsg: '收藏更新成功' };
    } catch (e) {
      console.error("userService.updateLoved error:", e);
      return { errCode: 'DB_ERROR', errMsg: '更新收藏失败: ' + e.message };
    }
  },

  /**
   * 查询用户的收藏列表。
   * @param {string} userId - 用户ID。
   * @param {object} clientInfo - 客户端信息，用于权限验证。
   * @returns {Promise<object>} 包含收藏列表的查询结果。
   */
  async queryLoved(userId, clientInfo) {
    // 权限检查：用户只能查询自己的收藏
    const authResult = authUtils.checkSelfOrAdmin(clientInfo, userId);
    if (authResult.errCode) {
      return authResult;
    }

    try {
      const res = await db.collection('loved').where({ userid: userId }).get();
      if (res.data.length === 0) {
        return { errCode: 0, data: [], errMsg: "用户暂无收藏内容" };
      }
      return { errCode: 0, data: res.data[0].love || [], errMsg: "查询成功" };
    } catch (e) {
      console.error("userService.queryLoved error:", e);
      return { errCode: 'DB_ERROR', errMsg: '查询收藏列表失败: ' + e.message };
    }
  },

  /**
   * 获取角色为 preUser 的用户列表 (仅限管理员)。
   * @param {object} clientInfo - 客户端信息，用于权限验证。
   * @returns {Promise<object>} 包含 preUser 用户的列表。
   */
  async getPreUsers(clientInfo) {
    const authError = authUtils.checkAdminPermission(clientInfo);
    if (authError) {
      return authError;
    }

    const dbJQL = uniCloud.databaseForJQL({ clientInfo });
    try {
      const res = await dbJQL.collection('uni-id-users')
        .where({ role: 'preUser' })
        .field({ "_id": true, "nickname": true, "username": true })
        .get();
      return { errCode: 0, data: res.data };
    } catch (e) {
      console.error('userService.getPreUsers error:', e);
      return { errCode: 'DB_ERROR', errMsg: '获取 preUser 列表失败: ' + e.message };
    }
  },

  /**
   * 提升用户角色从 preUser 到 user (仅限管理员)。
   * @param {object} params - 包含 userId 的对象。
   * @param {object} clientInfo - 客户端信息，用于权限验证。
   * @returns {Promise<object>} 操作结果。
   */
  async promoteUserRole(params, clientInfo) {
    const authError = authUtils.checkAdminPermission(clientInfo);
    if (authError) {
      return authError;
    }

    const { userId } = params;
    if (!userId) {
      return { errCode: 'PARAM_ERROR', errMsg: '缺少用户ID' };
    }

    const dbJQL = uniCloud.databaseForJQL({ clientInfo });
    try {
      await dbJQL.collection('uni-id-users').doc(userId).update({
        role: ["user"] // 确保角色是数组格式
      });
      return { errCode: 0, errMsg: '权限提升成功' };
    } catch (e) {
      console.error('userService.promoteUserRole error:', e);
      return { errCode: 'DB_ERROR', errMsg: '提升用户权限失败: ' + e.message };
    }
  },

  /**
   * 查询当前有多少玩家正在场内（未结算）。
   * @param {object} clientInfo - 客户端信息，用于权限验证。
   * @returns {Promise<object>} 包含玩家数量的结果。
   */
  async howManyPlayer(clientInfo) {
    // 权限检查：登录用户均可查看
    const authError = authUtils.checkUserOrAdminPermission(clientInfo);
    if (authError) {
      return authError;
    }

    const dbJQL = uniCloud.databaseForJQL({ clientInfo });
    try {
      const res = await dbJQL.collection('signin').where({ status: 0 }).count();
      return { errCode: 0, data: { count: res.total }, errMsg: '查询成功' };
    } catch (e) {
      console.error('userService.howManyPlayer error:', e);
      return { errCode: 'DB_ERROR', errMsg: '查询在场玩家数量失败: ' + e.message };
    }
  },

  /**
   * 更新客服电话 (仅限管理员)。
   * @param {object} params - 包含 newPhoneNo 的对象。
   * @param {object} clientInfo - 客户端信息，用于权限验证。
   * @returns {Promise<object>} 操作结果。
   */
  async updateCustomerServicePhone(params, clientInfo) {
    const authError = authUtils.checkAdminPermission(clientInfo);
    if (authError) {
      return authError;
    }

    const { newPhoneNo } = params;
    if (!newPhoneNo || typeof newPhoneNo !== 'string') {
      return { errCode: 'INVALID_PARAMS', errMsg: '缺少有效的 newPhoneNo 参数' };
    }

    const collection = db.collection('customer-service-phone');
    try {
      const existingRecord = await collection.limit(1).get();
      if (existingRecord.data && existingRecord.data.length > 0) {
        const recordId = existingRecord.data[0]._id;
        await collection.doc(recordId).update({ phoneNo: newPhoneNo, updateTime: Date.now() });
      } else {
        await collection.add({ phoneNo: newPhoneNo, createTime: Date.now() });
      }
      return { errCode: 0, errMsg: '客服电话更新成功' };
    } catch (e) {
      console.error("userService.updateCustomerServicePhone error:", e);
      return { errCode: 'DB_ERROR', errMsg: '数据库操作失败: ' + e.message };
    }
  },

  /**
   * 获取客服电话 (登录用户均可)。
   * @param {object} clientInfo - 客户端信息，用于权限验证。
   * @returns {Promise<object>} 包含客服电话的数据。
   */
  async getCustomerServicePhone(clientInfo) {
    const authError = authUtils.checkUserOrAdminPermission(clientInfo);
    if (authError) {
      return authError;
    }

    const collection = db.collection('customer-service-phone');
    try {
      const res = await collection.limit(1).get();
      if (res.data && res.data.length > 0) {
        return { errCode: 0, data: { phoneNo: res.data[0].phoneNo } };
      } else {
        return { errCode: 0, data: { phoneNo: '' }, errMsg: '未设置客服电话' };
      }
    } catch (e) {
      console.error("userService.getCustomerServicePhone error:", e);
      return { errCode: 'DB_ERROR', errMsg: '数据库操作失败: ' + e.message };
    }
  },
};
