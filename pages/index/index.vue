<template>
	<view>
		<view>
			<wu-calendar type="week" 
			@change="calendarChange" 
			slideSwitchMode="none" 
			:fold="false" 
			startWeek="mon"
			color="#f9cb14" 
			startDate="2025-01-01" />
		</view>
		<view>
			<usage></usage>
			<button v-if="isAdmin" @click="goToConfig()" >配置</button>
		</view>
	</view>
	<text>{{userProfile}}</text>>
</template>

<script lang="ts" setup>
	import { ref, onMounted, computed, reactive } from 'vue';
	import dayjs from 'dayjs';
	import usage from './usage';
	import { useProfileStroe } from '../../stores/userProfileStore';
	const userProfile = useProfileStroe()
	const res = uniCloud.getCurrentUserInfo('uni_id_token')
	const isAdmin = res.role.includes("admin")
	function goToConfig(){
		console.log('test')
		uni.navigateTo({
			url: "/pages/config/config"
		})
	}
	
	uni.$on("uni-id-pages-login-success",function(){
		const res = uniCloud.getCurrentUserInfo('uni_id_token')
		userProfile._id = res.uid
		userProfile.role = res.role
		userProfile.permission = res.permission
	})
</script>

<style lang="scss">
	.container {
		background-color: #f5f5f5;
		min-height: 100vh;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
	}

	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 20rpx 30rpx;
	}

	.nav-item {
		display: flex;
		align-items: center;
		gap: 10rpx;
	}

	.nav-text {
		font-size: 28rpx;
		color: #333;
	}

	.date-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 10rpx;
	}

	.location {
		font-size: 28rpx;
		color: #333;
	}

	.shop-name {
		color: #FF8D1A;
	}

	.date-pill {
		background-color: #FFD700;
		padding: 8rpx 40rpx;
		border-radius: 30rpx;
		margin-top: 10rpx;
		margin-bottom: 10rpx;
	}

	.calendar-btn {
		display: flex;
		align-items: center;
		gap: 10rpx;
		font-size: 26rpx;
		color: #666;
	}

	.divider {
		height: 2rpx;
		background-color: #e5e5e5;
		margin: 0 30rpx;
	}

	.tip-container {
		padding: 20rpx 30rpx;
	}

	.tips {
		font-size: 24rpx;
		color: #999;
	}

	.machine-section {
		margin-bottom: 40rpx;
		margin-left: 30rpx;
		margin-right: 30rpx;
	}
</style>