<template>
    <view class="container">
        <view v-for="machineData in machineReservationData" :key="machineData.machineInfo.machinenum" class="machine-item">
            <view class="glass-card">
                <!-- 机台信息区域 -->
                <view class="card-header">
                    <view class="icon-container">
                        <uni-icons type="headphones" size="30" color="#ffffff"></uni-icons>
                    </view>
                    <view class="machine-info">
                        <text class="machine-name">{{ machineData.machineInfo.name }}</text>
                        <view class="price-status-container">
                            <text class="machine-price">5元/半时</text>
                            <view class="status-label" :class="{ 'status-error': machineData.machineInfo.status !== 0 }">
                                {{ machineData.machineInfo.status === 0 ? '可用' : '故障' }}
                            </view>
                        </view>
                    </view>
                    <view class="heart-icon" @click="toggleFavorite(machineData.machineInfo._id)">
                        <uni-icons type="heart" size="24" color="#f472b6"></uni-icons>
                    </view>
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
                            >
                                <view class="timeline-segment-pulse"></view>
                            </view>
                        </view>
                    </view>
                </view>


                <!-- 按钮区域 -->
                <view class="button-group">
                    <view class="action-button view-button" @click="viewReservations(machineData)">
                        <uni-icons type="staff" size="20" color="#4b5563"></uni-icons>
                        <text class="button-text">查看预约</text>
                    </view>
                    <view
                        v-if="machineData.machineInfo.status == 0"
                        class="action-button reserve-button"
                        @click="goOrder(machineData.machineInfo.name, machineData.machineInfo._id)"
                    >
                        <uni-icons type="personadd" size="20" color="#ffffff"></uni-icons>
                        <text class="button-text reserve-text">预约</text>
                    </view>
                    <view v-else class="action-button error-button" @click="unuseable()">
                        <uni-icons type="close" size="20" color="#ffffff"></uni-icons>
                        <text class="button-text error-text">机台故障</text>
                    </view>
                </view>
            </view>
        </view>
    </view>
</template>

<script setup lang="ts">
	import { onMounted, reactive, ref, watch } from 'vue';
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
	
	// 新增：用于控制收藏状态
	const favorites = ref<Set<string>>(new Set());
	
	function toggleFavorite(machineId: string) {
		if (favorites.value.has(machineId)) {
			favorites.value.delete(machineId);
		} else {
			favorites.value.add(machineId);
		}
		// 这里可以实现持久化存储逻辑
		uni.showToast({
			icon: 'success',
			title: favorites.value.has(machineId) ? '已加入收藏' : '已取消收藏',
			duration: 1500
		});
	}
	
	function unuseable(){
		uni.showToast({
			icon : "error",
			title : "机台故障",
		})
	}

	function viewReservations(machineData) {
	    console.log("查看预约信息：", machineData);
	    uni.navigateTo({
	        url: '/pages/usageDetail/usageDetail',
	        success: function (res) {
	            res.eventChannel.emit('acceptDataFromOpenerPage', {
	                GetMachineReservationInfo: machineData  // 传递整个 machineData 对象
	            });
	        }
	    });
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
			loadMachineReservations();
		}
	})

	onMounted(() => {
		console.log("usage 组件 onMounted");
		if (props.startTime && props.endTime) {
			loadMachineReservations();
		}
		console.log(machineReservationData.value);
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
			background: 'linear-gradient(90deg, rgba(255,193,7,0.5) 0%, rgba(252,211,77,0.8) 100%)'
		};
	}
</script>
<style>
/* 基础容器样式 */
.container {
	width: 100%;
	padding: 20rpx;
	box-sizing: border-box;
	background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
	min-height: 100vh;
}

.machine-item {
	margin-bottom: 30rpx;
}

/* 玻璃拟态卡片 */
.glass-card {
	background: rgba(255, 255, 255, 0.7);
	backdrop-filter: blur(10px);
	border-radius: 20rpx;
	box-shadow: 0 4px 16px rgba(31, 38, 135, 0.1);
	border: 1px solid rgba(255, 255, 255, 0.18);
	overflow: hidden;
	padding: 24rpx;
	transition: transform 0.3s ease, box-shadow 0.3s ease;
	position: relative;
}

.glass-card:active {
	transform: translateY(2rpx);
	box-shadow: 0 2px 8px rgba(31, 38, 135, 0.08);
}

/* 卡片头部区域 */
.card-header {
	width: 100%;
	display: flex;
	justify-content: space-between;
	align-items: flex-start; /* 顶部对齐 */
	margin-bottom: 20rpx;
	position: relative;
}

.icon-container {
	display: flex;
	justify-content: center;
	align-items: center;
	background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
	width: 60px;
	height: 60px;
	border-radius: 16px;
	box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
}

.machine-info {
	display: flex;
	flex-direction: column;
	padding: 0 24rpx;
	flex: 1;
}

.machine-name {
	font-weight: bold;
	font-size: 34rpx;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	line-height: 1.4;
	color: #333;
	margin-bottom: 8rpx;
}

.machine-price {
	font-size: 26rpx;
	color: #6b7280;
	line-height: 1.4;
	background: rgba(59, 130, 246, 0.1);
	padding: 4rpx 16rpx;
	border-radius: 20rpx;
	align-self: flex-start;
	font-weight: 500;
}

.heart-icon {
	display: flex;
	justify-content: center;
	align-items: center;
	width: 40px;
	height: 40px;
	border-radius: 50%;
	background: rgba(255, 255, 255, 0.8);
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
	transition: all 0.2s ease;
}

.heart-icon:active {
	transform: scale(0.9);
	background: rgba(252, 165, 165, 0.2);
}

/* 状态标签 */
.status-label {
    /* position: absolute; 移除绝对定位 */
    /* top: 20rpx; */
    /* right: 20rpx; */
    background: rgba(59, 130, 246, 0.15);
    color: #3b82f6;
    padding: 4rpx 16rpx;
    border-radius: 12rpx;
    font-size: 24rpx;
    font-weight: 600;
    margin-left: 10rpx; /* 增加左边距，使其与价格标签分开 */
}

/* 时间轴样式 */
.timeline-section {
	padding: 16rpx 0 24rpx;
}

.timeline-hours {
	display: flex;
	justify-content: space-between;
	margin-bottom: 12rpx;
}

.time-label {
	color: #9ca3af;
	font-size: 22rpx;
	font-weight: 500;
}

.timeline-container {
	position: relative;
	width: 100%;
	margin-bottom: 20rpx;
}

.timeline-bar {
	height: 36rpx;
	width: 100%;
	background-color: rgba(243, 244, 246, 0.7);
	border-radius: 18rpx;
	position: relative;
	box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.05);
	overflow: hidden;
}

.timeline-segment {
	position: absolute;
	top: 0;
	bottom: 0;
	border-radius: 18rpx;
	z-index: 2;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	overflow: hidden;
}

.timeline-segment-pulse {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(255, 255, 255, 0.3);
	animation: pulse 2s infinite;
	border-radius: 18rpx;
}

@keyframes pulse {
	0% {
		opacity: 0.4;
	}
	50% {
		opacity: 0.8;
	}
	100% {
		opacity: 0.4;
	}
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
	padding: 18rpx 24rpx;
	flex: 1;
	min-width: 180rpx;
	max-width: 240rpx;
	height: 80rpx;
	transition: all 0.2s;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.action-button:active {
	transform: translateY(2rpx);
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.view-button {
	background: rgba(249, 250, 251, 0.8);
	border: 1px solid rgba(209, 213, 219, 0.5);
	color: #4b5563;
}

.reserve-button {
	background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
	color: #ffffff;
}

.error-button {
	background: linear-gradient(135deg, #f87171 0%, #ef4444 100%);
	color: #ffffff;
}

.button-text {
	margin-left: 10rpx;
	font-size: 28rpx;
	white-space: nowrap;
	font-weight: 500;
}

.reserve-text, .error-text {
	color: #ffffff;
}

/* 媒体查询：针对不同尺寸设备的响应式样式 */
/* 小屏幕设备 */
@media screen and (max-width: 375px) {
	.container {
		padding: 16rpx;
	}
	
	.glass-card {
		padding: 20rpx;
	}
	
	.machine-name {
		font-size: 30rpx;
	}
	
	.icon-container {
		width: 50px;
		height: 50px;
	}
	
	.action-button {
		padding: 16rpx 18rpx;
		min-width: 150rpx;
		height: 70rpx;
	}
	
	.button-text {
		font-size: 26rpx;
	}
	
	.timeline-bar {
		height: 30rpx;
		border-radius: 15rpx;
	}
	
	.timeline-segment {
		border-radius: 15rpx;
	}
}

/* 大屏幕设备 */
@media screen and (min-width: 768px) {
	.container {
		padding: 30rpx;
	}
	
	.machine-item {
		margin-bottom: 40rpx;
	}
	
	.glass-card {
		padding: 30rpx;
		border-radius: 24rpx;
	}
	
	.icon-container {
		width: 70px;
		height: 70px;
		border-radius: 20px;
	}
	
	.machine-name {
		font-size: 38rpx;
	}
	
	.machine-price {
		font-size: 28rpx;
	}
	
	.action-button {
		min-width: 200rpx;
		padding: 20rpx 30rpx;
		height: 90rpx;
		border-radius: 16rpx;
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
	
	.status-label {
		font-size: 26rpx;
		padding: 6rpx 20rpx;
	}
}
.price-status-container {
    display: flex;
    align-items: center; /* 垂直居中对齐 */
}
</style>