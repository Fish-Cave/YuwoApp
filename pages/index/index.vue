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

    <!-- Dynamic Machine Sections -->
    <view class="machine-section" v-for="machineType in machineTypes" :key="machineType.type">
      <uni-section :title="machineType.displayName" type="line">
        <MachineTimeSlot
          v-for="machine in machineType.machines"
          :key="machine.name"
          :machineName="machine.name"
          :machineType="machineType.type"
          :machineCount="machine.count"
          :maxQueueCount="machine.maxQueue"
          :timeSlots="getTimeSlots(machineType.type, machine.name)"
          :avatars="machineType.defaultAvatars"
          :showAvatars="true"
          statusMessage="折叠预约列表"
          buttonText="预约此机台"
          :machineDescription="machineType.description"
          @buttonClick="handleBooking"
        >
        </MachineTimeSlot>
      </uni-section>
    </view>
  </view>

</template>

<script lang="ts" setup>
import { ref, onMounted, computed } from 'vue';
import MachineTimeSlot from './time-slot.vue';
import machineTypesData from './machine-types.json';

const shopName = ref("鱼窝一号店");
const nowDate = ref("2024-08-21 星期三");
const machineTypes = ref(machineTypesData);

const allTimeSlots = ref([
  {
    startTime: '2408210900',
    endTime: '2408211200',
    color: '#FF8D1A',
    machine: 'IIDX',
    machineName: 'IIDX-机台1',
    userId: '1'
  },
  {
    startTime: '2408211000',
    endTime: '2408211500',
    color: '#FF8D1A',
    machine: 'IIDX',
    machineName: 'IIDX-机台1',
    userId: '2'
  },
  {
    startTime: '2408211700',
    endTime: '2408212000',
    color: '#FF8D1A',
    machine: 'IIDX',
    machineName: 'IIDX-机台1',
    userId: '7'
  },
  {
    startTime: '2408210000',
    endTime: '2408210200',
    color: '#FF8D1A',
    machine: 'IIDX',
    machineName: 'IIDX-机台1',
    userId: '8'
  },

  {
    startTime: '2408210700',
    endTime: '2408211200',
    color: '#FF8D1A',
    machine: 'SDVX',
    machineName: 'SDVX-机台1',
    userId: '3'
  },
  {
    startTime: '2408210900',
    endTime: '2408211800',
    color: '#FF8D1A',
    machine: 'SDVX',
    machineName: 'SDVX-机台2',
    userId: '4'
  },
   {
     startTime: '2408211200',
     endTime: '2408211600',
     color: '#FF8D1A',
     machine: 'DDR',
     machineName: 'DDR-机台1',
     userId: '5'
   }
]);

const getTimeSlots = (machineType, machineName) => {
  return allTimeSlots.value.filter(slot => slot.machine === machineType && slot.machineName === machineName);
};

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

.divider {
  height: 2rpx;
  background-color: #e5e5e5;
  margin: 0 30rpx;
}

.tip-container {
  padding: 20rpx 30rpx;
}

.tips {
  font-size: 24rpx;
  color: #999;
}

.machine-section {
  margin-bottom: 40rpx;
  margin-left: 30rpx;
  margin-right: 30rpx;
}

</style>
