"use strict";
const common_vendor = require("../../common/vendor.js");
if (!Array) {
  const _easycom_uni_popup_dialog2 = common_vendor.resolveComponent("uni-popup-dialog");
  const _easycom_uni_popup2 = common_vendor.resolveComponent("uni-popup");
  (_easycom_uni_popup_dialog2 + _easycom_uni_popup2)();
}
const _easycom_uni_popup_dialog = () => "../../uni_modules/uni-popup/components/uni-popup-dialog/uni-popup-dialog.js";
const _easycom_uni_popup = () => "../../uni_modules/uni-popup/components/uni-popup/uni-popup.js";
if (!Math) {
  (_easycom_uni_popup_dialog + _easycom_uni_popup)();
}
const _sfc_main = {
  __name: "time-slot",
  props: {
    machineName: {
      type: String,
      default: "机台1"
    },
    machineType: {
      type: String,
      default: ""
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
      default: "折叠预约列表"
    },
    buttonText: {
      type: String,
      default: "预约此机台"
    },
    machineDescription: {
      type: String,
      default: ""
    }
  },
  emits: ["buttonClick"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const emit = __emit;
    const isFolded = common_vendor.ref(true);
    const popup = common_vendor.ref(null);
    const msgType = common_vendor.ref("info");
    const textPosition = common_vendor.ref([]);
    const textOffsets = common_vendor.ref([]);
    const slotTextRefs = common_vendor.ref([]);
    const filteredTimeSlots = common_vendor.computed(() => {
      return props.timeSlots.filter((slot) => slot.machine === props.machineType && slot.machineName === props.machineName);
    });
    const totalUserCount = common_vendor.computed(() => {
      return filteredTimeSlots.value.length;
    });
    const toggleFold = () => {
      isFolded.value = !isFolded.value;
    };
    const mergedTimeSlots = common_vendor.computed(() => {
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
    const timeMarkers = common_vendor.computed(() => {
      return ["00:00", "12:00", "24:00"];
    });
    const calculateLeftPosition = (timeString) => {
      const hour = parseInt(timeString.substring(6, 8));
      const minute = parseInt(timeString.substring(8, 10));
      const totalMinutes = hour * 60 + minute;
      const dayPercentage = totalMinutes / (24 * 60) * 100;
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
    };
    const formatTime = (timeString) => {
      const hour = timeString.substring(6, 8);
      const minute = timeString.substring(8, 10);
      return `${hour}:${minute}`;
    };
    const onButtonClick = () => {
      emit("buttonClick", props.machineType);
    };
    const showMachineInfo = () => {
      popup.value.open("dialog");
    };
    const dialogConfirm = () => {
      popup.value.close();
    };
    const dialogClose = () => {
      popup.value.close();
    };
    const change = (e) => {
      common_vendor.index.__f__("log", "at pages/index/time-slot.vue:279", "当前模式：" + e.type + ",状态：" + e.show);
    };
    const longestSlotIndex = common_vendor.computed(() => {
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
      await common_vendor.nextTick$1();
      const positions = [];
      const offsets = [];
      for (let i = 0; i < mergedTimeSlots.value.length; i++) {
        const slot = mergedTimeSlots.value[i];
        const slotStart = calculateLeftPosition(slot.startTime);
        const slotEnd = calculateLeftPosition(slot.endTime);
        const textEl = slotTextRefs.value[i];
        const textWidth = textEl ? textEl.offsetWidth : 0;
        const isTextOverflowingLeft = slotStart < textWidth / 200;
        const isTextOverflowingRight = 100 - slotEnd < textWidth / 200;
        let offset = 5;
        if (isTextOverflowingLeft) {
          positions.push("left");
          offset = Math.max(5, textWidth / 200 - slotStart);
        } else if (isTextOverflowingRight) {
          positions.push("right");
          offset = Math.max(5, textWidth / 200 - (100 - slotEnd));
        } else {
          positions.push("center");
          offset = 5;
        }
        offsets.push(offset);
      }
      textPosition.value = positions;
      textOffsets.value = offsets;
    };
    common_vendor.onMounted(() => {
      isFolded.value = totalUserCount.value > 2;
      calculateTextPosition();
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.t(__props.machineName),
        b: common_vendor.o(showMachineInfo),
        c: common_vendor.t(__props.machineCount),
        d: common_vendor.t(__props.maxQueueCount),
        e: __props.showAvatars && !isFolded.value
      }, __props.showAvatars && !isFolded.value ? {
        f: common_vendor.f(__props.avatars, (avatar, index, i0) => {
          return {
            a: index,
            b: avatar.src
          };
        })
      } : {}, {
        g: __props.showAvatars && isFolded.value && totalUserCount.value > 0
      }, __props.showAvatars && isFolded.value && totalUserCount.value > 0 ? {
        h: common_vendor.f(__props.avatars.slice(0, 2), (avatar, index, i0) => {
          return {
            a: index,
            b: avatar.src,
            c: index > 0 ? "-15rpx" : "0"
          };
        })
      } : {}, {
        i: common_vendor.f(timeMarkers.value, (time, k0, i0) => {
          return {
            a: common_vendor.t(time),
            b: time
          };
        }),
        j: common_vendor.f(mergedTimeSlots.value, (slot, index, i0) => {
          return common_vendor.e({
            a: index === longestSlotIndex.value
          }, index === longestSlotIndex.value ? {
            b: common_vendor.t(totalUserCount.value),
            c: textPosition.value[index] === "center" ? 1 : "",
            d: textPosition.value[index] === "left" ? 1 : "",
            e: textPosition.value[index] === "right" ? 1 : "",
            f: textOffsets.value[index] + "rpx",
            g: textOffsets.value[index] + "rpx"
          } : {}, {
            h: "merged-" + index,
            i: calculateLeftPosition(slot.startTime) + "%",
            j: calculateWidth(slot.startTime, slot.endTime) + "%"
          });
        }),
        k: !isFolded.value
      }, !isFolded.value ? {
        l: common_vendor.f(filteredTimeSlots.value, (slot, slotIndex, i0) => {
          return {
            a: common_vendor.t(calculateText(slot.startTime, slot.endTime)),
            b: calculateLeftPosition(slot.startTime) + "%",
            c: calculateWidth(slot.startTime, slot.endTime) + "%",
            d: slot.color || "#FF8D1A",
            e: "user-" + slotIndex
          };
        })
      } : {}, {
        m: totalUserCount.value > 2
      }, totalUserCount.value > 2 ? {
        n: common_vendor.t(isFolded.value ? "打开预约列表" : "折叠预约列表"),
        o: common_vendor.t(isFolded.value ? "▼" : "▲"),
        p: common_vendor.o(toggleFold)
      } : {}, {
        q: common_vendor.t(__props.buttonText),
        r: common_vendor.o(onButtonClick),
        s: common_vendor.o(dialogConfirm),
        t: common_vendor.o(dialogClose),
        v: common_vendor.p({
          title: __props.machineName,
          content: __props.machineDescription,
          type: msgType.value
        }),
        w: common_vendor.sr(popup, "8ba6bb2e-0", {
          "k": "popup"
        }),
        x: common_vendor.o(change),
        y: common_vendor.p({
          type: "dialog"
        })
      });
    };
  }
};
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-8ba6bb2e"]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/index/time-slot.js.map
