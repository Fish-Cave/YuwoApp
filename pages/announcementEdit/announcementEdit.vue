<template>
	<view class="container">
		<!-- 页面标题 -->
		<view class="header-card glass-card">
			<view class="header-title">{{ isEdit ? '编辑公告' : '发布公告' }}</view>
			<view class="header-actions">
				<button class="preview-button" @click="previewAnnouncement" :disabled="!canPreview">
					<uni-icons type="eye" size="16" color="#ffffff"></uni-icons>
					<text>预览</text>
				</button>
			</view>
		</view>

		<!-- 编辑表单 -->
		<view class="form-card glass-card">
			<view class="form-group">
				<view class="form-label">公告标题 *</view>
				<uni-easyinput v-model="formData.title" placeholder="请输入公告标题" maxlength="100"></uni-easyinput>
				<view class="form-tip">{{ formData.title.length }}/100 字</view>
			</view>

			<view class="form-group">
				<view class="form-label">公告内容 (Markdown) *</view>
				<uni-easyinput
					v-model="formData.content"
					type="textarea"
					placeholder="支持 Markdown 格式，如 **粗体**、*斜体*、# 标题等"
					maxlength="10000"
				></uni-easyinput>
				<view class="form-tip">{{ formData.content.length }}/10000 字</view>
			</view>

			<view class="form-group">
				<view class="form-label">公告图片</view>
				<view class="image-upload-container">
					<!-- 已上传图片预览 -->
					<view v-if="formData.images.length > 0" class="image-preview-list">
						<view v-for="(image, index) in formData.images" :key="index" class="image-preview-item">
							<image :src="image.url" mode="aspectFill" class="preview-image"></image>
							<view class="image-remove" @click="removeImage(index)">
								<uni-icons type="clear" size="16" color="#ffffff"></uni-icons>
							</view>
						</view>
					</view>

					<!-- 上传按钮 -->
					<button
						v-if="formData.images.length < 9"
						class="upload-button"
						@click="chooseImage"
						:disabled="uploading"
					>
						<uni-icons type="plusempty" size="20" color="#999"></uni-icons>
						<text>{{ uploading ? '上传中...' : '添加图片' }}</text>
					</button>

					<view class="image-tip">最多可上传 9 张图片，支持 JPG、PNG、GIF 格式，单张不超过 5MB</view>
				</view>
			</view>

			<view class="form-group">
				<view class="checkbox-container">
					<checkbox
						:checked="formData.isTop"
						@change="onIsTopChange"
						color="#3B82F6"
					/>
					<text class="checkbox-label">置顶此公告 (置顶公告只能有一个)</text>
				</view>
			</view>

			<view class="form-group">
				<view class="checkbox-container">
					<checkbox
						:checked="formData.status === 1"
						@change="onStatusChange"
						color="#10B981"
					/>
					<text class="checkbox-label">立即发布 (不勾选则为草稿)</text>
				</view>
			</view>
		</view>

		<!-- 底部按钮 -->
		<view class="footer-actions">
			<button class="cancel-button" @click="goBack">取消</button>
			<button
				class="save-button"
				@click="saveAnnouncement"
				:disabled="!canSave || saving"
			>
				{{ saving ? '保存中...' : (formData.status === 1 ? '发布' : '保存草稿') }}
			</button>
		</view>
	</view>

	<!-- 图片预览弹窗 -->
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
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'

// 页面参数
const announcementId = ref('')
const isEdit = computed(() => announcementId.value !== '')

// 表单数据
const formData = reactive({
	title: '',
	content: '',
	status: 1, // 默认为发布状态，1-发布，0-草稿
	isTop: false,
	images: []
})

// 状态
const uploading = ref(false)
const saving = ref(false)
const previewImageUrl = ref('')
const imagePreviewPopup = ref(null)

// 计算属性
const canPreview = computed(() => {
	return formData.title.trim() && formData.content.trim()
})

const canSave = computed(() => {
	return formData.title.trim() && formData.content.trim()
})

// 获取云函数实例
const announcement = uniCloud.importObject('announcement')

// 页面加载
onMounted(() => {
	const pages = getCurrentPages()
	const currentPage = pages[pages.length - 1]
	const options = currentPage.options

	if (options.id) {
		announcementId.value = options.id
		loadAnnouncementData()
	}
})

// 加载公告数据（编辑模式）
async function loadAnnouncementData() {
	try {
		uni.showLoading({
			title: '加载中...'
		})

		const result = await announcement.getAnnouncementDetail(announcementId.value, false)

		if (result.code === 0) {
			const data = result.data
			Object.assign(formData, {
				title: data.title,
				content: data.content,
				status: data.status,
				isTop: data.isTop,
				images: data.images || []
			})
		} else {
			uni.showToast({
				title: result.errMsg || '加载失败',
				icon: 'none'
			})
			setTimeout(() => {
				uni.navigateBack()
			}, 1500)
		}
	} catch (error) {
		console.error('加载公告数据失败:', error)
		uni.showToast({
			title: '加载失败',
			icon: 'none'
		})
	} finally {
		uni.hideLoading()
	}
}

// 选择图片
async function chooseImage() {
	try {
		uni.chooseImage({
			count: 9 - formData.images.length,
			sizeType: ['original', 'compressed'],
			sourceType: ['album', 'camera'],
			success: async (res) => {
				for (const tempFilePath of res.tempFilePaths) {
					await uploadImage(tempFilePath)
				}
			}
		})
	} catch (error) {
		console.error('选择图片失败:', error)
	}
}

// 上传图片
async function uploadImage(filePath) {
	try {
		uploading.value = true

		// 读取文件信息
		const fileInfo = await getFileInfo(filePath)

		const uploadData = {
			fileName: filePath.split('/').pop() || 'image.jpg',
			fileType: fileInfo.type || 'image/jpeg',
			fileSize: fileInfo.size,
			fileContent: await readFileAsBase64(filePath)
		}

		const result = await announcement.uploadAnnouncementImage(uploadData)

		if (result.code === 0) {
			formData.images.push(result.data)
			uni.showToast({
				title: '上传成功',
				icon: 'success'
			})
		} else {
			uni.showToast({
				title: result.errMsg || '上传失败',
				icon: 'none'
			})
		}
	} catch (error) {
		console.error('上传图片失败:', error)
		uni.showToast({
			title: '上传失败',
			icon: 'none'
		})
	} finally {
		uploading.value = false
	}
}

// 获取文件信息
function getFileInfo(filePath) {
	return new Promise((resolve) => {
		uni.getFileInfo({
			filePath: filePath,
			success: (res) => resolve(res),
			fail: () => resolve({ size: 0 })
		})
	})
}

// 读取文件为 Base64
function readFileAsBase64(filePath) {
	return new Promise((resolve, reject) => {
		uni.getFileSystemManager().readFile({
			filePath: filePath,
			encoding: 'base64',
			success: (res) => resolve(res.data),
			fail: reject
		})
	})
}

// 移除图片
function removeImage(index) {
	formData.images.splice(index, 1)
}

// 置顶状态变更
function onIsTopChange(e) {
	formData.isTop = e.detail.checked
}

// 发布状态变更
function onStatusChange(e) {
	formData.status = e.detail.checked ? 1 : 0
	console.log('发布状态变更:', e.detail.checked, '新状态:', formData.status)
}

// 保存公告
async function saveAnnouncement() {
	if (!canSave.value || saving.value) return

	try {
		saving.value = true
		uni.showLoading({
			title: isEdit.value ? '更新中...' : '创建中...',
			mask: true
		})

		const data = {
			title: formData.title.trim(),
			content: formData.content.trim(),
			status: formData.status,
			isTop: formData.isTop,
			images: formData.images
		}

		console.log('保存公告数据:', data)

		let result
		if (isEdit.value) {
			result = await announcement.updateAnnouncement(announcementId.value, data)
		} else {
			result = await announcement.createAnnouncement(data)
		}

		if (result.code === 0) {
			uni.showToast({
				title: isEdit.value ? '更新成功' : '创建成功',
				icon: 'success'
			})
			setTimeout(() => {
				uni.navigateBack()
			}, 1500)
		} else {
			uni.showToast({
				title: result.errMsg || '保存失败',
				icon: 'none'
			})
		}
	} catch (error) {
		console.error('保存公告失败:', error)
		uni.showToast({
			title: '保存失败',
			icon: 'none'
		})
	} finally {
		saving.value = false
		uni.hideLoading()
	}
}

// 预览公告
function previewAnnouncement() {
	if (!canPreview.value) return

	const previewData = {
		title: formData.title,
		content: formData.content,
		publisherName: '预览',
		publishDate: Date.now(),
		status: formData.status,
		isTop: formData.isTop,
		images: formData.images,
		viewCount: 0
	}

	// 将预览数据存储到本地
	uni.setStorageSync('announcement_preview', JSON.stringify(previewData))

	// 跳转到详情页进行预览
	uni.navigateTo({
		url: '/pages/announcementDetail/announcementDetail?preview=true'
	})
}

// 返回
function goBack() {
	uni.navigateBack()
}

// 关闭图片预览
function closeImagePreview() {
	imagePreviewPopup.value.close()
}
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
	display: flex;
	justify-content: space-between;
	align-items: center;
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

.preview-button {
	display: flex;
	align-items: center;
	gap: 8rpx;
	background: #6B7280;
	color: white;
	border: none;
	border-radius: 12rpx;
	padding: 16rpx 24rpx;
	font-size: 28rpx;
	transition: all 0.2s;
}

.preview-button:not(:disabled):active {
	transform: scale(0.95);
}

.preview-button:disabled {
	opacity: 0.6;
	cursor: not-allowed;
}

.form-group {
	margin-bottom: 32rpx;
}

.form-label {
	font-size: 28rpx;
	font-weight: 600;
	color: #333;
	margin-bottom: 12rpx;
}

.form-tip {
	font-size: 24rpx;
	color: #9CA3AF;
	margin-top: 8rpx;
	text-align: right;
}

.image-upload-container {
	border: 2rpx dashed #D1D5DB;
	border-radius: 16rpx;
	padding: 24rpx;
	background: #F9FAFB;
}

.image-preview-list {
	display: flex;
	flex-wrap: wrap;
	gap: 16rpx;
	margin-bottom: 20rpx;
}

.image-preview-item {
	position: relative;
	width: 120rpx;
	height: 120rpx;
	border-radius: 12rpx;
	overflow: hidden;
}

.preview-image {
	width: 100%;
	height: 100%;
}

.image-remove {
	position: absolute;
	top: 4rpx;
	right: 4rpx;
	width: 32rpx;
	height: 32rpx;
	background: rgba(0, 0, 0, 0.6);
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
}

.upload-button {
	width: 100%;
	height: 120rpx;
	border: 2rpx dashed #3B82F6;
	background: rgba(59, 130, 246, 0.05);
	border-radius: 12rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 8rpx;
	color: #3B82F6;
	transition: all 0.2s;
}

.upload-button:active {
	transform: scale(0.98);
}

.upload-button:disabled {
	opacity: 0.6;
	cursor: not-allowed;
}

.image-tip {
	font-size: 24rpx;
	color: #6B7280;
	margin-top: 12rpx;
	text-align: center;
}

.checkbox-container {
	display: flex;
	align-items: center;
	gap: 12rpx;
}

.checkbox-label {
	font-size: 28rpx;
	color: #333;
}

.footer-actions {
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	display: flex;
	gap: 16rpx;
	padding: 20rpx;
	background: rgba(255, 255, 255, 0.95);
	backdrop-filter: blur(10px);
	border-top: 1rpx solid rgba(0, 0, 0, 0.1);
}

.cancel-button,
.save-button {
	flex: 1;
	height: 80rpx;
	border: none;
	border-radius: 12rpx;
	font-size: 28rpx;
	font-weight: 500;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: all 0.2s;
}

.cancel-button {
	background: #F3F4F6;
	color: #6B7280;
}

.save-button {
	background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
	color: white;
}

.cancel-button:active,
.save-button:active {
	transform: scale(0.98);
}

.save-button:disabled {
	opacity: 0.6;
	cursor: not-allowed;
}

/* 图片预览弹窗 */
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

@media (prefers-color-scheme: dark) {
	.container {
		background: rgb(0, 0, 0);
	}

	.glass-card {
		background: rgb(22, 22, 24);
		border: 1px solid rgba(255, 255, 255, 0.18);
	}

	.header-title,
	.form-label,
	.checkbox-label {
		color: white;
	}

	.upload-button {
		background: rgba(59, 130, 246, 0.1);
		border-color: #3B82F6;
	}

	.form-tip,
	.image-tip {
		color: #9CA3AF;
	}

	.footer-actions {
		background: rgb(22, 22, 24);
		border-top-color: rgba(255, 255, 255, 0.1);
	}

	.cancel-button {
		background: rgb(59, 59, 61);
		color: #9CA3AF;
	}

	.image-preview-modal {
		background: #333;
	}

	.modal-title {
		color: white;
	}

	.modal-header {
		border-bottom-color: #555;
	}
}
</style>