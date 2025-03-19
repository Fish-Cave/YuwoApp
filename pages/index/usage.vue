<template>
	<view>
		<view v-for="machine in machines" :key="machine.machinenum">
			<uni-card :is-shadow="false">
				<view>
					<uni-row>
						<uni-col :span="4">
							<view class="icon">
								<uni-icons type="headphones" size="30"></uni-icons>
							</view>
						</uni-col>
						<uni-col :span="16">
							<view style="display: flex;
						 flex-direction: column; padding-left: 20rpx;">
								<text style="font-weight: bold;font-size: 35rpx;">
									{{machine.name}}
								</text>
								<text>5元/半时</text>
							</view>
						</uni-col>
						<uni-col :span="4">
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
						<text @click="goOrder(machine.name,machine._id)">预约</text>
					</view>
				</view>
				<text>{{machine._id}}</text>
			</uni-card>
		</view>
	</view>
</template>

<script setup lang="ts">
	import { onMounted, reactive, ref } from 'vue';
	const todo = uniCloud.importObject('todo')
	interface machine {
		"_id": string;
		"name" : string;
		"capacity" : number;
		"status" : string;
		"machinenum" : number;
	}
	function goOrder(machineName : String,machineID : String) {
		console.log("test")
		uni.navigateTo({
			url: '/pages/order/order',
			success: function (res) {
				// 通过eventChannel向被打开页面传送数据
				res.eventChannel.emit('acceptDataFromOpenerPage', { name: machineName, id: machineID })
			}
		});
	}
	const machines = ref<machine[]>([])
	async function loadMachines() {
		try {
			let res = await todo.Machines_List()
			machines.value = res.data
		} catch { }
	}
	onMounted(() => {
		loadMachines()
	})
</script>

<style>
	.bt {
		padding-top: 20rpx;
		display: flex;
		justify-content: center;
		align-self: center;
		background-color: gray;
		border-radius: 20rpx;
		height: 70rpx;
		width: 270rpx;
	}

	.icon {
		padding-top: 20rpx;
		display: flex;
		justify-content: center;
		align-items: center;
		background-color: gray;
		height: 80rpx;
		border-radius: 30rpx;
	}
</style>