<template>
	<view class="container">
		<!-- 筛选和排序区域 -->
		<view class="filter-sort-area">
			<view class="filter-item">
				<text class="filter-label">状态:</text>
				<uni-data-select
					v-model="filterStatus"
					:localdata="statusOptions"
					@change="onFilterChange"
					class="filter-select"
				></uni-data-select>
			</view>
			<view class="filter-item">
				<text class="filter-label">测试用:</text>
				<switch :checked="filterNoTimeOrder" @change="onNoTimeOrderChange" class="filter-switch"></switch>
			</view>
		</view>

		<!-- 订单列表 -->
		<view v-for="data in Data" :key="data._id" class="glass-card">
			<view class="order-header">
				<view style="display: flex;">
					<view>
						<text class="price-amount">
							总价{{data.total_fee / 100}}¥
						</text>
					</view>
					<view style="width: 20rpx;"></view>
					<view>
						<text class="price-amount">
							单价{{data.singlePrice / 100}}¥
						</text>
					</view>
				</view>
				<view>
					<view v-if="data.status == 1" class="status-badge status-completed">
						<text>已完成</text>
					</view>
					<view v-else-if="data.status == 0" class="status-badge status-pending">
						<text>待支付</text>
					</view>
					<view v-else class="status-badge status-expired">
						<text>其他状态</text>
					</view>
				</view>
			</view>

			<view class="divider"></view>

			<view class="order-info" style="margin: 20rpx 0;">
				<text class="order-time">
					订单时间：
					<uni-dateformat format="yyyy-MM-dd hh:mm" :date='data.create_date'>
					</uni-dateformat>
				</text>
			</view>
			<view style="display: flex; justify-content: space-between; align-items: center;">
				<view class="order-details">
					<view class="order-id">
						<view class="id-label">开始时间:</view>
						<view class="id-value">
							<uni-dateformat :date="data.starttime" v-if="data.starttime && data.starttime !== 0"></uni-dateformat>
							<text v-else>--</text>
						</view>
					</view>
					<view class="order-id">
						<view class="id-label">结束时间:</view>
						<view class="id-value">
							<uni-dateformat :date="data.endtime" v-if="data.endtime && data.endtime !== 0"></uni-dateformat>
							<text v-else>--</text>
						</view>
					</view>
					<view class="order-id">
						<view class="id-label">总时长:</view>
						<view class="id-value">
							<text v-if="data.starttime && data.endtime && data.starttime !== 0 && data.endtime !== 0">
								{{((data.endtime - data.starttime) / 60000).toFixed(0)}} 分钟
							</text>
							<text v-else>--</text>
						</view>
					</view>
					<view class="order-id">
						<text class="id-label">预约单号：</text>
						<text class="id-value">{{ data._id }}</text>
					</view>
					<view class="order-id">
						<text class="id-label">支付单号：</text>
						<text class="id-value">{{ data._id }}</text>
					</view>
				</view>
				<!-- 将支付按钮放在这里，并调整布局 -->
				<view>
					<view v-if="data.status == 0" class="sign-in-button" @click="goTopay(data._id)">
						<text>支付</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 空数据提示 -->
		<view v-if="Data.length == 0 && !isLoading" class="tips-container">
			<view>
				<text class="tips">还没有订单哟</text>
			</view>
		</view>
		
		<!-- 加载中提示 -->
		<view v-if="isLoading" class="tips-container">
			<view>
				<text class="tips">加载中...</text>
			</view>
		</view>

		<!-- 加载更多按钮 -->
		<view v-if="hasMore && !isLoading && Data.length > 0" class="load-more-container">
			<view class="load-more-button" @click="loadMoreOrders">
				<text>加载更多</text>
			</view>
		</view>
		
		<!-- 没有更多数据提示 -->
		<view v-if="!hasMore && Data.length > 0 && !isLoading" class="tips-container">
			<view>
				<text class="tips">没有更多订单了</text>
			</view>
		</view>
	</view>
</template>

<script setup lang='ts'>
	import {
		onMounted,
		ref
	} from 'vue'
	import {
		onReachBottom
	} from '@dcloudio/uni-app' // 引入触底事件
	
	// 引入 orderHandler 云对象，用于处理订单相关逻辑
	const orderHandler = uniCloud.importObject('orderHandler')
	const userInfo = uniCloud.getCurrentUserInfo('uni_id_token')

	// 订单数据接口定义
	interface fishOrderData {
		_id: string,
		reservation_id: string,
		singlePrice: number,
		total_fee: number,
		status: number,
		create_date: number,
		starttime: number,
		endtime: number,
		type: string,
		description?: string 
	}

	// 数据和状态管理
	const Data = ref<fishOrderData[]>([])
	const currentPage = ref(1)
	const pageSize = 10
	const totalOrders = ref(0)
	const hasMore = ref(true)
	const isLoading = ref(false)
	
	// 筛选条件
	const filterStatus = ref(null) // null 表示全部
	const filterNoTimeOrder = ref(false)
	
	// 订单状态选项
	const statusOptions = [
		{ value: null, text: '全部' },
		{ value: 0, text: '待支付' },
		{ value: 1, text: '已完成' },
		{ value: -1, text: '未处理' }
	]

	// 获取订单列表的函数
	async function getFishOrder(loadMore = false) {
		if (isLoading.value) return // 防止重复加载
		isLoading.value = true
		
		if (!loadMore) {
			currentPage.value = 1 // 如果不是加载更多，重置页码
			Data.value = [] // 清空现有数据
			hasMore.value = true // 重置hasMore状态
		}
		
		try {
			const options = {
				page: currentPage.value,
				pageSize: pageSize,
				status: filterStatus.value,
				noTimeOrder: filterNoTimeOrder.value
			}
			
			const result = await orderHandler.GetUserOrderList(userInfo.uid, options)
			
			if (result.errCode === 0) {
				if (loadMore) {
					Data.value = [...Data.value, ...result.data]
				} else {
					Data.value = result.data
				}
				
				totalOrders.value = result.total
				hasMore.value = Data.value.length < totalOrders.value
				console.log("订单列表数据:", result.data)
			} else {
				uni.showToast({
					title: result.errMsg || '加载失败',
					icon: 'error'
				})
			}
		} catch (e) {
			console.error("获取订单列表失败:", e)
			uni.showToast({
				title: '加载失败',
				icon: 'error'
			})
		} finally {
			isLoading.value = false
		}
	}

	// 筛选条件改变时触发
	function onFilterChange(value: number | null) {
		filterStatus.value = value
		getFishOrder(false) // 重新加载第一页数据
	}
	
	// 无时间订单筛选改变时触发
	function onNoTimeOrderChange(event: { detail: { value: boolean } }) {
		filterNoTimeOrder.value = event.detail.value
		getFishOrder(false) // 重新加载第一页数据
	}
	
	// 加载更多订单
	function loadMoreOrders() {
		if (hasMore.value && !isLoading.value) {
			currentPage.value++
			getFishOrder(true)
		}
	}

	// 支付函数
	async function goTopay(orderID: string) {
		uni.showLoading({
			title: '正在创建支付...'
		})
		
		try {
			// 调用云函数获取订单的准确信息，包括类型和描述
			const result = await orderHandler.GetHandledOrder(orderID)
			if (result.data && result.data.length > 0) {
				const orderData = result.data[0] // 获取订单数据

				let options = {
					total_fee: orderData.total_fee,
					type: orderData.type,
					order_no: orderID,
					description: orderData.description || "订单支付",
				}
				
				let optionsStr = encodeURI(JSON.stringify(options))
				
				uni.hideLoading()
				
				uni.navigateTo({
					url: `/pages/pay/pay?options=${optionsStr}`
				})
			} else {
				uni.hideLoading()
				uni.showToast({
					title: '订单信息错误',
					icon: 'error'
				})
			}
		} catch (e) {
			uni.hideLoading()
			console.error("支付发起失败:", e)
			uni.showToast({
				title: '支付发起失败',
				icon: 'error'
			})
		}
	}

	onMounted(() => {
		getFishOrder()
	})
	
	// 监听页面触底事件，实现上拉加载
	onReachBottom(() => {
		loadMoreOrders()
	})
</script>

<style scoped>
	/* 全局样式 */
	.container {
		padding: 20px;
		background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
		min-height: 100vh;
	}

	.button-container {
		margin-top: 20rpx;
		display: flex;
		justify-content: flex-end;
	}

	.divider {
		height: 2rpx;
		background-color: #e5e5e5;
		margin: 10rpx 0;
	}

	/* 筛选和排序区域样式 */
	.filter-sort-area {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20px;
		padding: 10px 15px;
		background: rgba(255, 255, 255, 0.7);
		backdrop-filter: blur(5px);
		border-radius: 10px;
		box-shadow: 0 2px 8px rgba(31, 38, 135, 0.05);
		position: relative;
		z-index: 10;  
	}

	.filter-item {
		display: flex;
		align-items: center;
	}

	.filter-label {
		font-size: 14px;
		color: #6b7280;
		margin-right: 8px;
		flex-shrink: 0;
	}

	.filter-select {
		flex: 1;
		min-width: 120px;
	}

	.filter-switch {
		transform: scale(0.8);
		margin-right: 5px;
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

	.order-info {
		display: flex;
		flex-direction: column;
		flex: 1;
	}

	.order-header {
		display: flex;
		justify-content: space-between;
	}

	.machine-name {
		font-size: 18px;
		font-weight: bold;
		margin-bottom: 6px;
		color: #333;
	}

	.order-time {
		font-size: 13px;
		color: #6b7280;
		background: rgba(243, 244, 246, 0.7);
		padding: 2px 8px;
		border-radius: 12px;
		align-self: flex-start;
	}

	.status-badge {
		padding: 4px 10px;
		border-radius: 12px;
		font-size: 12px;
		font-weight: 600;
		display: flex;
		width: 100rpx;
		justify-content: center;
	}

	.status-pending {
		background: rgba(239, 68, 68, 0.1);
		color: #EF4444;
	}

	.status-completed {
		background: rgba(110, 231, 78, 0.1);
		color: #6EE74E;
	}

	.status-expired {
		background: rgba(156, 163, 175, 0.1);
		color: #6B7280;
	}

	.status-active {
		background: rgba(255, 193, 7, 0.1);
		color: #FF9800;
	}
	
	.order-details {
		flex: 1; /* 让详情部分占据多余空间 */
	}

	.order-id {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 4rpx; /* 增加一点间距 */
	}

	.id-label {
		font-size: 12px;
		color: #9ca3af;
		margin-right: 4px;
		flex-shrink: 0; /* 防止标签被压缩 */
	}

	.id-value {
		font-size: 12px;
		color: #6b7280;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		max-width: 400rpx;
		text-align: right; /* 值靠右对齐 */
	}

	.sign-in-button {
		background: linear-gradient(135deg, #FFC107 0%, #FF9800 100%);
		color: #fff;
		font-size: 14px;
		font-weight: 600;
		padding: 8px 16px; /* 增大按钮，方便点击 */
		border-radius: 20px;
		box-shadow: 0 4px 12px rgba(255, 193, 7, 0.3);
		display: flex;
		justify-content: center;
		width: 80rpx;
		margin-left: 20rpx; /* 与左侧详情保持间距 */
	}

	.sign-in-button:active {
		transform: translateY(2px);
		box-shadow: 0 2px 8px rgba(255, 193, 7, 0.2);
	}

	.price-amount {
		font-weight: bold;
		font-size: 20px;
		background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
	}

	/* 加载更多按钮样式 */
	.load-more-container {
		display: flex;
		justify-content: center;
		margin: 20px 0 40px 0;
	}

	.load-more-button {
		background: linear-gradient(135deg, #FFC107 0%, #FF9800 100%);
		color: #fff;
		font-size: 14px;
		font-weight: 600;
		padding: 8px 24px;
		border-radius: 20px;
		box-shadow: 0 4px 12px rgba(255, 193, 7, 0.3);
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.load-more-button:active {
		transform: translateY(2px);
		box-shadow: 0 2px 8px rgba(255, 193, 7, 0.2);
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

	/* 黑夜模式 */
	@media (prefers-color-scheme: dark) {
		/* 全局样式 */
		.container {
			padding: 20px;
			background: rgb(0, 0, 0);
			min-height: 100vh;
		}

		.filter-sort-area {
			background: rgb(22, 22, 24);
			box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		}
		
		.filter-label {
			color: lightgray;
		}

		.divider {
			height: 2rpx;
			background-color: rgb(51, 49, 50);
			margin: 10rpx 0;
		}

		/* 玻璃拟态卡片 */
		.glass-card {
			background: rgb(22, 22, 24);
			backdrop-filter: blur(10px);
			border-radius: 20px;
			box-shadow: 0 8px 32px rgba(31, 38, 135, 0.1);
			border: 1px solid rgba(255, 255, 255, 0.18);
			overflow: hidden;
			padding: 16px;
			margin-bottom: 20px;
			transition: transform 0.3s ease, box-shadow 0.3s ease;
		}
		
		.order-time {
			font-size: 13px;
			color: white;
			background: rgb(59, 59, 61);
			padding: 2px 8px;
			border-radius: 12px;
			align-self: flex-start;
		}

		.machine-name {
			font-size: 18px;
			font-weight: bold;
			margin-bottom: 6px;
			color: white;
		}

		.id-label {
			font-size: 12px;
			color: gray;
			margin-right: 4px;
		}

		.id-value {
			font-size: 12px;
			color: gray;
			max-width: 150px;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}
		
		.tips {
			color: lightgray;
		}
	}
</style>
