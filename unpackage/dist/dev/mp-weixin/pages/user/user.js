"use strict";
const common_vendor = require("../../common/vendor.js");
const stores_userProfileStore = require("../../stores/userProfileStore.js");
if (!Array) {
  const _easycom_uni_col2 = common_vendor.resolveComponent("uni-col");
  const _easycom_uni_icons2 = common_vendor.resolveComponent("uni-icons");
  const _easycom_uni_row2 = common_vendor.resolveComponent("uni-row");
  const _easycom_uni_card2 = common_vendor.resolveComponent("uni-card");
  const _easycom_uni_list_item2 = common_vendor.resolveComponent("uni-list-item");
  const _easycom_uni_list2 = common_vendor.resolveComponent("uni-list");
  (_easycom_uni_col2 + _easycom_uni_icons2 + _easycom_uni_row2 + _easycom_uni_card2 + _easycom_uni_list_item2 + _easycom_uni_list2)();
}
const _easycom_uni_col = () => "../../uni_modules/uni-row/components/uni-col/uni-col.js";
const _easycom_uni_icons = () => "../../uni_modules/uni-icons/components/uni-icons/uni-icons.js";
const _easycom_uni_row = () => "../../uni_modules/uni-row/components/uni-row/uni-row.js";
const _easycom_uni_card = () => "../../uni_modules/uni-card/components/uni-card/uni-card.js";
const _easycom_uni_list_item = () => "../../uni_modules/uni-list/components/uni-list-item/uni-list-item.js";
const _easycom_uni_list = () => "../../uni_modules/uni-list/components/uni-list/uni-list.js";
if (!Math) {
  (_easycom_uni_col + _easycom_uni_icons + _easycom_uni_row + _easycom_uni_card + _easycom_uni_list_item + _easycom_uni_list)();
}
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "user",
  setup(__props) {
    const userProfile = stores_userProfileStore.useProfileStroe();
    const testOrderData = common_vendor.reactive([
      {
        machineName: "IIDX",
        machineID: "机台1号",
        orderTime: "2024-02-15 15:00",
        orderStatus: 0,
        orderID: "002",
        orderPrice: "$5.99"
      },
      {
        machineName: "SDVX",
        machineID: "机台2号",
        orderTime: "2024-02-14 18:30",
        orderStatus: 1,
        orderID: "001",
        orderPrice: "$5.99"
      }
    ]);
    return (_ctx, _cache) => {
      return {
        a: common_vendor.unref(userProfile).avatar,
        b: common_vendor.p({
          span: 6
        }),
        c: common_vendor.t(common_vendor.unref(userProfile).userName),
        d: common_vendor.t(common_vendor.unref(userProfile).userID),
        e: common_vendor.p({
          span: 16
        }),
        f: common_vendor.p({
          type: "gear-filled",
          size: "30"
        }),
        g: common_vendor.p({
          span: 2
        }),
        h: common_vendor.t(common_vendor.unref(userProfile).playCount),
        i: common_vendor.t(common_vendor.unref(userProfile).time),
        j: common_vendor.t(common_vendor.unref(userProfile).totalCost),
        k: common_vendor.p({
          isFull: ""
        }),
        l: common_vendor.p({
          type: "checkbox",
          size: "30"
        }),
        m: common_vendor.p({
          type: "calendar",
          size: "30"
        }),
        n: common_vendor.p({
          type: "heart",
          size: "30"
        }),
        o: common_vendor.p({
          type: "chatbubble",
          size: "30"
        }),
        p: common_vendor.p({
          showArrow: true,
          title: "最近订单"
        }),
        q: common_vendor.f(testOrderData, (data, k0, i0) => {
          return common_vendor.e({
            a: "01d30d7e-16-" + i0 + "," + ("01d30d7e-15-" + i0),
            b: "01d30d7e-15-" + i0 + "," + ("01d30d7e-14-" + i0),
            c: common_vendor.t(data.machineName),
            d: common_vendor.t(data.machineID),
            e: common_vendor.t(data.orderTime),
            f: "01d30d7e-17-" + i0 + "," + ("01d30d7e-14-" + i0),
            g: data.orderStatus == 1
          }, data.orderStatus == 1 ? {} : {}, {
            h: common_vendor.t(data.orderPrice),
            i: "01d30d7e-18-" + i0 + "," + ("01d30d7e-14-" + i0),
            j: "01d30d7e-14-" + i0 + ",01d30d7e-11",
            k: data.orderID
          });
        }),
        r: common_vendor.p({
          type: "contact",
          size: "30"
        }),
        s: common_vendor.p({
          span: 6
        }),
        t: common_vendor.p({
          span: 12
        }),
        v: common_vendor.p({
          span: 6
        }),
        w: common_vendor.p({
          showArrow: true,
          title: "消息通知"
        }),
        x: common_vendor.p({
          showArrow: true,
          title: "帮助中心"
        })
      };
    };
  }
});
wx.createPage(_sfc_main);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/user/user.js.map
