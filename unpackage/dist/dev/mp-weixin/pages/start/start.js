"use strict";
const common_vendor = require("../../common/vendor.js");
if (!Array) {
  const _easycom_uni_card2 = common_vendor.resolveComponent("uni-card");
  const _easycom_uni_icons2 = common_vendor.resolveComponent("uni-icons");
  const _easycom_uni_col2 = common_vendor.resolveComponent("uni-col");
  const _easycom_uni_title2 = common_vendor.resolveComponent("uni-title");
  const _easycom_uni_row2 = common_vendor.resolveComponent("uni-row");
  (_easycom_uni_card2 + _easycom_uni_icons2 + _easycom_uni_col2 + _easycom_uni_title2 + _easycom_uni_row2)();
}
const _easycom_uni_card = () => "../../uni_modules/uni-card/components/uni-card/uni-card.js";
const _easycom_uni_icons = () => "../../uni_modules/uni-icons/components/uni-icons/uni-icons.js";
const _easycom_uni_col = () => "../../uni_modules/uni-row/components/uni-col/uni-col.js";
const _easycom_uni_title = () => "../../uni_modules/uni-title/components/uni-title/uni-title.js";
const _easycom_uni_row = () => "../../uni_modules/uni-row/components/uni-row/uni-row.js";
if (!Math) {
  (_easycom_uni_card + _easycom_uni_icons + _easycom_uni_col + _easycom_uni_title + _easycom_uni_row)();
}
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "start",
  setup(__props) {
    const listData = common_vendor.reactive([
      "按分钟计费，10元/小时",
      "最低计费时长为15分钟",
      "使用结束后将通过微信自动扣款",
      "使用过程中可随时结束"
    ]);
    return (_ctx, _cache) => {
      return {
        a: common_vendor.p({
          type: "info",
          size: "30"
        }),
        b: common_vendor.f(listData, (list, index, i0) => {
          return {
            a: common_vendor.t(index + 1),
            b: common_vendor.t(list),
            c: index
          };
        }),
        c: common_vendor.p({
          type: "wallet",
          size: "30"
        }),
        d: common_vendor.p({
          span: 4
        }),
        e: common_vendor.p({
          type: "h3",
          title: "微信支付授权"
        }),
        f: common_vendor.p({
          span: 20
        })
      };
    };
  }
});
wx.createPage(_sfc_main);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/start/start.js.map
