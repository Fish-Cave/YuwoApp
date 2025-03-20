"use strict";
const common_vendor = require("../../common/vendor.js");
if (!Array) {
  const _easycom_uni_icons2 = common_vendor.resolveComponent("uni-icons");
  const _easycom_uni_col2 = common_vendor.resolveComponent("uni-col");
  const _easycom_uni_row2 = common_vendor.resolveComponent("uni-row");
  const _easycom_wu_calendar2 = common_vendor.resolveComponent("wu-calendar");
  const _easycom_uni_title2 = common_vendor.resolveComponent("uni-title");
  const _easycom_uni_data_checkbox2 = common_vendor.resolveComponent("uni-data-checkbox");
  const _easycom_uni_datetime_picker2 = common_vendor.resolveComponent("uni-datetime-picker");
  (_easycom_uni_icons2 + _easycom_uni_col2 + _easycom_uni_row2 + _easycom_wu_calendar2 + _easycom_uni_title2 + _easycom_uni_data_checkbox2 + _easycom_uni_datetime_picker2)();
}
const _easycom_uni_icons = () => "../../uni_modules/uni-icons/components/uni-icons/uni-icons.js";
const _easycom_uni_col = () => "../../uni_modules/uni-row/components/uni-col/uni-col.js";
const _easycom_uni_row = () => "../../uni_modules/uni-row/components/uni-row/uni-row.js";
const _easycom_wu_calendar = () => "../../uni_modules/wu-calendar/components/wu-calendar/wu-calendar.js";
const _easycom_uni_title = () => "../../uni_modules/uni-title/components/uni-title/uni-title.js";
const _easycom_uni_data_checkbox = () => "../../uni_modules/uni-data-checkbox/components/uni-data-checkbox/uni-data-checkbox.js";
const _easycom_uni_datetime_picker = () => "../../uni_modules/uni-datetime-picker/components/uni-datetime-picker/uni-datetime-picker.js";
if (!Math) {
  (_easycom_uni_icons + _easycom_uni_col + _easycom_uni_row + _easycom_wu_calendar + _easycom_uni_title + _easycom_uni_data_checkbox + _easycom_uni_datetime_picker)();
}
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "order",
  setup(__props) {
    const todo = common_vendor.er.importObject("todo");
    const machineName = common_vendor.ref("");
    const Data = common_vendor.reactive({
      "userId": "",
      "machineId": "",
      "startTime": "",
      "endTime": "",
      "isOvernight": false,
      "status": "pending",
      "notes": ""
    });
    const option = [
      {
        "value": false,
        "text": "不要过夜"
      },
      {
        "value": true,
        "text": "对！没错！我要过夜！"
      }
    ];
    const price = common_vendor.ref(0);
    const totalTime = common_vendor.ref(0);
    function setPrice() {
      if (Data.isOvernight == true) {
        price.value = 50;
      } else {
        price.value = 0;
      }
    }
    async function submitOrder() {
      common_vendor.index.__f__("log", "at pages/order/order.vue:155", "test");
      if (Data.isOvernight) {
        Data.endTime = "";
        Data.status = "confirmed";
        if (Data.startTime != "") {
          await todo.Reservation_Add(Data);
        }
      } else {
        Data.status = "confirmed";
        if (Data.startTime != "") {
          await todo.Reservation_Add(Data);
        }
      }
    }
    function calendarChange(e) {
      common_vendor.index.__f__("log", "at pages/order/order.vue:170", common_vendor.dayjs(e.fulldate).unix().toString());
      Data.startTime = common_vendor.dayjs(e.fulldate);
    }
    common_vendor.onMounted(() => {
      const instance = common_vendor.getCurrentInstance().proxy;
      const eventChannel = instance.getOpenerEventChannel();
      const res = common_vendor.er.getCurrentUserInfo("uni_id_token");
      eventChannel.on("acceptDataFromOpenerPage", function(data) {
        common_vendor.index.__f__("log", "at pages/order/order.vue:178", "acceptDataFromOpenerPage", data);
        machineName.value = data.name;
        Data.machineId = data.id;
      });
      common_vendor.index.__f__("log", "at pages/order/order.vue:182", machineName.value);
      common_vendor.index.__f__("log", "at pages/order/order.vue:183", Data.machineId);
      Data.userId = res.uid;
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.p({
          type: "headphones",
          size: "30"
        }),
        b: common_vendor.p({
          span: 4
        }),
        c: common_vendor.t(machineName.value),
        d: common_vendor.p({
          span: 16
        }),
        e: common_vendor.p({
          span: 4
        }),
        f: common_vendor.o(calendarChange),
        g: common_vendor.p({
          insert: true,
          type: "week",
          fold: false,
          startWeek: "mon",
          color: "#f9cb14"
        }),
        h: common_vendor.p({
          type: "h1",
          title: "已有预约时段"
        }),
        i: common_vendor.p({
          type: "h1",
          title: "确认预约信息"
        }),
        j: common_vendor.o(($event) => setPrice()),
        k: common_vendor.o(($event) => Data.isOvernight = $event),
        l: common_vendor.p({
          localdata: option,
          modelValue: Data.isOvernight
        }),
        m: Data.isOvernight
      }, Data.isOvernight ? {
        n: common_vendor.o(($event) => Data.startTime = $event),
        o: common_vendor.p({
          border: false,
          returnType: "timestamp",
          ["hide-second"]: "true",
          modelValue: Data.startTime
        }),
        p: common_vendor.p({
          type: "checkbox",
          size: "30"
        }),
        q: common_vendor.p({
          span: 4
        }),
        r: common_vendor.p({
          span: 14
        }),
        s: common_vendor.t(price.value),
        t: common_vendor.p({
          span: 6
        })
      } : {
        v: common_vendor.o(($event) => Data.startTime = $event),
        w: common_vendor.p({
          border: false,
          returnType: "timestamp",
          ["hide-second"]: "true",
          modelValue: Data.startTime
        }),
        x: common_vendor.o(($event) => Data.endTime = $event),
        y: common_vendor.p({
          border: false,
          returnType: "timestamp",
          ["hide-second"]: "true",
          modelValue: Data.endTime
        }),
        z: common_vendor.p({
          type: "checkbox",
          size: "30"
        }),
        A: common_vendor.p({
          span: 4
        }),
        B: common_vendor.t(totalTime.value),
        C: common_vendor.p({
          span: 14
        }),
        D: common_vendor.t(price.value),
        E: common_vendor.p({
          span: 6
        })
      }, {
        F: common_vendor.t(Data),
        G: common_vendor.t(price.value),
        H: common_vendor.o(($event) => submitOrder())
      });
    };
  }
});
wx.createPage(_sfc_main);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/order/order.js.map
