<template>
	<view class="container">
	<scroll-view scroll-y class="scroll-view">
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
						<text class="price-rate">{{singlePrice}}元/半小时</text>
					</view>
				</uni-col>
			</uni-row>
		</view>

		<view class="divider" />
		<view class="calendar-container">
			<wu-calendar :insert="true" type="week" :fold="false" startWeek="mon" color="#f59e0b"
				@change="calendarChange"></wu-calendar>
		</view>

		<view class="divider" />
		<view class="chart-container">
			<uni-title type="h1" title="已有预约时段"></uni-title>
				<view class="timeline-hours">
					<span>0:00</span>
					<span>6:00</span>
					<span>12:00</span>
					<span>18:00</span>
					<span>24:00</span>
				</view>
			<!-- 替换神秘条形图为实际的时间轴条形图 -->
			<view class="timeline-container mb-4">

				<view class="timeline-bar">
					<view v-for="(reservation, index) in reservations" :key="index" class="timeline-segment"
						:style="calculateSegmentStyle(reservation)" @click="showReservationInfo(reservation)"></view>
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
				<uni-segmented-control :values="segmentedValues" :current="segmentedCurrent" style-type="button"
					active-color="#f9cb14" @clickItem="onSegmentChange"></uni-segmented-control>
			</view>

			<!-- 橙色提示信息 -->
			<view v-if="showNormalBookingTimeExpiredWarning" class="booking-time-warning">
				<uni-icons type="warning-filled" color="#f9cb14" size="16" style="margin-right: 5rpx;"></uni-icons>
				已超过普通预约时间，请选择夜间预约
			</view>


			<view v-if="Data.isOvernight">
				<view class="time-selection">
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
				</view>
				<view class="time-range">
					<view class="option">
						<text class="option-label">开始时间</text>
						<view class="picker-view" @click="openStartTimePicker">
							<text>{{ selectedStartTime || '请选择时间' }}</text>
							<uni-icons type="down" size="16"></uni-icons>
						</view>
						<uv-datetime-picker ref="startTimePicker" v-model="selectedStartTime" mode="time" :minHour="minStartTimeHour" :maxHour="maxStartTimeHour" :filter="timeFilter" @confirm="confirmStartTime"></uv-datetime-picker>
					</view>
					<view class="option">
						<text class="option-label">结束时间</text>
						<view class="picker-view" @click="openEndTimePicker">
							<text>{{ selectedEndTime || '请选择时间' }}</text>
							<uni-icons type="down" size="16"></uni-icons>
						</view>
						<uv-datetime-picker ref="endTimePicker" v-model="selectedEndTime" mode="time" :minHour="minEndTimeHour" :maxHour="maxEndTimeHour"  :filter="timeFilter" :minMinute="minEndTimeMinute" @confirm="confirmEndTime"></uv-datetime-picker>
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
			<text>{{Data}}</text><br />
			<text>单价:{{singlePrice}} 过夜价:{{overnightPrice}}</text>
		</view>
	</scroll-view>
	
	<view class="footer">
		<view class="price-summary">
			<text>预计费用 </text>
			<text class="price-amount">¥{{price}}</text>
		</view>
		<view class="submit-button" @click="submitOrder()">
			<text>确认预约</text>
		</view>
	</view>
	</view>

</template>

<script setup lang="ts">
import dayjs from 'dayjs';
import { ref, getCurrentInstance, onMounted, reactive, computed, watch, toRaw } from 'vue';

const todo = uniCloud.importObject('todo')
const machineName = ref("")
const debug = ref(false);

//通过在本地缓存的token来获取用户信息
const res = uniCloud.getCurrentUserInfo('uni_id_token')
console.log(res)

//价格相关
//pricelist是一个包含两个对象的价格表数组
interface priceList {
    _id : string;
    price : number
}
const pricelist = ref<priceList[]>([])
const singlePrice = ref(5)
const overnightPrice = ref(50)
async function getPriceList() {
    try {
        if (res.role.includes("superUser")||res.role.includes("admin")) {
            const result = await todo.GetPriceInfoByRole("superUser")
            pricelist.value = result.data
            singlePrice.value = toRaw(pricelist.value[0]).price
            overnightPrice.value = toRaw(pricelist.value[1]).price
        }
    } catch { }
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
const maxEndTimeHour = ref(23);
const minEndTimeMinute = ref(0); // 新增结束时间分钟限制

// 用于控制是否显示橙色提示信息
const showNormalBookingTimeExpiredWarning = ref(false);

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

// 更新预约类型和相关设置
function updateBookingType() {
    showNormalBookingTimeExpiredWarning.value = false; // 每次更新前先隐藏警告

    if (Data.isOvernight) {
        //过夜预约默认开始时间
        selectedStartTime.value = '22:00';
        minStartTimeHour.value = 22;
        maxStartTimeHour.value = 22;
        minEndTimeHour.value = 0;
        maxEndTimeHour.value = 8;
        minEndTimeMinute.value = 0;
    } else {
        // 普通预约恢复普通时间限制
        updateMinStartTime(selectedDate.value); // 传入 selectedDate
        minEndTimeHour.value = 8; // 普通预约最早结束时间
        maxEndTimeHour.value = 22; // 普通预约最晚结束时间
        minEndTimeMinute.value = 0;

        // **新的日期判断逻辑：只有当选择的日期是今天时，才判断当前时间是否超过 22:00**
        if (dayjs(selectedDate.value).isSame(dayjs(), 'day')) {
            const now = dayjs();
            if (now.hour() >= 22) {
                segmentedCurrent.value = 1;
                Data.isOvernight = true;
                showNormalBookingTimeExpiredWarning.value = true;
            } else {
                showNormalBookingTimeExpiredWarning.value = false; // 确保在 22:00 前不显示警告
            }
        } else {
            // 如果选择的是未来日期，则不显示警告，保持普通预约选中状态
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
        price.value = overnightPrice.value;
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
        price.value = overnightPrice.value
        //五小时以上一律50元！
        if (totalTime.value < 5) {
            price.value = Math.ceil(totalTime.value / 0.5) * singlePrice.value;
        }
        // 计算价格：5元/半小时
    } else {
        totalTime.value = 0;
        price.value = 0;
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
    // 自动设置结束时间为开始时间 30 分钟后
    const startTime = dayjs(selectedStartTime.value, 'HH:mm');
    const endTime = startTime.add(30, 'minute');
    selectedEndTime.value = endTime.format('HH:mm');
    updateEndTimestamp(); // 更新结束时间戳，用于价格计算等
}

// 确认结束时间
function confirmEndTime(e) {
    selectedEndTime.value = e.value;
}


// 时间过滤器函数
function timeFilter(type: string, options: number[]) {
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
function updateMinStartTime(dateStr?: string) { // dateStr 参数为可选
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

    // 检查是否选择了过去的日期
    if (dayjs(e.fulldate).isBefore(dayjs(), 'day')) {
        uni.showToast({
            title: '不能选择过去的日期',
            icon: 'none'
        });
        selectedDate.value = dayjs().format('YYYY-MM-DD');
        return; // 如果选择了过去日期，直接返回，不进行后续预约类型更新
    }

    updateBookingType(); // **日期更改后立即更新预约类型**
    updateMinStartTime(selectedDate.value); // 更新最小开始时间，传入 selectedDate


    // 获取所选日期的预约信息
    if (Data.machineId) {
        getReservationsForDate(Data.machineId, selectedDate.value);
    }
}

onMounted(() => {
    const instance = getCurrentInstance().proxy;

    // 尝试从 localStorage 获取数据
    const storedData = uni.getStorageSync('orderData');
    if (storedData) {
        const orderData = JSON.parse(storedData);
        machineName.value = orderData.name;
        Data.machineId = orderData.id;

        // 获取所选日期的预约信息
        selectedDate.value = dayjs().format('YYYY-MM-DD');  // 设置默认日期为今天
        getReservationsForDate(Data.machineId, selectedDate.value);
		
    } else {
        // 如果 localStorage 中没有数据，则尝试从 eventChannel 获取
        const eventChannel = instance.getOpenerEventChannel();
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
    }

    getPriceList()
    updateBookingType(); // **页面加载时初始化预约类型**
    updateMinStartTime(selectedDate.value); // 初始化时传入 selectedDate
    Data.userId = res.uid;
});

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

    Data.status = 1;

    try {
            uni.showLoading({
                title: '提交中...'
            });

            const res = await todo.Reservation_Add(Data); // **直接调用云函数，不再进行前端时间冲突检查**

            uni.hideLoading();

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
            }  else if (res && res.errCode === 'MACHINE_NOT_FOUND') {
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
            } else {
                uni.showToast({
                    title: '预约成功',
                    icon: 'success'
                });
                uni.navigateBack();
            }

        } catch (error) {
            uni.hideLoading();
            uni.showToast({
                title: '预约失败: 网络错误或未知错误',
                icon: 'none'
            });
            console.error("Error calling Reservation_Add:", error);
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
    padding: 20px; /* 全局内边距 */
    position: relative; /* 确保定位正确 */
}

/* 滚动视图样式 */
.scroll-view {
    width: 100%;
    box-sizing: border-box;
    padding-bottom: 120px; /* 底部内边距，为固定底部区域留出空间 */
}

/* 玻璃拟态卡片 */
.glass-card {
    background: rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(10px);
    border-radius: 20px;
    box-shadow: 0 8px 32px rgba(31, 38, 135, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.18);
    overflow: visible; /* 确保阴影不被裁剪 */
    padding: 16px;
    margin-bottom: 20px;
		margin-left: 10px; /* 阴影显示完整 */
		margin-right: 10px; /* 阴影显示完整 */
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

/* 分隔线 */
.divider {
    height: 1px;
    background-color: rgba(242, 242, 242, 0.8);
    margin: 2px 0;
}

/* 日历容器 */
.calendar-container {
    margin: 0;
}

/* 图表容器 */
.chart-container {
    margin: 0;
}

/* 时间轴样式 */
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
    background: linear-gradient(90deg, rgba(255,193,7,0.5) 0%, rgba(252,211,77,0.8) 100%);
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

/* 预约容器 */
.booking-container {
    margin: 0;
}

/* 预约类型 */
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

/* 预约时间警告 */
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

/* 时间选择区域 */
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

/* 提示框 */
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

/* 添加的一些交互增强效果 */
@keyframes glow {
  0% { box-shadow: 0 0 3px rgba(249, 203, 20, 0.3); }
  50% { box-shadow: 0 0 10px rgba(249, 203, 20, 0.5); }
  100% { box-shadow: 0 0 3px rgba(249, 203, 20, 0.3); }
}

.submit-button:hover {
  animation: glow 2s infinite;
}

/* Fix for card shadow clipping - use internal shadows and padding instead */
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

</style>


