<template>
	<view class="container">
		<!-- Header Section -->
		<view class="header-card glass-card">
			<view class="header-title">预约管理</view>
			<view class="header-subtitle">管理所有预约记录</view>
		</view>

		<!-- 搜索与筛选区域 -->
		<view class="search-card glass-card">
			<view class="search-header">
				<view class="search-title-section">
					<uni-icons type="search" size="20" color="#6B7280"></uni-icons>
					<view class="search-title">智能搜索</view>
				</view>
				<view class="filter-toggle" @click="toggleAdvancedFilters">
					<text>{{ showAdvancedFilters ? '收起' : '展开' }}</text>
					<uni-icons 
						:type="showAdvancedFilters ? 'up' : 'down'" 
						size="14" 
						color="#6B7280">
					</uni-icons>
				</view>
			</view>
			
			<!-- 基础搜索 -->
			<view class="search-section">
				<view class="search-input-wrapper">
					<view class="search-input-container">
						<uni-icons type="search" size="16" color="#9CA3AF"></uni-icons>
						<input 
							class="search-input" 
							v-model="searchForm.keyword" 
							placeholder="搜索预约ID、用户ID或机台名称" 
							@confirm="performSearch"
							@input="onSearchInput"
						/>
						<view v-if="searchForm.keyword" class="clear-search" @click="clearSearch">
							<uni-icons type="clear" size="14" color="#6B7280"></uni-icons>
						</view>
					</view>
					
					<button class="search-btn" @click="performSearch">
						<uni-icons type="search" size="16" color="#ffffff"></uni-icons>
					</button>
				</view>
				
				<!-- 快捷筛选标签 -->
				<view class="quick-filters">
					<view 
						v-for="(filter, index) in quickFilterTags" 
						:key="index"
						:class="['filter-tag', {'active': activeQuickFilter === filter.value}]"
						@click="applyQuickFilter(filter.value)"
					>
						<view :class="['tag-dot', filter.color]"></view>
						<text>{{ filter.label }}</text>
						<text class="tag-count">{{ filter.count || 0 }}</text>
					</view>
				</view>
			</view>
			
			<!-- 高级筛选选项 -->
			<transition name="slide-down">
				<view v-if="showAdvancedFilters" class="advanced-filters">
					<view class="filter-grid">
						<!-- 状态筛选 -->
						<view class="filter-group">
							<view class="filter-label">
								<uni-icons type="flag" size="14" color="#6B7280"></uni-icons>
								<text>预约状态</text>
							</view>
							<picker 
								@change="onStatusFilterChange" 
								:value="statusFilterIndex" 
								:range="statusFilterOptions">
								<view class="picker-display">
									<text>{{ statusFilterOptions[statusFilterIndex] }}</text>
									<uni-icons type="down" size="12" color="#6B7280"></uni-icons>
								</view>
							</picker>
						</view>
						
						<!-- 是否过夜 -->
						<view class="filter-group">
							<view class="filter-label">
								<uni-icons type="moon" size="14" color="#6B7280"></uni-icons>
								<text>是否过夜</text>
							</view>
							<picker 
								@change="onOvernightFilterChange" 
								:value="overnightFilterIndex" 
								:range="overnightFilterOptions">
								<view class="picker-display">
									<text>{{ overnightFilterOptions[overnightFilterIndex] }}</text>
									<uni-icons type="down" size="12" color="#6B7280"></uni-icons>
								</view>
							</picker>
						</view>
						
						<!-- 时间范围 -->
						<view class="filter-group full-width">
							<view class="filter-label">
								<uni-icons type="calendar" size="14" color="#6B7280"></uni-icons>
								<text>时间范围</text>
							</view>
							<view class="date-range">
								<view class="date-input-wrapper">
									<picker mode="date" @change="onStartDateChange" :value="searchForm.startDate">
										<view class="date-picker">
											<text>{{ searchForm.startDate || '开始日期' }}</text>
											<uni-icons type="calendar" size="14" color="#6B7280"></uni-icons>
										</view>
									</picker>
								</view>
								<view class="range-separator">
									<text>至</text>
								</view>
								<view class="date-input-wrapper">
									<picker mode="date" @change="onEndDateChange" :value="searchForm.endDate">
										<view class="date-picker">
											<text>{{ searchForm.endDate || '结束日期' }}</text>
											<uni-icons type="calendar" size="14" color="#6B7280"></uni-icons>
										</view>
									</picker>
								</view>
							</view>
						</view>
						
						<!-- 每页显示 -->
						<view class="filter-group">
							<view class="filter-label">
								<uni-icons type="list" size="14" color="#6B7280"></uni-icons>
								<text>每页显示</text>
							</view>
							<picker 
								@change="onPageSizeFilterChange" 
								:value="pageSizeFilterIndex" 
								:range="pageSizeFilterOptions">
								<view class="picker-display">
									<text>{{ pageSizeFilterOptions[pageSizeFilterIndex] }}</text>
									<uni-icons type="down" size="12" color="#6B7280"></uni-icons>
								</view>
							</picker>
						</view>
					</view>
					
					<view class="filter-actions">
						<button class="filter-btn reset" @click="resetAllFilters">
							<uni-icons type="refresh" size="14" color="#6B7280"></uni-icons>
							<text>重置</text>
						</button>
						<button class="filter-btn apply" @click="applyAdvancedFilters">
							<uni-icons type="checkmarkempty" size="14" color="#ffffff"></uni-icons>
							<text>应用筛选</text>
						</button>
					</view>
				</view>
			</transition>
		</view>

		<!-- 预约列表 -->
		<view class="section-card glass-card">
			<view class="card-header">
				<text class="card-title">预约列表</text>
				<button class="refresh-button" @click="loadReservations">刷新</button>
			</view>
			
			<view v-if="loading" class="loading-container">
				<uni-load-more status="loading" />
				<text class="loading-text">加载中...</text>
			</view>
			
			<view v-else-if="reservations.length === 0" class="empty-state">
				<text class="empty-text">暂无预约数据</text>
			</view>
			
			<view v-else class="reservation-list">
				<view v-for="reservation in reservations" :key="reservation._id" class="reservation-item glass-item">
					<view class="reservation-header">
						<view class="reservation-info">
							<text class="reservation-id">ID: {{ reservation._id }}</text>
							<text class="reservation-status" :class="getStatusClass(reservation.status)">
								{{ getStatusText(reservation.status) }}
							</text>
						</view>
						<view class="reservation-user">
							<text class="user-id">用户: {{ reservation.userId }}</text>
							<text class="reservation-type" :class="reservation.isOvernight ? 'overnight' : 'normal'">
								{{ reservation.isOvernight ? '过夜' : '普通' }}
							</text>
						</view>
					</view>
					
					<view class="reservation-details">
						<view class="detail-row">
							<text class="detail-label">机台:</text>
							<text class="detail-value">{{ reservation.machineName || '未知机台' }}</text>
						</view>
						<view class="detail-row">
							<text class="detail-label">开始时间:</text>
							<text class="detail-value">{{ formatDateTime(reservation.startTime) }}</text>
						</view>
						<view class="detail-row">
							<text class="detail-label">结束时间:</text>
							<text class="detail-value">{{ formatDateTime(reservation.endTime) }}</text>
						</view>
						<view class="detail-row" v-if="reservation.price !== undefined">
							<text class="detail-label">价格:</text>
							<text class="detail-value">{{ (reservation.price / 100).toFixed(2) }}元</text>
						</view>
					</view>
					
					<view class="reservation-actions">
						<button class="action-button edit-button" @click="editReservation(reservation)">编辑</button>
						<button class="action-button detail-button" @click="viewReservationDetail(reservation)">详情</button>
					</view>
				</view>
			</view>
			
			<!-- 分页控件 -->
			<view v-if="pagination.totalPages > 1" class="pagination">
				<button 
					class="page-button" 
					:disabled="pagination.current === 1"
					@click="goToPage(pagination.current - 1)">
					上一页
				</button>
				<text class="page-info">
					第 {{ pagination.current }} / {{ pagination.totalPages }} 页
				</text>
				<button 
					class="page-button" 
					:disabled="pagination.current === pagination.totalPages"
					@click="goToPage(pagination.current + 1)">
					下一页
				</button>
			</view>
		</view>

		<!-- 预约编辑弹窗 -->
		<uni-popup ref="editPopup" type="dialog">
			<uni-popup-dialog
				type="info"
				title="编辑预约"
				:duration="0"
				:before-close="true"
				@close="closeEditDialog"
				@confirm="confirmEdit">
				<view class="edit-form">
					<view class="form-group">
						<text class="form-label">预约状态</text>
						<picker @change="onEditStatusChange" :value="editForm.statusIndex" :range="editStatusOptions">
							<view class="uni-input picker-input">{{ editStatusOptions[editForm.statusIndex] }}</view>
						</picker>
					</view>
					
					<view class="form-group">
						<text class="form-label">修改原因</text>
						<uni-easyinput 
							v-model="editForm.reason" 
							placeholder="请输入修改原因" 
							type="textarea"
							:maxlength="200"
						/>
					</view>
				</view>
			</uni-popup-dialog>
		</uni-popup>

		<!-- 预约详情弹窗 -->
		<uni-popup ref="detailPopup" type="center">
			<view class="detail-dialog glass-card">
				<view class="detail-header">
					<text class="detail-title">预约详情</text>
					<text class="close-button" @click="closeDetailDialog">×</text>
				</view>
				<view class="detail-content">
					<view class="detail-item">
						<text class="detail-label">预约ID:</text>
						<text class="detail-value">{{ selectedReservation._id }}</text>
					</view>
					<view class="detail-item">
						<text class="detail-label">用户ID:</text>
						<text class="detail-value">{{ selectedReservation.userId }}</text>
					</view>
					<view class="detail-item">
						<text class="detail-label">机台:</text>
						<text class="detail-value">{{ selectedReservation.machineName || '未知机台' }}</text>
					</view>
					<view class="detail-item">
						<text class="detail-label">状态:</text>
						<text class="detail-value" :class="getStatusClass(selectedReservation.status)">
							{{ getStatusText(selectedReservation.status) }}
						</text>
					</view>
					<view class="detail-item">
						<text class="detail-label">类型:</text>
						<text class="detail-value" :class="selectedReservation.isOvernight ? 'overnight' : 'normal'">
							{{ selectedReservation.isOvernight ? '过夜' : '普通' }}
						</text>
					</view>
					<view class="detail-item">
						<text class="detail-label">开始时间:</text>
						<text class="detail-value">{{ formatDateTime(selectedReservation.startTime) }}</text>
					</view>
					<view class="detail-item">
						<text class="detail-label">结束时间:</text>
						<text class="detail-value">{{ formatDateTime(selectedReservation.endTime) }}</text>
					</view>
					<view class="detail-item" v-if="selectedReservation.price !== undefined">
						<text class="detail-label">价格:</text>
						<text class="detail-value">{{ (selectedReservation.price / 100).toFixed(2) }}元</text>
					</view>
					<view class="detail-item">
						<text class="detail-label">创建时间:</text>
						<text class="detail-value">{{ formatDateTime(selectedReservation.createTime) }}</text>
					</view>
				</view>
				<view class="detail-footer">
					<button class="primary-button" @click="closeDetailDialog">关闭</button>
				</view>
			</view>
		</uni-popup>
	</view>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import dayjs from 'dayjs';

// 导入云函数
const todo = uniCloud.importObject('todo');

// 响应式数据
const loading = ref(false);
const showFilterForm = ref(true);
const showAdvancedFilters = ref(false);
const activeQuickFilter = ref('all');
const reservations = ref([]);
const selectedReservation = ref({});
const editPopup = ref(null);
const detailPopup = ref(null);

// 搜索表单
const searchForm = reactive({
	keyword: '',
	status: null,
	overnight: null,
	startDate: '',
	endDate: '',
	pageSize: 10,
	pageNumber: 1
});

// 筛选选项
const statusFilterIndex = ref(0);
const statusFilterOptions = ['全部状态', '待确认', '已完成', '未完成', '已退款'];
const overnightFilterIndex = ref(0);
const overnightFilterOptions = ['全部类型', '普通', '过夜'];
const pageSizeFilterIndex = ref(0);
const pageSizeFilterOptions = ['10条/页', '20条/页', '50条/页'];

// 快捷筛选标签
const quickFilterTags = ref([
	{ label: '全部', value: 'all', color: 'blue', count: 0 },
	{ label: '待确认', value: 'pending', color: 'orange', count: 0 },
	{ label: '已完成', value: 'completed', color: 'green', count: 0 },
	{ label: '未完成', value: 'unfinished', color: 'red', count: 0 },
	{ label: '已退款', value: 'refunded', color: 'gray', count: 0 }
]);

// 编辑表单
const editForm = reactive({
	reservationId: '',
	statusIndex: 0,
	reason: ''
});

// 分页信息
const pagination = reactive({
	current: 1,
	pageSize: 10,
	total: 0,
	totalPages: 0
});

// 编辑状态选项
const editStatusOptions = ['待确认', '已完成', '未完成', '已退款'];

// 搜索防抖
let searchTimeout = null;

// 计算属性
const filterParams = computed(() => {
	const params = {
		pageSize: searchForm.pageSize,
		pageNumber: searchForm.pageNumber
	};
	
	if (searchForm.keyword) {
		params.keyword = searchForm.keyword;
	}
	
	if (searchForm.status !== null) {
		params.status = searchForm.status;
	}
	
	if (searchForm.overnight !== null) {
		params.isOvernight = searchForm.overnight;
	}
	
	if (searchForm.startDate) {
		params.startDate = new Date(searchForm.startDate).getTime();
	}
	
	if (searchForm.endDate) {
		params.endDate = new Date(searchForm.endDate).getTime() + 86400000; // 包含当天
	}
	
	return params;
});

// 方法
function toggleFilterForm() {
	showFilterForm.value = !showFilterForm.value;
}

// 新增搜索相关方法
function toggleAdvancedFilters() {
	showAdvancedFilters.value = !showAdvancedFilters.value;
}

function onSearchInput() {
	if (searchTimeout) {
		clearTimeout(searchTimeout);
	}
	
	searchTimeout = setTimeout(() => {
		performSearch();
	}, 500);
}

function performSearch() {
	searchForm.pageNumber = 1;
	pagination.current = 1;
	loadReservations();
}

function clearSearch() {
	searchForm.keyword = '';
	performSearch();
}

function applyQuickFilter(type) {
	resetAllFilters();
	
	switch (type) {
		case 'pending':
			searchForm.status = 0;
			statusFilterIndex.value = 1;
			break;
		case 'completed':
			searchForm.status = 1;
			statusFilterIndex.value = 2;
			break;
		case 'unfinished':
			searchForm.status = 2;
			statusFilterIndex.value = 3;
			break;
		case 'refunded':
			searchForm.status = 3;
			statusFilterIndex.value = 4;
			break;
		default:
			searchForm.status = null;
			statusFilterIndex.value = 0;
	}
	
	activeQuickFilter.value = type;
	performSearch();
}

function onStatusFilterChange(e) {
	statusFilterIndex.value = parseInt(e.detail.value);
	searchForm.status = statusFilterIndex.value > 0 ? statusFilterIndex.value - 1 : null;
}

function onOvernightFilterChange(e) {
	overnightFilterIndex.value = parseInt(e.detail.value);
	searchForm.overnight = overnightFilterIndex.value > 0 ? overnightFilterIndex.value === 2 : null;
}

function onPageSizeFilterChange(e) {
	pageSizeFilterIndex.value = parseInt(e.detail.value);
	searchForm.pageSize = parseInt(pageSizeFilterOptions[pageSizeFilterIndex.value]);
}

function resetAllFilters() {
	searchForm.keyword = '';
	searchForm.status = null;
	searchForm.overnight = null;
	searchForm.startDate = '';
	searchForm.endDate = '';
	searchForm.pageSize = 10;
	
	statusFilterIndex.value = 0;
	overnightFilterIndex.value = 0;
	pageSizeFilterIndex.value = 0;
	activeQuickFilter.value = 'all';
}

function applyAdvancedFilters() {
	performSearch();
	showAdvancedFilters.value = false;
}

function onStartDateChange(e) {
	searchForm.startDate = e.detail.value;
}

function onEndDateChange(e) {
	searchForm.endDate = e.detail.value;
}

function onEditStatusChange(e) {
	editForm.statusIndex = parseInt(e.detail.value);
}

function goToPage(page) {
	if (page >= 1 && page <= pagination.totalPages) {
		searchForm.pageNumber = page;
		pagination.current = page;
		loadReservations();
	}
}

async function loadReservations() {
	// 验证日期范围
	if (searchForm.startDate && searchForm.endDate) {
		const startDate = new Date(searchForm.startDate);
		const endDate = new Date(searchForm.endDate);
		if (startDate > endDate) {
			uni.showToast({
				title: '开始日期不能晚于结束日期',
				icon: 'none'
			});
			return;
		}
	}

	try {
		loading.value = true;
		const params = filterParams.value;
		
		// 调用云函数获取预约列表
		const result = await todo.Get_FilteredReservations(params);
		
		if (result.code === 0) {
			reservations.value = result.data || [];
			if (result.pagination) {
				pagination.current = result.pagination.current;
				pagination.total = result.pagination.total;
				pagination.totalPages = result.pagination.totalPages;
			}
		} else {
			uni.showToast({
				title: result.errMsg || '获取预约列表失败',
				icon: 'none'
			});
		}
	} catch (e) {
		console.error('加载预约列表失败:', e);
		uni.showToast({
			title: '网络错误',
			icon: 'none'
		});
	} finally {
		loading.value = false;
	}
}

function editReservation(reservation) {
	selectedReservation.value = reservation;
	editForm.reservationId = reservation._id;
	editForm.statusIndex = reservation.status || 0;
	editForm.reason = '';
	editPopup.value.open();
}

function viewReservationDetail(reservation) {
	selectedReservation.value = reservation;
	detailPopup.value.open();
}

function closeEditDialog() {
	editPopup.value.close();
}

function closeDetailDialog() {
	detailPopup.value.close();
}

async function confirmEdit() {
	if (!editForm.reason || editForm.reason.trim() === '') {
		uni.showToast({
			title: '请输入修改原因',
			icon: 'none'
		});
		return false;
	}
	
	try {
		uni.showLoading({ title: '更新中...' });
		
		const updateData = {
			reservationId: editForm.reservationId,
			status: editForm.statusIndex,
			reason: editForm.reason
		};
		
		const result = await todo.UpdateReservation(updateData);
		
		uni.hideLoading();
		
		if (result.code === 0) {
			uni.showToast({
				title: '更新成功',
				icon: 'success'
			});
			closeEditDialog();
			loadReservations(); // 刷新列表
		} else {
			uni.showModal({
				title: '更新失败',
				content: result.errMsg || '服务器错误',
				showCancel: false
			});
		}
	} catch (e) {
		uni.hideLoading();
		console.error('更新预约失败:', e);
		uni.showModal({
			title: '更新失败',
			content: '网络错误',
			showCancel: false
		});
	}
	
	return false;
}

function getStatusText(status) {
	switch (status) {
		case 0: return '待确认';
		case 1: return '已完成';
		case 2: return '未完成';
		case 3: return '已退款';
		default: return '未知状态';
	}
}

function getStatusClass(status) {
	switch (status) {
		case 0: return 'status-pending';
		case 1: return 'status-completed';
		case 2: return 'status-unfinished';
		case 3: return 'status-refunded';
		default: return '';
	}
}

function formatDateTime(timestamp) {
	if (!timestamp) return '--';
	const date = new Date(timestamp);
	return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

// 生命周期钩子
onMounted(() => {
	loadReservations();
});
</script>

<style>
.container {
	padding: 20px;
	background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
	min-height: 100vh;
}

/* 玻璃拟态卡片 */
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

.glass-item {
	background: rgba(255, 255, 255, 0.6);
	backdrop-filter: blur(8px);
	border-radius: 12px;
	box-shadow: 0 4px 16px rgba(31, 38, 135, 0.05);
	border: 1px solid rgba(255, 255, 255, 0.18);
	padding: 16px;
	margin-bottom: 12px;
	transition: transform 0.2s ease;
}

.glass-item:active {
	transform: scale(0.98);
}

/* 头部样式 */
.header-card {
	background: linear-gradient(135deg, #10B981 0%, #059669 100%);
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

/* 卡片头部 */
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

.card-action {
	font-size: 14px;
	color: #10B981;
	padding: 4px 8px;
	border-radius: 4px;
	background: rgba(16, 185, 129, 0.1);
}

.refresh-button {
	font-size: 12px;
	padding: 4px 8px;
	background: rgba(16, 185, 129, 0.1);
	color: #10B981;
	border-radius: 4px;
	border: none;
}

/* 筛选表单 */
.filter-form {
	padding-top: 8px;
}

.form-row {
	display: flex;
	gap: 12px;
}

.form-row .form-group {
	flex: 1;
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

.picker-input {
	height: 40px;
	line-height: 40px;
	padding: 0 10px;
	background-color: #F9FAFB;
	border: 1px solid #E5E7EB;
	border-radius: 6px;
	font-size: 14px;
	color: #1F2937;
}

/* 按钮组 */
.button-group {
	display: flex;
	gap: 10px;
	margin-top: 16px;
}

.primary-button {
	flex: 2;
	background: linear-gradient(135deg, #10B981 0%, #059669 100%);
	color: white;
	border: none;
	border-radius: 12px;
	padding: 12px;
	font-size: 16px;
	font-weight: 500;
	box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
	transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.primary-button:active {
	transform: translateY(2px);
	box-shadow: 0 2px 6px rgba(16, 185, 129, 0.2);
}

.secondary-button {
	flex: 1;
	background: #F3F4F6;
	color: #4B5563;
	border: 1px solid #D1D5DB;
	border-radius: 12px;
	padding: 12px;
	font-size: 16px;
	font-weight: 500;
	transition: background-color 0.2s ease;
}

.secondary-button:active {
	background: #E5E7EB;
}

/* 加载状态 */
.loading-container {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 40px;
}

.loading-text {
	margin-top: 12px;
	color: #6B7280;
	font-size: 14px;
}

/* 空状态 */
.empty-state {
	display: flex;
	justify-content: center;
	align-items: center;
	padding: 40px;
}

.empty-text {
	color: #9CA3AF;
	font-size: 16px;
}

/* 预约列表 */
.reservation-list {
	margin-bottom: 20px;
}

.reservation-header {
	display: flex;
	flex-direction: column;
	gap: 8px;
	margin-bottom: 12px;
}

.reservation-info {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.reservation-id {
	font-size: 14px;
	color: #6B7280;
	font-family: monospace;
}

.reservation-status {
	font-size: 12px;
	padding: 2px 8px;
	border-radius: 20px;
	font-weight: 500;
}

.status-pending {
	background: rgba(245, 158, 11, 0.1);
	color: #F59E0B;
}

.status-completed {
	background: rgba(16, 185, 129, 0.1);
	color: #10B981;
}

.status-unfinished {
	background: rgba(239, 68, 68, 0.1);
	color: #EF4444;
}

.status-refunded {
	background: rgba(107, 114, 128, 0.1);
	color: #6B7280;
}

.reservation-user {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.user-id {
	font-size: 13px;
	color: #4B5563;
}

.reservation-type {
	font-size: 12px;
	padding: 2px 8px;
	border-radius: 12px;
	font-weight: 500;
}

.normal {
	background: rgba(59, 130, 246, 0.1);
	color: #3B82F6;
}

.overnight {
	background: rgba(168, 85, 247, 0.1);
	color: #A855F7;
}

.reservation-details {
	display: flex;
	flex-direction: column;
	gap: 12px;
	margin-bottom: 12px;
	padding: 12px;
	background: rgba(0, 0, 0, 0.02);
	border-radius: 8px;
}

.detail-row {
	display: flex;
	align-items: flex-start;
	gap: 8px;
}

.detail-label {
	font-size: 13px;
	color: #6B7280;
	min-width: 70px;
	line-height: 1.4;
	margin-top: 2px;
}

.detail-value {
	font-size: 13px;
	color: #1F2937;
	flex: 1;
}

.reservation-actions {
	display: flex;
	justify-content: space-between;
	gap: 8px;
	margin-top: 12px;
}

.action-button {
	flex: 1;
	min-width: 0;
	height: 36px;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 12px;
	padding: 8px 12px;
	border-radius: 6px;
	border: none;
	font-weight: 500;
	white-space: nowrap;
}

.edit-button {
	background: rgba(59, 130, 246, 0.1);
	color: #3B82F6;
}

.detail-button {
	background: rgba(107, 114, 128, 0.1);
	color: #6B7280;
}

/* 分页 */
.pagination {
	display: flex;
	justify-content: center;
	align-items: center;
	gap: 12px;
	margin-top: 20px;
}

.page-button {
	background: #F3F4F6;
	color: #4B5563;
	border: 1px solid #D1D5DB;
	border-radius: 6px;
	padding: 8px 16px;
	font-size: 14px;
	transition: background-color 0.2s ease;
}

.page-button:disabled {
	opacity: 0.5;
	cursor: not-allowed;
}

.page-button:not(:disabled):active {
	background: #E5E7EB;
}

.page-info {
	font-size: 14px;
	color: #6B7280;
}

/* 编辑表单 */
.edit-form {
	padding: 16px 0;
}

/* 详情弹窗 */
.detail-dialog {
	min-width: 320px;
	max-width: 400px;
	background: rgba(255, 255, 255, 0.9);
	backdrop-filter: blur(12px);
}

.detail-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 16px;
	padding-bottom: 12px;
	border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.detail-title {
	font-size: 18px;
	font-weight: 600;
	color: #1F2937;
}

.close-button {
	font-size: 24px;
	color: #6B7280;
	width: 32px;
	height: 32px;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 50%;
	background: rgba(107, 114, 128, 0.1);
	cursor: pointer;
}

.close-button:active {
	background: rgba(107, 114, 128, 0.2);
}

.detail-content {
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.detail-item {
	display: flex;
	align-items: flex-start;
	gap: 8px;
}

.detail-item .detail-label {
	min-width: 80px;
	font-size: 14px;
	color: #6B7280;
}

.detail-item .detail-value {
	flex: 1;
	font-size: 14px;
	color: #1F2937;
}

.detail-footer {
	display: flex;
	justify-content: center;
	margin-top: 16px;
	padding-top: 12px;
	border-top: 1px solid rgba(0, 0, 0, 0.1);
}

/* 搜索与筛选样式 */
.search-card {
	padding: 20px;
}

.search-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 16px;
}

.search-title-section {
	display: flex;
	align-items: center;
	gap: 8px;
}

.search-title {
	font-size: 18px;
	font-weight: 600;
	color: #333;
}

.filter-toggle {
	display: flex;
	align-items: center;
	gap: 4px;
	padding: 4px 8px;
	border-radius: 4px;
	background: rgba(59, 130, 246, 0.1);
	cursor: pointer;
	transition: all 0.3s ease;
}

.filter-toggle text {
	font-size: 14px;
	color: #3B82F6;
}

.search-section {
	margin-bottom: 16px;
}

.search-input-wrapper {
	display: flex;
	gap: 12px;
	margin-bottom: 16px;
}

.search-input-container {
	flex: 1;
	display: flex;
	align-items: center;
	background: #F9FAFB;
	border: 1px solid #E5E7EB;
	border-radius: 6px;
	padding: 0 10px;
	transition: all 0.3s ease;
}

.search-input-container:focus-within {
	border-color: #3B82F6;
	box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.search-input {
	flex: 1;
	height: 40px;
	margin-left: 8px;
	border: none;
	background: transparent;
	font-size: 14px;
	color: #1F2937;
}

.clear-search {
	padding: 4px;
	cursor: pointer;
	border-radius: 4px;
	transition: all 0.3s ease;
}

.clear-search:active {
	background: rgba(107, 114, 128, 0.1);
}

.search-btn {
	background: linear-gradient(135deg, #10B981 0%, #059669 100%);
	color: white;
	border: none;
	border-radius: 12px;
	padding: 12px;
	font-size: 16px;
	font-weight: 500;
	box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
	transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.search-btn:active {
	transform: translateY(2px);
	box-shadow: 0 2px 6px rgba(16, 185, 129, 0.2);
}

.quick-filters {
	display: flex;
	gap: 8px;
	flex-wrap: wrap;
}

.filter-tag {
	display: flex;
	align-items: center;
	gap: 6px;
	padding: 8px 12px;
	background: rgba(255, 255, 255, 0.6);
	border: 1px solid rgba(255, 255, 255, 0.18);
	border-radius: 20px;
	cursor: pointer;
	transition: all 0.3s ease;
}

.filter-tag.active {
	background: rgba(16, 185, 129, 0.15);
	border-color: #10B981;
}

.filter-tag text {
	font-size: 14px;
	color: #374151;
	font-weight: 500;
}

.tag-dot {
	width: 6px;
	height: 6px;
	border-radius: 50%;
}

.tag-dot.blue { background: #3B82F6; }
.tag-dot.orange { background: #F59E0B; }
.tag-dot.green { background: #10B981; }
.tag-dot.red { background: #EF4444; }
.tag-dot.gray { background: #6B7280; }

.tag-count {
	font-size: 12px;
	background: rgba(0, 0, 0, 0.1);
	color: #6B7280;
	padding: 2px 6px;
	border-radius: 10px;
	min-width: 16px;
	text-align: center;
}

.advanced-filters {
	background: rgba(249, 250, 251, 0.8);
	border-radius: 16px;
	padding: 20px;
	margin-top: 16px;
	animation: fade-in 0.3s ease;
}

.filter-grid {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 16px;
	margin-bottom: 20px;
}

.filter-group {
	display: flex;
	flex-direction: column;
}

.filter-group.full-width {
	grid-column: 1 / -1;
}

.filter-label {
	display: flex;
	align-items: center;
	gap: 6px;
	margin-bottom: 6px;
	font-size: 14px;
	color: #4B5563;
	font-weight: 500;
}

.picker-display {
	display: flex;
	justify-content: space-between;
	align-items: center;
	height: 40px;
	padding: 0 10px;
	background-color: #F9FAFB;
	border: 1px solid #E5E7EB;
	border-radius: 6px;
	font-size: 14px;
	color: #1F2937;
	cursor: pointer;
	transition: all 0.3s ease;
}

.picker-display:active {
	background: rgba(255, 255, 255, 0.9);
}

.date-range {
	display: flex;
	align-items: center;
	gap: 12px;
}

.date-input-wrapper {
	flex: 1;
}

.date-picker {
	display: flex;
	justify-content: space-between;
	align-items: center;
	height: 40px;
	padding: 0 10px;
	background: #F9FAFB;
	border: 1px solid #E5E7EB;
	border-radius: 6px;
	font-size: 14px;
	color: #1F2937;
	cursor: pointer;
	transition: all 0.3s ease;
}

.date-picker:active {
	background: rgba(255, 255, 255, 0.9);
}

.range-separator {
	color: #6B7280;
	font-size: 14px;
	font-weight: 500;
}

.filter-actions {
	display: flex;
	justify-content: flex-end;
	gap: 10px;
}

.filter-btn {
	display: flex;
	align-items: center;
	gap: 6px;
	padding: 10px 16px;
	border-radius: 12px;
	font-size: 14px;
	font-weight: 500;
	border: none;
	cursor: pointer;
	transition: all 0.3s ease;
}

.filter-btn.reset {
	background: #F3F4F6;
	color: #4B5563;
	border: 1px solid #D1D5DB;
}

.filter-btn.reset:active {
	background: #E5E7EB;
}

.filter-btn.apply {
	background: linear-gradient(135deg, #10B981 0%, #059669 100%);
	color: white;
	box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.filter-btn.apply:active {
	transform: translateY(2px);
	box-shadow: 0 2px 6px rgba(16, 185, 129, 0.2);
}

@keyframes fade-in {
	from {
		opacity: 0;
		transform: translateY(-10px);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}

/* 移动端优化 */
@media (max-width: 768px) {
	.container {
		padding: 12px;
	}
	
	.glass-card {
		padding: 12px;
		margin-bottom: 12px;
		border-radius: 16px;
	}
	
	.header-card {
		padding: 16px 12px;
		margin-bottom: 16px;
	}
	
	.header-title {
		font-size: 20px;
	}
	
	.header-subtitle {
		font-size: 12px;
	}
	
	.filter-form {
		padding-top: 4px;
	}
	
	/* 搜索界面移动端优化 */
	.search-card {
		padding: 12px;
		margin-bottom: 12px;
	}
	
	.search-header {
		margin-bottom: 12px;
	}
	
	.search-title {
		font-size: 16px;
	}
	
	.filter-toggle text {
		font-size: 12px;
	}
	
	.search-section {
		margin-bottom: 12px;
	}
	
	.search-input-wrapper {
		flex-direction: column;
		gap: 8px;
	}
	
	.search-input-container {
		height: 36px;
		padding: 0 8px;
	}
	
	.search-input {
		height: 36px;
		font-size: 13px;
		margin-left: 6px;
	}
	
	.search-btn {
		width: 100%;
		padding: 10px;
		font-size: 14px;
	}
	
	.quick-filters {
		gap: 6px;
	}
	
	.filter-tag {
		padding: 6px 10px;
	}
	
	.filter-tag text {
		font-size: 12px;
	}
	
	.tag-count {
		font-size: 10px;
		padding: 1px 4px;
		min-width: 14px;
	}
	
	.advanced-filters {
		padding: 16px;
		margin-top: 12px;
	}
	
	.filter-grid {
		grid-template-columns: 1fr;
		gap: 12px;
		margin-bottom: 16px;
	}
	
	.filter-group.full-width {
		grid-column: 1;
	}
	
	.filter-label {
		font-size: 13px;
		margin-bottom: 4px;
	}
	
	.picker-display, .date-picker {
		height: 36px;
		padding: 0 8px;
		font-size: 13px;
	}
	
	.date-range {
		flex-direction: column;
		gap: 8px;
	}
	
	.range-separator {
		display: none;
	}
	
	.filter-actions {
		flex-direction: column;
		gap: 8px;
	}
	
	.filter-btn {
		padding: 8px 12px;
		font-size: 13px;
	}
	
	.form-row {
		flex-direction: column;
		gap: 8px;
	}
	
	.form-group {
		margin-bottom: 12px;
	}
	
	.form-label {
		font-size: 13px;
		margin-bottom: 4px;
	}
	
	.picker-input {
		height: 36px;
		line-height: 36px;
		padding: 0 8px;
		font-size: 13px;
	}
	
	.button-group {
		flex-direction: column;
		gap: 8px;
		margin-top: 12px;
	}
	
	.primary-button,
	.secondary-button {
		padding: 10px;
		font-size: 14px;
	}
	
	.reservation-list {
		margin-bottom: 16px;
	}
	
	.reservation-item {
		padding: 12px;
		margin-bottom: 8px;
		border-radius: 10px;
	}
	
	.reservation-id {
		font-size: 12px;
		word-break: break-all;
	}
	
	.reservation-status {
		padding: 3px 8px;
		font-size: 11px;
	}
	
	.user-id {
		font-size: 12px;
		word-break: break-all;
	}
	
	.reservation-type {
		padding: 3px 8px;
		font-size: 11px;
	}
	
	.reservation-details {
		padding: 10px;
		gap: 10px;
	}
	
	.detail-label {
		font-size: 12px;
		min-width: 60px;
	}
	
	.detail-value {
		font-size: 12px;
		line-height: 1.4;
	}
	
	.action-button {
		height: 32px;
		padding: 6px 10px;
		font-size: 11px;
	}
	
	.pagination {
		flex-wrap: wrap;
		gap: 8px;
	}
	
	.page-button {
		padding: 6px 12px;
		font-size: 12px;
	}
	
	.page-info {
		font-size: 12px;
	}
	
	.edit-form {
		padding: 12px 0;
	}
	
	.detail-dialog {
		min-width: 90vw;
		padding: 16px;
	}
	
	.detail-content {
		gap: 10px;
	}
	
	.detail-item {
		gap: 6px;
	}
	
	.detail-item .detail-label {
		min-width: 70px;
		font-size: 12px;
	}
	
	.detail-item .detail-value {
		font-size: 12px;
		line-height: 1.4;
	}
}

/* 超小屏幕优化 */
@media (max-width: 400px) {
	.container {
		padding: 8px;
	}
	
	.glass-card {
		padding: 10px;
		margin-bottom: 10px;
		border-radius: 12px;
	}
	
	.header-card {
		padding: 12px 10px;
	}
	
	.header-title {
		font-size: 18px;
	}
	
	.reservation-item {
		padding: 10px;
	}
	
	.reservation-id,
	.user-id {
		font-size: 11px;
	}
	
	.reservation-status,
	.reservation-type {
		padding: 2px 6px;
		font-size: 10px;
	}
	
	.action-button {
		height: 28px;
		padding: 4px 8px;
		font-size: 10px;
	}
	
	.detail-dialog {
		min-width: 95vw;
	}
}
@media (prefers-color-scheme: dark) {
	.container {
		background: linear-gradient(135deg, #111827 0%, #1F2937 100%);
	}
	
	.glass-card {
		background: rgba(31, 41, 55, 0.7);
		border-color: rgba(255, 255, 255, 0.08);
	}
	
	.glass-item {
		background: rgba(31, 41, 55, 0.6);
		border-color: rgba(255, 255, 255, 0.08);
	}
	
	.card-title {
		color: #F3F4F6;
	}
	
	.card-action {
		color: #10B981;
		background: rgba(16, 185, 129, 0.2);
	}
	
	.form-label {
		color: #9CA3AF;
	}
	
	.picker-input {
		background-color: rgba(31, 41, 55, 0.7);
		border-color: rgba(255, 255, 255, 0.08);
		color: #F3F4F6;
	}
	
	.secondary-button {
		background: rgba(31, 41, 55, 0.7);
		color: #D1D5DB;
		border-color: rgba(255, 255, 255, 0.1);
	}
	
	.secondary-button:active {
		background: rgba(31, 41, 55, 0.9);
	}
	
	.refresh-button {
		background: rgba(16, 185, 129, 0.2);
		color: #10B981;
	}
	
	.loading-text,
	.empty-text {
		color: #9CA3AF;
	}
	
	.reservation-id,
	.user-id,
	.detail-label {
		color: #9CA3AF;
	}
	
	.detail-value {
		color: #F3F4F6;
	}
	
	.detail-button {
		background: rgba(107, 114, 128, 0.2);
		color: #D1D5DB;
	}
	
	.page-button {
		background: rgba(31, 41, 55, 0.7);
		color: #D1D5DB;
		border-color: rgba(255, 255, 255, 0.1);
	}
	
	.page-info {
		color: #9CA3AF;
	}
	
	.detail-dialog {
		background: rgba(31, 41, 55, 0.9);
	}
	
	.detail-title {
		color: #F3F4F6;
	}
	
	.close-button {
		color: #D1D5DB;
		background: rgba(107, 114, 128, 0.2);
	}
	
	.close-button:active {
		background: rgba(107, 114, 128, 0.3);
	}
}
</style>