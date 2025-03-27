<template>
	<view class="container">
		<view v-for="data in Data" :key="data._id" class="reservation-item glass-card">
			<view class="reservation-header">
				<view class="icon-container">
					<uni-icons type="contact" size="30" color="#ffffff"></uni-icons>
				</view>
				<view class="reservation-info">
					<text class="machine-name">{{ data.machineId[0].name }}</text>
					<text class="reservation-time">
						预约时间：
					<uni-dateformat format="yyyy-MM-dd hh:mm" :date='data.startTime'></uni-dateformat>
					</text>		
				</view>
				<view class="status-badge" :class="getStatusClass(data.status)">
					<text>{{ getStatusText(data.status) }}</text>
				</view>
			</view>

			<view class="reservation-footer">
				<view class="reservation-id">
					<text class="id-label">预约ID：</text>
					<text class="id-value">{{ data._id }}</text>
				</view>
				<view v-if="data.status == 1" class="sign-in-button" 
					@click="goToStart(data.machineId[0].name, data.startTime, data._id, data.isOvernight, data.isPlay)">
					<text>签到</text>
					
				</view>
			</view>
		</view>
	</view>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';

const todo = uniCloud.importObject('todo')
const res = uniCloud.getCurrentUserInfo('uni_id_token')

interface reservationData {
	_id: string;
	machineId: string;
	isOvernight: boolean;
	isPlay: boolean;
	status: number;
	startTime: number;
}

const Data = ref<reservationData[]>([])

function getStatusText(status: number): string {
	switch (status) {
		case 1: return '未完成';
		case 2: return '已完成';
		case 3: return '已过期';
		case 4: return '正使用';
		default: return '未知';
	}
}

function getStatusClass(status: number): string {
	switch (status) {
		case 1: return 'status-pending';
		case 2: return 'status-completed';
		case 3: return 'status-expired';
		case 4: return 'status-active';
		default: return '';
	}
}

async function getReservationData() {
	try {
		let result = await todo.GetReservationInfo(res.uid)
		Data.value = result.data
		console.log(result.data)
	} catch (error) {
		console.error('Failed to fetch reservation data:', error)
	}
}

function goToStart(machineName: string, startTime: number, reservationID: string, isOvernight: boolean, isPlay: boolean) {
	uni.navigateTo({
		url: "/pages/start/start",
		success: (res) => {
			res.eventChannel.emit('acceptDataFromOpenerPage', {
				"machineName": machineName,
				"startTime": startTime,
				"reservationID": reservationID,
				"isOvernight": isOvernight,
				"isPlay": isPlay
			})
		}
	})
}

onMounted(() => {
	getReservationData()
})
</script>

<style>
/* 全局样式 */
.container {
	padding: 20px;
	background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
	min-height: 100vh;
}

/* 玻璃拟态卡片 */
.glass-card {
	background: rgba(255, 255, 255, 0.7);
	backdrop-filter: blur(10px);
	border-radius: 20px;
	box-shadow: 0 8px 32px rgba(31, 38, 135, 0.1);
	border: 1px solid rgba(255, 255, 255, 0.18);
	overflow: hidden;
	padding: 16px;
	margin-bottom: 20px;
	transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.glass-card:active {
	transform: translateY(2px);
	box-shadow: 0 4px 16px rgba(31, 38, 135, 0.08);
}

/* 预约项目 */
.reservation-item {
	position: relative;
	padding: 0;
}

.reservation-header {
	display: flex;
	align-items: center;
	padding: 16px;
	border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.icon-container {
	display: flex;
	justify-content: center;
	align-items: center;
	background: linear-gradient(135deg, #FFC107 0%, #FF9800 100%);
	width: 50px;
	height: 50px;
	border-radius: 16px;
	margin-right: 16px;
	box-shadow: 0 4px 12px rgba(255, 193, 7, 0.4);
}

.reservation-info {
	display: flex;
	flex-direction: column;
	flex: 1;
}

.machine-name {
	font-size: 18px;
	font-weight: bold;
	margin-bottom: 6px;
	color: #333;
}

.reservation-time {
	font-size: 13px;
	color: #6b7280;
	background: rgba(243, 244, 246, 0.7);
	padding: 2px 8px;
	border-radius: 12px;
	align-self: flex-start;
}

.status-badge {
	padding: 4px 10px;
	border-radius: 12px;
	font-size: 12px;
	font-weight: 600;
}

.status-pending {
	background: rgba(239, 68, 68, 0.1);
	color: #EF4444;
}

.status-completed {
	background: rgba(110, 231, 78, 0.1);
	color: #6EE74E;
}

.status-expired {
	background: rgba(156, 163, 175, 0.1);
	color: #6B7280;
}

.status-active {
	background: rgba(255, 193, 7, 0.1);
	color: #FF9800;
}

.reservation-footer {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 12px 16px;
}

.reservation-id {
	display: flex;
	align-items: center;
}

.id-label {
	font-size: 12px;
	color: #9ca3af;
	margin-right: 4px;
}

.id-value {
	font-size: 12px;
	color: #6b7280;
	max-width: 150px;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.sign-in-button {
	background: linear-gradient(135deg, #FFC107 0%, #FF9800 100%);
	color: #fff;
	font-size: 14px;
	font-weight: 600;
	padding: 6px 14px;
	border-radius: 20px;
	box-shadow: 0 4px 12px rgba(255, 193, 7, 0.3);
	transition: all 0.2s ease;
}

.sign-in-button:active {
	transform: translateY(2px);
	box-shadow: 0 2px 8px rgba(255, 193, 7, 0.2);
}

.mark-badge {
	background: rgba(255, 193, 7, 0.1);
	color: #FF9800;
	font-size: 12px;
	font-weight: 500;
	padding: 4px 10px;
	border-radius: 12px;
}

/* 媒体查询：针对不同尺寸设备的响应式样式 */
/* 小屏幕设备 */
@media screen and (max-width: 375px) {
	.container {
		padding: 16px;
	}
	
	.icon-container {
		width: 40px;
		height: 40px;
		border-radius: 12px;
	}
	
	.machine-name {
		font-size: 16px;
	}
	
	.reservation-time {
		font-size: 12px;
	}
}

/* 大屏幕设备 */
@media screen and (min-width: 768px) {
	.container {
		padding: 24px;
	}
	
	.glass-card {
		padding: 20px;
		border-radius: 24px;
		margin-bottom: 24px;
	}
	
	.icon-container {
		width: 60px;
		height: 60px;
		border-radius: 20px;
	}
	
	.machine-name {
		font-size: 20px;
	}
	
	.reservation-time {
		font-size: 14px;
	}
	
	.sign-in-button {
		font-size: 16px;
		padding: 8px 16px;
	}
}
</style>