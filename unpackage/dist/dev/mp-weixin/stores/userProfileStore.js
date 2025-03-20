"use strict";
const common_vendor = require("../common/vendor.js");
const useProfileStroe = common_vendor.defineStore("userProfile", {
  state: () => {
    return {
      _id: "",
      role: [],
      permission: [],
      nickname: "",
      avatar: ""
    };
  }
});
exports.useProfileStroe = useProfileStroe;
//# sourceMappingURL=../../.sourcemap/mp-weixin/stores/userProfileStore.js.map
