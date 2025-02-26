"use strict";
const common_vendor = require("../../common/vendor.js");
if (!Array) {
  const _easycom_uni_easyinput2 = common_vendor.resolveComponent("uni-easyinput");
  const _easycom_uni_forms_item2 = common_vendor.resolveComponent("uni-forms-item");
  const _easycom_uni_forms2 = common_vendor.resolveComponent("uni-forms");
  const _easycom_uni_card2 = common_vendor.resolveComponent("uni-card");
  const _easycom_uni_section2 = common_vendor.resolveComponent("uni-section");
  (_easycom_uni_easyinput2 + _easycom_uni_forms_item2 + _easycom_uni_forms2 + _easycom_uni_card2 + _easycom_uni_section2)();
}
const _easycom_uni_easyinput = () => "../../uni_modules/uni-easyinput/components/uni-easyinput/uni-easyinput.js";
const _easycom_uni_forms_item = () => "../../uni_modules/uni-forms/components/uni-forms-item/uni-forms-item.js";
const _easycom_uni_forms = () => "../../uni_modules/uni-forms/components/uni-forms/uni-forms.js";
const _easycom_uni_card = () => "../../uni_modules/uni-card/components/uni-card/uni-card.js";
const _easycom_uni_section = () => "../../uni_modules/uni-section/components/uni-section/uni-section.js";
if (!Math) {
  (_easycom_uni_easyinput + _easycom_uni_forms_item + _easycom_uni_forms + _easycom_uni_card + _easycom_uni_section)();
}
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "register",
  setup(__props) {
    const userData = common_vendor.reactive({
      username: "",
      mobile: "",
      email: ""
    });
    function CommitUserData() {
      common_vendor.index.__f__("log", "at pages/register/register.vue:61", userData);
    }
    const rules = {
      username: {
        rules: [
          {
            require: true,
            errorMessage: "请输入姓名"
          }
        ]
      },
      mobile: {
        rules: [
          {
            require: true,
            errorMessage: "请输入手机号"
          }
        ]
      },
      email: {
        rules: [
          {
            require: true,
            errorMessage: "请输入邮箱"
          }
        ]
      }
    };
    return (_ctx, _cache) => {
      return {
        a: common_vendor.o(($event) => userData.username = $event),
        b: common_vendor.p({
          type: "text",
          placeholder: "请输入昵称🐟",
          modelValue: userData.username
        }),
        c: common_vendor.p({
          label: "昵称 :",
          required: true,
          name: "username"
        }),
        d: common_vendor.o(($event) => userData.mobile = $event),
        e: common_vendor.p({
          type: "text",
          placeholder: "请输手机号⭐",
          modelValue: userData.mobile
        }),
        f: common_vendor.p({
          label: "手机号 :",
          required: true,
          name: "mobile"
        }),
        g: common_vendor.o(($event) => userData.email = $event),
        h: common_vendor.p({
          type: "text",
          placeholder: "请输入邮箱📫",
          modelValue: userData.email
        }),
        i: common_vendor.p({
          label: "邮箱 :",
          required: true,
          name: "email"
        }),
        j: common_vendor.sr("formRef", "ef7e1f7e-2,ef7e1f7e-1"),
        k: common_vendor.p({
          modelValue: userData,
          rules,
          ["label-position"]: "top"
        }),
        l: common_vendor.o(($event) => CommitUserData()),
        m: common_vendor.p({
          title: "加入🐟窝!",
          type: "line"
        })
      };
    };
  }
});
wx.createPage(_sfc_main);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/register/register.js.map
