<template>
	<view class="container">
		<!-- 公告内容 -->
		<view class="content-card glass-card">
			<view class="announcement-header">
				<view class="title-container">
					<text v-if="announcement.isTop" class="top-badge">置顶</text>
					<text class="announcement-title">{{ announcement.title }}</text>
				</view>

				<view class="meta-info">
					<text class="publisher">发布者: {{ announcement.publisherName }}</text>
					<text class="publish-date">{{ formatDate(announcement.publishDate) }}</text>
					<text class="view-count">浏览: {{ announcement.viewCount || 0 }}</text>
				</view>
			</view>

			<view class="announcement-content">
				<!-- 渲染后的Markdown内容 -->
				<view class="markdown-content" v-html="renderedContent"></view>
			</view>

			<!-- 图片展示 -->
			<view v-if="announcement.images && announcement.images.length > 0" class="image-section">
				<view class="image-title">相关图片</view>
				<view class="image-grid">
					<view v-for="(image, index) in announcement.images" :key="index" class="image-item" @click="previewImage(image.url)">
						<image :src="image.url" mode="aspectFill" class="thumbnail"></image>
						<view class="image-overlay">
							<uni-icons type="search" size="20" color="white"></uni-icons>
						</view>
					</view>
				</view>
			</view>
		</view>

		<!-- 预览图片弹窗 -->
		<uni-popup ref="imagePreviewPopup" type="center">
			<view class="image-preview-modal">
				<view class="modal-header">
					<text class="modal-title">图片预览</text>
					<uni-icons type="closeempty" size="20" color="#666" @click="closeImagePreview"></uni-icons>
				</view>
				<view v-if="previewImageUrl" class="modal-content">
					<image :src="previewImageUrl" mode="aspectFit" class="preview-full-image"></image>
				</view>
			</view>
		</uni-popup>

		<!-- 加载状态 -->
		<view v-if="loading" class="loading-state">
			<uni-load-more :status="'loading'" :content-size="14"></uni-load-more>
		</view>

		<!-- 错误状态 -->
		<view v-if="error" class="error-state">
			<uni-icons type="error" size="48" color="#EF4444"></uni-icons>
			<text class="error-text">{{ error }}</text>
			<button class="retry-button" @click="loadAnnouncement">重试</button>
		</view>
	</view>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import dayjs from 'dayjs'

// 页面参数
const announcementId = ref('')
const isPreview = ref(false)

// 公告数据
const announcement = reactive({
	title: '',
	content: '',
	publisher: '',
	publisherName: '',
	publishDate: 0,
	modifyDate: 0,
	status: 0,
	isTop: false,
	images: [],
	viewCount: 0
})

// 状态
const loading = ref(false)
const error = ref('')
const renderedContent = ref('')
const previewImageUrl = ref('')
const imagePreviewPopup = ref(null)

// 获取云函数实例
const announcementCloud = uniCloud.importObject('announcement')

// 简单的Markdown渲染函数
function renderMarkdown(content) {
	// 如果内容为空或未定义，返回空字符串
	if (!content) {
		return ''
	}

	let html = content

	// 转义HTML标签
	html = html.replace(/&/g, '&amp;')
	html = html.replace(/</g, '&lt;')
	html = html.replace(/>/g, '&gt;')

	// 标题
	html = html.replace(/^# (.*$)/gm, '<h1 style="font-size: 24px; font-weight: bold; margin: 16px 0 8px 0;">$1</h1>')
	html = html.replace(/^## (.*$)/gm, '<h2 style="font-size: 20px; font-weight: bold; margin: 14px 0 8px 0;">$1</h2>')
	html = html.replace(/^### (.*$)/gm, '<h3 style="font-size: 18px; font-weight: bold; margin: 12px 0 8px 0;">$1</h3>')
	html = html.replace(/^#### (.*$)/gm, '<h4 style="font-size: 16px; font-weight: bold; margin: 10px 0 8px 0;">$1</h4>')

	// 粗体和斜体
	html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
	html = html.replace(/\*(.*?)\*/g, '<em>$1</em>')

	// 行内代码
	html = html.replace(/`(.*?)`/g, '<code style="background: #f1f5f9; padding: 2px 4px; border-radius: 4px; font-family: monospace;">$1</code>')

	// 代码块
	html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre style="background: #f8fafc; padding: 16px; border-radius: 8px; overflow-x: auto; margin: 8px 0;"><code style="font-family: monospace;">$2</code></pre>')
	html = html.replace(/```([\s\S]*?)```/g, '<pre style="background: #f8fafc; padding: 16px; border-radius: 8px; overflow-x: auto; margin: 8px 0;"><code style="font-family: monospace;">$1</code></pre>')

	// 链接
	html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" style="color: #3b82f6; text-decoration: underline;">$1</a>')

	// 无序列表
	html = html.replace(/^- (.*$)/gm, '<li style="margin: 4px 0;">$1</li>')
	html = html.replace(/(<li>.*<\/li>)/s, '<ul style="margin: 8px 0; padding-left: 24px;">$1</ul>')

	// 有序列表
	html = html.replace(/^\d+\. (.*$)/gm, '<li style="margin: 4px 0;">$1</li>')

	// 分隔符
	html = html.replace(/^---$/gm, '<hr style="margin: 16px 0; border: none; border-top: 1px solid #e5e7eb;">')

	// 换行
	html = html.replace(/\n\n/g, '</p><p style="line-height: 1.6; margin: 8px 0;">')
	html = html.replace(/\n/g, '<br>')

	// 包装段落
	html = '<p style="line-height: 1.6; margin: 8px 0;">' + html + '</p>'

	return html
}

// 加载公告数据
async function loadAnnouncement() {
	try {
		loading.value = true
		error.value = ''

		let data
		if (isPreview.value) {
			// 从本地存储获取预览数据
			const previewData = uni.getStorageSync('announcement_preview')
			if (previewData) {
				data = JSON.parse(previewData)
				uni.removeStorageSync('announcement_preview')
			} else {
				error.value = '预览数据已失效'
				return
			}
		} else {
			// 从云函数获取公告详情
			const result = await announcementCloud.getAnnouncementDetail(announcementId.value, true)

			if (result.code !== 0) {
				error.value = result.errMsg || '获取公告失败'
				return
			}

			data = result.data
		}

		// 调试信息
		console.log('获取到的公告数据:', data)
		console.log('公告内容:', data?.content)

		// 处理数据格式 - 如果data是数组，取第一个元素
		let announcementData = data
		if (Array.isArray(data)) {
			announcementData = data[0]
		}

		// 填充数据
		Object.assign(announcement, announcementData)

		// 渲染Markdown内容
		renderedContent.value = renderMarkdown(announcementData?.content || '')
		console.log('渲染后的内容:', renderedContent.value)

	} catch (err) {
		console.error('加载公告失败:', err)
		error.value = '加载公告失败'
	} finally {
		loading.value = false
	}
}

// 格式化日期
function formatDate(timestamp) {
	return dayjs(timestamp).format('YYYY-MM-DD HH:mm')
}

// 预览图片
function previewImage(url) {
	previewImageUrl.value = url
	imagePreviewPopup.value.open()
}

// 关闭图片预览
function closeImagePreview() {
	imagePreviewPopup.value.close()
}

// 页面加载
onMounted(() => {
	const pages = getCurrentPages()
	const currentPage = pages[pages.length - 1]
	const options = currentPage.options

	console.log('页面参数:', options)

	if (options.id) {
		announcementId.value = options.id
		console.log('设置公告ID:', options.id)
	} else if (options.preview === 'true') {
		isPreview.value = true
		console.log('进入预览模式')
	} else {
		console.error('缺少必要的页面参数')
		error.value = '缺少公告ID'
		return
	}

	loadAnnouncement()
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
	padding: 32rpx;
	margin-bottom: 20rpx;
}

.announcement-header {
	margin-bottom: 32rpx;
	padding-bottom: 24rpx;
	border-bottom: 1rpx solid rgba(0, 0, 0, 0.1);
}

.title-container {
	display: flex;
	align-items: center;
	gap: 12rpx;
	margin-bottom: 16rpx;
}

.top-badge {
	background: #F59E0B;
	color: white;
	font-size: 20rpx;
	padding: 4rpx 12rpx;
	border-radius: 12rpx;
	font-weight: 500;
}

.announcement-title {
	font-size: 40rpx;
	font-weight: bold;
	color: #333;
	line-height: 1.3;
}

.meta-info {
	display: flex;
	flex-wrap: wrap;
	gap: 16rpx;
}

.publisher,
.publish-date,
.view-count {
	font-size: 26rpx;
	color: #666;
	background: #f9fafb;
	padding: 8rpx 16rpx;
	border-radius: 12rpx;
}

.announcement-content {
	margin-bottom: 32rpx;
}

.markdown-content {
	font-size: 30rpx;
	color: #333;
	line-height: 1.6;
}

.image-section {
	margin-top: 32rpx;
}

.image-title {
	font-size: 32rpx;
	font-weight: 600;
	color: #333;
	margin-bottom: 20rpx;
}

.image-grid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(200rpx, 1fr));
	gap: 16rpx;
}

.image-item {
	position: relative;
	width: 200rpx;
	height: 200rpx;
	border-radius: 12rpx;
	overflow: hidden;
	cursor: pointer;
	transition: transform 0.2s;
}

.image-item:active {
	transform: scale(0.95);
}

.thumbnail {
	width: 100%;
	height: 100%;
	object-fit: cover;
}

.image-overlay {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.3);
	display: flex;
	align-items: center;
	justify-content: center;
	opacity: 0;
	transition: opacity 0.2s;
}

.image-item:hover .image-overlay {
	opacity: 1;
}

.loading-state {
	display: flex;
	justify-content: center;
	padding: 80rpx 0;
}

.error-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 80rpx 0;
	color: #EF4444;
}

.error-text {
	margin: 20rpx 0;
	font-size: 28rpx;
}

.retry-button {
	background: #EF4444;
	color: white;
	border: none;
	border-radius: 12rpx;
	padding: 16rpx 32rpx;
	font-size: 28rpx;
	margin-top: 20rpx;
}

.image-preview-modal {
	background: #fff;
	border-radius: 16rpx;
	padding: 20rpx;
	max-width: 90vw;
	max-height: 90vh;
	overflow: hidden;
}

.modal-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 20rpx;
	padding-bottom: 16rpx;
	border-bottom: 1rpx solid #eee;
}

.modal-title {
	font-size: 32rpx;
	font-weight: 600;
	color: #333;
}

.modal-content {
	display: flex;
	justify-content: center;
	align-items: center;
}

.preview-full-image {
	max-width: 80vw;
	max-height: 70vh;
	border-radius: 8rpx;
}
</style>