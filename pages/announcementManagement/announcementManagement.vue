<template>
	<view class="container">
		<view class="header-card glass-card">
			<view class="header-title">公告管理</view>
			<view class="header-actions">
				<button class="add-button" @click="goToCreate()">
					<uni-icons type="plus" size="16" color="#ffffff"></uni-icons>
					<text>发布公告</text>
				</button>
			</view>
		</view>

		<!-- 搜索和筛选区域 -->
		<view class="filter-card glass-card">
			<view class="search-row">
				<uni-easyinput v-model="searchKeyword" placeholder="搜索公告标题或内容" @clear="handleSearchClear">
					<template #right>
						<uni-icons type="search" size="18" color="#999" @click="handleSearch"></uni-icons>
					</template>
				</uni-easyinput>
				<button class="search-button" @click="handleSearch">搜索</button>
			</view>

			<view class="filter-row">
				<view class="filter-label">状态筛选：</view>
				<view class="filter-options">
					<view
						:class="['filter-option', currentFilter === 'published' ? 'active' : '']"
						@click="changeFilter('published')">
						已发布
					</view>
					<view
						:class="['filter-option', currentFilter === 'draft' ? 'active' : '']"
						@click="changeFilter('draft')">
						草稿
					</view>
					<view
						:class="['filter-option', currentFilter === 'all' ? 'active' : '']"
						@click="changeFilter('all')">
						全部
					</view>
				</view>
			</view>
		</view>

		<!-- 公告列表 -->
		<view class="announcement-list">
			<view v-for="item in announcementList" :key="item._id" class="announcement-item glass-card">
				<view class="item-header">
					<view class="item-title-container">
						<text v-if="item.isTop" class="top-badge">置顶</text>
						<text class="item-title">{{ item.title }}</text>
						<view v-if="item.images && item.images.length > 0" class="image-indicator">
							<uni-icons type="image" size="14" color="#999"></uni-icons>
							<text class="image-count">{{ item.images.length }}</text>
						</view>
					</view>

					<view class="item-status">
						<view :class="['status-badge', item.status === 1 ? 'published' : 'draft']">
							{{ item.status === 1 ? '已发布' : '草稿' }}
						</view>
					</view>
				</view>

				<view class="item-meta">
					<text class="meta-item">发布者: {{ item.publisherName }}</text>
					<text class="meta-item">发布时间: {{ formatDate(item.publishDate) }}</text>
					<text class="meta-item">浏览: {{ item.viewCount || 0 }}</text>
				</view>

				<view class="item-actions">
					<view class="action-buttons">
						<button class="action-button view-button" @click="goToDetail(item._id)">
							<uni-icons type="eye" size="14" color="#3B82F6"></uni-icons>
							<text>查看</text>
						</button>
						<button class="action-button edit-button" @click="goToEdit(item._id)">
							<uni-icons type="compose" size="14" color="#F59E0B"></uni-icons>
							<text>编辑</text>
						</button>
						<button class="action-button delete-button" @click="confirmDelete(item)">
							<uni-icons type="trash" size="14" color="#EF4444"></uni-icons>
							<text>删除</text>
						</button>
					</view>
				</view>
			</view>
		</view>

		<!-- 空状态 -->
		<view v-if="announcementList.length === 0 && !loading" class="empty-state">
			<uni-icons type="info" size="48" color="#D1D5DB"></uni-icons>
			<text class="empty-text">{{ getEmptyText() }}</text>
		</view>

		<!-- 加载状态 -->
		<view v-if="loading" class="loading-state">
			<uni-load-more :status="'loading'" :content-size="14"></uni-load-more>
		</view>

		<!-- 分页器 -->
		<view v-if="pagination.totalPages > 1 && !loading" class="pagination">
			<view
				:class="['page-button', pagination.current === 1 ? 'disabled' : '']"
				@click="changePage(pagination.current - 1)">
				<uni-icons type="arrowleft" size="14"></uni-icons>
			</view>

			<view class="page-info">
				{{ pagination.current }} / {{ pagination.totalPages }}
			</view>

			<view
				:class="['page-button', pagination.current >= pagination.totalPages ? 'disabled' : '']"
				@click="changePage(pagination.current + 1)">
				<uni-icons type="arrowright" size="14"></uni-icons>
			</view>
		</view>
	</view>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import dayjs from 'dayjs'

// 响应式数据
const loading = ref(false)
const searchKeyword = ref('')
const currentFilter = ref('published') // published, draft, all
const announcementList = ref([])
const announcement = uniCloud.importObject('announcement')

// 分页信息
const pagination = reactive({
	current: 1,
	pageSize: 10,
	total: 0,
	totalPages: 1
})

// 获取公告列表
async function fetchAnnouncements(resetPage = true) {
	if (resetPage) {
		pagination.current = 1
	}

	loading.value = true
	try {
		const statusMap = {
			published: 1,
			draft: 0,
			all: null
		}

		const params = {
			page: pagination.current,
			pageSize: pagination.pageSize,
			status: statusMap[currentFilter.value],
			keyword: searchKeyword.value.trim() || null
		}

		const result = await announcement.getAnnouncementList(params)

		if (result.code === 0) {
			announcementList.value = result.data
			Object.assign(pagination, result.pagination)
		} else {
			uni.showToast({
				title: result.errMsg || '获取公告失败',
				icon: 'none'
			})
		}
	} catch (error) {
		console.error('获取公告列表失败:', error)
		uni.showToast({
			title: '获取公告列表失败',
					icon: 'none'
		})
	} finally {
		loading.value = false
	}
}

// 处理搜索
function handleSearch() {
	fetchAnnouncements()
}

// 处理搜索清空
function handleSearchClear() {
	searchKeyword.value = ''
	fetchAnnouncements()
}

// 切换筛选条件
function changeFilter(filter) {
	currentFilter.value = filter
	fetchAnnouncements()
}

// 切换页码
function changePage(page) {
	if (page >= 1 && page <= pagination.totalPages) {
		pagination.current = page
		fetchAnnouncements(false)
	}
}

// 格式化日期
function formatDate(timestamp) {
	return dayjs(timestamp).format('YYYY-MM-DD HH:mm')
}

// 获取空状态文本
function getEmptyText() {
	if (searchKeyword.value) {
		return '没有找到相关的公告'
	}
	switch (currentFilter.value) {
		case 'published':
			return '暂无已发布的公告'
		case 'draft':
			return '暂无草稿公告'
		default:
			return '暂无公告'
	}
}

// 跳转到创建页面
function goToCreate() {
	uni.navigateTo({
		url: '/pages/announcementEdit/announcementEdit'
	})
}

// 跳转到详情页面
function goToDetail(id) {
	uni.navigateTo({
		url: `/pages/announcementDetail/announcementDetail?id=${id}`
	})
}

// 跳转到编辑页面
function goToEdit(id) {
	uni.navigateTo({
		url: `/pages/announcementEdit/announcementEdit?id=${id}`
	})
}

// 确认删除
function confirmDelete(item) {
	uni.showModal({
		title: '确认删除',
		content: `确定要删除公告"${item.title}"吗？此操作不可撤销。`,
		success: async (res) => {
			if (res.confirm) {
				await deleteAnnouncement(item._id)
			}
		}
	})
}

// 删除公告
async function deleteAnnouncement(id) {
	try {
		const result = await announcement.deleteAnnouncement(id)

		if (result.code === 0) {
			uni.showToast({
				title: '删除成功',
				icon: 'success'
			})
			// 重新获取列表
			fetchAnnouncements()
		} else {
			uni.showToast({
				title: result.errMsg || '删除失败',
				icon: 'none'
			})
		}
	} catch (error) {
		console.error('删除公告失败:', error)
		uni.showToast({
			title: '删除失败',
			icon: 'none'
		})
	}
}

// 页面加载时获取数据
onMounted(() => {
	fetchAnnouncements()
})
</script>

<style scoped>
.container {
	padding: 20rpx;
	background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
	min-height: 100vh;
}

.glass-card {
	background: rgba(255, 255, 255, 0.7);
	backdrop-filter: blur(10px);
	border-radius: 20rpx;
	box-shadow: 0 8px 32px rgba(31, 38, 135, 0.1);
	border: 1px solid rgba(255, 255, 255, 0.18);
	padding: 20rpx;
	margin-bottom: 20rpx;
}

.header-card {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 20rpx;
}

.header-title {
	font-size: 36rpx;
	font-weight: bold;
	color: #333;
}

.header-actions {
	display: flex;
	gap: 16rpx;
}

.add-button {
	display: flex;
	align-items: center;
	gap: 8rpx;
	background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
	color: white;
	border: none;
	border-radius: 12rpx;
	padding: 16rpx 24rpx;
	font-size: 28rpx;
	font-weight: 500;
	box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.filter-card {
	margin-bottom: 20rpx;
}

.search-row {
	display: flex;
	gap: 16rpx;
	margin-bottom: 16rpx;
}

.search-button {
	background: #3B82F6;
	color: white;
	border: none;
	border-radius: 8rpx;
	padding: 12rpx 24rpx;
	font-size: 28rpx;
	min-width: 120rpx;
}

.filter-row {
	display: flex;
	align-items: center;
	gap: 16rpx;
}

.filter-label {
	font-size: 28rpx;
	color: #666;
	font-weight: 500;
}

.filter-options {
	display: flex;
	gap: 12rpx;
}

.filter-option {
	padding: 8rpx 20rpx;
	border-radius: 20rpx;
	background: #f3f4f6;
	color: #666;
	font-size: 26rpx;
	transition: all 0.2s;
	cursor: pointer;
}

.filter-option.active {
	background: #3B82F6;
	color: white;
}

.announcement-list {
	margin-bottom: 40rpx;
}

.announcement-item {
	margin-bottom: 16rpx;
	padding: 24rpx;
}

.item-header {
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	margin-bottom: 16rpx;
}

.item-title-container {
	display: flex;
	align-items: center;
	gap: 12rpx;
	flex: 1;
}

.top-badge {
	background: #F59E0B;
	color: white;
	font-size: 20rpx;
	padding: 4rpx 12rpx;
	border-radius: 12rpx;
	font-weight: 500;
}

.item-title {
	font-size: 32rpx;
	font-weight: 600;
	color: #333;
	line-height: 1.4;
}

.image-indicator {
	display: flex;
	align-items: center;
	gap: 4rpx;
	background: #f3f4f6;
	padding: 4rpx 12rpx;
	border-radius: 12rpx;
}

.image-count {
	font-size: 24rpx;
	color: #666;
}

.status-badge {
	padding: 8rpx 16rpx;
	border-radius: 16rpx;
	font-size: 24rpx;
	font-weight: 500;
}

.status-badge.published {
	background: rgba(16, 185, 129, 0.1);
	color: #10B981;
}

.status-badge.draft {
	background: rgba(107, 114, 128, 0.1);
	color: #6B7280;
}

.item-meta {
	display: flex;
	flex-wrap: wrap;
	gap: 16rpx;
	margin-bottom: 16rpx;
}

.meta-item {
	font-size: 24rpx;
	color: #666;
	background: #f9fafb;
	padding: 6rpx 12rpx;
	border-radius: 8rpx;
}

.item-actions {
	display: flex;
	justify-content: flex-end;
}

.action-buttons {
	display: flex;
	gap: 12rpx;
}

.action-button {
	display: flex;
	align-items: center;
	gap: 6rpx;
	border: none;
	border-radius: 8rpx;
	padding: 10rpx 16rpx;
	font-size: 24rpx;
	transition: all 0.2s;
}

.view-button {
	background: rgba(59, 130, 246, 0.1);
	color: #3B82F6;
}

.edit-button {
	background: rgba(245, 158, 11, 0.1);
	color: #F59E0B;
}

.delete-button {
	background: rgba(239, 68, 68, 0.1);
	color: #EF4444;
}

.action-button:active {
	transform: scale(0.95);
}

.empty-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 80rpx 0;
	color: #9CA3AF;
}

.empty-text {
	margin-top: 20rpx;
	font-size: 28rpx;
}

.loading-state {
	display: flex;
	justify-content: center;
	padding: 40rpx 0;
}

.pagination {
	display: flex;
	justify-content: center;
	align-items: center;
	gap: 20rpx;
	padding: 20rpx 0;
}

.page-button {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 60rpx;
	height: 60rpx;
	border-radius: 30rpx;
	background: #f3f4f6;
	color: #666;
	transition: all 0.2s;
	cursor: pointer;
}

.page-button:not(.disabled):active {
	transform: scale(0.95);
}

.page-button.disabled {
	opacity: 0.5;
	cursor: not-allowed;
}

.page-info {
	font-size: 28rpx;
	color: #666;
	min-width: 100rpx;
	text-align: center;
}
</style>