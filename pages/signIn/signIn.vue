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
					<text>{{}}</text>
					<text>UID:{{}}</text>
					<text>剩余时长:{{}}</text>
				</uni-col>
			</uni-row>
		</uni-group>

		<uni-card style="">
			<uni-row>
				<uni-col :span="11">
					<view class="reserving" @click="goToreservationList()">
						<uni-icons type="calendar" size="40"></uni-icons>
						<text>预约中</text>
					</view>
				</uni-col>
				<uni-col :span="2">
					<view class="vertical-divider">
					</view>
				</uni-col>
				<uni-col :span="11">
					<view class="using" @click="goTousing()">
						<uni-icons type="paperplane" size="40"></uni-icons>
						<text>使用中</text>
					</view>
				</uni-col>
			</uni-row>
		</uni-card>

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
	import { useProfileStore } from '@/stores/userProfileStore'
	const todo = uniCloud.importObject('todo')
	const res = uniCloud.getCurrentUserInfo('uni_id_token')
	console.log(res)
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
	function goToreservationList() {
		uni.navigateTo({
			url: '/pages/reservationList/reservationList'
		});
	}
	async function goTousing() {
		console.log(res.uid)
		try {
			const result = await todo.SignIn_Search(res.uid)
			if (result.data.length == 1) {
				console.log(result.data[0])
				uni.navigateTo({
					url:"/pages/using/using"
				})
			} else {
				uni.showToast({
					title: "未找到签到信息"
				})
			}
		} catch { }
	}

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

	.array {
		border-radius: 50%;
		width: 50rpx;
		height: 50rpx;
		background-color: rgb(254, 236, 212);
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.reserving {
		display: flex;
		flex-direction: column;
		justify-content: space-around;
		align-items: center;
		height: 140rpx;
	}

	.using {
		display: flex;
		flex-direction: column;
		justify-content: space-around;
		align-items: center;
		height: 140rpx;
	}

	.vertical-divider {
		width: 2rpx;
		height: 140rpx;
		/* 高度可根据需求调整 */
		background-color: #ccc;
		/* 颜色可自定义 */
		margin: 0 10px;
		/* 添加左右外边距避免贴紧其他元素 */
	}
</style>