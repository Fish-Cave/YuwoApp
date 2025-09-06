<template>
  <view class="container">
    <!-- 报表类型选择 -->
    <view class="report-type-selector">
      <view class="tab-group">
        <view 
          class="tab-item" 
          :class="{ 'active': activeTab === 'weekly' }"
          @click="switchTab('weekly')">
          周报表
        </view>
        <view 
          class="tab-item" 
          :class="{ 'active': activeTab === 'custom' }"
          @click="switchTab('custom')">
          自定义报表
        </view>
      </view>
    </view>
    
    <!-- 时间选择区域 -->
    <view class="time-selector">
      <template v-if="activeTab === 'weekly'">
        <view class="selector-row">
          <view class="selector-label">年份:</view>
          <picker mode="selector" :range="yearOptions" @change="onYearChange">
            <view class="picker-value">{{ selectedYear }}</view>
          </picker>
        </view>
        <view class="selector-row">
          <view class="selector-label">周数:</view>
          <picker mode="selector" :range="weekOptions" @change="onWeekChange">
            <view class="picker-value">第{{ selectedWeek }}周 ({{ getWeekDateRange() }})</view>
          </picker>
        </view>
      </template>
      
      <template v-else>
        <view class="date-range-picker">
          <view class="date-picker">
            <view class="selector-label">开始日期:</view>
            <picker mode="date" :value="startDateStr" @change="onStartDateChange">
              <view class="picker-value">{{ startDateStr }}</view>
            </picker>
          </view>
          <view class="date-picker">
            <view class="selector-label">结束日期:</view>
            <picker mode="date" :value="endDateStr" @change="onEndDateChange">
              <view class="picker-value">{{ endDateStr }}</view>
            </picker>
          </view>
        </view>
      </template>
      
      <button class="query-button" @click="loadReportData">查询报表</button>
    </view>
    
    <!-- 报表摘要 -->
    <view class="report-summary" v-if="reportData">
      <view class="summary-card">
        <view class="summary-title">预约概览</view>
        <view class="summary-content">
          <view class="summary-item">
            <text class="item-label">总预约次数:</text>
            <text class="item-value">{{ reportData.reservationStats.totalReservations }}</text>
          </view>
          <view class="summary-item">
            <text class="item-label">总游玩时长:</text>
            <text class="item-value">{{ formatPlayTime(reportData.reservationStats.totalPlayTime) }}</text>
          </view>
          <view class="summary-item">
            <text class="item-label">平均游玩时长:</text>
            <text class="item-value">{{ formatPlayTime(reportData.reservationStats.avgPlayTime) }}</text>
          </view>
          <view class="summary-item">
            <text class="item-label">过夜人数:</text>
            <text class="item-value">{{ reportData.reservationStats.overnightCount }}</text>
          </view>
        </view>
      </view>
      
      <view class="summary-card">
        <view class="summary-title">收入概览</view>
        <view class="summary-content">
          <view class="summary-item">
            <text class="item-label">总订单数:</text>
            <text class="item-value">{{ reportData.paymentStats.totalOrders }}</text>
          </view>
          <view class="summary-item">
            <text class="item-label">总收入:</text>
            <text class="item-value">{{ formatCurrency(reportData.paymentStats.totalRevenue) }}</text>
          </view>
          <view class="summary-item">
            <text class="item-label">平均订单金额:</text>
            <text class="item-value">{{ formatCurrency(reportData.paymentStats.avgOrderAmount) }}</text>
          </view>
          <view class="summary-item">
            <text class="item-label">标准订单 / 补票订单:</text>
            <text class="item-value">{{ reportData.paymentStats.orderTypeDistribution.goods }} / {{ reportData.paymentStats.orderTypeDistribution.settle }}</text>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 图表区域 -->
    <view class="chart-section" v-if="reportData">
      <!-- 游玩时段分布图 (柱状图) -->
      <view class="chart-card">
        <view class="chart-title">游玩时段分布</view>
        <view class="chart-container">
          <qiun-data-charts 
            type="column"
            :chartData="hourlyDistributionChart"
            :opts="hourlyChartOpts"
            :canvas2d="true"
            :ontouch="true"
          />
        </view>
      </view>
      
      <!-- 机台游玩人次占比 (环形图) -->
      <view class="chart-card">
        <view class="chart-title">机台游玩人次占比</view>
        <view class="chart-content-wrapper"> <!-- 新增一个wrapper来包含标题和图表 -->
          
          <view class="chart-container">
            <qiun-data-charts 
              type="ring"
              :chartData="machineUsageRingChart"
              :opts="machineRingOpts"
              :canvas2d="true"
            />
          </view>
        </view>
      </view>
      
      <!-- 机台游玩时长占比 (环形图) -->
      <view class="chart-card">
        <view class="chart-title">机台游玩时长占比</view>
        <view class="chart-content-wrapper"> <!-- 新增一个wrapper来包含标题和图表 -->
          <view class="chart-container">
            <qiun-data-charts 
              type="ring"
              :chartData="machinePlayTimeRingChart"
              :opts="machineRingOpts"
              :canvas2d="true"
            />
          </view>
        </view>
      </view>
    </view>
    
    <!-- 机台详情表格 (可滑动) -->
    <view class="machine-details-section" v-if="reportData">
      <view class="section-title">机台详细数据</view>
      
      <scroll-view class="table-scroll-view" scroll-x="true">
        <view class="table-container">
          <view class="table-header">
            <view class="table-cell machine-name">机台名称</view>
            <view class="table-cell">游玩人次</view>
            <view class="table-cell">游玩总时长</view>
            <view class="table-cell">平均时长</view>
            <view class="table-cell">过夜人数</view>
          </view>
          
          <view class="table-row" v-for="(machine, index) in machineDetailsList" :key="index">
            <view class="table-cell machine-name">{{ machine.machineName }}</view>
            <view class="table-cell">{{ machine.reservationCount }}</view>
            <view class="table-cell">{{ formatPlayTime(machine.totalPlayTime) }}</view>
            <view class="table-cell">{{ formatPlayTime(machine.avgPlayTime) }}</view>
            <view class="table-cell">{{ machine.overnightCount }}</view>
          </view>
        </view>
      </scroll-view>
    </view>
    
    <!-- 无数据提示 -->
    <view class="no-data-tip" v-if="!reportData">
      <text>请选择时间范围并点击查询</text>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
dayjs.extend(isoWeek);

// 报表类型
const activeTab = ref('weekly');
// 报表数据
const reportData = ref(null);
// 时间选择
const selectedYear = ref(dayjs().year());
const selectedWeek = ref(dayjs().isoWeek());
const startDateStr = ref(dayjs().subtract(7, 'day').format('YYYY-MM-DD'));
const endDateStr = ref(dayjs().format('YYYY-MM-DD'));

// 选项计算
const yearOptions = computed(() => {
  const currentYear = dayjs().year();
  return [currentYear - 1, currentYear, currentYear + 1];
});

const weekOptions = computed(() => {
  // 获取选中年份的总周数
  const weeksInYear = dayjs().year(selectedYear.value).endOf('year').isoWeek();
  return Array.from({ length: weeksInYear }, (_, i) => i + 1);
});

// 图表数据 - 游玩时段分布 (只显示8点到22点，并添加过夜数据)
const hourlyDistributionChart = computed(() => {
  if (!reportData.value) return { categories: [], series: [] };
  
  const hourlyData = reportData.value.reservationStats.hourlyDistribution || Array(24).fill(0);
  const overnightCount = reportData.value.reservationStats.overnightCount || 0;

  // 8点到22点 (共15个时段)
  const categories = Array.from({ length: 15 }, (_, i) => `${i + 8}点`);
  const data = hourlyData.slice(8, 23); // 从索引8(8点)到22(22点)

  // 添加“过夜”作为最后一个柱子
  categories.push('过夜');
  data.push(overnightCount);
  
  return {
    categories: categories,
    series: [{
      name: '预约人次',
      data: data
    }]
  };
});

// 机台游玩人次环形图
const machineUsageRingChart = computed(() => {
  if (!reportData.value) return { series: [{ data: [] }] };
  
  const machineStats = reportData.value.reservationStats.machineStats || {};
  // 取前5台使用最多的机台，其余归为"其他"
  const machines = Object.values(machineStats)
    .sort((a, b) => b.reservationCount - a.reservationCount);
  
  let topMachines = machines.slice(0, 5);
  let otherCount = 0;
  
  if (machines.length > 5) {
    // 计算其他机台的总人次
    machines.slice(5).forEach(m => {
      otherCount += m.reservationCount;
    });
    
    // 如果有"其他"项，添加到图表数据中
    if (otherCount > 0) {
      topMachines.push({
        name: '其他机台', 
        value: otherCount
      });
    }
  }
  
  return {
    series: [{
      data: topMachines.map(m => ({
        name: m.machineName || m.name, 
        value: m.reservationCount || m.value
      }))
    }]
  };
});

// 机台游玩时长环形图
const machinePlayTimeRingChart = computed(() => {
  if (!reportData.value) return { series: [{ data: [] }] };
  
  const machineStats = reportData.value.reservationStats.machineStats || {};
  // 取前5台使用时长最长的机台，其余归为"其他"
  const machines = Object.values(machineStats)
    .sort((a, b) => b.totalPlayTime - a.totalPlayTime);
  
  let topMachines = machines.slice(0, 5);
  let otherPlayTime = 0;
  
  if (machines.length > 5) {
    // 计算其他机台的总时长
    machines.slice(5).forEach(m => {
      otherPlayTime += m.totalPlayTime;
    });
    
    // 如果有"其他"项，添加到图表数据中
    if (otherPlayTime > 0) {
      topMachines.push({
        name: '其他机台', 
        value: otherPlayTime
      });
    }
  }
  
  return {
    series: [{
      data: topMachines.map(m => ({
        name: m.machineName || m.name, 
        value: m.totalPlayTime || m.value
      }))
    }]
  };
});

// 机台详情列表
const machineDetailsList = computed(() => {
  if (!reportData.value) return [];
  
  const machineStats = reportData.value.reservationStats.machineStats || {};
  return Object.values(machineStats)
    .sort((a, b) => b.reservationCount - a.reservationCount);
});

// 图表配置 - 游玩时段柱状图
const hourlyChartOpts = {
  color: ['#f59e0b'], 
  padding: [15, 15, 0, 15],
  touchMoveLimit: 24, 
  enableScroll: true, 
  legend: {
    show: false
  },
  xAxis: {
    disableGrid: true,
    scrollShow: true, 
    itemCount: 4, 
    scrollAlign: 'left' 
  },
  yAxis: {
    data: [
      {
        min: 0
      }
    ]
  },
  extra: {
    column: {
      type: 'group',
      width: 30,
      activeBgColor: "#000000",
      activeBgOpacity: 0.08
    }
  }
};

// 图表配置 - 机台环形图 (通用配置，不包含中心标题和副标题)
const machineRingOpts = {
  rotate: false,
  rotateLock: false,
  color: ["#1890FF","#91CB74","#FAC858","#EE6666","#73C0DE","#3CA272","#FC8452","#9A60B4","#ea7ccc"],
  padding: [5,5,5,5],
  dataLabel: true,
  enableScroll: false,
  legend: {
    show: true,
    position: "right",
    lineHeight: 25
  },
  extra: {
    ring: {
      ringWidth: 60,
      activeOpacity: 0.5,
      activeRadius: 10,
      offsetAngle: 0,
      labelWidth: 15,
      border: false, 
      borderWidth: 3,
      borderColor: "#FFFFFF"
    }
  }
};

// 事件处理
function switchTab(tab) {
  activeTab.value = tab;
  // 切换标签时重置报表数据
  reportData.value = null;
}

function onYearChange(e) {
  selectedYear.value = yearOptions.value[e.detail.value];
}

function onWeekChange(e) {
  selectedWeek.value = weekOptions.value[e.detail.value];
}

function onStartDateChange(e) {
  startDateStr.value = e.detail.value;
}

function onEndDateChange(e) {
  endDateStr.value = e.detail.value;
}

function getWeekDateRange() {
  const startOfWeek = dayjs().year(selectedYear.value).isoWeek(selectedWeek.value).startOf('isoWeek');
  const endOfWeek = startOfWeek.clone().endOf('isoWeek');
  return `${startOfWeek.format('MM.DD')}-${endOfWeek.format('MM.DD')}`;
}

// 格式化函数
function formatPlayTime(minutes) {
  if (minutes === undefined || minutes === null) return '0分钟';
  
  if (minutes < 60) {
    return `${minutes}分钟`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours}小时`;
  }
  
  return `${hours}小时${remainingMinutes}分钟`;
}

function formatCurrency(cents) {
  if (cents === undefined || cents === null) return '¥0.00';
  const yuan = (cents / 100).toFixed(2);
  return `¥${yuan}`;
}

// 加载报表数据
async function loadReportData() {
  try {
    uni.showLoading({
      title: '加载报表数据...'
    });
    
    const reportHandler = uniCloud.importObject('reportHandler');
    let result;
    
    if (activeTab.value === 'weekly') {
      // 加载周报表
      result = await reportHandler.getWeeklyReport({
        year: selectedYear.value,
        week: selectedWeek.value
      });
    } else {
      // 加载自定义日期报表
      const startDate = dayjs(startDateStr.value).valueOf();
      const endDate = dayjs(endDateStr.value).valueOf();
      
      // 获取预约报表
      const reservationResult = await reportHandler.getReservationReport({
        startDate,
        endDate
      });
      
      // 获取付费报表
      const paymentResult = await reportHandler.getPaymentReport({
        startDate,
        endDate
      });
      
      // 整合数据
      result = {
        errCode: 0,
        data: {
          timeRange: {
            startDate,
            endDate
          },
          reservationStats: reservationResult.data,
          paymentStats: paymentResult.data
        }
      };
    }
    
    if (result.errCode === 0 && result.data) {
      reportData.value = result.data;
      console.log("报表数据加载成功:", reportData.value);
    } else {
      uni.showToast({
        title: '获取报表失败: ' + (result.errMsg || '未知错误'),
        icon: 'none'
      });
      reportData.value = null; // 清空数据，避免显示旧数据
    }
  } catch (error) {
    console.error('加载报表数据失败:', error);
    uni.showToast({
      title: '加载报表数据失败: ' + error.message,
      icon: 'none'
    });
    reportData.value = null; // 清空数据，避免显示旧数据
  } finally {
    uni.hideLoading();
  }
}

// 组件挂载时自动加载当前周的报表
onMounted(() => {
  loadReportData();
});
</script>

<style lang="scss">
.container {
  padding: 20rpx;
  background-color: #f5f5f5;
  min-height: 100vh;
}

// 报表类型选择器
.report-type-selector {
  margin-bottom: 30rpx;
}

.tab-group {
  display: flex;
  background-color: #ffffff;
  border-radius: 12rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 20rpx 0;
  font-size: 28rpx;
  color: #666;
  position: relative;
}

.tab-item.active {
  color: #f59e0b;
  font-weight: bold;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 25%;
  width: 50%;
  height: 4rpx;
  background-color: #f59e0b;
  border-radius: 2rpx;
}

// 时间选择器
.time-selector {
  background-color: #ffffff;
  border-radius: 12rpx;
  padding: 20rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
}

.selector-row {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
}

.selector-label {
  width: 120rpx;
  font-size: 28rpx;
  color: #333;
}

.picker-value {
  flex: 1;
  height: 70rpx;
  line-height: 70rpx;
  padding: 0 20rpx;
  background-color: #f8f8f8;
  border-radius: 8rpx;
  font-size: 28rpx;
}

.date-range-picker {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.date-picker {
  display: flex;
  align-items: center;
}

.query-button {
  margin-top: 20rpx;
  background-color: #f59e0b;
  color: #ffffff;
  border: none;
  border-radius: 8rpx;
  font-size: 28rpx;
  height: 80rpx;
  line-height: 80rpx;
}

// 报表摘要
.report-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
  margin-bottom: 30rpx;
}

.summary-card {
  flex: 1;
  min-width: 300rpx;
  background-color: #ffffff;
  border-radius: 12rpx;
  padding: 20rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
}

.summary-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
  padding-bottom: 10rpx;
  border-bottom: 1px solid #f0f0f0;
}

.summary-content {
  display: flex;
  flex-direction: column;
  gap: 15rpx;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.item-label {
  font-size: 26rpx;
  color: #666;
  flex-shrink: 0; 
}

.item-value {
  font-size: 26rpx;
  color: #333;
  font-weight: 500;
  text-align: right;
  flex-shrink: 0; 
}

// 图表区域
.chart-section {
  margin-bottom: 30rpx;
}

.chart-card {
  background-color: #ffffff;
  border-radius: 12rpx;
  padding: 20rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
}

.chart-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
}

.chart-container {
  height: 400rpx; 
  width: 100%;
}

// 新增样式：环形图外部标题和副标题
.chart-content-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center; /* 居中显示外部标题和图表 */
  position: relative;
}

.chart-center-text {
  position: absolute; /* 绝对定位，使其可以覆盖在图表上方 */
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%); /* 居中 */
  z-index: 1; /* 确保在图表上方 */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  pointer-events: none; /* 允许点击穿透到图表 */
}

.chart-center-title-outside {
  font-size: 28rpx;
  color: #666666;
  margin-bottom: 5rpx;
}

.chart-center-subtitle-outside {
  font-size: 40rpx; /* 增大字体 */
  font-weight: bold;
  color: #7cb5ec;
}


// 机台详情表格
.machine-details-section {
  background-color: #ffffff;
  border-radius: 12rpx;
  padding: 20rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
  margin-bottom: 30rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
}

// 表格可滑动
.table-scroll-view {
  width: 100%;
  white-space: nowrap; 
}

.table-container {
  display: inline-block; 
  min-width: 100%; 
}

.table-header {
  display: flex;
  background-color: #f8f8f8;
  border-top: 1px solid #eee;
  border-bottom: 1px solid #eee;
}

.table-row {
  display: flex;
  border-bottom: 1px solid #f0f0f0;
}

.table-cell {
  flex: 1;
  min-width: 150rpx; 
  padding: 20rpx 10rpx;
  font-size: 26rpx;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap; 
}

.machine-name {
  flex: 1.5; 
  min-width: 200rpx;
  text-align: left;
  font-weight: 500;
}

.table-header .table-cell {
  color: #666;
  font-weight: bold;
}

// 无数据提示
.no-data-tip {
  text-align: center;
  padding: 100rpx 0;
  color: #999;
  font-size: 28rpx;
}

// 暗黑模式适配
@media (prefers-color-scheme: dark) {
  .container {
    background-color: #1c1c1e;
  }
  
  .tab-group, .time-selector, .summary-card, .chart-card, .machine-details-section {
    background-color: #2c2c2e;
    box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.2);
  }
  
  .tab-item {
    color: #aaa;
  }
  
  .tab-item.active {
    color: #f59e0b;
  }
  
  .selector-label, .summary-title, .chart-title, .section-title {
    color: #fff;
  }
  
  .picker-value {
    background-color: #3a3a3c;
    color: #fff;
  }
  
  .item-label {
    color: #aaa;
  }
  
  .item-value {
    color: #fff;
  }
  
  .table-header {
    background-color: #3a3a3c;
    border-color: #444;
  }
  
  .table-row {
    border-color: #444;
  }
  
  .table-cell {
    color: #ccc;
  }
  
  .table-header .table-cell {
    color: #fff;
  }
  
  .no-data-tip {
    color: #777;
  }

  .chart-center-title-outside {
    color: #aaa;
  }
  .chart-center-subtitle-outside {
    color: #7cb5ec; /* 保持颜色一致 */
  }
}
</style>
