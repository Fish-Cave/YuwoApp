<template>
	<view class="container">

		<view v-if="Data && Data.length > 0" v-for="data in Data.slice(0,1)" :key="data._id">
			<!-- 当前预约的机台信息卡片 -->
			<view class="glass-card active-card">
				<view class="timer-container">
					<text class="timer-text">{{ elapsedTime }}</text>
					<text class="timer-label">使用时长</text>
				</view>
				<view class="divider"></view>
				<view class="order-info">
					<view class="info-row">
						<text class="info-label">机台名称</text>
						<text class="info-value">{{ machineData.name || '未知机台' }}</text>
					</view>
					<view class="info-row">
						<text class="info-label">预约类型</text>
						<text class="info-value">{{ reservationData.isOvernight ? '过夜预约' : '普通预约' }}</text>
					</view>
					<view class="info-row">
						<text class="info-label">预约订单号</text>
						<text class="info-value">{{ signinData.reservationid }}</text>
					</view>
					<view class="info-row">
						<text class="info-label">签到订单号</text>
						<text class="info-value">{{ signinData._id }}</text>
					</view>
				</view>
			</view>

			<!-- 实时费用 -->
			<view class="glass-card">
				<view class="card-content">
					<view class="card-header">
						<text class="card-title">实时费用</text>
						<text class="rate-info">{{ displayRate }}</text>
					</view>
					<view class="price-container">
						<text class="price-amount">¥ {{ totalPrice }}</text>
						<text class="price-note" v-if="membershipType !== 'none'">{{ membershipNote }}</text>

					</view>
				</view>
			</view>

			<!-- 使用记录 -->
			<view class="glass-card">
				<view class="card-content">
					<view class="card-header">
						<text class="card-title">使用记录</text>
					</view>
					<view class="usage-record">
						<view class="record-item">
							<view class="record-icon">
								<uni-icons type="checkmarkempty" size="20" color="#4cd964"></uni-icons>
							</view>
							<view class="record-info">
								<text class="record-label">开始使用</text>
								<text class="record-time">{{ formatDate(signinData.starttime) }}</text>
							</view>
						</view>
						<view class="record-divider"></view>
						<view class="record-item">
							<view class="record-icon">
								<uni-icons type="circle" size="20" color="#f0ad4e"></uni-icons>
							</view>
							<view class="record-info">
								<text class="record-label">预计结束</text>
								<text class="record-time">{{ estimatedEndTime }}</text>
							</view>
						</view>
					</view>

				</view>
			</view>

			<!-- 玩不玩机台信息 -->
			<view class="glass-card" v-if="signinData.isPlay !== undefined">
				<view class="card-content">
					<view class="card-header">
						<text class="card-title">机台使用状态</text>
					</view>
					<view class="play-status">
						<uni-icons :type="signinData.isPlay ? 'checkbox-filled' : 'closeempty'" 
							:color="signinData.isPlay ? '#4cd964' : '#dd524d'" size="24"></uni-icons>
						<text class="play-status-text">{{ signinData.isPlay ? '正在游玩机台' : '不游玩机台' }}</text>
					</view>

				</view>
			</view>

			<!-- Debug 信息 -->
			<view class="glass-card" v-if="debug">
				<template v-slot:title>
					<view class="debug-header">

						<uni-section title="Debug" type="line"></uni-section>
						<switch @change="switchChange"></switch>
					</view>
				</template>

				<view class="debug-content">
					<text>签到数据: {{ JSON.stringify(signinData) }}</text>
					<text>预约数据: {{ JSON.stringify(reservationData) }}</text>
					<text>机台数据: {{ JSON.stringify(machineData) }}</text>
					<text>会员类型: {{ membershipType }}</text>
					<text>单价: {{ singlePrice }}</text>
					<text>封顶价格: {{ overnightPrice }}</text>
					<text>总价: {{ totalPrice }}</text>
				</view>
			</view>

		</view>
		<view v-else>
			<view class="glass-card empty-card">
				<view class="empty-content">
					<uni-icons type="info" size="50" color="#bbb"></uni-icons>
					<text class="empty-text">暂无使用中的签到信息</text>
					<text class="empty-subtext">您可以返回首页进行预约</text>
				</view>
			</view>
		</view>

		<!-- 底部按钮区域 -->
		<view class="footer">
			<view class="button-container">
				<view class="submit-button" @click="endUsage">结束使用并支付</view>

				<view class="help-button" @click="askForHelp">遇到问题</view>
			</view>
		</view>
	</view>
</template>

<script setup lang="ts">

import { onMounted, ref, reactive, onUnmounted, computed } from 'vue';
import dayjs from 'dayjs';

const todo = uniCloud.importObject('todo');
const res = uniCloud.getCurrentUserInfo('uni_id_token');

// 数据状态
const signinData = ref(null);
const reservationData = ref(null);
const machineData = ref(null);
const membershipType = ref("none"); // "none", "music_game", "weekly_monthly"
const singlePrice = ref(5);
const overnightPrice = ref(50);
const totalPrice = ref(0);
const elapsedTime = ref("00:00:00");
const loading = ref(false);
const debug = ref(false);

// 计时器相关
let timerInterval = null;
const startTime = ref(0);

// 计算属性
const displayRate = computed(() => {
  if (membershipType.value === "weekly_monthly") {
    return "包周/月会员免费";
  } else if (membershipType.value === "music_game") {
    return "音游会员: 4元/半小时 (封顶40元)";
  } else {
    return `${singlePrice.value}元/半小时`;
  }
});

const membershipNote = computed(() => {
  if (membershipType.value === "weekly_monthly") {
    return "会员免费";
  } else if (membershipType.value === "music_game") {
    return "音游会员优惠价";
  }
  return "";
});

const estimatedEndTime = computed(() => {
  if (!signinData.value || !signinData.value.starttime) return "未开始";
  
  // 如果是过夜预约，预计结束时间是开始时间+10小时（22:00-08:00）
  if (reservationData.value && reservationData.value.isOvernight) {
    return formatDate(signinData.value.starttime + 10 * 60 * 60 * 1000);
  }
  
  // 普通预约，根据预约的结束时间
  if (reservationData.value && reservationData.value.endTime) {
    return formatDate(reservationData.value.endTime);
  }
  
  // 默认显示开始时间+2小时
  return formatDate(signinData.value.starttime + 2 * 60 * 60 * 1000);
});

// 方法
function switchChange(e) {
  debug.value = e.detail.value;
}

function formatDate(timestamp) {
  if (!timestamp) return "未知时间";
  return dayjs(timestamp).format('YYYY-MM-DD HH:mm');
}

async function getActiveSigninDetail() {
  loading.value = true;
  try {
    const result = await todo.GetActiveSigninDetail(res.uid);
    
    if (result.code === 0 && result.data) {
      signinData.value = result.data.signin;
      reservationData.value = result.data.reservation;
      machineData.value = result.data.machine;
      
      // 设置开始时间并启动计时器
      startTime.value = signinData.value.starttime;
      if (startTime.value) {
        startTimer();
      }
    } else {
      uni.showToast({
        title: result.message || "未找到使用中的签到",
        icon: 'none'
      });
      signinData.value = null;
    }
  } catch (error) {
    console.error("获取签到详情失败:", error);
    uni.showToast({
      title: "获取签到详情失败",
      icon: 'none'
    });
  } finally {
    loading.value = false;
  }
}

async function getMembershipStatus() {
  try {
    if (!res.uid) {
      console.log('未登录或无法获取用户ID');
      membershipType.value = "none";
      return;
    }

    const result = await todo.getUserMembershipInfo(res.uid);
    
    if (result) {
      // 检查包周/月会员
      if (result.subscriptionPackage && result.subscriptionPackage.length > 0) {
        membershipType.value = "weekly_monthly";
      }
      // 检查音游会员
      else if (result.membership && result.membership.length > 0) {
        membershipType.value = "music_game";
      }
      // 无会员
      else {
        membershipType.value = "none";
      }
    } else {
      membershipType.value = "none";
    }
    
    // 更新价格
    updatePriceByMembership();
    
  } catch (error) {
    console.error("获取会员信息失败:", error);
    membershipType.value = "none";
  }
}

function updatePriceByMembership() {
  switch (membershipType.value) {
    case "weekly_monthly":
      singlePrice.value = 0;
      overnightPrice.value = 0;
      break;
    case "music_game":
      singlePrice.value = 4;
      overnightPrice.value = 40;
      break;
    default:
      singlePrice.value = 5;
      overnightPrice.value = 50;
      break;
  }
}

function startTimer() {
  if (!startTime.value) return;

  timerInterval = setInterval(() => {
    const now = Date.now();
    const elapsedMilliseconds = now - startTime.value;
    const elapsedSeconds = Math.floor(elapsedMilliseconds / 1000);

    // 更新显示的时间
    elapsedTime.value = formatTime(elapsedSeconds);

    // 计算费用
    calculateFee(elapsedMilliseconds);
    
  }, 1000);
}

function calculateFee(elapsedMilliseconds) {
  // 如果没有签到数据或预约数据，不计算费用
  if (!signinData.value || !reservationData.value) return;
  
  // 如果是包周/月会员，费用为0
  if (membershipType.value === "weekly_monthly") {
    totalPrice.value = 0;
    return;
  }
  
  // 计算已用时间（分钟）
  const elapsedMinutes = elapsedMilliseconds / (1000 * 60);
  
  // 是否过夜预约
  const isOvernight = reservationData.value.isOvernight;
  
  // 是否玩机台
  const isPlay = signinData.value.isPlay;
  
  if (isOvernight) {
    // 过夜预约使用固定价格
    totalPrice.value = isPlay ? overnightPrice.value : (overnightPrice.value * 0.2); // 不玩机台按20%收费
  } else {
    // 普通预约按时间计费
    const halfHourUnits = Math.ceil(elapsedMinutes / 30); // 向上取整，不满半小时也算半小时
    
    if (membershipType.value === "music_game" && isPlay) {
      // 音游会员，每半小时4元，当日封顶40元
      totalPrice.value = Math.min(halfHourUnits * 4, 40);
    } else {
      // 非会员正常计费
      const baseRate = isPlay ? singlePrice.value : 1; // 不玩机台每半小时1元
      const calculatedPrice = halfHourUnits * baseRate;
      
      // 如果玩机台且超过封顶价格，使用封顶价格
      if (isPlay && calculatedPrice > overnightPrice.value) {
        totalPrice.value = overnightPrice.value;
      } else {
        totalPrice.value = calculatedPrice;
      }
    }
  }
  
  // 保留两位小数
  totalPrice.value = Math.round(totalPrice.value * 100) / 100;
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function formatTime(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const formattedHours = String(hours).padStart(2, '0');
  const formattedMinutes = String(minutes).padStart(2, '0');
  const formattedSeconds = String(seconds).padStart(2, '0');

  return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
}

async function endUsage() {
  if (!signinData.value) {
    uni.showToast({
      title: "没有使用中的签到",
      icon: 'none'
    });
    return;
  }
  
  uni.showModal({
    title: '结束使用',
    content: '确定要结束当前使用并进行结算吗？',
    success: async (res) => {
      if (res.confirm) {
        await processEndUsage();
      }
    }
  });
}

async function processEndUsage() {
  try {
    uni.showLoading({
      title: '处理中...'
    });
    
    const endTime = Date.now();
    
    // 调用云函数结束签到
    const result = await todo.SignIn_End({
      signinId: signinData.value._id,
      endtime: endTime
    });
    
    if (result.code === 0) {
      // 计算最终费用
      const feeResult = await todo.CalculateSigninFee({
        signinId: signinData.value._id,
        starttime: signinData.value.starttime,
        endtime: endTime
      });
      
      uni.hideLoading();
      
      if (feeResult.code === 0) {
        // 跳转到结算页面
        uni.navigateTo({
          url: '/pages/payment/payment',
          success: (res) => {
            // 传递结算数据
            res.eventChannel.emit('acceptPaymentData', {
              signinId: signinData.value._id,
              reservationId: signinData.value.reservationid,
              startTime: signinData.value.starttime,
              endTime: endTime,
              duration: feeResult.data.durationText,
              fee: feeResult.data.fee,
              isPlay: signinData.value.isPlay,
              isOvernight: reservationData.value.isOvernight,
              machineName: machineData.value ? machineData.value.name : '未知机台'
            });
          }
        });
      } else {
        uni.showToast({
          title: feeResult.message || '计算费用失败',
          icon: 'none'
        });
      }
    } else {
      uni.hideLoading();
      uni.showToast({
        title: result.message || '结束使用失败',
        icon: 'none'
      });
    }
  } catch (error) {
    uni.hideLoading();
    console.error('结束使用出错:', error);
    uni.showToast({
      title: '结束使用失败，请稍后重试',
      icon: 'none'
    });
  }
}

function askForHelp() {
  uni.showModal({
    title: '需要帮助？',
    content: '您可以联系店员或拨打客服电话获取帮助',
    confirmText: '联系客服',
    cancelText: '取消',
    success: (res) => {
      if (res.confirm) {
        // 拨打客服电话
        uni.makePhoneCall({
          phoneNumber: '10086', // 替换为实际的客服电话
          fail: () => {
            uni.showToast({
              title: '拨打电话失败',
              icon: 'none'
            });
          }
        });
      }
    }
  });
}

onMounted(async () => {
  // 获取会员状态
  await getMembershipStatus();
  
  // 获取当前签到详情
  await getActiveSigninDetail();
});

onUnmounted(() => {
  stopTimer(); // 组件卸载时停止定时器，避免内存泄漏
});
</script>

<style>
/* 全局容器样式 */
.container {
  padding: 20rpx;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  min-height: 100vh;
  box-sizing: border-box;
  padding-bottom: 200rpx; /* 为底部按钮留出空间 */
}

/* 玻璃态卡片 */
.glass-card {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  border-radius: 30rpx;
  box-shadow: 0 8rpx 32rpx rgba(31, 38, 135, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.18);
  overflow: hidden;
  margin-bottom: 30rpx;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.glass-card:active {
  transform: translateY(2rpx);
  box-shadow: 0 4rpx 16rpx rgba(31, 38, 135, 0.08);
}

/* 活动卡片样式 - 橙色背景 */
.active-card {
  background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
  color: white;
  padding: 30rpx;
}

/* 计时器样式 */
.timer-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20rpx;
}

.timer-text {
  font-size: 80rpx;
  font-weight: bold;
  letter-spacing: 2rpx;
  text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.1);
}

.timer-label {
  font-size: 28rpx;
  margin-top: 10rpx;
  opacity: 0.9;
}

.divider {
  height: 2rpx;
  background-color: rgba(255, 255, 255, 0.3);
  margin: 20rpx 0;
}

/* 订单信息样式 */
.order-info {
  margin-top: 20rpx;
}

.info-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 15rpx;
}

.info-label {
  font-size: 24rpx;
  opacity: 0.9;
}

.info-value {
  font-size: 28rpx;
  font-weight: 500;
}

/* 卡片内容样式 */
.card-content {
  padding: 30rpx;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.card-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.rate-info {
  font-size: 24rpx;
  color: #666;
  background: rgba(249, 203, 20, 0.1);
  padding: 4rpx 16rpx;
  border-radius: 20rpx;
}

/* 价格容器样式 */
.price-container {
  display: flex;
  align-items: baseline;
}

.price-amount {
  font-size: 48rpx;
  font-weight: bold;
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-right: 10rpx;
}

.price-note {
  font-size: 24rpx;
  color: #4cd964;
}

/* 使用记录样式 */
.usage-record {
  margin-top: 10rpx;
}

.record-item {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
}

.record-icon {
  margin-right: 15rpx;
}

.record-info {
  display: flex;
  flex-direction: column;
}

.record-label {
  font-size: 28rpx;
  color: #333;
  margin-bottom: 5rpx;
}

.record-time {
  font-size: 24rpx;
  color: #666;
}

.record-divider {
  height: 1rpx;
  background-color: #eee;
  margin: 15rpx 0;
}

/* 机台使用状态样式 */
.play-status {
  display: flex;
  align-items: center;
  background: rgba(249, 249, 249, 0.5);
  padding: 20rpx;
  border-radius: 15rpx;
  margin-top: 10rpx;
}

.play-status-text {
  font-size: 28rpx;
  margin-left: 15rpx;
}

/* 空状态样式 */
.empty-card {
  padding: 60rpx 30rpx;
}

.empty-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.empty-text {
  font-size: 32rpx;
  color: #666;
  margin-top: 30rpx;
}

.empty-subtext {
  font-size: 24rpx;
  color: #999;
  margin-top: 10rpx;
}

/* Debug 样式 */
.debug-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 30rpx;
  border-bottom: 1px solid #eee;
}

.debug-content {
  padding: 20rpx 30rpx;
  font-size: 24rpx;
  color: #666;
  display: flex;
  flex-direction: column;
}

/* 底部按钮区域 */
.footer {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  padding: 20rpx 0;
  border-top: 1px solid rgba(229, 231, 235, 0.8);
  box-shadow: 0 -4rpx 12rpx rgba(0, 0, 0, 0.05);
  z-index: 100;
}

.button-container {
  padding: 0 30rpx;
}

.submit-button {
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  border-radius: 16rpx;
  height: 90rpx;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: bold;
  color: white;
  font-size: 30rpx;
  box-shadow: 0 4rpx 12rpx rgba(249, 203, 20, 0.3);
  margin-bottom: 20rpx;
  transition: all 0.3s;
}

.submit-button:active {
  transform: scale(0.98);
  box-shadow: 0 2rpx 6rpx rgba(249, 203, 20, 0.3);
}

.help-button {
  background: #f1f1f1;
  border-radius: 16rpx;
  height: 80rpx;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #666;
  font-size: 28rpx;
  transition: all 0.3s;
}

.help-button:active {
  background: #e0e0e0;
}
</style>
