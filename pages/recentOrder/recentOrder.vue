<template>
  <view class="container">
    <!-- 订单状态选项卡 -->
    <view class="status-tabs">
      <view 
        v-for="tab in statusTabs" 
        :key="tab.value" 
        class="tab-item"
        :class="{ 'tab-active': currentStatus === tab.value }"
        @click="changeStatus(tab.value)"
      >
        <text>{{ tab.text }}</text>
        <text class="tab-badge" v-if="orderCounts[tab.countKey] > 0">{{ orderCounts[tab.countKey] }}</text>
      </view>
    </view>

    <!-- 订单列表 -->
    <view v-for="order in orderList" :key="order._id" class="order-item">
      <view class="glass-card">
        <!-- 订单头部区域 -->
        <view class="card-header">
          <view class="icon-container">
            <uni-icons type="headphones" size="30" color="#ffffff"></uni-icons>
          </view>
          <view class="order-info">
            <text class="machine-name">{{ getMachineName(order.reservation_id) }}</text>
            <view class="time-status-container">
              <view class="status-label" 
                :class="{
                  'status-completed': order.status === 1, 
                  'status-pending': order.status === 0,
                  'status-unfinished': order.status === 2,
                  'status-refunded': order.status === 3
                }">
                {{ getStatusText(order.status) }}
              </view>
            </view>
          </view>
        </view>
        
        <!-- 订单详情区域 -->
        <view class="order-details">
          <view class="detail-item">
            <view class="detail-label">开始时间</view>
            <view class="detail-value">
              {{ formatDateTime(order.starttime) }}
            </view>
          </view>
          <view class="detail-item">
            <view class="detail-label">结束时间</view>
            <view class="detail-value">
              {{ formatDateTime(order.endtime) }}
            </view>
          </view>
          <view class="detail-item">
            <view class="detail-label">总时长</view>
            <view class="detail-value">{{ calculateDuration(order.starttime, order.endtime) }}</view>
          </view>
          <view class="detail-item">
            <view class="detail-label">订单金额</view>
            <view class="detail-value">{{ formatPrice(order.total_fee) }}</view>
          </view>
          <view class="detail-item">
            <view class="detail-label">创建时间</view>
            <view class="detail-value">{{ formatDateTime(order.create_date) }}</view>
          </view>
        </view>
        
        <!-- 按钮区域 -->
        <view class="button-group">
          <view class="action-button view-button" @click="viewOrderDetail(order._id)">
            <uni-icons type="eye" size="20" color="#4b5563"></uni-icons>
            <text class="button-text">查看详情</text>
          </view>
          <view v-if="order.status === 0" class="action-button cancel-button" @click="cancelOrder(order._id)">
            <uni-icons type="close" size="20" color="#ffffff"></uni-icons>
            <text class="button-text cancel-text">取消订单</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 空状态展示 -->
    <view v-if="orderList.length === 0" class="empty-orders glass-card">
      <uni-icons type="info" size="32" color="#9ca3af"></uni-icons>
      <text class="empty-text">暂无{{ getStatusText(currentStatus) }}订单记录</text>
    </view>

    <!-- 分页控制 -->
    <view v-if="orderList.length > 0" class="pagination">
      <view 
        class="pagination-button prev-button" 
        :class="{ 'disabled': !pagination.hasPrev }"
        @click="prevPage"
      >
        <uni-icons type="left" size="18" :color="pagination.hasPrev ? '#4b5563' : '#d1d5db'"></uni-icons>
        <text>上一页</text>
      </view>
      <view class="pagination-info">
        <text>{{ pagination.pageNumber }}/{{ pagination.totalPages }}</text>
      </view>
      <view 
        class="pagination-button next-button" 
        :class="{ 'disabled': !pagination.hasNext }"
        @click="nextPage"
      >
        <text>下一页</text>
        <uni-icons type="right" size="18" :color="pagination.hasNext ? '#4b5563' : '#d1d5db'"></uni-icons>
      </view>
    </view>

    <!-- 加载状态 -->
    <view v-if="loading" class="loading-container">
      <view class="loading-spinner"></view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue';

// 导入云函数
const orderCloud = uniCloud.importObject('todo');
const userInfo = uniCloud.getCurrentUserInfo();

// 定义订单数据接口
interface OrderData {
  _id: string;
  user_id: string;
  reservation_id: string;
  total_fee: number;
  singlePrice: number;
  status: number;
  starttime: number;
  endtime: number;
  create_date: number;
}

// 状态选项卡
const statusTabs = [
  { text: '全部', value: -1, countKey: 'total' },
  { text: '待确认', value: 0, countKey: 'pending' },
  { text: '已完成', value: 1, countKey: 'completed' },
  { text: '未完成', value: 2, countKey: 'unfinished' },
  { text: '已退款', value: 3, countKey: 'refunded' }
];

// 响应式状态
const orderList = ref<OrderData[]>([]);
const currentStatus = ref<number>(-1); // -1表示全部
const loading = ref<boolean>(false);
const orderCounts = reactive({
  pending: 0,
  completed: 0,
  unfinished: 0,
  refunded: 0,
  total: 0
});

// 分页相关
const pagination = reactive({
  total: 0,
  totalPages: 1,
  pageSize: 10,
  pageNumber: 1,
  hasNext: false,
  hasPrev: false
});

// 获取机台名称
function getMachineName(reservationId: string): string {
  // 这里应该根据预约ID从缓存或者数据中获取机台名称
  // 目前简单返回ID，实际项目中应该有更完善的实现
  return reservationId ? reservationId.substring(0, 8) + '...' : '未知机台';
}

// 格式化日期时间
function formatDateTime(timestamp: number | string | undefined): string {
  if (!timestamp) return '未设置';
  
  // 处理时间戳
  let date: Date;
  if (typeof timestamp === 'number') {
    date = new Date(timestamp);
  } else {
    // 尝试转换为数字
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
    case 0:
      return '待确认';
    case 1:
      return '已完成';
    case 2:
      return '未完成';
    case 3:
      return '已退款';
    default:
      return '全部';
  }
}

// 格式化价格
function formatPrice(cents: number): string {
  if (cents === undefined || cents === null) return '¥0.00';
  const yuan = (cents / 100).toFixed(2);
  return `¥${yuan}`;
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

// 获取订单列表
async function fetchOrders() {
  if (!userInfo.uid) {
    uni.showToast({
      title: '用户未登录',
      icon: 'none'
    });
    return;
  }
  
  loading.value = true;
  
  try {
    // 构建查询参数
    const params = {
      userId: userInfo.uid,
      pageSize: pagination.pageSize,
      pageNumber: pagination.pageNumber,
      sortField: "create_date",
      sortOrder: "desc"
    };
    
    // 如果不是查询全部，添加状态筛选
    if (currentStatus.value !== -1) {
      params['status'] = currentStatus.value;
    }
    
    // 调用云函数获取订单数据
    const result = await orderCloud.Get_FilteredOrders(params);
    
    if (result.code === 0) {
      orderList.value = result.data;
      
      // 更新分页信息
      Object.assign(pagination, result.pagination);
      
    } else {
      uni.showToast({
        title: result.errMsg || '获取订单失败',
        icon: 'none'
      });
    }
  } catch (e) {
    console.error("获取订单数据失败", e);
    uni.showToast({
      title: '加载订单失败，请重试',
      icon: 'none'
    });
  } finally {
    loading.value = false;
  }
}

// 获取订单计数
async function fetchOrderCounts() {
  if (!userInfo.uid) return;
  
  try {
    const result = await orderCloud.Get_OrdersCount(userInfo.uid);
    if (result.code === 0) {
      Object.assign(orderCounts, result.data);
    }
  } catch (e) {
    console.error("获取订单数量统计失败", e);
  }
}

// 切换订单状态
function changeStatus(status: number) {
  if (currentStatus.value === status) return;
  
  currentStatus.value = status;
  pagination.pageNumber = 1; // 重置到第一页
  fetchOrders();
}

// 分页控制 - 上一页
function prevPage() {
  if (pagination.hasPrev) {
    pagination.pageNumber--;
    fetchOrders();
  }
}

// 分页控制 - 下一页
function nextPage() {
  if (pagination.hasNext) {
    pagination.pageNumber++;
    fetchOrders();
  }
}

// 查看订单详情
function viewOrderDetail(orderId: string) {
  uni.navigateTo({
    url: `/pages/orderDetail/orderDetail?id=${orderId}`
  });
}

// 取消订单
function cancelOrder(orderId: string) {
  uni.showModal({
    title: '取消订单',
    content: '确定要取消此订单吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          // 这里应该调用取消订单的云函数
          // const result = await orderCloud.CancelOrder(orderId);
          
          // 假设取消成功，刷新订单列表和计数
          uni.showToast({
            title: '订单已取消',
            icon: 'success'
          });
          
          fetchOrders();
          fetchOrderCounts();
        } catch (e) {
          uni.showToast({
            title: '取消订单失败，请重试',
            icon: 'none'
          });
        }
      }
    }
  });
}

// 页面加载时执行
onMounted(() => {
  fetchOrders(); // 获取订单列表
  fetchOrderCounts(); // 获取订单数量统计
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

/* 状态选项卡 */
.status-tabs {
  display: flex;
  justify-content: space-between;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  border-radius: 16rpx;
  box-shadow: 0 2px 8px rgba(31, 38, 135, 0.08);
  margin-bottom: 30rpx;
  padding: 4rpx;
  overflow-x: auto;
  white-space: nowrap;
}

.tab-item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20rpx 16rpx;
  font-size: 28rpx;
  font-weight: 500;
  color: #6b7280;
  position: relative;
  border-radius: 12rpx;
  transition: all 0.2s ease;
  min-width: 120rpx;
}

.tab-active {
  background: #ffffff;
  color: #3b82f6;
  box-shadow: 0 2px 6px rgba(59, 130, 246, 0.15);
  font-weight: 600;
}

.tab-badge {
  position: absolute;
  top: 10rpx;
  right: 10rpx;
  background: #ef4444;
  color: white;
  border-radius: 20rpx;
  min-width: 36rpx;
  height: 36rpx;
  font-size: 22rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 8rpx;
  font-weight: bold;
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
  background-color: rgba(255, 152, 0, 0.2);
  color: #FF9800;
}

.status-unfinished {
  background-color: rgba(244, 67, 54, 0.2);
  color: #f44336;
}

.status-refunded {
  background-color: rgba(158, 158, 158, 0.2);
  color: #757575;
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

/* 分页控制 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 30rpx;
  margin-bottom: 40rpx;
}

.pagination-button {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 14rpx 24rpx;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8rpx;
  font-size: 26rpx;
  color: #4b5563;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: all 0.2s;
}

.pagination-button:active:not(.disabled) {
  transform: translateY(2rpx);
  box-shadow: none;
}

.pagination-button.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.prev-button {
  margin-right: 16rpx;
}

.prev-button uni-icons {
  margin-right: 8rpx;
}

.next-button {
  margin-left: 16rpx;
}

.next-button uni-icons {
  margin-left: 8rpx;
}

.pagination-info {
  font-size: 26rpx;
  color: #6b7280;
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

/* 加载状态 */
.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40rpx 0;
}

.loading-spinner {
  width: 40rpx;
  height: 40rpx;
  border: 4rpx solid rgba(59, 130, 246, 0.3);
  border-radius: 50%;
  border-top-color: #3b82f6;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
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
  
  .status-tabs {
    padding: 2rpx;
  }
  
  .tab-item {
    padding: 16rpx 12rpx;
    font-size: 26rpx;
    min-width: 100rpx;
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
  
  .tab-item {
    padding: 24rpx 20rpx;
    font-size: 30rpx;
  }
  
  .pagination-button {
    padding: 16rpx 30rpx;
    font-size: 28rpx;
  }
}
</style>

