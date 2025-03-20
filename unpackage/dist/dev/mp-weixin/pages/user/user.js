"use strict";
const common_vendor = require("../../common/vendor.js");
if (!Array) {
  const _easycom_uni_col2 = common_vendor.resolveComponent("uni-col");
  const _easycom_uni_icons2 = common_vendor.resolveComponent("uni-icons");
  const _easycom_uni_row2 = common_vendor.resolveComponent("uni-row");
  const _easycom_uni_card2 = common_vendor.resolveComponent("uni-card");
  const _easycom_uni_list_item2 = common_vendor.resolveComponent("uni-list-item");
  const _easycom_uni_list2 = common_vendor.resolveComponent("uni-list");
  const _easycom_uni_dateformat2 = common_vendor.resolveComponent("uni-dateformat");
  (_easycom_uni_col2 + _easycom_uni_icons2 + _easycom_uni_row2 + _easycom_uni_card2 + _easycom_uni_list_item2 + _easycom_uni_list2 + _easycom_uni_dateformat2)();
}
const _easycom_uni_col = () => "../../uni_modules/uni-row/components/uni-col/uni-col.js";
const _easycom_uni_icons = () => "../../uni_modules/uni-icons/components/uni-icons/uni-icons.js";
const _easycom_uni_row = () => "../../uni_modules/uni-row/components/uni-row/uni-row.js";
const _easycom_uni_card = () => "../../uni_modules/uni-card/components/uni-card/uni-card.js";
const _easycom_uni_list_item = () => "../../uni_modules/uni-list/components/uni-list-item/uni-list-item.js";
const _easycom_uni_list = () => "../../uni_modules/uni-list/components/uni-list/uni-list.js";
const _easycom_uni_dateformat = () => "../../uni_modules/uni-dateformat/components/uni-dateformat/uni-dateformat.js";
if (!Math) {
  (_easycom_uni_col + _easycom_uni_icons + _easycom_uni_row + _easycom_uni_card + _easycom_uni_list_item + _easycom_uni_list + _easycom_uni_dateformat)();
}
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "user",
  setup(__props) {
    const todo = common_vendor.er.importObject("todo");
    const res = common_vendor.er.getCurrentUserInfo("uni_id_token");
    common_vendor.ref({});
    const Data = common_vendor.ref([]);
    async function getReservationData() {
      try {
        let result = await todo.GetReservationInfo(res.uid);
        common_vendor.index.__f__("log", "at pages/user/user.vue:144", result.data);
        Data.value = result.data;
      } catch {
      }
    }
    const uniIdCo = common_vendor.er.importObject("uni-id-co");
    common_vendor.reactive([
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
    async function logOut() {
      try {
        await uniIdCo.logout();
        common_vendor.index.removeStorageSync("uni_id_token");
        common_vendor.index.removeStorageSync("uni_id_token_expired");
        common_vendor.index.reLaunch({
          url: "/uni_modules/uni-id-pages/pages/login/login-withpwd"
        });
        common_vendor.index.showToast({
          title: "退出成功",
          icon: "none"
        });
      } catch {
      }
    }
    common_vendor.onMounted(() => {
      getReservationData();
    });
    return (_ctx, _cache) => {
      return {
        a: common_vendor.p({
          span: 6
        }),
        b: common_vendor.t(),
        c: common_vendor.t(),
        d: common_vendor.p({
          span: 16
        }),
        e: common_vendor.p({
          type: "gear-filled",
          size: "30"
        }),
        f: common_vendor.p({
          span: 2
        }),
        g: common_vendor.t(),
        h: common_vendor.t(),
        i: common_vendor.t(),
        j: common_vendor.p({
          isFull: ""
        }),
        k: common_vendor.p({
          type: "checkbox",
          size: "30"
        }),
        l: common_vendor.p({
          type: "calendar",
          size: "30"
        }),
        m: common_vendor.p({
          type: "heart",
          size: "30"
        }),
        n: common_vendor.p({
          type: "chatbubble",
          size: "30"
        }),
        o: common_vendor.p({
          showArrow: true,
          title: "最近订单"
        }),
        p: common_vendor.f(Data.value, (data, k0, i0) => {
          return common_vendor.e({
            a: "01d30d7e-16-" + i0 + "," + ("01d30d7e-15-" + i0),
            b: "01d30d7e-15-" + i0 + "," + ("01d30d7e-14-" + i0),
            c: common_vendor.t(data.machineId),
            d: "01d30d7e-18-" + i0 + "," + ("01d30d7e-17-" + i0),
            e: common_vendor.p({
              date: data.startTime
            }),
            f: "01d30d7e-17-" + i0 + "," + ("01d30d7e-14-" + i0),
            g: data.status == 1
          }, data.status == 1 ? {} : {}, {
            h: common_vendor.t(data.status),
            i: "01d30d7e-19-" + i0 + "," + ("01d30d7e-14-" + i0),
            j: "01d30d7e-14-" + i0 + ",01d30d7e-11",
            k: data._id
          });
        }),
        q: common_vendor.p({
          type: "contact",
          size: "30"
        }),
        r: common_vendor.p({
          span: 6
        }),
        s: common_vendor.p({
          span: 12
        }),
        t: common_vendor.p({
          span: 6
        }),
        v: common_vendor.p({
          showArrow: true,
          title: "消息通知"
        }),
        w: common_vendor.p({
          showArrow: true,
          title: "帮助中心"
        }),
        x: common_vendor.o(($event) => logOut())
      };
    };
  }
});
wx.createPage(_sfc_main);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/user/user.js.map
