"use strict";
const common_vendor = require("../../../../common/vendor.js");
const uni_modules_uniForms_components_uniForms_validate = require("./validate.js");
const uni_modules_uniForms_components_uniForms_utils = require("./utils.js");
const _sfc_main = {
  name: "uniForms",
  emits: ["validate", "submit"],
  options: {
    virtualHost: true
  },
  props: {
    // 即将弃用
    value: {
      type: Object,
      default() {
        return null;
      }
    },
    // vue3 替换 value 属性
    modelValue: {
      type: Object,
      default() {
        return null;
      }
    },
    // 1.4.0 开始将不支持 v-model ，且废弃 value 和 modelValue
    model: {
      type: Object,
      default() {
        return null;
      }
    },
    // 表单校验规则
    rules: {
      type: Object,
      default() {
        return {};
      }
    },
    //校验错误信息提示方式 默认 undertext 取值 [undertext|toast|modal]
    errShowType: {
      type: String,
      default: "undertext"
    },
    // 校验触发器方式 默认 bind 取值 [bind|submit]
    validateTrigger: {
      type: String,
      default: "submit"
    },
    // label 位置，默认 left 取值  top/left
    labelPosition: {
      type: String,
      default: "left"
    },
    // label 宽度
    labelWidth: {
      type: [String, Number],
      default: ""
    },
    // label 居中方式，默认 left 取值 left/center/right
    labelAlign: {
      type: String,
      default: "left"
    },
    border: {
      type: Boolean,
      default: false
    }
  },
  provide() {
    return {
      uniForm: this
    };
  },
  data() {
    return {
      // 表单本地值的记录，不应该与传如的值进行关联
      formData: {},
      formRules: {}
    };
  },
  computed: {
    // 计算数据源变化的
    localData() {
      const localVal = this.model || this.modelValue || this.value;
      if (localVal) {
        return uni_modules_uniForms_components_uniForms_utils.deepCopy(localVal);
      }
      return {};
    }
  },
  watch: {
    // 监听数据变化 ,暂时不使用，需要单独赋值
    // localData: {},
    // 监听规则变化
    rules: {
      handler: function(val, oldVal) {
        this.setRules(val);
      },
      deep: true,
      immediate: true
    }
  },
  created() {
    let getbinddata = getApp().$vm.$.appContext.config.globalProperties.binddata;
    if (!getbinddata) {
      getApp().$vm.$.appContext.config.globalProperties.binddata = function(name, value, formName) {
        if (formName) {
          this.$refs[formName].setValue(name, value);
        } else {
          let formVm;
          for (let i in this.$refs) {
            const vm = this.$refs[i];
            if (vm && vm.$options && vm.$options.name === "uniForms") {
              formVm = vm;
              break;
            }
          }
          if (!formVm)
            return common_vendor.index.__f__("error", "at uni_modules/uni-forms/components/uni-forms/uni-forms.vue:187", "当前 uni-froms 组件缺少 ref 属性");
          if (formVm.model)
            formVm.model[name] = value;
          if (formVm.modelValue)
            formVm.modelValue[name] = value;
          if (formVm.value)
            formVm.value[name] = value;
        }
      };
    }
    this.childrens = [];
    this.inputChildrens = [];
    this.setRules(this.rules);
  },
  methods: {
    /**
     * 外部调用方法
     * 设置规则 ，主要用于小程序自定义检验规则
     * @param {Array} rules 规则源数据
     */
    setRules(rules) {
      this.formRules = Object.assign({}, this.formRules, rules);
      this.validator = new uni_modules_uniForms_components_uniForms_validate.SchemaValidator(rules);
    },
    /**
     * 外部调用方法
     * 设置数据，用于设置表单数据，公开给用户使用 ， 不支持在动态表单中使用
     * @param {Object} key
     * @param {Object} value
     */
    setValue(key, value) {
      let example = this.childrens.find((child) => child.name === key);
      if (!example)
        return null;
      this.formData[key] = uni_modules_uniForms_components_uniForms_utils.getValue(key, value, this.formRules[key] && this.formRules[key].rules || []);
      return example.onFieldChange(this.formData[key]);
    },
    /**
     * 外部调用方法
     * 手动提交校验表单
     * 对整个表单进行校验的方法，参数为一个回调函数。
     * @param {Array} keepitem 保留不参与校验的字段
     * @param {type} callback 方法回调
     */
    validate(keepitem, callback) {
      return this.checkAll(this.formData, keepitem, callback);
    },
    /**
     * 外部调用方法
     * 部分表单校验
     * @param {Array|String} props 需要校验的字段
     * @param {Function} 回调函数
     */
    validateField(props = [], callback) {
      props = [].concat(props);
      let invalidFields = {};
      this.childrens.forEach((item) => {
        const name = uni_modules_uniForms_components_uniForms_utils.realName(item.name);
        if (props.indexOf(name) !== -1) {
          invalidFields = Object.assign({}, invalidFields, {
            [name]: this.formData[name]
          });
        }
      });
      return this.checkAll(invalidFields, [], callback);
    },
    /**
     * 外部调用方法
     * 移除表单项的校验结果。传入待移除的表单项的 prop 属性或者 prop 组成的数组，如不传则移除整个表单的校验结果
     * @param {Array|String} props 需要移除校验的字段 ，不填为所有
     */
    clearValidate(props = []) {
      props = [].concat(props);
      this.childrens.forEach((item) => {
        if (props.length === 0) {
          item.errMsg = "";
        } else {
          const name = uni_modules_uniForms_components_uniForms_utils.realName(item.name);
          if (props.indexOf(name) !== -1) {
            item.errMsg = "";
          }
        }
      });
    },
    /**
     * 外部调用方法 ，即将废弃
     * 手动提交校验表单
     * 对整个表单进行校验的方法，参数为一个回调函数。
     * @param {Array} keepitem 保留不参与校验的字段
     * @param {type} callback 方法回调
     */
    submit(keepitem, callback, type) {
      for (let i in this.dataValue) {
        const itemData = this.childrens.find((v) => v.name === i);
        if (itemData) {
          if (this.formData[i] === void 0) {
            this.formData[i] = this._getValue(i, this.dataValue[i]);
          }
        }
      }
      if (!type) {
        common_vendor.index.__f__("warn", "at uni_modules/uni-forms/components/uni-forms/uni-forms.vue:296", "submit 方法即将废弃，请使用validate方法代替！");
      }
      return this.checkAll(this.formData, keepitem, callback, "submit");
    },
    // 校验所有
    async checkAll(invalidFields, keepitem, callback, type) {
      if (!this.validator)
        return;
      let childrens = [];
      for (let i in invalidFields) {
        const item = this.childrens.find((v) => uni_modules_uniForms_components_uniForms_utils.realName(v.name) === i);
        if (item) {
          childrens.push(item);
        }
      }
      if (!callback && typeof keepitem === "function") {
        callback = keepitem;
      }
      let promise;
      if (!callback && typeof callback !== "function" && Promise) {
        promise = new Promise((resolve, reject) => {
          callback = function(valid, invalidFields2) {
            !valid ? resolve(invalidFields2) : reject(valid);
          };
        });
      }
      let results = [];
      let tempFormData = JSON.parse(JSON.stringify(invalidFields));
      for (let i in childrens) {
        const child = childrens[i];
        let name = uni_modules_uniForms_components_uniForms_utils.realName(child.name);
        const result = await child.onFieldChange(tempFormData[name]);
        if (result) {
          results.push(result);
          if (this.errShowType === "toast" || this.errShowType === "modal")
            break;
        }
      }
      if (Array.isArray(results)) {
        if (results.length === 0)
          results = null;
      }
      if (Array.isArray(keepitem)) {
        keepitem.forEach((v) => {
          let vName = uni_modules_uniForms_components_uniForms_utils.realName(v);
          let value = uni_modules_uniForms_components_uniForms_utils.getDataValue(v, this.localData);
          if (value !== void 0) {
            tempFormData[vName] = value;
          }
        });
      }
      if (type === "submit") {
        this.$emit("submit", {
          detail: {
            value: tempFormData,
            errors: results
          }
        });
      } else {
        this.$emit("validate", results);
      }
      let resetFormData = {};
      resetFormData = uni_modules_uniForms_components_uniForms_utils.rawData(tempFormData, this.name);
      callback && typeof callback === "function" && callback(results, resetFormData);
      if (promise && callback) {
        return promise;
      } else {
        return null;
      }
    },
    /**
     * 返回validate事件
     * @param {Object} result
     */
    validateCheck(result) {
      this.$emit("validate", result);
    },
    _getValue: uni_modules_uniForms_components_uniForms_utils.getValue,
    _isRequiredField: uni_modules_uniForms_components_uniForms_utils.isRequiredField,
    _setDataValue: uni_modules_uniForms_components_uniForms_utils.setDataValue,
    _getDataValue: uni_modules_uniForms_components_uniForms_utils.getDataValue,
    _realName: uni_modules_uniForms_components_uniForms_utils.realName,
    _isRealName: uni_modules_uniForms_components_uniForms_utils.isRealName,
    _isEqual: uni_modules_uniForms_components_uniForms_utils.isEqual
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {};
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../../../.sourcemap/mp-weixin/uni_modules/uni-forms/components/uni-forms/uni-forms.js.map
