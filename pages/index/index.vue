<template>
  <view class="container">
    <!-- Header Navigation -->
    <view class="header">
      <view class="nav-item">
        <uni-icons type="arrow-left" size="20"></uni-icons>
        <text class="nav-text">前一天</text>
      </view>

      <view class="date-container">
        <view class="location">
          <text>当前位置: </text>
          <text class="shop-name">{{ shopName }}</text>
        </view>
        <view class="date-pill">
          <text>{{ nowDate }}</text>
        </view>
        <view class="calendar-btn">
          <uni-icons type="calendar" size="16"></uni-icons>
          <text>日历</text>
        </view>
      </view>

      <view class="nav-item">
        <text class="nav-text">后一天</text>
        <uni-icons type="arrow-right" size="20"></uni-icons>
      </view>
    </view>

    <view class="divider"></view>

    <!-- Machine Info Tip -->
    <view class="tip-container">
      <text class="tips">点击机台名称可查看机台信息</text>
    </view>

    <!-- IIDX Section -->
    <view class="machine-section">
      <uni-section title="IIDX" type="line">
        <MachineTimeSlot
          machineName="机台1"
          machineType="IIDX"
          :machineCount="1"
          :maxQueueCount="3"
          :timeSlots="iidxTimeSlots"
          :avatars="iidxAvatars"
          :showAvatars="true"
          statusMessage="折叠预约列表"
          buttonText="预约此机台"
          @buttonClick="handleBooking"
        />
      </uni-section>
    </view>

    <!-- SDVX Section -->
    <view class="machine-section">
      <uni-section title="SDVX" type="line">
        <MachineTimeSlot
          machineName="机台1"
          machineType="SDVX"
          :machineCount="1"
          :maxQueueCount="2"
          :timeSlots="sdvxTimeSlots"
          :avatars="sdvxAvatars"
          :showAvatars="true"
          statusMessage="打开预约列表"
          buttonText="预约此机台"
          @buttonClick="handleBooking"
        />
        <MachineTimeSlot
          machineName="机台2"
          machineType="SDVX"
          :machineCount="1"
          :maxQueueCount="2"
          :timeSlots="sdvxTimeSlots"
          :avatars="sdvxAvatars"
          :showAvatars="true"
          statusMessage="打开预约列表"
          buttonText="预约此机台"
          @buttonClick="handleBooking"
        />
      </uni-section>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import MachineTimeSlot from './time-slot.vue';

const shopName = ref("鱼窝一号店");
const nowDate = ref("2024-08-21 星期三");

const allTimeSlots = ref([
  // IIDX time slots (overlapping reservations)
  {
    startTime: '2408210900',
    endTime: '2408211200',
    text: '9:00-12:00',
    color: '#FF8D1A',
    machine: 'IIDX',
    userId: '1'
  },
  {
    startTime: '2408211000',
    endTime: '2408211500',
    text: '10:00-15:00',
    color: '#FF8D1A',
    machine: 'IIDX',
    userId: '2'
  },

  // SDVX time slots
  {
    startTime: '2408210700',
    endTime: '2408211200',
    text: '7:00-12:00',
    color: '#FF8D1A',
    machine: 'SDVX',
    userId: '3'
  }
]);

// Separate time slots for each machine type
const iidxTimeSlots = ref(allTimeSlots.value.filter(slot => slot.machine === 'IIDX'));
const sdvxTimeSlots = ref(allTimeSlots.value.filter(slot => slot.machine === 'SDVX'));

// Machine-specific avatar data
const iidxAvatars = ref([
  { src: '/static/avatar1.png' },
  { src: '/static/avatar2.png' }
]);

const sdvxAvatars = ref([
  { src: '/static/avatar3.png' }
]);

// Handle booking button click
function handleBooking(machineType) {
  console.log(`Booking machine type: ${machineType}`);
}
</script>

<style lang="scss">
.container {
  background-color: #f5f5f5;
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
}

/* Header Styles */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 30rpx;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.nav-text {
  font-size: 28rpx;
  color: #333;
}

.date-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10rpx;
}

.location {
  font-size: 28rpx;
  color: #333;
}

.shop-name {
  color: #FF8D1A;
}

.date-pill {
  background-color: #FFD700;
  padding: 8rpx 40rpx;
  border-radius: 30rpx;
  margin-top: 10rpx;
  margin-bottom: 10rpx;
}

.calendar-btn {
  display: flex;
  align-items: center;
  gap: 10rpx;
  font-size: 26rpx;
  color: #666;
}

/* Divider */
.divider {
  height: 2rpx;
  background-color: #e5e5e5;
  margin: 0 30rpx;
}

/* Tip Container */
.tip-container {
  padding: 20rpx 30rpx;
}

.tips {
  font-size: 24rpx;
  color: #999;
}

/* Machine Sections */
.machine-section {
  margin-bottom: 40rpx;
  margin-left: 30rpx;
  margin-right: 30rpx;
}

</style>
