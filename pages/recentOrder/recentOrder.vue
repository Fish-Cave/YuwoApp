<template>
	<!-- TODO: 这个页面实际上之后要跑的是获取订单数据，现在是获取的预约数据 -->
	<view class="container">
		<view v-for="data in Data" :key="data._id" class="order-item">
			<view class="glass-card">
				<!-- 订单头部区域 -->
				<view class="card-header">
					<view class="icon-container">
						<uni-icons type="headphones" size="30" color="#ffffff"></uni-icons>
					</view>
					<view class="order-info">
						<!-- 提取并显示机台名称，而不是整个对象 -->
						<text class="machine-name">{{ getMachineName(data.machineId) }}</text>
						<view class="time-status-container">
							<view class="status-label" 
								:class="{'status-completed': data.status == 1, 'status-pending': data.status != 1}">
								{{ getStatusText(data.status) }}
							</view>
						</view>
					</view>
				</view>
				
				<!-- 订单详情区域 -->
				<view class="order-details">
					<view class="detail-item">
						<view class="detail-label">开始时间</view>
						<view class="detail-value">
							{{ formatDateTime(data.startTime) }}
						</view>
					</view>
					<view class="detail-item">
						<view class="detail-label">结束时间</view>
						<view class="detail-value">
							{{ formatDateTime(data.endTime) }}
						</view>
					</view>
					<view class="detail-item">
						<view class="detail-label">总时长</view>
						<view class="detail-value">{{ calculateDuration(data.startTime, data.endTime) }}</view>
					</view>
					<view class="detail-item">
						<view class="detail-label">预约类型</view>
						<view class="detail-value">{{ data.isOvernight ? '通宵' : '标准' }}</view>
					</view>
					<view class="detail-item">
						<view class="detail-label">使用状态</view>
						<view class="detail-value">{{ data.isPlay ? '已使用' : '未使用' }}</view>
					</view>
				</view>
				
				<!-- 按钮区域 -->
				<view class="button-group">
					<view class="action-button view-button">
						<uni-icons type="eye" size="20" color="#4b5563"></uni-icons>
						<text class="button-text">查看详情</text>
					</view>
					<view v-if="data.status != 1" class="action-button cancel-button">
						<uni-icons type="close" size="20" color="#ffffff"></uni-icons>
						<text class="button-text cancel-text">取消预约</text>
					</view>
				</view>
			</view>
		</view>

		<view v-if="Data.length === 0" class="empty-orders glass-card">
			<uni-icons type="info" size="32" color="#9ca3af"></uni-icons>
			<text class="empty-text">暂无订单记录</text>
		</view>
	</view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
const todo = uniCloud.importObject('todo')
const res = uniCloud.getCurrentUserInfo()

interface MachineInfo {
	_id: string;
	name: string;
}

interface reservationData {
	_id: string;
	machineId: MachineInfo[] | string;
	isOvernight: boolean;
	status: number;
	startTime: number | string;
	endTime: number | string;
	isPlay: boolean;
}
const Data = ref<reservationData[]>([])

// 从machineId中提取机台名称
function getMachineName(machineId: any): string {
	// 如果是数组且有元素
	if (Array.isArray(machineId) && machineId.length > 0) {
		// 如果数组的第一个元素有name属性
		if (machineId[0] && machineId[0].name) {
			return machineId[0].name;
		}
	}
	// 如果是字符串直接返回
	if (typeof machineId === 'string') {
		return machineId;
	}
	// 如果是对象且有name属性
	if (typeof machineId === 'object' && machineId !== null && 'name' in machineId) {
		return machineId.name;
	}
	// 默认返回未知机台
	return '未知机台';
}

// 格式化日期时间
function formatDateTime(timestamp: number | string): string {
	if (!timestamp) return '未设置';
	
	// 处理时间戳
	let date: Date;
	if (typeof timestamp === 'number') {
		date = new Date(timestamp);
	} else {
		// 如果是字符串但可以转为数字
		const numTimestamp = Number(timestamp);
		if (!isNaN(numTimestamp)) {
			date = new Date(numTimestamp);
		} else {
			// 尝试作为ISO字符串解析
			date = new Date(timestamp);
		}
	}
	
	// 检查日期是否有效
	if (isNaN(date.getTime())) {
		return '无效日期';
	}
	
	// 格式化日期和时间
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	const hours = String(date.getHours()).padStart(2, '0');
	const minutes = String(date.getMinutes()).padStart(2, '0');
	
	return `${year}-${month}-${day} ${hours}:${minutes}`;
}

// 获取状态文本
function getStatusText(status: number): string {
	switch(status) {
		case 1:
			return '已完成';
		case 2:
			return '已取消';
		case 3:
			return '进行中';
		default:
			return '未完成';
	}
}

// 计算时长
function calculateDuration(startTime: number | string, endTime: number | string): string {
	if (!startTime || !endTime) {
		return '未知';
	}
	
	// 处理时间戳
	let start: Date, end: Date;
	
	// 处理开始时间
	if (typeof startTime === 'number') {
		start = new Date(startTime);
	} else {
		const numStartTime = Number(startTime);
		if (!isNaN(numStartTime)) {
			start = new Date(numStartTime);
		} else {
			start = new Date(startTime);
		}
	}
	
	// 处理结束时间
	if (typeof endTime === 'number') {
		end = new Date(endTime);
	} else if (endTime === '') {
		return '未结束';
	} else {
		const numEndTime = Number(endTime);
		if (!isNaN(numEndTime)) {
			end = new Date(numEndTime);
		} else {
			end = new Date(endTime);
		}
	}
	
	// 检查日期是否有效
	if (isNaN(start.getTime()) || isNaN(end.getTime())) {
		return '时间错误';
	}
	
	// 计算时间差（毫秒）
	const diffMs = end.getTime() - start.getTime();
	
	// 如果时间差为负或无效，返回错误信息
	if (diffMs < 0) {
		return '时间错误';
	}
	
	// 转换为小时和分钟
	const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
	const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
	
	// 格式化输出
	if (diffHours > 0) {
		return `${diffHours}小时${diffMinutes > 0 ? diffMinutes + '分钟' : ''}`;
	} else {
		return `${diffMinutes}分钟`;
	}
}

async function getReservationData() {
	try {
		let result = await todo.GetReservationInfo(res.uid)
		console.log("订单数据:", result)
		
		if (result && result.data) {
			Data.value = result.data
		} else {
			console.error("获取到的数据格式不正确:", result)
		}
	} catch (e) {
		console.error("获取订单数据失败", e)
		uni.showToast({
			title: '加载订单失败，请重试',
			icon: 'none'
		});
	}
}

onMounted(() => {
	getReservationData() // 获取所有订单数据
});
</script>


<style scoped>
/* 全局样式 */
.container {
	width: 100%;
	padding: 20rpx;
	box-sizing: border-box;
	background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
	min-height: 100vh;
}

.order-item {
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
	align-items: flex-start;
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
	flex-shrink: 0;
}

.order-info {
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

.time-status-container {
	display: flex;
	align-items: center;
	flex-wrap: wrap;
}

.status-label {
	padding: 8rpx 20rpx;
	border-radius: 12rpx;
	font-size: 26rpx;
	font-weight: 600;
	margin-top: 8rpx;
}

.status-completed {
	background-color: rgba(76, 175, 80, 0.2);
	color: #4CAF50;
}

.status-pending {
	background-color: rgba(244, 67, 54, 0.2);
	color: #f44336;
}

/* 订单详情区域 */
.order-details {
	background: rgba(249, 250, 251, 0.6);
	border-radius: 16rpx;
	padding: 20rpx;
	margin-bottom: 20rpx;
}

.detail-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 16rpx;
	padding-bottom: 16rpx;
	border-bottom: 1px solid rgba(229, 231, 235, 0.6);
}

.detail-item:last-child {
	margin-bottom: 0;
	padding-bottom: 0;
	border-bottom: none;
}

.detail-label {
	color: #6b7280;
	font-size: 26rpx;
	font-weight: 500;
}

.detail-value {
	color: #111827;
	font-size: 26rpx;
	font-weight: 600;
	text-align: right;
}

/* 按钮组样式 */
.button-group {
	display: flex;
	justify-content: space-between;
	gap: 20rpx;
}

.action-button {
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 12rpx;
	padding: 18rpx 24rpx;
	flex: 1;
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

.cancel-button {
	background: linear-gradient(135deg, #f87171 0%, #ef4444 100%);
	color: #ffffff;
}

.button-text {
	margin-left: 10rpx;
	font-size: 28rpx;
	white-space: nowrap;
	font-weight: 500;
}

.cancel-text {
	color: #ffffff;
}

/* 空订单提示 */
.empty-orders {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 60rpx 0;
	text-align: center;
}

.empty-text {
	color: #9ca3af;
	font-size: 28rpx;
	margin-top: 20rpx;
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
		height: 70rpx;
	}

	.button-text {
		font-size: 26rpx;
	}
}

/* 大屏幕设备 */
@media screen and (min-width: 768px) {
	.container {
		padding: 30rpx;
	}

	.order-item {
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

	.action-button {
		padding: 20rpx 30rpx;
		height: 90rpx;
		border-radius: 16rpx;
	}

	.button-text {
		font-size: 30rpx;
		margin-left: 12rpx;
	}

	.status-label {
		font-size: 26rpx;
		padding: 6rpx 20rpx;
	}

	.detail-label, .detail-value {
		font-size: 28rpx;
	}
}
</style>
