<template>
	<view class="container">
		<!-- 机台信息 -->
		<view class="machine-info-card glass-card">
			<view class="machine-info-header">
				<view class="icon-container">
					<uni-icons type="headphones" size="30" color="#ffffff"></uni-icons>
				</view>
				<view class="machine-info">
					<text class="machine-name">{{ machineInfo.name }}</text>
					<text class="machine-price">5元/半时</text>
				</view>
			</view>

			<!-- 日期和总时间轴 -->
			<view class="timeline-section">
				<view class="date-text">
					{{ formatDate(startTime) }}
				</view>
				<view class="timeline-container">
					<view class="timeline-hours">
						<text class="time-label">0:00</text>
						<text class="time-label">6:00</text>
						<text class="time-label">12:00</text>
						<text class="time-label">18:00</text>
						<text class="time-label">24:00</text>
					</view>
					<view class="timeline-bar">
						<view v-for="(reservation, index) in reservations" :key="index" class="timeline-segment"
							:style="calculateTotalTimelineStyle(reservation, startTime, endTime)"></view>
					</view>
				</view>
			</view>
		</view>

		<view class="reservation-list">
			<view v-for="groupedUser in groupedReservations" :key="groupedUser.userId"
				class="reservation-item glass-card">
				<view class="reservation-header">
					<image
						:src="groupedUser.avatar || 'https://vkceyugu.cdn.bspapp.com/VKCEYUGU-aliyun-uid/e952b560-822f-4e8d-b9ab-530230c46558.png'"
						class="avatar" />
					<view class="user-info">
						<text class="username">{{ groupedUser.username }}</text>
						<!--  修改：循环显示每个预约的时间 -->
						<view class="reservation-times">
							<text v-for="(reservation, index) in groupedUser.reservations" :key="index"
								class="reservation-time-item">
								{{ formatTime(reservation.startTime) }} - {{ formatTime(reservation.endTime) }}
							</text>
						</view>
					</view>
					<view class="duration-badge">
						{{ calculateDuration(groupedUser) }}
					</view>
				</view>
				<view class="timeline-container user-timeline-container">
					<view class="timeline-bar user-timeline">
						<!-- 修改：循环渲染每个预约的时间条 segment -->
						<view v-for="(reservation, index) in groupedUser.reservations" :key="index"
							class="timeline-segment user-segment"
							:style="calculateUserTimelineStyle(reservation, startTime, endTime)">
						</view>
					</view>
				</view>
			</view>
		</view>
		<view style="height: 200rpx;"></view>
		<!-- 去预约按钮 -->
		<view class="footer">
			<view class="submit-button" @click="goToReserve(machineInfo.name, machineInfo._id)">
				<text>去预约</text>
			</view>
		</view>

	</view>

</template>

<script setup lang="ts">
	import { ref, onMounted } from 'vue';
	import dayjs from 'dayjs';

	// 定义数据结构
	interface Machine {
		_id : string;
		name : string;
		capacity : number;
		status : number;
		machinenum : number;
		description : string;
	}

	interface Reservation {
		_id : string;
		machineId : string;
		isOvernight : boolean;
		status : string;
		startTime : number;
		endTime : number;
		username ?: string;
		avatar ?: string;
		userId ?: string; // 确保 Reservation 接口包含 userId
	}

	interface MachineReservationData {
		machineInfo : Machine;
		reservations : Reservation[];
	}

	// 初始化数据
	const machineInfo = ref<Machine>({
		_id: '',
		name: '未知机台',
		capacity: 0,
		status: 0,
		machinenum: 0,
		description: ''
	});

	const reservations = ref<Reservation[]>([]);
	const groupedReservations = ref<any[]>([]); // 用于存储合并后的用户预约数据
	const startTime = ref<number>(0);
	const endTime = ref<number>(0);

	onMounted(() => {
		uni.$on('reservationSuccess', () => {
			loadMachineReservations();
		});
		// 尝试从 localStorage 获取数据
		const storedData = uni.getStorageSync('detailData');
		if (storedData) {
			const data = JSON.parse(storedData);
			console.log("usageDetail从localstorage获取到的数据:", data.GetMachineReservationInfo);
			if (data.GetMachineReservationInfo) {
				machineInfo.value = data.GetMachineReservationInfo.machineInfo;
				reservations.value = data.GetMachineReservationInfo.reservations;

				// 数据预处理，合并用户预约
				groupedReservations.value = groupReservationsByUser(reservations.value);

				// 如果有预约数据，设置时间范围
				if (data.startTime && data.endTime) {
				        startTime.value = data.startTime;
				        endTime.value = data.endTime;
				} else {
					// 如果没有预约数据，设置为当天的时间范围
					const today = dayjs().startOf('day');
					startTime.value = today.valueOf();
					endTime.value = today.add(1, 'day').valueOf();
				}
			}
		} else {
			// 从页面传参中获取数据
			const eventChannel = getOpenerEventChannel();
			eventChannel.on('acceptDataFromOpenerPage', (data : { GetMachineReservationInfo : MachineReservationData }) => {
				console.log("usageDetail获取到的数据:", data.GetMachineReservationInfo);
				if (data.GetMachineReservationInfo) {
					machineInfo.value = data.GetMachineReservationInfo.machineInfo;
					reservations.value = data.GetMachineReservationInfo.reservations;

					// 数据预处理，合并用户预约
					groupedReservations.value = groupReservationsByUser(reservations.value);

					// 如果有预约数据，设置时间范围
					if (groupedReservations.value && groupedReservations.value.length > 0) {
						const today = dayjs().startOf('day');
						startTime.value = today.valueOf();
						endTime.value = today.add(1, 'day').valueOf();
					} else {
						// 如果没有预约数据，设置为当天的时间范围
						const today = dayjs().startOf('day');
						startTime.value = today.valueOf();
						endTime.value = today.add(1, 'day').valueOf();
					}
				}
			});
		}
	});
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
	function getOpenerEventChannel() {
		// @ts-ignore
		const pages = getCurrentPages();
		const currentPage = pages[pages.length - 1];
		const eventChannel = currentPage.getOpenerEventChannel();
		return eventChannel;
	}

	function goBack() {
		uni.navigateBack();
	}

	function formatDate(timestamp : number) {
		const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
		const date = dayjs(timestamp);
		const weekday = weekdays[date.day()];
		return date.format(`YYYY-MM-DD 星期${weekday}`);
	}

	function formatTime(timestamp : number) {
		return dayjs(timestamp).format('HH:mm');
	}

	function groupReservationsByUser(reservations : Reservation[]) {
		const userGroups : Map<string, any> = new Map();

		reservations.forEach(reservation => {
			const userId = reservation.userId;
			if (userId) {
				if (userGroups.has(userId)) {
					userGroups.get(userId).reservations.push(reservation);
				} else {
					const avatarUrl = reservation.avatar_file?.url || reservation.avatar || 'https://vkceyugu.cdn.bspapp.com/VKCEYUGU-aliyun-uid/e952b560-822f-4e8d-b9ab-530230c46558.png';
					userGroups.set(userId, {
						userId: userId,
						username: reservation.username,
						avatar: avatarUrl,
						reservations: [reservation]
					});
				}
			}
		});

		return Array.from(userGroups.values());
	}

	function calculateDuration(groupedUserReservation : any) {
		if (!groupedUserReservation || !groupedUserReservation.reservations || groupedUserReservation.reservations.length === 0) {
			return '0分钟';
		}

		let totalDurationMinutes = 0;
		groupedUserReservation.reservations.forEach((reservation : Reservation) => {
			totalDurationMinutes += (reservation.endTime - reservation.startTime) / (1000 * 60);
		});

		if (totalDurationMinutes < 60) {
			return `${totalDurationMinutes.toFixed(0)}分钟`; // 保留整数分钟
		} else {
			const hours = Math.floor(totalDurationMinutes / 60);
			const minutes = Math.floor(totalDurationMinutes % 60); // 取整分钟数
			return minutes > 0 ? `${hours}小时${minutes}分钟` : `${hours}小时`;
		}
	}

	function calculateTotalTimelineStyle(reservation : Reservation, dayStartTime : number, dayEndTime : number) {
		const totalDayTime = dayEndTime - dayStartTime;
		const reservationStartTimeInDay = Math.max(reservation.startTime, dayStartTime) - dayStartTime;
		const reservationEndTimeInDay = Math.min(reservation.endTime, dayEndTime) - dayStartTime;

		const segmentLeftPercentage = (reservationStartTimeInDay / totalDayTime) * 100;
		const segmentRightPercentage = 100 - (reservationEndTimeInDay / totalDayTime) * 100;

		return {
			left: `${segmentLeftPercentage}%`,
			right: `${segmentRightPercentage}%`,
			backgroundColor: '#FDE68A',
		};
	}

	function calculateUserTimelineStyle(reservation : Reservation, dayStartTime : number, dayEndTime : number) { // 函数签名保持不变，接收单个 reservation
		const totalDayTime = dayEndTime - dayStartTime;
		const reservationStartTimeInDay = Math.max(reservation.startTime, dayStartTime) - dayStartTime;
		const reservationEndTimeInDay = Math.min(reservation.endTime, dayEndTime) - dayStartTime;

		const segmentLeftPercentage = (reservationStartTimeInDay / totalDayTime) * 100;
		const segmentRightPercentage = 100 - (reservationEndTimeInDay / totalDayTime) * 100;

		return {
			left: `${segmentLeftPercentage}%`,
			right: `${segmentRightPercentage}%`,
			backgroundColor: '#FFC107',
		};
	}

	function goToReserve(machineName : String, machineID : String) {
		// 存储数据到 localStorage
		const orderData = {
			name: machineName,
			id: machineID
		};
		uni.setStorageSync('orderData', JSON.stringify(orderData)); // 存储为字符串

		uni.navigateTo({
			url: '/pages/order/order',
			success: function (res) {
			}
		});
	}
</script>

<style scoped>
	/* 全局样式 */
	.container {
		width: 100%;
		background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
		min-height: 100vh;
		box-sizing: border-box;
		padding: 20px;
		position: relative;
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

	/* 机台信息卡片 */
	.machine-info-card {
		margin-bottom: 24px;
	}

	.machine-info-header {
		display: flex;
		align-items: center;
		padding: 16px 8px;
	}

	.icon-container {
		display: flex;
		justify-content: center;
		align-items: center;
		background: linear-gradient(135deg, #FFC107 0%, #FF9800 100%);
		/* 黄色主题 */
		width: 60px;
		height: 60px;
		border-radius: 16px;
		margin-right: 16px;
		box-shadow: 0 4px 12px rgba(255, 193, 7, 0.4);
	}

	.machine-info {
		display: flex;
		flex-direction: column;
	}

	.machine-name {
		font-size: 20px;
		font-weight: bold;
		margin-bottom: 4px;
		color: #333;
	}

	.machine-price {
		font-size: 14px;
		color: #6b7280;
		font-weight: 500;
		padding: 4px 10px;
		background: rgba(255, 193, 7, 0.1);
		/* 黄色主题 */
		border-radius: 12px;
		align-self: flex-start;
	}

	/* 时间轴部分 */
	.timeline-section {
		padding: 16px 8px;
	}

	.date-text {
		font-size: 15px;
		color: #6b7280;
		margin-bottom: 12px;
		font-weight: 600;
	}

	.timeline-container {
		position: relative;
		width: 100%;
		margin-bottom: 8px;
	}

	.timeline-hours {
		display: flex;
		justify-content: space-between;
		margin-bottom: 8px;
	}

	.time-label {
		font-size: 12px;
		color: #9ca3af;
		font-weight: 500;
	}

	.timeline-bar {
		height: 12px;
		width: 100%;
		background-color: rgba(243, 244, 246, 0.7);
		border-radius: 6px;
		position: relative;
		overflow: hidden;
		box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.05);
	}

	.timeline-segment {
		position: absolute;
		top: 0;
		bottom: 0;
		border-radius: 6px;
		z-index: 2;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	/* 预约列表 */
	.reservation-list {
		margin-top: 16px;
	}

	.reservation-item {
		margin-bottom: 16px;
		transition: all 0.3s ease;
	}

	.reservation-item:active {
		transform: scale(0.98);
	}

	.reservation-header {
		display: flex;
		align-items: center;
		padding: 12px 8px;
		position: relative;
	}

	.avatar {
		width: 48px;
		height: 48px;
		border-radius: 50%;
		margin-right: 12px;
		border: 2px solid #fff;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		object-fit: cover;
	}

	.user-info {
		display: flex;
		flex-direction: column;
		flex: 1;
	}

	.username {
		font-size: 16px;
		font-weight: bold;
		margin-bottom: 4px;
		color: #333;
	}

	.reservation-count {
		font-size: 13px;
		color: #6b7280;
		background: rgba(243, 244, 246, 0.7);
		padding: 2px 8px;
		border-radius: 12px;
		align-self: flex-start;
	}

	.duration-badge {
		position: absolute;
		top: 12px;
		right: 12px;
		background: rgba(255, 193, 7, 0.1);
		/* 黄色主题 */
		padding: 4px 10px;
		border-radius: 12px;
		font-size: 12px;
		color: #FF9800;
		/* 黄色主题 */
		font-weight: 600;
	}

	.user-timeline-container {
		padding: 0 8px 8px 8px;
	}

	.user-timeline {
		height: 8px;
		background-color: rgba(243, 244, 246, 0.5);
	}

	.user-segment {
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	/* 浮动返回按钮 */
	.floating-back-btn {
		position: fixed;
		bottom: 24px;
		right: 24px;
		width: 48px;
		height: 48px;
		background: linear-gradient(135deg, #FFC107 0%, #FF9800 100%);
		/* 黄色主题 */
		border-radius: 50%;
		display: flex;
		justify-content: center;
		align-items: center;
		box-shadow: 0 4px 12px rgba(255, 193, 7, 0.4);
		z-index: 10;
		transition: all 0.3s ease;
	}

	.floating-back-btn:active {
		transform: scale(0.95);
		box-shadow: 0 2px 8px rgba(255, 193, 7, 0.3);
	}

	.reservation-times {
		display: flex;
		flex-direction: column;
		/* 垂直排列时间 */
		gap: 2px;
		/* 时间项之间的间距 */
		margin-top: 4px;
		/* 与 username 的间距 */
	}

	.reservation-time-item {
		font-size: 13px;
		color: #6b7280;
		background: rgba(243, 244, 246, 0.7);
		padding: 2px 8px;
		border-radius: 12px;
		align-self: flex-start;
		margin-bottom: 2px;
		/* 增加时间项之间的垂直间距 */
	}

	/* 去预约按钮样式 */
	.reserve-button {
		position: fixed;
		bottom: 20px;
		left: 50%;
		transform: translateX(-50%);
		width: 80%;
		max-width: 400px;
		/* 限制最大宽度 */
		padding: 12px 24px;
		background: linear-gradient(135deg, #FFC107 0%, #FF9800 100%);
		color: #fff;
		font-size: 16px;
		font-weight: 600;
		border-radius: 24px;
		box-shadow: 0 4px 12px rgba(255, 193, 7, 0.5);
		z-index: 10;
		transition: transform 0.2s ease, box-shadow 0.2s ease;
		border: none;
	}

	.reserve-button:active {
		transform: translateX(-50%) translateY(2px);
		box-shadow: 0 2px 8px rgba(255, 193, 7, 0.4);
	}

	/* 媒体查询：针对不同尺寸设备的响应式样式 */
	/* 小屏幕设备 */
	@media screen and (max-width: 375px) {
		.container {
			padding: 16px;
		}

		.machine-name {
			font-size: 18px;
		}

		.icon-container {
			width: 50px;
			height: 50px;
		}

		.avatar {
			width: 40px;
			height: 40px;
		}

		.floating-back-btn {
			bottom: 16px;
			right: 16px;
			width: 40px;
			height: 40px;
		}

		.reserve-button {
			font-size: 14px;
			padding: 10px 20px;
			border-radius: 20px;
		}
	}

	/* 底部区域 */
	.footer {
		position: fixed;
		bottom: 0;
		left: 0;
		width: 100%;
		background: rgba(255, 255, 255, 0.8);
		backdrop-filter: blur(10px);
		padding: 10px 0;
		border-top: 1px solid rgba(229, 231, 235, 0.8);
		box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.05);
		z-index: 100;
	}

	.price-summary {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0 20px;
		margin-bottom: 12px;
	}

	.price-amount {
		font-weight: bold;
		font-size: 20px;
		background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
	}

	.submit-button {
		background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
		border-radius: 8px;
		width: 80%;
		height: 50px !important;
		min-height: 45px;
		line-height: 45px;
		display: flex;
		justify-content: center;
		align-items: center;
		margin: 0 auto;
		font-weight: bold;
		color: white;
		font-size: 15px;
		box-shadow: 0 4px 12px rgba(249, 203, 20, 0.3);
		transition: all 0.3s;
		position: relative;
		overflow: hidden;
		box-sizing: border-box;
		padding: 0;
	}

	.submit-button:active {
		transform: scale(0.98);
		box-shadow: 0 2px 6px rgba(249, 203, 20, 0.3);
	}

	.submit-button::after {
		content: "";
		position: absolute;
		top: 0;
		left: -100%;
		width: 100%;
		height: 100%;
		background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
		transition: 0.5s;
	}

	.submit-button:active::after {
		left: 100%;
	}

	/* 大屏幕设备 */
	@media screen and (min-width: 768px) {
		.container {
			padding: 24px;
		}

		.glass-card {
			padding: 20px;
			border-radius: 24px;
		}

		.machine-info-card {
			margin-bottom: 30px;
		}

		.machine-name {
			font-size: 22px;
		}

		.icon-container {
			width: 70px;
			height: 70px;
			border-radius: 20px;
		}

		.timeline-bar {
			height: 16px;
			border-radius: 8px;
		}

		.timeline-segment {
			border-radius: 8px;
		}

		.avatar {
			width: 56px;
			height: 56px;
		}

		.username {
			font-size: 18px;
		}

		.reservation-count {
			font-size: 14px;
		}

		.reserve-button {
			font-size: 18px;
			padding: 14px 28px;
			border-radius: 28px;
		}
	}

	@media (prefers-color-scheme: dark) {
		.container {
			width: 100%;
			background: rgb(0, 0, 0);
			min-height: 100vh;
			box-sizing: border-box;
			padding: 20px;
			position: relative;
		}

		.glass-card {
			background: rgb(22, 22, 24);
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

		.machine-name {
			font-size: 20px;
			font-weight: bold;
			margin-bottom: 4px;
			color: white;
		}

		.machine-price {
			font-size: 14px;
			color: lightgray;
			font-weight: 500;
			padding: 4px 10px;
			background: rgb(59, 59, 61);
			/* 黄色主题 */
			border-radius: 12px;
			align-self: flex-start;
		}
		
		.username {
		    font-size: 16px;
		    font-weight: bold;
		    margin-bottom: 4px;
		    color: white;
		}
		
		.date-text {
		    font-size: 15px;
		    color: lightgray;
		    margin-bottom: 12px;
		    font-weight: 600;
		}
		
		.time-label {
		    font-size: 12px;
		    color: lightgray;
		    font-weight: 500;
		}
		
		.timeline-bar {
		    height: 12px;
		    width: 100%;
		    background-color: rgb(59, 59, 61);
		    border-radius: 6px;
		    position: relative;
		    overflow: hidden;
		    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.05);
		}
		
		.reservation-count {
		    font-size: 13px;
		    color: #6b7280;
		    background: rgba(243, 244, 246, 0.7);
		    padding: 2px 8px;
		    border-radius: 12px;
		    align-self: flex-start;
		}
		
		.duration-badge {
		    position: absolute;
		    top: 12px;
		    right: 12px;
		    background: rgb(59, 59, 61);
		    /* 黄色主题 */
		    padding: 4px 10px;
		    border-radius: 12px;
		    font-size: 12px;
		    color: lightgray;
		    /* 黄色主题 */
		    font-weight: 600;
		}
		/* 底部区域 */
		.footer {
			position: fixed;
			bottom: 0;
			left: 0;
			width: 100%;
			background: rgb(22, 22, 24);
			backdrop-filter: blur(10px);
			padding: 10px 0;
			border-top: 1px solid rgb(51, 49, 50);
			box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.05);
			z-index: 100;
		}
		
		.submit-button {
			background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
			border-radius: 8px;
			width: 80%;
			height: 50px !important;
			min-height: 45px;
			line-height: 45px;
			display: flex;
			justify-content: center;
			align-items: center;
			margin: 0 auto;
			font-weight: bold;
			color: white;
			font-size: 15px;
			box-shadow: 0 4px 12px rgba(249, 203, 20, 0.3);
			transition: all 0.3s;
			position: relative;
			overflow: hidden;
			box-sizing: border-box;
			padding: 0;
		}
		
		.submit-button:active {
			transform: scale(0.98);
			box-shadow: 0 2px 6px rgba(249, 203, 20, 0.3);
		}
	}
</style>