const db = uniCloud.database()
const command = db.command

/**
 * 生成唯一订单号
 */
function generateOrderNo() {
	const now = new Date()
	const dateStr = now.getFullYear().toString() +
		(now.getMonth() + 1).toString().padStart(2, '0') +
		now.getDate().toString().padStart(2, '0')
	const timeStr = now.getHours().toString().padStart(2, '0') +
		now.getMinutes().toString().padStart(2, '0') +
		now.getSeconds().toString().padStart(2, '0')
	const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
	return `PO${dateStr}${timeStr}${random}`
}

/**
 * 格式化响应数据
 */
function formatResponse(data = null, code = 0, message = 'success') {
	return {
		errCode: code,
		errMsg: message,
		data: data
	}
}

/**
 * 分页查询辅助函数
 */
async function queryWithPagination(collectionRef, page = 1, pageSize = 20) {
	const skip = (page - 1) * pageSize

	// 获取总记录数
	const { total } = await collectionRef.count()

	// 获取分页数据
	const { data } = await collectionRef
		.skip(skip)
		.limit(pageSize)
		.get()

	return {
		data,
		pagination: {
			current: page,
			pageSize,
			total,
			pages: Math.ceil(total / pageSize)
		}
	}
}

/**
 * 构建查询条件
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

/**
 * 统一参数提取函数
 * 处理uniCloud云对象的参数数组和嵌套结构
 */
function extractParams(params) {
	let actualParams = params

	// 处理参数数组情况（uniCloud云对象的特殊处理）
	if (Array.isArray(params) && params.length > 0) {
		actualParams = params[0]
	}

	// 处理可能的参数包装问题
	if (actualParams && actualParams.data) {
		actualParams = actualParams.data
	}

	return actualParams
}

module.exports = {
	db,
	command,
	generateOrderNo,
	formatResponse,
	queryWithPagination,
	buildQueryCondition,
	extractParams
}