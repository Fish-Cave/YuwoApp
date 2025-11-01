<template>
	<view class="container">
		
		<scroll-view scroll-y="true" class="content-scroll">
			<!-- Product Images -->
			<view class="product-images">
				<swiper :indicator-dots="true" :autoplay="true" :interval="3000" :duration="500" class="swiper">
					<swiper-item v-for="(image, index) in product.images" :key="index">
						<image :src="image" mode="aspectFill" class="swiper-image"></image>
					</swiper-item>
					<swiper-item v-if="!product.images || product.images.length === 0">
						<image src="/static/placeholder.png" mode="aspectFill" class="swiper-image"></image>
					</swiper-item>
				</swiper>
			</view>

			<!-- Product Basic Info -->
			<view class="product-info glass-card">
				<view class="product-name-section">
					<text class="product-name">{{ product.name }}</text>
					<view v-if="product.isRecommended" class="recommend-tag">推荐商品</view>
				</view>
				<view class="product-status-section">
					<view class="status-tag" :class="getStatusClass(product.status)">
						{{ getStatusText(product.status) }}
					</view>
					<text class="stock-info">库存: {{ product.stock }}</text>
				</view>
				<view class="product-price-section">
					<text class="price-label">价格</text>
					<text class="product-price">¥{{ ((typeof product.price === 'string' ? parseFloat(product.price) : product.price || 0) / 100).toFixed(2) }}</text>
				</view>
				<view class="product-stats">
					<view class="stat-item">
						<text class="stat-label">销量</text>
						<text class="stat-value">{{ product.sales }}</text>
					</view>
					<view class="stat-item">
						<text class="stat-label">分类</text>
						<text class="stat-value">{{ getCategoryName(product.categoryId) }}</text>
					</view>
				</view>
			</view>

			<!-- Product Description -->
			<view v-if="product.description" class="product-description glass-card">
				<view class="section-title">商品描述</view>
				<view class="description-content">{{ product.description }}</view>
			</view>

			<!-- Product Tags -->
			<view v-if="product.tags && product.tags.length > 0" class="product-tags glass-card">
				<view class="section-title">商品标签</view>
				<view class="tags-container">
					<view v-for="tag in product.tags" :key="tag" class="tag-item">
						{{ tag }}
					</view>
				</view>
			</view>

			<!-- Product Specifications (if any) -->
			<view v-if="product.specifications && product.specifications.length > 0" class="product-specs glass-card">
				<view class="section-title">规格选项</view>
				<view class="specs-container">
					<view v-for="spec in product.specifications" :key="spec.name" class="spec-item">
						<text class="spec-name">{{ spec.name }}:</text>
						<view class="spec-options">
							<view
								v-for="option in spec.options"
								:key="option"
								:class="['spec-option', selectedSpecs[spec.name] === option ? 'selected' : '']"
								@click="selectSpec(spec.name, option)">
								{{ option }}
							</view>
						</view>
					</view>
				</view>
			</view>

			<!-- Purchase Section -->
			<view class="purchase-section glass-card">
				<view class="quantity-selector">
					<text class="quantity-label">购买数量</text>
					<view class="quantity-control">
						<view class="quantity-button" @click="decreaseQuantity">-</view>
						<input v-model="quantity" type="number" class="quantity-input" @input="onQuantityChange" />
						<view class="quantity-button" @click="increaseQuantity">+</view>
					</view>
				</view>
				<view class="total-price">
					<text class="total-label">合计：</text>
					<text class="total-value">¥{{ totalPrice.toFixed(2) }}</text>
				</view>
				<button
					class="buy-button"
					:disabled="!canBuy"
					@click="buyNow">
					{{ buyButtonText }}
				</button>
			</view>

			<!-- Related Products (Optional) -->
			<view class="related-products glass-card">
				<view class="section-title">相关商品</view>
				<view v-if="relatedProducts.length === 0" class="empty-related">
					<text>暂无相关商品</text>
				</view>
				<view v-else class="related-grid">
					<view
						v-for="relatedProduct in relatedProducts"
						:key="relatedProduct._id"
						class="related-item"
						@click="navigateToProduct(relatedProduct._id)">
						<image
							:src="relatedProduct.images && relatedProduct.images.length > 0 ? relatedProduct.images[0] : '/static/placeholder.png'"
							mode="aspectFill"
							class="related-image">
						</image>
						<view class="related-info">
							<text class="related-name">{{ relatedProduct.name }}</text>
							<text class="related-price">¥{{ ((typeof relatedProduct.price === 'string' ? parseFloat(relatedProduct.price) : relatedProduct.price || 0) / 100).toFixed(2) }}</text>
						</view>
					</view>
				</view>
			</view>
		</scroll-view>
	</view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

// 导入云函数
const productService = uniCloud.importObject('product');

// 响应式数据
const product = ref({});
const categories = ref([]);
const relatedProducts = ref([]);
const quantity = ref(1);
const selectedSpecs = ref({});

// 计算属性
const totalPrice = computed(() => {
	const priceInCents = typeof product.value.price === 'string'
		? parseFloat(product.value.price) || 0
		: (product.value.price || 0);
	const priceInYuan = priceInCents / 100;
	return priceInYuan * quantity.value;
});

const canBuy = computed(() => {
	return product.value.status === 'onsale' &&
		   product.value.stock >= quantity.value &&
		   quantity.value > 0;
});

const buyButtonText = computed(() => {
	if (product.value.status !== 'onsale') return '已下架';
	if (product.value.stock === 0) return '已售罄';
	if (quantity.value > product.value.stock) return '库存不足';
	return '立即购买';
});

// 获取状态文本
function getStatusText(status) {
	switch (status) {
		case 'onsale': return '在售';
		case 'offsale': return '下架';
		case 'soldout': return '售罄';
		default: return '未知状态';
	}
}

// 获取状态样式类名
function getStatusClass(status) {
	switch (status) {
		case 'onsale': return 'status-onsale';
		case 'offsale': return 'status-offsale';
		case 'soldout': return 'status-soldout';
		default: return '';
	}
}

// 获取分类名称
function getCategoryName(categoryId) {
	const category = categories.value.find(cat => cat._id === categoryId);
	return category ? category.name : '未分类';
}

// 数量控制
function decreaseQuantity() {
	if (quantity.value > 1) {
		quantity.value--;
	}
}

function increaseQuantity() {
	if (quantity.value < product.value.stock) {
		quantity.value++;
	}
}

function onQuantityChange(e) {
	let value = parseInt(e.detail.value);
	if (isNaN(value) || value < 1) {
		value = 1;
	} else if (value > product.value.stock) {
		value = product.value.stock;
	}
	quantity.value = value;
}

// 规格选择
function selectSpec(specName, option) {
	selectedSpecs.value[specName] = option;
}

// 跳转到其他商品
function navigateToProduct(productId) {
	uni.redirectTo({
		url: `/pages/productDetail/productDetail?id=${productId}`
	});
}

// 立即购买
function buyNow() {
	if (!canBuy.value) return;

	// 构建订单数据
	const priceInCents = typeof product.value.price === 'string'
		? parseFloat(product.value.price) || 0
		: (product.value.price || 0);

	const orderData = {
		productId: product.value._id,
		productName: product.value.name,
		productImage: product.value.images && product.value.images.length > 0 ? product.value.images[0] : '',
		price: priceInCents,
		quantity: quantity.value,
		specs: selectedSpecs.value,
		totalPrice: Math.round(priceInCents * quantity.value) // 转换为分
	};

	// 跳转到商品购买结算页面
	uni.navigateTo({
		url: `/pages/productCheckout/productCheckout?data=${encodeURIComponent(JSON.stringify(orderData))}`
	});
}

// 加载商品详情
async function loadProductDetail(productId) {
	try {
		uni.showLoading({ title: '加载中...' });
		const result = await productService.GetProductDetail({ data: { productId } });
		uni.hideLoading();

		if (result && result.data && result.data.length > 0 && result.data[0] && result.data[0].length > 0) {
			product.value = result.data[0][0];
			// 初始化选中的规格
			if (product.value.specifications) {
				product.value.specifications.forEach(spec => {
					if (spec.options && spec.options.length > 0) {
						selectedSpecs.value[spec.name] = spec.options[0];
					}
				});
			}
			// 加载相关商品
			loadRelatedProducts(product.value.categoryId, product.value._id);
		} else {
			uni.showToast({
				title: '商品不存在',
				icon: 'none'
			});
			setTimeout(() => {
				goBack();
			}, 1500);
		}
	} catch (e) {
		uni.hideLoading();
		uni.showToast({
			title: '加载商品详情失败',
			icon: 'none'
		});
		console.error('加载商品详情失败:', e);
	}
}

// 加载分类列表
async function loadCategories() {
	try {
		const result = await productService.GetCategories({ data: {} });
		if (result && result.data) {
			categories.value = result.data;
		}
	} catch (e) {
		console.error('加载分类失败:', e);
	}
}

// 加载相关商品
async function loadRelatedProducts(categoryId, excludeProductId) {
	try {
		const params = {
			categoryId: categoryId,
			excludeId: excludeProductId,
			limit: 4
		};
		const result = await productService.GetRelatedProducts({ data: params });
		if (result && result.data) {
			relatedProducts.value = result.data.filter(p => p.status === 'onsale' && p.stock > 0);
		}
	} catch (e) {
		console.error('加载相关商品失败:', e);
	}
}

// 生命周期钩子
onMounted(() => {
	// 获取页面参数
	const pages = getCurrentPages();
	const currentPage = pages[pages.length - 1];
	const productId = currentPage.options.id;

	if (productId) {
		loadCategories();
		loadProductDetail(productId);
	} else {
		uni.showToast({
			title: '商品ID不能为空',
			icon: 'none'
		});
		setTimeout(() => {
			goBack();
		}, 1500);
	}
});
</script>

<style>
.container {
	height: 100vh;
	background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
	display: flex;
	flex-direction: column;
}


.content-scroll {
	flex: 1;
	padding: 0 15px 20px 15px;
}

/* 玻璃拟态卡片 */
.glass-card {
	background: rgba(255, 255, 255, 0.8);
	backdrop-filter: blur(10px);
	border-radius: 16px;
	box-shadow: 0 8px 32px rgba(31, 38, 135, 0.1);
	border: 1px solid rgba(255, 255, 255, 0.18);
	padding: 16px;
	margin-bottom: 15px;
}

/* 商品图片 */
.product-images {
	margin-bottom: 15px;
	border-radius: 16px;
	overflow: hidden;
}

.swiper {
	height: 300px;
}

.swiper-image {
	width: 100%;
	height: 100%;
	object-fit: cover;
}

/* 商品基本信息 */
.product-name-section {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 12px;
}

.product-name {
	font-size: 20px;
	font-weight: 600;
	color: #333;
	line-height: 1.3;
}

.recommend-tag {
	background: #ff6b6b;
	color: white;
	padding: 4px 10px;
	border-radius: 12px;
	font-size: 12px;
}

.product-status-section {
	display: flex;
	align-items: center;
	gap: 10px;
	margin-bottom: 15px;
}

.status-tag {
	padding: 4px 10px;
	border-radius: 12px;
	font-size: 12px;
}

.status-onsale {
	background: rgba(16, 185, 129, 0.1);
	color: #10B981;
}

.status-offsale {
	background: rgba(156, 163, 175, 0.1);
	color: #6B7280;
}

.status-soldout {
	background: rgba(239, 68, 68, 0.1);
	color: #EF4444;
}

.stock-info {
	font-size: 12px;
	color: #666;
}

.product-price-section {
	display: flex;
	align-items: center;
	gap: 10px;
	margin-bottom: 15px;
}

.price-label {
	font-size: 14px;
	color: #666;
}

.product-price {
	font-size: 24px;
	font-weight: bold;
	color: #ff6b6b;
}

.product-stats {
	display: flex;
	gap: 20px;
}

.stat-item {
	display: flex;
	flex-direction: column;
	gap: 4px;
}

.stat-label {
	font-size: 12px;
	color: #666;
}

.stat-value {
	font-size: 14px;
	font-weight: 500;
	color: #333;
}

/* 商品描述 */
.section-title {
	font-size: 16px;
	font-weight: 600;
	color: #333;
	margin-bottom: 10px;
}

.description-content {
	font-size: 14px;
	color: #666;
	line-height: 1.6;
}

/* 商品标签 */
.tags-container {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
}

.tag-item {
	background: rgba(59, 130, 246, 0.1);
	color: #3B82F6;
	padding: 4px 10px;
	border-radius: 12px;
	font-size: 12px;
}

/* 商品规格 */
.specs-container {
	display: flex;
	flex-direction: column;
	gap: 15px;
}

.spec-item {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.spec-name {
	font-size: 14px;
	color: #666;
}

.spec-options {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
}

.spec-option {
	padding: 6px 12px;
	border: 1px solid #e5e7eb;
	border-radius: 8px;
	font-size: 12px;
	color: #666;
	transition: all 0.3s ease;
}

.spec-option.selected {
	background: #3B82F6;
	color: white;
	border-color: #3B82F6;
}

/* 购买部分 */
.quantity-selector {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 15px;
}

.quantity-label {
	font-size: 14px;
	color: #333;
}

.quantity-control {
	display: flex;
	align-items: center;
	gap: 8px;
}

.quantity-button {
	width: 32px;
	height: 32px;
	background: #f5f5f5;
	border-radius: 8px;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 16px;
	color: #666;
	transition: all 0.2s ease;
}

.quantity-button:active {
	background: #e5e7eb;
}

.quantity-input {
	width: 60px;
	height: 32px;
	text-align: center;
	border: 1px solid #e5e7eb;
	border-radius: 8px;
	font-size: 14px;
}

.total-price {
	display: flex;
	align-items: center;
	justify-content: flex-end;
	gap: 8px;
	margin-bottom: 15px;
}

.total-label {
	font-size: 14px;
	color: #666;
}

.total-value {
	font-size: 18px;
	font-weight: bold;
	color: #ff6b6b;
}

.buy-button {
	width: 100%;
	background: linear-gradient(135deg, #ff6b6b 0%, #ff5252 100%);
	color: white;
	border: none;
	border-radius: 12px;
	padding: 15px;
	font-size: 16px;
	font-weight: 500;
	transition: all 0.3s ease;
}

.buy-button:disabled {
	background: #ccc;
}

.buy-button:active:not(:disabled) {
	transform: translateY(2px);
}

/* 相关商品 */
.empty-related {
	padding: 20px;
	text-align: center;
	color: #999;
}

.related-grid {
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: 10px;
}

.related-item {
	background: white;
	border-radius: 8px;
	overflow: hidden;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	transition: transform 0.2s ease;
}

.related-item:active {
	transform: scale(0.98);
}

.related-image {
	width: 100%;
	height: 80px;
	object-fit: cover;
}

.related-info {
	padding: 8px;
}

.related-name {
	font-size: 12px;
	color: #333;
	display: block;
	margin-bottom: 4px;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.related-price {
	font-size: 12px;
	color: #ff6b6b;
	font-weight: 500;
}
</style>