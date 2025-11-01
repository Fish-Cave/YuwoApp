'use strict';
const productParam = require('./product.param');
const productService = require('./services/productService');
const categoryService = require('./services/categoryService');
const orderService = require('./services/orderService');
const inventoryService = require('./services/inventoryService');
const { extractParams } = require('./utils/common');

module.exports = {
	_before: async function() {
		// 云函数执行前的通用逻辑，如权限验证等
		const httpInfo = this.getHttpInfo();
		if (httpInfo && httpInfo.method) {
			this.methodName = httpInfo.method;
		} else {
			this.methodName = 'cloudObjectCall';
		}

		// 保存客户端信息，供后续权限检查使用
		this.clientInfo = this.getClientInfo();
	},

	// ==================== 商品管理 ====================
	/**
	 * 获取商品列表
	 */
	GetProductsList: async function() {
		const params = this.getParams();
		console.log('云对象GetProductsList接收到的原始参数:', params);
		const actualParams = extractParams(params);
		return await productService.getProductsList(actualParams);
	},

	/**
	 * 获取商品详情
	 */
	GetProductDetail: async function() {
		const params = this.getParams();
		console.log('云对象GetProductDetail接收到的原始参数:', params);
		const actualParams = extractParams(params);
		return await productService.getProductDetail(actualParams.productId);
	},

	/**
	 * 添加商品
	 */
	AddProduct: async function() {
		const params = this.getParams();
		console.log('云对象AddProduct接收到的原始参数:', params);
		const actualParams = extractParams(params);
		return await productService.addProduct(actualParams, this.clientInfo);
	},

	/**
	 * 更新商品
	 */
	UpdateProduct: async function() {
		const params = this.getParams();
		console.log('云对象UpdateProduct接收到的原始参数:', params);
		const actualParams = extractParams(params);
		return await productService.updateProduct(actualParams, this.clientInfo);
	},

	/**
	 * 删除商品
	 */
	DeleteProduct: async function() {
		const params = this.getParams();
		console.log('云对象DeleteProduct接收到的原始参数:', params);
		const actualParams = extractParams(params);
		return await productService.deleteProduct(actualParams.productId, this.clientInfo);
	},

	/**
	 * 获取相关商品
	 */
	GetRelatedProducts: async function() {
		const params = this.getParams();
		console.log('云对象GetRelatedProducts接收到的原始参数:', params);
		const actualParams = extractParams(params);
		return await productService.getRelatedProducts(actualParams);
	},

	// ==================== 分类管理 ====================
	/**
	 * 获取分类列表
	 */
	GetCategories: async function() {
		const params = this.getParams();
		const actualParams = extractParams(params);
		return await categoryService.getCategories(actualParams);
	},

	/**
	 * 获取分类详情
	 */
	GetCategoryDetail: async function() {
		const params = this.getParams();
		console.log('云对象GetCategoryDetail接收到的原始参数:', params);
		const actualParams = extractParams(params);
		return await categoryService.getCategoryDetail(actualParams.categoryId);
	},

	/**
	 * 获取所有分类原始数据（用于检查不完整记录）
	 */
	GetAllCategoriesRaw: async function() {
		return await categoryService.getAllCategoriesRaw();
	},

	/**
	 * 添加分类
	 */
	AddCategory: async function() {
		const params = this.getParams();
		console.log('云对象AddCategory接收到的原始参数:', params);
		console.log('云对象AddCategory的clientInfo:', this.clientInfo);
		const actualParams = extractParams(params);
		return await categoryService.addCategory(actualParams, this.clientInfo);
	},

	/**
	 * 更新分类
	 */
	UpdateCategory: async function() {
		const params = this.getParams();
		console.log('云对象UpdateCategory接收到的原始参数:', params);
		const actualParams = extractParams(params);
		return await categoryService.updateCategory(actualParams, this.clientInfo);
	},

	/**
	 * 删除分类
	 */
	DeleteCategory: async function() {
		const params = this.getParams();
		const actualParams = extractParams(params);
		return await categoryService.deleteCategory(actualParams.categoryId, this.clientInfo);
	},

	// ==================== 订单管理 ====================
	/**
	 * 创建商品订单
	 */
	CreateProductOrder: async function() {
		const params = this.getParams();
		const actualParams = extractParams(params);
		return await orderService.createProductOrder(actualParams, this.clientInfo);
	},

	/**
	 * 获取商品订单列表
	 */
	GetProductOrders: async function() {
		const params = this.getParams();
		const actualParams = extractParams(params);
		return await orderService.getProductOrders(actualParams, this.clientInfo);
	},

	/**
	 * 获取商品订单详情
	 */
	GetProductOrderDetail: async function() {
		const params = this.getParams();
		const actualParams = extractParams(params);
		return await orderService.getProductOrderDetail(actualParams.orderNo, this.clientInfo);
	},

	/**
	 * 更新订单状态
	 */
	UpdateOrderStatus: async function() {
		const params = this.getParams();
		const actualParams = extractParams(params);
		return await orderService.updateOrderStatus(actualParams.orderNo, actualParams, this.clientInfo);
	},

	// ==================== 库存管理 ====================
	/**
	 * 添加库存记录
	 */
	AddInventoryLog: async function() {
		const params = this.getParams();
		const actualParams = extractParams(params);
		return await inventoryService.addInventoryLog(actualParams, this.clientInfo);
	},

	/**
	 * 获取库存记录
	 */
	GetInventoryLogs: async function() {
		const params = this.getParams();
		const actualParams = extractParams(params);
		return await inventoryService.getInventoryLogs(actualParams, this.clientInfo);
	},

	/**
	 * 批量入库
	 */
	BatchStockIn: async function() {
		const params = this.getParams();
		const actualParams = extractParams(params);
		return await inventoryService.batchStockIn(
			actualParams.productId,
			actualParams.quantity,
			actualParams.reason,
			this.clientInfo
		);
	},

	/**
	 * 批量出库
	 */
	BatchStockOut: async function() {
		const params = this.getParams();
		const actualParams = extractParams(params);
		return await inventoryService.batchStockOut(
			actualParams.productId,
			actualParams.quantity,
			actualParams.reason,
			this.clientInfo
		);
	},

	/**
	 * 调整库存
	 */
	AdjustStock: async function() {
		const params = this.getParams();
		const actualParams = extractParams(params);
		return await inventoryService.adjustStock(
			actualParams.productId,
			actualParams.newStock,
			actualParams.reason,
			this.clientInfo
		);
	},

	/**
	 * 获取库存统计
	 */
	GetInventoryStats: async function() {
		return await inventoryService.getInventoryStats(this.clientInfo);
	},

	_meta: {
		request: productParam
	}
};