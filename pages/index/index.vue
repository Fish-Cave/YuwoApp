<template>
	<view>
		<view>
			<wu-calendar type="week" @change="calendarChange" slideSwitchMode="none" :fold="false" startWeek="mon"
				color="#f59e0b" :startDate="todayDate" />
		</view>

		<view class="container">
			<view class="banner-wrapper">
				<neo-banner
					:list="bannerList"
					:interval="6000"
					:circular="true"
					:autoplay="true"
					type="dot"
					:previousflag="true"
					:previousDistance="30"
					:scale="0.9"
					dotNColor="#cccccc"
					dotInColor="#f59e0b"
					keySource="image"
				></neo-banner>
			</view>
			<view class="bottom-divider">
				<view class="glass-card not-playing-card" @click="goToNoPlayPage">
					<text class="noplay">不游玩机台？</text>
				</view>
				<view class="glass-card not-playing-card" @click="goToSettlePage">
					<text class="noplay">需要补票？</text>
				</view>
			</view>
			<view>
				<!-- 传递 startTime 和 endTime props 给 usage 组件 -->
				<usage :dayStartTime="selectedStartTime" 
				       :dayEndTime="selectedEndTime" 
				       :fetchStartTime="fetchStartTime"
				       :fetchEndTime="fetchEndTime"
				       :isFree="isFree"></usage>
				<button v-if="isAdmin" @click="goToConfig()">配置</button>
			</view>
		</view>
		<!-- 浮动配置按钮 -->
		<view v-if="isAdmin" class="float-config-btn" @click="goToConfig()">
			<uni-icons type="gear" size="30"></uni-icons>
		</view>

	</view>

</template>

<script lang="ts" setup>
	// 广告轮播图数据
	const bannerList = ref([
	  { image: 'https://static-mp-ce5205c8-70ee-4830-b92a-b3199ca7d6f3.next.bspapp.com/static/banner-1.png' }, 
	  { image: 'https://static-mp-ce5205c8-70ee-4830-b92a-b3199ca7d6f3.next.bspapp.com/static/banner-2.png' },
	  { image: 'https://static-mp-ce5205c8-70ee-4830-b92a-b3199ca7d6f3.next.bspapp.com/static/banner-3.png' }
	]);

	import { ref, onMounted, computed, reactive, watch } from 'vue'; // 添加 watch
	import dayjs from 'dayjs';
	import usage from './usage';
	import { useProfileStore } from '../../stores/userProfileStore';
	import isFreeDay from '@/modules/isFreeDay.ts';
	import NeoBanner from '@/components/neo-banner/neo-banner.vue';

	const userProfile = useProfileStore()
	const res = uniCloud.getCurrentUserInfo('uni_id_token')
	console.log(res)
	const isAdmin = ref(res.role.includes("admin"))
	const isFree = ref(isFreeDay()) // 初始判断闲时忙时，基于当前时间

	const todayDate = computed(() => {
		if (isAdmin.value) {
			return ''; // 管理员可以查看所有日期，startDate 设置为空字符串
		} else {
			return dayjs().format('YYYY-MM-DD'); // 其他用户只能查看今天及以后的日期
		}
	});

	// 用于存储选中的日期的开始和结束时间戳 (用于usage组件的时间条的视觉范围)
	const selectedStartTime = ref<number | null>(null);
	const selectedEndTime = ref<number | null>(null);

	// 新增：用于存储实际向后端请求数据的开始和结束时间戳 (包含跨夜预约的范围)
	const fetchStartTime = ref<number | null>(null);
	const fetchEndTime = ref<number | null>(null);

	// calendarChange 事件处理函数
	function calendarChange(e : any) {
		console.log('wu-calendar change event e:', e);

		if (e.fulldate) {
			const selectedDate = e.fulldate; // 例如 "2025-03-21"
			const selectedDayMoment = dayjs(selectedDate); // 创建 dayjs 对象

			// 1. 计算当前显示日期的 00:00:00 和 23:59:59.999 (用于usage组件的时间条总长度)
			selectedStartTime.value = selectedDayMoment.startOf('day').valueOf();
			selectedEndTime.value = selectedDayMoment.endOf('day').valueOf();

			// 2. 计算后端实际需要查询的范围：前一天 22:00:00 到 后一天 08:00:00
			// 注意：这里使用 clone() 避免修改原始 selectedDayMoment
			fetchStartTime.value = selectedDayMoment.clone().subtract(1, 'day').hour(22).minute(0).second(0).millisecond(0).valueOf();
			fetchEndTime.value = selectedDayMoment.clone().add(1, 'day').hour(8).minute(0).second(0).millisecond(0).valueOf();

			isFree.value = isFreeDay(selectedStartTime.value); // 闲时忙时判断基于当天 00:00:00

			console.log('Visual Day Range:', dayjs(selectedStartTime.value).format('YYYY-MM-DD HH:mm:ss'), '-', dayjs(selectedEndTime.value).format('YYYY-MM-DD HH:mm:ss'));
			console.log('Backend Fetch Range:', dayjs(fetchStartTime.value).format('YYYY-MM-DD HH:mm:ss'), '-', dayjs(fetchEndTime.value).format('YYYY-MM-DD HH:mm:ss'));
		} else {
			console.warn('wu-calendar change event 没有 fulldate 属性', e);
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
			id: "67e2f4803f1a47470a1a552a", // 假设这是一个特殊的机台ID
			isNoPlay: true,
			startTime: selectedStartTime.value,
			endTime: selectedEndTime.value
		};
		if (res.role.includes("user") || res.role.includes("admin")) {
			uni.setStorageSync('orderData', JSON.stringify(orderData));

			uni.navigateTo({
				url: '/pages/order/order',
				success: function (res) {
					res.eventChannel.emit('acceptDataFromOpenerPage', orderData);
				}
			});
		} else {
			uni.showToast({
				title: "您还没有预约权限,请联系管理员申请权限",
				icon: 'error'
			})
		}

	}

	const goToSettlePage = () => {
		console.log("用户点击了 '需要补票？点击这里' 卡片");

		if (res.role.includes("user") || res.role.includes("admin")) {
			uni.navigateTo({
				url: '/pages/settle/settle'
			});
		} else {
			uni.showToast({
				title: "您还没有预约权限,请联系管理员申请权限",
				icon: 'error'
			});
		}
	};

	uni.$on("uni-id-pages-login-success", function () {
		uni.reLaunch({
			url: '/pages/index/index'
		});
	})

	onMounted(() => {
		// 初始化为当天日期
		const today = dayjs(); // 获取当前 dayjs 对象

		// 1. 初始化当前显示日期的 00:00:00 和 23:59:59.999
		selectedStartTime.value = today.startOf('day').valueOf();
		selectedEndTime.value = today.endOf('day').valueOf();

		// 2. 初始化后端实际需要查询的范围
		// 注意：这里使用 clone() 避免修改原始 today 对象
		fetchStartTime.value = today.clone().subtract(1, 'day').hour(22).minute(0).second(0).millisecond(0).valueOf();
		fetchEndTime.value = today.clone().add(1, 'day').hour(8).minute(0).second(0).millisecond(0).valueOf();

		console.log('初始化时间 - Visual Day Range:', dayjs(selectedStartTime.value).format('YYYY-MM-DD HH:mm:ss'), '-', dayjs(selectedEndTime.value).format('YYYY-MM-DD HH:mm:ss'));
		console.log('初始化时间 - Backend Fetch Range:', dayjs(fetchStartTime.value).format('YYYY-MM-DD HH:mm:ss'), '-', dayjs(fetchEndTime.value).format('YYYY-MM-DD HH:mm:ss'));

		// 获取用户信息
		uniCloud.getCurrentUserInfo('uni_id_token');
		isAdmin.value = res.role.includes("admin");
	});
	
</script>


<style lang="scss">
	.float-config-btn {
		position: fixed;
		right: 30rpx;
		bottom: 120rpx;
		width: 100rpx;
		height: 100rpx;
		background: #f59e0b;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
		z-index: 999;
	}
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

	.noplay {
		font-size: 25rpx;
		color: black;
	}

	.bottom-divider {
		border-bottom: 1px solid rgba(0, 0, 0, 0.05);
		display: flex;
		flex-direction: row; /* 横向排列 */
		align-items: center; /* 垂直居中子元素 */
	}
	.bottom-divider .glass-card {
		flex: 1; /* 让每个卡片占用相等的剩余空间 */
		margin: 20rpx 10rpx; /* 调整左右外边距，避免卡片紧贴 */
 	}
	.banner-wrapper {
			margin: 20rpx 0;
			border-radius: 20rpx;
			overflow: hidden;
			height: 130rpx;
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
			font-size: 25rpx;
			color: white;
		}

		.tips {
			font-size: 20rpx;
			color: lightgray;
		}

		.bottom-divider {
			border-bottom: 1px solid rgb(51, 49, 50);
			display: flex;
			flex-direction: row; /* 横向排列 */
			align-items: center; /* 垂直居中子元素 */
		}
		.bottom-divider .glass-card {
			flex: 1; /* 让每个卡片占用相等的剩余空间 */
			margin: 20rpx 10rpx; /* 调整左右外边距，避免卡片紧贴 */
		}
		.calendar {
			font-color: white;
		}
	}
</style>