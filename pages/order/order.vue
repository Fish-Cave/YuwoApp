<template>
	<view class="container" style="padding:20rpx 10rpx">
		<uv-datetime-picker ref="startTimePicker" v-model="selectedStartTime" mode="time" :minHour="minStartTimeHour"
			:maxHour="maxStartTimeHour" :filter="timeFilter" @confirm="confirmStartTime"></uv-datetime-picker>
		<uv-datetime-picker ref="endTimePicker" v-model="selectedEndTime" mode="time" :minHour="minEndTimeHour"
			:maxHour="maxEndTimeHour" :filter="timeFilter" :minMinute="minEndTimeMinute"
			@confirm="confirmEndTime"></uv-datetime-picker>
		<scroll-view scroll-y class="scroll-view">
			<view class="glass-card">
				<view>
					<uni-row>
						<uni-col :span="4">
							<view class="icon">
								<uni-icons type="headphones" size="30"></uni-icons>
							</view>
						</uni-col>
						<uni-col :span="16">
							<view class="machine-info">
								<text class="machine-name">{{machineName}}</text>
								<text class="price-rate">{{ displaySinglePrice }}</text>
							</view>
						</uni-col>
					</uni-row>
				</view>
				<view class="tips-container">
					<text class="tips">
						目前预约时间和实际游玩时间并不强关联，因此并不会收取超时费用，请按实际游玩时间进行结算
					</text>
				</view>
			</view>


			<view class="calendar-container glass-card">
				<wu-calendar :insert="true" :date="selectedDate" type="week" :fold="false" startWeek="mon"
					color="#f59e0b" mode="single" @change="calendarChange">
				</wu-calendar>
			</view>


			<view class="chart-container glass-card" v-if="!isNoPlayMachine">
				<view style="margin-bottom: 20rpx;">
					<text class="title">已有预约时段</text>
				</view>

				<view class="timeline-hours">
					<span>0:00</span>
					<span>6:00</span>
					<span>12:00</span>
					<span>18:00</span>
					<span>24:00</span>
				</view>

				<view class="timeline-container mb-4">

					<view class="timeline-bar">
						<view v-for="(reservation, index) in reservations" :key="index" class="timeline-segment"
							:style="calculateSegmentStyle(reservation)" @click="showReservationInfo(reservation)">
						</view>
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

			<view class="booking-container glass-card">
				<view style="margin-bottom: 20rpx;">
					<text class="title">确认预约信息</text>
				</view>


				<view v-if="res.role.includes('admin')" style="margin-bottom: 10rpx;">
					<text style="margin-right: 20rpx;">Debug 信息:</text>
					<switch :checked="debug" @change="debugSwitchChange" />
				</view>

				<view v-if="!isNoPlayMachine">
					<text class="segment-label">预约类型:</text>
				</view>
				<view class="segmented-control-container" v-if="!isNoPlayMachine">
					<uni-segmented-control :values="segmentedValues" :current="segmentedCurrent" style-type="button"
						active-color="#f9cb14" @clickItem="onSegmentChange"></uni-segmented-control>
				</view>

				<!-- 橙色提示信息 -->
				<view v-if="showNormalBookingTimeExpiredWarning && !isNoPlayMachine" class="booking-time-warning">
					<uni-icons type="warning-filled" color="#f9cb14" size="16" style="margin-right: 5rpx;">
					</uni-icons>
					已超过普通预约时间，请选择夜间预约
				</view>

				<view v-if="Data.isOvernight && !isNoPlayMachine">
					<view class="time-selection">
						<uni-row class="attention-box">
							<uni-col :span="4">
								<uni-icons type="checkbox" size="30" style="padding-left: 20rpx;"></uni-icons>
							</uni-col>
							<uni-col :span="13">预计时长：包夜！</uni-col>
							<uni-col :span="7">费用：¥{{price}}</uni-col>
						</uni-row>
					</view>
				</view>

				<view v-else>
					<view class="time-selection">
					</view>
					<view class="time-range">
						<view class="option">
							<text class="option-label">开始时间</text>
							<view class="picker-view" @click="openStartTimePicker">
								<text>{{ selectedStartTime || '请选择时间' }}</text>
								<uni-icons type="down" size="16"></uni-icons>
							</view>

						</view>
						<view class="option">
							<text class="option-label">结束时间</text>
							<view class="picker-view" @click="openEndTimePicker">
								<text>{{ selectedEndTime || '请选择时间' }}</text>
								<uni-icons type="down" size="16"></uni-icons>
							</view>
						</view>
					</view>
					<view>
						<uni-row class="attention-box">
							<uni-col :span="4">
								<uni-icons type="checkbox" size="30" style="padding-left: 20rpx;"></uni-icons>
							</uni-col>
							<uni-col :span="13">
								<text class="details">
									预计时长：{{totalTimeText}}
								</text></uni-col>
							<uni-col :span="7">
								<text class="details">
									费用：¥{{price}}
								</text>

							</uni-col>
						</uni-row>
					</view>
				</view>

				<view class="membership-info"
					v-if="( (membershipInfo.membership.length > 0) && Data.isPlay == false) || membershipInfo.subscriptionPackage.length > 0">
					<view style="margin-bottom: 20rpx;">
						<text class="title">会员信息</text>
					</view>

					<view class="membership-card">
						<view v-if="(membershipInfo.membership.length > 0) && Data.isPlay == false"
							class="membership-item">
							<uni-icons type="star-filled" size="20" color="#f59e0b" class="membership-icon"></uni-icons>
							<text class="membership-text">您是鱼窝歇脚卡会员，本次休息免费</text>
						</view>
						<view v-if="membershipInfo.subscriptionPackage.length > 0" class="membership-item">
							<uni-icons type="medal-filled" size="20" color="#10b981"
								class="membership-icon"></uni-icons>
							<text class="membership-text">您是包周/月会员，本次预约免费</text>
						</view>
					</view>
				</view>

			</view>

			<view class="order-detail glass-card" v-if="debug">
				<text>订单详情</text><br />
				<text>{{Data}}</text><br />
				<text>单价:{{singlePrice}} 过夜价:{{overnightPrice}}</text><br />
				<text>会员信息: {{ membershipInfo }}</text>
				<text>是否不游玩机台: {{ isNoPlayMachine }}</text>
			</view>
		</scroll-view>

		<view class="footer">
			<view class="price-summary">
				<text class="details">预计费用 </text>
				<text class="price-amount">¥{{price}}</text>
			</view>
			<view v-if="isUserFree" class="submit-button" @click="submitOrder()">
				<text>确认预约</text>
			</view>
			<view v-else class="arrears-button" @click="arrears()">
				<text>欠费不能预约❌</text>
			</view>
		</view>
	</view>
</template>

<script setup lang="ts">
	import dayjs from 'dayjs';
	import { ref, getCurrentInstance, onMounted, reactive, computed, watch, toRaw } from 'vue';
	import holiday2025 from '@/static/holiday/2025.json'
	const todo = uniCloud.importObject('todo')
	const siginHandler = uniCloud.importObject('signinHandler')
	const reservationHandler = uniCloud.importObject('reservationHandler')
	const orderHandler = uniCloud.importObject('orderHandler')

	const machineName = ref("")
	const debug = ref(false);
	const isNoPlayMachine = ref(false); // 新增：是否是不游玩机台的标志

	//通过在本地缓存的token来获取用户信息
	const res = uniCloud.getCurrentUserInfo('uni_id_token')
	console.log(res)
	const premission = (res.role.includes("user") || res.role.includes("admin"))
	//console.log(premission)
	//建立预约信息Data
	interface reservationData {
		"userId" : string;
		"machineId" : string;
		"startTime" : number;
		"endTime" : number;
		"isOvernight" : boolean;
		"status" : number;
		"notes" : string;
		"price" : number; // 添加 price 字段,应当以分为单位
		"isPlay" : boolean; // 新增:是否游玩机台
		"machineName" : string;//新增:机台名称,减少后期查表次数
	}

	const Data = reactive<reservationData>({
		"userId": "",
		"machineId": "",
		"startTime": 0,
		"endTime": 0,
		"isOvernight": false,
		"status": 0,
		"notes": "",
		"price": 0, // 初始化 price 为 0,以分为单位
		"isPlay": true,// 默认为true，表示游玩机台
		"machineName": "",
	});


	//会员信息
	const membershipInfo = reactive({
		membership: [],
		subscriptionPackage: []
	})




	//判断是否有未完成的订单
	const isUserFree = ref(true)
	async function setIsUserFree() {
		try {
			const [UnhandleOrder, HandlerOrder] = await Promise.all([
				orderHandler.GetUnhandleOrder(res.uid),
				orderHandler.GetHandleOrderByuid(res.uid)
			],
			)
			if (UnhandleOrder.data.length || HandlerOrder.data.length) {
				isUserFree.value = false
			}
		} catch (e) { }
	}
	function arrears() {
		uni.showToast({
			title: "您有未支付的游玩费用,无法预约新的订单",
			icon: "error"
		})
	}

	//价格相关
	//pricelist是一个包含两个对象的价格表数组
	interface priceList {
		_id : string;
		price : number;
		noplayprice : number
	}
	const pricelist = ref<priceList[]>([])
	const singlePrice = ref(5)
	const overnightPrice = ref(50)
	const noplayprice = ref(1)

	// 用于展示的价格，会根据会员信息变化
	const displaySinglePrice = computed(() => {
		// 先检查是否是不游玩机台
		if (isNoPlayMachine.value) {
			if (membershipInfo.subscriptionPackage.length > 0 || membershipInfo.membership.length > 0) {
				return "会员/鱼窝歇脚卡免费";
			} else {
				return "1元/半小时";
			}
		}

		// 常规机台价格显示逻辑
		if (membershipInfo.subscriptionPackage.length > 0) {
			return "包周/月会员免费";
		} else {
			return `${singlePrice.value}元/半小时`;
		}
	});

	//改成byweekdays
	async function getPriceList() {
		try {
			console.log(selectedDate.value)
			const now = dayjs(selectedDate.value + 24).format('YYYY-MM-DD')
			console.log(now)
			const result = holiday2025.days.find(data => data.date == now)
			console.log(result)
			//判断预约当天的隔一天是否是法定节假日
			if (result?.isOffDay) {
				//如果隔一天是法定节假日按照忙时定价
				const result = await todo.GetPriceInfoByWeekdays(0)
				pricelist.value = result.data
				singlePrice.value = toRaw(pricelist.value[0]).price
				noplayprice.value = toRaw(pricelist.value[0]).noplayprice
				overnightPrice.value = toRaw(pricelist.value[1]).price
				calculateTotalTimeAndPrice()
			} else if (result?.isOffDay == false) {
				//如果隔一天是调整后的工作日按照闲时定价
				const result = await todo.GetPriceInfoByWeekdays(1)
				pricelist.value = result.data
				singlePrice.value = toRaw(pricelist.value[0]).price
				noplayprice.value = toRaw(pricelist.value[0]).noplayprice
				overnightPrice.value = toRaw(pricelist.value[1]).price
				calculateTotalTimeAndPrice()
			} else {
				console.log("当前选择星期为" + dayjs(selectedDate.value).day())
				const now = dayjs(selectedDate.value).format('YYYY-MM-DD')
				//如果当天放假,按照忙时计费
				if (holiday2025.days.find(data => data.date == now)?.isOffDay) {
					const result = await todo.GetPriceInfoByWeekdays(0)
					pricelist.value = result.data
				} else {
					const result = await todo.GetPriceInfoByWeekdays(dayjs(selectedDate.value).day())
					pricelist.value = result.data
				}
				//console.log(result.data)
				//console.log(toRaw(pricelist.value[0]))
				singlePrice.value = toRaw(pricelist.value[0]).price
				noplayprice.value = toRaw(pricelist.value[0]).noplayprice
				overnightPrice.value = toRaw(pricelist.value[1]).price
				//更新价格后对费用进行更新
				calculateTotalTimeAndPrice()
			}
		} catch (error) {
			console.error("获取价格信息失败", error);
		}
	}

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

	// uv-datetime-picker ref
	const startTimePicker = ref(null);
	const endTimePicker = ref(null);

	// 可选时间范围限制
	const minStartTimeHour = ref(0);
	const maxStartTimeHour = ref(22); // 普通预约最大时间 22:00
	const minEndTimeHour = ref(0);
	const maxEndTimeHour = ref(22);
	const minEndTimeMinute = ref(0); // 新增结束时间分钟限制

	// 用于控制是否显示橙色提示信息
	const showNormalBookingTimeExpiredWarning = ref(false);

	// uni-segmented-control相关
	const segmentedValues = ['普通预约', '过夜预约'];
	const segmentedCurrent = ref(0);

	// 计算最小日期（今天）
	const minDate = computed(() => dayjs().format('YYYY-MM-DD'));


	const price = ref(0);
	const totalTime = ref(0);

	// 处理debug开关变化
	function debugSwitchChange(e) {
		debug.value = e.detail.value;
	}

	function updateBookingType() {
		showNormalBookingTimeExpiredWarning.value = false; // 每次更新前先隐藏警告

		// 判断是否是未来日期
		const isFutureDate = dayjs(selectedDate.value).isAfter(dayjs(), 'day');

		if (Data.isOvernight && !isNoPlayMachine.value) { // 只有非不游玩机台才允许过夜预约
			// 过夜预约默认开始时间
			selectedStartTime.value = '22:00';
			minStartTimeHour.value = 22;
			maxStartTimeHour.value = 22;
			minEndTimeHour.value = 0;
			maxEndTimeHour.value = 8;
			minEndTimeMinute.value = 0;
		} else {
			// 普通预约恢复普通时间限制
			updateMinStartTime(selectedDate.value);
			minEndTimeHour.value = 8; // 普通预约最早结束时间
			maxEndTimeHour.value = 22; // 普通预约最晚结束时间
			minEndTimeMinute.value = 0;

			// 只有当选择的日期是今天时，才判断当前时间是否超过 22:00
			if (dayjs(selectedDate.value).isSame(dayjs(), 'day')) {
				const now = dayjs();
				if (now.hour() >= 22) {
					// 如果是今天且已超过22:00，强制切换到过夜预约
					segmentedCurrent.value = 1;
					Data.isOvernight = true;
					showNormalBookingTimeExpiredWarning.value = true;
				} else {
					showNormalBookingTimeExpiredWarning.value = false;
				}
			} else {
				// 如果是未来日期，确保不显示警告
				showNormalBookingTimeExpiredWarning.value = false;
			}
		}
	}

	// 处理分段控制器变化
	function onSegmentChange(e) {
		segmentedCurrent.value = e.currentIndex;
		Data.isOvernight = e.currentIndex === 1;
		updateBookingType(); // 调用更新预约类型函数
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
	watch([() => Data.startTime, () => Data.endTime, () => Data.isOvernight, membershipInfo, isNoPlayMachine], () => {
		calculateTotalTimeAndPrice();
	});

	// 更新开始时间戳
	function updateStartTimestamp() {
		if (selectedDate.value && selectedStartTime.value) {
			const dateTimeStr = `${selectedDate.value || dayjs().format('YYYY-MM-DD')} ${selectedStartTime.value}`; // 如果没有选择日期，使用今天
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
		// 如果是不游玩机台
		if (isNoPlayMachine.value) {
			if (membershipInfo.subscriptionPackage.length > 0 || membershipInfo.membership.length > 0) {
				// 如果是周卡月卡会员或音游会员，不游玩机台免费
				price.value = 0;
				Data.price = 0;
			} else {
				// 非会员，不游玩机台每半小时1元
				const diffHours = (Data.endTime - Data.startTime) / (1000 * 60 * 60);
				const halfHourUnits = Math.ceil(diffHours / 0.5);
				price.value = halfHourUnits * noplayprice.value; // 每半小时noplayprice元
				Data.price = price.value * 100;
			}
			return;
		}

		if (membershipInfo.subscriptionPackage.length > 0) {
			// 包周/月卡会员，免费游玩机台 off
			price.value = 0;
			Data.price = 0;
			return;
		}

		if (Data.isOvernight && !isNoPlayMachine.value) { // 只有非不游玩机台才允许过夜预约
			price.value = overnightPrice.value;
			Data.price = overnightPrice.value * 100;
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
			console.log("totalTime = " + totalTime.value)

			//现已删除音游会员
			/*if (membershipInfo.membership.length > 0) {
				// 音游会员价格计算
				const halfHourUnits = Math.ceil(totalTime.value / 0.5);
				let basePrice = halfHourUnits * 4;
				price.value = Math.min(basePrice, 40); // 日常上限40元
				Data.price = price.value;
			}*/
			// 非会员价格计算 (保持原有逻辑，五小时以上50元)
			price.value = overnightPrice.value
			if (totalTime.value < 5) {
				price.value = Math.ceil(totalTime.value / 0.5) * singlePrice.value;
			}
			Data.price = price.value * 100;


		} else {
			totalTime.value = 0;
			price.value = 0;
			Data.price = 0;
		}
	}

	// 打开开始时间选择器
	function openStartTimePicker() {
		startTimePicker.value.open();
	}

	// 打开结束时间选择器
	function openEndTimePicker() {
		endTimePicker.value.open();
	}

	// 确认开始时间
	function confirmStartTime(e) {
		selectedStartTime.value = e.value;

		// 更新开始时间戳
		updateStartTimestamp();

		// 计算结束时间（开始时间 + 30分钟）
		const dateStr = selectedDate.value || dayjs().format('YYYY-MM-DD');
		const startTimeArr = selectedStartTime.value.split(':');
		const startHour = parseInt(startTimeArr[0]);
		const startMinute = parseInt(startTimeArr[1]);

		// 计算结束时间（小时和分钟）
		let endHour = startHour;
		let endMinute = startMinute + 30;

		// 处理进位
		if (endMinute >= 60) {
			endHour += 1;
			endMinute -= 60;
		}

		// 格式化结束时间
		const formattedEndHour = endHour.toString().padStart(2, '0');
		const formattedEndMinute = endMinute.toString().padStart(2, '0');
		selectedEndTime.value = `${formattedEndHour}:${formattedEndMinute}`;

		// 更新结束时间戳
		updateEndTimestamp();
	}

	// 确认结束时间
	function confirmEndTime(e) {
		selectedEndTime.value = e.value;
	}


	// 时间过滤器函数
	function timeFilter(type : string, options : number[]) {
		if (type === 'minute') {
			return options.filter((option) => option % 30 === 0);
		}
		return options;
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

	// 更新最小开始时间
	function updateMinStartTime(dateStr ?: string) { // dateStr 参数为可选
		const now = dayjs();
		let targetDate = dayjs(); // 默认为今天

		if (dateStr) {
			targetDate = dayjs(dateStr);
		}

		if (targetDate.isAfter(now, 'day')) {
			// 如果选择的日期是未来日期，则最小开始时间为当天的 08:00
			minStartTimeHour.value = 8;
			selectedStartTime.value = '08:00';
		} else {
			// 如果选择的日期是今天或过去（虽然日历组件已限制过去日期，但作为保护）
			if (now.hour() >= 21 && now.minute() > 30) {
				// 超过 21:30，普通预约只能选择 21:30 - 22:00
				minStartTimeHour.value = 21;
				maxStartTimeHour.value = 22;
				selectedStartTime.value = '21:30'; // 默认开始时间 21:30
			} else if (now.hour() >= 22) {
				// 超过 22:00，普通预约不可选，强制过夜预约 (在 onSegmentChange 中处理)
				minStartTimeHour.value = 22; // 实际上不会用到，因为会被强制切换到过夜
				maxStartTimeHour.value = 22;
				selectedStartTime.value = '22:00'; // 默认开始时间 22:00 (虽然会被强制切换)
			}
			else {
				// 正常情况下，8:00 - 22:00 范围，且只能向后选
				minStartTimeHour.value = 8; // 正常开始时间 08:00
				maxStartTimeHour.value = 22;
				const roundedMinutes = Math.ceil(now.minute() / 30) * 30;
				const roundedTime = now.minute(roundedMinutes % 60).hour(now.hour() + Math.floor(roundedMinutes / 60));

				// 最小开始时间不能早于 8:00
				const earliestStartTime = dayjs().hour(8).minute(0).second(0);
				let calculatedStartTime = roundedTime;
				if (calculatedStartTime.isBefore(earliestStartTime)) {
					calculatedStartTime = earliestStartTime;
				}


				// 如果当前时间是整点或者30分，直接设置 selectedStartTime，否则需要加30分钟
				if (now.minute() % 30 === 0) {
					selectedStartTime.value = calculatedStartTime.format('HH:mm');
				} else {
					selectedStartTime.value = calculatedStartTime.add(30, 'minute').format('HH:mm');
				}
			}
		}
		if (minStartTimeHour.value < 8) minStartTimeHour.value = 8; // 确保最小开始时间不低于 8:00
		if (maxStartTimeHour.value > 22) maxStartTimeHour.value = 22; // 确保最大开始时间不高于 22:00

	}

	// 处理日历变化
	function calendarChange(e) {
		// 更新选择的日期
		selectedDate.value = e.fulldate;
		getPriceList()
		// 检查是否选择了过去的日期
		if (dayjs(e.fulldate).isBefore(dayjs(), 'day')) {
			uni.showToast({
				title: '不能选择过去的日期',
				icon: 'none'
			});
			selectedDate.value = dayjs().format('YYYY-MM-DD');
			return; // 如果选择了过去日期，直接返回，不进行后续预约类型更新
		}

		// 如果选择了未来日期，自动切换回普通预约
		if (dayjs(e.fulldate).isAfter(dayjs(), 'day')) {
			segmentedCurrent.value = 0; // 切换到普通预约
			Data.isOvernight = false;
		}

		updateBookingType(); // 日期更改后更新预约类型
		updateMinStartTime(selectedDate.value); // 更新最小开始时间，传入 selectedDate

		// 获取所选日期的预约信息
		if (Data.machineId && !isNoPlayMachine.value) { // 如果不是不游玩机台，才获取预约信息
			getReservationsForDate(Data.machineId, selectedDate.value);
		} else {
			reservations.value = []; // 不游玩机台不显示预约信息
		}
	}

	// 不游玩机台的初始设置
	function setupNoPlayMachine() {
		// 强制设置为普通预约
		segmentedCurrent.value = 0;
		Data.isOvernight = false;

		// 添加isPlay字段，设置为false表示不游玩机台
		Data.isPlay = false;

		// 隐藏时间选择器，设置默认时间
		selectedStartTime.value = '08:00';
		selectedEndTime.value = '08:30';
		updateStartTimestamp();
		updateEndTimestamp();

		// 更新价格计算逻辑
		calculateTotalTimeAndPrice();
	}


	onMounted(async () => {
		const instance = getCurrentInstance().proxy;

		// 获取会员信息
		try {
			const membershipResult = await todo.getUserMembershipInfo(res.uid);
			if (membershipResult && membershipResult.errCode) {
				uni.showToast({
					title: '获取会员信息失败: ' + membershipResult.errMsg,
					icon: 'none',
					duration: 3000
				});
			} else if (membershipResult) {
				membershipInfo.membership = membershipResult.membership;
				membershipInfo.subscriptionPackage = membershipResult.subscriptionPackage;
			}
		} catch (e) {
			console.error("获取会员信息异常", e);
			uni.showToast({
				title: '获取会员信息异常',
				icon: 'none',
				duration: 3000
			});
		}

		// 尝试从 localStorage 获取数据
		const storedData = uni.getStorageSync('orderData');
		if (storedData) {
			const orderData = JSON.parse(storedData);
			machineName.value = orderData.name;
			Data.machineName = machineName.value;
			Data.machineId = orderData.id;

			// 新增: 检查是否是不游玩机台
			isNoPlayMachine.value = orderData.isNoPlay === true;

			// 新增: 检查是否有时间戳并同步到日历
			if (orderData.startTime && orderData.endTime) {
				// 使用传入的时间戳更新日历
				const dateStr = dayjs(orderData.startTime).format('YYYY-MM-DD');
				selectedDate.value = dateStr;

				// 获取所选日期的预约信息
				if (!isNoPlayMachine.value) { // 如果不是"不游玩机台"，才获取预约信息
					getReservationsForDate(Data.machineId, selectedDate.value);
				}

				selectedStartTime.value = dayjs(orderData.startTime).format('HH:mm');
				selectedEndTime.value = dayjs(orderData.endTime).format('HH:mm');
				updateStartTimestamp();
				updateEndTimestamp();

			} else {
				// 默认设置为今天
				selectedDate.value = dayjs().format('YYYY-MM-DD');
				// 获取所选日期的预约信息
				if (!isNoPlayMachine.value) {
					getReservationsForDate(Data.machineId, selectedDate.value);
				}
			}
		} else {
			// 如果 localStorage 中没有数据，则尝试从 eventChannel 获取
			const eventChannel = instance.getOpenerEventChannel();
			eventChannel.on('acceptDataFromOpenerPage', function (data) {
				console.log('acceptDataFromOpenerPage', data);
				machineName.value = data.name;
				Data.machineName = machineName.value;
				Data.machineId = data.id;

				// 新增: 检查是否是不游玩机台
				isNoPlayMachine.value = data.isNoPlay === true;

				// 新增: 检查是否有时间戳并同步到日历
				if (data.startTime && data.endTime) {
					// 使用传入的时间戳更新日历
					const dateStr = dayjs(data.startTime).format('YYYY-MM-DD');
					selectedDate.value = dateStr;

					// 获取所选日期的预约信息
					if (!isNoPlayMachine.value) { // 如果不是"不游玩机台"，才获取预约信息
						getReservationsForDate(data.id, selectedDate.value);
					}
					selectedStartTime.value = dayjs(data.startTime).format('HH:mm');
					selectedEndTime.value = dayjs(data.endTime).format('HH:mm');
					updateStartTimestamp();
					updateEndTimestamp();
				} else {
					// 设置默认日期为今天
					selectedDate.value = dayjs().format('YYYY-MM-DD');
					// 获取所选日期的预约信息
					if (!isNoPlayMachine.value) {
						getReservationsForDate(data.id, selectedDate.value);
					}
				}
			});

			// 设置默认日期为今天
			selectedDate.value = dayjs().format('YYYY-MM-DD');
		}

		getPriceList()
		updateBookingType(); // **页面加载时初始化预约类型**
		updateMinStartTime(selectedDate.value); // 初始化时传入 selectedDate
		Data.userId = res.uid;

		// 新增: 设置不游玩机台的初始值
		if (isNoPlayMachine.value) {
			setupNoPlayMachine();
		}
		// 新增: 查看当前用户是否有为完成付款的订单
		setIsUserFree()
	});

	// 提交订单
	async function submitOrder() {
		// 验证开始时间 (普通预约需要选择开始时间)
		if (!isNoPlayMachine.value && !Data.isOvernight && !selectedStartTime.value) {
			uni.showToast({
				title: '请选择开始时间',
				icon: 'none'
			});
			return;
		}

		// 确保时间戳已更新
		updateStartTimestamp();

		// 普通预约需要结束时间
		if (!isNoPlayMachine.value && !Data.isOvernight) {
			if (!selectedEndTime.value) {
				uni.showToast({
					title: '请选择结束时间',
					icon: 'none'
				});
				return;
			}
			updateEndTimestamp();
		} else if (Data.isOvernight && !isNoPlayMachine.value) { // 只有非不游玩机台才允许过夜预约
			// 过夜预约，默认结束时间为第二天早上8点
			const startTimeDayjs = dayjs(Data.startTime);
			Data.endTime = startTimeDayjs.add(10, 'hour').valueOf();
		} else if (isNoPlayMachine.value) {
			// 不游玩机台，使用默认时间
			updateStartTimestamp();
			updateEndTimestamp();
		}


		// 1. 参数验证
		if (!Data.startTime || !Data.endTime || !Data.machineId || !Data.userId) {
			uni.showToast({
				title: '缺少必要参数',
				icon: 'none'
			});
			return;
		}
		// 2. 时间范围验证
		if (Data.startTime >= Data.endTime) {
			uni.showToast({
				title: '开始时间必须早于结束时间',
				icon: 'none'
			});
			return;
		}

		// 设置预约状态
		Data.status = 1;

		// 确保isPlay字段正确设置
		Data.isPlay = !isNoPlayMachine.value;

		//判断是否有权限预约
		if (premission != true) {
			uni.showToast({
				title: "您还没有预约权限,请联系管理员申请权限",
				icon: 'error'
			})
			return
		}

		try {
			uni.showLoading({
				title: '提交中...'
			});

			// 直接调用后端，让后端进行剩余的验证
			const res = await reservationHandler.Reservation_Add(Data);
			uni.hideLoading();
			// 处理后端返回的各种错误码
			if (res && res.errCode === 'TIME_CONFLICT') {
				uni.showToast({
					title: res.errMsg,
					icon: 'none',
					duration: 3000
				});
			} else if (res && res.errCode === 'DB_ERROR') {
				uni.showToast({
					title: res.errMsg,
					icon: 'none',
					duration: 3000
				});
			} else {
				uni.showToast({
					title: '预约成功',
					icon: 'success'
				});
				uni.$emit('reservationSuccess');
				uni.navigateBack();
			}
			/* 没有错误码了 //还是有的
			if (res && res.errCode === 'CAPACITY_EXCEEDED') {
				uni.showToast({
					title: res.errMsg,
					icon: 'none',
					duration: 3000
				});
			} else if (res && res.errCode === 'TIME_CONFLICT') {
				uni.showToast({
					title: res.errMsg,
					icon: 'none',
					duration: 3000
				});
			} else if (res && res.errCode === 'MACHINE_NOT_FOUND') {
				uni.showToast({
					title: res.errMsg,
					icon: 'none',
					duration: 3000
				});
			} else if (res && res.errCode === 'INVALID_TIME_RANGE') {
				uni.showToast({
					title: res.errMsg,
					icon: 'none',
					duration: 3000
				});
			} else if (res && res.errCode === 'INVALID_PARAMS') {
				uni.showToast({
					title: res.errMsg,
					icon: 'none',
					duration: 3000
				});
			} else if (res && res.errCode !== 0) {
				uni.showToast({
					title: '预约失败: ' + (res.errMsg || '未知错误'),
					icon: 'none'
				});
			} else if (res && res.errCode == 0) {
				uni.showToast({
					title: '预约成功',
					icon: 'success'
				});
				uni.$emit('reservationSuccess');
				uni.navigateBack();
			} else {
				uni.showToast({
					title: '预约成功',
					icon: 'success'
				});
				uni.$emit('reservationSuccess');
				uni.navigateBack();
			}
			*/
		} catch (e) {
			uni.hideLoading();
			uni.showToast({
				title: '预约失败: 网络错误或未知错误',
				icon: 'none'
			});
			console.error("Error calling Reservation_Add:", e);
		}
	}
</script>
<style>
	/* 全局样式 */
	.container {
		width: 100%;
		background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
		min-height: 100vh;
		box-sizing: border-box;
		padding: 30px;
		position: relative;
	}

	.title {
		color: black;
		font-weight: bold;
		font-size: 30rpx;
	}

	/* 滚动视图样式 */
	.scroll-view {
		width: 100%;
		box-sizing: border-box;
		padding-bottom: 120px;
		/* 底部内边距，为固定底部区域留出空间 */
	}

	/* 玻璃拟态卡片 */
	.glass-card {
		background: rgba(255, 255, 255, 0.7);
		backdrop-filter: blur(10px);
		border-radius: 20px;
		box-shadow: 0 8px 32px rgba(31, 38, 135, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.18);
		overflow: visible;
		padding: 16px;
		margin-bottom: 20px;
		margin-left: 10px;
		margin-right: 10px;
		transition: transform 0.3s ease, box-shadow 0.3s ease;
	}

	.glass-card:active {
		transform: translateY(2px);
		box-shadow: 0 4px 16px rgba(31, 38, 135, 0.08);
	}

	/* 头部容器样式 */
	.header-container {
		display: flex;

		align-items: center;
		padding: 16px;
	}

	.icon {
		display: flex;
		justify-content: center;
		align-items: center;
		background: linear-gradient(135deg, #FFC107 0%, #FF9800 100%);
		width: 48px;
		height: 48px;
		border-radius: 12px;
		box-shadow: 0 4px 12px rgba(255, 193, 7, 0.4);
		margin-right: 300px;
	}

	.machine-info {
		flex: 1;
		display: flex;
		flex-direction: column;
	}

	.machine-name {
		font-weight: bold;
		font-size: 18px;
		color: #333;
		margin-bottom: 4px;
	}

	.price-rate {
		font-size: 13px;
		color: #6b7280;
		background: rgba(255, 193, 7, 0.1);
		padding: 2px 8px;
		border-radius: 12px;
		align-self: flex-start;
	}

	.divider {
		height: 1px;
		background-color: rgba(242, 242, 242, 0.8);
		margin: 2px 0;
	}

	.calendar-container {
		margin: 0;
	}

	.chart-container {
		margin: 0;
	}

	.timeline-hours {
		display: flex;
		justify-content: space-between;
		margin-bottom: 8px;
	}

	.timeline-hours span {
		color: #9ca3af;
		font-size: 12px;
		font-weight: 500;
		position: relative;
	}

	.timeline-hours span::before {
		content: '';
		position: absolute;
		left: 50%;
		top: 15px;
		transform: translateX(-50%);
		width: 1px;
		height: 5px;
		background-color: #ccc;
	}

	.timeline-container {
		position: relative;
		margin: 16px 0;
	}

	.timeline-bar {
		height: 12px;
		width: 100%;
		background-color: rgba(243, 244, 246, 0.7);
		border-radius: 6px;
		position: relative;
		box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.05);
		overflow: hidden;
	}

	.timeline-segment {
		position: absolute;
		top: 0;
		bottom: 0;
		border-radius: 6px;
		background: linear-gradient(90deg, rgba(255, 193, 7, 0.5) 0%, rgba(252, 211, 77, 0.8) 100%);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		z-index: 2;
		overflow: hidden;
	}

	/* 时间轴图例 */
	.timeline-legend {
		display: flex;
		justify-content: flex-end;
		margin-top: 8px;
	}

	.legend-item {
		display: flex;
		align-items: center;
		margin-left: 10px;
		font-size: 12px;
		color: #6b7280;
	}

	.legend-color {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		margin-right: 5px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.booking-container {
		margin: 0;
	}

	.segment-label {
		font-size: 14px;
		color: #4b5563;
		font-weight: 500;
		margin-bottom: 6px;
		display: block;
	}

	.segmented-control-container {
		width: 100%;
		margin-bottom: 12px;
	}

	.booking-time-warning {
		background-color: rgba(253, 242, 225, 0.7);
		color: #f59e0b;
		border: 1px solid rgba(249, 203, 20, 0.5);
		border-radius: 6px;
		padding: 8px 10px;
		margin: 8px 0;
		font-size: 12px;
		display: flex;
		align-items: center;
		justify-content: center;
		backdrop-filter: blur(5px);
		box-shadow: 0 2px 8px rgba(249, 203, 20, 0.15);
	}

	.time-selection {
		margin-top: 10px;
	}

	.time-range {
		display: flex;
		justify-content: space-between;
		margin: 8px 0;
	}

	.option {
		display: flex;
		flex-direction: column;
		width: 48%;
	}

	.option-label {
		font-size: 13px;
		color: #4b5563;
		margin-bottom: 5px;
		font-weight: 500;
	}

	.picker-view {
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 10px;
		background-color: rgba(243, 244, 246, 0.7);
		border-radius: 6px;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.18);
		transition: all 0.2s ease;
	}

	.picker-view:active {
		background-color: rgba(229, 231, 235, 0.7);
		transform: translateY(1px);
	}

	.attention-box {
		background: rgba(253, 251, 231, 0.7);
		border-radius: 8px;
		height: 45px;
		margin: 8px 0;
		padding: 0 8px;
		display: flex;
		align-items: center;
		backdrop-filter: blur(5px);
		box-shadow: 0 4px 12px rgba(249, 203, 20, 0.2);
		border: 1px solid rgba(253, 230, 138, 0.5);
	}

	/* Debug信息区域 */
	.order-detail {
		background: rgba(243, 244, 246, 0.7);
		backdrop-filter: blur(5px);
		border-radius: 6px;
		margin: 8px 0;
		padding: 8px;
		font-size: 12px;
		color: #6b7280;
		border: 1px solid rgba(209, 213, 219, 0.5);
	}

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

	.arrears-button {
		background: linear-gradient(135deg, #D3D3D3 0%, #B0B0B0 100%);
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
		transition: all 0.3s;
		position: relative;
		overflow: hidden;
		box-sizing: border-box;
		padding: 0;
	}

	.arrears-button:active {
		transform: scale(0.98);
		box-shadow: 0 2px 6px rgba(249, 203, 20, 0.3);
	}

	.arrears-button::after {
		content: "";
		position: absolute;
		top: 0;
		left: -100%;
		width: 100%;
		height: 100%;
		background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
		transition: 0.5s;
	}

	.arrears-button:active::after {
		left: 100%;
	}

	/* 会员信息样式 */
	.membership-info {
		margin-top: 20px;
	}

	.membership-title {
		margin-bottom: 10px;
	}

	.membership-card {
		background: rgba(253, 251, 231, 0.7);
		border-radius: 12px;
		padding: 15px;
		box-shadow: 0 4px 12px rgba(249, 203, 20, 0.15);
		border: 1px solid rgba(253, 230, 138, 0.5);
	}

	.membership-item {
		display: flex;
		align-items: center;
		margin-bottom: 10px;
	}

	.membership-item:last-child {
		margin-bottom: 0;
	}

	.membership-icon {
		margin-right: 10px;
		flex-shrink: 0;
	}

	.membership-text {
		font-size: 14px;
		color: #4b5563;
		line-height: 1.4;
	}

	.tips-container {
		padding: 0 20rpx;
		margin: 20rpx 0;
	}

	.tips {
		font-size: 20rpx;
		color: gray;
	}

	/* 媒体查询：针对不同尺寸设备的响应式样式 */
	/* 小屏幕设备 */
	@media screen and (max-width: 375px) {
		.container {
			padding: 10px;
		}

		.machine-name {
			font-size: 16px;
		}

		.icon {
			width: 40px;
			height: 40px;
		}

		.submit-button {
			height: 40px;
			font-size: 14px;
		}
	}

	/* 大屏幕设备 */
	@media screen and (min-width: 768px) {
		.container {
			padding: 20px;
		}

		.machine-name {
			font-size: 20px;
		}

		.icon {
			width: 60px;
			height: 60px;
		}

		.submit-button {
			width: 70%;
			height: 50px;
			font-size: 16px;
		}
	}

	/* 交互增强效果 */
	@keyframes glow {
		0% {
			box-shadow: 0 0 3px rgba(249, 203, 20, 0.3);
		}

		50% {
			box-shadow: 0 0 10px rgba(249, 203, 20, 0.5);
		}

		100% {
			box-shadow: 0 0 3px rgba(249, 203, 20, 0.3);
		}
	}

	.submit-button:hover {
		animation: glow 2s infinite;
	}

	.header-container,
	.calendar-container,
	.chart-container,
	.booking-container,
	.order-detail {
		background: rgba(255, 255, 255, 0.7);
		backdrop-filter: blur(10px);
		border-radius: 20px;
		box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.5),
			inset 0 2px 8px rgba(255, 255, 255, 0.7),
			inset 0 -2px 8px rgba(31, 38, 135, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.18);
		padding: 16px;
		margin-bottom: 20px;
	}

	.header-container::after,
	.calendar-container::after,
	.chart-container::after,
	.booking-container::after,
	.order-detail::after {
		content: '';
		position: absolute;
		left: 0;
		right: 0;
		bottom: -1px;
		height: 1px;
		background: linear-gradient(90deg,
				transparent,
				rgba(31, 38, 135, 0.1),
				transparent);
	}

	@media (prefers-color-scheme: dark) {
		.container {
			width: 100%;
			background: rgb(0, 0, 0);
			min-height: 100vh;
			box-sizing: border-box;
			padding: 30px;
			position: relative;
		}

		.glass-card {
			background: rgb(22, 22, 24);
			backdrop-filter: blur(10px);
			border-radius: 20px;
			box-shadow: 0 8px 32px rgba(31, 38, 135, 0.1);
			border: 1px solid rgba(255, 255, 255, 0.18);
			overflow: visible;
			padding: 16px;
			margin-bottom: 20px;
			margin-left: 10px;
			margin-right: 10px;
			transition: transform 0.3s ease, box-shadow 0.3s ease;
		}

		.machine-name {
			font-weight: bold;
			font-size: 18px;
			color: white;
			margin-bottom: 4px;
		}

		.price-rate {
			font-size: 13px;
			color: lightgray;
			background: rgb(59, 59, 61);
			padding: 2px 8px;
			border-radius: 12px;
			align-self: flex-start;
		}

		.timeline-hours span {
			color: lightgray;
			font-size: 12px;
			font-weight: 500;
			position: relative;
		}

		.timeline-hours span::before {
			content: '';
			position: absolute;
			left: 50%;
			top: 15px;
			transform: translateX(-50%);
			width: 1px;
			height: 5px;
			background-color: darkgray;
		}

		.timeline-bar {
			height: 12px;
			width: 100%;
			background-color: rgb(59, 59, 61);
			border-radius: 6px;
			position: relative;
			box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.05);
			overflow: hidden;
		}

		.legend-item {
			display: flex;
			align-items: center;
			margin-left: 10px;
			font-size: 12px;
			color: lightgray;
		}

		.segment-label {
			font-size: 14px;
			color: lightgray;
			font-weight: 500;
			margin-bottom: 6px;
			display: block;
		}

		.title {
			color: white;
			font-weight: bold;
			font-size: 30rpx;
		}

		.details {
			color: lightgray;
		}

		.booking-time-warning {
			background-color: rgb(59, 59, 61);
			color: #f59e0b;
			border: 1px solid rgba(249, 203, 20, 0.5);
			border-radius: 6px;
			padding: 8px 10px;
			margin: 8px 0;
			font-size: 12px;
			display: flex;
			align-items: center;
			justify-content: center;
			backdrop-filter: blur(5px);
			box-shadow: 0 2px 8px rgba(249, 203, 20, 0.15);
		}

		.option-label {
			font-size: 13px;
			color: lightgray;
			margin-bottom: 5px;
			font-weight: 500;
		}

		.picker-view {
			height: 40px;
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 0 10px;
			background-color: rgb(59, 59, 61);
			border-radius: 6px;
			box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
			border: 1px solid rgba(255, 255, 255, 0.18);
			transition: all 0.2s ease;
		}

		.attention-box {
			background: rgb(59, 59, 61);
			border-radius: 8px;
			height: 45px;
			margin: 8px 0;
			padding: 0 8px;
			display: flex;
			align-items: center;
			backdrop-filter: blur(5px);
			box-shadow: 0 4px 12px rgb(51, 49, 50);
			border: 1px solid rgba(255, 255, 255, 0.18);
		}

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

		/* 会员信息样式 */
		.membership-card {
			background: rgb(59, 59, 61);
			border-radius: 12px;
			padding: 15px;
			box-shadow: 0 4px 12px rgb(51, 49, 50);
			border: 1px solid rgba(255, 255, 255, 0.18);
		}

		.membership-text {
			font-size: 14px;
			color: lightgray;
			line-height: 1.4;
		}

		.tips {
			font-size: 20rpx;
			color: lightgray;
		}
	}
</style>