const { db, formatResponse, buildQueryCondition, command } = require('../utils/common')
const { checkAdminPermission } = require('../utils/auth')

/**
 * 获取商品列表
 */
async function getProductsList(params = {}) {
	try {
		const queryRules = {
			categoryId: { type: 'eq' },
			status: { type: 'eq' }
		}

		let query = db.collection('products')
		const condition = buildQueryCondition(params, queryRules)

		if (condition.$and) {
			query = query.where(condition)
		}

		// 如果有关键词搜索
		if (params.keyword) {
			const keywordRegex = new RegExp(params.keyword, 'i')
			query = query.where({
				name: keywordRegex
			})
		}

		// 默认按排序权重和创建时间排序
		query = query.orderBy('sort', 'desc').orderBy('create_time', 'desc')

		// 限制返回数量
		if (params.limit) {
			query = query.limit(params.limit)
		}

		const { data } = await query.get()

		return formatResponse(data)
	} catch (e) {
		console.error('获取商品列表失败:', e)
		return formatResponse(null, 500, e.message || '获取商品列表失败')
	}
}

/**
 * 获取商品详情
 */
async function getProductDetail(productId) {
	try {
		const { data } = await db.collection('products').doc(productId).get()

		if (!data) {
			return formatResponse(null, 404, '商品不存在')
		}

		return formatResponse([data])
	} catch (e) {
		console.error('获取商品详情失败:', e)
		return formatResponse(null, 500, e.message || '获取商品详情失败')
	}
}

/**
 * 添加商品
 */
async function addProduct(productData, clientInfo) {
	try {
		console.log('添加商品数据参数:', productData)
		const actualData = productData;
		console.log('实际商品数据:', actualData)

		const authResult = checkAdminPermission(clientInfo)
		if (authResult) {
			return authResult
		}

		// 验证必需字段
		if (!actualData || !actualData.name || actualData.price === undefined || actualData.stock === undefined) {
			console.error('商品数据缺少必需字段:', actualData)
			return formatResponse(null, 400, '商品名称、价格和库存是必需的')
		}

		const newProduct = {
			name: actualData.name,
			categoryId: actualData.categoryId || '',
			description: actualData.description || '',
			images: actualData.images || [],
			price: actualData.price,
			stock: actualData.stock,
			sales: 0,
			status: actualData.status || 'onsale',
			isRecommended: actualData.isRecommended || false,
			sort: actualData.sort || 0,
			tags: actualData.tags || [],
			create_user: clientInfo.uid,
			update_user: clientInfo.uid,
			create_time: new Date().getTime(),
			update_time: new Date().getTime()
		}

		console.log('准备写入数据库的商品数据:', newProduct)
		const { id } = await db.collection('products').add(newProduct)
		console.log('商品数据库写入成功，ID:', id)

		// 添加库存记录（入库）
		await db.collection('inventory-logs').add({
			productId: id,
			type: 'in',
			quantity: actualData.stock,
			beforeStock: 0,
			afterStock: actualData.stock,
			reason: '商品初始化入库',
			operator: clientInfo.uid,
			create_time: new Date().getTime(),
			note: '新增商品时的初始库存'
		})

		return formatResponse({ id }, 0, '添加商品成功')
	} catch (e) {
		console.error('添加商品失败:', e)
		return formatResponse(null, 500, e.message || '添加商品失败')
	}
}

/**
 * 更新商品
 */
async function updateProduct(params, clientInfo) {
	try {
		console.log('更新商品数据参数:', params)
		const productId = params.productId;
		const actualData = params.data;

		console.log('更新商品ID:', productId)
		console.log('更新商品数据:', actualData)

		const authResult = checkAdminPermission(clientInfo)
		if (authResult) {
			return authResult
		}

		const oldProduct = await db.collection('products').doc(productId).get()

		if (!oldProduct.data) {
			return formatResponse(null, 404, '商品不存在')
		}

		const updates = {
			name: actualData.name,
			categoryId: actualData.categoryId,
			description: actualData.description,
			images: actualData.images,
			price: actualData.price,
			stock: actualData.stock,
			status: actualData.status,
			isRecommended: actualData.isRecommended,
			sort: actualData.sort,
			tags: actualData.tags,
			update_user: clientInfo.uid,
			update_time: new Date().getTime()
		}

		// 如果更新库存，添加库存记录
		if (actualData.stock !== undefined && actualData.stock !== oldProduct.data.stock) {
			await db.collection('inventory-logs').add({
				productId: productId,
				type: 'adjust',
				quantity: Math.abs(actualData.stock - oldProduct.data.stock),
				beforeStock: oldProduct.data.stock,
				afterStock: actualData.stock,
				reason: '商品信息更新',
				operator: clientInfo.uid,
				note: '更新商品信息时调整库存'
			})
		}

		await db.collection('products').doc(productId).update(updates)

		return formatResponse(null, 0, '更新商品成功')
	} catch (e) {
		console.error('更新商品失败:', e)
		return formatResponse(null, 500, e.message || '更新商品失败')
	}
}

/**
 * 删除商品
 */
async function deleteProduct(productId, clientInfo) {
	try {
		const authResult = checkAdminPermission(clientInfo)
		if (authResult) {
			return authResult
		}

		const product = await db.collection('products').doc(productId).get()
		if (!product.data) {
			return formatResponse(null, 404, '商品不存在')
		}

		// 检查是否有关联订单
		const orderCount = await db.collection('product-orders')
			.where({
				'items.productId': productId
			})
			.count()

		if (orderCount.total > 0) {
			return formatResponse(null, 400, '该商品存在关联订单，无法删除')
		}

		await db.collection('products').doc(productId).remove()

		return formatResponse(null, 0, '删除商品成功')
	} catch (e) {
		console.error('删除商品失败:', e)
		return formatResponse(null, 500, e.message || '删除商品失败')
	}
}

/**
 * 获取相关商品
 */
async function getRelatedProducts(params = {}) {
	try {
		const { categoryId, excludeId, limit = 4 } = params

		const { data } = await db.collection('products')
			.where({
				categoryId: categoryId,
				_id: command.neq(excludeId),
				status: 'onsale',
				stock: command.gt(0)
			})
			.orderBy('sort', 'desc')
			.orderBy('sales', 'desc')
			.limit(limit)
			.get()

		return formatResponse(data)
	} catch (e) {
		console.error('获取相关商品失败:', e)
		return formatResponse(null, 500, e.message || '获取相关商品失败')
	}
}

module.exports = {
	getProductsList,
	getProductDetail,
	addProduct,
	updateProduct,
	deleteProduct,
	getRelatedProducts
}