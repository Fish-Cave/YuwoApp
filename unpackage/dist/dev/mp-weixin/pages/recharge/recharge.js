"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {};
if (!Array) {
  const _easycom_uni_title2 = common_vendor.resolveComponent("uni-title");
  const _easycom_uni_icons2 = common_vendor.resolveComponent("uni-icons");
  const _easycom_uni_group2 = common_vendor.resolveComponent("uni-group");
  (_easycom_uni_title2 + _easycom_uni_icons2 + _easycom_uni_group2)();
}
const _easycom_uni_title = () => "../../uni_modules/uni-title/components/uni-title/uni-title.js";
const _easycom_uni_icons = () => "../../uni_modules/uni-icons/components/uni-icons/uni-icons.js";
const _easycom_uni_group = () => "../../uni_modules/uni-group/components/uni-group/uni-group.js";
if (!Math) {
  (_easycom_uni_title + _easycom_uni_icons + _easycom_uni_group)();
}
function _sfc_render(_ctx, _cache) {
  return {
    a: common_vendor.p({
      type: "h1",
      title: "我是头像"
    }),
    b: common_vendor.p({
      type: "h1",
      title: "我是头像"
    }),
    c: common_vendor.p({
      type: "compose",
      size: "30"
    }),
    d: common_vendor.p({
      mode: "card"
    }),
    e: common_vendor.p({
      type: "h1",
      title: "鱼窝会员"
    }),
    f: common_vendor.p({
      type: "h1",
      title: "大月卡/大周卡"
    }),
    g: common_vendor.t(),
    h: common_vendor.p({
      type: "info",
      size: "50rpx"
    })
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/recharge/recharge.js.map
