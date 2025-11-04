<template>
	<view class="container">
		<!-- 页面标题 -->
		<view class="header-card glass-card">
			<view class="header-title">公告列表</view>
			<view class="header-subtitle">查看最新公告和通知</view>
		</view>

		<!-- 公告列表 -->
		<view class="announcement-list">
			<view v-for="item in announcementList" :key="item._id" class="announcement-item glass-card" @click="goToDetail(item._id)">
				<view class="item-header">
					<view class="item-title-container">
						<text v-if="item.isTop" class="top-badge">置顶</text>
						<text class="item-title">{{ item.title }}</text>
						<view v-if="item.images && item.images.length > 0" class="image-indicator">
							<uni-icons type="image" size="14" color="#999"></uni-icons>
							<text class="image-count">{{ item.images.length }}</text>
						</view>
					</view>
				</view>

				<view class="item-content">
					<text class="content-preview">{{ getContentPreview(item.content) }}</text>
				</view>

				<view class="item-meta">
					<text class="meta-item">发布者: {{ item.publisherName }}</text>
					<text class="meta-item">{{ formatDate(item.publishDate) }}</text>
					<text class="meta-item">浏览: {{ item.viewCount || 0 }}</text>
				</view>
			</view>
		</view>

		<!-- 空状态 -->
		<view v-if="announcementList.length === 0 && !loading" class="empty-state">
			<uni-icons type="info" size="48" color="#D1D5DB"></uni-icons>
			<text class="empty-text">暂无公告</text>
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
		const params = {
			page: pagination.current,
			pageSize: pagination.pageSize,
			status: 1, // 只获取已发布的公告
			keyword: null
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

// 切换页码
function changePage(page) {
	if (page >= 1 && page <= pagination.totalPages) {
		pagination.current = page
		fetchAnnouncements(false)
	}
}

// 获取内容预览
function getContentPreview(content) {
	// 移除 markdown 标签，只显示纯文本
	const plainText = content
		.replace(/#{1,6}\s/g, '') // 移除标题
		.replace(/\*\*(.*?)\*\*/g, '$1') // 移除粗体
		.replace(/\*(.*?)\*/g, '$1') // 移除斜体
		.replace(/`(.*?)`/g, '$1') // 移除行内代码
		.replace(/```[\s\S]*?```/g, '') // 移除代码块
		.replace(/\[(.*?)\]\(.*?\)/g, '$1') // 移除链接
		.replace(/!\[.*?\]\(.*?\)/g, '[图片]') // 替换图片
		.replace(/^\s*[-*+]\s+/gm, '• ') // 替换无序列表
		.replace(/^\s*\d+\.\s+/gm, '') // 移除有序列表标记
		.replace(/\n+/g, ' ') // 替换换行符
		.trim()

	return plainText.length > 100 ? plainText.substring(0, 100) + '...' : plainText
}

// 格式化日期
function formatDate(timestamp) {
	return dayjs(timestamp).format('YYYY-MM-DD HH:mm')
}

// 跳转到详情页面
function goToDetail(id) {
	uni.navigateTo({
		url: `/pages/announcementDetail/announcementDetail?id=${id}`
	})
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
	padding: 24rpx;
	margin-bottom: 20rpx;
}

.header-card {
	text-align: center;
	margin-bottom: 20rpx;
}

.header-title {
	font-size: 36rpx;
	font-weight: bold;
	color: #333;
	margin-bottom: 8rpx;
}

.header-subtitle {
	font-size: 28rpx;
	color: #666;
}

.announcement-list {
	margin-bottom: 40rpx;
}

.announcement-item {
	margin-bottom: 16rpx;
	padding: 24rpx;
	transition: all 0.2s;
	cursor: pointer;
}

.announcement-item:active {
	transform: scale(0.98);
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
	flex: 1;
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

.item-content {
	margin-bottom: 16rpx;
}

.content-preview {
	font-size: 28rpx;
	color: #666;
	line-height: 1.5;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
	overflow: hidden;
}

.item-meta {
	display: flex;
	flex-wrap: wrap;
	gap: 16rpx;
}

.meta-item {
	font-size: 24rpx;
	color: #999;
	background: #f9fafb;
	padding: 6rpx 12rpx;
	border-radius: 8rpx;
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