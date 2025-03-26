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
	
	/* 底部区域 */
	.footer {
	    position: fixed;
	    bottom: 0;
	    left: 0;
	    width: 100%;
	    background: rgba(255, 255, 255, 0.8);
	    backdrop-filter: blur(10px);
	    padding: 10px 0;
	    border-top: 1px solid rgba(229, 231, 235, 0.8);
	    box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.05);
	    z-index: 100;
	}
	
	.price-summary {
	    display: flex;
	    justify-content: space-between;
	    align-items: center;
	    padding: 0 20px;
	    margin-bottom: 12px;
	}
	
	.price-amount {
	    font-weight: bold;
	    font-size: 20px;
	    background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
	    -webkit-background-clip: text;
	    -webkit-text-fill-color: transparent;
	}
	
	.submit-button {
	    background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
	    border-radius: 8px;
	    width: 80%;
	    height: 50px !important; 
	    min-height: 45px; 
	    line-height: 45px; 
	    display: flex;
	    justify-content: center;
	    align-items: center;
	    margin: 0 auto;
	    font-weight: bold;
	    color: white;
	    font-size: 15px;
	    box-shadow: 0 4px 12px rgba(249, 203, 20, 0.3);
	    transition: all 0.3s;
	    position: relative;
	    overflow: hidden;
	    box-sizing: border-box;
	    padding: 0;
	}
	
	.submit-button:active {
	    transform: scale(0.98);
	    box-shadow: 0 2px 6px rgba(249, 203, 20, 0.3);
	}
	
	.submit-button::after {
	    content: "";
	    position: absolute;
	    top: 0;
	    left: -100%;
	    width: 100%;
	    height: 100%;
	    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
	    transition: 0.5s;
	}
	
	.submit-button:active::after {
	    left: 100%;
	}
</style>