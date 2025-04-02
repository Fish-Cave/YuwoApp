<template>
	<view style="padding: 20rpx;">
		<text>测试增删改查</text>
		<button @click="todoAddMachine()">添加机台信息</button>
		<text>{{Machine}}</text>
		<button @click="todoAddPrices()">添加价格信息</button>
		<text>{{Price}}</text><br />
		<text>{{prices}}</text>
	</view>
</template>

<script setup>
	import {
		reactive, ref, onMounted
	} from 'vue'
	const todo = uniCloud.importObject('todo')
	const Machine = reactive({
		"name": "9号机-Taiko",
		"type": "Taiko",
		"capacity": 1,
		"description": "神童科技，街机尺寸。已装Taiko彩虹版39.09。",
		"imageUrl": "",
		"status": "maintenance",
		"machinenum": 7,
	})
	const Price = reactive({
		"weekdays": "[1, 2, 3, 4, 5,6,7]",
		"price": 80,
		"unit": "元/次",
		"type": "会员",
		"description": "测试数据"
	})
	async function todoAddMachine() {
		try {
			const res = await todo.Machine(0, Machine)
			uni.showToast({
				title: '创建成功'
			})
		} catch (e) {
			uni.showModal({
				title: '创建失败',
				content: e.errMsg,
				showCancel: false
			})
		}
	}
	async function todoAddPrices() {
		try {
			const res = await todo.Prices_Add(Price)
			uni.showToast({
				title: '创建成功'
			})
		} catch (e) {
			uni.showModal({
				title: '创建失败',
				content: e.errMsg,
				showCancel: false
			})
		}
	}
	const prices = ref([])
	async function loadData(){
		try{
			prices.value = await todo.Prices_List()
		}catch{}
	}
	onMounted(()=>{
		const res = uniCloud.callFunction({
			name : "updateMembershipStatus"
		})
		const res1 = uniCloud.callFunction({
			name : "updateReservation"
		})
	})
</script>

<style>

</style>