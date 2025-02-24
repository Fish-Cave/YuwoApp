"use strict";
const common_vendor = require("../../common/vendor.js");
if (!Array) {
  const _easycom_uni_icons2 = common_vendor.resolveComponent("uni-icons");
  const _easycom_uni_group2 = common_vendor.resolveComponent("uni-group");
  const _easycom_uni_section2 = common_vendor.resolveComponent("uni-section");
  (_easycom_uni_icons2 + _easycom_uni_group2 + _easycom_uni_section2)();
}
const _easycom_uni_icons = () => "../../uni_modules/uni-icons/components/uni-icons/uni-icons.js";
const _easycom_uni_group = () => "../../uni_modules/uni-group/components/uni-group/uni-group.js";
const _easycom_uni_section = () => "../../uni_modules/uni-section/components/uni-section/uni-section.js";
if (!Math) {
  (_easycom_uni_icons + _easycom_uni_group + _easycom_uni_section)();
}
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "index",
  setup(__props) {
    const shopName = common_vendor.ref("鱼窝一号店");
    const nowDate = common_vendor.ref("1970年1月1日");
    function test() {
      common_vendor.index.__f__("log", "at pages/index/index.vue:80", "test");
    }
    return (_ctx, _cache) => {
      return {
        a: common_vendor.p({
          type: "arrow-left",
          size: "50rpx"
        }),
        b: common_vendor.t(shopName.value),
        c: common_vendor.t(nowDate.value),
        d: common_vendor.p({
          type: "calendar-filled",
          size: "50rpx"
        }),
        e: common_vendor.p({
          type: "arrow-right",
          size: "50rpx"
        }),
        f: common_vendor.o(($event) => test()),
        g: common_vendor.p({
          mode: "card"
        }),
        h: common_vendor.p({
          title: "IIDX",
          type: "line"
        }),
        i: common_vendor.p({
          mode: "card"
        }),
        j: common_vendor.p({
          title: "SDVX",
          type: "line"
        })
      };
    };
  }
});
wx.createPage(_sfc_main);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/index/index.js.map
