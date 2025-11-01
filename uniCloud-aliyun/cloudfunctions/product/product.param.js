module.exports = {
	// ==================== 商品管理 ====================
	// 获取商品列表
	GetProductsList: {
		'data.categoryId': {
			type: 'string',
			required: false,
			description: '分类ID，可选'
		},
		'data.keyword': {
			type: 'string',
			required: false,
			description: '搜索关键词，可选'
		},
		'data.limit': {
			type: 'number',
			required: false,
			description: '限制数量，可选'
		}
	},

	// 获取商品详情
	GetProductDetail: {
		'productId': {
			type: 'string',
			required: true,
			description: '商品ID'
		}
	},

	// 添加商品
	AddProduct: {
		'data.name': {
			type: 'string',
			required: true,
			description: '商品名称'
		},
		'data.categoryId': {
			type: 'string',
			required: false,
			description: '分类ID'
		},
		'data.description': {
			type: 'string',
			required: false,
			description: '商品描述'
		},
		'data.images': {
			type: 'array',
			required: false,
			description: '商品图片数组'
		},
		'data.price': {
			type: 'number',
			required: true,
			description: '商品价格（分）'
		},
		'data.stock': {
			type: 'number',
			required: true,
			description: '库存数量'
		},
		'data.status': {
			type: 'string',
			required: false,
			description: '商品状态：onsale/offsale/soldout'
		},
		'data.isRecommended': {
			type: 'boolean',
			required: false,
			description: '是否推荐'
		},
		'data.sort': {
			type: 'number',
			required: false,
			description: '排序权重'
		},
		'data.tags': {
			type: 'array',
			required: false,
			description: '商品标签'
		},
		'data.specifications': {
			type: 'array',
			required: false,
			description: '规格选项'
		},
		'data.variants': {
			type: 'array',
			required: false,
			description: 'SKU变体'
		}
	},

	// 更新商品
	UpdateProduct: {
		'productId': {
			type: 'string',
			required: true,
			description: '商品ID'
		},
		'data.name': {
			type: 'string',
			required: false,
			description: '商品名称'
		},
		'data.categoryId': {
			type: 'string',
			required: false,
			description: '分类ID'
		},
		'data.description': {
			type: 'string',
			required: false,
			description: '商品描述'
		},
		'data.images': {
			type: 'array',
			required: false,
			description: '商品图片数组'
		},
		'data.price': {
			type: 'number',
			required: false,
			description: '商品价格（分）'
		},
		'data.stock': {
			type: 'number',
			required: false,
			description: '库存数量'
		},
		'data.status': {
			type: 'string',
			required: false,
			description: '商品状态：onsale/offsale/soldout'
		},
		'data.isRecommended': {
			type: 'boolean',
			required: false,
			description: '是否推荐'
		},
		'data.sort': {
			type: 'number',
			required: false,
			description: '排序权重'
		},
		'data.tags': {
			type: 'array',
			required: false,
			description: '商品标签'
		}
	},

	// 删除商品
	DeleteProduct: {
		'productId': {
			type: 'string',
			required: true,
			description: '商品ID'
		}
	},

	// 获取相关商品
	GetRelatedProducts: {
		'data.categoryId': {
			type: 'string',
			required: true,
			description: '分类ID'
		},
		'data.excludeId': {
			type: 'string',
			required: true,
			description: '排除的商品ID'
		},
		'data.limit': {
			type: 'number',
			required: false,
			description: '限制数量，默认4'
		}
	},

	// ==================== 分类管理 ====================
	// 获取分类列表
	GetCategories: {
		'data.status': {
			type: 'string',
			required: false,
			description: '分类状态：active/inactive'
		}
	},

	// 获取分类详情
	GetCategoryDetail: {
		'categoryId': {
			type: 'string',
			required: true,
			description: '分类ID'
		}
	},

	// 添加分类
	AddCategory: {
		'data.name': {
			type: 'string',
			required: true,
			description: '分类名称'
		},
		'data.parentId': {
			type: 'string',
			required: false,
			description: '父分类ID'
		},
		'data.sort': {
			type: 'number',
			required: false,
			description: '排序权重'
		},
		'data.icon': {
			type: 'string',
			required: false,
			description: '分类图标'
		},
		'data.status': {
			type: 'string',
			required: false,
			description: '分类状态：active/inactive'
		},
		'data.description': {
			type: 'string',
			required: false,
			description: '分类描述'
		}
	},

	// 更新分类
	UpdateCategory: {
		'categoryId': {
			type: 'string',
			required: true,
			description: '分类ID'
		},
		'data.name': {
			type: 'string',
			required: false,
			description: '分类名称'
		},
		'data.parentId': {
			type: 'string',
			required: false,
			description: '父分类ID'
		},
		'data.sort': {
			type: 'number',
			required: false,
			description: '排序权重'
		},
		'data.icon': {
			type: 'string',
			required: false,
			description: '分类图标'
		},
		'data.status': {
			type: 'string',
			required: false,
			description: '分类状态：active/inactive'
		},
		'data.description': {
			type: 'string',
			required: false,
			description: '分类描述'
		}
	},

	// 删除分类
	DeleteCategory: {
		'categoryId': {
			type: 'string',
			required: true,
			description: '分类ID'
		}
	},

	// ==================== 订单管理 ====================
	// 创建商品订单
	CreateProductOrder: {
		'data.productId': {
			type: 'string',
			required: true,
			description: '商品ID'
		},
		'data.productName': {
			type: 'string',
			required: true,
			description: '商品名称'
		},
		'data.userName': {
			type: 'string',
			required: true,
			description: '用户姓名'
		},
		'data.userPhone': {
			type: 'string',
			required: true,
			description: '用户电话'
		},
		'data.quantity': {
			type: 'number',
			required: true,
			description: '购买数量'
		},
		'data.price': {
			type: 'number',
			required: true,
			description: '商品单价（分）'
		},
		'data.totalPrice': {
			type: 'number',
			required: true,
			description: '订单总金额（分）'
		},
		'data.specs': {
			type: 'object',
			required: false,
			description: '商品规格属性'
		},
		'data.productImage': {
			type: 'string',
			required: false,
			description: '商品图片'
		},
		'data.remark': {
			type: 'string',
			required: false,
			description: '订单备注'
		},
		'data.paymentMethod': {
			type: 'string',
			required: false,
			description: '支付方式：offline/wechat'
		}
	},

	// 获取商品订单列表
	GetProductOrders: {
		'data.status': {
			type: 'string',
			required: false,
			description: '订单状态：pending/paid/completed/refunded/cancelled'
		},
		'data.userId': {
			type: 'string',
			required: false,
			description: '用户ID'
		},
		'data.limit': {
			type: 'number',
			required: false,
			description: '限制数量'
		}
	},

	// 获取商品订单详情
	GetProductOrderDetail: {
		'orderNo': {
			type: 'string',
			required: true,
			description: '订单编号'
		}
	},

	// 更新订单状态
	UpdateOrderStatus: {
		'orderNo': {
			type: 'string',
			required: true,
			description: '订单编号'
		},
		'data.status': {
			type: 'string',
			required: true,
			description: '订单状态：pending/paid/completed/refunded/cancelled'
		},
		'data.paymentNo': {
			type: 'string',
			required: false,
			description: '支付单号'
		},
		'data.refundAmount': {
			type: 'number',
			required: false,
			description: '退款金额（分）'
		}
	},

	// ==================== 库存管理 ====================
	// 添加库存记录
	AddInventoryLog: {
		'data.productId': {
			type: 'string',
			required: true,
			description: '商品ID'
		},
		'data.variantId': {
			type: 'string',
			required: false,
			description: '变体ID'
		},
		'data.type': {
			type: 'string',
			required: true,
			description: '变更类型：in/out/adjust'
		},
		'data.quantity': {
			type: 'number',
			required: true,
			description: '变更数量'
		},
		'data.beforeStock': {
			type: 'number',
			required: true,
			description: '变更前库存'
		},
		'data.afterStock': {
			type: 'number',
			required: true,
			description: '变更后库存'
		},
		'data.reason': {
			type: 'string',
			required: true,
			description: '变更原因'
		},
		'data.orderNo': {
			type: 'string',
			required: false,
			description: '关联订单号'
		},
		'data.note': {
			type: 'string',
			required: false,
			description: '备注信息'
		}
	},

	// 获取库存记录
	GetInventoryLogs: {
		'data.productId': {
			type: 'string',
			required: false,
			description: '商品ID'
		},
		'data.type': {
			type: 'string',
			required: false,
			description: '变更类型：in/out/adjust'
		},
		'data.limit': {
			type: 'number',
			required: false,
			description: '限制数量'
		}
	}
}