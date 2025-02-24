"use strict";
const common_vendor = require("../../common/vendor.js");
if (!Array) {
  const _easycom_uni_icons2 = common_vendor.resolveComponent("uni-icons");
  const _easycom_uni_title2 = common_vendor.resolveComponent("uni-title");
  const _easycom_uni_group2 = common_vendor.resolveComponent("uni-group");
  const _easycom_uni_card2 = common_vendor.resolveComponent("uni-card");
  (_easycom_uni_icons2 + _easycom_uni_title2 + _easycom_uni_group2 + _easycom_uni_card2)();
}
const _easycom_uni_icons = () => "../../uni_modules/uni-icons/components/uni-icons/uni-icons.js";
const _easycom_uni_title = () => "../../uni_modules/uni-title/components/uni-title/uni-title.js";
const _easycom_uni_group = () => "../../uni_modules/uni-group/components/uni-group/uni-group.js";
const _easycom_uni_card = () => "../../uni_modules/uni-card/components/uni-card/uni-card.js";
if (!Math) {
  (_easycom_uni_icons + _easycom_uni_title + _easycom_uni_group + _easycom_uni_card)();
}
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "enter",
  setup(__props) {
    const shopName = common_vendor.ref("鱼窝一号店");
    const nowDate = common_vendor.ref("1970年1月1日");
    const reserveTime = common_vendor.ref(65535);
    const year = common_vendor.ref(2024);
    const bebaned = common_vendor.ref(0);
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
        f: common_vendor.p({
          type: "h1",
          title: "我是头像"
        }),
        g: common_vendor.p({
          type: "h1",
          title: "我是头像"
        }),
        h: common_vendor.p({
          type: "h1",
          title: "我是头像"
        }),
        i: common_vendor.p({
          mode: "card"
        }),
        j: common_vendor.t(year.value),
        k: common_vendor.t(4294),
        l: common_vendor.t(bebaned.value),
        m: common_vendor.p({
          type: "compose",
          size: "30"
        }),
        n: common_vendor.p({
          type: "h1",
          title: "已预约时段"
        }),
        o: common_vendor.t(reserveTime.value),
        p: common_vendor.p({
          title: "这是具体预约信息"
        }),
        q: common_vendor.p({
          type: "h1",
          title: "遇到问题了？"
        })
      };
    };
  }
});
wx.createPage(_sfc_main);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/enter/enter.js.map
