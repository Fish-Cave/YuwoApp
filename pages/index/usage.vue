<template>
	<view class="container">
		<view v-for="machineData in machineReservationData" :key="machineData.machineInfo.machinenum" class="machine-item">
			<uni-card :is-shadow="false">
				<!-- 机台信息区域 -->
				<view class="card-header">
					<uni-row>
						<uni-col :span="4">
							<view class="icon-container">
								<uni-icons type="headphones" size="30"></uni-icons>
							</view>
						</uni-col>
						<uni-col :span="16">
							<view class="machine-info">
								<text class="machine-name">{{ machineData.machineInfo.name }}</text>
								<text class="machine-price">5元/半时</text>
							</view>
						</uni-col>
						<uni-col :span="4">
							<view class="heart-icon">
								<uni-icons type="heart" size="30"></uni-icons>
							</view>
						</uni-col>
					</uni-row>
				</view>
				
				<!-- 时间轴区域 -->
				<view class="timeline-section">
					<view class="timeline-hours">
						<text class="time-label">0:00</text>
						<text class="time-label">6:00</text>
						<text class="time-label">12:00</text>
						<text class="time-label">18:00</text>
						<text class="time-label">24:00</text>
					</view>
					<view class="timeline-container">
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
				
				<!-- 按钮区域 -->
				<view class="button-group">
					<view class="action-button view-button" @click="viewReservations(machineData.machineInfo._id)">
						<uni-icons type="staff" size="24"></uni-icons>
						<text class="button-text">查看预约</text>
					</view>
					<view
						v-if="machineData.machineInfo.status == 0"
						class="action-button reserve-button"
						@click="goOrder(machineData.machineInfo.name, machineData.machineInfo._id)"
					>
						<uni-icons type="personadd" size="24"></uni-icons>
						<text class="button-text">预约</text>
					</view>
					<view v-else class="action-button error-button" @click="unuseable()">
						<uni-icons type="close" size="24"></uni-icons>
						<text class="button-text">机台故障</text>
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

	function viewReservations(machineId: string) {
		console.log("查看预约信息：", machineId);
		// 这里可以实现查看预约的具体逻辑
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

	function goOrder(machineName : String, machineID : String) {
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
		console.log("watch 监听器被触发，startTime:", newStartTime, "endTime:", newEndTime);
		if (newStartTime && newEndTime) {
			loadMachineReservations()
		}
	})

	onMounted(() => {
		console.log("usage 组件 onMounted");
		if (props.startTime && props.endTime) {
			loadMachineReservations()
		}
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
/* 基础容器样式 */
.container {
	width: 100%;
	padding: 10rpx;
	box-sizing: border-box;
}

.machine-item {
	margin-bottom: 20rpx;
}

/* 卡片头部区域 */
.card-header {
	width: 100%;
	margin-bottom: 10rpx;
}

.icon-container {
	display: flex;
	justify-content: center;
	align-items: center;
	background-color: #d1d5db;
	height: 80rpx;
	border-radius: 16rpx;
	padding: 10rpx 0;
}

.machine-info {
	display: flex;
	flex-direction: column;
	padding-left: 20rpx;
	justify-content: center;
	min-height: 80rpx;
}

.machine-name {
	font-weight: bold;
	font-size: 32rpx;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	line-height: 1.4;
}

.machine-price {
	font-size: 26rpx;
	color: #666;
	line-height: 1.4;
}

.heart-icon {
	display: flex;
	justify-content: center;
	align-items: center;
	height: 80rpx;
}

/* 时间轴样式 */
.timeline-section {
	padding: 20rpx 0;
}

.timeline-hours {
	display: flex;
	justify-content: space-between;
	margin-bottom: 10rpx;
}

.time-label {
	color: #9ca3af;
	font-size: 22rpx;
}

.timeline-container {
	position: relative;
	width: 100%;
	margin-bottom: 15rpx;
}

.timeline-bar {
	height: 36rpx;
	width: 100%;
	background-color: #f3f4f6;
	border-radius: 18rpx;
	position: relative;
}

.timeline-segment {
	position: absolute;
	top: 0;
	bottom: 0;
	border-radius: 18rpx;
}

/* 按钮组样式 - 响应式 */
.button-group {
	display: flex;
	justify-content: space-around;
	padding: 20rpx 0 10rpx;
	flex-wrap: wrap;
	gap: 20rpx;
}

.action-button {
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 12rpx;
	padding: 16rpx 20rpx;
	flex: 1;
	min-width: 180rpx;
	max-width: 240rpx;
	height: auto;
	transition: all 0.2s;
}

.view-button {
	background-color: #f3f4f6;
}

.reserve-button {
	background-color: #fbbf24;
}

.error-button {
	background-color: #ef4444;
	color: #ffffff;
}

.button-text {
	margin-left: 8rpx;
	font-size: 28rpx;
	white-space: nowrap;
}

/* 媒体查询：针对不同尺寸设备的响应式样式 */
/* 小屏幕设备 */
@media screen and (max-width: 375px) {
	.machine-name {
		font-size: 30rpx;
	}
	
	.action-button {
		padding: 14rpx 16rpx;
		min-width: 150rpx;
	}
	
	.button-text {
		font-size: 26rpx;
	}
}

/* 大屏幕设备 */
@media screen and (min-width: 768px) {
	.container {
		padding: 20rpx;
	}
	
	.machine-item {
		margin-bottom: 30rpx;
	}
	
	.card-header {
		margin-bottom: 20rpx;
	}
	
	.machine-name {
		font-size: 36rpx;
	}
	
	.action-button {
		min-width: 200rpx;
		padding: 20rpx 30rpx;
	}
	
	.button-text {
		font-size: 30rpx;
		margin-left: 12rpx;
	}
	
	.timeline-bar {
		height: 44rpx;
		border-radius: 22rpx;
	}
	
	.timeline-segment {
		border-radius: 22rpx;
	}
}
</style>