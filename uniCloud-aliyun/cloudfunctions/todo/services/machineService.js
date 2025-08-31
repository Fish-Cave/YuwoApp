// services/machineService.js
const db = uniCloud.database();
const dbCmd = db.command;

// 引入工具函数
const authUtils = require('../utils/auth');
const formatUtils = require('../utils/format'); // 用于格式化时间

/**
 * @module machineService
 * @description 机台相关服务模块
 */
module.exports = {
  /**
   * 添加新机台。
   * 仅限管理员操作。
   * @param {object} content - 包含机台名称、容量、状态、编号、描述等信息的对象。
   * @param {object} clientInfo - 客户端信息，用于权限验证。
   * @returns {Promise<object>} 操作结果，成功时包含新机台的 ID。
   */
  async addMachine(content, clientInfo) {
    // 权限检查：只有管理员才能添加机台
    const authError = authUtils.checkAdminPermission(clientInfo);
    if (authError) {
      return authError;
    }

    const collection = db.collection('machines');
    try {
      const res = await collection.add(content);
      return { errCode: 0, errMsg: '机台添加成功', id: res.id };
    } catch (e) {
      console.error("machineService.addMachine error:", e);
      return { errCode: 'DB_ERROR', errMsg: '添加机台失败: ' + e.message };
    }
  },

  /**
   * 获取机台列表。
   * 登录用户（user或admin）可操作。
   * @param {object} clientInfo - 客户端信息，用于权限验证。
   * @returns {Promise<object>} 包含机台列表的查询结果。
   */
  async listMachines(clientInfo) {
    // 权限检查：登录用户（user或admin）可查看机台列表
    const authError = authUtils.checkUserOrAdminPermission(clientInfo);
    if (authError) {
      return authError;
    }

    const collection = db.collection('machines');
    try {
      const res = await collection.field({
        "_id": true,
        "name": true,
        "capacity": true,
        "status": true,
        "machinenum": true,
        "description": true,
      }).get();
      return { errCode: 0, errMsg: '获取机台列表成功', data: res.data };
    } catch (e) {
      console.error("machineService.listMachines error:", e);
      return { errCode: 'DB_ERROR', errMsg: '获取机台列表失败: ' + e.message };
    }
  },

  /**
   * 根据 ID 获取机台的简要信息。
   * 登录用户（user或admin）可操作。
   * @param {string} id - 机台的唯一 ID。
   * @param {object} clientInfo - 客户端信息，用于权限验证。
   * @returns {Promise<object>} 包含机台简要信息的查询结果。
   */
  async getMachineInfo(id, clientInfo) {
    // 权限检查：登录用户（user或admin）可查看机台信息
    const authError = authUtils.checkUserOrAdminPermission(clientInfo);
    if (authError) {
      return authError;
    }

    if (!id) {
      return { errCode: 'PARAM_ERROR', errMsg: '缺少机台ID参数' };
    }

    const collection = db.collection('machines');
    try {
      const res = await collection.field({
        "name": true,
        "type": true,
        "capacity": true,
        "status": true,
      }).where({
        _id: id,
      }).get();

      if (res.data.length === 0) {
        return { errCode: 'NOT_FOUND', errMsg: '未找到指定机台' };
      }
      return { errCode: 0, errMsg: '获取机台信息成功', data: res.data[0] };
    } catch (e) {
      console.error("machineService.getMachineInfo error:", e);
      return { errCode: 'DB_ERROR', errMsg: '获取机台信息失败: ' + e.message };
    }
  },

  /**
   * 更新机台信息。
   * 仅限管理员操作。
   * @param {string} id - 要更新的机台 ID。
   * @param {object} updateData - 包含要更新字段的对象。
   * @param {object} clientInfo - 客户端信息，用于权限验证。
   * @returns {Promise<object>} 操作结果。
   */
  async updateMachine(id, updateData, clientInfo) {
    // 权限检查：只有管理员才能更新机台
    const authError = authUtils.checkAdminPermission(clientInfo);
    if (authError) {
      return authError;
    }

    if (!id || !updateData) {
      return { errCode: 'PARAM_ERROR', errMsg: '缺少机台ID或更新数据' };
    }

    const collection = db.collection('machines');
    try {
      const res = await collection.doc(id).update(updateData);
      if (res.updated === 0) {
        return { errCode: 'NOT_FOUND', errMsg: '未找到要更新的机台或数据无变化' };
      }
      return { errCode: 0, errMsg: '机台信息更新成功', updated: res.updated };
    } catch (e) {
      console.error("machineService.updateMachine error:", e);
      return { errCode: 'DB_ERROR', errMsg: '更新机台信息失败: ' + e.message };
    }
  },

  /**
   * 获取单个机台的详细信息。
   * 登录用户（user或admin）可操作。
   * @param {string} id - 机台的唯一 ID。
   * @param {object} clientInfo - 客户端信息，用于权限验证。
   * @returns {Promise<object>} 包含机台详细信息的查询结果。
   */
  async getMachineDetail(id, clientInfo) {
    // 权限检查：登录用户（user或admin）可查看机台详情
    const authError = authUtils.checkUserOrAdminPermission(clientInfo);
    if (authError) {
      return authError;
    }

    if (!id) {
      return { errCode: 'PARAM_ERROR', errMsg: '缺少机台ID参数' };
    }

    const collection = db.collection('machines');
    try {
      const res = await collection.doc(id).get();
      if (res.data.length === 0) {
        return { errCode: 'NOT_FOUND', errMsg: '未找到指定机台详情' };
      }
      return { errCode: 0, errMsg: '获取机台详情成功', data: res.data[0] };
    } catch (e) {
      console.error("machineService.getMachineDetail error:", e);
      return { errCode: 'DB_ERROR', errMsg: '获取机台详情失败: ' + e.message };
    }
  },

  /**
   * 获取指定时间段内所有机台的预约信息，并关联用户信息。
   * 登录用户（user或admin）可操作。
   * @param {number} startTime - 查询的开始时间戳。
   * @param {number} endTime - 查询的结束时间戳。
   * @param {object} clientInfo - 客户端信息，用于权限验证。
   * @returns {Promise<object>} 包含机台信息及其预约列表的数组。
   */
  async getMachineReservationInfo(startTime, endTime, clientInfo) {
    // 权限检查：登录用户（user或admin）可查看机台预约信息
    const authError = authUtils.checkUserOrAdminPermission(clientInfo);
    if (authError) {
      return authError;
    }

    if (!startTime || !endTime) {
      return { errCode: 'PARAM_ERROR', errMsg: '缺少开始时间或结束时间参数' };
    }

    const dbJQL = uniCloud.databaseForJQL({ clientInfo });

    try {
      // 1. 获取所有机台的基本信息
      const machinesRes = await dbJQL.collection('machines').field("_id,name,machinenum,status").get();
      const machines = machinesRes.data;

      // 2. 获取指定时间段内的所有预约记录
      const reservationDataRes = await dbJQL.collection('reservation-log')
        .where(`startTime >= ${startTime} && endTime <= ${endTime}`)
        .field({
          "_id": true,
          "machineId": true,
          "isOvernight": true,
          "status": true,
          "startTime": true,
          "endTime": true,
          "userId": true
        }).get();
      const reservationData = reservationDataRes.data;

      // 3. 构建机台 ID 到机台信息的映射
      const machineMap = new Map();
      machines.forEach(machine => {
        machineMap.set(machine._id, machine);
      });

      // 4. 提取所有预约记录中的 userId，用于批量查询用户信息
      const userIds = [...new Set(reservationData.map(reservation => reservation.userId))];

      // 5. 批量查询用户信息
      const usersRes = await dbJQL.collection('uni-id-users')
        .where({
          _id: dbJQL.command.in(userIds)
        })
        .field({
          "_id": true,
          "nickname": true,
          "avatar": true,
          "avatar_file": true
        })
        .get();
      const userMap = new Map();
      usersRes.data.forEach(user => {
        userMap.set(user._id, user);
      });

      // 6. 整合机台、预约和用户信息
      const result = machines.map(machine => {
        const machineReservations = reservationData.filter(reservation => reservation.machineId === machine._id);
        
        // 为每个预约记录关联用户信息并格式化时间
        const reservationsWithUserInfo = machineReservations.map(reservation => {
          const userInfo = userMap.get(reservation.userId) || {};
          return {
            ...reservation,
            username: userInfo.nickname || '未知用户',
            avatar: userInfo.avatar || '',
            avatar_file: userInfo.avatar_file,
            formattedStartTime: formatUtils.formatDateTime(reservation.startTime),
            formattedEndTime: formatUtils.formatDateTime(reservation.endTime)
          };
        });
        return {
          machineInfo: machine,
          reservations: reservationsWithUserInfo
        };
      });
      return { errCode: 0, errMsg: '获取机台预约信息成功', data: result };
    } catch (e) {
      console.error("machineService.getMachineReservationInfo error:", e);
      return { errCode: 'DB_ERROR', errMsg: '获取机台预约信息失败: ' + e.message };
    }
  },
};
