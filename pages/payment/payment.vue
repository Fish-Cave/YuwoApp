<template>
  <view class="container">
    <view class="payment-header">
      <text class="header-title">结算详情</text>
    </view>
    
    <!-- 订单信息卡片 -->
    <view class="order-card">
      <view class="order-section">
        <text class="section-title">使用详情</text>
        <view class="info-row">
          <text class="info-label">使用时长</text>
          <text class="info-value">{{ orderData.duration }}</text>
        </view>
        <view class="info-row">
          <text class="info-label">开始时间</text>
          <text class="info-value">{{ formatTime(orderData.startTime) }}</text>
        </view>
        <view class="info-row">
          <text class="info-label">结束时间</text>
          <text class="info-value">{{ formatTime(orderData.endTime) }}</text>
        </view>
        <view class="info-row">
          <text class="info-label">机台名称</text>
          <text class="info-value">{{ orderData.machineName }}</text>
        </view>
      </view>
      
      <view class="divider"></view>
      
      <view class="order-section">
        <text class="section-title">费用详情</text>
        <view class="fee-row">
          <text class="fee-label">基础费用</text>
          <text class="fee-value">¥{{ orderData.fee.toFixed(2) }}</text>
        </view>
        <view class="fee-row" v-if="orderData.isMember">
          <text class="fee-label">会员优惠</text>
          <text class="fee-value discount">已享受会员价</text>
        </view>
        <view class="fee-row total">
          <text class="fee-label">应付金额</text>
          <text class="fee-value total-amount">¥{{ orderData.fee.toFixed(2) }}</text>
        </view>
      </view>
    </view>
    
    <!-- 底部支付按钮 -->
    <view class="footer">
      <view class="total-display">
        <text class="total-label">合计:</text>
        <text class="total-amount">¥{{ orderData.fee.toFixed(2) }}</text>
      </view>
      <view class="pay-button" @tap="handlePayment">
        <text>立即支付</text>
      </view>
    </view>
    
    <!-- 引入 uni-pay 组件 -->
    <uni-pay ref="pay" 
      return-url="/pages/order-detail/order-detail" 
      @success="onPaySuccess" 
      @cancel="onPayCancel"
      @fail="onPayFail"
      @create="onPayCreate">
    </uni-pay>
  </view>
</template>

<script>
</script>

<style>
/* 样式保持不变 */
.container {
  padding: 30rpx;
  background-color: #f8f9fa;
  min-height: 100vh;
  box-sizing: border-box;
  padding-bottom: 180rpx;
}

.payment-header {
  margin-bottom: 30rpx;
}

.header-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
}

.order-card {
  background-color: #fff;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
  padding: 30rpx;
  margin-bottom: 30rpx;
}

.order-section {
  margin-bottom: 20rpx;
}

.section-title {
  font-size: 28rpx;
  color: #666;
  margin-bottom: 20rpx;
  display: block;
}

.info-row, .fee-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 15rpx;
}

.info-label, .fee-label {
  font-size: 28rpx;
  color: #666;
}

.info-value, .fee-value {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
}

.divider {
  height: 1rpx;
  background-color: #eee;
  margin: 20rpx 0;
}

.fee-row.total {
  margin-top: 20rpx;
  padding-top: 20rpx;
  border-top: 1rpx dashed #eee;
}

.total-amount {
  font-size: 32rpx;
  font-weight: bold;
  color: #ff6b6b;
}

.discount {
  color: #4cd964;
}

.footer {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  background-color: #fff;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 30rpx;
  box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.05);
  box-sizing: border-box;
}

.total-display {
  display: flex;
  align-items: baseline;
}

.total-label {
  font-size: 28rpx;
  color: #666;
  margin-right: 10rpx;
}

.pay-button {
  background: linear-gradient(135deg, #ff6b6b 0%, #ff8e8e 100%);
  border-radius: 40rpx;
  height: 80rpx;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0 40rpx;
}

.pay-button text {
  color: #fff;
  font-size: 28rpx;
  font-weight: bold;
}
</style>