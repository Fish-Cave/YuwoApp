"use strict";
const common_vendor = require("../../common/vendor.js");
if (!Array) {
  const _easycom_uni_icons2 = common_vendor.resolveComponent("uni-icons");
  const _easycom_uni_col2 = common_vendor.resolveComponent("uni-col");
  const _easycom_uni_row2 = common_vendor.resolveComponent("uni-row");
  const _easycom_uni_card2 = common_vendor.resolveComponent("uni-card");
  (_easycom_uni_icons2 + _easycom_uni_col2 + _easycom_uni_row2 + _easycom_uni_card2)();
}
const _easycom_uni_icons = () => "../../uni_modules/uni-icons/components/uni-icons/uni-icons.js";
const _easycom_uni_col = () => "../../uni_modules/uni-row/components/uni-col/uni-col.js";
const _easycom_uni_row = () => "../../uni_modules/uni-row/components/uni-row/uni-row.js";
const _easycom_uni_card = () => "../../uni_modules/uni-card/components/uni-card/uni-card.js";
if (!Math) {
  (_easycom_uni_icons + _easycom_uni_col + _easycom_uni_row + _easycom_uni_card)();
}
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "usage",
  setup(__props) {
    const todo = common_vendor.er.importObject("todo");
    function goOrder(machineName, machineID) {
      common_vendor.index.__f__("log", "at pages/index/usage.vue:58", "test");
      common_vendor.index.navigateTo({
        url: "/pages/order/order",
        success: function(res) {
          res.eventChannel.emit("acceptDataFromOpenerPage", { "name": machineName, "id": machineID });
        }
      });
    }
    const machines = common_vendor.ref([]);
    async function loadMachines() {
      try {
        let res = await todo.Machines_List();
        machines.value = res.data;
      } catch {
      }
    }
    common_vendor.onMounted(() => {
      loadMachines();
    });
    return (_ctx, _cache) => {
      return {
        a: common_vendor.f(machines.value, (machine, k0, i0) => {
          return {
            a: "03c61254-3-" + i0 + "," + ("03c61254-2-" + i0),
            b: "03c61254-2-" + i0 + "," + ("03c61254-1-" + i0),
            c: common_vendor.t(machine.name),
            d: "03c61254-4-" + i0 + "," + ("03c61254-1-" + i0),
            e: "03c61254-6-" + i0 + "," + ("03c61254-5-" + i0),
            f: "03c61254-5-" + i0 + "," + ("03c61254-1-" + i0),
            g: "03c61254-1-" + i0 + "," + ("03c61254-0-" + i0),
            h: "03c61254-7-" + i0 + "," + ("03c61254-0-" + i0),
            i: "03c61254-8-" + i0 + "," + ("03c61254-0-" + i0),
            j: common_vendor.o(($event) => goOrder(machine.name, machine._id), machine.machinenum),
            k: common_vendor.t(machine._id),
            l: "03c61254-0-" + i0,
            m: machine.machinenum
          };
        }),
        b: common_vendor.p({
          type: "headphones",
          size: "30"
        }),
        c: common_vendor.p({
          span: 4
        }),
        d: common_vendor.p({
          span: 16
        }),
        e: common_vendor.p({
          type: "heart",
          size: "30"
        }),
        f: common_vendor.p({
          span: 4
        }),
        g: common_vendor.p({
          type: "staff",
          size: "30"
        }),
        h: common_vendor.p({
          type: "personadd",
          size: "30"
        }),
        i: common_vendor.p({
          ["is-shadow"]: false
        })
      };
    };
  }
});
wx.createComponent(_sfc_main);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/index/usage.js.map
