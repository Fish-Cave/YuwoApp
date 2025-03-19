<template>
	<scroll-view>
		<view style="padding: 20rpx,20rpx;">
			<uni-row>
				<uni-col :span="4">
					<view class="icon">
						<uni-icons type="headphones" size="30"></uni-icons>
					</view>
				</uni-col>
				<uni-col :span="16">
					<view style="display: flex;
			 flex-direction: column; padding-left: 20rpx;">
						<text style="font-weight: bold;font-size: 35rpx;">{{machineName}}</text>
						<text>5元/半时</text>
					</view>
				</uni-col>
				<uni-col :span="4">
					<view style="display: flex; justify-content: center; padding-top: 20rpx;">

					</view>
				</uni-col>
			</uni-row>
		</view>

		<view class="divider" />
		<view>
			<wu-calendar :insert="true" type="week" :fold="false" startWeek="mon" color="#f9cb14"
				@change="calendarChange"></wu-calendar>
		</view>

		<view class="divider" />
		<view>
			<uni-title type="h1" title="已有预约时段"></uni-title>
			<text style="font-weight: bold;font-size: 50rpx;">这里是神秘条形图</text>
		</view>

		<view class="divider" />
		<view>
			<uni-title type="h1" title="确认预约信息"></uni-title>
			<view>
				<text>薄被，要在鱼窝过夜吗？</text>
				<uni-data-checkbox v-model="Data.isOvernight" 
				:localdata="option" 
				@change="setPrice()"></uni-data-checkbox>
			</view>

			<view v-if="Data.isOvernight">
				<view style="padding-top: 20rpx;">
					<view class="option">
						<text>开始时间</text>
						<uni-datetime-picker v-model="Data.startTime" :border="false"
							returnType="timestamp" hide-second="true"></uni-datetime-picker>
					</view>
					<uni-row class="attention">
						<uni-col :span="4">
							<uni-icons type="checkbox"
							 size="30"
							style="padding-left: 20rpx;"></uni-icons>
						</uni-col>
						<uni-col :span="14">预计时长：包夜！</uni-col>
						<uni-col :span="6">费用：¥{{price}}</uni-col>
					</uni-row>
				</view>
			</view>

			<view v-else style="display: flex;flex-direction: column;">
				<view style="display: flex; justify-content: space-between;">
					<view class="option">
						<text>开始时间</text>
						<uni-datetime-picker v-model="Data.startTime" :border="false"
							returnType="timestamp" hide-second="true"></uni-datetime-picker>
					</view>
					<view class="option">
						<text>结束时间</text>
						<uni-datetime-picker v-model="Data.endTime" :border="false"
							returnType="timestamp" hide-second="true"></uni-datetime-picker>
					</view>
				</view>
				<view style="padding-top: 20rpx;">
					<uni-row class="attention">
						<uni-col :span="4">
							<uni-icons type="checkbox" size="30" style="padding-left: 20rpx;"></uni-icons>
						</uni-col>
						<uni-col :span="14">预计时长：{{totalTime}} 小时</uni-col>
						<uni-col :span="6">费用：¥{{price}}</uni-col>
					</uni-row>
				</view>
			</view>

		</view>
	</scroll-view>
	<text>订单详情</text><br/>
	<text>{{Data}}</text>

	<view class="divider" />
	<view style="display: flex;
	flex-direction: column; 
	justify-content: center; 
	align-items: center;">

		<view class="price">
			<text>预计费用 </text>
			<text>¥{{price}}</text>
		</view>
		<view class="bt" @click="submitOrder()">
			<text>确认预约</text>
		</view>
	</view>

</template>

<script setup lang="ts">
	import dayjs from 'dayjs';
	import { ref, getCurrentInstance, onMounted, reactive } from 'vue';
	const todo = uniCloud.importObject('todo')
	const machineName = ref("")
	interface reservationData{
		"userId":String;
		"machineId":String;
		"startTime":String;
		"endTime":String;
		"isOvernight":Boolean;
		"status":String;
		"notes":String
	}
	const Data = reactive<reservationData>({
		"userId":"",
		"machineId":"",
		"startTime":"",
		"endTime":"",
		"isOvernight":false,
		"status":"pending",
		"notes":""
	})
	const option = [
		{
			"value": false,
			"text": "不要过夜",
		},
		{
			"value": true,
			"text": "对！没错！我要过夜！",
		}
	]
	const price = ref(0)
	const totalTime = ref(0)
	function setPrice() {
		if (Data.isOvernight == true) {
			price.value = 50
		} else {
			price.value = 0
		}
	}
	async function submitOrder(){
		console.log("test")
		if(Data.isOvernight){
			Data.endTime = ""
			Data.status = "confirmed"
			if(Data.startTime != ""){
				const res = await todo.Reservation_Add(Data)
			}
		}else{
			Data.status = "confirmed"
			if(Data.startTime != ""){
				const res = await todo.Reservation_Add(Data)
			}
		}
	}
	function calendarChange(e){
		console.log(dayjs(e.fulldate).unix().toString());
		Data.startTime = dayjs(e.fulldate)
	}
	onMounted(() => {
		const instance = getCurrentInstance().proxy;
		const eventChannel = instance.getOpenerEventChannel();
		const res = uniCloud.getCurrentUserInfo('uni_id_token')
		eventChannel.on('acceptDataFromOpenerPage', function (data) {
			console.log('acceptDataFromOpenerPage', data)
			machineName.value = data.name
			Data.machineId = data.id
		})
		console.log(machineName.value)
		console.log(Data.machineId)
		Data.userId = res.uid
	})
	
	
</script>

<style>
	.divider {
		height: 2rpx;
		background-color: rgb(242, 242, 242);
		margin-top: 15rpx;
		margin-bottom: 15rpx;
	}

	.attention {
		background-color: rgb(253, 251, 231);
		display: flex;
		justify-content: center;
		align-items: center;
		align-self: center;
		align-content: center;
		border-radius: 20rpx;
		height: 90rpx;
	}

	.bt {
		background-color: rgb(249, 203, 20);
		display: flex;
		justify-content: center;
		align-items: center;
		border-radius: 20rpx;
		width: 80%;
		height: 80rpx;
	}

	.price {
		display: flex;
		width: 90%;
		justify-content: space-between;
	}

	.option {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
	}
</style>