"use strict";
const common_vendor = require("../../common/vendor.js");
if (!Array) {
  const _easycom_uni_icons2 = common_vendor.resolveComponent("uni-icons");
  const _easycom_uni_col2 = common_vendor.resolveComponent("uni-col");
  const _easycom_uni_row2 = common_vendor.resolveComponent("uni-row");
  const _easycom_uni_title2 = common_vendor.resolveComponent("uni-title");
  const _easycom_wu_calendar2 = common_vendor.resolveComponent("wu-calendar");
  const _easycom_uni_data_checkbox2 = common_vendor.resolveComponent("uni-data-checkbox");
  (_easycom_uni_icons2 + _easycom_uni_col2 + _easycom_uni_row2 + _easycom_uni_title2 + _easycom_wu_calendar2 + _easycom_uni_data_checkbox2)();
}
const _easycom_uni_icons = () => "../../uni_modules/uni-icons/components/uni-icons/uni-icons.js";
const _easycom_uni_col = () => "../../uni_modules/uni-row/components/uni-col/uni-col.js";
const _easycom_uni_row = () => "../../uni_modules/uni-row/components/uni-row/uni-row.js";
const _easycom_uni_title = () => "../../uni_modules/uni-title/components/uni-title/uni-title.js";
const _easycom_wu_calendar = () => "../../uni_modules/wu-calendar/components/wu-calendar/wu-calendar.js";
const _easycom_uni_data_checkbox = () => "../../uni_modules/uni-data-checkbox/components/uni-data-checkbox/uni-data-checkbox.js";
if (!Math) {
  (_easycom_uni_icons + _easycom_uni_col + _easycom_uni_row + _easycom_uni_title + _easycom_wu_calendar + _easycom_uni_data_checkbox)();
}
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "order",
  setup(__props) {
    const isOvernight = common_vendor.ref(false);
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
      if (isOvernight.value == true) {
        price.value = 50;
      } else {
        price.value = 0;
      }
    }
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.p({
          type: "headphones",
          size: "30"
        }),
        b: common_vendor.p({
          span: 4
        }),
        c: common_vendor.p({
          span: 16
        }),
        d: common_vendor.p({
          span: 4
        }),
        e: common_vendor.p({
          type: "h1",
          title: "选择日期"
        }),
        f: common_vendor.o(_ctx.calendarChange),
        g: common_vendor.p({
          insert: true,
          type: "week",
          fold: false,
          startWeek: "mon",
          color: "#f9cb14"
        }),
        h: common_vendor.p({
          type: "h1",
          title: "已预约时段"
        }),
        i: common_vendor.p({
          type: "h1",
          title: "选择时间段"
        }),
        j: common_vendor.o(($event) => setPrice()),
        k: common_vendor.o(($event) => isOvernight.value = $event),
        l: common_vendor.p({
          localdata: option,
          modelValue: isOvernight.value
        }),
        m: isOvernight.value
      }, isOvernight.value ? {
        n: common_vendor.p({
          type: "checkbox",
          size: "30"
        }),
        o: common_vendor.p({
          span: 4
        }),
        p: common_vendor.p({
          span: 14
        }),
        q: common_vendor.t(price.value),
        r: common_vendor.p({
          span: 6
        })
      } : {
        s: common_vendor.p({
          type: "checkbox",
          size: "30"
        }),
        t: common_vendor.p({
          span: 4
        }),
        v: common_vendor.t(totalTime.value),
        w: common_vendor.p({
          span: 14
        }),
        x: common_vendor.t(price.value),
        y: common_vendor.p({
          span: 6
        })
      }, {
        z: common_vendor.t(price.value),
        A: common_vendor.o(() => {
        })
      });
    };
  }
});
wx.createPage(_sfc_main);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/order/order.js.map
