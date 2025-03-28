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
export default {
  data() {
    return {
      orderData: {
        signinId: '',
        reservationId: '',
        startTime: 0,
        endTime: 0,
        duration: '',
        fee: 0,
        isMember: false,
        isPlay: false,
        machineName: ''
      },
      baseOrderId: '', // 基础订单ID
      isProcessing: false // 防止重复点击支付按钮
    };
  },
  
  onLoad() {
    // 从上一页获取数据
    const eventChannel = this.getOpenerEventChannel();
    eventChannel.on('acceptPaymentData', (data) => {
      console.log('接收到的支付数据:', data);
      this.orderData = data;
    });
  },
  
  methods: {
    // 格式化时间
    formatTime(timestamp) {
      if (!timestamp) return '';
      const date = new Date(timestamp);
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const hour = date.getHours().toString().padStart(2, '0');
      const minute = date.getMinutes().toString().padStart(2, '0');
      
      return `${year}-${month}-${day} ${hour}:${minute}`;
    },
    
    // 处理支付
    async handlePayment() {
      if (this.isProcessing) return;
      
      this.isProcessing = true;
      
      try {
        uni.showLoading({
          title: '处理中...'
        });
        
        // 1. 首先创建基础订单
        const todo = uniCloud.importObject('todo');
        const result = await todo.CreateBaseOrder({
          signinId: this.orderData.signinId,
          reservationId: this.orderData.reservationId,
          fee: this.orderData.fee,
          startTime: this.orderData.startTime,
          endTime: this.orderData.endTime
        });
        
        uni.hideLoading();
        
        if (result.code !== 0) {
          uni.showToast({
            title: result.message || '创建订单失败',
            icon: 'none'
          });
          this.isProcessing = false;
          return;
        }
        
        // 保存基础订单ID
        this.baseOrderId = result.data.orderId;
        
        // 2. 使用 uni-pay 组件发起支付
        // 计算金额，转换为分
        const totalFee = Math.round(this.orderData.fee * 100);
        
        // 打开支付收银台
        this.$refs.pay.open({
          total_fee: totalFee, // 支付金额，单位分
          order_no: this.baseOrderId, // 业务系统订单号
          out_trade_no: `${this.baseOrderId}-${Date.now()}`, // 支付插件订单号
          description: `座位使用费用-${this.orderData.machineName}`, // 支付描述
          type: 'seat_usage', // 支付回调类型
          custom: {
            signinId: this.orderData.signinId,
            reservationId: this.orderData.reservationId
          }
        });
        
      } catch (error) {
        uni.hideLoading();
        console.error('支付处理错误:', error);
        uni.showToast({
          title: '支付处理错误，请重试',
          icon: 'none'
        });
        this.isProcessing = false;
      }
    },
    
    // 支付成功回调
    onPaySuccess(res) {
      console.log('支付成功:', res);
      
      // 支付成功后跳转到成功页面
      uni.redirectTo({
        url: `/pages/payment-success/payment-success?orderId=${this.baseOrderId}`
      });
    },
    
    // 支付取消回调
    onPayCancel(res) {
      console.log('支付取消:', res);
      this.isProcessing = false;
      
      uni.showToast({
        title: '支付已取消',
        icon: 'none'
      });
    },
    
    // 支付失败回调
    onPayFail(res) {
      console.log('支付失败:', res);
      this.isProcessing = false;
      
      uni.showToast({
        title: '支付失败，请重试',
        icon: 'none'
      });
    },
    
    // 创建支付订单回调
    onPayCreate(res) {
      console.log('创建支付订单:', res);
      // 可以在这里处理创建订单成功但用户还未支付的情况
    }
  }
}
</script>

<style>
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