<template>
  <view class="machine-time-slot">
    <view class="machine-header">
      <text class="machine-name" @click="showMachineInfo">{{ machineName }}</text>
      <view class="machine-stats">
        <view class="stat-item">
          <text>机台数</text>
          <text class="stat-value">{{ machineCount }}</text>
        </view>
        <view class="stat-item">
          <text>最多可排队数</text>
          <text class="stat-value">{{ maxQueueCount }}</text>
        </view>
      </view>
    </view>

    <slot name="machine-info"></slot>

    <view class="time-slot-section">
      <view class="user-avatars" v-if="showAvatars && !isFolded">
        <image
          v-for="(avatar, index) in avatars"
          :key="index"
          :src="avatar.src"
          class="user-avatar"
          mode="aspectFill"
        />
      </view>

      <view class="user-avatars-merged" v-if="showAvatars && isFolded && totalUserCount > 0">
        <image
          v-for="(avatar, index) in avatars.slice(0, 2)"
          :key="index"
          :src="avatar.src"
          class="user-avatar"
          :style="{ marginLeft: index > 0 ? '-15rpx' : '0' }"
          mode="aspectFill"
        />
      </view>

      <view class="timelines-container">
        <view class="time-indicators">
          <text v-for="time in timeMarkers" :key="time" class="time-marker">{{ time }}</text>
        </view>

        <view class="timeline">
          <view class="timeline-bg"></view>
          <view
            v-for="(slot, index) in mergedTimeSlots"
            :key="'merged-' + index"
            class="time-slot"
            :style="{
              left: calculateLeftPosition(slot.startTime) + '%',
              width: calculateWidth(slot.startTime, slot.endTime) + '%',
            }"
          >
            <text
              ref="slotTextRefs"
              class="slot-text"
              :class="{
                'text-centered': textPosition[index] === 'center',
                'text-left': textPosition[index] === 'left',
                'text-right': textPosition[index] === 'right'
              }"
              :style="{
                '--left-offset': textOffsets[index] + 'rpx',
                '--right-offset': textOffsets[index] + 'rpx'
              }"
              v-if="index === longestSlotIndex"
            >
              共 {{ totalUserCount }} 人排队
            </text>
          </view>
        </view>

        <view v-if="!isFolded" class="individual-timelines">
          <view
            v-for="(slot, slotIndex) in filteredTimeSlots"
            :key="'user-' + slotIndex"
            class="timeline user-timeline"
          >
            <view class="timeline-bg user-timeline-bg"></view>
            <view
              class="time-slot"
              :style="{
                left: calculateLeftPosition(slot.startTime) + '%',
                width: calculateWidth(slot.startTime, slot.endTime) + '%',
                backgroundColor: slot.color || '#FF8D1A'
              }"
            >
              <text class="slot-text">{{ calculateText(slot.startTime, slot.endTime) }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <view class="status-message" v-if="totalUserCount > 2" @click="toggleFold">
      <text class="status-text">{{ isFolded ? '打开预约列表' : '折叠预约列表' }}</text>
      <text class="toggle-icon">{{ isFolded ? '▼' : '▲' }}</text>
    </view>

    <button class="action-button" @click="onButtonClick">{{ buttonText }}</button>

    <uni-popup ref="popup" type="dialog" @change="change">
      <uni-popup-dialog
        :title="machineName"
        :content="machineDescription"
        :type="msgType"
        @confirm="dialogConfirm"
        @close="dialogClose"
      />
    </uni-popup>
  </view>
</template>

<script setup>
import { computed, ref, onMounted, nextTick } from 'vue';
import { defineEmits, defineProps } from 'vue';

const props = defineProps({
  machineName: {
    type: String,
    default: '机台1'
  },
  machineType: {
    type: String,
    default: ''
  },
  machineCount: {
    type: [Number, String],
    default: 1
  },
  maxQueueCount: {
    type: [Number, String],
    default: 2
  },
  timeSlots: {
    type: Array,
    default: () => []
  },
  avatars: {
    type: Array,
    default: () => []
  },
  showAvatars: {
    type: Boolean,
    default: true
  },
  startHour: {
    type: Number,
    default: 0
  },
  endHour: {
    type: Number,
    default: 24
  },
  statusMessage: {
    type: String,
    default: '折叠预约列表'
  },
  buttonText: {
    type: String,
    default: '预约此机台'
  },
  machineDescription: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['buttonClick']);
const isFolded = ref(true);
const popup = ref(null);
const msgType = ref('info');
const textPosition = ref([]);
const textOffsets = ref([]);  //  存储文本偏移量的数组
const slotTextRefs = ref([]);

const filteredTimeSlots = computed(() => {
  return props.timeSlots.filter(slot => slot.machine === props.machineType && slot.machineName === props.machineName);
});

const totalUserCount = computed(() => {
  return filteredTimeSlots.value.length;
});

const toggleFold = () => {
  isFolded.value = !isFolded.value;
};

const mergedTimeSlots = computed(() => {
  if (filteredTimeSlots.value.length === 0) {
    return [];
  }

  const sortedSlots = [...filteredTimeSlots.value].sort((a, b) => {
    const startTimeA = parseInt(a.startTime);
    const startTimeB = parseInt(b.startTime);
    return startTimeA - startTimeB;
  });

  const merged = [];
  let current = { ...sortedSlots[0] };

  for (let i = 1; i < sortedSlots.length; i++) {
    const currentEndTime = parseInt(current.endTime);
    const nextStartTime = parseInt(sortedSlots[i].startTime);
    const nextEndTime = parseInt(sortedSlots[i].endTime);

    if (currentEndTime >= nextStartTime) {
      if (nextEndTime > currentEndTime) {
        current.endTime = sortedSlots[i].endTime;
      }
      current.userCount = (current.userCount || 1) + 1;
    } else {
      merged.push(current);
      current = { ...sortedSlots[i] };
    }
  }

  merged.push(current);
  return merged;
});

const timeMarkers = computed(() => {
  return ['00:00', '12:00', '24:00'];
});

const calculateLeftPosition = (timeString) => {
  const hour = parseInt(timeString.substring(6, 8));
  const minute = parseInt(timeString.substring(8, 10));
  const totalMinutes = (hour * 60) + minute;
  const dayPercentage = (totalMinutes / (24 * 60)) * 100;

  return dayPercentage;
};

const calculateWidth = (startTime, endTime) => {
  const startPosition = calculateLeftPosition(startTime);
  const endPosition = calculateLeftPosition(endTime);
  const width = endPosition - startPosition;
  return width;
};

const calculateText = (startTime, endTime) => {
  const start = formatTime(startTime);
  const end = formatTime(endTime);
  return `${start}-${end}`;
}

const formatTime = (timeString) => {
  const hour = timeString.substring(6, 8);
  const minute = timeString.substring(8, 10);
  return `${hour}:${minute}`;
};

const onButtonClick = () => {
  emit('buttonClick', props.machineType);
};

const showMachineInfo = () => {
  popup.value.open('dialog');
};

const closePopup = () => {
  popup.value.close();
};

const dialogConfirm = () => {
  popup.value.close();
};

const dialogClose = () => {
  popup.value.close();
};

const change = (e) => {
  console.log('当前模式：' + e.type + ',状态：' + e.show);
};

const longestSlotIndex = computed(() => {
  if (!mergedTimeSlots.value || mergedTimeSlots.value.length === 0) {
    return -1;
  }

  let longestIndex = 0;
  let maxLength = 0;

  for (let i = 0; i < mergedTimeSlots.value.length; i++) {
    const slot = mergedTimeSlots.value[i];
    const width = calculateWidth(slot.startTime, slot.endTime);
    if (width > maxLength) {
      maxLength = width;
      longestIndex = i;
    }
  }
  return longestIndex;
});

const calculateTextPosition = async () => {
  if (!mergedTimeSlots.value) {
    return;
  }
  await nextTick();

  const positions = [];
  const offsets = [];

  for (let i = 0; i < mergedTimeSlots.value.length; i++) {
    const slot = mergedTimeSlots.value[i];
    const slotStart = calculateLeftPosition(slot.startTime);
    const slotEnd = calculateLeftPosition(slot.endTime);
    const slotWidth = slotEnd - slotStart;

    const textEl = slotTextRefs.value[i];
    const textWidth = textEl ? textEl.offsetWidth : 0; // 获取文本的实际宽度

    const isTextOverflowingLeft = slotStart < (textWidth / 200); // 转换为百分比
    const isTextOverflowingRight = (100 - slotEnd) < (textWidth / 200); // 转换为百分比

    let offset = 5;  // 默认偏移量
    if (isTextOverflowingLeft) {
      positions.push('left');
      offset = Math.max(5, (textWidth / 200) - slotStart); // 确保文本完整显示
    } else if (isTextOverflowingRight) {
      positions.push('right');
      offset = Math.max(5, (textWidth / 200) - (100 - slotEnd));
    } else {
      positions.push('center');
      offset = 5;
    }
    offsets.push(offset);
  }
  textPosition.value = positions;
  textOffsets.value = offsets;
};

onMounted(() => {
  isFolded.value = totalUserCount.value > 2;
  calculateTextPosition();
});
</script>

<style scoped>
.machine-time-slot {
  width: 100%;
  padding: 20rpx 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.machine-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
  width: 100%;
}

.machine-name {
  font-size: 32rpx;
  font-weight: bold;
  color: #FF8D1A;
  cursor: pointer;
}

.machine-stats {
  display: flex;
  gap: 30rpx;
}

.stat-item {
  font-size: 26rpx;
  display: flex;
  align-items: center;
}

.stat-value {
  color: #FF8D1A;
  margin-left: 10rpx;
  font-weight: bold;
}

.time-slot-section {
  display: flex;
  width: 100%;
  margin: 15rpx 0;
  position: relative;
}

.user-avatars {
  width: 60rpx;
  margin-right: 10rpx;
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.user-avatars-merged {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  z-index: 3;
  display: flex;
}

.user-avatar {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  border: 2rpx solid white;
}

.timelines-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  width: 100%;
  overflow-x: auto;
}

.time-indicators {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5rpx;
  padding: 0 10rpx;
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
  margin-bottom: 20rpx;
  width: 100%;
}

.individual-timelines {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
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

.user-timeline {
  height: 40rpx;
}

.user-timeline-bg {
  background: linear-gradient(to right, rgba(255, 245, 210, 0.8), rgba(255, 240, 190, 0.8));
}

.time-slot {
  position: absolute;
  height: 100%;
  border-radius: 30rpx;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #FF8D1A;
}

.slot-text {
  color: #654321;
  font-size: 24rpx;
  white-space: nowrap;
  overflow: visible;
  text-overflow: clip;
  padding: 0 10rpx;
  position: absolute; /* 绝对定位使文本可以超出条的长度 */
}

.text-centered {
  left: 50%;
  transform: translateX(-50%); /* 水平居中 */
}

.text-left {
  left: var(--left-offset); /* 动态偏移量 */
  transform: translateX(0);
}

.text-right {
  right: var(--right-offset); /* 动态偏移量 */
  left: auto;
  transform: translateX(0);
}

.status-message {
  text-align: center;
  margin: 15rpx 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.status-text {
  color: #FF8D1A;
  font-size: 26rpx;
}

.toggle-icon {
  color: #FF8D1A;
  font-size: 26rpx;
  margin-left: 5rpx;
}

.action-button {
  margin-top: 20rpx;
  width: 400rpx;
  height: 90rpx;
  opacity: 1;
  border-radius: 40px;
  background: rgba(255, 195, 0, 1);
  box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.25);
  font-size: 28rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #333;
}

.machine-name {
  cursor: pointer;
  text-decoration: underline;
}
</style>
