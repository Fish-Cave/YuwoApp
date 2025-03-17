"use strict";
const common_vendor = require("../common/vendor.js");
const useProfileStroe = common_vendor.defineStore("userProfile", {
  state: () => {
    return {
      userName: "我是测试数据",
      userID: "2147483647+1",
      time: "很久很久",
      avatar: "/static/test.png",
      playCount: "很多很多次",
      totalCost: "很多很多钱"
    };
  }
});
exports.useProfileStroe = useProfileStroe;
//# sourceMappingURL=../../.sourcemap/mp-weixin/stores/userProfileStore.js.map
