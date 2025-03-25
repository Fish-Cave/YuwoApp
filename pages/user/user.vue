<template>
	<view class="container">
		<!-- 用户信息展示部分 -->
		<view class="user-info-card glass-card">
			<view class="user-info-header">
				<!-- 头像 -->
				<view class="avatar-container">
					<uni-id-pages-avatar width="160rpx" height="160rpx"></uni-id-pages-avatar>
				</view>
				
				<!-- 用户信息 -->
				<view class="user-details">
					<text class="username">{{ userInfo.nickname || '未设置昵称' }}</text>
					<text class="user-id">UID: {{ userInfo._id }}</text>
				</view>
				
				<!-- 设置按钮 -->
				<view class="settings-button" @click="goToUserInfoPage">
					<uni-icons type="gear-filled" size="24" color="#FF9800"></uni-icons>
				</view>
			</view>

			<!-- 统计信息 -->
			<view class="stats-container">
				<view class="stat-item">
					<text class="stat-value">{{ totalUsageCount }}</text>
					<text class="stat-label">总使用次数</text>
				</view>
				<view class="stat-divider"></view>
				<view class="stat-item">
					<text class="stat-value">{{ totalUsageDuration }}</text>
					<text class="stat-label">总使用时长</text>
				</view>
				<view class="stat-divider"></view>
				<view class="stat-item">
					<text class="stat-value">{{ totalConsumptionAmount }}</text>
					<text class="stat-label">总消费金额</text>
				</view>
			</view>
		</view>
		
		<!-- 功能按钮 -->
		<view class="features-card glass-card">
			<view class="features-container">
				<view class="feature-item" @click="goToUsing()">
					<view class="feature-icon using-icon">
						<uni-icons type="checkbox" size="28" color="#FF9800"></uni-icons>
					</view>
					<text class="feature-label">使用中</text>
				</view>

				<view class="feature-item" @click="goToreservationList()">
					<view class="feature-icon ordering-icon">
						<uni-icons type="calendar" size="28" color="#3B82F6"></uni-icons>
					</view>
					<text class="feature-label">预约中</text>
				</view>
				
				<view class="feature-item" @click="handleFeatureClick('favorite')">
					<view class="feature-icon favorite-icon">
						<uni-icons type="heart" size="28" color="#8B5CF6"></uni-icons>
					</view>
					<text class="feature-label">收藏</text>
				</view>
				
				<view class="feature-item" @click="handleFeatureClick('service')">
					<view class="feature-icon service-icon">
						<uni-icons type="chatbubble" size="28" color="#10B981"></uni-icons>
					</view>
					<text class="feature-label">客服</text>
				</view>
			</view>
		</view>

		<!-- 最近订单 -->
		<view class="orders-card glass-card">
			<view class="card-header">
				<text class="card-title">最近订单</text>
				<uni-icons type="right" size="18" color="#6b7280"></uni-icons>
			</view>

			<view class="orders-container">
				<view v-for="data in Data" :key="data._id" class="order-item">
					<view class="order-icon">
						<uni-icons type="headphones" size="28" color="#FF9800"></uni-icons>
					</view>
					
					<view class="order-details">
						<text class="order-machine">{{ data.machineId[0].name }}</text>
						<uni-dateformat :date="data.startTime" format="yyyy-MM-dd hh:mm" class="order-date"></uni-dateformat>
					</view>
					
					<view class="order-status" :class="data.status == 1 ? 'status-completed' : 'status-pending'">
						<text class="status-text">{{ data.status == 1 ? '已完成' : '未完成' }}</text>
					</view>
				</view>
				
				<view v-if="Data.length === 0" class="empty-orders">
					<text>暂无订单记录</text>
				</view>
			</view>
		</view>

		<!-- 底部功能按钮 -->
		<view class="utilities-card glass-card">
			<view class="utility-item" @click="handleUtilityClick('notifications')">
				<uni-icons type="notification-filled" size="20" color="#6b7280"></uni-icons>
				<text class="utility-text">消息通知</text>
				<uni-icons type="right" size="16" color="#6b7280"></uni-icons>
			</view>
			
			<view class="utility-divider"></view>
			
			<view class="utility-item" @click="handleUtilityClick('help')">
				<uni-icons type="info-filled" size="20" color="#6b7280"></uni-icons>
				<text class="utility-text">帮助中心</text>
				<uni-icons type="right" size="16" color="#6b7280"></uni-icons>
			</view>
		</view>

		<!-- 退出登录按钮 -->
		<button class="logout-button glass-button" @click="logOut()">退出登录</button>
	</view>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, toRaw, computed } from 'vue'
// 引入 uni-id-pages 的 store
import { store, mutations } from '@/uni_modules/uni-id-pages/common/store.js'
const uniIdCo = uniCloud.importObject("uni-id-co")
const todo = uniCloud.importObject('todo')
const res = uniCloud.getCurrentUserInfo('uni_id_token')
const profile = ref({})

interface reservationData {
	_id: string;
	machineId: string;
	isOvernight: boolean;
	status: string;
	startTime: string;
}
const Data = ref<reservationData[]>([])

interface priceList {
	_id: string;
	price: number
}
const pricelist = ref<priceList[]>([])
const price = ref(5)
const priceOvernight = ref(50)

// 计算属性获取用户信息
const userInfo = computed(() => store.userInfo)

// 示例数据，你需要替换为实际从后端获取的数据
const totalUsageCount = ref(120);
const totalUsageDuration = ref('30小时');
const totalConsumptionAmount = ref('¥199');

async function getPriceList() {
	try {
		const result = await todo.GetPriceInfoByRole('superUser')
		pricelist.value = result.data
		console.log(toRaw(pricelist.value[0]))
		price.value = toRaw(pricelist.value[0]).price
		priceOvernight.value = toRaw(pricelist.value[1]).price
	} catch { }
}

async function getReservationData() {
	try {
		let result = await todo.GetReservationInfo(res.uid)
		console.log(result.data)
		Data.value = result.data
	} catch { }
}

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
				url:"/pages/using/using"
			})
		} else {
			uni.showToast({
				title: "未找到签到信息",
				icon : "error"
			})
		}
	} catch { }
}

// 跳转到 uni-id-pages 的用户信息页
function goToUserInfoPage() {
	uni.navigateTo({
		url: '/uni_modules/uni-id-pages/pages/userinfo/userinfo'
	});
}

// 功能按钮点击处理
function handleFeatureClick(feature: string) {
	if (feature !== 'ordering') {
		uni.showToast({
			title: '功能开发中',
			icon: 'none'
		});
	}
}

// 功能项点击处理
function handleUtilityClick(utility: string) {
	uni.showToast({
		title: '功能开发中',
		icon: 'none'
	});
}

//登出
async function logOut() {
	try {
		await uniIdCo.logout()
		// 3. 清除本地 token 和用户信息
		uni.removeStorageSync('uni_id_token');
		uni.removeStorageSync('uni_id_token_expired');
		// 4. 更新全局状态 (uni-id-pages store)
		mutations.logout()

		// 5. 跳转到登录页
		uni.reLaunch({
			url: '/uni_modules/uni-id-pages/pages/login/login-withpwd'
		});

		// 6. （可选）处理成功提示
		uni.showToast({
			title: '退出成功',
			icon: 'none'
		});
	} catch (e) {
		console.error('退出登录失败', e);
		uni.showToast({
			title: '退出失败，请重试',
			icon: 'none'
		});
	}
}

onMounted(() => {
	getPriceList()
	getReservationData() // 获取订单数据
	console.log("单价" + price.value + "过夜" + priceOvernight.value)
})
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

/* 用户信息卡片 */
.user-info-card {
	background: linear-gradient(20deg, rgba(255, 152, 0, 0.8) 0%, rgba(243, 184, 6, 0.6) 100%);
	margin-bottom: 24px;
}

.user-info-header {
	display: flex;
	align-items: center;
	padding: 16px 8px;
	position: relative;
}

.avatar-container {
	position: relative;
	width: 80px;
	height: 80px;
	border-radius: 50%;
	overflow: hidden;
	border: 3px solid rgba(255, 255, 255, 0.8);
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	margin-right: 16px;
}

.user-details {
	flex: 1;
	display: flex;
	flex-direction: column;
}

.username {
	font-size: 20px;
	font-weight: bold;
	color: #fff;
	text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
	margin-bottom: 6px;
}

.user-id {
	font-size: 12px;
	color: rgba(255, 255, 255, 0.8);
	background: rgba(0, 0, 0, 0.1);
	padding: 4px 10px;
	border-radius: 12px;
	align-self: flex-start;
}

.settings-button {
	width: 36px;
	height: 36px;
	display: flex;
	justify-content: center;
	align-items: center;
	background: rgba(255, 255, 255, 0.3);
	border-radius: 50%;
	cursor: pointer;
	transition: transform 0.2s ease;
}

.settings-button:active {
	transform: scale(0.95);
}

/* 统计信息区域 */
.stats-container {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 16px 8px;
	background: rgba(255, 255, 255, 0.3);
	border-radius: 16px;
	margin-top: 8px;
}

.stat-item {
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
}

.stat-value {
	font-size: 18px;
	font-weight: bold;
	color: #fff;
	margin-bottom: 4px;
}

.stat-label {
	font-size: 12px;
	color: rgba(255, 255, 255, 0.8);
}

.stat-divider {
	width: 1px;
	height: 30px;
	background: rgba(255, 255, 255, 0.3);
}

/* 功能按钮部分 */
.features-container {
	display: flex;
	justify-content: space-around;
	align-items: center;
}

.feature-item {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 8px;
	transition: transform 0.2s ease;
}

.feature-item:active {
	transform: scale(0.95);
}

.feature-icon {
	display: flex;
	justify-content: center;
	align-items: center;
	width: 60px;
	height: 60px;
	border-radius: 18px;
	margin-bottom: 8px;
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.using-icon {
	background: rgba(255, 247, 237, 0.9);
}

.ordering-icon {
	background: rgba(238, 245, 254, 0.9);
}

.favorite-icon {
	background: rgba(249, 244, 254, 0.9);
}

.service-icon {
	background: rgba(239, 252, 243, 0.9);
}

.feature-label {
	font-size: 14px;
	color: #333;
	font-weight: 500;
}

/* 订单卡片样式 */
.card-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 12px 8px;
	border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.card-title {
	font-size: 16px;
	font-weight: bold;
	color: #333;
}

.orders-container {
	padding: 8px 0;
}

.order-item {
	display: flex;
	align-items: center;
	padding: 12px 8px;
	border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.order-item:last-child {
	border-bottom: none;
}

.order-icon {
	display: flex;
	justify-content: center;
	align-items: center;
	width: 50px;
	height: 50px;
	border-radius: 16px;
	background: rgba(255, 247, 237, 0.8);
	margin-right: 12px;
}

.order-details {
	flex: 1;
	display: flex;
	flex-direction: column;
}

.order-machine {
	font-size: 16px;
	font-weight: 500;
	color: #333;
	margin-bottom: 4px;
}

.order-date {
	font-size: 12px;
	color: #6b7280;
}

.order-status {
	padding: 4px 12px;
	border-radius: 20px;
	font-size: 12px;
	font-weight: 500;
}

.status-completed {
	background: rgba(16, 185, 129, 0.1);
}

.status-completed .status-text {
	color: #10B981;
}

.status-pending {
	background: rgba(239, 68, 68, 0.1);
}

.status-pending .status-text {
	color: #EF4444;
}

.empty-orders {
	padding: 24px 0;
	display: flex;
	justify-content: center;
	align-items: center;
}

.empty-orders text {
	color: #9ca3af;
	font-size: 14px;
}

/* 功能项样式 */
.utility-item {
	display: flex;
	align-items: center;
	padding: 16px 8px;
	transition: background-color 0.2s ease;
}

.utility-item:active {
	background-color: rgba(0, 0, 0, 0.02);
}

.utility-text {
	flex: 1;
	margin-left: 12px;
	font-size: 15px;
	color: #333;
}

.utility-divider {
	height: 1px;
	background-color: rgba(0, 0, 0, 0.05);
	margin: 0 8px;
}

/* 退出登录按钮 */
.glass-button {
	background: linear-gradient(135deg, rgba(239, 68, 68, 0.8) 0%, rgba(220, 38, 38, 0.7) 100%);
	color: white;
	border: none;
	border-radius: 24px;
	padding: 12px 24px;
	font-size: 16px;
	font-weight: 600;
	margin-top: 20px;
	box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
	transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.glass-button:active {
	transform: translateY(2px);
	box-shadow: 0 2px 8px rgba(239, 68, 68, 0.2);
}

/* 媒体查询：针对不同尺寸设备的响应式样式 */
/* 小屏幕设备 */
@media screen and (max-width: 375px) {
	.container {
		padding: 16px;
	}
	
	.avatar-container {
		width: 60px;
		height: 60px;
	}
	
	.username {
		font-size: 18px;
	}
	
	.feature-icon {
		width: 50px;
		height: 50px;
	}
	
	.feature-label {
		font-size: 12px;
	}
	.mark-badge {
		background: rgba(255, 193, 7, 0.1);
		color: #FF9800;
		font-size: 12px;
		font-weight: 500;
		padding: 4px 10px;
		border-radius: 12px;
	}
}

/* 大屏幕设备 */
@media screen and (min-width: 768px) {
	.container {
		padding: 24px;
		max-width: 800px;
		margin: 0 auto;
	}
	
	.glass-card {
		padding: 20px;
		border-radius: 24px;
	}
	
	.avatar-container {
		width: 100px;
		height: 100px;
	}
	
	.username {
		font-size: 22px;
	}
	
	.stats-container {
		padding: 20px 16px;
	}
	
	.stat-value {
		font-size: 20px;
	}
	
	.feature-icon {
		width: 70px;
		height: 70px;
	}
}
</style>