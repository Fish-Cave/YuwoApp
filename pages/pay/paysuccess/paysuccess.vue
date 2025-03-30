<template>
	<view class="app" :style="styleCom">
		<view class="header">
			<image :src="images.success" class="success-image"></image>
			<view class="success-title">支付成功</view>
			<view class="hr"></view>
		</view>
		<view class="info-box">
			<view class="info-amount" v-if="options.total_fee">¥ {{ (options.total_fee / 100).toFixed(2) }}</view>
			<view class="info-amount" v-else>¥ 0</view>
			<view class="left-circle"></view>
			<view class="right-circle"></view>
			<view class="info-main">
				<view class="info-cell">
					<view class="left">订单编号</view>
					<view class="right">{{ options.order_no || "-" }}</view>
				</view>
				<view class="info-cell" v-if="options.pay_date">
					<view class="left">付款时间</view>
					<view class="right">{{ timeFormat(options.pay_date,'yyyy-MM-dd hh:mm:ss') }}</view>
				</view>
			</view>
		</view>
		<!-- 广告位开始 -->
		<view class="uni-ad">
			<!-- 红包广告-->
			<ad-interactive v-if="options.adpid" :adpid="options.adpid" v-slot:default="{data, loading, error}"
				open-page-path="/uni_modules/uni-pay/pages/ad-interactive-webview/ad-interactive-webview"
				@error="onaderror">
				<view v-if="data" class="ad-interactive">
					<!-- 可以自定义此图片，组件提供了默认素材，通过 uni-ad 后台配置 -->
					<image :src="data.imgUrl" mode="widthFix"></image>
				</view>
			</ad-interactive>
			<!-- #ifndef MP-WEIXIN -->
			<!-- 注意：h5下的广告出来有延迟，后续要优化 -->
			<!-- <ad v-if="options.adpid" :adpid="options.adpid" type="banner" @error="onaderror"></ad> -->
			<!-- #endif -->
		</view>
		<!-- 广告位结束 -->
		<view v-if="options.return_url" class="button-query" @click="queryOrder">查看订单</view>
		<view class="footer-hr"></view>
	</view>
</template>

<script>
</script>
<style lang="scss" scoped>
	.app {
		--bgcolor: #f3f3f3;

		background-color: var(--bgcolor);
		min-height: calc(100vh - var(--window-bottom) - var(--window-top));
	}

	.header {
		background-color: var(--main);
		text-align: center;
		color: #ffffff;
		padding: 80rpx 30rpx 50rpx 30rpx;

		.success-image {
			width: 120rpx;
			height: 120rpx;
		}

		.success-title {
			font-size: 34rpx;
			margin-top: 40rpx;
			font-weight: bold;
		}

		.hr {
			margin-top: 40rpx;
			width: 100%;
			height: 30rpx;
			border-radius: 20rpx;
			opacity: 0.1;
			background-color: #000000;
		}
	}

	.info-box {
		width: calc(100% - 100rpx);
		margin: 0 50rpx;
		position: relative;
		margin-top: -64rpx;
		background-color: #ffffff;

		.info-amount {
			height: 150rpx;
			line-height: 150rpx;
			text-align: center;
			color: var(--main);
			font-weight: bold;
			font-size: 60rpx;
			border-bottom: 4rpx dashed #f3f3f3;
		}

		.left-circle {
			background-color: var(--bgcolor);
			position: absolute;
			width: 40rpx;
			height: 40rpx;
			border-radius: 50%;
			top: calc(150rpx - 20rpx);
			left: -20rpx;
		}

		.right-circle {
			background-color: var(--bgcolor);
			position: absolute;
			width: 40rpx;
			height: 40rpx;
			border-radius: 50%;
			top: calc(150rpx - 20rpx);
			right: -20rpx;
		}

		.info-main {
			padding: 30rpx;
			font-size: 26rpx;
			color: #333333;

			.info-cell {
				/* #ifndef APP-NVUE */
				display: flex;
				/* #endif */
				line-height: 50rpx;

				.left {
					width: 200rpx;
					text-align: left;
				}

				.right {
					flex: 1;
					text-align: right;
				}
			}
		}
	}

	.uni-ad {
		margin-top: 50rpx;
		min-height: 100rpx;

		.ad-interactive {
			text-align: center;
		}
	}

	.button-query {
		background-color: var(--main);
		color: #ffffff;
		width: calc(100% - 120rpx);
		margin: 50rpx 60rpx 0 60rpx;
		padding: 20rpx 30rpx;
		border-radius: 50rpx;
		text-align: center;
		box-sizing: border-box;
	}

	.button-query:active {
		opacity: 0.7;
	}

	.footer-hr {
		height: 100rpx;
		display: block;
	}
</style>