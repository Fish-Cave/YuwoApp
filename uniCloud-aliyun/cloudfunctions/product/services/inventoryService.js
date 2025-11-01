const { db, formatResponse, buildQueryCondition, command } = require('../utils/common')
const { checkAdminPermission } = require('../utils/auth')

/**
 * 添加库存记录
 */
async function addInventoryLog(inventoryData, clientInfo) {
	try {
		const authResult = checkAdminPermission(clientInfo)
		if (authResult) {
			return authResult
		}
		const newLog = {
			...inventoryData,
			operator: clientInfo.uid,
			create_time: new Date().getTime()
		}

		// 验证商品存在
		const product = await db.collection('products').doc(inventoryData.productId).get()
		if (!product.data) {
			return formatResponse(null, 404, '商品不存在')
		}

		const { id } = await db.collection('inventory-logs').add(newLog)

		return formatResponse({ id }, 0, '添加库存记录成功')
	} catch (e) {
		console.error('添加库存记录失败:', e)
		return formatResponse(null, 500, e.message || '添加库存记录失败')
	}
}

/**
 * 获取库存记录
 */
async function getInventoryLogs(params = {}, clientInfo) {
	try {
		const authResult = checkAdminPermission(clientInfo)
		if (authResult) {
			return authResult
		}

		const queryRules = {
			productId: { type: 'eq' },
			type: { type: 'eq' }
		}

		let query = db.collection('inventory-logs')
		const condition = buildQueryCondition(params, queryRules)

		if (condition.$and) {
			query = query.where(condition)
		}

		// 按创建时间倒序
		query = query.orderBy('create_time', 'desc')

		// 限制返回数量
		if (params.limit) {
			query = query.limit(params.limit)
		}

		const { data } = await query.get()

		// 关联商品名称
		for (const log of data) {
			if (log.productId) {
				const product = await db.collection('products').doc(log.productId).field('name').get()
				if (product.data) {
					log.productName = product.data.name
				}
			}
		}

		return formatResponse(data)
	} catch (e) {
		console.error('获取库存记录失败:', e)
		return formatResponse(null, 500, e.message || '获取库存记录失败')
	}
}

/**
 * 批量入库
 */
async function batchStockIn(productId, quantity, reason = '批量入库', clientInfo) {
	try {
		const authResult = checkAdminPermission(clientInfo)
		if (authResult) {
			return authResult
		}
		const product = await db.collection('products').doc(productId).get()

		if (!product.data) {
			return formatResponse(null, 404, '商品不存在')
		}

		const beforeStock = product.data.stock
		const afterStock = beforeStock + quantity

		// 更新商品库存
		await db.collection('products').doc(productId).update({
			stock: afterStock,
			update_time: new Date().getTime()
		})

		// 添加库存记录
		await db.collection('inventory-logs').add({
			productId,
			type: 'in',
			quantity,
			beforeStock,
			afterStock,
			reason,
			operator: clientInfo.uid,
			create_time: new Date().getTime(),
			note: '批量入库操作'
		})

		return formatResponse({ newStock: afterStock }, 0, '入库成功')
	} catch (e) {
		console.error('批量入库失败:', e)
		return formatResponse(null, 500, e.message || '批量入库失败')
	}
}

/**
 * 批量出库
 */
async function batchStockOut(productId, quantity, reason = '批量出库', clientInfo) {
	try {
		const authResult = checkAdminPermission(clientInfo)
		if (authResult) {
			return authResult
		}
		const product = await db.collection('products').doc(productId).get()

		if (!product.data) {
			return formatResponse(null, 404, '商品不存在')
		}

		if (product.data.stock < quantity) {
			return formatResponse(null, 400, '库存不足')
		}

		const beforeStock = product.data.stock
		const afterStock = beforeStock - quantity

		// 更新商品库存
		await db.collection('products').doc(productId).update({
			stock: afterStock,
			update_time: new Date().getTime()
		})

		// 添加库存记录
		await db.collection('inventory-logs').add({
			productId,
			type: 'out',
			quantity,
			beforeStock,
			afterStock,
			reason,
			operator: clientInfo.uid,
			create_time: new Date().getTime(),
			note: '批量出库操作'
		})

		return formatResponse({ newStock: afterStock }, 0, '出库成功')
	} catch (e) {
		console.error('批量出库失败:', e)
		return formatResponse(null, 500, e.message || '批量出库失败')
	}
}

/**
 * 调整库存
 */
async function adjustStock(productId, newStock, reason = '库存调整', clientInfo) {
	try {
		const authResult = checkAdminPermission(clientInfo)
		if (authResult) {
			return authResult
		}
		const product = await db.collection('products').doc(productId).get()

		if (!product.data) {
			return formatResponse(null, 404, '商品不存在')
		}

		const beforeStock = product.data.stock
		const quantity = Math.abs(newStock - beforeStock)
		const type = newStock > beforeStock ? 'in' : 'out'

		// 更新商品库存
		await db.collection('products').doc(productId).update({
			stock: newStock,
			update_time: new Date().getTime()
		})

		// 添加库存记录
		await db.collection('inventory-logs').add({
			productId,
			type,
			quantity,
			beforeStock,
			afterStock: newStock,
			reason,
			operator: clientInfo.uid,
			create_time: new Date().getTime(),
			note: '手动调整库存'
		})

		return formatResponse({ newStock }, 0, '库存调整成功')
	} catch (e) {
		console.error('调整库存失败:', e)
		return formatResponse(null, 500, e.message || '调整库存失败')
	}
}

/**
 * 获取库存统计
 */
async function getInventoryStats(clientInfo) {
	try {
		const authResult = checkAdminPermission(clientInfo)
		if (authResult) {
			return authResult
		}

		// 获取商品总数
		const totalProducts = await db.collection('products').count()

		// 获取库存预警商品（库存小于10）
		const lowStockProducts = await db.collection('products')
			.where({
				stock: command.lt(10),
				status: 'onsale'
			})
			.count()

		// 获取售罄商品
		const soldoutProducts = await db.collection('products')
			.where({
				stock: command.lte(0),
				status: 'onsale'
			})
			.count()

		// 获取最近7天的库存变化记录
		const sevenDaysAgo = new Date().getTime() - 7 * 24 * 60 * 60 * 1000
		const recentLogs = await db.collection('inventory-logs')
			.where({
				create_time: command.gte(sevenDaysAgo)
			})
			.count()

		const stats = {
			totalProducts: totalProducts.total,
			lowStockProducts: lowStockProducts.total,
			soldoutProducts: soldoutProducts.total,
			recentLogs: recentLogs.total
		}

		return formatResponse(stats)
	} catch (e) {
		console.error('获取库存统计失败:', e)
		return formatResponse(null, 500, e.message || '获取库存统计失败')
	}
}

module.exports = {
	addInventoryLog,
	getInventoryLogs,
	batchStockIn,
	batchStockOut,
	adjustStock,
	getInventoryStats
}