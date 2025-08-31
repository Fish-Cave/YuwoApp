// services/priceService.js
const db = uniCloud.database(); // 用于非JQL查询
const dbCmd = db.command;

// 引入工具函数
const authUtils = require('../utils/auth');

/**
 * @module priceService
 * @description 价格相关服务模块
 */
module.exports = {
  /**
   * 添加新的价格方案。
   * 仅限管理员操作。
   * @param {object} content - 包含价格、单位、类型、描述等信息的对象。
   * @param {object} clientInfo - 客户端信息，用于权限验证。
   * @returns {Promise<object>} 操作结果，成功时包含新价格方案的 ID。
   */
  async Prices_Add(content, clientInfo) {
    // 权限检查：只有管理员才能添加价格方案
    const authError = authUtils.checkAdminPermission(clientInfo);
    if (authError) {
      return authError;
    }

    const collection = db.collection('prices');
    try {
      const res = await collection.add(content);
      return { errCode: 0, errMsg: '价格方案添加成功', id: res.id };
    } catch (e) {
      console.error("priceService.Prices_Add error:", e);
      return { errCode: 'DB_ERROR', errMsg: '添加价格方案失败: ' + e.message };
    }
  },

  /**
   * 获取所有价格方案列表。
   * 登录用户（user或admin）可操作。
   * @param {object} clientInfo - 客户端信息，用于权限验证。
   * @returns {Promise<object>} 包含价格方案列表的查询结果。
   */
  async Prices_List(clientInfo) {
    // 权限检查：登录用户（user或admin）可查看价格列表
    const authError = authUtils.checkUserOrAdminPermission(clientInfo);
    if (authError) {
      return authError;
    }

    const collection = db.collection('prices');
    try {
      const res = await collection.field({
        "price": true,
        "unit": true,
        "type": true,
        "description": true,
        "role": true, // 确保返回角色信息
        "weekdays": true, // 确保返回周几信息
        "noplayprice": true, // 确保返回不玩价格信息
      }).get();
      return { errCode: 0, errMsg: '获取价格列表成功', data: res.data };
    } catch (e) {
      console.error("priceService.Prices_List error:", e);
      return { errCode: 'DB_ERROR', errMsg: '获取价格列表失败: ' + e.message };
    }
  },

  /**
   * 根据用户角色获取对应的价格表。
   * 登录用户（user或admin）可操作。
   * @param {string} role - 用户角色（例如 'user', 'admin'）。
   * @param {object} clientInfo - 客户端信息，用于权限验证。
   * @returns {Promise<object>} 包含价格信息的查询结果。
   */
  async GetPriceInfoByRole(role, clientInfo) {
    // 权限检查：登录用户（user或admin）可查看价格信息
    const authError = authUtils.checkUserOrAdminPermission(clientInfo);
    if (authError) {
      return authError;
    }

    if (!role) {
      return { errCode: 'PARAM_ERROR', errMsg: '缺少角色参数' };
    }

    const dbJQL = uniCloud.databaseForJQL({ clientInfo });
    try {
      const res = await dbJQL.collection("prices").where({
        role: role,
      }).field({
        "_id": true,
        "price": true,
        "noplayprice": true,
        "type": true, // 增加type字段，可能有用
        "unit": true, // 增加unit字段
      }).get();
      return { errCode: 0, errMsg: '根据角色获取价格信息成功', data: res.data };
    } catch (e) {
      console.error("priceService.GetPriceInfoByRole error:", e);
      return { errCode: 'DB_ERROR', errMsg: '根据角色获取价格信息失败: ' + e.message };
    }
  },

  /**
   * 根据每周日期获取对应的价格表。
   * 登录用户（user或admin）可操作。
   * @param {number} weekday - 周几的数字表示 (0-6, 周日为0)。
   * @param {object} clientInfo - 客户端信息，用于权限验证。
   * @returns {Promise<object>} 包含价格信息的查询结果。
   */
  async GetPriceInfoByWeekdays(weekday, clientInfo) {
    // 权限检查：登录用户（user或admin）可查看价格信息
    const authError = authUtils.checkUserOrAdminPermission(clientInfo);
    if (authError) {
      return authError;
    }

    if (weekday === undefined || weekday === null) {
      return { errCode: 'PARAM_ERROR', errMsg: '缺少周几参数' };
    }

    const dbJQL = uniCloud.databaseForJQL({ clientInfo });
    try {
      const res = await dbJQL.collection("prices").where({
        weekdays: weekday,
      }).field({
        "_id": true,
        "price": true,
        "noplayprice": true,
        "type": true, // 增加type字段
        "unit": true, // 增加unit字段
      }).get();
      return { errCode: 0, errMsg: '根据周几获取价格信息成功', data: res.data };
    } catch (e) {
      console.error("priceService.GetPriceInfoByWeekdays error:", e);
      return { errCode: 'DB_ERROR', errMsg: '根据周几获取价格信息失败: ' + e.message };
    }
  },

  /**
   * 更新价格方案信息。
   * 仅限管理员操作。
   * @param {string} id - 要更新的价格方案 ID。
   * @param {object} updateData - 包含要更新字段的对象。
   * @param {object} clientInfo - 客户端信息，用于权限验证。
   * @returns {Promise<object>} 操作结果。
   */
  async Prices_Update(id, updateData, clientInfo) {
    // 权限检查：只有管理员才能更新价格方案
    const authError = authUtils.checkAdminPermission(clientInfo);
    if (authError) {
      return authError;
    }

    if (!id || !updateData) {
      return { errCode: 'PARAM_ERROR', errMsg: '缺少价格方案ID或更新数据' };
    }

    const collection = db.collection('prices');
    try {
      const res = await collection.doc(id).update(updateData);
      if (res.updated === 0) {
        return { errCode: 'NOT_FOUND', errMsg: '未找到要更新的价格方案或数据无变化' };
      }
      return { errCode: 0, errMsg: '价格方案信息更新成功', updated: res.updated };
    } catch (e) {
      console.error("priceService.Prices_Update error:", e);
      return { errCode: 'DB_ERROR', errMsg: '更新价格方案信息失败: ' + e.message };
    }
  },

  /**
   * 获取单个价格方案的详细信息。
   * 登录用户（user或admin）可操作。
   * @param {string} id - 价格方案的唯一 ID。
   * @param {object} clientInfo - 客户端信息，用于权限验证。
   * @returns {Promise<object>} 包含价格方案详细信息的查询结果。
   */
  async GetPriceDetail(id, clientInfo) {
    // 权限检查：登录用户（user或admin）可查看价格详情
    const authError = authUtils.checkUserOrAdminPermission(clientInfo);
    if (authError) {
      return authError;
    }

    if (!id) {
      return { errCode: 'PARAM_ERROR', errMsg: '缺少价格方案ID参数' };
    }

    const collection = db.collection('prices');
    try {
      const res = await collection.doc(id).get();
      if (res.data.length === 0) {
        return { errCode: 'NOT_FOUND', errMsg: '未找到指定价格方案详情' };
      }
      return { errCode: 0, errMsg: '获取价格方案详情成功', data: res.data[0] };
    } catch (e) {
      console.error("priceService.GetPriceDetail error:", e);
      return { errCode: 'DB_ERROR', errMsg: '获取价格方案详情失败: ' + e.message };
    }
  },

  /**
   * 获取会员价格列表。
   * 登录用户（user或admin）可操作。
   * @param {object} clientInfo - 客户端信息，用于权限验证。
   * @returns {Promise<object>} 包含会员价格列表的查询结果。
   */
  async GetVipPrices(clientInfo) {
    // 权限检查：登录用户（user或admin）可查看会员价格列表
    const authError = authUtils.checkUserOrAdminPermission(clientInfo);
    if (authError) {
      return authError;
    }

    const collection = db.collection('prices_vip');
    try {
      const res = await collection.get();
      return { errCode: 0, errMsg: '获取会员价格列表成功', data: res.data };
    } catch (e) {
      console.error("priceService.GetVipPrices error:", e);
      return { errCode: 'DB_ERROR', errMsg: '获取会员价格列表失败: ' + e.message };
    }
  },

  /**
   * 获取单个会员价格方案详情。
   * 登录用户（user或admin）可操作。
   * @param {string} id - 会员价格方案的唯一 ID。
   * @param {object} clientInfo - 客户端信息，用于权限验证。
   * @returns {Promise<object>} 包含会员价格方案详细信息的查询结果。
   */
  async GetVipPriceDetail(id, clientInfo) {
    // 权限检查：登录用户（user或admin）可查看会员价格详情
    const authError = authUtils.checkUserOrAdminPermission(clientInfo);
    if (authError) {
      return authError;
    }

    if (!id) {
      return { errCode: 'PARAM_ERROR', errMsg: '缺少会员价格方案ID参数' };
    }

    const collection = db.collection('prices_vip');
    try {
      const res = await collection.doc(id).get();
      if (res.data.length === 0) {
        return { errCode: 'NOT_FOUND', errMsg: '未找到指定会员价格方案详情' };
      }
      return { errCode: 0, errMsg: '获取会员价格方案详情成功', data: res.data[0] };
    } catch (e) {
      console.error("priceService.GetVipPriceDetail error:", e);
      return { errCode: 'DB_ERROR', errMsg: '获取会员价格方案详情失败: ' + e.message };
    }
  },

  /**
   * 更新会员价格方案信息。
   * 仅限管理员操作。
   * @param {string} id - 要更新的会员价格方案 ID。
   * @param {object} updateData - 包含要更新字段的对象。
   * @param {object} clientInfo - 客户端信息，用于权限验证。
   * @returns {Promise<object>} 操作结果。
   */
  async VipPrices_Update(id, updateData, clientInfo) {
    // 权限检查：只有管理员才能更新会员价格方案
    const authError = authUtils.checkAdminPermission(clientInfo);
    if (authError) {
      return authError;
    }

    if (!id || !updateData) {
      return { errCode: 'PARAM_ERROR', errMsg: '缺少会员价格方案ID或更新数据' };
    }

    const collection = db.collection('prices_vip');
    try {
      const res = await collection.doc(id).update(updateData);
      if (res.updated === 0) {
        return { errCode: 'NOT_FOUND', errMsg: '未找到要更新的会员价格方案或数据无变化' };
      }
      return { errCode: 0, errMsg: '会员价格方案信息更新成功', updated: res.updated };
    } catch (e) {
      console.error("priceService.VipPrices_Update error:", e);
      return { errCode: 'DB_ERROR', errMsg: '更新会员价格方案信息失败: ' + e.message };
    }
  },

  /**
   * 添加新的会员价格方案。
   * 仅限管理员操作。
   * @param {object} content - 包含会员价格方案信息的对象。
   * @param {object} clientInfo - 客户端信息，用于权限验证。
   * @returns {Promise<object>} 操作结果，成功时包含新会员价格方案的 ID。
   */
  async AddVipPrices(content, clientInfo) {
    // 权限检查：只有管理员才能添加会员价格方案
    const authError = authUtils.checkAdminPermission(clientInfo);
    if (authError) {
      return authError;
    }

    const dbJQL = uniCloud.databaseForJQL({ clientInfo });
    const vippriceCollection = dbJQL.collection('prices_vip');
    try {
      const res = await vippriceCollection.add(content);
      return { errCode: 0, errMsg: '会员价格方案添加成功', id: res.id };
    } catch (e) {
      console.error("priceService.AddVipPrices error:", e);
      return { errCode: 'DB_ERROR', errMsg: '添加会员价格方案失败: ' + e.message };
    }
  },
};
