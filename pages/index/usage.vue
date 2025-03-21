<template>
	<view>
		<view v-for="machineData in machineReservationData" :key="machineData.machineInfo.machinenum">
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
									{{ machineData.machineInfo.name }}
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
					<!-- 条形图渲染位置 -->
					<view class="timeline-hours">
						<span>0:00</span>
						<span>6:00</span>
						<span>12:00</span>
						<span>18:00</span>
						<span>24:00</span>
					</view>
					<view class="timeline-container mb-4">
						<view class="timeline-bar">
							<view
								v-for="(reservation, index) in machineData.reservations"
								:key="index"
								class="timeline-segment"
								:style="calculateSegmentStyle(reservation, startTime, endTime)"
							></view>
						</view>
					</view>
				</view>
				<view style="display: flex; justify-content:space-around; padding-top: 40rpx;">
					<view class="bt" style="background-color: rgb(242, 243, 245);">
						<uni-icons type="staff" size="30"></uni-icons>
						<text>查看预约</text>
					</view>
					<view v-if="machineData.machineInfo.status == 0" class="bt" style="background-color: rgb(249, 203, 20);">
						<uni-icons type="personadd" size="30"></uni-icons>
						<text @click="goOrder(machineData.machineInfo.name,machineData.machineInfo._id)">预约</text>
					</view>
					<view v-else class="bt" style="background-color: rgb(221, 82, 77);">
						<uni-icons type="close" size="30" @click="unuseable()"></uni-icons>
						<text>机台故障</text>
					</view>
				</view>
			</uni-card>
		</view>
	</view>
</template>

<script setup lang="ts">
	import { onMounted, reactive, ref, watch, isRef } from 'vue';
	import dayjs from 'dayjs';
	const todo = uniCloud.importObject('todo')
	interface machine {
		"_id": string;
		"name" : string;
		"capacity" : number;
		"status" : number;
		"machinenum" : number;
		"description": string;
	}
	interface Reservation {
		"_id": string;
		"machineId": string;
		"isOvernight": boolean;
		"status": string;
		"startTime": number;
		"endTime": number;
	}
	function unuseable(){
		uni.showToast({
			icon : "error",
			title : "机台故障",
		})
	}

// 接收父组件传递的时间戳 props
	const props = defineProps({
		startTime: {
			type: Number,
			required: true
		},
		endTime: {
			type: Number,
			required: true
		}
	})

	function goOrder(machineName : String,machineID : String) {
		uni.navigateTo({
			url: '/pages/order/order',
			success: function (res) {
				res.eventChannel.emit('acceptDataFromOpenerPage', { 'name': machineName, 'id': machineID })
			}
		});
	}

	const machineReservationData = ref<Array<{ machineInfo: machine, reservations: Reservation[] }>>([]) // 初始化为空数组


	async function loadMachineReservations() {
	    try {
	        if (!props.startTime || !props.endTime) {
	            console.log("startTime 或 endTime 为空，不加载数据");
	            return;
	        }
	        console.log("准备调用 GetMachineReservationInfo 云函数");
	        let res = await todo.GetMachineReservationInfo(props.startTime, props.endTime);
	        console.log("GetMachineReservationInfo 云函数调用完成，返回结果:", res);
	    
	        if (Array.isArray(res)) {
	            machineReservationData.value = res;
	        } else if (res && res.result) {
	            machineReservationData.value = res.result;
	        } else {
	            console.error("返回的数据格式不正确:", res);
	            machineReservationData.value = []; // 设置为空数组避免渲染错误
	        }
	        
	        console.log("machineReservationData.value 赋值后:", machineReservationData.value);
	    } catch (e) {
	        console.error("加载机台预约信息失败:", e);
	    }
	}

	// 监听 startTime 和 endTime 的变化，重新加载预约数据
	watch(() => [props.startTime, props.endTime], ([newStartTime, newEndTime]) => {
		console.log("watch 监听器被触发，startTime:", newStartTime, "endTime:", newEndTime); // 增加 console.log
		if (newStartTime && newEndTime) {
			loadMachineReservations()
		}
	})

	onMounted(() => {
		console.log("usage 组件 onMounted"); // 增加 console.log
		// 组件挂载时，如果 props 中已经有时间戳，则加载数据 (这里先注释掉，看看 watch 是否工作)
		// if (props.startTime && props.endTime) {
		// 	loadMachineReservations()
		// }
		console.log(machineReservationData.value)
	})


	// 计算条形图 segment 的样式
	function calculateSegmentStyle(reservation: Reservation, dayStartTime: number, dayEndTime: number) {
		const totalDayTime = dayEndTime - dayStartTime; // 一天的总时长（毫秒）
		const reservationStartTimeInDay = Math.max(reservation.startTime, dayStartTime) - dayStartTime; // 预约开始时间在一天中的偏移量
		const reservationEndTimeInDay = Math.min(reservation.endTime, dayEndTime) - dayStartTime;   // 预约结束时间在一天中的偏移量

		const segmentLeftPercentage = (reservationStartTimeInDay / totalDayTime) * 100;
		const segmentRightPercentage = 100 - (reservationEndTimeInDay / totalDayTime) * 100;

		return {
			left: `${segmentLeftPercentage}%`,
			right: `${segmentRightPercentage}%`,
			backgroundColor: '#FDE68A' // 可以根据预约状态设置不同的颜色
		};
	}
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

	/* 条形图样式 (从 demo 中提取) */
	.timeline-container {
		position: relative;
		width: 100%;
	}
	.timeline-hours {
		display: flex;
		justify-content: space-between;
		margin-bottom: 8px;
		color: #9ca3af;
		font-size: 10px;
	}
	.timeline-bar {
		height: 20px;
		width: 100%;
		background-color: #f3f4f6;
		border-radius: 9999px;
		position: relative;
	}
	.timeline-segment {
		position: absolute;
		top: 0;
		bottom: 0;
		border-radius: 9999px;
		background-color: #FDE68A; /* 默认颜色，可以根据需要修改 */
	}
</style>
