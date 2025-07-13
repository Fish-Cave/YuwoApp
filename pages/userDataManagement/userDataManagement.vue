<template>
	<view class="container">
		<!-- Header Section -->
		<view class="header-card glass-card">
			<view class="header-title">用户数据管理</view>
			<view class="header-subtitle">为指定用户发放会员资格或提升用户权限</view>
		</view>

		<!-- User Selection Section -->
		<view class="section-card glass-card">
			<view class="card-header">
				<text class="card-title">选择操作用户</text>
				<button class="refresh-button" @click="fetchUsers">刷新</button>
			</view>
			<view class="section-content">
				<view class="form-group">
					<text class="form-label">选择用户 ({{ userList.length }} 位)</text>
					<picker @change="onUserChange" :value="userIndex" :range="userList" range-key="displayName">
						<view class="uni-input picker-input">
							{{ userIndex === -1 ? '请选择一个用户' : userList[userIndex].displayName }}
						</view>
					</picker>
				</view>
			</view>
		</view>

		<!-- Sections that appear after selecting a user -->
		<view v-if="selectedUserId">
			<!-- Grant Membership Section -->
			<view class="section-card glass-card">
				<view class="card-header">
					<text class="card-title">发放会员</text>
				</view>
				<view class="section-content">
					<view class="form-group">
						<text class="form-label">会员类型</text>
						<uni-data-checkbox
							v-model="membershipType"
							:localdata="membershipTypeOptions"
						></uni-data-checkbox>
					</view>
					<view class="form-group">
						<text class="form-label">发放天数</text>
						<uni-easyinput type="number" v-model="durationInDays" placeholder="请输入天数" />
					</view>
					<!-- 修改点击事件，先进行确认 -->
					<button class="primary-button" @click="confirmGrantMembership" :loading="isGranting">确认发放</button>
				</view>
			</view>

			<!-- Promote User Section -->
			<view class="section-card glass-card" v-if="selectedUserIsPreUser">
				<view class="card-header">
					<text class="card-title">用户提权</text>
				</view>
				<view class="section-content">
					<view class="promote-info">
						<text>当前用户角色为 preUser，可以提升为正式 user。</text>
					</view>
					<button class="promote-button" @click="handlePromoteUser" :loading="isPromoting">提升为 User</button>
				</view>
			</view>
		</view>

		<!-- Placeholder when no user is selected -->
		<view v-else class="empty-list">
			<text>请先从上方选择一个用户以进行操作</text>
		</view>

	</view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

// 1. 导入云对象 (请确保已创建 admin-ops 云对象)
const adminOps = uniCloud.importObject('admin-ops', {
	customUI: true // 关闭自动弹窗，手动处理错误
});

const userList = ref([]);
const userIndex = ref(-1);
const selectedUserId = ref('');
const selectedUserIsPreUser = ref(false);

const membershipType = ref('membership'); // 默认歇脚卡
const durationInDays = ref(30);
const isGranting = ref(false);
const isPromoting = ref(false);

const membershipTypeOptions = [
	{ value: 'membership', text: '歇脚卡' },
	{ value: 'subscription-package', text: '月卡' }
];

// Helper function to format timestamp
function formatTimestamp(timestamp) {
    if (!timestamp) return '未知时间';
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = ('0' + (date.getMonth() + 1)).slice(-2); // Months are 0-indexed
    const day = ('0' + date.getDate()).slice(-2);
    const hours = ('0' + date.getHours()).slice(-2);
    const minutes = ('0' + date.getMinutes()).slice(-2);
    const seconds = ('0' + date.getSeconds()).slice(-2);
    // Note: This formats based on the device's local timezone.
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}


// 获取用户列表
async function fetchUsers() {
	userIndex.value = -1;
	selectedUserId.value = '';
	selectedUserIsPreUser.value = false;

	uni.showLoading({
		title: '加载用户列表...'
	});
	try {
		const users = await adminOps.getUsersForAdmin();
		userList.value = users.map(user => ({
			...user,
			// 创建一个用于显示的名称，优先用nickname，其次username
			displayName: user.nickname || user.username || `ID: ${user._id}`
		}));
	} catch (e) {
		uni.showToast({
			title: e.message || '加载用户失败',
			icon: 'none'
		});
	} finally {
		uni.hideLoading();
	}
}

// 当选择的用户变化时
function onUserChange(e) {
	userIndex.value = e.detail.value;
	if (userIndex.value > -1) {
		const selectedUser = userList.value[userIndex.value];
		selectedUserId.value = selectedUser._id;
		// 检查选中用户的角色是否为 preUser
		selectedUserIsPreUser.value = selectedUser.role && selectedUser.role.includes('preUser');
	} else {
		selectedUserId.value = '';
		selectedUserIsPreUser.value = false;
	}
}

// 新增：处理发放会员前的确认步骤
async function confirmGrantMembership() {
    if (!selectedUserId.value) {
        uni.showToast({ title: '请先选择用户', icon: 'none' });
        return;
    }
    if (!durationInDays.value || Number(durationInDays.value) <= 0) {
        uni.showToast({ title: '请输入有效天数', icon: 'none' });
        return;
    }

    isGranting.value = true; // 按钮进入加载状态

    try {
        // 1. 调用云函数计算预计到期时间
        const previewRes = await adminOps.calculateMembershipExpiry({
            userId: selectedUserId.value,
            membershipType: membershipType.value,
            durationInDays: Number(durationInDays.value)
        });

        const estimatedValidThru = previewRes.data.newValidThru;
        const formattedDate = formatTimestamp(estimatedValidThru);
        const selectedUserName = userList.value[userIndex.value].displayName;
        const membershipTypeText = membershipType.value === 'membership' ? '歇脚卡' : '月卡';

        // 2. 弹出确认框
        uni.showModal({
            title: '确认发放会员',
            content: `确定为用户 ${selectedUserName} 发放 ${durationInDays.value} 天 ${membershipTypeText}？\n\n预计到期时间：${formattedDate}\n时间戳：${estimatedValidThru}`,
            confirmText: '确认发放',
            cancelText: '取消',
            success: async (res) => {
                if (res.confirm) {
                    // 用户点击确认，执行实际发放操作
                    await handleGrantMembership(); // 调用实际发放函数
                } else {
                    // 用户点击取消
                    isGranting.value = false; // 取消加载状态
                }
            },
            fail: () => {
                 // showModal 自身失败的处理
                 isGranting.value = false; // 取消加载状态
            }
        });

    } catch (e) {
        // 计算预计时间失败
        uni.showToast({
            title: e.message || '计算预计到期时间失败',
            icon: 'none'
        });
        isGranting.value = false; // 取消加载状态
    }
}


// 修改：实际处理发放会员的函数 (现在只负责调用 grantMembership)
async function handleGrantMembership() {
    // 这个函数现在只在用户确认弹窗后被调用
    // 参数校验已经在 confirmGrantMembership 中完成

    try {
        const res = await adminOps.grantMembership({
            userId: selectedUserId.value,
            membershipType: membershipType.value,
            durationInDays: Number(durationInDays.value)
        });
        uni.showToast({
            title: res.errMsg,
            icon: 'success'
        });
    } catch (e) {
        uni.showToast({
            title: e.message || '操作失败',
            icon: 'none'
        });
    } finally {
        isGranting.value = false; // 确保在操作完成后取消加载状态
    }
}


// 处理用户提权 (保持不变)
async function handlePromoteUser() {
	if (!selectedUserId.value) {
		uni.showToast({ title: '请先选择用户', icon: 'none' });
		return;
	}

	isPromoting.value = true;
	try {
		const res = await adminOps.promoteUser({
			userId: selectedUserId.value
		});
		uni.showToast({
			title: res.errMsg,
			icon: 'success'
		});
		// 提权成功后，刷新用户列表以更新状态
		await fetchUsers();
	} catch (e) {
		uni.showToast({
			title: e.message || '操作失败',
			icon: 'none'
		});
	} finally {
		isPromoting.value = false;
	}
}

onMounted(() => {
	fetchUsers();
});
</script>

<style>
/* 样式保持不变 */
/* 复制自 config.vue 的样式，确保视觉统一 */
.container {
	padding: 20px;
	background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
	min-height: 100vh;
	position: relative;
}

.glass-card {
	background: rgba(255, 255, 255, 0.7);
	backdrop-filter: blur(10px);
	border-radius: 20px;
	box-shadow: 0 8px 32px rgba(31, 38, 135, 0.1);
	border: 1px solid rgba(255, 255, 255, 0.18);
	overflow: hidden;
	padding: 16px;
	margin-bottom: 20px;
}

.header-card {
	background: linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%);
	padding: 24px 16px;
	margin-bottom: 24px;
}

.header-title {
	font-size: 24px;
	font-weight: bold;
	color: white;
	margin-bottom: 8px;
	text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-subtitle {
	font-size: 14px;
	color: rgba(255, 255, 255, 0.8);
}

.card-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 4px 0;
	margin-bottom: 12px;
}

.card-title {
	font-size: 18px;
	font-weight: 600;
	color: #333;
}

.section-content {
	animation: fade-in 0.3s ease;
	padding-top: 8px;
}

.form-group {
	margin-bottom: 16px;
}

.form-label {
	display: block;
	font-size: 14px;
	color: #4B5563;
	margin-bottom: 6px;
	font-weight: 500;
}

.picker-input, .uni-input {
	height: 40px;
	line-height: 40px;
	padding: 0 10px;
	background-color: #F9FAFB;
	border: 1px solid #E5E7EB;
	border-radius: 6px;
	font-size: 14px;
	color: #1F2937;
}

.primary-button {
	background: linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%);
	color: white;
	border: none;
	border-radius: 12px;
	padding: 12px;
	font-size: 16px;
	font-weight: 500;
	box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.refresh-button {
	font-size: 12px;
	padding: 4px 8px;
	background: rgba(59, 130, 246, 0.1);
	color: #3B82F6;
	border-radius: 4px;
	border: none;
}

.empty-list {
	padding: 20px;
	text-align: center;
	color: #9CA3AF;
	background: rgba(0, 0, 0, 0.02);
	border-radius: 8px;
}

.promote-info {
	margin-bottom: 15px;
	color: #666;
	font-size: 14px;
}

.promote-button {
	background: linear-gradient(135deg, #10B981 0%, #059669 100%);
	color: white;
	border: none;
	border-radius: 12px;
	padding: 12px;
	font-size: 16px;
	box-shadow: 0 2px 4px rgba(16, 185, 129, 0.2);
}

@keyframes fade-in {
	from { opacity: 0; transform: translateY(-10px); }
	to { opacity: 1; transform: translateY(0); }
}
</style>
