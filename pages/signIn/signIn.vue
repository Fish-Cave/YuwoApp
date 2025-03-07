<template>
	<view style="display: flex; flex-direction: column;">
		<uni-group mode="card">
			<uni-row>
				<uni-col :span="6">
					<image style="height: 100rpx;" src=""></image>
					<text>这里应该是头像</text>
				</uni-col>
				<uni-col :span="18" style="display: flex; flex-direction: column;">
					<text>{{userProfile.userName}}</text>	
					<text>UID:{{userProfile.userID}}</text>
					<text>剩余时长:{{userProfile.time}}</text>
				</uni-col>
			</uni-row>
		</uni-group>
		
		<uni-group mode="card" style="background-color: orange;">
			<uni-row>
				<uni-col :span="20" style="display: flex; flex-direction: column;">
					<text>{{orderDate.machine}}</text>
					<text>预约时间:{{orderDate.orderTime}}</text>
					<text>订单号:{{orderDate.orderId}}</text>
				</uni-col>
				<uni-col :span="4">
					<button>123</button>
				</uni-col>
			</uni-row>
		</uni-group>
				
		<uni-card title="使用说明">
			<uni-row>
				<uni-col>
					<text>{{textData[0]}}</text>
				</uni-col>
				
				<uni-col>
					<text>{{textData[1]}}</text>
				</uni-col>
				
				<uni-col>
					<text>{{textData[2]}}</text>
				</uni-col>
			</uni-row>			
		</uni-card>
	</view>
</template>

<script setup lang="ts">
	import { reactive, ref } from 'vue'
	import { useProfileStroe }from '@/stores/userProfileStore'
	const userProfile = useProfileStroe()
	const textData = [
		"请在预约时间前15分钟内完成签到",
		"超时未签到将自动取消预约",
		"游玩结束后请关闭机台",
	]
	const orderDate = reactive({
		machine:"",
		orderTime:"",
		orderId:"",
	})
	
	//测试用，给上面两个对象赋值
	function init(){
		orderDate.machine = "SDVX"
		orderDate.orderTime = "0:00 - 24:00"
		orderDate.orderId = "12345543211234567"
		
		userProfile.userName ="谁是鸽子？我是鸽子!"
		userProfile.userID = "65535"
		userProfile.time = "很久很久很久"
		userProfile.avatar = "https://img1.baidu.com/it/u=3733029175,1993162435&fm=253&fmt=auto&app=138&f=JPEG?w=813&h=800"
	}
	init()
</script>

<style>

</style>
