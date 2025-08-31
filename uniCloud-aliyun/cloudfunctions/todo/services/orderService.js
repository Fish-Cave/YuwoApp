// services/orderService.js
const db = uniCloud.database();
const dbCmd = db.command;

// 引入工具模块
const authUtils = require('../utils/auth');
const formatUtils = require('../utils/format');
const logUtils = require('../utils/log');

/**
 * @module orderService
 * @description 订单相关服务模块
 */
module.exports = {
  /**
   * 新增订单。
   * @param {object} content - 订单内容。
   * @param {object} clientInfo - 客户端信息，用于权限验证。
   * @returns {Promise<object>} 操作结果。
   */
  async addOrder(content, clientInfo) {
    // 权限检查：登录用户（user或admin）可创建订单
    const authError = authUtils.checkUserOrAdminPermission(clientInfo);
    if (authError) {
      return authError;
    }

    const dbJQL = uniCloud.databaseForJQL({ clientInfo });
    try {
      const res = await dbJQL.collection('fishcave-orders').add(content);
      return { errCode: 0, errMsg: '订单创建成功', id: res.id };
    } catch (e) {
      console.error("orderService.addOrder error:", e);
      return { errCode: 'DB_ERROR', errMsg: '创建订单失败: ' + e.message };
    }
  },

  /**
   * 获取用户待处理的订单。
   * @param {string} userId - 用户ID。
   * @param {object} clientInfo - 客户端信息，用于权限验证。
   * @returns {Promise<object>} 包含订单信息的查询结果。
   */
  async getOrder(userId, clientInfo) {
    // 权限检查：用户只能获取自己的订单
    const authResult = authUtils.checkSelfOrAdmin(clientInfo, userId);
    if (authResult.errCode) {
      return authResult;
    }

    const dbJQL = uniCloud.databaseForJQL({ clientInfo });
    try {
      const res = await dbJQL.collection('fishcave-orders').where({
        user_id: userId,
        status: 0 // 0 表示待处理
      }).field({
        _id: true
      }).get();
      return { errCode: 0, errMsg: '获取待处理订单成功', data: res.data };
    } catch (e) {
      console.error("orderService.getOrder error:", e);
      return { errCode: 'DB_ERROR', errMsg: '获取待处理订单失败: ' + e.message };
    }
  },

  /**
   * 获取指定用户的所有订单列表。
   * @param {string} userId - 用户ID。
   * @param {object} clientInfo - 客户端信息，用于权限验证。
   * @returns {Promise<object>} 包含订单列表的查询结果。
   */
  async getFishOrderList(userId, clientInfo) {
    // 权限检查：用户只能获取自己的订单列表
    const authResult = authUtils.checkSelfOrAdmin(clientInfo, userId);
    if (authResult.errCode) {
      return authResult;
    }

    const dbJQL = uniCloud.databaseForJQL({ clientInfo });
    try {
      const res = await dbJQL.collection('fishcave-orders').where({
        user_id: userId,
      }).orderBy("create_date", "desc").get();
      return { errCode: 0, errMsg: '获取订单列表成功', data: res.data };
    } catch (e) {
      console.error("orderService.getFishOrderList error:", e);
      return { errCode: 'DB_ERROR', errMsg: '获取订单列表失败: ' + e.message };
    }
  },

  /**
   * 获取用户订单信息（分页）。
   * 注意：原始函数查询的是 'signin' 表，这里已修正为查询 'fishcave-orders' 表以符合函数命名和逻辑。
   * @param {object} params - 包含 userId, pageSize, pageNumber 的参数对象。
   * @param {object} clientInfo - 客户端信息，用于权限验证。
   * @returns {Promise<object>} 包含订单列表和总数的查询结果。
   */
  async getOrderInfo(params, clientInfo) {
    const { userId, pageSize = 10, pageNumber = 1 } = params;
    // 权限检查：用户只能获取自己的订单信息
    const authResult = authUtils.checkSelfOrAdmin(clientInfo, userId);
    if (authResult.errCode) {
      return authResult;
    }

    const dbJQL = uniCloud.databaseForJQL({ clientInfo });
    const machines = dbJQL.collection('machines').field("_id,name").getTemp();
    // 修正：查询 fishcave-orders 表而不是 signin 表
    const collectionJQL = dbJQL.collection('fishcave-orders', machines);

    try {
      let baseQuery = collectionJQL.where({
        user_id: userId,
      }).orderBy("create_date", "desc");

      const countResult = await baseQuery.count();
      const total = countResult.total;

      const dataResult = await baseQuery
        .skip((pageNumber - 1) * pageSize)
        .limit(pageSize)
        .get();

      return {
        errCode: 0,
        errMsg: '获取分页订单成功',
        data: dataResult.data,
        total: total
      };
    } catch (e) {
      console.error("orderService.getOrderInfo error:", e);
      return { errCode: 'DB_ERROR', errMsg: '获取分页订单失败: ' + e.message };
    }
  },

  /**
   * 按状态统计所有订单数量和总金额 (仅限管理员)。
   * @param {object} clientInfo - 客户端信息，用于权限验证。
   * @returns {Promise<object>} 包含统计结果的对象。
   */
  async getOrdersCount(clientInfo) {
    const authError = authUtils.checkAdminPermission(clientInfo);
    if (authError) {
      return authError;
    }

    const dbJQL = uniCloud.databaseForJQL({ clientInfo });
    const orderCollection = dbJQL.collection('fishcave-orders');
    try {
      const [pendingCount, completedCount, unfinishedCount, refundedCount, totalAmountResult] = await Promise.all([
        orderCollection.where({ status: 0 }).count(),
        orderCollection.where({ status: 1 }).count(),
        orderCollection.where({ status: 2 }).count(),
        orderCollection.where({ status: 3 }).count(),
        orderCollection.aggregate().group({ _id: null, totalAmount: { $sum: '$total_fee' } }).end()
      ]);

      const totalAmount = totalAmountResult.data.length > 0 ? totalAmountResult.data[0].totalAmount : 0;
      const totalOrders = pendingCount.total + completedCount.total + unfinishedCount.total + refundedCount.total;

      return {
        errCode: 0,
        data: {
          pending: pendingCount.total,
          completed: completedCount.total,
          unfinished: unfinishedCount.total,
          refunded: refundedCount.total,
          total: totalOrders,
          totalAmount: totalAmount
        }
      };
    } catch (e) {
      console.error("orderService.getOrdersCount error:", e);
      return { errCode: 'DB_ERROR', errMsg: '统计订单数量失败: ' + e.message };
    }
  },

  /**
   * 获取筛选后的订单并支持分页 (仅限管理员)。
   * @param {object} params - 查询参数。
   * @param {object} clientInfo - 客户端信息，用于权限验证。
   * @returns {Promise<object>} 订单列表及分页信息。
   */
  async getFilteredOrders(params = {}, clientInfo) {
    const authError = authUtils.checkAdminPermission(clientInfo);
    if (authError) {
      return authError;
    }

    const {
      pageSize = 10,
      pageNumber = 1,
      keyword = '',
      status = null,
      startDate = null,
      endDate = null,
      minAmount = null,
      maxAmount = null,
      sortField = 'create_date',
      sortOrder = 'desc'
    } = params;

    try {
      const whereConditions = {};
      if (keyword && keyword.trim()) {
        const keywordTrim = keyword.trim();
        whereConditions.$or = [
          { out_trade_no: new RegExp(keywordTrim, 'i') },
          { user_id: new RegExp(keywordTrim, 'i') },
          { description: new RegExp(keywordTrim, 'i') }
        ];
      }
      if (status !== null && status !== '') whereConditions.status = parseInt(status);
      if (startDate && endDate) whereConditions.create_date = { $gte: parseInt(startDate), $lte: parseInt(endDate) };
      if (minAmount !== null && minAmount !== '') {
        if (!whereConditions.total_fee) whereConditions.total_fee = {};
        whereConditions.total_fee.$gte = parseInt(minAmount);
      }
      if (maxAmount !== null && maxAmount !== '') {
        if (!whereConditions.total_fee) whereConditions.total_fee = {};
        whereConditions.total_fee.$lte = parseInt(maxAmount);
      }

      let query = db.collection('fishcave-orders');
      if (Object.keys(whereConditions).length > 0) {
        query = query.where(whereConditions);
      }

      const countResult = await query.count();
      const total = countResult.total;
      const totalPages = Math.ceil(total / pageSize);

      const ordersResult = await query
        .orderBy(sortField, sortOrder)
        .skip((pageNumber - 1) * pageSize)
        .limit(pageSize)
        .get();

      const orders = (ordersResult.data || []).map(order => ({
        ...order,
        statusText: formatUtils.getStatusText(order.status),
        formattedCreateDate: formatUtils.formatDateTime(order.create_date),
        formattedStartTime: formatUtils.formatDateTime(order.starttime),
        formattedEndTime: formatUtils.formatDateTime(order.endtime)
      }));

      return {
        errCode: 0,
        data: orders,
        pagination: {
          current: pageNumber,
          pageSize: pageSize,
          total: total,
          totalPages: totalPages,
        }
      };
    } catch (error) {
      console.error('orderService.getFilteredOrders error:', error);
      return { errCode: -1, errMsg: `获取订单数据失败: ${error.message}` };
    }
  },

  /**
   * 获取订单详情 (仅限管理员)。
   * @param {string} orderId - 订单ID。
   * @param {object} clientInfo - 客户端信息，用于权限验证。
   * @returns {Promise<object>} 订单详细信息。
   */
  async getOrderDetail(orderId, clientInfo) {
    const authError = authUtils.checkAdminPermission(clientInfo);
    if (authError) {
      return authError;
    }
    if (!orderId) {
      return { errCode: 'PARAM_ERROR', errMsg: '订单ID无效' };
    }

    try {
      const orderRes = await db.collection('fishcave-orders').doc(orderId).get();
      if (!orderRes.data || orderRes.data.length === 0) {
        return { errCode: 'NOT_FOUND', errMsg: '未找到订单' };
      }
      // 此处可以根据需要联表查询用户信息、机台信息等，原始代码中未实现，可按需扩展
      const order = orderRes.data[0];
      order.statusText = formatUtils.getStatusText(order.status);
      order.formattedCreateDate = formatUtils.formatDateTime(order.create_date);
      // ... 其他格式化

      return { errCode: 0, data: order };
    } catch (error) {
      console.error('orderService.getOrderDetail error:', error);
      return { errCode: 'DB_ERROR', errMsg: `获取订单详情失败: ${error.message}` };
    }
  },

  /**
   * 更新订单信息 (仅限管理员)。
   * @param {string} orderId - 订单ID。
   * @param {object} updateData - 要更新的数据。
   * @param {string} reason - 修改原因。
   * @param {object} clientInfo - 客户端信息，用于权限验证。
   * @returns {Promise<object>} 更新结果。
   */
  async updateOrder(orderId, updateData, reason, clientInfo) {
    const authError = authUtils.checkAdminPermission(clientInfo);
    if (authError) {
      return authError;
    }
    if (!orderId || !updateData) {
      return { errCode: 'PARAM_ERROR', errMsg: '缺少订单ID或更新数据' };
    }

    try {
      const operatorId = clientInfo.uid;
      const orderCollection = db.collection('fishcave-orders');
      const oldOrderRes = await orderCollection.doc(orderId).get();
      if (!oldOrderRes.data || oldOrderRes.data.length === 0) {
        return { errCode: 'NOT_FOUND', errMsg: '未找到要更新的订单' };
      }
      const oldOrder = oldOrderRes.data[0];

      const res = await orderCollection.doc(orderId).update(updateData);
      if (res.updated > 0) {
        // 记录日志
        await logUtils.logOrderEdit({
          orderId: orderId,
          operatorId: operatorId,
          editType: 'manual_update',
          changes: { before: oldOrder, after: { ...oldOrder, ...updateData } },
          reason: reason,
          editTime: Date.now()
        });
      }
      return { errCode: 0, errMsg: '订单更新成功', updated: res.updated };
    } catch (error) {
      console.error('orderService.updateOrder error:', error);
      return { errCode: 'DB_ERROR', errMsg: `更新订单失败: ${error.message}` };
    }
  },
/**
	 * 创建补票/自定义支付订单
	 * @param {string} userId 用户ID
	 * @param {number} amountFen 支付金额，单位为分
	 * @returns {object} 操作结果，包含新订单的ID
	 */
	async createSettleOrder(userId, amountFen) {
		// 1. 参数校验
		if (!userId || !amountFen || amountFen <= 0) {
			return {
				errCode: 'INVALID_PARAMS',
				errMsg: '缺少必要参数或金额无效'
			};
		}

		const db = uniCloud.database();
		const orderCollection = db.collection('fishcave-orders');

		try {
			// 2. 创建订单数据
			const orderData = {
				user_id: userId,
				total_fee: amountFen,
				status: 0, // 0: 待支付
				order_type: 'settle', // 标记为补票订单
				description: '补票/自定义支付',
				create_date: Date.now(),
				// 这里可以不关联 reservation_id, machineId 等，因为是自定义支付
			};

			// 3. 将订单写入数据库
			const result = await orderCollection.add(orderData);

			if (!result.id) {
				return {
					errCode: 'DB_ADD_FAILED',
					errMsg: '创建订单失败'
				};
			}

			// 4. 返回成功信息和订单ID
			return {
				errCode: 0,
				errMsg: '订单创建成功',
				id: result.id
			};

		} catch (e) {
			console.error("createSettleOrder error:", e);
			return {
				errCode: 'DB_ERROR',
				errMsg: '数据库操作失败: ' + e.message
			};
		}
	},
  /**
   * 获取订单编辑日志 (仅限管理员)。
   * @param {string} orderId - 订单ID。
   * @param {object} clientInfo - 客户端信息，用于权限验证。
   * @returns {Promise<object>} 日志列表。
   */
  async getOrderEditLogs(orderId, clientInfo) {
    const authError = authUtils.checkAdminPermission(clientInfo);
    if (authError) {
      return authError;
    }
    if (!orderId) {
      return { errCode: 'PARAM_ERROR', errMsg: '缺少订单ID' };
    }

    try {
      const res = await db.collection('order-edit-logs').where({ orderId: orderId }).orderBy('editTime', 'desc').get();
      return { errCode: 0, data: res.data };
    } catch (error) {
      console.error('orderService.getOrderEditLogs error:', error);
      return { errCode: 'DB_ERROR', errMsg: `获取订单编辑日志失败: ${error.message}` };
    }
  },
  
  /**
   * 删除所有订单、预约和签到数据 (高危操作，仅限管理员)。
   * @param {object} clientInfo - 客户端信息，用于权限验证。
   * @returns {Promise<object>} 操作结果。
   */
  async deleteAll(clientInfo) {
      const authError = authUtils.checkAdminPermission(clientInfo);
      if (authError) {
          return authError;
      }
      
      // 再次确认，可以增加一个额外的安全参数
      // if (params.confirm !== 'DELETE_ALL_DATA') {
      //   return { errCode: 'CONFIRMATION_FAILED', errMsg: '缺少删除确认' };
      // }

      const dbJQL = uniCloud.databaseForJQL({ clientInfo });
      try {
          await Promise.all([
              dbJQL.collection('fishcave-orders').where({}).remove(),
              dbJQL.collection('reservation-log').where({}).remove(),
              dbJQL.collection('signin').where({}).remove()
          ]);
          return { errCode: 0, errMsg: '所有相关数据已清空' };
      } catch (e) {
          console.error("orderService.deleteAll error:", e);
          return { errCode: 'DB_ERROR', errMsg: '数据删除失败: ' + e.message };
      }
  }
};
