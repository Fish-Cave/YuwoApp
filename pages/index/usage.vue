<template>
	<view class="container">
		<view v-for="machineData in machineReservationData" :key="machineData.machineInfo.machinenum"
			class="machine-item">
			<view class="glass-card">
				<!-- 机台信息区域 -->
				<view class="card-header">
					<view class="icon-container">
						<uni-icons type="headphones" size="30" color="#ffffff"></uni-icons>
					</view>
					<view class="machine-info">
						<text class="machine-name">{{ machineData.machineInfo.name }}</text>
						<view class="price-status-container">
							<!-- 会员价格显示逻辑 -->
							<text v-if="membershipType === 'weekly_monthly'" class="machine-price">包周/月价 0元/半时</text>
							<text v-else-if="membershipType === 'music_game'" class="machine-price">会员价 4元/半时</text>
							<text v-else class="machine-price">5元/半时</text>

							<view class="status-label"
								:class="{'status-available': machineData.machineInfo.status === 0, 'status-error': machineData.machineInfo.status !== 0 }">
								{{ machineData.machineInfo.status === 0 ? '可用' : '故障' }}
							</view>
						</view>
					</view>
					<view class="heart-icon" @click="toggleFavorite(machineData.machineInfo._id)">
						<uni-icons :type="favorites.has(machineData.machineInfo._id) ? 'heart-filled' : 'heart'"
							size="24" color="#f472b6"></uni-icons>
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
					    <view v-for="(reservation, index) in mergeReservations(machineData.reservations)" :key="index"
					      class="timeline-segment"
					      :style="calculateSegmentStyle(reservation, startTime, endTime)">
					      <view class="timeline-segment-pulse"></view>
					      <view v-if="getReservationCount(machineData.reservations, reservation) > 1" class="reservation-count">
					        {{ getReservationCount(machineData.reservations, reservation) }}
					      </view>
					    </view>
					  </view>
					</view>
				</view>

				<!-- 按钮区域 -->
				<view class="button-group">
					<view v-if="(isSuperUser || isUser)"
						class="action-button view-button" @click="viewReservations(machineData)">
						<uni-icons type="staff" size="20" color="#4b5563"></uni-icons>
						<text class="button-text">查看预约</text>
					</view>
					<view v-else-if="machineData.machineInfo.status == 0 && (isSuperUser == false && isUser == false)"
						class="action-button needlog-button" @click="unlogin()">
						<uni-icons type="eye-slash" size="20" color="#ffffff"></uni-icons>
						<text class="button-text error-text">登陆后查看</text>
					</view>
					<view v-if="machineData.machineInfo.status == 0 &&(isSuperUser || isUser)"
						class="action-button reserve-button"
						@click="goOrder(machineData.machineInfo.name, machineData.machineInfo._id)">
						<uni-icons type="personadd" size="20" color="#ffffff"></uni-icons>
						<text class="button-text reserve-text">预约</text>
					</view>
					<view v-else-if="machineData.machineInfo.status == 1" class="action-button error-button"
						@click="unuseable()">
						<uni-icons type="close" size="20" color="#ffffff"></uni-icons>
						<text class="button-text error-text">机台故障</text>
					</view>
					<view v-else-if="machineData.machineInfo.status == 0 && (isSuperUser == false && isUser == false)"
						class="action-button needlog-button" @click="unlogin()">
						<uni-icons type="close" size="20" color="#ffffff"></uni-icons>
						<text class="button-text error-text">登陆后预约</text>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup lang="ts">
	import { onMounted, reactive, ref, watch, onShow } from 'vue';
	import dayjs from 'dayjs';
	import { store, mutations } from '@/uni_modules/uni-id-pages/common/store.js'
	const uniIdCo = uniCloud.importObject("uni-id-co")
	const isSuperUser = ref(false)
	const isUser = ref(false)
	const membershipType = ref("none"); // "none", "music_game", "weekly_monthly"

	function roleJudge() {
		const res = uniCloud.getCurrentUserInfo('uni_id_token')
		if (res.role.includes("admin") || res.role.includes("superUser")) {
			isSuperUser.value = true
		} else if (res.role.includes("user")) {
			isSuperUser.value = false
			isUser.value = true
		}
		getMembershipStatus(); // 获取会员状态
	}

	// 使用云对象的 getUserMembershipInfo 方法获取会员状态
	async function getMembershipStatus() {
	    try {
	        const userInfo = uniCloud.getCurrentUserInfo();
	        if (!userInfo || !userInfo.uid) {
	            console.log('未登录或无法获取用户ID');
	            membershipType.value = "none";
	            return;
	        }
	        
	        // 调用云对象方法获取会员信息
	        const result = await todo.getUserMembershipInfo(userInfo.uid);
	        console.log("会员信息查询结果:", result);
	        
	        if (result) {
	            // 检查包周/月会员
	            if (result.subscriptionPackage && result.subscriptionPackage.length > 0) {
	                membershipType.value = "weekly_monthly";
	                console.log('用户拥有包周/月会员');
	            } 
	            // 检查音游会员
	            else if (result.membership && result.membership.length > 0) {
	                membershipType.value = "music_game";
	                console.log('用户拥有音游会员');
	            } 
	            // 无会员
	            else {
	                membershipType.value = "none";
	                console.log('用户没有会员');
	            }
	        } else {
	            membershipType.value = "none";
	            console.log('获取会员信息失败或用户没有会员');
	        }
	    } catch (error) {
	        console.error("获取会员信息失败:", error);
	        membershipType.value = "none"; // 错误时默认为非会员
	    }
	}

	uni.$on('uni-id-pages-login-success', () => {
		roleJudge();
	});
	const todo = uniCloud.importObject('todo')
	interface machine {
		"_id": string;
		"name": string;
		"capacity": number;
		"status": number;
		"machinenum": number;
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

	function unuseable() {
		uni.showToast({
			icon: "error",
			title: "机台故障",
		})
	}
	function unlogin() {
		uni.showToast({
			icon: "error",
			title: "请先登录",
		})
		uni.reLaunch({
			url: '/uni_modules/uni-id-pages/pages/login/login-withpwd'
		})
	}

	function viewReservations(machineData) {
		// 存储数据到 localStorage
		const detailData = {
			GetMachineReservationInfo: machineData
		};
		uni.setStorageSync('detailData', JSON.stringify(detailData)); // 存储为字符串

		console.log("查看预约信息：", machineData);
		uni.navigateTo({
			url: '/pages/usageDetail/usageDetail',
			success: function (res) {
				//res.eventChannel.emit('acceptDataFromOpenerPage', {
				//  GetMachineReservationInfo: machineData  // 传递整个 machineData 对象
				//});
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

	function goOrder(machineName: String, machineID: String) {
	  const orderData = {
	    name: machineName,
	    id: machineID,
	    startTime: props.startTime,
	    endTime: props.endTime
	  };
	  uni.setStorageSync('orderData', JSON.stringify(orderData));
	
	  uni.navigateTo({
	    url: '/pages/order/order',
	    success: function (res) {
	      res.eventChannel.emit('acceptDataFromOpenerPage', {
	        'name': machineName,
	        'id': machineID,
	        'startTime': props.startTime,
	        'endTime': props.endTime
	      })
	    }
	  });
	}

	const machineReservationData = ref<Array<{
		machineInfo: machine,
		reservations: Reservation[]
	}>>([]) // 初始化为空数组

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
		roleJudge();
		
		// 尝试从本地存储加载收藏状态
		try {
			const storedFavorites = uni.getStorageSync('machine_favorites');
			if (storedFavorites) {
				favorites.value = new Set(JSON.parse(storedFavorites));
			}
		} catch (e) {
			console.error("读取收藏状态失败:", e);
		}
	})
	
	// 页面显示时刷新数据和会员状态
	uni.$on('onShow', () => {
		loadMachineReservations(); // 每次页面显示时刷新
		getMembershipStatus(); // 刷新会员状态
	});
	
	// 预约成功后刷新数据
	uni.$on('reservationSuccess', () => {
		loadMachineReservations();
	});
	
	// 计算条形图 segment 的样式
	function calculateSegmentStyle(reservation: Reservation, dayStartTime: number, dayEndTime: number) {
		const totalDayTime = dayEndTime - dayStartTime; // 一天的总时长（毫秒）
		const reservationStartTimeInDay = Math.max(reservation.startTime, dayStartTime) - dayStartTime; // 预约开始时间在一天中的偏移量
		const reservationEndTimeInDay = Math.min(reservation.endTime, dayEndTime) - dayStartTime; // 预约结束时间在一天中的偏移量
	
		const segmentLeftPercentage = (reservationStartTimeInDay / totalDayTime) * 100;
		const segmentRightPercentage = 100 - (reservationEndTimeInDay / totalDayTime) * 100;
	
		return {
			left: `${segmentLeftPercentage}%`,
			right: `${segmentRightPercentage}%`,
			background: 'linear-gradient(90deg, rgba(255,193,7,0.5) 0%, rgba(252,211,77,0.8) 100%)'
		};
	}
	
	function mergeReservations(reservations) {
	  if (!reservations || reservations.length === 0) return [];
	  
	  // 按开始时间排序
	  const sortedReservations = [...reservations].sort((a, b) => a.startTime - b.startTime);
	  
	  const mergedReservations = [];
	  let currentMerged = {...sortedReservations[0]};
	  
	  for (let i = 1; i < sortedReservations.length; i++) {
	    const current = sortedReservations[i];
	    
	    // 如果当前预约与合并中的预约有重叠，则合并
	    if (current.startTime <= currentMerged.endTime) {
	      // 更新结束时间为较晚的那个
	      currentMerged.endTime = Math.max(currentMerged.endTime, current.endTime);
	    } else {
	      // 没有重叠，将当前合并的添加到结果中，并开始新的合并
	      mergedReservations.push(currentMerged);
	      currentMerged = {...current};
	    }
	  }
	  
	  // 添加最后一个合并的预约
	  mergedReservations.push(currentMerged);
	  
	  return mergedReservations;
	}
	
	function getReservationCount(allReservations, mergedReservation) {
	  // 计算有多少预约与当前合并的预约时间段有重叠
	  return allReservations.filter(res => 
	    (res.startTime <= mergedReservation.endTime && res.endTime >= mergedReservation.startTime)
	  ).length;
	}
	
	// 更新收藏状态到本地存储
	function saveUserFavorites() {
		try {
			uni.setStorageSync('machine_favorites', JSON.stringify([...favorites.value]));
		} catch (e) {
			console.error("保存收藏状态失败:", e);
		}
	}
	
	// 修改toggleFavorite函数以保存收藏状态
	function toggleFavorite(machineId: string) {
		if (favorites.value.has(machineId)) {
			favorites.value.delete(machineId);
		} else {
			favorites.value.add(machineId);
		}
		
		// 保存到本地存储
		saveUserFavorites();
		
		uni.showToast({
			icon: 'success',
			title: favorites.value.has(machineId) ? '已加入收藏' : '已取消收藏',
			duration: 1500
		});
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
		align-items: flex-start;
		/* 顶部对齐 */
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

	.status-label {
		background: rgba(59, 130, 246, 0.15);
		color: #3b82f6;
		padding: 4rpx 16rpx;
		border-radius: 12rpx;
		font-size: 24rpx;
		font-weight: 600;
		margin-left: 10rpx;
	}

	.status-available {
		background-color: rgba(76, 175, 80, 0.2);
		/* 浅绿色背景 */
		color: #4CAF50;
		/* 绿色文字 */
	}

	.status-error {
		background-color: rgba(244, 67, 54, 0.2);
		/* 浅红色背景 */
		color: #f44336;
		/* 红色文字 */
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
	.reservation-count {
	  position: absolute;
	  top: 5rpx;
	  right: 15rpx;
	  background-color: #e29a09;
	  color: white;
	  border-radius: 50%;
	  width: 20rpx;
	  height: 20rpx;
	  font-size: 20rpx;
	  display: flex;
	  justify-content: center;
	  align-items: center;
	  font-weight: bold;
	  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
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

	.needlog-button {
		background: linear-gradient(135deg, #D3D3D3 0%, #B0B0B0 100%);
		color: #ffffff;
	}

	.button-text {
		margin-left: 10rpx;
		font-size: 28rpx;
		white-space: nowrap;
		font-weight: 500;
	}

	.reserve-text,
	.error-text {
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
		align-items: center;
		/* 垂直居中对齐 */
	}
</style>
