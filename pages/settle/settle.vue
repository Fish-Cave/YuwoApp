<template>
	<view class="container">
		<view class="glass-card settle-card">
			<view class="card-content">
				<view class="card-header">
					<text class="card-title">补票/自定义支付</text>
				</view>

				<view class="input-group">
					<text class="input-label">支付金额 (元)</text>
					<uni-easyinput
						type="digit"
						v-model="customAmount"
						placeholder="请输入支付金额"
						:clearable="false"
						:styles="inputStyles"
						:inputBorder="false"
					></uni-easyinput>
				</view>

				<view class="amount-display">
					<text class="amount-label">确认金额:</text>
					<text class="amount-value">¥ {{ formattedAmount }}</text>
				</view>

				<view class="tips-container">
					<text class="tips">
						请与管理员确认需要支付的金额后再进行支付。
					</text>
				</view>
			</view>
		</view>

		<!-- 底部按钮区域 -->
		<view class="footer">
			<view class="button-container">
				<!-- 点击按钮直接调用我们修改后的支付函数 -->
				<view class="submit-button" @click="initiatePayment">确认支付</view>
			</view>
		</view>
		
		<!-- 
		  【重要改动】
		  我们不再需要在这里直接使用 uni-pay 组件，
		  因为支付流程已经统一到 /pages/pay/pay 页面处理。
		-->
		<!-- <uni-pay ref="payRef" ... ></uni-pay> -->
		
	</view>
</template>

<script setup lang="ts">
	import { ref, computed, onMounted } from 'vue';
	
	// 获取当前用户信息，用于获取用户ID
	const res = uniCloud.getCurrentUserInfo('uni_id_token');
	const userId = res.uid;

	// 导入后端云对象
	const orderHandler = uniCloud.importObject('orderHandler');

	// 用户输入的金额
	const customAmount = ref('');

	// 计算格式化后的金额
	const formattedAmount = computed(() => {
		const amount = parseFloat(customAmount.value);
		if (isNaN(amount) || amount <= 0) {
			return '0.00';
		}
		return amount.toFixed(2);
	});

	// uni-easyinput 的样式配置
	const inputStyles = {
		color: '#333',
		borderColor: '#fff',
		backgroundColor: 'rgba(255, 255, 255, 0.5)',
		borderRadius: '8px',
		paddingLeft: '10px',
		paddingRight: '10px',
		height: '40px'
	};

	// 【重要改动】删除了所有 uni-pay 相关的 ref 和事件回调函数
	// (payRef, onPayMounted, onPaySuccess, onPayFail, onPayCancel)

	// 发起支付的函数（已重构）
	const initiatePayment = async () => {
		const amount = parseFloat(customAmount.value);

		// 1. 验证金额
		if (isNaN(amount) || amount <= 0) {
			uni.showToast({
				title: '请输入有效的支付金额',
				icon: 'none'
			});
			return;
		}

		// 将金额转换为分
		const amountFen = Math.round(amount * 100);

		// 2. 调用后端创建补票订单
		uni.showLoading({
			title: '正在创建订单...'
		});

		try {
			// 调用云函数创建自定义支付订单
			const orderResult = await orderHandler.createSettleOrder(userId, amountFen);

			if (orderResult.errCode !== 0 || !orderResult.id) {
				uni.hideLoading();
				uni.showToast({
					title: '创建订单失败: ' + (orderResult.errMsg || '未知错误'),
					icon: 'none'
				});
				return;
			}

			const orderId = orderResult.id;
			console.log("补票订单创建成功，订单ID:", orderId);

			// 3. 【核心改动】准备参数并跳转到统一支付页
			const options = {
				total_fee: amountFen,       // 支付金额，单位分
				type: "settle",             // 支付回调类型，与后端 uni-pay-co/notify/settle.js 对应
				order_no: orderId,          // 后端返回的订单号
				description: "补票/自定义支付", // 支付描述
			};

			// 将支付参数对象转换为字符串并编码
			const optionsStr = encodeURI(JSON.stringify(options));
			
			uni.hideLoading();

			// 跳转到统一的支付页面，并携带参数
			uni.navigateTo({
				url: `/pages/pay/pay?options=${optionsStr}`
			});

		} catch (e) {
			uni.hideLoading();
			console.error("发起支付异常:", e);
			uni.showToast({
				title: '操作失败，请稍后重试',
				icon: 'none'
			});
		}
	};

	onMounted(() => {
		if (!userId) {
			uni.showToast({
				title: "用户未登录",
				icon: 'error'
			});
			setTimeout(() => {
				uni.navigateBack();
			}, 1500);
		}
	});

</script>
<style scoped>
	/* 复制 using.vue 的基础样式 */
	.container {
		padding: 30rpx;
		background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
		min-height: 100vh;
		box-sizing: border-box;
		padding-bottom: 200rpx;
		/* 为底部按钮留出空间 */
	}

	.glass-card {
		background: rgba(255, 255, 255, 0.7);
		backdrop-filter: blur(10px);
		border-radius: 30rpx;
		box-shadow: 0 8rpx 32rpx rgba(31, 38, 135, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.18);
		overflow: hidden;
		margin-bottom: 30rpx;
		transition: transform 0.3s ease, box-shadow 0.3s ease;
		padding: 16rpx;
	}

	.glass-card:active {
		transform: translateY(2rpx);
		box-shadow: 0 4rpx 16rpx rgba(31, 38, 135, 0.08);
	}

	.settle-card .card-content {
		padding: 30rpx;
	}

	.settle-card .card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 30rpx;
	}

	.settle-card .card-title {
		font-size: 32rpx;
		font-weight: bold;
		color: #333;
	}

	.input-group {
		margin-bottom: 30rpx;
	}

	.input-label {
		font-size: 28rpx;
		color: #555;
		margin-bottom: 10rpx;
		display: block;
	}

	/* uni-easyinput 内部样式调整 */
	/* 注意：直接修改组件内部样式可能需要深度选择器或通过组件props */
	/* 这里通过props inputStyles 已经设置了部分样式 */


	.amount-display {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: 20rpx;
		padding-top: 20rpx;
		border-top: 1px dashed rgba(0, 0, 0, 0.1); /* 虚线分隔 */
	}

	.amount-label {
		font-size: 28rpx;
		color: #555;
	}

	.amount-value {
		font-size: 48rpx;
		font-weight: bold;
		color: #f59e0b; /* 橙色 */
	}

	.tips-container {
		margin-top: 30rpx;
		padding: 15rpx;
		background: rgba(253, 242, 225, 0.7); /* 浅橙色背景 */
		border-radius: 10rpx;
		border: 1px solid rgba(249, 203, 20, 0.5);
	}

	.tips {
		font-size: 24rpx;
		color: #f59e0b; /* 橙色文字 */
		line-height: 1.4;
	}


	/* 底部按钮区域 */
	.footer {
		position: fixed;
		bottom: 0;
		left: 0;
		width: 100%;
		background: rgba(255, 255, 255, 0.8);
		backdrop-filter: blur(10px);
		padding: 20rpx 0;
		border-top: 1px solid rgba(229, 231, 235, 0.8);
		box-shadow: 0 -4rpx 12rpx rgba(0, 0, 0, 0.05);
		z-index: 100;
	}

	.button-container {
		padding: 0 30rpx;
	}

	.submit-button {
		background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
		border-radius: 16rpx;
		height: 90rpx;
		display: flex;
		justify-content: center;
		align-items: center;
		font-weight: bold;
		color: white;
		font-size: 30rpx;
		box-shadow: 0 4rpx 12rpx rgba(249, 203, 20, 0.3);
		transition: all 0.3s;
	}

	.submit-button:active {
		transform: scale(0.98);
		box-shadow: 0 2rpx 6rpx rgba(249, 203, 20, 0.3);
	}

	/* 暗黑模式样式 */
	@media (prefers-color-scheme: dark) {
		.container {
			background: rgb(0, 0, 0);
		}

		.glass-card {
			background: rgb(22, 22, 24);
			border: 1px solid rgba(255, 255, 255, 0.1);
		}

		.settle-card .card-title {
			color: white;
		}

		.input-label {
			color: lightgray;
		}

		/* uni-easyinput 暗黑模式样式 */
		.input-group >>> .uni-easyinput__content {
			background-color: rgb(59, 59, 61) !important; /* 使用深度选择器或props */
			color: white !important;
			border: 1px solid rgba(255, 255, 255, 0.1) !important;
		}
		.input-group >>> .uni-easyinput__content input {
			color: white !important; /* 确保输入文字颜色正确 */
		}
		.input-group >>> .uni-easyinput__content .uni-easyinput__placeholder-class {
			color: darkgray !important; /* 确保placeholder颜色正确 */
		}


		.amount-label {
			color: lightgray;
		}

		.amount-value {
			color: #ffb347; /* 暗黑模式下稍亮的橙色 */
		}

		.tips-container {
			background: rgb(59, 59, 61); /* 暗黑模式下使用深色背景 */
			border: 1px solid rgba(249, 203, 20, 0.3);
		}

		.tips {
			color: #ffb347; /* 暗黑模式下稍亮的橙色文字 */
		}

		.footer {
			background: rgb(22, 22, 24);
			border-top: 1px solid rgb(51, 49, 50);
		}
	}
</style>
