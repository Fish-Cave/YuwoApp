// services/statisticsService.js
const db = uniCloud.database();
const dbCmd = db.command;

// 引入工具模块
const authUtils = require('../utils/auth');

/**
 * @module statisticsService
 * @description 用户统计相关服务模块
 */
module.exports = {
  /**
   * 更新用户统计信息。
   * 在订单完成时调用，更新用户的使用时长、消费金额等。
   * @param {string} userId - 用户ID。
   * @param {string} reservationId - 关联的预约ID。
   * @param {object} clientInfo - 客户端信息，用于JQL查询。
   * @returns {Promise<object>} 更新结果。
   */
  async updateUserStatistics(userId, reservationId, clientInfo) {
    const dbJQL = uniCloud.databaseForJQL({ clientInfo });
    try {
      // 1. 获取已完成的订单信息
      const orderInfo = await dbJQL.collection('fishcave-orders')
        .where({
          user_id: userId,
          reservation_id: reservationId,
          status: 1 // 确保订单是已完成状态
        }).get();

      if (orderInfo.data.length === 0) {
        console.warn(`updateUserStatistics: 未找到用户 ${userId} 的已完成订单 (预约ID: ${reservationId})`);
        return { errCode: 'ORDER_NOT_FOUND', errMsg: '未找到相关已完成订单信息' };
      }
      const order = orderInfo.data[0];

      // 2. 计算统计数据
      const durationMinutes = Math.round((order.endtime - order.starttime) / (1000 * 60));
      const startTime = new Date(order.starttime);
      const yearMonth = `${startTime.getFullYear()}-${String(startTime.getMonth() + 1).padStart(2, '0')}`;

      // 3. 查询或更新用户统计记录
      const statsCollection = db.collection('user-statistics');
      const userStats = await statsCollection.where({ user_id: userId }).get();

      if (userStats.data.length === 0) {
        // 创建新记录
        await statsCollection.add({
          user_id: userId,
          total_sessions: 1,
          total_duration: durationMinutes,
          total_spending: order.total_fee,
          monthly_stats: [{
            year_month: yearMonth,
            sessions: 1,
            duration: durationMinutes,
            spending: order.total_fee
          }],
          last_update: Date.now()
        });
      } else {
        // 更新现有记录
        const existingStats = userStats.data[0];
        const monthIndex = existingStats.monthly_stats ? existingStats.monthly_stats.findIndex(m => m.year_month === yearMonth) : -1;

        let updateObj = {
          total_sessions: dbCmd.inc(1),
          total_duration: dbCmd.inc(durationMinutes),
          total_spending: dbCmd.inc(order.total_fee),
          last_update: Date.now()
        };

        if (monthIndex === -1) {
          // 新增月份统计
          updateObj.monthly_stats = dbCmd.push({
            year_month: yearMonth,
            sessions: 1,
            duration: durationMinutes,
            spending: order.total_fee
          });
        } else {
          // 更新现有月份统计
          updateObj[`monthly_stats.${monthIndex}.sessions`] = dbCmd.inc(1);
          updateObj[`monthly_stats.${monthIndex}.duration`] = dbCmd.inc(durationMinutes);
          updateObj[`monthly_stats.${monthIndex}.spending`] = dbCmd.inc(order.total_fee);
        }
        await statsCollection.doc(existingStats._id).update(updateObj);
      }
      return { errCode: 0, errMsg: '统计信息更新成功' };
    } catch (e) {
      console.error("statisticsService.updateUserStatistics error:", e);
      return { errCode: 'UPDATE_STATS_ERROR', errMsg: '更新统计信息失败: ' + e.message };
    }
  },

  /**
   * 获取指定用户的统计信息。
   * @param {string} userId - 用户ID。
   * @param {object} clientInfo - 客户端信息，用于权限验证。
   * @returns {Promise<object>} 用户统计信息。
   */
  async getUserStatistics(userId, clientInfo) {
    // 权限检查：用户只能看自己的，管理员可以看所有人的
    const authResult = authUtils.checkSelfOrAdmin(clientInfo, userId);
    if (authResult.errCode) {
      return authResult;
    }

    const dbJQL = uniCloud.databaseForJQL({ clientInfo });
    try {
      const userStats = await dbJQL.collection('user-statistics').where({ user_id: userId }).get();
      if (userStats.data.length === 0) {
        return {
          errCode: 0,
          data: { total_sessions: 0, total_duration: 0, total_spending: 0, monthly_stats: [] },
          errMsg: '用户暂无统计数据'
        };
      }
      return { errCode: 0, data: userStats.data[0] };
    } catch (e) {
      console.error("statisticsService.getUserStatistics error:", e);
      return { errCode: 'GET_STATS_ERROR', errMsg: '获取统计信息失败: ' + e.message };
    }
  },

  /**
   * 获取用户消费排行榜。
   * @param {object} options - 选项，包含 limit, sortBy, sortOrder。
   * @param {object} clientInfo - 客户端信息，用于权限验证。
   * @returns {Promise<object>} 排行榜数据。
   */
  async getUserRankings(options = {}, clientInfo) {
    // 权限检查：登录用户均可查看
    const authError = authUtils.checkUserOrAdminPermission(clientInfo);
    if (authError) {
      return authError;
    }

    const { limit = 10, sortBy = 'total_spending', sortOrder = 'desc' } = options;
    const dbJQL = uniCloud.databaseForJQL({ clientInfo });
    try {
      const usersTemp = dbJQL.collection('uni-id-users').field('_id, nickname, avatar, avatar_file').getTemp();
      const result = await dbJQL.collection('user-statistics')
        .field(`user_id, ${sortBy}, total_sessions, total_duration, total_spending`)
        .foreignKey({ localKey: 'user_id', foreignKey: '_id', as: 'userInfo', from: usersTemp })
        .orderBy(sortBy, sortOrder)
        .limit(limit)
        .get();

      const rankings = result.data.map((item, index) => ({
        rank: index + 1,
        user_id: item.user_id,
        nickname: item.userInfo[0]?.nickname || '未知用户',
        avatar: item.userInfo[0]?.avatar || '',
        avatar_file: item.userInfo[0]?.avatar_file || null,
        total_sessions: item.total_sessions,
        total_duration: item.total_duration,
        total_spending: item.total_spending
      }));

      return { errCode: 0, data: rankings };
    } catch (e) {
      console.error("statisticsService.getUserRankings error:", e);
      return { errCode: 'GET_RANKINGS_ERROR', errMsg: '获取用户排行榜失败: ' + e.message };
    }
  },

  /**
   * 重建所有用户的统计数据 (高危操作，仅限管理员)。
   * @param {object} clientInfo - 客户端信息，用于权限验证。
   * @returns {Promise<object>} 重建结果。
   */
  async rebuildAllUserStatistics(clientInfo) {
    const authError = authUtils.checkAdminPermission(clientInfo);
    if (authError) {
      return authError;
    }

    try {
      // 1. 清空现有统计数据
      await db.collection('user-statistics').where({}).remove();

      // 2. 获取所有已完成的订单
      const orders = await db.collection('fishcave-orders').where({ status: 1 }).get();
      if (orders.data.length === 0) {
        return { errCode: 0, errMsg: '没有找到已完成的订单' };
      }

      // 3. 在内存中按用户分组统计
      const userStats = {};
      for (const order of orders.data) {
        const userId = order.user_id;
        if (!userStats[userId]) {
          userStats[userId] = {
            user_id: userId, total_sessions: 0, total_duration: 0, total_spending: 0, monthly_stats: {}
          };
        }
        const durationMinutes = Math.round((order.endtime - order.starttime) / (1000 * 60));
        const startTime = new Date(order.starttime);
        const yearMonth = `${startTime.getFullYear()}-${String(startTime.getMonth() + 1).padStart(2, '0')}`;

        userStats[userId].total_sessions++;
        userStats[userId].total_duration += durationMinutes;
        userStats[userId].total_spending += order.total_fee;

        if (!userStats[userId].monthly_stats[yearMonth]) {
          userStats[userId].monthly_stats[yearMonth] = { year_month: yearMonth, sessions: 0, duration: 0, spending: 0 };
        }
        userStats[userId].monthly_stats[yearMonth].sessions++;
        userStats[userId].monthly_stats[yearMonth].duration += durationMinutes;
        userStats[userId].monthly_stats[yearMonth].spending += order.total_fee;
      }

      // 4. 准备批量插入的数据
      const batchInsertData = Object.values(userStats).map(stats => ({
        ...stats,
        monthly_stats: Object.values(stats.monthly_stats),
        last_update: Date.now()
      }));

      if (batchInsertData.length > 0) {
        await db.collection('user-statistics').add(batchInsertData);
      }

      return {
        errCode: 0,
        data: { updated_users: batchInsertData.length },
        errMsg: '重建统计数据成功'
      };
    } catch (e) {
      console.error("statisticsService.rebuildAllUserStatistics error:", e);
      return { errCode: 'REBUILD_ERROR', errMsg: '重建统计数据失败: ' + e.message };
    }
  },

  /**
   * 获取用户月度统计报告。
   * @param {string} userId - 用户ID。
   * @param {number} months - 要获取的月份数，默认6个月。
   * @param {object} clientInfo - 客户端信息，用于权限验证。
   * @returns {Promise<object>} 月度报告数据。
   */
  async getUserMonthlyReport(userId, months = 6, clientInfo) {
    // 权限检查：用户只能看自己的，管理员可以看所有人的
    const authResult = authUtils.checkSelfOrAdmin(clientInfo, userId);
    if (authResult.errCode) {
      return authResult;
    }

    const dbJQL = uniCloud.databaseForJQL({ clientInfo });
    try {
      const userStatsRes = await dbJQL.collection('user-statistics').where({ user_id: userId }).get();
      if (userStatsRes.data.length === 0) {
        return { errCode: 0, data: { months: [] }, errMsg: '用户暂无统计数据' };
      }
      const userStats = userStatsRes.data[0];

      const sortedMonths = (userStats.monthly_stats || [])
        .sort((a, b) => b.year_month.localeCompare(a.year_month))
        .slice(0, months);

      const userInfoRes = await dbJQL.collection('uni-id-users').doc(userId).field('nickname, avatar, avatar_file').get();
      const userInfo = userInfoRes.data.length > 0 ? userInfoRes.data[0] : {};

      return {
        errCode: 0,
        data: {
          user_id: userId,
          nickname: userInfo.nickname || '未知用户',
          avatar: userInfo.avatar || '',
          total_sessions: userStats.total_sessions,
          total_duration: userStats.total_duration,
          total_spending: userStats.total_spending,
          months: sortedMonths
        }
      };
    } catch (e) {
      console.error("statisticsService.getUserMonthlyReport error:", e);
      return { errCode: 'GET_REPORT_ERROR', errMsg: '获取用户月度报告失败: ' + e.message };
    }
  },
};
