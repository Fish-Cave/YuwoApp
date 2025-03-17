"use strict";
const common_vendor = require("../../common/vendor.js");
if (!Array) {
  const _easycom_uni_icons2 = common_vendor.resolveComponent("uni-icons");
  const _easycom_uni_col2 = common_vendor.resolveComponent("uni-col");
  const _easycom_uni_row2 = common_vendor.resolveComponent("uni-row");
  const _easycom_uni_card2 = common_vendor.resolveComponent("uni-card");
  (_easycom_uni_icons2 + _easycom_uni_col2 + _easycom_uni_row2 + _easycom_uni_card2)();
}
const _easycom_uni_icons = () => "../../uni_modules/uni-icons/components/uni-icons/uni-icons.js";
const _easycom_uni_col = () => "../../uni_modules/uni-row/components/uni-col/uni-col.js";
const _easycom_uni_row = () => "../../uni_modules/uni-row/components/uni-row/uni-row.js";
const _easycom_uni_card = () => "../../uni_modules/uni-card/components/uni-card/uni-card.js";
if (!Math) {
  (_easycom_uni_icons + _easycom_uni_col + _easycom_uni_row + _easycom_uni_card)();
}
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "usage",
  setup(__props) {
    function goOrder() {
      common_vendor.index.__f__("log", "at pages/index/usage.vue:44", "test");
      common_vendor.index.navigateTo({
        url: "/pages/order/order"
      });
    }
    return (_ctx, _cache) => {
      return {
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
          type: "heart",
          size: "30"
        }),
        e: common_vendor.p({
          span: 4
        }),
        f: common_vendor.p({
          type: "staff",
          size: "30"
        }),
        g: common_vendor.p({
          type: "personadd",
          size: "30"
        }),
        h: common_vendor.o(($event) => goOrder()),
        i: common_vendor.p({
          ["is-shadow"]: false
        })
      };
    };
  }
});
wx.createComponent(_sfc_main);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/index/usage.js.map
