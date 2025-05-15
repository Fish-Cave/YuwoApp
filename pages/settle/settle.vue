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
				<view class="submit-button" @click="initiatePayment">确认支付</view>
				<!-- uni-pay 组件用于发起支付 -->
				<!-- 添加 ref="payRef" 并监听支付结果事件 -->
				<uni-pay
					ref="payRef"
					@mounted="onPayMounted"
					@success="onPaySuccess"
					@fail="onPayFail"
					@cancel="onPayCancel"
					:to-success-page="false"
				></uni-pay>
			</view>
		</view>
	</view>
</template>

<script setup lang="ts">
	import { ref, computed, onMounted } from 'vue'; // 导入 onMounted
	import uniPay from '@/uni_modules/uni-pay/components/uni-pay/uni-pay.vue'; // 确保路径正确
	import { useProfileStore } from '../../stores/userProfileStore'; // 如果需要用户信息
	const userProfile = useProfileStore(); // 如果需要用户信息

	// 获取当前用户信息，用于获取用户ID
	const res = uniCloud.getCurrentUserInfo('uni_id_token');
	const userId = res.uid;

	// 导入后端云对象
	const orderHandler = uniCloud.importObject('orderHandler'); // 假设处理订单的云对象叫 orderHandler

	// 用户输入的金额 (字符串，可能带小数)
	const customAmount = ref('');

	// 计算格式化后的金额 (保留两位小数)
	const formattedAmount = computed(() => {
		const amount = parseFloat(customAmount.value);
		if (isNaN(amount) || amount <= 0) {
			return '0.00';
		}
		return amount.toFixed(2);
	});

	// uni-easyinput 的样式配置
	const inputStyles = {
		color: '#333', // 默认颜色
		borderColor: '#fff', // 边框颜色 (这里设置为白色，因为背景是半透明白色)
		backgroundColor: 'rgba(255, 255, 255, 0.5)', // 输入框背景半透明
		borderRadius: '8px',
		paddingLeft: '10px',
		paddingRight: '10px',
		height: '40px'
	};

	// uni-pay 组件的引用
	const payRef = ref(null);

	// uni-pay 组件 mounted 事件回调
	const onPayMounted = (insideData) => {
		console.log('uni-pay 组件已挂载并准备就绪:', insideData);
		// insideData 包含支付提供商等信息，如果需要可以在这里处理
	};

	// uni-pay 支付成功事件回调
	const onPaySuccess = (res) => {
		console.log('uni-pay 支付成功:', res);
		uni.hideLoading(); // 隐藏创建订单时的 loading

		if (res.user_order_success) {
			// 代表用户已付款，且你自己写的回调成功并正确执行了
			console.log("支付成功且回调执行成功");
			uni.showToast({
				title: '支付成功',
				icon: 'success',
				duration: 2000
			});

			// 支付成功后跳转到 uni-pay 提供的成功页面，或者您自己的页面
			// 这里参考 pay.vue 的跳转方式
			uni.redirectTo({
				url: `/uni_modules/uni-pay/pages/success/success?out_trade_no=${res.out_trade_no}&order_no=${res.pay_order.order_no}&pay_date=${res.pay_order.pay_date}&total_fee=${res.pay_order.total_fee}`
				// 如果 pay.vue 的成功页面需要更多参数，可以在这里添加
				// 例如: &adpid=${this.adpid}&return_url=${this.return_url}&main_color=${this.main_color}
			});

		} else {
			// 代表用户已付款，但你自己写的回调没有执行成功（通常是因为你的回调代码有问题）
			console.error("支付成功但回调执行失败");
			uni.showToast({
				title: '支付成功，但处理失败，请联系管理员',
				icon: 'error',
				duration: 3000
			});
			// 可以在这里选择跳转到错误页面或留在当前页
		}
	};

	// uni-pay 支付失败事件回调
	const onPayFail = (err) => {
		console.error('uni-pay 支付失败:', err);
		uni.hideLoading();
		uni.showToast({
			title: '支付失败: ' + (err.errMsg || err.message || '未知错误'),
			icon: 'none',
			duration: 3000
		});
	};

	// uni-pay 支付取消事件回调
	const onPayCancel = (res) => {
		console.log('uni-pay 支付取消:', res);
		uni.hideLoading();
		uni.showToast({
			title: '支付已取消',
			icon: 'none',
			duration: 2000
		});
	};


	// 发起支付
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
			title: '创建订单中...'
		});

		try {
			// 假设后端有一个 createSettleOrder 函数来创建这种自定义支付订单
			// 它应该返回一个包含订单ID的对象，例如 { errCode: 0, id: '...' }
			const orderResult = await orderHandler.createSettleOrder(userId, amountFen);

			// uni.hideLoading(); // 暂时不隐藏，等支付组件准备好再隐藏

			if (orderResult.errCode !== 0) {
				uni.hideLoading(); // 创建订单失败，隐藏 loading
				uni.showToast({
					title: '创建订单失败: ' + (orderResult.errMsg || '未知错误'),
					icon: 'none'
				});
				return;
			}

			const orderId = orderResult.id;
			console.log("补票订单创建成功，订单ID:", orderId);

			// 3. 准备支付参数
			const payOptions = {
				total_fee: amountFen, // 支付金额，单位分
				type: "settle", // 支付回调类型，对应 uni-pay-co/notify/settle.js
				order_no: orderId, // 后端创建的订单号
				description: "补票支付", // 支付描述
				provider: 'weixin', // 可以指定支付方式，不指定则弹出选择框
				return_url: '/pages/pay/paysuccess', // 支付成功后跳转的页面，如果 to-success-page 为 false，这里可以忽略
				// 其他 uni-pay 需要的参数...
			};

			// 4. 调用 uni-pay 发起支付
			console.log("发起支付，参数:", payOptions);

			// **重要：在调用 createOrder() 之前，检查 payRef.value 是否存在且有 createOrder 方法**
			if (payRef.value && typeof payRef.value.createOrder === 'function') {
				uni.hideLoading(); // 隐藏创建订单时的 loading，准备打开支付界面
				payRef.value.createOrder(payOptions); // 调用 createOrder 方法
			} else {
				uni.hideLoading(); // 隐藏创建订单时的 loading
				console.error("支付组件未准备好或引用错误", payRef.value);
				uni.showToast({
					title: '支付组件加载失败，请稍后再试',
					icon: 'none'
				});
			}

			// uni-pay 组件会处理后续的支付流程和回调

		} catch (e) {
			uni.hideLoading();
			console.error("发起支付异常:", e);
			uni.showToast({
				title: '发起支付异常: ' + (e.errMsg || e.message || '网络错误'),
				icon: 'none'
			});
		}
	};

	// 可以添加 onMounted 等生命周期钩子，如果需要初始化数据或检查权限
	onMounted(() => {
		// 可以在这里再次检查权限，虽然首页已经检查过
		if (!userId) {
			uni.showToast({
				title: "用户未登录或无法获取ID",
				icon: 'error'
			});
			setTimeout(() => {
				uni.navigateBack(); // 没有用户ID则返回
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
