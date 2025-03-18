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
			<button @click="goToConfig()">配置</button>
		</view>
	</view>

</template>

<script lang="ts" setup>
	import { ref, onMounted, computed } from 'vue';
	import dayjs from 'dayjs';
	import usage from './usage'
	var now = dayjs()
	console.log(JSON.stringify(now))
	const shopName = ref("鱼窝一号店");
	const nowDate = ref("2024-08-21 星期三");
	const allTimeSlots = ref([
		{
			startTime: '2408210900',
			endTime: '2408211200',
			color: '#FF8D1A',
			machine: 'IIDX',
			machineName: 'IIDX-机台1',
			userId: '1'
		},
		{
			startTime: '2408211000',
			endTime: '2408211500',
			color: '#FF8D1A',
			machine: 'IIDX',
			machineName: 'IIDX-机台1',
			userId: '2'
		},
		{
			startTime: '2408211700',
			endTime: '2408212000',
			color: '#FF8D1A',
			machine: 'IIDX',
			machineName: 'IIDX-机台1',
			userId: '7'
		},
		{
			startTime: '2408210000',
			endTime: '2408210200',
			color: '#FF8D1A',
			machine: 'IIDX',
			machineName: 'IIDX-机台1',
			userId: '8'
		},

		{
			startTime: '2408210700',
			endTime: '2408211200',
			color: '#FF8D1A',
			machine: 'SDVX',
			machineName: 'SDVX-机台1',
			userId: '3'
		},
		{
			startTime: '2408210900',
			endTime: '2408211800',
			color: '#FF8D1A',
			machine: 'SDVX',
			machineName: 'SDVX-机台2',
			userId: '4'
		},
		{
			startTime: '2408211200',
			endTime: '2408211600',
			color: '#FF8D1A',
			machine: 'DDR',
			machineName: 'DDR-机台1',
			userId: '5'
		}
	]);
	function calendarChange(e : object) {
		console.log(e);
		let date = e
		console.log(date.fulldate)
	}
	function goToConfig(){
		console.log('test')
		uni.navigateTo({
			url: "/pages/config/config"
		})
	}
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