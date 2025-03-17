"use strict";
const common_vendor = require("../../common/vendor.js");
const stores_userProfileStore = require("../../stores/userProfileStore.js");
if (!Array) {
  const _easycom_uni_col2 = common_vendor.resolveComponent("uni-col");
  const _easycom_uni_row2 = common_vendor.resolveComponent("uni-row");
  const _easycom_uni_group2 = common_vendor.resolveComponent("uni-group");
  const _easycom_uni_card2 = common_vendor.resolveComponent("uni-card");
  (_easycom_uni_col2 + _easycom_uni_row2 + _easycom_uni_group2 + _easycom_uni_card2)();
}
const _easycom_uni_col = () => "../../uni_modules/uni-row/components/uni-col/uni-col.js";
const _easycom_uni_row = () => "../../uni_modules/uni-row/components/uni-row/uni-row.js";
const _easycom_uni_group = () => "../../uni_modules/uni-group/components/uni-group/uni-group.js";
const _easycom_uni_card = () => "../../uni_modules/uni-card/components/uni-card/uni-card.js";
if (!Math) {
  (_easycom_uni_col + _easycom_uni_row + _easycom_uni_group + _easycom_uni_card)();
}
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "signIn",
  setup(__props) {
    const userProfile = stores_userProfileStore.useProfileStroe();
    const textData = [
      "请在预约时间前15分钟内完成签到",
      "超时未签到将自动取消预约",
      "游玩结束后请关闭机台"
    ];
    const orderDate = common_vendor.reactive({
      machine: "",
      orderTime: "",
      orderId: ""
    });
    function init() {
      orderDate.machine = "SDVX";
      orderDate.orderTime = "0:00 - 24:00";
      orderDate.orderId = "12345543211234567";
    }
    init();
    return (_ctx, _cache) => {
      return {
        a: common_vendor.unref(userProfile).avatar,
        b: common_vendor.p({
          span: 7
        }),
        c: common_vendor.t(common_vendor.unref(userProfile).userName),
        d: common_vendor.t(common_vendor.unref(userProfile).userID),
        e: common_vendor.t(common_vendor.unref(userProfile).time),
        f: common_vendor.p({
          span: 16
        }),
        g: common_vendor.p({
          mode: "card"
        }),
        h: common_vendor.t(orderDate.machine),
        i: common_vendor.t(orderDate.orderTime),
        j: common_vendor.t(orderDate.orderId),
        k: common_vendor.p({
          span: 20
        }),
        l: common_vendor.p({
          span: 4
        }),
        m: common_vendor.p({
          mode: "card"
        }),
        n: common_vendor.f(textData, (text, value, i0) => {
          return {
            a: common_vendor.t(value + 1),
            b: common_vendor.t(text),
            c: value
          };
        }),
        o: common_vendor.p({
          title: "使用说明"
        })
      };
    };
  }
});
wx.createPage(_sfc_main);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/signIn/signIn.js.map
