<template>
	<view class="container">
		
		<scroll-view scroll-y="true" class="content-scroll">
			<!-- Order Summary -->
			<view class="order-summary glass-card">
				<view class="section-title">订单信息</view>
				<view class="product-info">
					<view class="product-image">
						<image
							:src="orderData.productImage || '/static/placeholder.png'"
							mode="aspectFill"
							class="image">
						</image>
					</view>
					<view class="product-details">
						<view class="product-name">{{ orderData.productName }}</view>
						<view class="product-price">¥{{ ((typeof orderData.price === 'string' ? parseFloat(orderData.price) : orderData.price || 0) / 100).toFixed(2) }}</view>
						<view class="product-quantity">数量: {{ orderData.quantity }}</view>
					</view>
				</view>

				<!-- Product Specifications -->
				<view v-if="orderData.specs && Object.keys(orderData.specs).length > 0" class="product-specs">
					<view class="specs-title">规格:</view>
					<view v-for="(value, key) in orderData.specs" :key="key" class="spec-item">
						<text class="spec-key">{{ key }}:</text>
						<text class="spec-value">{{ value }}</text>
					</view>
				</view>
			</view>

			
			<!-- Order Summary Details -->
			<view class="order-details glass-card">
				<view class="section-title">费用明细</view>
				<view class="detail-item">
					<text class="detail-label">商品单价</text>
					<text class="detail-value">¥{{ ((typeof orderData.price === 'string' ? parseFloat(orderData.price) : orderData.price || 0) / 100).toFixed(2) }}</text>
				</view>
				<view class="detail-item">
					<text class="detail-label">购买数量</text>
					<text class="detail-value">{{ orderData.quantity }}</text>
				</view>
				<view class="detail-item total">
					<text class="detail-label">合计</text>
					<text class="detail-value">¥{{ calculatedTotalPrice }}</text>
				</view>
			</view>

			<!-- Remark -->
			<view class="remark-section glass-card">
				<view class="section-title">订单备注</view>
				<uni-easyinput
					v-model="remark"
					placeholder="如有特殊要求请在此备注"
					type="textarea"
					:maxlength="200"
				/>
				<text class="char-count">{{ remark.length }}/200</text>
			</view>

			<!-- Submit Button -->
			<view class="submit-section">
				<button
					class="submit-button"
					:disabled="!canSubmit"
					@click="submitOrder">
					立即支付
				</button>
				<view class="submit-tip">
					点击支付后将跳转到微信支付页面
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
const orderData = ref({});
const remark = ref('');
const userInfo = ref({});

// 计算属性
const calculatedTotalPrice = computed(() => {
	// 如果从商品详情页面传递了totalPrice（以分为单位），直接使用
	if (orderData.value.totalPrice) {
		return (orderData.value.totalPrice / 100).toFixed(2);
	}

	// 否则重新计算
	const price = typeof orderData.value.price === 'string'
		? parseFloat(orderData.value.price) || 0
		: (orderData.value.price || 0);
	const quantity = orderData.value.quantity || 1;
	return ((price / 100) * quantity).toFixed(2);
});

const canSubmit = computed(() => {
	return orderData.value.productId &&
		   orderData.value.quantity > 0 &&
		   orderData.value.price > 0;
});

// 获取用户信息
function getUserInfo() {
	try {
		const info = uniCloud.getCurrentUserInfo();
		userInfo.value = info;
	} catch (e) {
		console.error('获取用户信息失败:', e);
	}
}

// 提交订单并支付
async function submitOrder() {
	try {
		uni.showLoading({ title: '订单处理中...' });

		const price = typeof orderData.value.price === 'string'
			? parseFloat(orderData.value.price) || 0
			: (orderData.value.price || 0);

		// 从商品详情页面传递过来的totalPrice已经是以分为单位
		const totalPrice = orderData.value.totalPrice || Math.round(price * orderData.value.quantity);

		const orderParams = {
			productId: orderData.value.productId,
			productName: orderData.value.productName,
			quantity: orderData.value.quantity,
			price: price,
			totalPrice: totalPrice,
			specs: orderData.value.specs || {},
			productImage: orderData.value.productImage,
			remark: remark.value.trim()
		};

		const result = await productService.CreateProductOrder({ data: orderParams });
		uni.hideLoading();

		if (result && result.errCode === 0) {
			// 订单创建成功，调用 uni-pay 进行支付
			const orderNo = result.data.order_no;
			openUniPay(orderNo, totalPrice);
		} else {
			uni.showModal({
				title: '创建订单失败',
				content: result.errMsg || '服务器错误，请稍后重试',
				showCancel: false
			});
		}
	} catch (e) {
		uni.hideLoading();
		uni.showModal({
			title: '创建订单失败',
			content: '网络错误，请稍后重试',
			showCancel: false
		});
		console.error('创建订单失败:', e);
	}
}

// 打开 uni-pay 支付
function openUniPay(orderNo, totalFee) {
	uni.openPay({
		provider: 'wxpay',
		order_no: orderNo,
		total_fee: totalFee,
		type: 'product', // 指定支付类型为商品购买
		complete: (res) => {
			console.log('支付结果:', res);
			if (res.success) {
				uni.showToast({
					title: '支付成功',
					icon: 'success'
				});
				// 跳转到订单详情或成功页面
				setTimeout(() => {
					uni.redirectTo({
						url: '/pages/pay/paysuccess?order_no=' + orderNo
					});
				}, 1500);
			} else {
				uni.showModal({
					title: '支付失败',
					content: res.errMsg || '支付未完成，请重试',
					showCancel: false
				});
			}
		}
	});
}

// 返回上一页
function goBack() {
	uni.navigateBack();
}

// 生命周期钩子
onMounted(() => {
	// 获取用户信息
	getUserInfo();

	// 获取订单数据
	const pages = getCurrentPages();
	const currentPage = pages[pages.length - 1];

	// 尝试从URL参数获取订单数据
	if (currentPage.options.data) {
		try {
			orderData.value = JSON.parse(decodeURIComponent(currentPage.options.data));
		} catch (e) {
			console.error('解析订单数据失败:', e);
		}
	}

	// 如果没有数据，返回上一页
	if (!orderData.value.productId) {
		uni.showToast({
			title: '订单数据异常',
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
	padding: 15px;
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

/* 通用样式 */
.section-title {
	font-size: 16px;
	font-weight: 600;
	color: #333;
	margin-bottom: 12px;
}

/* 订单信息 */
.product-info {
	display: flex;
	gap: 12px;
	margin-bottom: 12px;
}

.product-image {
	width: 80px;
	height: 80px;
	flex-shrink: 0;
	border-radius: 8px;
	overflow: hidden;
}

.image {
	width: 100%;
	height: 100%;
	object-fit: cover;
}

.product-details {
	flex: 1;
	display: flex;
	flex-direction: column;
	justify-content: space-between;
}

.product-name {
	font-size: 16px;
	font-weight: 500;
	color: #333;
	line-height: 1.3;
}

.product-price {
	font-size: 18px;
	font-weight: bold;
	color: #ff6b6b;
}

.product-quantity {
	font-size: 14px;
	color: #666;
}

/* 商品规格 */
.product-specs {
	margin-top: 12px;
	padding-top: 12px;
	border-top: 1px solid #f0f0f0;
}

.specs-title {
	font-size: 14px;
	color: #666;
	margin-bottom: 8px;
}

.spec-item {
	display: flex;
	align-items: center;
	gap: 8px;
	margin-bottom: 4px;
}

.spec-key {
	font-size: 14px;
	color: #666;
}

.spec-value {
	font-size: 14px;
	color: #333;
	font-weight: 500;
}


/* 订单明细 */
.order-details {
	margin-bottom: 20px;
}

.detail-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 8px 0;
	border-bottom: 1px solid #f0f0f0;
}

.detail-item:last-child {
	border-bottom: none;
}

.detail-label {
	font-size: 14px;
	color: #666;
}

.detail-value {
	font-size: 14px;
	color: #333;
}

.detail-item.total {
	border-top: 1px solid #e5e7eb;
	margin-top: 8px;
	padding-top: 12px;
}

.detail-item.total .detail-label {
	font-size: 16px;
	font-weight: 600;
	color: #333;
}

.detail-item.total .detail-value {
	font-size: 18px;
	font-weight: bold;
	color: #ff6b6b;
}

/* 订单备注 */
.remark-section {
	position: relative;
}

.char-count {
	position: absolute;
	right: 16px;
	bottom: 8px;
	font-size: 12px;
	color: #999;
}

/* 提交部分 */
.submit-section {
	padding: 20px 0 40px 0;
}

.submit-button {
	width: 100%;
	background: linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%);
	color: white;
	border: none;
	border-radius: 12px;
	padding: 16px;
	font-size: 16px;
	font-weight: 500;
	transition: all 0.3s ease;
}

.submit-button:disabled {
	background: #ccc;
}

.submit-button:active:not(:disabled) {
	transform: translateY(2px);
}

.submit-tip {
	margin-top: 12px;
	text-align: center;
	font-size: 12px;
	color: #999;
	line-height: 1.4;
}

/* 深色模式 */
@media (prefers-color-scheme: dark) {
	.container {
		background: linear-gradient(135deg, #111827 0%, #1F2937 100%);
	}

	.glass-card {
		background: rgba(31, 41, 55, 0.8);
		border-color: rgba(255, 255, 255, 0.08);
	}

	.section-title {
		color: #F3F4F6;
	}

	.product-name {
		color: #F3F4F6;
	}

	.product-quantity {
		color: #9CA3AF;
	}

	.specs-title {
		color: #9CA3AF;
	}

	.spec-key {
		color: #9CA3AF;
	}

	.spec-value {
		color: #F3F4F6;
	}

	.form-label {
		color: #9CA3AF;
	}

	.payment-option {
		background: rgba(31, 41, 55, 0.5);
	}

	.payment-name {
		color: #F3F4F6;
	}

	.payment-desc {
		color: #9CA3AF;
	}

	.detail-label {
		color: #9CA3AF;
	}

	.detail-value {
		color: #F3F4F6;
	}

	.detail-item.total {
		border-top-color: rgba(255, 255, 255, 0.1);
	}

	.detail-item.total .detail-label {
		color: #F3F4F6;
	}

	.char-count {
		color: #6B7280;
	}

	.submit-tip {
		color: #6B7280;
	}
}
</style>