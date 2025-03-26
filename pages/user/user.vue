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
					<view class="username-container">
						<text class="username">{{ userInfo.nickname || '未设置昵称' }}</text>
					</view>

					<!-- 会员徽章区域 -->
					<view class="membership-badges-container">
						<view v-if="membershipInfo.subscriptionPackage && membershipInfo.subscriptionPackage.length > 0"
							class="membership-badge premium-badge">
							<uni-icons type="star-filled" size="14" color="#ffffff"></uni-icons>
							<text>包月会员</text>
						</view>
						<view v-if="membershipInfo.membership && membershipInfo.membership.length > 0"
							class="membership-badge standard-badge">
							<uni-icons type="medal-filled" size="14" color="#ffffff"></uni-icons>
							<text>音游会员</text>
						</view>
					</view>

					<text class="user-id">UID: {{ userInfo._id }}</text>
				</view>

				<!-- 设置按钮 -->
				<view class="settings-button" @click="goToUserInfoPage">
					<uni-icons type="gear-filled" size="24" color="#ffffff"></uni-icons>
				</view>
			</view>

			<!-- 会员有效期信息卡片 -->
			<view v-if="hasMembership" class="membership-info-card glass-card">
				<view class="membership-info-header">
					<uni-icons type="vip-filled" size="20" color="#FFD700"></uni-icons>
					<text class="membership-info-title">会员权益</text>
				</view>

				<view class="membership-details">
					<view v-if="membershipInfo.subscriptionPackage && membershipInfo.subscriptionPackage.length > 0"
						class="membership-item">
						<view class="membership-icon premium-icon">
							<uni-icons type="star-filled" size="16" color="#ffffff"></uni-icons>
						</view>
						<view class="membership-content">
							<view class="membership-name">包月会员</view>
							<view class="membership-validity">
								<text class="validity-label">有效期至:</text>
								<text
									class="validity-date">{{ formatDate(membershipInfo.subscriptionPackage[0].validthru) }}</text>
							</view>
						</view>
					</view>

					<view v-if="membershipInfo.membership && membershipInfo.membership.length > 0"
						class="membership-item">
						<view class="membership-icon standard-icon">
							<uni-icons type="medal-filled" size="16" color="#ffffff"></uni-icons>
						</view>
						<view class="membership-content">
							<view class="membership-name">音游会员</view>
							<view class="membership-validity">
								<text class="validity-label">有效期至:</text>
								<text
									class="validity-date">{{ formatDate(membershipInfo.membership[0].validthru) }}</text>
							</view>
						</view>
					</view>
				</view>

			</view>
			<view v-else class="membership-info-card glass-card">
				<view class="membership-info-header">
					<uni-icons type="vip-filled" size="20" color="#FFD700"></uni-icons>
					<text class="membership-info-title">还不是🐟窝会员！</text>
				</view>
				<view class="becamemember-button glass-button" @click="goToRecharge()">
					<text>成为会员！</text>
				</view>
			</view>

			<!-- 统计信息 -->
			<view class="stats-container glass-card">
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
			<view class="card-header" @click="goToRecentOrder">
				<text class="card-title">最近订单</text>
				<text style="color:#6b7280;">查看更多</text>
			</view>

			<view class="orders-container">
				<view v-for="data in displayedData.slice(0,3)" :key="data._id" class="order-item">
					<view class="order-icon">
						<uni-icons type="headphones" size="28" color="#FF9800"></uni-icons>
					</view>

					<view class="order-details">
						<text class="order-machine">{{ data.machineId[0].name }}</text>
						<uni-dateformat :date="data.startTime" format="yyyy-MM-dd hh:mm" class="order-date">
						</uni-dateformat>
					</view>

					<view class="order-status" :class="data.status == 1 ? 'status-completed' : 'status-pending'">
						<text class="status-text">{{ data.status == 1 ? '已完成' : '未完成' }}</text>
					</view>
				</view>

				<view v-if="displayedData.length === 0" class="empty-orders">
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
	import {
		onMounted,
		reactive,
		ref,
		toRaw,
		computed
	} from 'vue'
	// 引入 uni-id-pages 的 store
	import {
		store,
		mutations
	} from '@/uni_modules/uni-id-pages/common/store.js'
	import dayjs from 'dayjs'  // 确保导入dayjs用于日期格式化

	const uniIdCo = uniCloud.importObject("uni-id-co")
	const todo = uniCloud.importObject('todo')
	const res = uniCloud.getCurrentUserInfo('uni_id_token')
	console.log(res)
	const profile = ref({})

	// 会员信息数据结构
	interface MembershipItem {
		_id : string;
		userID : string;
		status : boolean;
		validstart ?: number;
		validthru : number;
		package_type ?: string;
	}

	interface MembershipInfo {
		membership : MembershipItem[];
		subscriptionPackage : MembershipItem[];
	}

	// 初始化会员信息
	const membershipInfo = ref<MembershipInfo>({
		membership: [],
		subscriptionPackage: []
	});

	// 计算属性：是否有任何类型的会员
	const hasMembership = computed(() => {
		return (membershipInfo.value.membership && membershipInfo.value.membership.length > 0) ||
			(membershipInfo.value.subscriptionPackage && membershipInfo.value.subscriptionPackage.length > 0);
	});

	// 获取会员信息
	async function getMembershipInfo() {
		try {
			if (!res || !res.uid) {
				console.log('未登录或无法获取用户ID');
				return;
			}

			const result = await todo.getUserMembershipInfo(res.uid);
			console.log('会员信息查询结果:', result);

			if (result) {
				membershipInfo.value = result;
			}
		} catch (error) {
			console.error('获取会员信息失败:', error);
		}
	}

	// 格式化日期
	function formatDate(timestamp) {
		if (!timestamp) return '未知';
		return dayjs(timestamp).format('YYYY-MM-DD');
	}

	interface reservationData {
		_id : string;
		machineId : string;
		isOvernight : boolean;
		status : string;
		startTime : string;
	}
	const Data = ref<reservationData[]>([])

	interface priceList {
		_id : string;
		price : number
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
	
	function goToRecharge() {
		uni.navigateTo({
			url: '/pages/recharge/recharge'
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

	// 跳转到 uni-id-pages 的用户信息页
	function goToUserInfoPage() {
		uni.navigateTo({
			url: '/uni_modules/uni-id-pages/pages/userinfo/userinfo'
		});
	}

	// 功能按钮点击处理
	function handleFeatureClick(feature : string) {
		if (feature !== 'ordering') {
			uni.showToast({
				title: '功能开发中',
				icon: 'none'
			});
		}
	}

	// 功能项点击处理
	function handleUtilityClick(utility : string) {
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

	const displayedData = computed(() => {
		return Data.value.slice(0, 5);
	});

	function goToRecentOrder() {
		uni.navigateTo({
			url: '/pages/recentOrder/recentOrder' // 确保路径正确
		});
	}

	onMounted(() => {
		getPriceList()
		getReservationData() // 获取订单数据
		getMembershipInfo() // 获取会员信息
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
		aspect-ratio: 1/1;
		/* 保持头像容器为正方形 */
	}

	.user-details {
		flex: 1;
		display: flex;
		flex-direction: column;
	}

	.username-container {
		display: flex;
		align-items: center;
		margin-bottom: 6px;
	}

	.username {
		font-size: 20px;
		font-weight: bold;
		color: #fff;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
	}

	/* 会员徽章容器 */
	.membership-badges-container {
		display: flex;
		flex-direction: column;
		/* 修改为垂直排列 */
		gap: 8px;
		margin-bottom: 8px;
		margin-top: 8px;
		/* 调整与昵称的间距 */
	}

	/* 会员徽章样式 */
	.membership-badge {
		display: flex;
		align-items: center;
		padding: 3px 10px;
		border-radius: 12px;
		font-size: 12px;
		font-weight: 500;
		color: #ffffff;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
	}

	.membership-badge text {
		margin-left: 4px;
	}

	.premium-badge {
		background: linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%);
		border: 1px solid rgba(255, 255, 255, 0.2);
	}

	.standard-badge {
		background: linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%);
		border: 1px solid rgba(255, 255, 255, 0.2);
	}

	/* 会员信息卡片 */
	.membership-info-card {
		background: rgba(255, 255, 255, 0.6);
		border-radius: 16px;
		padding: 16px;
		margin: 14px 0;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
		border: 1px solid rgba(255, 255, 255, 0.4);
	}

	.membership-info-header {
		display: flex;
		align-items: center;
		margin-bottom: 12px;
		padding-bottom: 8px;
		border-bottom: 1px solid rgba(0, 0, 0, 0.08);
	}

	.membership-info-title {
		font-size: 16px;
		font-weight: 600;
		color: #333333;
		margin-left: 8px;
	}

	.membership-details {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.membership-item {
		display: flex;
		align-items: center;
		background: rgba(255, 255, 255, 0.7);
		border-radius: 12px;
		padding: 12px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
		transition: transform 0.2s ease;
	}

	.membership-item:hover {
		transform: translateY(-2px);
	}

	.membership-icon {
		display: flex;
		justify-content: center;
		align-items: center;
		width: 40px;
		height: 40px;
		border-radius: 50%;
		margin-right: 14px;
		flex-shrink: 0;
	}

	.premium-icon {
		background: linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%);
		box-shadow: 0 2px 8px rgba(139, 92, 246, 0.3);
	}

	.standard-icon {
		background: linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%);
		box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
	}

	.membership-content {
		flex: 1;
	}

	.membership-name {
		font-size: 16px;
		font-weight: 600;
		color: #333333;
		margin-bottom: 6px;
	}

	.membership-validity {
		font-size: 13px;
		color: #4B5563;
		background: rgba(0, 0, 0, 0.03);
		padding: 4px 10px;
		border-radius: 10px;
		display: inline-flex;
		align-items: center;
	}

	.validity-label {
		color: #6B7280;
		margin-right: 4px;
	}

	.validity-date {
		font-weight: 500;
		color: #4B5563;
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
		background: rgba(255, 255, 255, 0.2);
		border-radius: 50%;
		cursor: pointer;
		transition: transform 0.2s ease, background-color 0.2s ease;
	}

	.settings-button:active {
		transform: scale(0.95);
		background: rgba(255, 255, 255, 0.3);
	}

	/* 统计信息区域 */
	.stats-container {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 18px 12px;
		background: rgba(255, 255, 255, 0.6);
		border-radius: 16px;
		margin-top: 12px;
		box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.4);
	}

	.stat-item {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		position: relative;
	}

	.stat-value {
		font-size: 20px;
		font-weight: bold;
		color: #333333;
		margin-bottom: 6px;
		background: linear-gradient(135deg, #FF9800 0%, #F76808 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
	}

	.stat-label {
		font-size: 13px;
		color: #6B7280;
		font-weight: 500;
	}

	.stat-divider {
		width: 1px;
		height: 36px;
		background: rgba(0, 0, 0, 0.1);
		margin: 0 8px;
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
	.logout-button {
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

	.logout-button:active {
		transform: translateY(2px);
		box-shadow: 0 2px 8px rgba(239, 68, 68, 0.2);
	}
	/* 退出登录按钮 */
	.becamemember-button {
		background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
		color: white;
		border: none;
		border-radius: 24px;
		padding: 12px 24px;
		font-size: 16px;
		font-weight: 600;
		margin-top: 20px;
		box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
		transition: transform 0.2s ease, box-shadow 0.2s ease;
		display: flex;
		justify-content: center;
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

		.membership-badges-container {
			gap: 6px;
		}

		.membership-badge {
			padding: 2px 8px;
			font-size: 11px;
		}

		.membership-info-card {
			padding: 10px;
		}

		.membership-item {
			padding: 8px;
		}

		.membership-icon {
			width: 30px;
			height: 30px;
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

		.membership-badges-container {
			display: flex;
			flex-direction: column;
			gap: 8px;
			margin-bottom: 8px;
			margin-top: 8px;
			align-items: flex-start;
		}

		.membership-badge {
			display: flex;
			align-items: center;
			padding: 3px 10px;
			border-radius: 12px;
			font-size: 12px;
			font-weight: 500;
			color: #ffffff;
			box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
			width: fit-content;
		}

		.membership-info-card {
			padding: 16px;
		}

		.membership-item {
			padding: 12px;
		}

		.membership-icon {
			width: 42px;
			height: 42px;
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