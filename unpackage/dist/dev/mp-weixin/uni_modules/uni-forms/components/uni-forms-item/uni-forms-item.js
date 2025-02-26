"use strict";
const common_vendor = require("../../../../common/vendor.js");
const _sfc_main = {
  name: "uniFormsItem",
  options: {
    virtualHost: true
  },
  provide() {
    return {
      uniFormItem: this
    };
  },
  inject: {
    form: {
      from: "uniForm",
      default: null
    }
  },
  props: {
    // 表单校验规则
    rules: {
      type: Array,
      default() {
        return null;
      }
    },
    // 表单域的属性名，在使用校验规则时必填
    name: {
      type: [String, Array],
      default: ""
    },
    required: {
      type: Boolean,
      default: false
    },
    label: {
      type: String,
      default: ""
    },
    // label的宽度
    labelWidth: {
      type: [String, Number],
      default: ""
    },
    // label 居中方式，默认 left 取值 left/center/right
    labelAlign: {
      type: String,
      default: ""
    },
    // 强制显示错误信息
    errorMessage: {
      type: [String, Boolean],
      default: ""
    },
    // 1.4.0 弃用，统一使用 form 的校验时机
    // validateTrigger: {
    // 	type: String,
    // 	default: ''
    // },
    // 1.4.0 弃用，统一使用 form 的label 位置
    // labelPosition: {
    // 	type: String,
    // 	default: ''
    // },
    // 1.4.0 以下属性已经废弃，请使用  #label 插槽代替
    leftIcon: String,
    iconColor: {
      type: String,
      default: "#606266"
    }
  },
  data() {
    return {
      errMsg: "",
      userRules: null,
      localLabelAlign: "left",
      localLabelWidth: "70px",
      localLabelPos: "left",
      border: false,
      isFirstBorder: false
    };
  },
  computed: {
    // 处理错误信息
    msg() {
      return this.errorMessage || this.errMsg;
    }
  },
  watch: {
    // 规则发生变化通知子组件更新
    "form.formRules"(val) {
      this.init();
    },
    "form.labelWidth"(val) {
      this.localLabelWidth = this._labelWidthUnit(val);
    },
    "form.labelPosition"(val) {
      this.localLabelPos = this._labelPosition();
    },
    "form.labelAlign"(val) {
    }
  },
  created() {
    this.init(true);
    if (this.name && this.form) {
      this.$watch(
        () => {
          const val = this.form._getDataValue(this.name, this.form.localData);
          return val;
        },
        (value, oldVal) => {
          const isEqual = this.form._isEqual(value, oldVal);
          if (!isEqual) {
            const val = this.itemSetValue(value);
            this.onFieldChange(val, false);
          }
        },
        {
          immediate: false
        }
      );
    }
  },
  unmounted() {
    this.__isUnmounted = true;
    this.unInit();
  },
  methods: {
    /**
     * 外部调用方法
     * 设置规则 ，主要用于小程序自定义检验规则
     * @param {Array} rules 规则源数据
     */
    setRules(rules = null) {
      this.userRules = rules;
      this.init(false);
    },
    // 兼容老版本表单组件
    setValue() {
    },
    /**
     * 外部调用方法
     * 校验数据
     * @param {any} value 需要校验的数据
     * @param {boolean} 是否立即校验
     * @return {Array|null} 校验内容
     */
    async onFieldChange(value, formtrigger = true) {
      const {
        formData,
        localData,
        errShowType,
        validateCheck,
        validateTrigger,
        _isRequiredField,
        _realName
      } = this.form;
      const name = _realName(this.name);
      if (!value) {
        value = this.form.formData[name];
      }
      const ruleLen = this.itemRules.rules && this.itemRules.rules.length;
      if (!this.validator || !ruleLen || ruleLen === 0)
        return;
      const isRequiredField = _isRequiredField(this.itemRules.rules || []);
      let result = null;
      if (validateTrigger === "bind" || formtrigger) {
        result = await this.validator.validateUpdate(
          {
            [name]: value
          },
          formData
        );
        if (!isRequiredField && (value === void 0 || value === "")) {
          result = null;
        }
        if (result && result.errorMessage) {
          if (errShowType === "undertext") {
            this.errMsg = !result ? "" : result.errorMessage;
          }
          if (errShowType === "toast") {
            common_vendor.index.showToast({
              title: result.errorMessage || "校验错误",
              icon: "none"
            });
          }
          if (errShowType === "modal") {
            common_vendor.index.showModal({
              title: "提示",
              content: result.errorMessage || "校验错误"
            });
          }
        } else {
          this.errMsg = "";
        }
        validateCheck(result ? result : null);
      } else {
        this.errMsg = "";
      }
      return result ? result : null;
    },
    /**
     * 初始组件数据
     */
    init(type = false) {
      const {
        validator,
        formRules,
        childrens,
        formData,
        localData,
        _realName,
        labelWidth,
        _getDataValue,
        _setDataValue
      } = this.form || {};
      this.localLabelAlign = this._justifyContent();
      this.localLabelWidth = this._labelWidthUnit(labelWidth);
      this.localLabelPos = this._labelPosition();
      this.form && type && childrens.push(this);
      if (!validator || !formRules)
        return;
      if (!this.form.isFirstBorder) {
        this.form.isFirstBorder = true;
        this.isFirstBorder = true;
      }
      if (this.group) {
        if (!this.group.isFirstBorder) {
          this.group.isFirstBorder = true;
          this.isFirstBorder = true;
        }
      }
      this.border = this.form.border;
      const name = _realName(this.name);
      const itemRule = this.userRules || this.rules;
      if (typeof formRules === "object" && itemRule) {
        formRules[name] = {
          rules: itemRule
        };
        validator.updateSchema(formRules);
      }
      const itemRules = formRules[name] || {};
      this.itemRules = itemRules;
      this.validator = validator;
      this.itemSetValue(_getDataValue(this.name, localData));
    },
    unInit() {
      if (this.form) {
        const {
          childrens,
          formData,
          _realName
        } = this.form;
        childrens.forEach((item, index) => {
          if (item === this) {
            this.form.childrens.splice(index, 1);
            delete formData[_realName(item.name)];
          }
        });
      }
    },
    // 设置item 的值
    itemSetValue(value) {
      const name = this.form._realName(this.name);
      const rules = this.itemRules.rules || [];
      const val = this.form._getValue(name, value, rules);
      this.form._setDataValue(name, this.form.formData, val);
      return val;
    },
    /**
     * 移除该表单项的校验结果
     */
    clearValidate() {
      this.errMsg = "";
    },
    // 是否显示星号
    _isRequired() {
      return this.required;
    },
    // 处理对齐方式
    _justifyContent() {
      if (this.form) {
        const {
          labelAlign
        } = this.form;
        let labelAli = this.labelAlign ? this.labelAlign : labelAlign;
        if (labelAli === "left")
          return "flex-start";
        if (labelAli === "center")
          return "center";
        if (labelAli === "right")
          return "flex-end";
      }
      return "flex-start";
    },
    // 处理 label宽度单位 ,继承父元素的值
    _labelWidthUnit(labelWidth) {
      return this.num2px(this.labelWidth ? this.labelWidth : labelWidth || (this.label ? 70 : "auto"));
    },
    // 处理 label 位置
    _labelPosition() {
      if (this.form)
        return this.form.labelPosition || "left";
      return "left";
    },
    /**
     * 触发时机
     * @param {Object} rule 当前规则内时机
     * @param {Object} itemRlue 当前组件时机
     * @param {Object} parentRule 父组件时机
     */
    isTrigger(rule, itemRlue, parentRule) {
      if (rule === "submit" || !rule) {
        if (rule === void 0) {
          if (itemRlue !== "bind") {
            if (!itemRlue) {
              return parentRule === "" ? "bind" : "submit";
            }
            return "submit";
          }
          return "bind";
        }
        return "submit";
      }
      return "bind";
    },
    num2px(num) {
      if (typeof num === "number") {
        return `${num}px`;
      }
      return num;
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $props.required
  }, $props.required ? {} : {}, {
    b: common_vendor.t($props.label),
    c: !$props.label && !$props.required ? 1 : "",
    d: $data.localLabelWidth,
    e: $data.localLabelAlign,
    f: common_vendor.t($options.msg),
    g: $options.msg ? 1 : "",
    h: common_vendor.n("is-direction-" + $data.localLabelPos),
    i: common_vendor.n($data.border ? "uni-forms-item--border" : ""),
    j: common_vendor.n($data.border && $data.isFirstBorder ? "is-first-border" : "")
  });
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../../../.sourcemap/mp-weixin/uni_modules/uni-forms/components/uni-forms-item/uni-forms-item.js.map
