<template>
	<scroll-view>
		<view class="header-container">
			<uni-row>
				<uni-col :span="4">
					<view class="icon">
						<uni-icons type="headphones" size="30"></uni-icons>
					</view>
				</uni-col>
				<uni-col :span="16">
					<view class="machine-info">
						<text class="machine-name">{{machineName}}</text>
						<text class="price-rate">5元/半时</text>
					</view>
				</uni-col>
			</uni-row>
		</view>

		<view class="divider" />
		<view class="calendar-container">
			<wu-calendar :insert="true" type="week" :fold="false" startWeek="mon" color="#f9cb14"
				@change="calendarChange"></wu-calendar>
		</view>

		<view class="divider" />
		<view class="chart-container">
			<uni-title type="h1" title="已有预约时段"></uni-title>

			<!-- 替换神秘条形图为实际的时间轴条形图 -->
			<view class="timeline-container mb-4">
				<view class="timeline-hours">
					<span>0:00</span>
					<span>6:00</span>
					<span>12:00</span>
					<span>18:00</span>
					<span>24:00</span>
				</view>
				<view class="timeline-bar">
					<view
						v-for="(reservation, index) in reservations"
						:key="index"
						class="timeline-segment"
						:style="calculateSegmentStyle(reservation)"
						@click="showReservationInfo(reservation)"
					></view>
				</view>
			</view>

			<!-- 图例 -->
			<view class="timeline-legend">
				<view class="legend-item">
					<view class="legend-color" style="background-color: #FDE68A;"></view>
					<text>已预约</text>
				</view>
				<view class="legend-item" v-if="currentSelection.startTime && currentSelection.endTime">
					<view class="legend-color" style="background-color: #34D399;"></view>
					<text>您的选择</text>
				</view>
			</view>

		</view>

		<view class="divider" />
		<view class="booking-container">
			<uni-title type="h1" title="确认预约信息"></uni-title>

			<view style="margin-bottom: 10rpx;">
				<text style="margin-right: 20rpx;">Debug 信息:</text>
				<switch :checked="debug" @change="debugSwitchChange" />
			</view>

			<view>
				<text class="segment-label">预约类型:</text>
			</view>
			<view class="segmented-control-container">
				<uni-segmented-control :values="segmentedValues"
				:current="segmentedCurrent" style-type="button"
					active-color="#f9cb14" @clickItem="onSegmentChange"></uni-segmented-control>
			</view>


			<view v-if="Data.isOvernight">
				<view class="time-selection">
					<uni-row class="attention-box">
						<uni-col :span="4">
							<uni-icons type="checkbox"
							size="30"
							style="padding-left: 20rpx;"></uni-icons>
						</uni-col>
						<uni-col :span="14">预计时长：包夜！</uni-col>
						<uni-col :span="6">费用：¥{{price}}</uni-col>
					</uni-row>
				</view>
			</view>

			<view v-else>
				<view class="time-selection">
				</view>
				<view class="time-range">
					<view class="option">
						<text class="option-label">开始时间</text>
						<picker mode="time" :value="selectedStartTime" @change="onStartTimeChange">
							<view class="picker-view">
								<text>{{ selectedStartTime || '请选择时间' }}</text>
								<uni-icons type="down" size="16"></uni-icons>
							</view>
						</picker>
					</view>
					<view class="option">
						<text class="option-label">结束时间</text>
						<picker mode="time" :value="selectedEndTime" @change="onEndTimeChange">
							<view class="picker-view">
								<text>{{ selectedEndTime || '请选择时间' }}</text>
								<uni-icons type="down" size="16"></uni-icons>
							</view>
						</picker>
					</view>
				</view>
				<view>
					<uni-row class="attention-box">
						<uni-col :span="4">
							<uni-icons type="checkbox"
							size="30"
							style="padding-left: 20rpx;"></uni-icons>
						</uni-col>
						<uni-col :span="14">预计时长：{{totalTimeText}}</uni-col>
						<uni-col :span="6">费用：¥{{price}}</uni-col>
					</uni-row>
				</view>
			</view>
		</view>

		<view class="order-detail" v-if="debug">
			<text>订单详情</text><br />
			<text>{{Data}}</text>
		</view>


	</scroll-view>
	<view class="divider" />
	<view class="footer">
		<view class="price-summary">
			<text>预计费用 </text>
			<text class="price-amount">¥{{price}}</text>
		</view>
		<view class="submit-button" @click="submitOrder()">
			<text>确认预约</text>
		</view>
	</view>

</template>

<script setup lang="ts">
	import dayjs from 'dayjs';
	import { ref, getCurrentInstance, onMounted, reactive, computed, watch } from 'vue';

	const todo = uniCloud.importObject('todo')
	const machineName = ref("")
	const debug = ref(false);

	// 新增 - 显示已有预约的相关变量和函数
	const reservations = ref([]);
	const currentSelection = reactive({
		startTime: 0,
		endTime: 0
	});

	// 监听您的选择变化，更新当前选择的时间段
	watch([() => Data.startTime, () => Data.endTime], ([newStartTime, newEndTime]) => {
		if (newStartTime && newEndTime) {
			currentSelection.startTime = newStartTime;
			currentSelection.endTime = newEndTime;
		}
	});


	// 日期和时间选择器的值
	const selectedDate = ref('');
	const selectedStartTime = ref('');
	const selectedEndTime = ref('');

	// uni-segmented-control相关
	const segmentedValues = ['普通预约', '过夜预约'];
	const segmentedCurrent = ref(0);

	// 计算最小日期（今天）
	const minDate = computed(() => dayjs().format('YYYY-MM-DD'));

	interface reservationData {
		"userId" : string;
		"machineId" : string;
		"startTime" : number;
		"endTime" : number;
		"isOvernight" : boolean;
		"status" : number;
		"notes" : string;
	}

	const Data = reactive<reservationData>({
		"userId": "",
		"machineId": "",
		"startTime": 0,
		"endTime": 0,
		"isOvernight": false,
		"status": 0,
		"notes": ""
	});

	const price = ref(0);
	const totalTime = ref(0);

	// 处理debug开关变化
	function debugSwitchChange(e) {
		debug.value = e.detail.value;
	}

	// 处理分段控制器变化
	function onSegmentChange(e) {
		segmentedCurrent.value = e.currentIndex;
		Data.isOvernight = e.currentIndex === 1;
		if (Data.isOvernight) {
			//过夜预约默认开始时间
			selectedStartTime.value = '22:00';
		} else {
			// 普通预约恢复开始时间为当前时间
			const now = dayjs();
			const roundedMinutes = Math.ceil(now.minute() / 30) * 30;
			selectedStartTime.value = now.minute(roundedMinutes % 60).hour(now.hour() + Math.floor(roundedMinutes / 60)).format('HH:mm');
		}
		updateStartTimestamp(); // 更新时间戳
		calculateTotalTimeAndPrice();
	}

	// 计算并格式化总时长
	const totalTimeText = computed(() => {
		if (Data.startTime && Data.endTime && !Data.isOvernight) {
			const start = dayjs(Data.startTime);
			const end = dayjs(Data.endTime);
			const diffHours = end.diff(start, 'hour', true);
			return diffHours.toFixed(1) + ' 小时';
		}
		return '0 小时';
	});

	// 监听日期、时间变化，更新时间戳
	watch([selectedDate, selectedStartTime], () => {
		updateStartTimestamp();
	});

	watch([selectedDate, selectedEndTime], () => {
		updateEndTimestamp();
	});

	// 监听时间戳变化，计算总时长和价格
	watch([() => Data.startTime, () => Data.endTime, () => Data.isOvernight], () => {
		calculateTotalTimeAndPrice();
	});

	// 更新开始时间戳
	function updateStartTimestamp() {
		if (selectedDate.value && selectedStartTime.value) {
			const dateTimeStr = `${selectedDate.value || dayjs().format('YYYY-MM-DD')} ${selectedStartTime.value}`;  // 如果没有选择日期，使用今天
			Data.startTime = dayjs(dateTimeStr).valueOf();
		}
	}

	// 更新结束时间戳
	function updateEndTimestamp() {
		if (selectedDate.value && selectedEndTime.value) {
			const dateTimeStr = `${selectedDate.value || dayjs().format('YYYY-MM-DD')} ${selectedEndTime.value}`; // 如果没有选择日期，使用今天
			Data.endTime = dayjs(dateTimeStr).valueOf();
		}
	}

	// 计算总时长和价格
	function calculateTotalTimeAndPrice() {
		if (Data.isOvernight) {
			price.value = 50;
			return;
		}

		if (Data.startTime && Data.endTime) {
			const start = dayjs(Data.startTime);
			const end = dayjs(Data.endTime);

			// 处理跨天情况（结束时间小于开始时间）
			let diffHours = end.diff(start, 'hour', true);
			if (diffHours < 0) {
				diffHours = 24 + diffHours;
			}

			totalTime.value = parseFloat(diffHours.toFixed(1));

			// 计算价格：5元/半小时
			price.value = Math.ceil(totalTime.value / 0.5) * 5;
		} else {
			totalTime.value = 0;
			price.value = 0;
		}
	}

	// 处理开始时间变化
	function onStartTimeChange(e) {
		selectedStartTime.value = e.detail.value;
	}

	// 处理结束时间变化
	function onEndTimeChange(e) {
		selectedEndTime.value = e.detail.value;
	}

	// 检查时间冲突
	function checkTimeConflict() {
		// 检查所选时间是否与已有预约冲突
		for (const reservation of reservations.value) {
			// 跳过状态为取消的预约
			if (reservation.status === 0) continue;

			// 检查是否有重叠
			const hasOverlap = (
				(Data.startTime >= reservation.startTime && Data.startTime < reservation.endTime) ||
				(Data.endTime > reservation.startTime && Data.endTime <= reservation.endTime) ||
				(Data.startTime <= reservation.startTime && Data.endTime >= reservation.endTime)
			);

			if (hasOverlap) {
				return true;
			}
		}

		return false;
	}

	// 获取某一天的机器预约信息
	async function getReservationsForDate(machineId, date) {
		try {
			// 计算当天的开始和结束时间戳
			const startOfDay = dayjs(date).startOf('day').valueOf();
			const endOfDay = dayjs(date).endOf('day').valueOf();

			console.log(`正在获取机器 ${machineId} 在 ${date} 的预约信息`);
			console.log(`时间范围: ${startOfDay} - ${endOfDay}`);

			// 调用云函数获取预约信息
			const result = await todo.GetMachineReservationInfo(startOfDay, endOfDay, machineId);

			// 检查返回结果格式并适当处理
			if (Array.isArray(result)) {
				// 如果直接返回数组
				if (result.length > 0 && result[0].reservations) {
					// 找到该机器的预约信息
					const machineData = result.find(item => item.machineInfo._id === machineId);
					if (machineData) {
						reservations.value = machineData.reservations;
					} else {
						reservations.value = [];
					}
				} else {
					// 直接使用结果作为预约列表
					reservations.value = result;
				}
			} else if (result && result.result) {
				// 如果返回包含 result 字段的对象
				const machineData = result.result.find(item => item.machineInfo._id === machineId);
				if (machineData) {
					reservations.value = machineData.reservations;
				} else {
					reservations.value = [];
				}
			} else {
				console.error("返回的数据格式不正确:", result);
				reservations.value = [];
			}

			console.log("获取到的预约信息:", reservations.value);
		} catch (error) {
			console.error("获取预约信息失败:", error);
			uni.showToast({
				title: '获取预约信息失败',
				icon: 'none'
			});
			reservations.value = [];
		}
	}

	// 计算条形图中预约段的样式
	function calculateSegmentStyle(reservation) {
		// 获取当前选择的日期的开始和结束时间戳
		const dayStartTime = dayjs(selectedDate.value).startOf('day').valueOf();
		const dayEndTime = dayjs(selectedDate.value).endOf('day').valueOf();
		const totalDayTime = dayEndTime - dayStartTime; // 一天的总时长（毫秒）

		// 确保预约时间在当天范围内
		const reservationStartTimeInDay = Math.max(reservation.startTime, dayStartTime) - dayStartTime;
		const reservationEndTimeInDay = Math.min(reservation.endTime, dayEndTime) - dayStartTime;

		// 计算百分比位置
		const segmentLeftPercentage = (reservationStartTimeInDay / totalDayTime) * 100;
		const segmentRightPercentage = 100 - (reservationEndTimeInDay / totalDayTime) * 100;

		// 如果是当前选择的时间段，使用不同颜色
		const isCurrentSelection =
			reservation.startTime === currentSelection.startTime &&
			reservation.endTime === currentSelection.endTime;

		return {
			left: `${segmentLeftPercentage}%`,
			right: `${segmentRightPercentage}%`,
			backgroundColor: isCurrentSelection ? '#34D399' : '#FDE68A'
		};
	}

	// 显示预约详情
	function showReservationInfo(reservation) {
		// 计算开始和结束时间的可读格式
		const startTime = dayjs(reservation.startTime).format('HH:mm');
		const endTime = dayjs(reservation.endTime).format('HH:mm');

		uni.showToast({
			title: `该时段已被预约 (${startTime}-${endTime})`,
			icon: 'none',
			duration: 2000
		});
	}


	// 提交订单
	async function submitOrder() {
		// 验证开始时间 (普通预约需要选择开始时间)
		if (!Data.isOvernight && !selectedStartTime.value) {
			uni.showToast({
				title: '请选择开始时间',
				icon: 'none'
			});
			return;
		}

		// 确保时间戳已更新
		updateStartTimestamp();
		// 普通预约需要结束时间
		if (!Data.isOvernight) {
			if (!selectedEndTime.value) {
				uni.showToast({
					title: '请选择结束时间',
					icon: 'none'
				});
				return;
			}
			updateEndTimestamp();
		} else {
			// 过夜预约，默认结束时间为第二天早上8点 (假设)
			const startTimeDayjs = dayjs(Data.startTime);
			Data.endTime = startTimeDayjs.add(10, 'hour').valueOf(); // 假设过夜时长为10小时，结束时间为第二天早上8点 (22:00 + 10 hours = 08:00 next day)
		}


		// 验证当前时间
		const now = Date.now();
		if (Data.startTime < now) {
			uni.showToast({
				title: '开始时间不能早于当前时间',
				icon: 'none'
			});
			return;
		}

		// 验证结束时间在开始时间之后 (仅普通预约)
		if (!Data.isOvernight && Data.endTime <= Data.startTime) {
			uni.showToast({
				title: '结束时间必须晚于开始时间',
				icon: 'none'
			});
			return;
		}

		// 检查时间冲突
		const hasConflict = checkTimeConflict();
		if (hasConflict) {
			uni.showToast({
				title: '所选时间段与已有预约冲突',
				icon: 'none'
			});
			return;
		}

		Data.status = 1;
		
				try {
					uni.showLoading({
						title: '提交中...'
					});
		
					const res = await todo.Reservation_Add(Data);
		
					uni.hideLoading();
		
					if (res && res.errCode) { // Check for error response from cloud function
						uni.showToast({
							title: '预约失败: ' + (res.errMsg || '未知错误'), // Display error message from cloud function
							icon: 'none'
						});
					} else {
						uni.showToast({
							title: '预约成功',
							icon: 'success'
						});
						// **在这里调用 getReservationsForDate 函数刷新预约条**
						getReservationsForDate(Data.machineId, selectedDate.value);
					}
		
		
				} catch (error) { // Catch network errors or other unexpected issues in calling cloud function
					uni.hideLoading();
					uni.showToast({
						title: '预约失败: 网络错误或未知错误',
						icon: 'none'
					});
					console.error("Error calling Reservation_Add:", error); // Log error in frontend console as well
				}
	}

	// 处理日历变化
	function calendarChange(e) {
		// 更新选择的日期
		selectedDate.value = e.fulldate;

		// 检查是否选择了过去的日期
		if (dayjs(e.fulldate).isBefore(dayjs(), 'day')) {
			uni.showToast({
				title: '不能选择过去的日期',
				icon: 'none'
			});
			selectedDate.value = dayjs().format('YYYY-MM-DD');
		}

		// 获取所选日期的预约信息
		if (Data.machineId) {
			getReservationsForDate(Data.machineId, selectedDate.value);
		}
	}

	onMounted(() => {
		const instance = getCurrentInstance().proxy;
		const eventChannel = instance.getOpenerEventChannel();
		const res = uniCloud.getCurrentUserInfo('uni_id_token');

		eventChannel.on('acceptDataFromOpenerPage', function (data) {
			console.log('acceptDataFromOpenerPage', data);
			machineName.value = data.name;
			Data.machineId = data.id;

			// 设置默认日期为今天并获取预约信息
			selectedDate.value = dayjs().format('YYYY-MM-DD');
			getReservationsForDate(data.id, selectedDate.value);
		});

		// 设置默认日期为今天
		selectedDate.value = dayjs().format('YYYY-MM-DD');

		// 设置普通预约默认开始时间为当前时间（向上取整到最近的半小时）
		const now = dayjs();
		const roundedMinutes = Math.ceil(now.minute() / 30) * 30;
		selectedStartTime.value = now.minute(roundedMinutes % 60).hour(now.hour() + Math.floor(roundedMinutes / 60)).format('HH:mm');

		Data.userId = res.uid;
	});
</script>

<style>
	/* 优化后的样式 */
	.header-container {
		padding: 20rpx;
	}

	.machine-info {
		display: flex;
		flex-direction: column;
		padding-left: 20rpx;
	}

	.machine-name {
		font-weight: bold;
		font-size: 35rpx;
	}

	.price-rate {
		font-size: 28rpx;
		color: #666;
	}

	.divider {
		height: 2rpx;
		background-color: rgb(242, 242, 242);
		margin: 20rpx 0;
	}

	.calendar-container {
		margin-bottom: 15rpx;
	}

	.chart-container {
		padding: 0 20rpx;
		margin-bottom: 15rpx;
	}

	.chart-placeholder {
		font-weight: bold;
		font-size: 50rpx;
		color: #ccc;
		display: block;
		text-align: center;
		padding: 30rpx 0;
	}

	.booking-container {
		padding: 0 20rpx;
		margin-bottom: 15rpx;
	}

	/* 移除 segment-container 的 flex 布局 */
	.segment-container {
		/* display: flex;  */
		/* align-items: center; */
		margin: 30rpx 0 10rpx 0;
		/* 调整 margin-bottom */
	}

	.segment-label {
		font-size: 32rpx;
		margin-right: 20rpx;
		display: block;
		/*  让 label 独占一行 */
		margin-bottom: 10rpx;
		/*  label 与 segmentedControl 之间添加间距 */
	}

	/*  segmentedControl 容器样式，用于拉伸 */
	.segmented-control-container {
		width: 100%;
		padding: 0;
		/*  去除 padding */
	}

	/*  segmentedControl 组件样式，需要覆盖默认样式才能撑满容器 */
	.uni-segmented-control {
		width: 100%;
	}

	.uni-segmented-control__track {
		width: 100%;
	}

	.uni-segmented-control__item {
		flex: 1;
		/*  让 item 平分宽度 */
	}


	.time-selection {
		margin-top: 20rpx;
	}

	.time-range {
		display: flex;
		justify-content: space-between;
		margin-top: 20rpx;
	}

	.option {
		display: flex;
		flex-direction: column;
		margin-bottom: 30rpx;
		width: 48%;
	}

	.option-label {
		font-size: 28rpx;
		color: #333;
		margin-bottom: 10rpx;
	}

	.picker-view {
		height: 80rpx;
		line-height: 80rpx;
		padding: 0 30rpx;
		background-color: #f8f8f8;
		border-radius: 10rpx;
		display: flex;
		align-items: center;
		justify-content: space-between;
		min-width: 200rpx;
	}

	.attention-box {
		background-color: rgb(253, 251, 231);
		display: flex;
		align-items: center;
		border-radius: 20rpx;
		height: 90rpx;
		padding: 0 10rpx;
		margin: 10rpx 0 30rpx 0;
		box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.1);
	}

	.order-detail {
		padding: 20rpx;
		background-color: #f8f8f8;
		border-radius: 10rpx;
		margin: 20rpx;
		font-size: 24rpx;
	}

	.footer {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		padding: 20rpx 0 40rpx 0;
	}

	.price-summary {
		display: flex;
		width: 90%;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20rpx;
	}

	.price-amount {
		font-weight: bold;
		font-size: 40rpx;
		color: #f9cb14;
	}

	.submit-button {
		background-color: #f9cb14;
		display: flex;
		justify-content: center;
		align-items: center;
		border-radius: 20rpx;
		width: 80%;
		height: 90rpx;
		font-weight: bold;
		box-shadow: 0 4rpx 12rpx rgba(249, 203, 20, 0.3);
		transition: all 0.3s;
	}

	.submit-button:active {
		transform: scale(0.98);
		box-shadow: 0 2rpx 6rpx rgba(249, 203, 20, 0.3);
	}

	/* timeline chart 样式 */
	.timeline-container {
		position: relative;
		height: 60rpx;
		background-color: #f0f0f0;
		border-radius: 10rpx;
		overflow: hidden;
	}

	.timeline-hours {
		display: flex;
		justify-content: space-between;
		padding: 0 10rpx;
		font-size: 24rpx;
		color: #999;
		position: relative;
		z-index: 1; /* 确保小时刻度在条形图上方 */
	}

	.timeline-hours span {
		position: relative;
	}

	.timeline-hours span::before {
		content: '';
		position: absolute;
		left: 50%;
		top: 25rpx;
		transform: translateX(-50%);
		width: 2rpx;
		height: 10rpx;
		background-color: #ccc;
	}

	.timeline-hours span:first-child::before {
		display: none; /* 隐藏 0:00 前面的刻度 */
	}

	.timeline-bar {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		overflow: hidden; /* 裁剪超出容器的 segment */
	}

	.timeline-segment {
		position: absolute;
		top: 10rpx;
		bottom: 10rpx;
		background-color: #FDE68A;
		border-radius: 5rpx;
		min-width: 2rpx; /* 保证 segment 可见 */
	}

	.timeline-legend {
		display: flex;
		justify-content: flex-end;
		margin-top: 10rpx;
		font-size: 24rpx;
		color: #666;
	}

	.legend-item {
		display: flex;
		align-items: center;
		margin-left: 20rpx;
	}

	.legend-color {
		width: 20rpx;
		height: 20rpx;
		border-radius: 50%;
		margin-right: 10rpx;
	}

	.mb-4 {
		margin-bottom: 15rpx;
	}
</style>
