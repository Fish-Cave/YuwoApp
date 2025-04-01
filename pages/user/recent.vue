<template>
	<view v-for="data in Data" :key="data._id" class="glass-card">
		<view>
			<view>
				{{data}}
			</view>
			<view style="display: flex; justify-content: space-between;">
				<view>
					<view>总价</view>
					<view>
						<view>预约号</view>
						<view>订单号</view>
					</view>
				</view>
				<view>
					<view>状态</view>
					<view>支付或详情按钮</view>
				</view>
			</view>
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
			//console.log(Data)
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

	onMounted(() => {
		getFishOrder()
	})
</script>

<style scoped>
	/* 全局样式 */
	.container {
		padding: 20px;
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
</style>