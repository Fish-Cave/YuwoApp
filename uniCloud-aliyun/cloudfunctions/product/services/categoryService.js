const { db, formatResponse, buildQueryCondition } = require('../utils/common')
const { checkAdminPermission } = require('../utils/auth')

/**
 * 获取分类列表
 */
async function getCategories(params = {}) {
	try {
		console.log('获取分类参数:', params)
		const queryRules = {
			status: { type: 'eq' }
		}

		let query = db.collection('product-categories')
		// 如果没有提供状态参数，则不进行状态过滤
		const condition = buildQueryCondition(params, params.status ? queryRules : {})
		console.log('查询条件:', condition)

		if (condition.$and) {
			query = query.where(condition)
		}

		// 按排序权重排序
		query = query.orderBy('sort', 'desc').orderBy('create_time', 'desc')

		const { data } = await query.get()
		console.log('原始分类数据:', data)

		// 构建分类树形结构
		const categories = buildCategoryTree(data)
		console.log('树形分类数据:', categories)

		return formatResponse(categories)
	} catch (e) {
		console.error('获取分类列表失败:', e)
		return formatResponse(null, 500, e.message || '获取分类列表失败')
	}
}

/**
 * 获取分类详情
 */
async function getCategoryDetail(categoryId) {
	try {
		const { data } = await db.collection('product-categories').doc(categoryId).get()

		if (!data) {
			return formatResponse(null, 404, '分类不存在')
		}

		return formatResponse([data])
	} catch (e) {
		console.error('获取分类详情失败:', e)
		return formatResponse(null, 500, e.message || '获取分类详情失败')
	}
}

/**
 * 获取所有分类数据（用于检查不完整记录）
 */
async function getAllCategoriesRaw() {
	try {
		console.log('开始查询product-categories集合中的所有数据')

		// 查询所有数据，不进行任何过滤
		const { data } = await db.collection('product-categories').get()

		console.log('查询到的分类总数:', data.length)
		console.log('所有分类数据详情:', JSON.stringify(data, null, 2))

		// 分析数据完整性
		const incompleteRecords = []
		const completeRecords = []

		data.forEach(category => {
			// 检查是否只有基础字段
			const hasRequiredFields = category.name && category.status
			const hasOnlyBasicFields = Object.keys(category).length <= 4 && // _id, create_time, update_time + 最多1个其他字段
				(!category.name || !category.status)

			if (hasOnlyBasicFields || !hasRequiredFields) {
				incompleteRecords.push({
					_id: category._id,
					fields: Object.keys(category),
					data: category,
					issue: hasOnlyBasicFields ? '只有基础字段' : '缺少必需字段'
				})
			} else {
				completeRecords.push(category)
			}
		})

		const result = {
			total: data.length,
			completeRecords: completeRecords.length,
			incompleteRecords: incompleteRecords.length,
			allData: data,
			incompleteRecords: incompleteRecords,
			summary: {
				totalRecords: data.length,
				completeRecords: completeRecords.length,
				incompleteRecords: incompleteRecords.length,
				incompleteDetails: incompleteRecords.map(record => ({
					id: record._id,
					issue: record.issue,
					fields: record.fields
				}))
			}
		}

		console.log('数据分析结果:', JSON.stringify(result.summary, null, 2))

		return formatResponse(result, 0, '查询所有分类数据成功')
	} catch (e) {
		console.error('查询所有分类数据失败:', e)
		return formatResponse(null, 500, e.message || '查询所有分类数据失败')
	}
}

/**
 * 添加分类
 */
async function addCategory(categoryData, clientInfo) {
	try {
		console.log('添加分类数据参数:', categoryData)
		const actualData = categoryData;
		console.log('实际分类数据:', actualData)

		const authResult = checkAdminPermission(clientInfo)
		if (authResult) {
			return authResult
		}

		// 验证必需字段
		if (!actualData || !actualData.name) {
			console.error('分类数据缺少name字段:', actualData)
			return formatResponse(null, 400, '分类名称是必需的')
		}

		// 手动设置时间字段
		const newCategory = {
			name: actualData.name,
			status: actualData.status || 'active',
			sort: actualData.sort || 0,
			description: actualData.description || '',
			parentId: actualData.parentId || null,
			create_time: new Date().getTime(),
			update_time: new Date().getTime()
		}

		console.log('准备写入数据库的数据:', newCategory)
		const { id } = await db.collection('product-categories').add(newCategory)
		console.log('数据库写入成功，ID:', id)

		return formatResponse({ id }, 0, '添加分类成功')
	} catch (e) {
		console.error('添加分类失败:', e)
		return formatResponse(null, 500, e.message || '添加分类失败')
	}
}

/**
 * 更新分类
 */
async function updateCategory(params, clientInfo) {
	try {
		console.log('更新分类数据参数:', params)
		const categoryId = params.categoryId;
		const actualData = params.data;

		console.log('更新分类ID:', categoryId)
		console.log('更新分类数据:', actualData)

		const authResult = checkAdminPermission(clientInfo)
		if (authResult) {
			return authResult
		}

		const updates = {
			name: actualData.name,
			status: actualData.status,
			sort: actualData.sort,
			description: actualData.description,
			parentId: actualData.parentId,
			update_time: new Date().getTime()
		}

		// 检查是否存在循环引用
		if (actualData.parentId === categoryId) {
			return formatResponse(null, 400, '不能将自己设为父分类')
		}

		await db.collection('product-categories').doc(categoryId).update(updates)

		return formatResponse(null, 0, '更新分类成功')
	} catch (e) {
		console.error('更新分类失败:', e)
		return formatResponse(null, 500, e.message || '更新分类失败')
	}
}

/**
 * 删除分类
 */
async function deleteCategory(categoryId, clientInfo) {
	try {
		const authResult = checkAdminPermission(clientInfo)
		if (authResult) {
			return authResult
		}

		// 检查是否有子分类
		const childCount = await db.collection('product-categories')
			.where({ parentId: categoryId })
			.count()

		if (childCount.total > 0) {
			return formatResponse(null, 400, '该分类存在子分类，无法删除')
		}

		// 检查是否有关联商品
		const productCount = await db.collection('products')
			.where({ categoryId: categoryId })
			.count()

		if (productCount.total > 0) {
			return formatResponse(null, 400, '该分类存在关联商品，无法删除')
		}

		await db.collection('product-categories').doc(categoryId).remove()

		return formatResponse(null, 0, '删除分类成功')
	} catch (e) {
		console.error('删除分类失败:', e)
		return formatResponse(null, 500, e.message || '删除分类失败')
	}
}

/**
 * 构建分类树形结构
 */
function buildCategoryTree(categories, parentId = null) {
	const result = []
	for (const category of categories) {
		if (category.parentId === parentId) {
			const children = buildCategoryTree(categories, category._id)
			if (children.length > 0) {
				category.children = children
			}
			result.push(category)
		}
	}
	return result
}

module.exports = {
	getCategories,
	getCategoryDetail,
	getAllCategoriesRaw,
	addCategory,
	updateCategory,
	deleteCategory
}