<template>
	<view v-for="data in Data.slice(0,2)" :key="data._id" class="glass-card">
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
				<view v-else class="status-badge status-pending">
					<text>未完成</text>
				</view>
			</view>
		</view>
		
		<view class="divider"></view>
		
		<view class="order-info" style="margin: 10rpx 0;">
			<text class="order-time">
				订单时间：
				<uni-dateformat format="yyyy-MM-dd hh:mm" :date='data.create_date'>
				</uni-dateformat>
			</text>
		</view>
		<view style="display: flex;">
			<view class="order-details">
				<view class="order-id">
					<text class="id-label">预约单号：</text>
					<text class="id-value">{{ data._id }}</text>
				</view>
				<view class="order-id">
					<text class="id-label">支付单号：</text>
					<text class="id-value">{{ data._id }}</text>
				</view>
			</view>
			<view>
				<view v-if="data.status == 0" class="sign-in-button" @click="goTopay()">
					<text>支付</text>
				</view>
			</view>
		</view>
	</view>
	<view v-if="Data.length == 0" class="tips-container">
		<view>
			<text class="tips">还没有订单哟</text>
		</view>
	</view>
</template>

<script setup lang='ts'>
	import {
		onMounted,
		reactive,
		ref,
		toRaw,
		computed
	} from 'vue'
	const todo = uniCloud.importObject('todo')
	const res = uniCloud.getCurrentUserInfo('uni_id_token')
	interface fishOrderData {
		_id: string,
		reservation_id: string,
		singlePrice: number,
		total_fee: number,
		status: number,
		create_date: number
	}
	const Data = ref < fishOrderData[] > ([])
	const reservationData = ref([])
	async function getFishOrder() {
		try {
			const result = await todo.Get_fishOrderList(res.uid)
			Data.value = result.data
			console.log(result.data)
		} catch (e) {

		}
	}
	async function searchReservation(uid: String) {
		try {
			const result = await todo.SearchReservationInfo(uid)
			reservationData.value = result.data
			console.log(toRaw(reservationData.value[0].machineId[0].name))
		} catch (e) {

		}
	}
	function goTopay(){
		uni.showToast({
			title: "还没做",
			icon : "error"
		})
	}
	
	onMounted(() => {
		getFishOrder()
	})
</script>

<style scoped>
	/* 全局样式 */
	.container {
		padding: 20px;
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
	/* 玻璃拟态卡片 */
	.glass-card {
		background: rgba(255, 255, 255, 0.7);
		backdrop-filter: blur(10px);
		border-radius: 20px;
		box-shadow: 0 8px 32px rgba(31, 38, 135, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.18);
		overflow: hidden;
		padding: 30rpx;
		margin-top: 10px;
		margin-bottom: 10px;
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

	/**/
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

	.order-id {
		display: flex;
		align-items: center;
	}

	.id-label {
		font-size: 12px;
		color: #9ca3af;
		margin-right: 4px;
	}

	.id-value {
		font-size: 12px;
		color: #6b7280;
		overflow: hidden;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		max-width: 285rpx;
	}

	.sign-in-button {
		background: linear-gradient(135deg, #FFC107 0%, #FF9800 100%);
		color: #fff;
		font-size: 14px;
		font-weight: 600;
		padding: 6px 14px;
		border-radius: 20px;
		box-shadow: 0 4px 12px rgba(255, 193, 7, 0.3);
		display: flex;
		justify-content: center;
		width: 80rpx;
	}

	.sign-in-button:active {
		transform: translateY(2px);
		box-shadow: 0 2px 8px rgba(255, 193, 7, 0.2);
	}

	.mark-badge {
		background: rgba(255, 193, 7, 0.1);
		color: #FF9800;
		font-size: 12px;
		font-weight: 500;
		padding: 4px 10px;
		border-radius: 12px;
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
	
	@media (prefers-color-scheme: dark) {
	
		/* 全局样式 */
		.container {
			padding: 20px;
			background: rgb(0, 0, 0);
			min-height: 100vh;
		}
	
		.button-container {
			margin-top: 20rpx;
			display: flex;
			justify-content: flex-end;
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
	
		/* 预约项目 */
	
		.reservation-info {
			display: flex;
			flex-direction: column;
			flex: 1;
		}
	
		.machine-name {
			font-size: 18px;
			font-weight: bold;
			margin-bottom: 6px;
			color: white;
		}
	
		.reservation-time {
			font-size: 13px;
			color: lightgray;
			background: rgb(59, 59, 61);
			padding: 2px 8px;
			border-radius: 12px;
			align-self: flex-start;
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
	}
</style>