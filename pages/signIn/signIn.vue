<template>
	<view class="container">
		<!-- 个人信息卡片 -->
		<view v-if="res.uid==null" class="launch-button glass-button" @click="goToLaunch()">
			<text>登录</text>
		</view>
		<view v-else class="user-info-card glass-card">
			<view class="user-info-header">
				<view class="avatar-container">
					<!-- 使用 uni-id-pages-avatar 组件显示头像 -->
					<uni-id-pages-avatar width="160rpx" height="160rpx"></uni-id-pages-avatar>
				</view>
				<view class="user-details">
					<text class="nickname">{{ userInfo.nickname || '未设置昵称' }}</text>
					<text class="user-id">UID: {{ userInfo._id }}</text>
				</view>
			</view>
		</view>

		<!-- 功能按钮卡片 -->
		<view class="function-card glass-card">
			<view class="function-buttons">
				<view class="function-button" @click="goToreservationList()">
					<view class="icon-container">
						<uni-icons type="calendar" size="30" color="#ffffff"></uni-icons>
					</view>
					<text class="function-text">预约中</text>
				</view>

				<view class="vertical-divider"></view>

				<view class="function-button" @click="goToUsing()">
					<view class="icon-container">
						<uni-icons type="paperplane" size="30" color="#ffffff"></uni-icons>
					</view>
					<text class="function-text">使用中</text>
				</view>
			</view>
		</view>

		<!-- 使用说明卡片 -->
		<view class="instructions-card glass-card">
			<view class="card-title">
				<text>使用说明</text>
			</view>

			<view class="instructions-list">
				<view class="instruction-item" v-for="(text, value) in textData" :key="value">
					<view class="instruction-number">
						<text>{{value + 1}}</text>
					</view>
					<text class="instruction-text">{{text}}</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup lang="ts">
	import { reactive, ref, computed, onMounted } from 'vue'
	// 引入 uni-id-pages 的 store
	import { store } from '@/uni_modules/uni-id-pages/common/store.js'
	const todo = uniCloud.importObject('todo')
	const res = uniCloud.getCurrentUserInfo('uni_id_token')

	const textData = [
		"请在预约时间前15分钟内完成签到",
		"超时未签到将自动取消预约",
		"游玩结束后请关闭机台",
	]

	// 使用计算属性获取用户信息
	const userInfo = computed(() => store.userInfo)

	function goToreservationList() {
		uni.navigateTo({
			url: '/pages/reservationList/reservationList'
		});
	}

	async function goToUsing() {
		console.log(res.uid)
		try {
			const result = await todo.SignIn_Search(res.uid)
			if (result.data.length == 1) {
				console.log(result.data[0])
				uni.navigateTo({
					url: "/pages/using/using"
				})
			} else {
				uni.showToast({
					title: "未找到签到信息",
					icon: "error"
				})
			}
		} catch { }
	}

	function goToLaunch() {
		uni.redirectTo({
			url: "/uni_modules/uni-id-pages/pages/login/login-withpwd", // 确保路径正确
		});
	}
</script>

<style scoped>
	/* 全局样式 */
	.container {
		padding: 20px;
		background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
		min-height: 100vh;
		position: relative;
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
		transition: transform 0.3s ease, box-shadow 0.3s ease;
	}

	.glass-card:active {
		transform: translateY(2px);
		box-shadow: 0 4px 16px rgba(31, 38, 135, 0.08);
	}

	/* 用户信息卡片 */
	.user-info-card {
		margin-bottom: 24px;
	}

	.user-info-header {
		display: flex;
		align-items: center;
		padding: 8px;
	}

	.avatar-container {
		width: 160rpx;
		height: 160rpx;
		border-radius: 50%;
		overflow: hidden;
		border: 2px solid #fff;
		box-shadow: 0 4px 12px rgba(255, 193, 7, 0.3);
		margin-right: 16px;
	}

	.user-details {
		display: flex;
		flex-direction: column;
		flex: 1;
	}

	.nickname {
		font-size: 36rpx;
		font-weight: bold;
		margin-bottom: 8px;
		color: #333;
		/* 允许长单词/URL换行 */
		overflow-wrap: break-word;
		/* 中文/日文等任意字符处换行 */
		word-break: break-all;
		/* 保留空白符但允许换行 */
		white-space: pre-line;
		/* 触发换行的容器宽度 */
		max-width: 400rpx;
	}

	.user-id {
		font-size: 24rpx;
		color: #6b7280;
		background: rgba(243, 244, 246, 0.7);
		padding: 4px 10px;
		border-radius: 12px;
		align-self: flex-start;
	}

	/* 功能按钮卡片 */
	.function-card {
		margin-bottom: 24px;
	}

	.function-buttons {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 8px;
	}

	.function-button {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 16px 0;
		transition: transform 0.2s ease;
	}

	.function-button:active {
		transform: scale(0.95);
	}

	.icon-container {
		display: flex;
		justify-content: center;
		align-items: center;
		background: linear-gradient(135deg, #FFC107 0%, #FF9800 100%);
		width: 60px;
		height: 60px;
		border-radius: 16px;
		margin-bottom: 12px;
		box-shadow: 0 4px 12px rgba(255, 193, 7, 0.4);
	}

	.function-text {
		font-size: 28rpx;
		font-weight: 600;
		color: #333;
	}

	.vertical-divider {
		width: 1px;
		height: 80px;
		background: rgba(107, 114, 128, 0.2);
	}

	/* 使用说明卡片 */
	.instructions-card {
		margin-bottom: 24px;
	}

	.card-title {
		font-size: 18px;
		font-weight: bold;
		color: #333;
		padding: 8px 4px 16px 4px;
		border-bottom: 1px solid rgba(107, 114, 128, 0.1);
		margin-bottom: 16px;
	}

	.instructions-list {
		padding: 0 4px;
	}

	.instruction-item {
		display: flex;
		align-items: center;
		margin-bottom: 16px;
	}

	.instruction-number {
		display: flex;
		justify-content: center;
		align-items: center;
		width: 24px;
		height: 24px;
		border-radius: 50%;
		background: rgba(255, 193, 7, 0.1);
		color: #FF9800;
		font-size: 14px;
		font-weight: 600;
		margin-right: 12px;
	}

	.instruction-text {
		font-size: 28rpx;
		color: #4b5563;
		line-height: 1.5;
	}

	/*登陆按钮*/
	.launch-button {
		background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
		color: white;
		border: none;
		border-radius: 24px;
		padding: 12px 24px;
		font-size: 40rpx;
		font-weight: 600;
		margin-top: 20px;
		margin-bottom: 20px;
		height: 80rpx;
		box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
		transition: transform 0.2s ease, box-shadow 0.2s ease;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	/* 媒体查询：针对不同尺寸设备的响应式样式 */
	/* 小屏幕设备 */
	@media screen and (max-width: 375px) {
		.container {
			padding: 16px;
		}

		.nickname {
			font-size: 32rpx;
		}

		.user-id {
			font-size: 22rpx;
		}

		.icon-container {
			width: 50px;
			height: 50px;
		}

		.function-text {
			font-size: 26rpx;
		}

		.instruction-number {
			width: 22px;
			height: 22px;
		}

		.instruction-text {
			font-size: 26rpx;
		}
	}

	/* 大屏幕设备 */
	@media screen and (min-width: 768px) {
		.container {
			padding: 24px;
		}

		.glass-card {
			padding: 20px;
			border-radius: 24px;
		}

		.nickname {
			font-size: 40rpx;
		}

		.user-id {
			font-size: 26rpx;
		}

		.icon-container {
			width: 70px;
			height: 70px;
			border-radius: 20px;
		}

		.function-text {
			font-size: 30rpx;
		}

		.card-title {
			font-size: 20px;
		}

		.instruction-number {
			width: 28px;
			height: 28px;
		}

		.instruction-text {
			font-size: 30rpx;
		}
	}
</style>