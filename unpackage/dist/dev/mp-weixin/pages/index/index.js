"use strict";
const common_vendor = require("../../common/vendor.js");
if (!Array) {
  const _easycom_wu_calendar2 = common_vendor.resolveComponent("wu-calendar");
  _easycom_wu_calendar2();
}
const _easycom_wu_calendar = () => "../../uni_modules/wu-calendar/components/wu-calendar/wu-calendar.js";
if (!Math) {
  (_easycom_wu_calendar + common_vendor.unref(usage))();
}
const usage = () => "./usage.js";
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "index",
  setup(__props) {
    var now = common_vendor.dayjs();
    common_vendor.index.__f__("log", "at pages/index/index.vue:21", JSON.stringify(now));
    common_vendor.ref("鱼窝一号店");
    common_vendor.ref("2024-08-21 星期三");
    common_vendor.ref([
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
    function calendarChange(e) {
      common_vendor.index.__f__("log", "at pages/index/index.vue:84", e);
      let date = e;
      common_vendor.index.__f__("log", "at pages/index/index.vue:86", date.fulldate);
    }
    return (_ctx, _cache) => {
      return {
        a: common_vendor.o(calendarChange),
        b: common_vendor.p({
          type: "week",
          slideSwitchMode: "none",
          fold: false,
          startWeek: "mon",
          color: "#f9cb14",
          startDate: "2025-01-01"
        })
      };
    };
  }
});
wx.createPage(_sfc_main);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/index/index.js.map
