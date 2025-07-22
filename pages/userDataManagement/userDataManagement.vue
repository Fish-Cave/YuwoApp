<template>
	<view class="container">
		<!-- 1. 头部和搜索栏 -->
		<view class="header-card">
			<view class="header-title">用户数据管理</view>
			<uni-easyinput prefixIcon="search" v-model="searchQuery" placeholder="按昵称或ID后6位搜索" @confirm="handleSearch"
				@clear="handleSearch"></uni-easyinput>

			<!-- 筛选条件 -->
			<view class="filter-options">
			    <text class="filter-label">会员:</text>
			    <uni-data-checkbox
			        multiple
			        v-model="activeFilters"
			        :localdata="filterOptions"
			        @change="handleFilterChange"
			    ></uni-data-checkbox>
			</view>
			<!-- 角色筛选 -->
			<view class="filter-options">
			    <text class="filter-label">角色:</text>
			    <uni-data-checkbox
			        v-model="roleFilter"
			        :localdata="roleFilterOptions"
			        @change="handleFilterChange"
			    ></uni-data-checkbox>
			</view>
		</view>

		<!-- 2. 批量操作栏 -->
		<view class="batch-actions-bar" v-if="selectedUserIds.length > 0">
			<text class="selection-info">已选 {{ selectedUserIds.length }} 项</text>
			<view class="action-buttons">
				<button class="action-btn add" @click="openBatchGrantModal">批量增时</button>
				<button class="action-btn modify" @click="openBatchUpdateModal">修改/取消</button>
			</view>
		</view>

		<!-- 3. 表格 -->
		<view class="table-container">
			<uni-table ref="table" :loading="loading" border stripe type="selection" emptyText="暂无数据"
				@selection-change="selectionChange">
				<uni-tr>
					<uni-th width="150" align="center">用户</uni-th>
					<uni-th width="80" align="center">角色</uni-th>
					<uni-th width="110" align="center">歇脚卡</uni-th>
					<uni-th width="110" align="center">月卡</uni-th>
					<uni-th width="80" align="center">操作</uni-th>
				</uni-tr>
				<uni-tr v-for="(item, index) in tableData" :key="item._id">
					<uni-td align="center">{{ formatUserIdentifier(item) }}</uni-td>
					<uni-td align="center">
						<view class="role-tags">
							<uni-tag v-for="role in item.role" :key="role" :text="role" :type="getRoleType(role)"
								size="mini" />
						</view>
					</uni-td>
					<uni-td align="center">{{ formatExpiry(item.membership_expiry, item.membership_status) }}</uni-td>
					<uni-td align="center">{{ formatExpiry(item.subscription_package_expiry, item.subscription_package_status) }}</uni-td>
					<uni-td align="center">
						<view class="uni-group">
							<button v-if="item.role.includes('preUser')" class="uni-button promote-btn" size="mini"
								@click="handlePromoteUser(item._id, item)">提权</button>
							<button v-else-if="item.role.includes('user') && !item.role.includes('admin')" class="uni-button demote-btn" size="mini"
								@click="handleDemoteUser(item._id, item)">降权</button>
							<text v-else>--</text>
						</view>
					</uni-td>
				</uni-tr>
			</uni-table>
		</view>

		<!-- 4. 分页器 -->
		<view class="pagination-box">
			<uni-pagination show-icon :page-size="pageSize" :current="pageCurrent" :total="total"
				@change="paginationChange" />
		</view>


		<!-- 弹窗部分 -->
		<uni-popup ref="grantModal" type="center">
			<view class="modal-content-box">
				<text class="modal-title">批量增加会员时长</text>
				<view class="modal-form">
					<text class="form-label">会员类型</text>
					<uni-data-checkbox v-model="batchGrant.membershipType" :localdata="membershipTypeOptions"></uni-data-checkbox>
					<text class="form-label">增加天数</text>
					<uni-easyinput type="number" v-model="batchGrant.durationInDays" placeholder="请输入要增加的天数"></uni-easyinput>
				</view>
				<view class="modal-buttons">
					<button class="modal-btn cancel" @click="$refs.grantModal.close()">取消</button>
					<button class="modal-btn confirm" @click="handleBatchGrant">确认执行</button>
				</view>
			</view>
		</uni-popup>
		<uni-popup ref="updateModal" type="center">
			<view class="modal-content-box">
				<text class="modal-title">批量修改会员</text>
				<view class="modal-form">
					<text class="form-label">会员类型</text>
					<uni-data-checkbox v-model="batchUpdate.membershipType" :localdata="membershipTypeOptions"></uni-data-checkbox>
					<text class="form-label">执行操作</text>
					<uni-data-checkbox v-model="batchUpdate.action" :localdata="updateActionOptions"></uni-data-checkbox>
					<view v-if="batchUpdate.action === 'setExpiry'">
						<text class="form-label">设置新的到期日</text>
						<view class="date-picker-trigger" @click="openDatePicker">
							<text :class="{'placeholder': !batchUpdate.newExpiryDate}">
								{{ formattedNewExpiryDate || '请选择日期' }}
							</text>
						</view>
					</view>
				</view>
				<view class="modal-buttons">
					<button class="modal-btn cancel" @click="$refs.updateModal.close()">取消</button>
					<button class="modal-btn confirm" @click="handleBatchUpdate">确认执行</button>
				</view>
			</view>
		</uni-popup>
		<uv-datetime-picker
			ref="datetimePicker"
			v-model="pickerValue"
			mode="date"
			@confirm="onDateConfirm"
			:z-index="10000"
		></uv-datetime-picker>

	</view>
</template>

<script setup>
	import { ref, computed, onMounted } from 'vue';

	const adminOps = uniCloud.importObject('admin-ops', { customUI: true });

	// 表格和分页状态
	const table = ref(null);
	const tableData = ref([]);
	const loading = ref(true);
	const searchQuery = ref('');
	const pageCurrent = ref(1);
	const pageSize = ref(10);
	const total = ref(0);

	// 筛选状态 
	const activeFilters = ref([]); // 存储当前选中的筛选值，例如 ['membership'] 或 ['subscription'] 或 ['membership', 'subscription']
	const filterOptions = ref([
		{ value: 'membership', text: '只看歇脚卡用户' },
		{ value: 'subscription', text: '只看月卡用户' }
	]);
	const roleFilter = ref('all'); // 默认显示所有用户
	const roleFilterOptions = ref([
	    { value: 'all', text: '全部角色' },
	    { value: 'user', text: '正式用户' },
	    { value: 'preUser', text: '预备用户' }
	]);
	// 批量选择状态
	const selectedIndexs = ref([]); // 存储选中行的索引
	// computed 属性根据选中的索引获取对应的用户ID
	const selectedUserIds = computed(() => {
		// 确保 selectedIndexs 是一个数字数组，并且索引有效
		return selectedIndexs.value
			.map(i => {
				// 检查索引是否是有效的数字且在 tableData 范围内
				if (typeof i === 'number' && i >= 0 && i < tableData.value.length) {
					return tableData.value[i]?._id;
				}
				return null; // 对于无效索引返回 null
			})
			.filter(id => id != null); // 过滤掉 null 或 undefined 的 ID
	});


	// 弹窗状态
	const grantModal = ref(null);
	const batchGrant = ref({ membershipType: 'membership', durationInDays: null });
	const updateModal = ref(null);
	const batchUpdate = ref({ membershipType: 'membership', action: 'cancel', newExpiryDate: '' });
	const membershipTypeOptions = [{ value: 'membership', text: '歇脚卡' }, { value: 'subscription-package', text: '月卡' }];
	const updateActionOptions = [{ value: 'cancel', text: '取消会员' }, { value: 'setExpiry', text: '指定到期日' }];

	// 日期选择器相关状态
	const datetimePicker = ref(null);
	const pickerValue = ref(Date.now());
	const formattedNewExpiryDate = computed(() => {
		if (!batchUpdate.value.newExpiryDate) return '';
		const d = new Date(batchUpdate.value.newExpiryDate);
		return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
	});

	// 获取数据
	async function fetchData() {
		loading.value = true;

		// 清空选择状态：先清空变量，再尝试清空组件UI
		selectedIndexs.value = [];
		if (table.value && table.value.clearSelection) {
			try {
				table.value.clearSelection();
				console.log('uni-table selection cleared.');
			} catch (e) {
				console.error('Failed to clear uni-table selection:', e);
				// 如果 clearSelection 不存在或报错，忽略即可
			}
		} else {
             console.warn('uni-table ref or clearSelection method not available.');
        }

		// 准备筛选参数
		const filterMembership = activeFilters.value.includes('membership');
		const filterSubscription = activeFilters.value.includes('subscription');


		try {
			const res = await adminOps.getUsersForAdmin({
				searchQuery: searchQuery.value,
				page: pageCurrent.value,
				pageSize: pageSize.value,
				filterMembership: filterMembership, // 传递筛选参数
				filterSubscription: filterSubscription ,//  传递筛选参数
				roleFilter: roleFilter.value
			});
			tableData.value = res.data;
			total.value = res.total;
		} catch (e) {
			uni.showToast({ title: e.message || '加载失败', icon: 'none' });
		} finally {
			loading.value = false;
		}
	}

	// 搜索和分页
	function handleSearch() {
		pageCurrent.value = 1; // 搜索时重置到第一页
		fetchData();
	}
	function paginationChange(e) {
		pageCurrent.value = e.current;
		fetchData();
	}

	//  筛选条件变化处理
	function handleFilterChange(e) {
		console.log('Filter changed:', e.detail.value);
		// activeFilters.value 已经被 uni-data-checkbox 自动更新了
		pageCurrent.value = 1; // 筛选变化时重置到第一页
		fetchData();
	}


	// 表格选择项变化处理 - 添加调试和更健壮的索引提取
	function selectionChange(e) {
		console.log('--- selectionChange Event (Fixed) ---');
		console.log('e.detail:', e.detail);

		let newSelectedIndexs = [];

		// 优先尝试从 e.detail.index 获取索引数组
		if (e.detail && Array.isArray(e.detail.index)) {
			console.log('Processing e.detail.index:', e.detail.index);

			// 遍历 e.detail.index 数组，尝试提取数字索引
			newSelectedIndexs = e.detail.index.map((item, arrayIdx) => {
				// console.log(`Item at index ${arrayIdx}:`, item, typeof item); // 如果需要更详细的日志，可以取消注释

				if (typeof item === 'number') {
					return item; // 如果已经是数字，直接使用
				} else if (typeof item === 'string') {
					const parsed = parseInt(item);
					return isNaN(parsed) ? -1 : parsed; // 如果是字符串数字，尝试解析
				} else if (typeof item === 'object' && item !== null) {
					// 如果是对象，尝试从常见的属性名中提取索引
					const possibleIndex = item.index || item.idx || item.i || item.value || item.key;
					if (typeof possibleIndex === 'number') {
						return possibleIndex;
					} else if (typeof possibleIndex === 'string') {
						const parsed = parseInt(possibleIndex);
						return isNaN(parsed) ? -1 : parsed;
					}
					// 备选：如果对象没有明确的索引属性，尝试看它是否是 tableData 中的行对象
					const foundIndex = tableData.value.findIndex(row => row === item || (row && item && row._id === item._id));
					return foundIndex !== -1 ? foundIndex : -1;
				}
				// 如果以上都不是，返回 -1 表示无效索引
				return -1;
			}).filter(index => index !== -1); // 过滤掉所有无效的索引 (-1)

			console.log('Processed indices from e.detail.index:', newSelectedIndexs);

		}
		// 如果 e.detail.index 不可用或处理失败，尝试使用 e.detail.value
		else if (e.detail && Array.isArray(e.detail.value)) {
			console.log('e.detail.index not suitable or available, trying e.detail.value:', e.detail.value);
			// e.detail.value 通常是选中的行数据对象数组
			newSelectedIndexs = e.detail.value.map(selectedRow => {
				// 在 tableData 中查找选中行对象的索引
				const index = tableData.value.findIndex(row => row === selectedRow || (row && selectedRow && row._id === selectedRow._id));
				return index; // findIndex 返回 -1 如果找不到
			}).filter(index => index !== -1); // 过滤掉在 tableData 中找不到的行

			console.log('Indices derived from e.detail.value:', newSelectedIndexs);

		} else {
			console.warn('Unrecognized selectionChange event structure:', e);
			newSelectedIndexs = [];
		}

		selectedIndexs.value = newSelectedIndexs;

		console.log('Final selectedIndexs:', selectedIndexs.value);
		console.log('Corresponding User IDs:', selectedUserIds.value);
		console.log('Selected User Count:', selectedUserIds.value.length);
		console.log('--- End selectionChange Event (Fixed) ---');
	}


	// 辅助函数
	function formatUserIdentifier(user) {
		if (user.nickname) return user.nickname;
		if (user._id) return `N/A (id:...${user._id.slice(-6)})`;
		return '未知用户';
	}
	function formatExpiry(timestamp, status) {
		if (!timestamp || !status || timestamp < Date.now()) return 'N/A';
		const d = new Date(timestamp);
		return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
	}
	function getRoleType(role) {
		if (role === 'admin') return 'error';
		if (role === 'user') return 'primary';
		if (role === 'preUser') return 'warning';
		return 'default';
	}

	// 操作函数 
	function openBatchGrantModal() {
		if (selectedUserIds.value.length === 0) {
			uni.showToast({ title: '请先选择用户', icon: 'none' });
			return;
		}
		batchGrant.value.durationInDays = null;
		grantModal.value.open();
	}
	async function handleBatchGrant() {
		const days = batchGrant.value.durationInDays;
		const selectedCount = selectedUserIds.value.length;

		console.log('批量授权 - 选中用户数:', selectedCount);
		console.log('批量授权 - 选中用户IDs:', selectedUserIds.value);

		if (selectedCount === 0) {
			uni.showToast({ title: '请先选择用户', icon: 'none' });
			return;
		}

		if (!days || Number(days) <= 0) {
			uni.showToast({ title: '请输入有效的天数', icon: 'none' });
			return;
		}

		uni.showModal({
			title: '确认操作',
			content: `确定要为选中的 ${selectedCount} 个用户增加 ${days} 天的${batchGrant.value.membershipType === 'membership' ? '歇脚卡' : '月卡'}吗？`,
			success: async (res) => {
				if (res.confirm) {
					uni.showLoading({ title: '处理中...' });
					try {
						const result = await adminOps.batchGrantMembership({
							userIds: selectedUserIds.value,
							membershipType: batchGrant.value.membershipType,
							durationInDays: Number(days)
						});
						uni.showToast({ title: result.errMsg, icon: 'success' });
						grantModal.value.close();
						fetchData(); // 刷新数据并清空选择
					} catch (e) {
						uni.showToast({ title: e.message, icon: 'none' });
					} finally {
						uni.hideLoading();
					}
				}
			}
		});
	}

	function openBatchUpdateModal() {
		if (selectedUserIds.value.length === 0) {
			uni.showToast({ title: '请先选择用户', icon: 'none' });
			return;
		}
		batchUpdate.value.newExpiryDate = '';
		updateModal.value.open();
	}
	async function handleBatchUpdate() {
		const selectedCount = selectedUserIds.value.length;

		console.log('批量更新 - 选中用户数:', selectedCount);
		console.log('批量更新 - 选中用户IDs:', selectedUserIds.value);

		if (selectedCount === 0) {
			uni.showToast({ title: '请先选择用户', icon: 'none' });
			return;
		}

		if (batchUpdate.value.action === 'setExpiry' && !batchUpdate.value.newExpiryDate) {
			uni.showToast({ title: '请选择新的到期日期', icon: 'none' });
			return;
		}

		uni.showLoading({ title: '处理中...' });
		try {
			const res = await adminOps.batchUpdateMembership({
				userIds: selectedUserIds.value,
				membershipType: batchUpdate.value.membershipType,
				action: batchUpdate.value.action,
				expiryTimestamp: batchUpdate.value.newExpiryDate
			});
			uni.showToast({ title: res.errMsg, icon: 'success' });
			updateModal.value.close();
			fetchData(); // 刷新数据并清空选择
		} catch (e) {
			uni.showToast({ title: e.message, icon: 'none' });
		} finally {
			uni.hideLoading();
		}
	}

	function openDatePicker() {
		// 设置日期选择器的初始值，如果 batchUpdate.newExpiryDate 有值则用它，否则用当前时间
		pickerValue.value = batchUpdate.value.newExpiryDate ? new Date(batchUpdate.value.newExpiryDate).getTime() : Date.now();
		datetimePicker.value.open();
	}
	function onDateConfirm(e) {
		// e.value 是时间戳
		const selectedDate = new Date(e.value);
		// 设置到期时间为当天的最后一刻，避免时区或时间差导致的问题
		selectedDate.setHours(23, 59, 59, 999);
		batchUpdate.value.newExpiryDate = selectedDate.getTime();
	}

	async function handlePromoteUser(userId, user) {
		uni.showModal({
			title: '确认提权',
			content: `确定要将用户 "${formatUserIdentifier(user)}" 的角色提升为 User 吗？`,
			success: async (res) => {
				if (res.confirm) {
					uni.showLoading({ title: '正在提权...' });
					try {
						const result = await adminOps.promoteUser({ userId });
						uni.showToast({ title: result.errMsg, icon: 'success' });
						fetchData(); // 刷新数据并清空选择
					} catch (e) { uni.showToast({ title: e.message, icon: 'none' }); } finally { uni.hideLoading(); }
					}
				}
			});
		}

		async function handleDemoteUser(userId, user) {
			uni.showModal({
				title: '确认降权',
				content: `确定要将用户 "${formatUserIdentifier(user)}" 的角色降级为 preUser 吗？`,
				confirmColor: '#f56c6c',
				success: async (res) => {
					if (res.confirm) {
						uni.showLoading({ title: '正在降权...' });
						try {
							const result = await adminOps.updateUserRole({ userId, role: ['preUser'] });
							uni.showToast({ title: result.errMsg, icon: 'success' });
							fetchData(); // 刷新数据并清空选择
						} catch (e) { uni.showToast({ title: e.message, icon: 'none' }); } finally { uni.hideLoading(); }
					}
				}
			});
		}

		onMounted(() => {
			fetchData();
		});
</script>

<style scoped>
	/* 样式部分 */
	.container {
		padding: 15px;
		background-color: #f5f5f5;
	}
	.header-card {
		background-color: #fff;
		padding: 15px;
		border-radius: 8px;
		margin-bottom: 15px;
	}
	.header-title {
		font-size: 20px;
		font-weight: bold;
		margin-bottom: 15px;
	}
	/* [新增] 筛选样式 */
	.filter-options {
		display: flex;
		align-items: center;
		margin-top: 15px;
		gap: 10px; /* 调整间距 */
	}
	.filter-label {
		font-size: 14px;
		color: #333;
		flex-shrink: 0; /* 防止文字被压缩 */
	}
	/* 调整 uni-data-checkbox 在 flex 布局中的样式 */
	.filter-options .uni-data-checkbox {
		flex-grow: 1; /* 允许复选框区域占据剩余空间 */
	}
	/* 如果需要调整复选框选项之间的间距，可能需要深入组件内部样式或使用外部容器 */


	.batch-actions-bar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 10px 16px;
		background-color: #eef2ff;
		border-radius: 8px;
		margin-bottom: 15px;
	}
	.selection-info {
		font-size: 14px;
		color: #4f46e5;
	}
	.action-buttons {
		display: flex;
		gap: 10px;
	}
	.action-btn {
		font-size: 12px;
		padding: 6px 12px;
		border-radius: 8px;
		color: white;
		border: none;
		line-height: 1.5;
	}
	.action-btn.add { background-color: #4f46e5; }
	.action-btn.modify { background-color: #f97316; }
	.table-container {
		margin-bottom: 15px;
	}
	.role-tags {
		display: flex;
		justify-content: center;
		gap: 5px;
	}
	.uni-group .uni-button {
		padding: 0 8px;
		line-height: 24px;
		height: 24px;
	}
	.promote-btn {
		background-color: #18bc37 !important;
		color: white !important;
	}
	.demote-btn {
		background-color: #f56c6c !important;
		color: white !important;
	}
	.pagination-box {
		display: flex;
		justify-content: center;
		background-color: #fff;
		padding: 10px 0;
		border-radius: 8px;
	}

	.modal-content-box {
		width: 85vw;
		padding: 20px;
		background-color: #fff;
		border-radius: 8px;
	}
	.modal-title {
		font-size: 18px;
		font-weight: bold;
		text-align: center;
		display: block;
		margin-bottom: 20px;
	}
	.modal-form {
		display: flex;
		flex-direction: column;
		gap: 15px;
	}
	.form-label {
		font-size: 14px;
		font-weight: 500;
	}
	.modal-buttons {
		display: flex;
		gap: 10px;
		margin-top: 25px;
	}
	.modal-btn {
		flex: 1;
		font-size: 16px;
	}
	.modal-btn.cancel {
		background-color: #f3f4f6;
		color: #374151;
	}
	.modal-btn.confirm {
		background-color: #4f46e5;
		color: white;
	}

	.date-picker-trigger {
		border: 1px solid #e5e5e5;
		border-radius: 4px;
		padding: 8px 12px;
		font-size: 14px;
	}
	.date-picker-trigger .placeholder {
		color: #999;
	}
</style>
