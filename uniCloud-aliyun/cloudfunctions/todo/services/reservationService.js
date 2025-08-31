// services/reservationService.js
const db = uniCloud.database();
const dbCmd = db.command;

// 引入工具模块
const authUtils = require('../utils/auth');
// 引入其他服务模块，用于处理跨服务逻辑
const statisticsService = require('./statisticsService');
const userService = require('./userService');

/**
 * @module reservationService
 * @description 预约及签到相关服务模块
 */
module.exports = {
  /**
   * 添加新的预约记录。
   * 包含复杂的容量检查、价格计算和时间冲突验证。
   * @param {object} content - 预约信息，包含 startTime, endTime, machineId, userId, isOvernight 等。
   * @param {object} clientInfo - 客户端信息，用于权限验证和JQL查询。
   * @returns {Promise<object>} 操作结果，成功时包含新预约的 ID。
   */
  async addReservation(content, clientInfo) {
    // 权限检查：登录用户（user或admin）才能预约
    const authError = authUtils.checkUserOrAdminPermission(clientInfo);
    if (authError) {
      return authError;
    }

    const { startTime, endTime, machineId, userId, isOvernight } = content;

    // 1. 输入验证
    if (!startTime || !endTime || !machineId || !userId) {
      return { errCode: 'INVALID_PARAMS', errMsg: '缺少必要参数' };
    }
    if (startTime >= endTime) {
      return { errCode: 'INVALID_TIME_RANGE', errMsg: '开始时间必须早于结束时间' };
    }

    try {
      // 2. 获取机台信息
      const machineInfoRes = await db.collection('machines').doc(machineId).field({ capacity: true }).get();
      if (machineInfoRes.data.length === 0) {
        return { errCode: 'MACHINE_NOT_FOUND', errMsg: '未找到指定的机台信息' };
      }
      const maxCapacity = Number(machineInfoRes.data[0].capacity) || 1;

      // 3. 获取用户会员信息
      const membershipInfo = await userService.getUserMembershipInfo(userId, clientInfo);
      if (membershipInfo.errCode) {
        return membershipInfo; // 如果获取会员信息失败，则返回错误
      }

      // 4. 根据会员信息计算价格
      let price;
      const priceCollection = db.collection('prices');
      if (isOvernight) {
        const priceInfo = await priceCollection.where({ type: 'overnight' }).get();
        price = priceInfo.data.length > 0 ? priceInfo.data[0].price : 50; // 默认50
      } else {
        const priceInfo = await priceCollection.where({ type: 'normal' }).get();
        price = priceInfo.data.length > 0 ? priceInfo.data[0].price : 5; // 默认5
      }

      // 应用会员折扣
      if (membershipInfo.data.subscriptionPackage.length > 0) {
        price = 0; // 包周/月卡会员免费
      } else if (membershipInfo.data.membership.length > 0 && !isOvernight) {
        const diffHours = (endTime - startTime) / (1000 * 60 * 60);
        const halfHourUnits = Math.ceil(diffHours / 0.5);
        price = Math.min(halfHourUnits * 4, 40); // 音游会员价，当日封顶40
      }
      content.price = price;

      // 5. 检查时间冲突和机台容量
      const reservationCollection = db.collection('reservation-log');
      const [userReservations, allOverlappingReservations] = await Promise.all([
        // 查询用户自身的重叠预约
        reservationCollection.where({
          userId: userId,
          status: 1, // 状态为1表示有效预约
          _id: dbCmd.neq(content._id || null),
          startTime: dbCmd.lt(endTime),
          endTime: dbCmd.gt(startTime)
        }).limit(1).get(),
        // 查询机台的所有重叠预约（用于容量检查）
        reservationCollection.where({
          machineId: machineId,
          status: 1,
          startTime: dbCmd.lt(endTime),
          endTime: dbCmd.gt(startTime)
        }).field({ startTime: true, endTime: true }).get()
      ]);

      if (userReservations.data.length > 0) {
        return { errCode: 'TIME_CONFLICT', errMsg: '您在该时段已有其他预约' };
      }

      // 6. 检查是否超过容量限制 (当前预约数 + 1 是否超过容量)
      if (allOverlappingReservations.data.length >= maxCapacity) {
        return { errCode: 'CAPACITY_EXCEEDED', errMsg: `该时段已达预约上限 (${maxCapacity}人)，请选择其他时段` };
      }

      // 7. 添加预约记录
      const result = await reservationCollection.add({
        ...content,
        status: 1, // 默认状态为1 (已确认/有效)
        createTime: Date.now()
      });

      if (!result || !result.id) {
        return { errCode: 'DB_ADD_FAILED', errMsg: '添加预约记录失败' };
      }

      return { errCode: 0, errMsg: '预约成功', id: result.id };

    } catch (e) {
      console.error("reservationService.addReservation error:", e);
      return { errCode: 'DB_ERROR', errMsg: '数据库操作失败: ' + e.message };
    }
  },

  /**
   * 更新预约状态。
   * 通常由管理员操作，或用户取消预约。
   * @param {string} id - 预约记录的 ID。
   * @param {number} status - 新的状态码。
   * @param {object} clientInfo - 客户端信息，用于权限验证。
   * @returns {Promise<object>} 操作结果。
   */
  async updateReservation(id, status, clientInfo) {
    // 权限检查：只有管理员才能任意修改状态
    const authError = authUtils.checkAdminPermission(clientInfo);
    if (authError) {
      return authError;
    }

    if (!id || status === undefined) {
      return { errCode: 'PARAM_ERROR', errMsg: '缺少预约ID或状态码' };
    }

    const dbJQL = uniCloud.databaseForJQL({ clientInfo });
    try {
      const res = await dbJQL.collection('reservation-log').doc(id).update({
        status: Number(status)
      });
      if (res.updated === 0) {
        return { errCode: 'NOT_FOUND', errMsg: '未找到要更新的预约记录' };
      }
      return { errCode: 0, errMsg: '预约状态更新成功' };
    } catch (e) {
      console.error("reservationService.updateReservation error:", e);
      return { errCode: 'DB_ERROR', errMsg: '更新预约状态失败: ' + e.message };
    }
  },

  /**
   * 获取指定用户的预约信息列表。
   * @param {string} userId - 要查询的用户 ID。
   * @param {object} clientInfo - 客户端信息，用于权限验证。
   * @returns {Promise<object>} 包含预约列表的查询结果。
   */
  async getReservationInfo(userId, clientInfo) {
    // 权限检查：用户只能看自己的，管理员可以看所有人的
    const authResult = authUtils.checkSelfOrAdmin(clientInfo, userId);
    if (authResult.errCode) {
      return authResult;
    }

    const dbJQL = uniCloud.databaseForJQL({ clientInfo });
    const machines = dbJQL.collection('machines').field("_id,name").getTemp();
    try {
      const res = await dbJQL.collection('reservation-log', machines)
        .where({ userId: userId })
        .field({
          "_id": true,
          "machineId": true,
          "isOvernight": true,
          "status": true,
          "startTime": true,
          "isPlay": true,
        })
        .orderBy("createTime", "desc")
        .get();
      return { errCode: 0, errMsg: '获取预约信息成功', data: res.data };
    } catch (e) {
      console.error("reservationService.getReservationInfo error:", e);
      return { errCode: 'DB_ERROR', errMsg: '获取预约信息失败: ' + e.message };
    }
  },

  /**
   * 根据ID搜索单个预约的简要信息。
   * @param {string} id - 预约记录的 ID。
   * @param {object} clientInfo - 客户端信息，用于权限验证。
   * @returns {Promise<object>} 包含预约信息的查询结果。
   */
  async searchReservationInfo(id, clientInfo) {
    // 权限检查：登录用户（user或admin）可操作
    const authError = authUtils.checkUserOrAdminPermission(clientInfo);
    if (authError) {
      return authError;
    }

    const dbJQL = uniCloud.databaseForJQL({ clientInfo });
    const machines = dbJQL.collection('machines').field("_id,name").getTemp();
    try {
      const res = await dbJQL.collection('reservation-log', machines)
        .where({ _id: id })
        .field({ "machineId": true, "endTime": true })
        .get();
      if (res.data.length === 0) {
        return { errCode: 'NOT_FOUND', errMsg: '未找到指定的预约信息' };
      }
      return { errCode: 0, errMsg: '搜索预约信息成功', data: res.data[0] };
    } catch (e) {
      console.error("reservationService.searchReservationInfo error:", e);
      return { errCode: 'DB_ERROR', errMsg: '搜索预约信息失败: ' + e.message };
    }
  },

  /**
   * 添加签到记录。
   * @param {object} content - 签到信息。
   * @param {object} clientInfo - 客户端信息，用于权限验证。
   * @returns {Promise<object>} 操作结果。
   */
  async addSignIn(content, clientInfo) {
    // 权限检查：用户只能为自己签到
    const authResult = authUtils.checkSelfOrAdmin(clientInfo, content.userId);
    if (authResult.errCode) {
      return authResult;
    }

    const dbJQL = uniCloud.databaseForJQL({ clientInfo });
    try {
      const res = await dbJQL.collection('signin').add(content);
      return { errCode: 0, errMsg: '签到成功', id: res.id };
    } catch (e) {
      console.error("reservationService.addSignIn error:", e);
      return { errCode: 'DB_ERROR', errMsg: '签到失败: ' + e.message };
    }
  },

  /**
   * 搜索用户当前未结算的签到记录。
   * @param {string} userId - 用户 ID。
   * @param {object} clientInfo - 客户端信息，用于权限验证。
   * @returns {Promise<object>} 包含签到记录的查询结果。
   */
  async searchSignIn(userId, clientInfo) {
    // 权限检查：用户只能看自己的，管理员可以看所有人的
    const authResult = authUtils.checkSelfOrAdmin(clientInfo, userId);
    if (authResult.errCode) {
      return authResult;
    }

    const dbJQL = uniCloud.databaseForJQL({ clientInfo });
    try {
      const res = await dbJQL.collection('signin').where({
        userid: userId,
        status: 0 // 0 表示未结算
      }).field({
        "_id": true,
        "status": true,
        "reservationid": true,
        "isPlay": true,
        "isOvernight": true,
        "starttime": true
      }).get();
      return { errCode: 0, errMsg: '查询签到记录成功', data: res.data };
    } catch (e) {
      console.error("reservationService.searchSignIn error:", e);
      return { errCode: 'DB_ERROR', errMsg: '查询签到记录失败: ' + e.message };
    }
  },

  /**
   * 结账操作。
   * 这是一个复合操作，会更新签到、预约和订单状态，并触发用户统计更新。
   * @param {string} signInId - 签到记录的 ID。
   * @param {string} reservationId - 关联的预约 ID。
   * @param {string} userId - 用户 ID。
   * @param {object} clientInfo - 客户端信息，用于权限验证。
   * @returns {Promise<object>} 操作结果。
   */
  async settleSignIn(signInId, reservationId, userId, clientInfo) {
    // 权限检查：结账通常是管理员操作
    const authError = authUtils.checkAdminPermission(clientInfo);
    if (authError) {
      return authError;
    }

    const dbJQL = uniCloud.databaseForJQL({ clientInfo });
    try {
      // 使用 Promise.all 并行处理数据库更新，提高效率
      await Promise.all([
        // 1. 更新签到状态为已完成 (status: 1)
        dbJQL.collection('signin').doc(signInId).update({ status: 1 }),
        // 2. 更新预约状态为已完成 (status: 2)
        dbJQL.collection('reservation-log').doc(reservationId).update({ status: 2 }),
        // 3. 更新对应订单状态为已完成 (status: 1)
        dbJQL.collection('fishcave-orders').where({
          user_id: userId,
          reservation_id: reservationId,
          status: 0 // 仅更新未支付的订单
        }).update({ status: 1 })
      ]);

      // 4. 异步更新用户统计信息（无需等待其完成）
      statisticsService.updateUserStatistics(userId, reservationId, clientInfo);

      return { errCode: 0, errMsg: '结账成功' };
    } catch (e) {
      console.error("reservationService.settleSignIn error:", e);
      return { errCode: 'SETTLE_FAILED', errMsg: '结账失败: ' + e.message };
    }
  },
};
