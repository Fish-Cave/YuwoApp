<template>
	<!-- 自定义收银台页面模式 -->
	<view class="container">
		<view class="" v-if="insideData && insideData.currentProviders">
			<view class="price-card">
				<view class="price-header">
					<text class="title">本次消费</text>
					<view class="divider"></view>
				</view>
				<view class="price-summary">
					<view>
						<text class="price-amount">{{ (options.total_fee / 100).toFixed(2) }}¥</text>
					</view>
				</view>
				<view class="order-info">
					<view class="info-row">
						<view class="info-label">订单号</view>
						<view class="info-value">{{options.order_no}}</view>
					</view>
					<view class="info-row">
						<view class="info-label">本次消费类型</view>
						<view class="info-value">
							<text v-if="options.type == 'goods'">签到结算</text>
							<text v-else>会员充值</text>
						</view>
					</view>
				</view>
			</view>
			<uni-section title="选择支付方式" type="line"></uni-section>
			<uni-list v-if="insideData && insideData.currentProviders">
				<!-- #ifdef MP-WEIXIN || H5 || APP -->
				<uni-list-item v-if="insideData.currentProviders.indexOf('wxpay') > -1" :thumb="insideData.images.wxpay"
					title="微信支付" clickable link></uni-list-item>
				<!-- #endif -->
				<!-- #ifdef MP-ALIPAY || H5 || APP -->
				<uni-list-item v-if="insideData.currentProviders.indexOf('alipay') > -1"
					:thumb="insideData.images.alipay" title="支付宝" @click="createOrder({ provider: 'alipay' })" clickable
					link></uni-list-item>
				<!-- #endif -->
			</uni-list>
			<view class="footer">
				<view class="submit-button" @click="createOrder({ provider: 'wxpay' })">
					<text>确认购买</text>
				</view>
			</view>
			<view class="tips-container">
				<text class="tips">
					支付方式选择暂时没有效果:P
				</text>
			</view>
		</view>
		<!-- 挂载支付组件 -->
		<uni-pay ref="uniPay" :to-success-page="false" @mounted="onMounted" @success="onSuccess"></uni-pay>
	</view>

</template>

<script>
	const todo = uniCloud.importObject('todo')
	export default {
		data() {
			return {
				options: {
					total_fee: "",
				},
				insideData: {}, // uni-pay组件mounted事件获得的数据
				adpid: "", // 广告id
				return_url: "", // 支付成功后点击查看订单跳转的订单详情页面地址
				main_color: "", // 支付成功页面的主色调
			}
		},
		// 监听 - 页面每次【加载时】执行(如：前进)
		onLoad(options = {}) {
			options = JSON.parse(decodeURI(options.options));
			//console.log('options: ', options)
			this.options = options;
		},
		// 监听 - 页面【首次渲染完成时】执行。注意如果渲染速度快，会在页面进入动画完成前触发
		onReady() {},
		// 监听 - 页面每次【显示时】执行(如：前进和返回) (页面每次出现在屏幕上都触发，包括从下级页面点返回露出当前页面)
		onShow() {},
		// 监听 - 页面每次【隐藏时】执行(如：返回)
		onHide() {},
		// 函数
		methods: {
			// 监听 - 支付组件加载完毕事件
			onMounted(insideData) {
				this.insideData = insideData;
			},
			// 发起支付
			createOrder(provider) {
				Object.assign(this.options, provider);
				this.$refs.uniPay.createOrder(this.options);
			},
			// 监听事件 - 支付成功
			onSuccess(res) {
				console.log('success: ', res);
				if (res.user_order_success) {
					// 代表用户已付款，且你自己写的回调成功并正确执行了
					console.log("正确执行")
					uni.redirectTo({
						url: `/uni_modules/uni-pay/pages/success/success?out_trade_no=${res.out_trade_no}&order_no=${res.pay_order.order_no}&pay_date=${res.pay_order.pay_date}&total_fee=${res.pay_order.total_fee}&adpid=${this.adpid}&return_url=${this.return_url}&main_color=${this.main_color}`
					});
				} else {
					// 代表用户已付款，但你自己写的回调没有执行成功（通常是因为你的回调代码有问题）
					console.log("回调代码有问题")
					uni.redirectTo({
						url: `/uni_modules/uni-pay/pages/success/success?out_trade_no=${res.out_trade_no}&order_no=${res.pay_order.order_no}&pay_date=${res.pay_order.pay_date}&total_fee=${res.pay_order.total_fee}&adpid=${this.adpid}&return_url=${this.return_url}&main_color=${this.main_color}`
					});

				}
			},
		},
		// 监听器
		watch: {

		},
		// 计算属性
		computed: {

		}
	}
</script>
<style scoped>
	.container {
		padding: 20px;
		background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
		min-height: 100vh;
		position: relative;
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

	.glass-card:active {
		transform: translateY(2px);
		box-shadow: 0 4px 16px rgba(31, 38, 135, 0.08);
	}

	/* 底部区域 */
	.footer {
		position: fixed;
		bottom: 0;
		left: 0;
		width: 100%;
		background: rgba(255, 255, 255, 0.8);
		backdrop-filter: blur(10px);
		padding: 10px 0;
		border-top: 1px solid rgba(229, 231, 235, 0.8);
		box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.05);
		z-index: 100;
	}

	.price-card {
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

	.price-header {
		width: 100%;
	}

	.price-summary {
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		align-items: center;
		padding: 0 20px;
		margin-bottom: 12px;
	}

	.price-amount {
		font-weight: bold;
		font-size: 140rpx;
		background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
	}

	.submit-button {
		background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
		border-radius: 8px;
		width: 80%;
		height: 50px !important;
		min-height: 45px;
		line-height: 45px;
		display: flex;
		justify-content: center;
		align-items: center;
		margin: 0 auto;
		font-weight: bold;
		color: white;
		font-size: 15px;
		box-shadow: 0 4px 12px rgba(249, 203, 20, 0.3);
		transition: all 0.3s;
		position: relative;
		overflow: hidden;
		box-sizing: border-box;
		padding: 0;
	}

	.submit-button:active {
		transform: scale(0.98);
		box-shadow: 0 2px 6px rgba(249, 203, 20, 0.3);
	}

	.submit-button::after {
		content: "";
		position: absolute;
		top: 0;
		left: -100%;
		width: 100%;
		height: 100%;
		background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
		transition: 0.5s;
	}

	.submit-button:active::after {
		left: 100%;
	}

	.divider {
		height: 2rpx;
		background-color: lightgray;
		margin: 20rpx 0;
	}
	
	/*说明区域*/
	.tips-container {
		padding: 0 20rpx;
		margin: 20rpx 0;
	}
	
	.tips {
		font-size: 20rpx;
		color: gray;
	}

	/* 订单信息样式 */
	.order-info {
		margin-top: 20rpx;
	}

	.info-row {
		display: flex;
		justify-content: space-between;
		margin-bottom: 15rpx;
	}

	.info-label {
		font-size: 24rpx;
		opacity: 0.9;
	}

	.info-value {
		font-size: 28rpx;
		font-weight: 500;
	}
	
	.title {
		font-size : 40rpx;
		font-weight: bold;
	}
</style>