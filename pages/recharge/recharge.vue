<template>
	<view style="display: flex; flex-direction: column; padding: 20rpx;">
		<view>
			<view class="user-info-card glass-card">
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
		</view>
		<view class="segmented-control-container">
			<uni-segmented-control :values="segmentedValues" :current="segmentedCurrent" style-type="button"
				active-color="#f9cb14" @clickItem="onSegmentChange"></uni-segmented-control>
		</view>
		<view v-if="rechargeItems == 0">
			<view>
				<view class="recharge-info-header">
					<uni-icons type="cart-filled" size="20" color="#FFD700"></uni-icons>
					<text class="recharge-info-title">选择会员充值时间!</text>
				</view>
			</view>
		</view>
		<view v-else>
			<view>
				<view class="recharge-info-header">
					<uni-icons type="cart-filled" size="20" color="#FFD700"></uni-icons>
					<text class="recharge-info-title">选择周卡/月卡充值时间!</text>
				</view>
			</view>
		</view>
		<view class="footer">
			<view class="price-summary">
				<text>当前价格</text>
				<text class="price-amount">¥</text>
			</view>
			<view class="submit-button" @click="">
				<text>确认购买</text>
			</view>
		</view>
	</view>
</template>

<script lang="ts" setup>
	import { reactive, ref, computed, onMounted } from 'vue'
	// 引入 uni-id-pages 的 store
	import { store } from '@/uni_modules/uni-id-pages/common/store.js'
	const todo = uniCloud.importObject('todo')
	const res = uniCloud.getCurrentUserInfo('uni_id_token')
	// 使用计算属性获取用户信息
	const userInfo = computed(() => store.userInfo)
	const segmentedValues = ['音游会员', '周卡/月卡'];
	const segmentedCurrent = ref(0);
	const rechargeItems = ref(0);
	function onSegmentChange(e) {
		if (rechargeItems.value !== e.currentIndex) {
			rechargeItems.value = e.currentIndex
		}
	}
</script>
<style scoped>
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
	}

	.user-id {
		font-size: 24rpx;
		color: #6b7280;
		background: rgba(243, 244, 246, 0.7);
		padding: 4px 10px;
		border-radius: 12px;
		align-self: flex-start;
	}

	.segmented-control-container {
		width: 100%;
		margin-bottom: 12px;
	}

	.recharge-info-header {
		display: flex;
		align-items: center;
		margin-bottom: 12px;
		padding-bottom: 8px;
		border-bottom: 1px solid rgba(0, 0, 0, 0.08);
	}
	.recharge-info-title {
		font-size: 16px;
		font-weight: 600;
		color: #333333;
		margin-left: 8px;
	}
	
</style>