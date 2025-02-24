"use strict";
const common_vendor = require("../../common/vendor.js");
if (!Array) {
  const _component_uni_group = common_vendor.resolveComponent("uni-group");
  const _component_uni_section = common_vendor.resolveComponent("uni-section");
  (_component_uni_group + _component_uni_section)();
}
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "index",
  setup(__props) {
    const shopName = common_vendor.ref("鱼窝一号店");
    const nowDate = common_vendor.ref("1970年1月1日");
    return (_ctx, _cache) => {
      return {
        a: common_vendor.t(shopName.value),
        b: common_vendor.t(nowDate.value),
        c: common_vendor.p({
          mode: "card"
        }),
        d: common_vendor.p({
          title: "IIDX",
          type: "line"
        }),
        e: common_vendor.p({
          mode: "card"
        }),
        f: common_vendor.p({
          title: "SDVX",
          type: "line"
        }),
        g: common_vendor.p({
          mode: "card"
        }),
        h: common_vendor.p({
          title: "舞萌DX",
          type: "line"
        }),
        i: common_vendor.p({
          mode: "card"
        }),
        j: common_vendor.p({
          title: "中二节奏",
          type: "line"
        }),
        k: common_vendor.p({
          mode: "card"
        }),
        l: common_vendor.p({
          title: "音击",
          type: "line"
        }),
        m: common_vendor.p({
          mode: "card"
        }),
        n: common_vendor.p({
          title: "太鼓达人",
          type: "line"
        })
      };
    };
  }
});
wx.createPage(_sfc_main);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/index/index.js.map
