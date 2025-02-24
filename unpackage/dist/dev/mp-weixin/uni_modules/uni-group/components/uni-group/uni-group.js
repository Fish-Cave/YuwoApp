"use strict";
const common_vendor = require("../../../../common/vendor.js");
const _sfc_main = {
  name: "uniGroup",
  emits: ["click"],
  props: {
    title: {
      type: String,
      default: ""
    },
    top: {
      type: [Number, String],
      default: 10
    },
    mode: {
      type: String,
      default: "default"
    },
    stat: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      margin: false,
      border: false
    };
  },
  watch: {
    title(newVal) {
      if (common_vendor.index.report && this.stat && newVal !== "") {
        common_vendor.index.report("title", newVal);
      }
    }
  },
  created() {
    this.form = this.getForm();
    if (this.form) {
      this.margin = true;
      this.border = this.form.border;
    }
  },
  methods: {
    /**
     * 获取父元素实例
     */
    getForm() {
      let parent = this.$parent;
      let parentName = parent.$options.name;
      while (parentName !== "uniForms") {
        parent = parent.$parent;
        if (!parent)
          return false;
        parentName = parent.$options.name;
      }
      return parent;
    },
    onClick() {
      this.$emit("click");
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $props.title
  }, $props.title ? {
    b: common_vendor.t($props.title),
    c: $data.border ? "30px" : "15px"
  } : {}, {
    d: $data.border ? 1 : "",
    e: common_vendor.n("uni-group--" + $props.mode),
    f: common_vendor.n($data.margin ? "group-margin" : ""),
    g: `${$props.top}px`
  });
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../../../.sourcemap/mp-weixin/uni_modules/uni-group/components/uni-group/uni-group.js.map
