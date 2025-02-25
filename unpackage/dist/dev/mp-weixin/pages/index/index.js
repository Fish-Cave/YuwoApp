"use strict";
const common_vendor = require("../../common/vendor.js");
const machineTypesData = [
  {
    type: "IIDX",
    displayName: "IIDX",
    description: "Beatmania IIDX",
    defaultAvatars: [
      {
        src: "/static/avatar1.png"
      },
      {
        src: "/static/avatar2.png"
      }
    ],
    machines: [
      {
        name: "IIDX-机台1",
        count: 1,
        maxQueue: 4
      }
    ]
  },
  {
    type: "SDVX",
    displayName: "SDVX",
    description: "Sound Voltex",
    defaultAvatars: [
      {
        src: "/static/avatar3.png"
      }
    ],
    machines: [
      {
        name: "SDVX-机台1",
        count: 1,
        maxQueue: 2
      },
      {
        name: "SDVX-机台2",
        count: 1,
        maxQueue: 2
      }
    ]
  },
  {
    type: "DDR",
    displayName: "DDR",
    description: "Dance Dance Revolution",
    defaultAvatars: [
      {
        src: "/static/avatar4.png"
      }
    ],
    machines: [
      {
        name: "DDR-机台1",
        count: 1,
        maxQueue: 2
      }
    ]
  }
];
if (!Array) {
  const _easycom_uni_icons2 = common_vendor.resolveComponent("uni-icons");
  const _easycom_uni_section2 = common_vendor.resolveComponent("uni-section");
  (_easycom_uni_icons2 + _easycom_uni_section2)();
}
const _easycom_uni_icons = () => "../../uni_modules/uni-icons/components/uni-icons/uni-icons.js";
const _easycom_uni_section = () => "../../uni_modules/uni-section/components/uni-section/uni-section.js";
if (!Math) {
  (_easycom_uni_icons + MachineTimeSlot + _easycom_uni_section)();
}
const MachineTimeSlot = () => "./time-slot.js";
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "index",
  setup(__props) {
    const shopName = common_vendor.ref("鱼窝一号店");
    const nowDate = common_vendor.ref("2024-08-21 星期三");
    const machineTypes = common_vendor.ref(machineTypesData);
    const allTimeSlots = common_vendor.ref([
      {
        startTime: "2408210900",
        endTime: "2408211200",
        color: "#FF8D1A",
        machine: "IIDX",
        machineName: "IIDX-机台1",
        userId: "1"
      },
      {
        startTime: "2408211000",
        endTime: "2408211500",
        color: "#FF8D1A",
        machine: "IIDX",
        machineName: "IIDX-机台1",
        userId: "2"
      },
      {
        startTime: "2408211700",
        endTime: "2408212000",
        color: "#FF8D1A",
        machine: "IIDX",
        machineName: "IIDX-机台1",
        userId: "7"
      },
      {
        startTime: "2408210000",
        endTime: "2408210200",
        color: "#FF8D1A",
        machine: "IIDX",
        machineName: "IIDX-机台1",
        userId: "8"
      },
      {
        startTime: "2408210700",
        endTime: "2408211200",
        color: "#FF8D1A",
        machine: "SDVX",
        machineName: "SDVX-机台1",
        userId: "3"
      },
      {
        startTime: "2408210900",
        endTime: "2408211800",
        color: "#FF8D1A",
        machine: "SDVX",
        machineName: "SDVX-机台2",
        userId: "4"
      },
      {
        startTime: "2408211200",
        endTime: "2408211600",
        color: "#FF8D1A",
        machine: "DDR",
        machineName: "DDR-机台1",
        userId: "5"
      }
    ]);
    const getTimeSlots = (machineType, machineName) => {
      return allTimeSlots.value.filter((slot) => slot.machine === machineType && slot.machineName === machineName);
    };
    function handleBooking(machineType) {
      common_vendor.index.__f__("log", "at pages/index/index.vue:136", `Booking machine type: ${machineType}`);
    }
    return (_ctx, _cache) => {
      return {
        a: common_vendor.p({
          type: "arrow-left",
          size: "20"
        }),
        b: common_vendor.t(shopName.value),
        c: common_vendor.t(nowDate.value),
        d: common_vendor.p({
          type: "calendar",
          size: "16"
        }),
        e: common_vendor.p({
          type: "arrow-right",
          size: "20"
        }),
        f: common_vendor.f(machineTypes.value, (machineType, k0, i0) => {
          return {
            a: common_vendor.f(machineType.machines, (machine, k1, i1) => {
              return {
                a: machine.name,
                b: common_vendor.o(handleBooking, machine.name),
                c: "c052bcf2-4-" + i0 + "-" + i1 + "," + ("c052bcf2-3-" + i0),
                d: common_vendor.p({
                  machineName: machine.name,
                  machineType: machineType.type,
                  machineCount: machine.count,
                  maxQueueCount: machine.maxQueue,
                  timeSlots: getTimeSlots(machineType.type, machine.name),
                  avatars: machineType.defaultAvatars,
                  showAvatars: true,
                  statusMessage: "折叠预约列表",
                  buttonText: "预约此机台",
                  machineDescription: machineType.description
                })
              };
            }),
            b: "c052bcf2-3-" + i0,
            c: common_vendor.p({
              title: machineType.displayName,
              type: "line"
            }),
            d: machineType.type
          };
        })
      };
    };
  }
});
wx.createPage(_sfc_main);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/index/index.js.map
