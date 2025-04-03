<template>
	<view>
		<view>
			<wu-calendar class="calendar" type="week" @change="calendarChange" slideSwitchMode="none" :fold="false" startWeek="mon"
				color="#f59e0b" :startDate="todayDate" />
		</view>

		<view class="container">
			<view class="tips-container">
				<text class="tips">
					登录后如果为会员将会自动显示会员价格
				</text>
			</view>
			<view class="bottom-divider">
				<view class="glass-card not-playing-card" @click="goToNoPlayPage">
					<text class="noplay">不游玩机台？</text>
					<text class="link-text">请点击这里</text>
				</view>
			</view>
			<view>
				<!-- 传递 startTime 和 endTime props 给 usage 组件 -->
				<usage :startTime="selectedStartTime" :endTime="selectedEndTime"></usage>
				<button v-if="isAdmin" @click="goToConfig()">配置</button>
			</view>
		</view>

	</view>
</template>

<script lang="ts" setup>
	import { ref, onMounted, computed, reactive } from 'vue';
	import dayjs from 'dayjs';
	import usage from './usage';
	import { useProfileStore } from '../../stores/userProfileStore';
	const userProfile = useProfileStore()
	const res = uniCloud.getCurrentUserInfo('uni_id_token')
	const isAdmin = ref(res.role.includes("admin"))
	const todayDate = computed(() => {
		if (isAdmin.value) {
			return ''; //  管理员可以查看所有日期，startDate 设置为空字符串
		} else {
			return dayjs().format('YYYY-MM-DD'); // 其他用户只能查看今天及以后的日期
		}
	});
	// 用于存储选中的日期的开始和结束时间戳
	const selectedStartTime = ref<number | null>(null);
	const selectedEndTime = ref<number | null>(null);

	// calendarChange 事件处理函数
	function calendarChange(e : any) {
		console.log('wu-calendar change event e:', e); // 保留打印 e 对象，方便观察

		if (e.fulldate) { // 检查 e 对象中是否存在 fulldate 属性
			const selectedDate = e.fulldate; // 获取日期字符串，例如 "2025-03-21"

			// 使用 dayjs 计算 startTime (当天 00:00:00) 和 endTime (次日 00:00:00) 的时间戳
			const startTime = dayjs(selectedDate).startOf('day').valueOf();   // 当天 00:00:00 时间戳
			const endTime = dayjs(selectedDate).endOf('day').valueOf();     // 当天 23:59:59 时间戳 （或者使用 .add(1, 'day').startOf('day').valueOf() 获取次日 00:00:00）

			selectedStartTime.value = startTime;
			selectedEndTime.value = endTime;

			console.log('startTime:', startTime, 'endTime:', endTime); // 打印计算出的时间戳
		} else {
			console.warn('wu-calendar change event 没有 fulldate 属性', e); // 如果没有 fulldate，打印警告信息
		}
	}


	function goToConfig() {
		uni.navigateTo({
			url: "/pages/config/config"
		})
	}

	const goToNoPlayPage = () => {
		console.log("用户点击了 '不游玩机台？请点击这里' 卡片");

		if (!selectedStartTime.value || !selectedEndTime.value) {
			uni.showToast({
				icon: 'error',
				title: '请先选择日期',
				duration: 2000
			});
			return;
		}

		const orderData = {
			name: "不游玩机台",
			id: "67e2f4803f1a47470a1a552a",
			isNoPlay: true,
			startTime: selectedStartTime.value,
			endTime: selectedEndTime.value
		};

		uni.setStorageSync('orderData', JSON.stringify(orderData));

		uni.navigateTo({
			url: '/pages/order/order',
			success: function (res) {
				res.eventChannel.emit('acceptDataFromOpenerPage', orderData);
			}
		});
	}


	uni.$on("uni-id-pages-login-success", function () {
		uni.reLaunch({
			url: '/pages/index/index'
		});
	})

	onMounted(() => {
		// 初始化为当天日期
		const today = dayjs().format('YYYY-MM-DD');
		const startTime = dayjs(today).startOf('day').valueOf();
		const endTime = dayjs(today).endOf('day').valueOf();

		selectedStartTime.value = startTime;
		selectedEndTime.value = endTime;

		console.log('初始化时间 - startTime:', startTime, 'endTime:', endTime);

		// 获取用户信息
		uniCloud.getCurrentUserInfo('uni_id_token');
		isAdmin.value = res.role.includes("admin");
	});
</script>

<style lang="scss">
	.container {
		width: 100%;
		padding: 10rpx;
		box-sizing: border-box;
		background: #f5f5f5;
		min-height: 100vh;
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

	.glass-card {
		background: rgba(255, 255, 255, 0.7);
		backdrop-filter: blur(10px);
		border-radius: 20rpx;
		box-shadow: 0 4px 16px rgba(31, 38, 135, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.18);
		overflow: hidden;
		padding: 24rpx;
		transition: transform 0.3s ease, box-shadow 0.3s ease;
		position: relative;
	}

	.not-playing-card {
		margin: 20rpx 15px;
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 30rpx 24rpx;
		cursor: pointer;
		text-align: center;
	}

	.link-text {
		color: #007bff;
		text-decoration: underline;
		margin-left: 5rpx;
	}

	/*说明区域*/
	.tips-container {
		padding: 0 20rpx;
		margin: 20rpx 0;
		display: flex;
		justify-content: center;
	}

	.tips {
		font-size: 20rpx;
		color: gray;
	}

	.noplay {
		font-size: 20rpx;
		color: black;
	}

	.bottom-divider {
		border-bottom: 1px solid rgba(0, 0, 0, 0.05);
	}

	@media (prefers-color-scheme: dark) {

		.container {
			width: 100%;
			padding: 10rpx;
			box-sizing: border-box;
			background: rgb(0, 0, 0);
			min-height: 100vh;
		}

		.glass-card {
			background: rgb(22, 22, 24);
			backdrop-filter: blur(10px);
			border-radius: 20rpx;
			box-shadow: 0 4px 16px rgba(31, 38, 135, 0.1);
			border: 1px solid rgba(255, 255, 255, 0.18);
			overflow: hidden;
			padding: 24rpx;
			transition: transform 0.3s ease, box-shadow 0.3s ease;
			position: relative;
		}

		.noplay {
			font-size: 20rpx;
			color: white;
		}

		.tips {
			font-size: 20rpx;
			color: lightgray;
		}

		.bottom-divider {
			border-bottom: 1px solid rgb(51, 49, 50);
		}
		
		.calendar {
			font-color : white;
		}
	}
</style>