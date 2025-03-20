"use strict";
const common_vendor = require("../../common/vendor.js");
const stores_userProfileStore = require("../../stores/userProfileStore.js");
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
    const userProfile = stores_userProfileStore.useProfileStroe();
    const res = common_vendor.er.getCurrentUserInfo("uni_id_token");
    const isAdmin = res.role.includes("admin");
    function goToConfig() {
      common_vendor.index.__f__("log", "at pages/index/index.vue:28", "test");
      common_vendor.index.navigateTo({
        url: "/pages/config/config"
      });
    }
    common_vendor.index.$on("uni-id-pages-login-success", function() {
      const res2 = common_vendor.er.getCurrentUserInfo("uni_id_token");
      userProfile._id = res2.uid;
      userProfile.role = res2.role;
      userProfile.permission = res2.permission;
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.o(_ctx.calendarChange),
        b: common_vendor.p({
          type: "week",
          slideSwitchMode: "none",
          fold: false,
          startWeek: "mon",
          color: "#f9cb14",
          startDate: "2025-01-01"
        }),
        c: common_vendor.unref(isAdmin)
      }, common_vendor.unref(isAdmin) ? {
        d: common_vendor.o(($event) => goToConfig())
      } : {});
    };
  }
});
wx.createPage(_sfc_main);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/index/index.js.map
