<template>
	<view style="display: flex; flex-direction: column;">
		<!--这一堆是最顶上那个个人信息，要调一下字体和间距应该-->
		<uni-group mode="card">
			<uni-row style="margin-top: 20rpx;">
				<!--这一堆是头像，我觉得头像我已经调好了-->
				<uni-col :span="7">
					<view class="avatar">
						<!--我看了一下他这个src是支持绝对位置、相对位置、base64-->
						<image :src=userProfile.avatar mode="aspectFill"></image>
					</view>
				</uni-col>
				<uni-col :span="16" style="display: flex; flex-direction: column;">
					<text>{{userProfile.userName}}</text>
					<text>UID:{{userProfile.userID}}</text>
					<text>剩余时长:{{userProfile.time}}</text>
				</uni-col>
			</uni-row>
		</uni-group>

		<!--这一堆是现在预约的订单信息，我还没想好怎么弄，可以先不用管-->
		<uni-group mode="card" style="background-color: orange;">
			<uni-row>
				<uni-col :span="20" style="display: flex; flex-direction: column;">
					<text>{{orderDate.machine}}</text>
					<text>预约时间:{{orderDate.orderTime}}</text>
					<text>订单号:{{orderDate.orderId}}</text>
				</uni-col>
				<!--签到“按钮”的样式要调一下，按这个按钮可以跳转start页-->
				<uni-col :span="4">
					<navigator url="/pages/start/start">签到</navigator>
				</uni-col>
			</uni-row>
		</uni-group>

		<!--使用说明，调下字体和间距-->
		<uni-card title="使用说明">
			<view v-for="(text,value) in textData" :key="value">
				<view style="display: flex; margin-top: 20rpx;">
					<view class="array"><text>{{value + 1}}</text></view>
					<text>{{text}}</text>
				</view>
			</view>
		</uni-card>
	</view>
</template>

<script setup lang="ts">
	import { reactive, ref } from 'vue'
	//我把测试用的用户信息用pinia存上了，详情看那个ts文件
	import { useProfileStroe } from '@/stores/userProfileStore'
	const userProfile = useProfileStroe()
	const textData = [
		"请在预约时间前15分钟内完成签到",
		"超时未签到将自动取消预约",
		"游玩结束后请关闭机台",
	]
	const orderDate = reactive({
		machine: "",
		orderTime: "",
		orderId: "",
	})

	//测试用，给上面那个对象赋值
	function init() {
		orderDate.machine = "SDVX"
		orderDate.orderTime = "0:00 - 24:00"
		orderDate.orderId = "12345543211234567"
	}
	init()
</script>

<style>
	.avatar {
		width: 160rpx;
		/* 宽度与高度需相同 */
		height: 160rpx;
		/* 高度与宽度需相同 */
		border-radius: 50%;
		/* 关键属性 */
		overflow: hidden;
		/* 确保内容被裁剪为圆形 */
	}

	image {
		width: 160rpx;
		/* 宽度与高度需相同 */
		height: 160rpx;
		/* 高度与宽度需相同 */
	}
	.array{
		border-radius: 50%;
		width: 50rpx;
		height: 50rpx;
		background-color: rgb(254, 236, 212);
		display: flex;
		justify-content: center;
		align-items: center;
	}
</style>