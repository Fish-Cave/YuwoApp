<template>
	<view>
		<!--这一块是显示当前预约的机台信息的卡片，信息应该是从signIn页面传进来的，我还没弄-->
		<uni-card style="background-color: rgb(254, 155, 0);
		border-radius: 35rpx;">
			<template v-slot:title>
				<view style="display: flex;
				 justify-content: space-between;
				  margin-top: 40rpx;">
					<view style="display: flex; flex-direction: column;">
						<text>TEST</text>
						<text>test</text>
					</view>
					<view>
						<view>待使用</view>
					</view>
				</view>
				<view class="divider"></view>
			</template>
			<view style="display: flex; flex-direction: column;">
				<view style="display: flex; justify-content: space-between;"> 
					<text>预约时段</text>
					<text></text>
				</view>
				<view style="display: flex; justify-content: space-between;">
					<text>订单号</text>
					<text></text>
				</view>
			</view>
		</uni-card>
		
		<!--计费说明，可能调一下字体就好了-->
		<uni-card style="border-radius: 35rpx;">
			<view class="content">
				<view style="display: flex;">
					<uni-icons type="info" size="30"></uni-icons>
					<text class="title">计费说明</text>
				</view>
				<view v-for="(list,index) in listData" :key="index" style="margin-top: 20rpx;">
					<text>{{index + 1}}、</text>
					<text>{{list}}</text>
				</view>
			</view>
		</uni-card>
		
		<!--支付授权这边我觉得没问题，可能字体要调一下-->
		<uni-card style="border-radius: 35rpx;">
			<uni-row>
				<uni-col :span="4">
					<view style="margin-top: 20rpx;">
						<uni-icons type="wallet" size="30"></uni-icons>
					</view>
				</uni-col>
				<uni-col :span="20">
					<uni-title type="h3" title="微信支付授权"></uni-title>
					<text>开始使用前需要获取微信支付授权，结束后将自动完成扣款。</text>
				</uni-col>
			</uni-row>
		</uni-card>
		
		<!--按钮看着调吧-->
		<button class="bt">确认开始使用</button>
	</view>
</template>

<script setup lang="ts">
	import { reactive } from 'vue';
	//这个数组是计费说明显示的内容
	const listData = reactive([
		"按分钟计费，10元/小时",
		"最低计费时长为15分钟",
		"使用结束后将通过微信自动扣款",
		"使用过程中可随时结束",
	])
</script>

<style>
	.bt {
		margin: 30rpx 30rpx;
		background-color: rgb(249, 203, 20);
		border-radius: 20rpx;
		height: 120rpx;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.content {
		display: flex;
		flex-direction: column;
	}

	.title {
		margin-left: 20rpx;
		font-size: 35rpx;
		font-weight: bold;
	}
	.divider {
		height: 2rpx;
		background-color: rgb(242, 242, 242);
		margin-top: 15rpx;
		margin-bottom: 15rpx;
	}
</style>