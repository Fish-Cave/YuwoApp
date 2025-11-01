<template>
	<view class="container">
		<!-- Header Section -->
		<view class="header-section">
			<view class="header-title">商品商城</view>
			<view class="search-box">
				<input class="search-input" v-model="searchKeyword" placeholder="搜索商品..." @input="onSearchInput" />
				<view class="search-icon" @click="onSearch">
					<uni-icons type="search" size="20" color="#666"></uni-icons>
				</view>
			</view>
		</view>

		<!-- Category Tabs -->
		<view class="category-tabs">
			<scroll-view scroll-x="true" class="category-scroll">
				<view
					v-for="(category, index) in categories"
					:key="category._id"
					:class="['category-tab', selectedCategory === category._id ? 'active' : '']"
					@click="selectCategory(category._id)">
					{{ category.name }}
				</view>
			</scroll-view>
		</view>

		<!-- Sort Options -->
		<view class="sort-options">
			<view
				v-for="option in sortOptions"
				:key="option.value"
				:class="['sort-option', sortBy === option.value ? 'active' : '']"
				@click="sortBy = option.value">
				{{ option.label }}
			</view>
		</view>

		<!-- Product List -->
		<view class="product-list">
			<view v-if="loading" class="loading">
				<text>加载中...</text>
			</view>

			<view v-else-if="products.length === 0" class="empty">
				<text>暂无商品</text>
			</view>

			<view v-else class="products-grid">
				<view
					v-for="product in sortedProducts"
					:key="product._id"
					class="product-item"
					@click="navigateToProductDetail(product._id)">
					<view class="product-image">
						<image
							:src="product.images && product.images.length > 0 ? product.images[0] : '/static/placeholder.png'"
							mode="aspectFill"
							class="image">
						</image>
						<view v-if="product.isRecommended" class="recommend-tag">推荐</view>
						<view v-if="product.status === 'soldout'" class="soldout-tag">已售罄</view>
					</view>
					<view class="product-info">
						<view class="product-name">{{ product.name }}</view>
						<view class="product-price">¥{{ ((typeof product.price === 'string' ? parseFloat(product.price) : product.price || 0) / 100).toFixed(2) }}</view>
						<view class="product-stock">库存: {{ product.stock }}</view>
						<view class="product-sales">销量: {{ product.sales }}</view>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

// 导入云函数
const product = uniCloud.importObject('product');

// 响应式数据
const loading = ref(false);
const searchKeyword = ref('');
const selectedCategory = ref('');
const sortBy = ref('default');
const categories = ref([]);
const products = ref([]);

// 排序选项
const sortOptions = [
	{ label: '默认', value: 'default' },
	{ label: '价格从低到高', value: 'priceAsc' },
	{ label: '价格从高到低', value: 'priceDesc' },
	{ label: '销量最高', value: 'sales' }
];

// 计算属性：排序后的商品列表
const sortedProducts = computed(() => {
	let result = [...products.value];

	switch (sortBy.value) {
		case 'priceAsc':
			result.sort((a, b) => a.price - b.price);
			break;
		case 'priceDesc':
			result.sort((a, b) => b.price - a.price);
			break;
		case 'sales':
			result.sort((a, b) => b.sales - a.sales);
			break;
		default:
			// 默认按排序权重和创建时间排序
			result.sort((a, b) => {
				if (b.sort !== a.sort) {
					return b.sort - a.sort;
				}
				return new Date(b.create_time) - new Date(a.create_time);
			});
	}

	// 如果有搜索关键词，进行过滤
	if (searchKeyword.value) {
		result = result.filter(product =>
			product.name.toLowerCase().includes(searchKeyword.value.toLowerCase())
		);
	}

	return result;
});

// 选择分类
function selectCategory(categoryId) {
	selectedCategory.value = categoryId;
	loadProducts();
}

// 搜索输入
function onSearchInput() {
	// 实时搜索
}

// 搜索操作
function onSearch() {
	loadProducts();
}

// 跳转到商品详情
function navigateToProductDetail(productId) {
	uni.navigateTo({
		url: `/pages/productDetail/productDetail?id=${productId}`
	});
}

// 加载分类列表
async function loadCategories() {
	try {
		loading.value = true;
		const result = await product.GetCategories({ data: {} });
		if (result && result.data) {
			categories.value = result.data.filter(cat => cat.status === 'active');
			// 添加"全部分类"选项
			categories.value.unshift({
				_id: '',
				name: '全部分类'
			});
			selectedCategory.value = '';
		}
	} catch (e) {
		uni.showToast({
			title: '加载分类失败',
			icon: 'none'
		});
		console.error('加载分类失败:', e);
	} finally {
		loading.value = false;
	}
}

// 加载商品列表
async function loadProducts() {
	try {
		loading.value = true;
		const params = {
			categoryId: selectedCategory.value || undefined,
			keyword: searchKeyword.value || undefined
		};
		const result = await product.GetProductsList({ data: params });
		if (result && result.data) {
			// 只显示在售和有库存的商品
			products.value = result.data.filter(product =>
				product.status === 'onsale' && product.stock > 0
			);
		}
	} catch (e) {
		uni.showToast({
			title: '加载商品失败',
			icon: 'none'
		});
		console.error('加载商品失败:', e);
	} finally {
		loading.value = false;
	}
}

// 生命周期钩子
onMounted(() => {
	loadCategories();
	loadProducts();
});
</script>

<style>
.container {
	padding: 0 0 20px 0;
	background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
	min-height: 100vh;
}

/* 头部样式 */
.header-section {
	background: linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%);
	padding: 20px;
	padding-bottom: 30px;
}

.header-title {
	font-size: 24px;
	font-weight: bold;
	color: white;
	margin-bottom: 15px;
	text-align: center;
	text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.search-box {
	display: flex;
	align-items: center;
	background: rgba(255, 255, 255, 0.9);
	border-radius: 25px;
	padding: 8px 16px;
	margin: 0 20px;
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.search-input {
	flex: 1;
	border: none;
	background: transparent;
	font-size: 14px;
	outline: none;
}

.search-icon {
	padding: 4px;
}

/* 分类标签样式 */
.category-tabs {
	background: white;
	padding: 10px 0;
	border-bottom: 1px solid #f0f0f0;
}

.category-scroll {
	white-space: nowrap;
	padding: 0 15px;
}

.category-tab {
	display: inline-block;
	padding: 8px 16px;
	margin-right: 8px;
	background: #f5f5f5;
	color: #666;
	border-radius: 20px;
	font-size: 14px;
	transition: all 0.3s ease;
}

.category-tab.active {
	background: #3B82F6;
	color: white;
}

/* 排序选项样式 */
.sort-options {
	display: flex;
	padding: 15px;
	background: white;
	border-bottom: 1px solid #f0f0f0;
	flex-wrap: wrap;
	gap: 10px;
}

.sort-option {
	padding: 6px 12px;
	background: #f5f5f5;
	color: #666;
	border-radius: 15px;
	font-size: 12px;
	transition: all 0.3s ease;
}

.sort-option.active {
	background: #3B82F6;
	color: white;
}

/* 商品列表样式 */
.product-list {
	padding: 15px;
}

.loading, .empty {
	padding: 40px;
	text-align: center;
	color: #999;
}

.products-grid {
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: 15px;
}

.product-item {
	background: white;
	border-radius: 12px;
	overflow: hidden;
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	transition: transform 0.2s ease;
}

.product-item:active {
	transform: scale(0.98);
}

.product-image {
	position: relative;
	height: 150px;
	overflow: hidden;
}

.image {
	width: 100%;
	height: 100%;
	object-fit: cover;
}

.recommend-tag {
	position: absolute;
	top: 8px;
	left: 8px;
	background: #ff6b6b;
	color: white;
	padding: 4px 8px;
	border-radius: 12px;
	font-size: 11px;
}

.soldout-tag {
	position: absolute;
	top: 8px;
	right: 8px;
	background: rgba(0, 0, 0, 0.7);
	color: white;
	padding: 4px 8px;
	border-radius: 12px;
	font-size: 11px;
}

.product-info {
	padding: 12px;
}

.product-name {
	font-size: 14px;
	font-weight: 500;
	color: #333;
	margin-bottom: 4px;
	line-height: 1.3;
	height: 36px;
	overflow: hidden;
	text-overflow: ellipsis;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
}

.product-price {
	font-size: 16px;
	font-weight: bold;
	color: #ff6b6b;
	margin-bottom: 4px;
}

.product-stock, .product-sales {
	font-size: 12px;
	color: #999;
}
</style>