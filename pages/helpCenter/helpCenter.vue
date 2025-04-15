<template>
    <view class="container">
        <uni-list>
            <uni-list-item v-for="item in helpList" :key="item._id" :title="item.helptitle" clickable @click="viewHelp(item)">
                <!-- 管理员编辑/删除按钮 -->
                <template v-slot:footer>
                    <view v-if="isAdmin" class="admin-actions">
                        <button size="mini" type="primary" @click.stop="editHelp(item._id)">编辑</button>
                        <button size="mini" type="warn" @click.stop="deleteHelp(item._id, item.helptitle)">删除</button>
                    </view>
                </template>
            </uni-list-item>
        </uni-list>

        <view v-if="helpList.length === 0 && !loading" class="empty-state">
            <text>暂无帮助文档</text>
        </view>

        <!-- 管理员添加按钮 (例如使用悬浮按钮) -->
        <view v-if="isAdmin" class="fab" @click="addHelp">
            <uni-icons type="plusempty" size="30" color="#fff"></uni-icons>
        </view>

        <uni-load-more v-if="loading" status="loading"></uni-load-more>
    </view>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { store } from '@/uni_modules/uni-id-pages/common/store.js'; // 引入 store 判断权限

const todo = uniCloud.importObject('todo');
const helpList = ref<any[]>([]);
const loading = ref(false);

// 判断是否为管理员
const isAdmin = computed(() => {
    return store.userInfo && store.userInfo.role && store.userInfo.role.includes('admin');
});

async function fetchHelpList() {
    loading.value = true;
    try {
        const res = await todo.HelpCenter_List();
        if (res.errCode === 0) {
            helpList.value = res.data;
        } else {
            uni.showToast({ title: res.errMsg || '加载失败', icon: 'none' });
        }
    } catch (error: any) {
        console.error("fetchHelpList error:", error);
        uni.showToast({ title: '加载帮助列表出错', icon: 'none' });
    } finally {
        loading.value = false;
    }
}

function viewHelp(item: any) {
    // 传递 url 或 id 到详情页
    uni.navigateTo({
        // 优先传递 url，如果 url 可能很大或是 markdown 内容本身，则只传 id
        url: `/pages/helpcenter/view?url=${encodeURIComponent(item.helpurl)}&title=${encodeURIComponent(item.helptitle)}`
        // 或者 url: `/pages/helpcenter/view?id=${item._id}`
    });
}

function addHelp() {
    uni.navigateTo({
        url: '/pages/helpcenter/edit' // 跳转到编辑页（新增模式）
    });
}

function editHelp(id: string) {
    uni.navigateTo({
        url: `/pages/helpcenter/edit?id=${id}` // 跳转到编辑页（编辑模式）
    });
}

function deleteHelp(id: string, title: string) {
    uni.showModal({
        title: '确认删除',
        content: `确定要删除 "${title}" 吗？`,
        success: async (res) => {
            if (res.confirm) {
                uni.showLoading({ title: '删除中...' });
                try {
                    const result = await todo.HelpCenter_Delete(id);
                    uni.hideLoading();
                    if (result.errCode === 0) {
                        uni.showToast({ title: '删除成功', icon: 'success' });
                        // 刷新列表
                        fetchHelpList();
                    } else {
                        uni.showToast({ title: result.errMsg || '删除失败', icon: 'none' });
                    }
                } catch (error: any) {
                    uni.hideLoading();
                    console.error("deleteHelp error:", error);
                    uni.showToast({ title: '删除操作失败', icon: 'none' });
                }
            }
        }
    });
}

onMounted(() => {
    fetchHelpList();
});

// 下拉刷新
// onPullDownRefresh(async () => {
//     await fetchHelpList();
//     uni.stopPullDownRefresh();
// });
</script>

<style scoped>
.container {
    padding: 10px;
}
.admin-actions {
    display: flex;
    gap: 10px; /* 按钮间距 */
    align-items: center;
}
.fab {
    position: fixed;
    bottom: 40px;
    right: 20px;
    width: 50px;
    height: 50px;
    background-color: #007aff;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    z-index: 10;
}
.empty-state {
    text-align: center;
    color: #999;
    padding: 50px 0;
}
</style>
