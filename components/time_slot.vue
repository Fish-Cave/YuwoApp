<template>
  <view class="time-slot-container">
    <!-- Time indicators -->
    <view class="time-indicators">
      <text v-for="time in timeMarkers" :key="time" class="time-marker">{{ time }}</text>
    </view>

    <!-- Timeline with slots -->
    <view class="timeline">
      <!-- Timeline background -->
      <view class="timeline-bg"></view>

      <!-- Reserved slots -->
      <view 
        v-for="(slot, index) in timeSlots" 
        :key="index" 
        class="time-slot" 
        :style="{
          left: calculateLeftPosition(slot.startTime) + '%',
          width: calculateWidth(slot.startTime, slot.endTime) + '%',
          backgroundColor: slot.color || '#FF8D1A'
        }"
      >
        <text class="slot-text">{{ slot.text || `${formatTime(slot.startTime)}-${formatTime(slot.endTime)}` }}</text>
      </view>
    </view>

    <!-- User avatars (optional) -->
    <view class="user-avatars" v-if="showAvatars">
      <view v-for="(avatar, index) in avatars" :key="index" class="avatar-container">
        <image :src="avatar.src" class="user-avatar" mode="aspectFill" />
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue';
const props = defineProps({
  timeSlots: {
    type: Array,
    default: () => []
    // Format: [{ startTime: '2401010900', endTime: '2401011200', text: '共2人排队', color: '#FF8D1A' }]
  },
  avatars: {
    type: Array,
    default: () => []
    // Format: [{ src: '/path/to/image.jpg' }]
  },
  showAvatars: {
    type: Boolean,
    default: false
  },
  startHour: {
    type: Number,
    default: 0
  },
  endHour: {
    type: Number,
    default: 24
  }
});
// Generate time markers for the timeline (0:00, 12:00, 24:00)
const timeMarkers = computed(() => {
  const markers = [];
  for (let i = props.startHour; i <= props.endHour; i += 12) {
    markers.push(i === 24 ? '24:00' : `${i}:00`);
  }
  return markers;
});
// Calculate position and width of time slots
const calculateLeftPosition = (timeString) => {
  // Extract hour and minute from YYMMDDHHMM
  const hour = parseInt(timeString.substring(6, 8));
  const minute = parseInt(timeString.substring(8, 10));
  
  // Calculate position as percentage of day
  const totalMinutes = (hour * 60) + minute;
  const dayPercentage = (totalMinutes / (24 * 60)) * 100;
  
  return dayPercentage;
};
const calculateWidth = (startTime, endTime) => {
  const startPosition = calculateLeftPosition(startTime);
  const endPosition = calculateLeftPosition(endTime);
  
  return endPosition - startPosition;
};
// Format time from YYMMDDHHMM to HH:MM
const formatTime = (timeString) => {
  const hour = timeString.substring(6, 8);
  const minute = timeString.substring(8, 10);
  return `${hour}:${minute}`;
};
</script>

<style scoped>
.time-slot-container {
  width: 100%;
  position: relative;
  margin: 20rpx 0;
}
.time-indicators {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5rpx;
}
.time-marker {
  font-size: 24rpx;
  color: #666;
}
.timeline {
  height: 60rpx;
  position: relative;
  border-radius: 30rpx;
  overflow: hidden;
}
.timeline-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to right, rgba(255, 237, 160, 0.8), rgba(255, 226, 122, 0.8));
  z-index: 1;
}
.time-slot {
  position: absolute;
  height: 100%;
  border-radius: 30rpx;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
}
.slot-text {
  color: white;
  font-size: 24rpx;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 0 10rpx;
}
.user-avatars {
  display: flex;
  margin-top: 10rpx;
}
.avatar-container {
  margin-right: 10rpx;
}
.user-avatar {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
}
</style>