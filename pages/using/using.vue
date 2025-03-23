<template>
	<view v-for="data in Data" :key="data._id">
		<!--这一块是显示当前预约的机台信息的卡片，信息应该是从signIn页面传进来的，我还没弄-->
		<uni-card style="background-color: rgb(254, 155, 0);
		border-radius: 30rpx;">
			<view style="display: flex; flex-direction: column;">
				<text>这边显示一个计时器</text>
				<text>预约订单号</text><br/>
				<text>{{data.reservationid}}</text><br/>
				<text>签到订单号</text><br/>
				<text>{{data._id}}</text><br/>
			</view>
		</uni-card>

		<!--实时费用-->
		<uni-card style="border-radius: 30rpx;">
			<view class="content">
				<view style="display: flex; justify-content: space-between;">
					<text class="title">实时费用</text>
					<text>{{singlePrice}}元半小时</text>
				</view>
				<view>
					<text>totalePrice</text>
				</view>
			</view>
		</uni-card>

		<!--使用记录-->
		<uni-card style="border-radius: 30rpx;">
			<view class="content">
				<view style="display: flex;">
					<text class="title">使用记录</text>
				</view>
				<view v-if="data.starttime != 0" style="display: flex;justify-content: space-between;">
					<view>
						<uni-icons type="checkmarkempty" size="20"></uni-icons>
						<text>开始使用</text>
					</view>
					<view>
						<uni-dateformat :date="data.starttime"></uni-dateformat>
					</view>
				</view>
			</view>
		</uni-card>

		<!--按钮看着调吧-->
		<view style="display: flex;flex-direction: column;">
			<view class="bt" @click="submit()">结束使用并支付</view>
			<view class="bt" style="background-color: #E0E0E0" @click="askForHelp()">遇到问题</view>
		</view>

	</view>
</template>


<script setup lang="ts">
	import { onMounted, reactive, ref, toRaw } from 'vue'
	const todo = uniCloud.importObject('todo')
	const res = uniCloud.getCurrentUserInfo('uni_id_token')
	interface signInData {
		"_id": string
		"reservationid": string
		"isPlay": boolean
		"starttime": number 
		"endtime": number
	}
	const Data = ref<signInData[]>([])
	const singlePrice = ref(5)
	
	function submit(){
		uni.showToast({
			title : "还没写"
		})
	}
	function askForHelp(){
		uni.showToast({
			title : "还没写"
		})
	}
	
	async function searchSignin(){
		try{
			const result = await todo.SignIn_Search(res.uid)
			console.log(result.data)
			Data.value = result.data
		}catch{}
	}
	onMounted(()=>{
		searchSignin()
		console.log(Data)
	})

</script>

<style>
	.bt {
		margin: 20rpx 30rpx;
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
		background-color: gray;
		margin-top: 15rpx;
		margin-bottom: 15rpx;
	}

	.tips {
		font-size: 20rpx;
		color: gray;
	}
</style>