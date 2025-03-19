<template>
	<scroll-view>
		<view style="padding: 20rpx,20rpx;">
			<uni-row>
				<uni-col :span="4">
					<view class="icon">
						<uni-icons type="headphones" size="30"></uni-icons>
					</view>
				</uni-col>
				<uni-col :span="16">
					<view style="display: flex;
			 flex-direction: column; padding-left: 20rpx;">
						<text style="font-weight: bold;font-size: 35rpx;">{{machineName}}</text>
						<text>5元/半时</text>
					</view>
				</uni-col>
				<uni-col :span="4">
					<view style="display: flex; justify-content: center; padding-top: 20rpx;">

					</view>
				</uni-col>
			</uni-row>
		</view>

		<view class="divider" />
		<view>
			<wu-calendar :insert="true" type="week" :fold="false" startWeek="mon" color="#f9cb14"
				@change="calendarChange"></wu-calendar>
		</view>

		<view class="divider" />
		<view>
			<uni-title type="h1" title="已有预约时段"></uni-title>
			<text style="font-weight: bold;font-size: 50rpx;">这里是神秘条形图</text>
		</view>

		<view class="divider" />
		<view>
			<uni-title type="h1" title="确认预约信息"></uni-title>
			<view>
				<text>薄被，要在鱼窝过夜吗？</text>
				<uni-data-checkbox v-model="Data.isOvernight"
					:localdata="option"
					@change="setPrice()"></uni-data-checkbox>
			</view>

			<view v-if="Data.isOvernight">
				<view style="padding-top: 20rpx;">
					<view class="option">
						<text>预约日期</text>
						<picker mode="date" :value="selectedDate" :start="minDate" @change="onDateChange">
							<view class="picker-view">
								{{ selectedDate || '请选择日期' }}
							</view>
						</picker>
					</view>
					<view class="option" style="margin-top: 20rpx;">
						<text>开始时间</text>
						<picker mode="time" :value="selectedStartTime" @change="onStartTimeChange">
							<view class="picker-view">
								{{ selectedStartTime || '请选择时间' }}
							</view>
						</picker>
					</view>
					<uni-row class="attention">
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

			<view v-else style="display: flex;flex-direction: column;">
				<view style="padding-top: 20rpx;">
					<view class="option">
						<text>预约日期</text>
						<picker mode="date" :value="selectedDate" :start="minDate" @change="onDateChange">
							<view class="picker-view">
								{{ selectedDate || '请选择日期' }}
							</view>
						</picker>
					</view>
				</view>
				<view style="display: flex; justify-content: space-between; margin-top: 20rpx;">
					<view class="option">
						<text>开始时间</text>
						<picker mode="time" :value="selectedStartTime" @change="onStartTimeChange">
							<view class="picker-view">
								{{ selectedStartTime || '请选择时间' }}
							</view>
						</picker>
					</view>
					<view class="option">
						<text>结束时间</text>
						<picker mode="time" :value="selectedEndTime" @change="onEndTimeChange">
							<view class="picker-view">
								{{ selectedEndTime || '请选择时间' }}
							</view>
						</picker>
					</view>
				</view>
				<view style="padding-top: 20rpx;">
					<uni-row class="attention">
						<uni-col :span="4">
							<uni-icons type="checkbox" size="30" style="padding-left: 20rpx;"></uni-icons>
						</uni-col>
						<uni-col :span="14">预计时长：{{totalTimeText}}</uni-col>
						<uni-col :span="6">费用：¥{{price}}</uni-col>
					</uni-row>
				</view>
			</view>

		</view>
	</scroll-view>
	<text>订单详情</text><br/>
	<text>{{Data}}</text>

	<view class="divider" />
	<view style="display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;">

		<view class="price">
			<text>预计费用 </text>
			<text>¥{{price}}</text>
		</view>
		<view class="bt" @click="submitOrder()">
			<text>确认预约</text>
		</view>
	</view>

</template>

<script setup lang="ts">
	import dayjs from 'dayjs';
	import { ref, getCurrentInstance, onMounted, reactive, computed, watch } from 'vue';
	
	const todo = uniCloud.importObject('todo')
	const machineName = ref("")
	
	// 日期和时间选择器的值
	const selectedDate = ref('');
	const selectedStartTime = ref('');
	const selectedEndTime = ref('');
	
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
	
	const option = [
		{
			"value": false,
			"text": "不要过夜",
		},
		{
			"value": true,
			"text": "对！没错！我要过夜！",
		}
	];
	
	const price = ref(0);
	const totalTime = ref(0);
	
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
	
	// 设置价格
	function setPrice() {
		calculateTotalTimeAndPrice();
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
		
		// 清空时间选择
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
		
		// 设置当前时间为默认开始时间
		const now = dayjs();
		const roundedMinutes = Math.ceil(now.minute() / 30) * 30; // 向上取整到最近的半小时
		const startTime = now.minute(roundedMinutes).format('HH:mm');
		selectedStartTime.value = startTime;
		
		console.log(machineName.value);
		console.log(Data.machineId);
		Data.userId = res.uid;
	});
</script>

<style>
	/* 样式保持不变 */
	.divider {
		height: 2rpx;
		background-color: rgb(242, 242, 242);
		margin-top: 15rpx;
		margin-bottom: 15rpx;
	}

	.attention {
		background-color: rgb(253, 251, 231);
		display: flex;
		justify-content: center;
		align-items: center;
		align-self: center;
		align-content: center;
		border-radius: 20rpx;
		height: 90rpx;
	}

	.bt {
		background-color: rgb(249, 203, 20);
		display: flex;
		justify-content: center;
		align-items: center;
		border-radius: 20rpx;
		width: 80%;
		height: 80rpx;
	}

	.price {
		display: flex;
		width: 90%;
		justify-content: space-between;
	}

	.option {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
	}
	
	/* 新增样式 */
	.picker-view {
		height: 60rpx;
		line-height: 60rpx;
		padding: 0 20rpx;
		background-color: #f8f8f8;
		border-radius: 10rpx;
		min-width: 160rpx;
		text-align: center;
	}
</style>