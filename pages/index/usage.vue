<template>
	<view>
		<uni-card :is-shadow="false">
			<view>
				<uni-row>
					<uni-col :span="4">
						<view class="icon">
							<uni-icons type="headphones" size="30"></uni-icons>
						</view>
					</uni-col>
					<uni-col :span="16" >
						<view style="display: flex;
					 flex-direction: column; padding-left: 20rpx;">
							<text style="font-weight: bold;font-size: 35rpx;">机台1号 - IIDX</text>
							<text>30元/小时</text>
						</view>						
					</uni-col>
					<uni-col :span="4" >
						<view style="display: flex; justify-content: center; padding-top: 20rpx;">
							<uni-icons type="heart" size="30"></uni-icons>
						</view>
					</uni-col>
				</uni-row>
			</view>
			<view style="padding-top: 40rpx;">
				<text style="font-weight: bold; font-size: 40rpx;">这里是神秘条形图</text>
			</view>
			<view style="display: flex; justify-content:space-around; padding-top: 40rpx;">
				<view class="bt" style="background-color: rgb(242, 243, 245);">
					<uni-icons type="staff" size="30"></uni-icons>
					<text>查看预约</text>
				</view>
				<view class="bt" style="background-color: rgb(249, 203, 20);">
					<uni-icons type="personadd" size="30"></uni-icons>
					<text @click="goOrder()">预约</text>
				</view>
			</view>
		</uni-card>
	</view>
</template>

<script setup lang="ts">
	function goOrder(){
		console.log("test")
		uni.navigateTo({
			url: '/pages/order/order'
		});
	}
</script>

<style>
	.bt{
		padding-top: 20rpx;
		display: flex;
		justify-content: center;
		align-self: center;
		background-color: gray;
		border-radius: 20rpx;
		height: 70rpx;
		width: 270rpx;
	}
	.icon{
		padding-top: 20rpx;
		display: flex;
		justify-content: center;
		align-items: center;
		background-color: gray;
		height: 80rpx;
		border-radius: 30rpx;
	}
</style>