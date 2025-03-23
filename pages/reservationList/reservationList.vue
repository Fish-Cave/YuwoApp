<template>
	<view>
		<uni-card v-for="data in Data" :key="data._id" class="card">
			<uni-row>
				<uni-col :span="4">
					<view class="orderbox">
						<uni-icons type="contact" size="30"></uni-icons>
					</view>
				</uni-col>
				<uni-col :span="16">
					<view style="display: flex;flex-direction: column;">
						<text>{{data.machineId[0].name}}</text>
						<uni-dateformat :date='data.startTime'></uni-dateformat>
						
					</view>
				</uni-col>
				<uni-col :span="4">
					<view class="functionBox">
						<view style="display: flex;flex-direction: column;">
							<text v-if="data.status == 2" style="color: greenyellow;">已完成</text>
							<text v-else-if="data.status == 1" style="color: red;">未完成</text>
							<text v-else-if="data.status == 3" style="color: grey;">已过期</text>
							<text v-else-if="data.status == 4" style="color: #f9cb14;">正使用</text>
						</view>
						<view v-if="data.isPlay">Mark</view>
						<view style="padding-top: 50rpx;">
							<view v-if="data.status == 1" 
							class="signInBt" 
							@click="goToStart(data.machineId[0].name,data.startTime,data._id,data.isOvernight,data.isPlay)">
								<text>签到</text>
							</view>
						</view>
					</view>
				</uni-col>
			</uni-row>
			<text>{{data._id}}</text>
		</uni-card>
	</view>
</template>

<script setup lang="ts">
	import { onMounted, ref, toRaw } from 'vue';
	const todo = uniCloud.importObject('todo')
	const res = uniCloud.getCurrentUserInfo('uni_id_token')
	interface reservationData {
		_id : string;
		machineId : string;
		isOvernight : boolean;
		isPlay : boolean;
		status : number;
		startTime : number;
	}
	const Data = ref<reservationData[]>([])
	async function getReservationData() {
		try {
			let result = await todo.GetReservationInfo(res.uid)
			Data.value = result.data
			console.log(result.data)
		} catch { }
	}
	function goToStart(machineName:string,startTime:number,reservationID:string,isOvernight:boolean,isPlay:boolean){
		uni.navigateTo({
			url: "/pages/start/start",
			success: (res) => {
				res.eventChannel.emit('acceptDataFromOpenerPage', {
					"machineName" : machineName,
					"startTime" : startTime,
					"reservationID" : reservationID,
					"isOvernight" : isOvernight,
					"isPlay" : isPlay
				})
			}
		})
	}
	onMounted(() => {
		getReservationData()
	})
</script>

<style>
	.orderbox {
		background-color: rgb(242, 243, 245);
		height: 80rpx;
		width: 80rpx;
		border-radius: 40rpx;
		display: flex;
		justify-content: center;
		align-content: center;
		align-items: center;
		align-self: center;
		padding-left: 10rpx;
	}

	.card {
		height: 200rpx;
	}

	.signInBt {
		background-color: rgb(249, 203, 20);
		height: 60rpx;
		width: 120rpx;
		display: flex;
		justify-content: center;
		align-items: center;
		border-radius: 40rpx;
	}
	.functionBox{
		display: flex;
		flex-direction: column;
		justify-content: space-around;
		align-content: center;
		align-items: center;
		align-self: center;
	}
</style>