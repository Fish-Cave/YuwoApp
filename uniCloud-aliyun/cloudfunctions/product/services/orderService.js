const { db, formatResponse, generateOrderNo, command } = require('../utils/common')
const { checkUserOrAdminPermission } = require('../utils/auth')

/**
 * 创建商品订单
 */
async function createProductOrder(orderData, clientInfo) {
	try {
		const authResult = checkUserOrAdminPermission(clientInfo)
		if (authResult) {
			return authResult
		}

		const user = clientInfo.uid

		// 检查商品信息
		console.log('查询商品ID:', orderData.productId);
		const productQuery = await db.collection('products').where({
			_id: orderData.productId
		}).get();

		console.log('商品查询结果:', productQuery);

		if (!productQuery.data || productQuery.data.length === 0) {
			return formatResponse(null, 404, '商品不存在')
		}

		const product = { data: productQuery.data[0] }

		const priceComparison = {
			productId: orderData.productId,
			productStatus: product.data.status,
			expectedStatus: 'onsale',
			productStock: product.data.stock,
			orderQuantity: orderData.quantity,
			orderPrice: orderData.price,
			productPrice: product.data.price,
			orderPriceType: typeof orderData.price,
			productPriceType: typeof product.data.price,
			orderTotalPrice: orderData.totalPrice,
			calculatedTotal: orderData.price * orderData.quantity,
			priceEqual: orderData.price === product.data.price,
			priceStrictEqual: orderData.price === product.data.price
		};
		console.log('商品状态检查:', JSON.stringify(priceComparison, null, 2))

		if (product.data.status !== 'onsale') {
			return formatResponse(null, 400, `商品已下架 (状态: ${product.data.status})`)
		}

		// 验证库存 - 处理字符串和数字类型差异
		const productStock = typeof product.data.stock === 'string'
			? parseInt(product.data.stock) || 0
			: product.data.stock;

		if (productStock < orderData.quantity) {
			return formatResponse(null, 400, '商品库存不足')
		}

		// 验证价格 - 处理字符串和数字类型差异
		const productPrice = typeof product.data.price === 'string'
			? parseFloat(product.data.price) || 0
			: product.data.price;

		if (orderData.price !== productPrice) {
			return formatResponse(null, 400, `商品价格异常 (订单: ${orderData.price}, 商品: ${productPrice})`)
		}

		// 验证总金额
		const calculatedTotal = orderData.price * orderData.quantity
		if (orderData.totalPrice !== calculatedTotal) {
			return formatResponse(null, 400, `订单金额异常 (订单: ${orderData.totalPrice}, 计算: ${calculatedTotal})`)
		}

		// 生成订单号
		const orderNo = generateOrderNo()

		// 创建订单
		const newOrder = {
			orderNo,
			userId: user.uid,
			userName: orderData.userName,
			userPhone: orderData.userPhone,
			items: [{
				productId: orderData.productId,
				productName: orderData.productName,
				productImage: orderData.productImage,
				sku: '',
				specs: orderData.specs || {},
				price: orderData.price,
				quantity: orderData.quantity,
				totalPrice: calculatedTotal
			}],
			totalPrice: calculatedTotal,
			actualAmount: calculatedTotal,
			status: 'pending',
			paymentMethod: orderData.paymentMethod || 'offline',
			remark: orderData.remark || '',
			create_time: new Date().getTime(),
			refundStatus: 'none',
			refundAmount: 0
		}

		const { id: orderId } = await db.collection('product-orders').add(newOrder)

		// 扣减库存
		const newStock = product.data.stock - orderData.quantity
		await db.collection('products').doc(orderData.productId).update({
			stock: newStock,
			sales: (product.data.sales || 0) + orderData.quantity,
			update_time: new Date().getTime()
		})

		// 添加库存记录（出库）
		await db.collection('inventory-logs').add({
			productId: orderData.productId,
			type: 'out',
			quantity: orderData.quantity,
			beforeStock: product.data.stock,
			afterStock: newStock,
			reason: '订单销售',
			operator: user.uid,
			orderNo,
			create_time: new Date().getTime(),
			note: '用户下单扣减库存'
		})

		return formatResponse({ orderId, orderNo }, 0, '创建订单成功')
	} catch (e) {
		console.error('创建商品订单失败:', e)
		return formatResponse(null, 500, e.message || '创建订单失败')
	}
}

/**
 * 获取商品订单列表
 */
async function getProductOrders(params = {}, clientInfo) {
	try {
		const authResult = checkUserOrAdminPermission(clientInfo)
		if (authResult) {
			return authResult
		}

		const user = clientInfo.uid

		const queryRules = {
			status: { type: 'eq' },
			userId: { type: 'eq' }
		}

		let query = db.collection('product-orders')
		const condition = { ...buildQueryCondition(params, queryRules) }

		// 非管理员只能查看自己的订单
		if (!clientInfo.role.includes('admin')) {
			condition.userId = user
		}

		if (Object.keys(condition).length > 0) {
			query = query.where(condition)
		}

		// 按创建时间倒序
		query = query.orderBy('create_time', 'desc')

		// 限制返回数量
		if (params.limit) {
			query = query.limit(params.limit)
		}

		const { data } = await query.get()

		return formatResponse(data)
	} catch (e) {
		console.error('获取商品订单列表失败:', e)
		return formatResponse(null, 500, e.message || '获取订单列表失败')
	}
}

/**
 * 获取商品订单详情
 */
async function getProductOrderDetail(orderNo, clientInfo) {
	try {
		const authResult = checkUserOrAdminPermission(clientInfo)
		if (authResult) {
			return authResult
		}

		const user = clientInfo.uid

		const { data } = await db.collection('product-orders').where({ orderNo }).get()

		if (!data || data.length === 0) {
			return formatResponse(null, 404, '订单不存在')
		}

		const order = data[0]

		// 检查权限：非管理员只能查看自己的订单
		if (!clientInfo.role.includes('admin') && order.userId !== user) {
			return formatResponse(null, 403, '无权限查看此订单')
		}

		return formatResponse([order])
	} catch (e) {
		console.error('获取商品订单详情失败:', e)
		return formatResponse(null, 500, e.message || '获取订单详情失败')
	}
}

/**
 * 更新订单状态
 */
async function updateOrderStatus(orderNo, updateData, clientInfo) {
	try {
		const authResult = checkAdminPermission(clientInfo)
		if (authResult) {
			return authResult
		}

		const { data } = await db.collection('product-orders').where({ orderNo }).get()

		if (!data || data.length === 0) {
			return formatResponse(null, 404, '订单不存在')
		}

		const order = data[0]
		const updates = {
			status: updateData.status,
			update_time: new Date().getTime()
		}

		// 如果更新为已支付
		if (updateData.status === 'paid' && order.status !== 'paid') {
			updates.paymentTime = new Date().getTime()
			updates.paymentNo = updateData.paymentNo
		}

		// 如果更新为退款
		if (updateData.status === 'refunded' && order.refundStatus !== 'refunded') {
			updates.refundStatus = 'refunded'
			updates.refundAmount = updateData.refundAmount || order.actualAmount
			updates.refundTime = new Date().getTime()

			// 恢复库存
			for (const item of order.items) {
				const product = await db.collection('products').doc(item.productId).get()
				if (product.data) {
					const newStock = product.data.stock + item.quantity
					await db.collection('products').doc(item.productId).update({
						stock: newStock,
						sales: Math.max(0, (product.data.sales || 0) - item.quantity),
						update_time: new Date().getTime()
					})

					// 添加库存记录（入库）
					await db.collection('inventory-logs').add({
						productId: item.productId,
						type: 'in',
						quantity: item.quantity,
						beforeStock: product.data.stock,
						afterStock: newStock,
						reason: '订单退款恢复库存',
						operator: clientInfo.uid,
						orderNo,
						create_time: new Date().getTime(),
						note: '订单退款恢复库存'
					})
				}
			}
		}

		await db.collection('product-orders').where({ orderNo }).update(updates)

		return formatResponse(null, 0, '更新订单状态成功')
	} catch (e) {
		console.error('更新订单状态失败:', e)
		return formatResponse(null, 500, e.message || '更新订单状态失败')
	}
}

/**
 * 构建查询条件（本地版本，用于订单服务）
 */
function buildQueryCondition(params, rules) {
	const conditions = []

	for (const [key, rule] of Object.entries(rules)) {
		if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
			if (rule.type === 'eq') {
				conditions.push({ [key]: params[key] })
			} else if (rule.type === 'like') {
				const regex = new RegExp(params[key], 'i')
				conditions.push({ [key]: regex })
			} else if (rule.type === 'in') {
				if (Array.isArray(params[key])) {
					conditions.push({ [key]: command.in(params[key]) })
				}
			} else if (rule.type === 'gt') {
				conditions.push({ [key]: command.gt(params[key]) })
			} else if (rule.type === 'gte') {
				conditions.push({ [key]: command.gte(params[key]) })
			} else if (rule.type === 'lt') {
				conditions.push({ [key]: command.lt(params[key]) })
			} else if (rule.type === 'lte') {
				conditions.push({ [key]: command.lte(params[key]) })
			}
		}
	}

	return conditions.length > 0 ? { $and: conditions } : {}
}

module.exports = {
	createProductOrder,
	getProductOrders,
	getProductOrderDetail,
	updateOrderStatus
}