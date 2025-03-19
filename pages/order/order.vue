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
			<text class="chart-placeholder">这里是神秘条形图</text>
		</view>

		<view class="divider" />
		<view class="booking-container">
			<uni-title type="h1" title="确认预约信息"></uni-title>

			<view style="margin-bottom: 10rpx;"> <!--  添加 debug 开关 -->
				<text style="margin-right: 20rpx;">Debug 信息:</text>
				<switch :checked="debug" @change="debugSwitchChange" />
			</view>

			<view>  <!-- 调整 segmented control 布局 -->
				<text class="segment-label">预约类型:</text>
			</view>
			<view class="segmented-control-container">
				<uni-segmented-control :values="segmentedValues" :current="segmentedCurrent"
					style-type="button" active-color="#f9cb14" @clickItem="onSegmentChange"></uni-segmented-control>
			</view>


			<view v-if="Data.isOvernight">
				<view class="time-selection">
					<view class="option">
						<text class="option-label">预约日期</text>
						<picker mode="date" :value="selectedDate" :start="minDate" @change="onDateChange">
							<view class="picker-view">
								<text>{{ selectedDate || '请选择日期' }}</text>
								<uni-icons type="down" size="16"></uni-icons>
							</view>
						</picker>
					</view>
					<view class="option">
						<text class="option-label">开始时间</text>
						<picker mode="time" :value="selectedStartTime" @change="onStartTimeChange">
							<view class="picker-view">
								<text>{{ selectedStartTime || '请选择时间' }}</text>
								<uni-icons type="down" size="16"></uni-icons>
							</view>
						</picker>
					</view>
					<uni-row class="attention-box">
						<uni-col :span="4">
							<uni-icons type="checkbox" size="30" style="padding-left: 20rpx;"></uni-icons>
						</uni-col>
						<uni-col :span="14">预计时长：包夜！</uni-col>
						<uni-col :span="6">费用：¥{{price}}</uni-col>
					</uni-row>
				</view>
			</view>

			<view v-else>
				<view class="time-selection">
					<view class="option">
						<text class="option-label">预约日期</text>
						<picker mode="date" :value="selectedDate" :start="minDate" @change="onDateChange">
							<view class="picker-view">
								<text>{{ selectedDate || '请选择日期' }}</text>
								<uni-icons type="down" size="16"></uni-icons>
							</view>
						</picker>
					</view>
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
							<uni-icons type="checkbox" size="30" style="padding-left: 20rpx;"></uni-icons>
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
	</scroll-view>
</template>

<script setup lang="ts">
	import dayjs from 'dayjs';
	import { ref, getCurrentInstance, onMounted, reactive, computed, watch } from 'vue';

	const todo = uniCloud.importObject('todo')
	const machineName = ref("")
	const debug = ref(false); // 设置为true可以显示订单详情调试信息

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
		"userId": string;
		"machineId": string;
		"startTime": number; // 使用 number 类型表示时间戳
		"endTime": number;   // 使用 number 类型表示时间戳
		"isOvernight": boolean;
		"status": string;
		"notes": string;
	}

	const Data = reactive<reservationData>({
		"userId": "",
		"machineId": "",
		"startTime": 0,
		"endTime": 0,
		"isOvernight": false,
		"status": "pending",
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
			const dateTimeStr = `${selectedDate.value} ${selectedStartTime.value}`;
			Data.startTime = dayjs(dateTimeStr).valueOf();
		}
	}

	// 更新结束时间戳
	function updateEndTimestamp() {
		if (selectedDate.value && selectedEndTime.value) {
			const dateTimeStr = `${selectedDate.value} ${selectedEndTime.value}`;
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
				diffHours = 24 + diffHours; // 假设是在同一天24小时内
			}

			totalTime.value = parseFloat(diffHours.toFixed(1));

			// 计算价格：5元/半小时
			price.value = Math.ceil(totalTime.value / 0.5) * 5;
		} else {
			totalTime.value = 0;
			price.value = 0;
		}
	}

	// 处理日期变化
	function onDateChange(e) {
		selectedDate.value = e.detail.value;
	}

	// 处理开始时间变化
	function onStartTimeChange(e) {
		selectedStartTime.value = e.detail.value;
	}

	// 处理结束时间变化
	function onEndTimeChange(e) {
		selectedEndTime.value = e.detail.value;
	}

	// 提交订单
	async function submitOrder() {
		// 验证是否选择了日期
		if (!selectedDate.value) {
			uni.showToast({
				title: '请选择预约日期',
				icon: 'none'
			});
			return;
		}

		// 验证是否选择了开始时间
		if (!selectedStartTime.value) {
			uni.showToast({
				title: '请选择开始时间',
				icon: 'none'
			});
			return;
		}

		// 如果不是过夜，验证结束时间
		if (!Data.isOvernight && !selectedEndTime.value) {
			uni.showToast({
				title: '请选择结束时间',
				icon: 'none'
			});
			return;
		}

		// 确保时间戳已更新
		updateStartTimestamp();
		if (!Data.isOvernight) {
			updateEndTimestamp();
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

		// 验证结束时间在开始时间之后
		if (!Data.isOvernight && Data.endTime <= Data.startTime) {
			uni.showToast({
				title: '结束时间必须晚于开始时间',
				icon: 'none'
			});
			return;
		}

		// 如果是过夜模式，清空结束时间
		if (Data.isOvernight) {
			Data.endTime = 0;
		}

		Data.status = "confirmed";

		try {
			const res = await todo.Reservation_Add(Data);
			uni.showToast({
				title: '预约成功',
				icon: 'success'
			});
		} catch (error) {
			uni.showToast({
				title: '预约失败: ' + error.message,
				icon: 'none'
			});
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
	}

	onMounted(() => {
		const instance = getCurrentInstance().proxy;
		const eventChannel = instance.getOpenerEventChannel();
		const res = uniCloud.getCurrentUserInfo('uni_id_token');

		eventChannel.on('acceptDataFromOpenerPage', function (data) {
			console.log('acceptDataFromOpenerPage', data);
			machineName.value = data.name;
			Data.machineId = data.id;
		});

		// 设置默认日期为今天
		selectedDate.value = dayjs().format('YYYY-MM-DD');

		// 设置当前时间为默认开始时间（向上取整到最近的半小时）
		const now = dayjs();
		const roundedMinutes = Math.ceil(now.minute() / 30) * 30; // 向上取整到最近的半小时
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
		margin: 30rpx 0 10rpx 0; /* 调整 margin-bottom */
	}

	.segment-label {
		font-size: 32rpx;
		margin-right: 20rpx;
		display: block; /*  让 label 独占一行 */
		margin-bottom: 10rpx; /*  label 与 segmentedControl 之间添加间距 */
	}

	/*  segmentedControl 容器样式，用于拉伸 */
	.segmented-control-container {
		width: 100%;
		padding: 0; /*  去除 padding */
	}

	/*  segmentedControl 组件样式，需要覆盖默认样式才能撑满容器 */
	.uni-segmented-control {
		width: 100%;
	}
	.uni-segmented-control__track {
		width: 100%;
	}
	.uni-segmented-control__item {
		flex: 1; /*  让 item 平分宽度 */
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
</style>
