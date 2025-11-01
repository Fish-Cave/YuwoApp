<template>
	<view class="container">
		<!-- Header Section -->
		<view class="header-card glass-card">
			<view class="header-title">商品管理</view>
			<view class="header-subtitle">管理商城商品信息</view>
		</view>

		<!-- Product Management Section -->
		<view class="section-card glass-card">
			<view class="card-header">
				<view class="card-title-row">
					<text class="card-title">商品管理</text>
					<text class="card-action" @click="toggleSection('product')">
						{{ sections.product ? '收起' : '展开' }}
					</text>
				</view>
			</view>

			<view v-if="sections.product" class="section-content">
				<!-- 商品表单模式切换 -->
				<view class="form-mode-switch">
					<view
						:class="['mode-button', productFormMode === 'add' ? 'mode-active' : '']"
						@click="switchProductFormMode('add')">
						新增商品
					</view>
					<view
						:class="['mode-button', productFormMode === 'edit' ? 'mode-active' : '']"
						@click="switchProductFormMode('edit')">
						编辑商品
					</view>
				</view>

				<!-- 编辑模式下显示商品选择器 -->
				<view v-if="productFormMode === 'edit'" class="form-group">
					<text class="form-label">选择要编辑的商品</text>
					<picker @change="onProductPickerChange" :value="selectedProductIndex" :range="productPickerRange">
						<view class="uni-input picker-input">{{ productPickerRange[selectedProductIndex] || '请选择商品' }}</view>
					</picker>
				</view>

				<view class="form-group">
					<text class="form-label">商品名称 *</text>
					<uni-easyinput v-model="productData.name" placeholder="输入商品名称" />
				</view>

				<view class="form-group">
					<text class="form-label">商品分类</text>
					<picker @change="onCategoryChange" :value="selectedCategoryIndex" :range="categoryPickerRange">
						<view class="uni-input picker-input">{{ categoryPickerRange[selectedCategoryIndex] || '请选择分类' }}</view>
					</picker>
				</view>

				<view class="form-group">
					<text class="form-label">商品价格（分）*</text>
					<uni-easyinput v-model="productData.price" placeholder="输入商品价格，单位为分" type="number" />
				</view>

				<view class="form-group">
					<text class="form-label">库存数量 *</text>
					<uni-easyinput v-model="productData.stock" placeholder="输入库存数量" type="number" />
				</view>

				<view class="form-group">
					<text class="form-label">商品状态</text>
					<uni-data-checkbox
						v-model="productData.status"
						:localdata="productStatusOptions"
					></uni-data-checkbox>
				</view>

				<view class="form-group">
					<text class="form-label">是否推荐</text>
					<switch :checked="productData.isRecommended" @change="onRecommendedChange" />
				</view>

				<view class="form-group">
					<text class="form-label">排序权重</text>
					<uni-easyinput v-model="productData.sort" placeholder="输入排序权重，数值越大越靠前" type="number" />
				</view>

				<view class="form-group">
					<text class="form-label">商品图片</text>
					<view class="image-upload">
						<view v-for="(image, index) in productData.images" :key="index" class="image-item">
							<image :src="image" mode="aspectFill" class="image-preview"></image>
							<view class="image-remove" @click="removeImage(index)">×</view>
						</view>
						<view v-if="productData.images.length < 5" class="image-add" @click="addImage">
							<text class="add-icon">+</text>
						</view>
					</view>
				</view>

				<view class="form-group">
					<text class="form-label">商品描述</text>
					<uni-easyinput
						v-model="productData.description"
						placeholder="输入商品描述"
						type="textarea"
						:maxlength="-1"
					/>
				</view>

				<view class="button-group">
					<button class="secondary-button" @click="resetProductForm">重置</button>
					<button class="primary-button" @click="handleProductAction">
						{{ productFormMode === 'add' ? '添加商品' : '保存修改' }}
					</button>
				</view>

				<!-- Product List -->
				<view class="list-header">
					<text>当前商品列表</text>
					<button class="refresh-button" @click="loadProducts">刷新</button>
				</view>

				<view v-if="products.length === 0" class="empty-list">
					<text>暂无商品</text>
				</view>

				<view v-else class="product-list">
					<view v-for="(product, index) in products" :key="index" class="product-item glass-item">
						<view class="product-info">
							<text class="product-name">{{ product.name }}</text>
							<text class="product-status" :class="getProductStatusClass(product.status)">{{ getProductStatusText(product.status) }}</text>
						</view>
						<view class="product-details">
							<text>价格: {{ ((typeof product.price === 'string' ? parseFloat(product.price) : product.price || 0) / 100).toFixed(2) }}元</text>
							<text>库存: {{ product.stock }}</text>
							<text>销量: {{ product.sales }}</text>
							<text v-if="product.isRecommended">推荐商品</text>
						</view>
						<view class="item-actions">
							<button class="action-button edit-button" @click="editProduct(product)">编辑</button>
							<button class="action-button delete-button" @click="deleteProduct(product)">删除</button>
						</view>
					</view>
				</view>
			</view>
		</view>

		<!-- Category Management Section -->
		<view class="section-card glass-card">
			<view class="card-header">
				<view class="card-title-row">
					<text class="card-title">商品分类管理</text>
					<text class="card-action" @click="toggleSection('category')">
						{{ sections.category ? '收起' : '展开' }}
					</text>
				</view>
			</view>

			<view v-if="sections.category" class="section-content">
				<!-- 分类表单模式切换 -->
				<view class="form-mode-switch">
					<view
						:class="['mode-button', categoryFormMode === 'add' ? 'mode-active' : '']"
						@click="switchCategoryFormMode('add')">
						新增分类
					</view>
					<view
						:class="['mode-button', categoryFormMode === 'edit' ? 'mode-active' : '']"
						@click="switchCategoryFormMode('edit')">
						编辑分类
					</view>
				</view>

				<!-- 编辑模式下显示分类选择器 -->
				<view v-if="categoryFormMode === 'edit'" class="form-group">
					<text class="form-label">选择要编辑的分类</text>
					<picker @change="onCategoryPickerChange" :value="selectedCategoryIndex" :range="categoryPickerRange">
						<view class="uni-input picker-input">{{ categoryPickerRange[selectedCategoryIndex] || '请选择分类' }}</view>
					</picker>
				</view>

				<view class="form-group">
					<text class="form-label">分类名称 *</text>
					<uni-easyinput v-model="categoryData.name" placeholder="输入分类名称" />
				</view>

				<view class="form-group">
					<text class="form-label">父分类</text>
					<picker @change="onParentCategoryChange" :value="selectedParentCategoryIndex" :range="parentCategoryPickerRange">
						<view class="uni-input picker-input">{{ parentCategoryPickerRange[selectedParentCategoryIndex] || '请选择父分类' }}</view>
					</picker>
				</view>

				<view class="form-group">
					<text class="form-label">分类状态</text>
					<uni-data-checkbox
						v-model="categoryData.status"
						:localdata="categoryStatusOptions"
					></uni-data-checkbox>
				</view>

				<view class="form-group">
					<text class="form-label">排序权重</text>
					<uni-easyinput v-model="categoryData.sort" placeholder="输入排序权重，数值越大越靠前" type="number" />
				</view>

				<view class="form-group">
					<text class="form-label">分类描述</text>
					<uni-easyinput
						v-model="categoryData.description"
						placeholder="输入分类描述"
						type="textarea"
						:maxlength="-1"
					/>
				</view>

				<view class="button-group">
					<button class="secondary-button" @click="resetCategoryForm">重置</button>
					<button class="primary-button" @click="handleCategoryAction">
						{{ categoryFormMode === 'add' ? '添加分类' : '保存修改' }}
					</button>
				</view>

				<!-- Category List -->
				<view class="list-header">
					<text>当前分类列表</text>
					<button class="refresh-button" @click="loadCategories">刷新</button>
				</view>

				<view v-if="categories.length === 0" class="empty-list">
					<text>暂无分类</text>
				</view>

				<view v-else class="category-list">
					<view v-for="(category, index) in categories" :key="index" class="category-item glass-item">
						<view class="category-info">
							<text class="category-name">{{ category.name }}</text>
							<text class="category-status" :class="getCategoryStatusClass(category.status)">{{ getCategoryStatusText(category.status) }}</text>
						</view>
						<view class="category-details">
							<text>父分类: {{ getParentCategoryName(category.parentId) || '无' }}</text>
							<text>排序: {{ category.sort }}</text>
						</view>
						<view class="item-actions">
							<button class="action-button edit-button" @click="editCategory(category)">编辑</button>
							<button class="action-button delete-button" @click="deleteCategory(category)">删除</button>
						</view>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';

// 导入云函数
const product = uniCloud.importObject('product');

// 控制各个部分的展开/折叠状态
const sections = reactive({
	product: true,
	category: false
});

// ==================== 商品管理 ====================
// 表单模式（add：新增，edit：编辑）
const productFormMode = ref('add');
const products = ref([]);
const selectedProductId = ref('');
const selectedProductIndex = ref(0);

// 计算属性：商品选择器选项
const productPickerRange = computed(() => {
	return products.value.map(product => product.name);
});

// 商品管理数据
const productData = reactive({
	name: '',
	categoryId: '',
	description: '',
	images: [],
	price: 0,
	stock: 0,
	sales: 0,
	status: 'onsale',
	isRecommended: false,
	sort: 0,
	tags: []
});

const productStatusOptions = [
	{ value: 'onsale', text: '在售' },
	{ value: 'offsale', text: '下架' },
	{ value: 'soldout', text: '售罄' }
];

// 切换商品表单模式
function switchProductFormMode(mode) {
	productFormMode.value = mode;
	if (mode === 'add') {
		resetProductForm();
	}
}

// 商品选择器变更事件
function onProductPickerChange(e) {
	selectedProductIndex.value = e.detail.value;
	const selectedProduct = products.value[selectedProductIndex.value];
	if (selectedProduct) {
		selectedProductId.value = selectedProduct._id;
		loadProductDetail(selectedProduct._id);
	}
}

// 加载商品详情
async function loadProductDetail(productId) {
	try {
		uni.showLoading({ title: '加载中...' });
		const result = await product.GetProductDetail({ data: { productId } });
		uni.hideLoading();

		if (result && result.data && result.data.length > 0 && result.data[0] && result.data[0].length > 0) {
			const productDetail = result.data[0][0];
			Object.keys(productData).forEach(key => {
				if (key in productDetail) {
					productData[key] = productDetail[key];
				}
			});
		} else {
			uni.showToast({
				title: '获取商品详情失败',
				icon: 'none'
			});
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

// 处理商品添加/更新
async function handleProductAction() {
	if (!productData.name || !productData.price || !productData.stock) {
		uni.showToast({
			title: '请填写必填字段',
			icon: 'none'
		});
		return;
	}

	try {
		uni.showLoading({ title: productFormMode.value === 'add' ? '添加中...' : '更新中...' });

		if (productFormMode.value === 'add') {
			await product.AddProduct({ data: productData });
			uni.showToast({
				title: '添加成功',
				icon: 'success'
			});
		} else {
			if (!selectedProductId.value) {
				uni.hideLoading();
				uni.showToast({
					title: '请先选择要编辑的商品',
					icon: 'none'
				});
				return;
			}
			await product.UpdateProduct({ productId: selectedProductId.value, data: productData });
			uni.showToast({
				title: '更新成功',
				icon: 'success'
			});
		}

		uni.hideLoading();
		resetProductForm();
		loadProducts();
	} catch (e) {
		uni.hideLoading();
		uni.showModal({
			title: productFormMode.value === 'add' ? '添加失败' : '更新失败',
			content: e.errMsg || '服务器错误',
			showCancel: false
		});
		console.error(productFormMode.value === 'add' ? '添加商品失败:' : '更新商品失败:', e);
	}
}

// 重置商品表单
function resetProductForm() {
	productData.name = '';
	productData.categoryId = '';
	productData.description = '';
	productData.images = [];
	productData.price = 0;
	productData.stock = 0;
	productData.sales = 0;
	productData.status = 'onsale';
	productData.isRecommended = false;
	productData.sort = 0;
	productData.tags = [];
	selectedProductId.value = '';
	selectedProductIndex.value = 0;
}

// 编辑商品
function editProduct(product) {
	switchProductFormMode('edit');
	const index = products.value.findIndex(p => p._id === product._id);
	if (index > -1) {
		selectedProductIndex.value = index;
		selectedProductId.value = product._id;

		// 复制商品数据
		Object.keys(productData).forEach(key => {
			if (key in product) {
				productData[key] = product[key];
			}
		});

		// 设置分类选择索引
		if (product.categoryId) {
			const categoryIndex = categories.value.findIndex(c => c._id === product.categoryId);
			if (categoryIndex > -1) {
				selectedCategoryIndex.value = categoryIndex + 1; // +1 因为有"请选择分类"选项
			} else {
				selectedCategoryIndex.value = 0; // 找不到对应分类，设为"请选择分类"
			}
		} else {
			selectedCategoryIndex.value = 0; // 没有分类ID，设为"请选择分类"
		}

		console.log('编辑商品，分类索引:', selectedCategoryIndex.value);
		console.log('编辑商品，分类ID:', productData.categoryId);

		uni.pageScrollTo({
			selector: '.form-mode-switch',
			duration: 300
		});
	}
}

// 删除商品
function deleteProduct(product) {
	uni.showModal({
		title: '确认删除',
		content: `确定要删除商品"${product.name}"吗？`,
		success: async (res) => {
			if (res.confirm) {
				try {
					uni.showLoading({ title: '删除中...' });
					await product.DeleteProduct({ productId: product._id });
					uni.hideLoading();
					uni.showToast({
						title: '删除成功',
						icon: 'success'
					});
					loadProducts();
				} catch (e) {
					uni.hideLoading();
					uni.showToast({
						title: '删除失败',
						icon: 'none'
					});
					console.error('删除商品失败:', e);
				}
			}
		}
	});
}

// 加载商品列表
async function loadProducts() {
	try {
		uni.showLoading({ title: '加载中...' });
		const result = await product.GetProductsList({ data: {} });
		uni.hideLoading();
		if (result && result.data) {
			products.value = result.data;
		}
	} catch (e) {
		uni.hideLoading();
		uni.showToast({
			title: '加载商品列表失败',
			icon: 'none'
		});
		console.error('加载商品列表失败:', e);
	}
}

// 推荐开关变更
function onRecommendedChange(e) {
	productData.isRecommended = e.detail.value;
}

// 图片操作
function addImage() {
	// 这里应该调用图片上传功能，暂时使用占位符
	productData.images.push('https://via.placeholder.com/300x300?text=Product+Image');
}

function removeImage(index) {
	productData.images.splice(index, 1);
}

// 获取商品状态文本
function getProductStatusText(status) {
	switch (status) {
		case 'onsale': return '在售';
		case 'offsale': return '下架';
		case 'soldout': return '售罄';
		default: return '未知状态';
	}
}

// 获取商品状态样式
function getProductStatusClass(status) {
	switch (status) {
		case 'onsale': return 'status-onsale';
		case 'offsale': return 'status-offsale';
		case 'soldout': return 'status-soldout';
		default: return '';
	}
}

// ==================== 分类管理 ====================
// 表单模式（add：新增，edit：编辑）
const categoryFormMode = ref('add');
const categories = ref([]);
const selectedCategoryId = ref('');
const selectedCategoryIndex = ref(0);
const selectedParentCategoryIndex = ref(0);

// 计算属性：分类选择器选项
const categoryPickerRange = computed(() => {
	return ['请选择分类', ...(categories.value && Array.isArray(categories.value) ? categories.value.map(category => category.name) : [])];
});

const parentCategoryPickerRange = computed(() => {
	return ['无父分类', ...(categories.value && Array.isArray(categories.value) ? categories.value.map(category => category.name) : [])];
});

// 分类管理数据
const categoryData = reactive({
	name: '',
	parentId: null,
	sort: 0,
	status: 'active',
	description: ''
});

const categoryStatusOptions = [
	{ value: 'active', text: '启用' },
	{ value: 'inactive', text: '禁用' }
];

// 切换分类表单模式
function switchCategoryFormMode(mode) {
	categoryFormMode.value = mode;
	if (mode === 'add') {
		resetCategoryForm();
	}
}

// 分类选择器变更事件
function onCategoryPickerChange(e) {
	selectedCategoryIndex.value = e.detail.value;
	const selectedCategory = categories.value[selectedCategoryIndex.value];
	if (selectedCategory) {
		selectedCategoryId.value = selectedCategory._id;
		loadCategoryDetail(selectedCategory._id);
	}
}

// 父分类选择器变更事件
function onParentCategoryChange(e) {
	if (e.detail.value === 0) {
		categoryData.parentId = null;
	} else {
		const selectedIndex = e.detail.value - 1;
		if (categories.value[selectedIndex]) {
			categoryData.parentId = categories.value[selectedIndex]._id;
		}
	}
}

// 商品分类选择器变更事件
function onCategoryChange(e) {
	const selectedIndex = parseInt(e.detail.value);
	console.log('分类选择变更，索引:', selectedIndex);

	if (selectedIndex > 0 && categories.value[selectedIndex - 1]) {
		// 索引 > 0 表示选择了实际分类（减去1是因为我们添加了"请选择分类"）
		productData.categoryId = categories.value[selectedIndex - 1]._id;
		console.log('设置分类ID:', productData.categoryId);
	} else {
		// 索引为0表示"请选择分类"
		productData.categoryId = '';
		console.log('清空分类ID');
	}
}

// 加载分类详情
async function loadCategoryDetail(categoryId) {
	try {
		uni.showLoading({ title: '加载中...' });
		const result = await product.GetCategoryDetail({ data: { categoryId } });
		uni.hideLoading();

		if (result && result.data && result.data.length > 0 && result.data[0] && result.data[0].length > 0) {
			const categoryDetail = result.data[0][0];
			Object.keys(categoryData).forEach(key => {
				if (key in categoryDetail) {
					categoryData[key] = categoryDetail[key];
				}
			});
		} else {
			uni.showToast({
				title: '获取分类详情失败',
				icon: 'none'
			});
		}
	} catch (e) {
		uni.hideLoading();
		uni.showToast({
			title: '加载分类详情失败',
			icon: 'none'
		});
		console.error('加载分类详情失败:', e);
	}
}

// 处理分类添加/更新
async function handleCategoryAction() {
	if (!categoryData.name) {
		uni.showToast({
			title: '请填写分类名称',
			icon: 'none'
		});
		return;
	}

	try {
		uni.showLoading({ title: categoryFormMode.value === 'add' ? '添加中...' : '更新中...' });

		if (categoryFormMode.value === 'add') {
			// 创建一个新的普通对象来避免Vue reactive对象的序列化问题
			const categoryPayload = {
				name: categoryData.name,
				parentId: categoryData.parentId,
				sort: categoryData.sort,
				status: categoryData.status,
				description: categoryData.description
			};
			await product.AddCategory({ data: categoryPayload });
			uni.showToast({
				title: '添加成功',
				icon: 'success'
			});
		} else {
			if (!selectedCategoryId.value) {
				uni.hideLoading();
				uni.showToast({
					title: '请先选择要编辑的分类',
					icon: 'none'
				});
				return;
			}
			// 创建一个新的普通对象来避免Vue reactive对象的序列化问题
			const categoryPayload = {
				name: categoryData.name,
				parentId: categoryData.parentId,
				sort: categoryData.sort,
				status: categoryData.status,
				description: categoryData.description
			};
			await product.UpdateCategory({ categoryId: selectedCategoryId.value, data: categoryPayload });
			uni.showToast({
				title: '更新成功',
				icon: 'success'
			});
		}

		uni.hideLoading();
		resetCategoryForm();
		loadCategories();
	} catch (e) {
		uni.hideLoading();
		uni.showModal({
			title: categoryFormMode.value === 'add' ? '添加失败' : '更新失败',
			content: e.errMsg || '服务器错误',
			showCancel: false
		});
		console.error(categoryFormMode.value === 'add' ? '添加分类失败:' : '更新分类失败:', e);
	}
}

// 重置分类表单
function resetCategoryForm() {
	categoryData.name = '';
	categoryData.parentId = null;
	categoryData.sort = 0;
	categoryData.status = 'active';
	categoryData.description = '';
	selectedCategoryId.value = '';
	selectedCategoryIndex.value = 0;
	selectedParentCategoryIndex.value = 0;
}

// 编辑分类
function editCategory(category) {
	switchCategoryFormMode('edit');
	const index = categories.value.findIndex(c => c._id === category._id);
	if (index > -1) {
		selectedCategoryIndex.value = index;
		selectedCategoryId.value = category._id;

		Object.keys(categoryData).forEach(key => {
			if (key in category) {
				categoryData[key] = category[key];
			}
		});

		uni.pageScrollTo({
			selector: '.form-mode-switch',
			duration: 300
		});
	}
}

// 删除分类
function deleteCategory(category) {
	uni.showModal({
		title: '确认删除',
		content: `确定要删除分类"${category.name}"吗？`,
		success: async (res) => {
			if (res.confirm) {
				try {
					uni.showLoading({ title: '删除中...' });
					await product.DeleteCategory({ categoryId: category._id });
					uni.hideLoading();
					uni.showToast({
						title: '删除成功',
						icon: 'success'
					});
					loadCategories();
				} catch (e) {
					uni.hideLoading();
					uni.showToast({
						title: '删除失败',
						icon: 'none'
					});
					console.error('删除分类失败:', e);
				}
			}
		}
	});
}

// 加载分类列表
async function loadCategories() {
	try {
		uni.showLoading({ title: '加载中...' });
		const result = await product.GetCategories({ data: {} });
		uni.hideLoading();
		if (result && result.data) {
			categories.value = result.data;
		}
	} catch (e) {
		uni.hideLoading();
		uni.showToast({
			title: '加载分类列表失败',
			icon: 'none'
		});
		console.error('加载分类列表失败:', e);
	}
}

// 获取父分类名称
function getParentCategoryName(parentId) {
	if (!parentId || !categories.value || !Array.isArray(categories.value)) return null;
	const parentCategory = categories.value.find(c => c._id === parentId);
	return parentCategory ? parentCategory.name : null;
}

// 获取分类状态文本
function getCategoryStatusText(status) {
	switch (status) {
		case 'active': return '启用';
		case 'inactive': return '禁用';
		default: return '未知状态';
	}
}

// 获取分类状态样式
function getCategoryStatusClass(status) {
	switch (status) {
		case 'active': return 'status-active';
		case 'inactive': return 'status-inactive';
		default: return '';
	}
}

// 切换部分的展开/折叠状态
function toggleSection(sectionName) {
	sections[sectionName] = !sections[sectionName];
}

// 生命周期钩子
onMounted(() => {
	loadProducts();
	loadCategories();
});
</script>

<style>
.container {
	padding: 20px;
	background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
	min-height: 100vh;
}

/* 玻璃拟态卡片 */
.glass-card {
	background: rgba(255, 255, 255, 0.7);
	backdrop-filter: blur(10px);
	border-radius: 20px;
	box-shadow: 0 8px 32px rgba(31, 38, 135, 0.1);
	border: 1px solid rgba(255, 255, 255, 0.18);
	overflow: hidden;
	padding: 16px;
	margin-bottom: 20px;
	transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.glass-item {
	background: rgba(255, 255, 255, 0.6);
	backdrop-filter: blur(8px);
	border-radius: 12px;
	box-shadow: 0 4px 16px rgba(31, 38, 135, 0.05);
	border: 1px solid rgba(255, 255, 255, 0.18);
	padding: 12px;
	margin-bottom: 10px;
	transition: transform 0.2s ease;
}

.glass-item:active {
	transform: scale(0.98);
}

/* 头部样式 */
.header-card {
	background: linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%);
	padding: 24px 16px;
	margin-bottom: 24px;
}

.header-title {
	font-size: 24px;
	font-weight: bold;
	color: white;
	margin-bottom: 8px;
	text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-subtitle {
	font-size: 14px;
	color: rgba(255, 255, 255, 0.8);
}

/* 卡片头部 */
.card-header {
	padding: 4px 0;
	margin-bottom: 12px;
}

.card-title-row {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 8px;
}

.card-title {
	font-size: 18px;
	font-weight: 600;
	color: #333;
}

.card-action {
	font-size: 14px;
	color: #3B82F6;
	padding: 4px 8px;
	border-radius: 4px;
	background: rgba(59, 130, 246, 0.1);
}

.section-content {
	animation: fade-in 0.3s ease;
	padding-top: 8px;
}

/* 表单模式切换 */
.form-mode-switch {
	display: flex;
	margin-bottom: 16px;
	border-radius: 8px;
	overflow: hidden;
	border: 1px solid rgba(59, 130, 246, 0.2);
}

.mode-button {
	flex: 1;
	text-align: center;
	padding: 10px 0;
	font-size: 14px;
	background: rgba(255, 255, 255, 0.7);
	transition: all 0.3s ease;
}

.mode-active {
	background: #3B82F6;
	color: white;
	font-weight: 500;
}

/* 表单样式 */
.form-group {
	margin-bottom: 16px;
}

.form-label {
	display: block;
	font-size: 14px;
	color: #4B5563;
	margin-bottom: 6px;
	font-weight: 500;
}

.picker-input {
	height: 40px;
	line-height: 40px;
	padding: 0 10px;
	background-color: #F9FAFB;
	border: 1px solid #E5E7EB;
	border-radius: 6px;
	font-size: 14px;
	color: #1F2937;
}

/* 图片上传 */
.image-upload {
	display: flex;
	flex-wrap: wrap;
	gap: 10px;
}

.image-item {
	position: relative;
	width: 80px;
	height: 80px;
}

.image-preview {
	width: 100%;
	height: 100%;
	border-radius: 8px;
	border: 2px solid #E5E7EB;
}

.image-remove {
	position: absolute;
	top: -5px;
	right: -5px;
	width: 20px;
	height: 20px;
	background: #EF4444;
	color: white;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 14px;
}

.image-add {
	width: 80px;
	height: 80px;
	border: 2px dashed #D1D5DB;
	border-radius: 8px;
	display: flex;
	align-items: center;
	justify-content: center;
	background: rgba(255, 255, 255, 0.5);
}

.add-icon {
	font-size: 24px;
	color: #9CA3AF;
}

/* 按钮组 */
.button-group {
	display: flex;
	gap: 10px;
	margin-top: 16px;
	margin-bottom: 24px;
}

/* 按钮样式 */
.primary-button {
	flex: 2;
	background: linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%);
	color: white;
	border: none;
	border-radius: 12px;
	padding: 12px;
	font-size: 16px;
	font-weight: 500;
	box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
	transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.primary-button:active {
	transform: translateY(2px);
	box-shadow: 0 2px 6px rgba(59, 130, 246, 0.2);
}

.secondary-button {
	flex: 1;
	background: #F3F4F6;
	color: #4B5563;
	border: 1px solid #D1D5DB;
	border-radius: 12px;
	padding: 12px;
	font-size: 16px;
	font-weight: 500;
	transition: background-color 0.2s ease;
}

.secondary-button:active {
	background: #E5E7EB;
}

/* 列表样式 */
.list-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 12px;
	padding: 0 4px;
}

.list-header text {
	font-size: 16px;
	font-weight: 500;
	color: #4B5563;
}

.refresh-button {
	font-size: 12px;
	padding: 4px 8px;
	background: rgba(59, 130, 246, 0.1);
	color: #3B82F6;
	border-radius: 4px;
	border: none;
}

.empty-list {
	padding: 20px;
	text-align: center;
	color: #9CA3AF;
	background: rgba(0, 0, 0, 0.02);
	border-radius: 8px;
}

/* 项目操作按钮 */
.item-actions {
	display: flex;
	justify-content: flex-end;
	margin-top: 8px;
}

.action-button {
	font-size: 12px;
	padding: 4px 8px;
	border-radius: 4px;
	margin-left: 6px;
}

.edit-button {
	background: rgba(59, 130, 246, 0.1);
	color: #3B82F6;
	border: 1px solid rgba(59, 130, 246, 0.2);
}

.delete-button {
	background: rgba(239, 68, 68, 0.1);
	color: #EF4444;
	border: 1px solid rgba(239, 68, 68, 0.2);
}

/* 商品列表样式 */
.product-list {
	margin-bottom: 20px;
}

.product-info {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 8px;
}

.product-name {
	font-size: 16px;
	font-weight: 500;
	color: #1F2937;
}

.product-status {
	font-size: 12px;
	padding: 2px 8px;
	border-radius: 20px;
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

.product-details {
	display: flex;
	flex-direction: column;
	gap: 4px;
}

.product-details text {
	font-size: 13px;
	color: #6B7280;
}

/* 分类列表样式 */
.category-list {
	margin-bottom: 20px;
}

.category-info {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 8px;
}

.category-name {
	font-size: 16px;
	font-weight: 500;
	color: #1F2937;
}

.category-status {
	font-size: 12px;
	padding: 2px 8px;
	border-radius: 20px;
}

.status-active {
	background: rgba(16, 185, 129, 0.1);
	color: #10B981;
}

.status-inactive {
	background: rgba(156, 163, 175, 0.1);
	color: #6B7280;
}

.category-details {
	display: flex;
	flex-direction: column;
	gap: 4px;
}

.category-details text {
	font-size: 13px;
	color: #6B7280;
}

/* 动画 */
@keyframes fade-in {
	from {
		opacity: 0;
		transform: translateY(-10px);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}

/* 深色模式 */
@media (prefers-color-scheme: dark) {
	.container {
		background: linear-gradient(135deg, #111827 0%, #1F2937 100%);
	}

	.glass-card {
		background: rgba(31, 41, 55, 0.7);
		border-color: rgba(255, 255, 255, 0.08);
	}

	.glass-item {
		background: rgba(31, 41, 55, 0.6);
		border-color: rgba(255, 255, 255, 0.08);
	}

	.card-title {
		color: #F3F4F6;
	}

	.card-action {
		color: #60A5FA;
		background: rgba(96, 165, 250, 0.2);
	}

	.form-label {
		color: #9CA3AF;
	}

	.mode-button {
		background: rgba(31, 41, 55, 0.5);
		color: #D1D5DB;
	}

	.mode-active {
		background: #3B82F6;
		color: white;
	}

	.picker-input {
		background-color: rgba(31, 41, 55, 0.7);
		border-color: rgba(255, 255, 255, 0.08);
		color: #F3F4F6;
	}

	.secondary-button {
		background: rgba(31, 41, 55, 0.7);
		color: #D1D5DB;
		border-color: rgba(255, 255, 255, 0.1);
	}

	.secondary-button:active {
		background: rgba(31, 41, 55, 0.9);
	}

	.list-header text {
		color: #D1D5DB;
	}

	.refresh-button {
		background: rgba(59, 130, 246, 0.2);
		color: #60A5FA;
	}

	.empty-list {
		background: rgba(255, 255, 255, 0.03);
	}

	.edit-button {
		background: rgba(59, 130, 246, 0.2);
		border-color: rgba(59, 130, 246, 0.3);
	}

	.delete-button {
		background: rgba(239, 68, 68, 0.2);
		border-color: rgba(239, 68, 68, 0.3);
	}

	.product-name {
		color: #F3F4F6;
	}

	.product-details text {
		color: #9CA3AF;
	}

	.category-name {
		color: #F3F4F6;
	}

	.category-details text {
		color: #9CA3AF;
	}
}
</style>