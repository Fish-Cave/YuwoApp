<template>
    <view class="container">
        <uni-forms ref="formRef" :modelValue="formData" :rules="rules" label-position="top">
            <uni-forms-item label="文档标题" name="helptitle" required>
                <uni-easyinput type="text" v-model="formData.helptitle" placeholder="请输入文档标题" />
            </uni-forms-item>
            <uni-forms-item label="文档链接 (URL)" name="helpurl" required>
                <uni-easyinput type="textarea" v-model="formData.helpurl" placeholder="请输入文档的URL地址 (PDF或Markdown)" />
                <view class="hint">请确保证链接可公开访问。对于 Markdown，可以是 .md 文件的 URL。</view>

            </uni-forms-item>
        </uni-forms>
        <button type="primary" @click="submitForm" :loading="submitting">保存</button>
    </view>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';

const todo = uniCloud.importObject('todo');
const formRef = ref<any>(null); // 表单引用
const formData = reactive({
    _id: '', // 编辑时会有值
    helptitle: '',
    helpurl: ''
});
const rules = { // 表单校验规则
    helptitle: {
        rules: [{ required: true, errorMessage: '文档标题不能为空' }]
    },
    helpurl: {
        rules: [{ required: true, errorMessage: '文档链接不能为空' }]
    }
};
const submitting = ref(false);
const isEditMode = ref(false);

onMounted(() => {
    // 获取页面参数，判断是新增还是编辑
    const pages = getCurrentPages();
    const currentPage = pages[pages.length - 1];
    const options = currentPage.options || currentPage.$page?.options; // H5 和 App/小程序 获取方式略有不同

    if (options && options.id) {
        isEditMode.value = true;
        formData._id = options.id;
        uni.setNavigationBarTitle({ title: '编辑帮助文档' });
        fetchHelpDetail(options.id);
    } else {
        isEditMode.value = false;
        uni.setNavigationBarTitle({ title: '新增帮助文档' });
    }
});

async function fetchHelpDetail(id: string) {
    uni.showLoading({ title: '加载中...' });
    try {
        // 如果列表页传递了完整对象，可以从上一个页面栈获取，否则调用云函数
        const res = await todo.HelpCenter_Get(id);
        uni.hideLoading();
        if (res.errCode === 0 && res.data) {
            formData.helptitle = res.data.helptitle;
            formData.helpurl = res.data.helpurl;
        } else {
            uni.showToast({ title: res.errMsg || '加载详情失败', icon: 'none' });
            // 加载失败可能需要返回列表页
            uni.navigateBack();
        }
    } catch (error: any) {
        uni.hideLoading();
        console.error("fetchHelpDetail error:", error);
        uni.showToast({ title: '加载文档详情出错', icon: 'none' });
        uni.navigateBack();
    }
}

async function submitForm() {
    try {
        await formRef.value.validate(); //触发表单校验
        submitting.value = true;
        uni.showLoading({ title: '保存中...' });

        let result: any;
        const dataToSave = {
            helptitle: formData.helptitle,
            helpurl: formData.helpurl
        };

        if (isEditMode.value) {
            result = await todo.HelpCenter_Update(formData._id, dataToSave);
        } else {
            result = await todo.HelpCenter_Add(dataToSave);
        }

        uni.hideLoading();
        submitting.value = false;

        if (result.errCode === 0) {
            uni.showToast({ title: '保存成功', icon: 'success' });
            // 返回列表页并可能需要刷新
            uni.navigateBack({
                delta: 1,
                success: () => {
                    // 通知列表页刷新 (可以使用 uni.$emit 或 eventChannel)
                    uni.$emit('helpListNeedRefresh');
                }
            });
        } else {
             // 特别处理权限不足的错误
            if (result.errCode === 'PERMISSION_DENIED') {
                 uni.showModal({
                    title: '无权限',
                    content: '只有管理员才能执行此操作',
                    showCancel: false
                });
            } else {
                uni.showToast({ title: result.errMsg || '保存失败', icon: 'none' });
            }
        }

    } catch (validationError) {
        console.log('表单校验失败:', validationError);
        // uni-forms 会自动提示错误信息
        submitting.value = false;
    } catch (error: any) {
        uni.hideLoading();
        submitting.value = false;
        console.error("submitForm error:", error);
        uni.showToast({ title: '保存操作失败', icon: 'none' });
    }
}

</script>

<style scoped>
.container {
    padding: 15px;
}
.hint {
    font-size: 12px;
    color: #999;
    margin-top: 5px;
}
button[type="primary"] {
    margin-top: 20px;
}
</style>
