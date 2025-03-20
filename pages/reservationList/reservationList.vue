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
					<view style="display: flex;flex-direction: column;">
						<text v-if="data.status == 2" style="color: greenyellow;">已完成</text>
						<text v-else-if="data.status == 1" style="color: red;">未完成</text>
					</view>
				</uni-col>
			</uni-row>
		</uni-card>
	</view>
</template>

<script setup lang="ts">
    import { onMounted, ref, toRaw } from 'vue';
	const todo = uniCloud.importObject('todo')
	const res = uniCloud.getCurrentUserInfo('uni_id_token')
	interface reservationData {
		_id:string;
		machineId:string;
		isOvernight:boolean;
		status:number; 
		startTime:string;
	}
	interface machine {
		_id:string;
		name:string;
	}
	const machineInfo = ref<machine[]>([])
	const Data = ref<reservationData[]>([])
	async function getReservationData() {
		try {
			let result = await todo.GetReservationInfo(res.uid)
			Data.value = result.data
		} catch {}
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
	.card{
		height: 200rpx;
	}
</style>
