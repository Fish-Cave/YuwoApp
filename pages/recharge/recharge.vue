<template>
	<view class="container" style="display: flex; flex-direction: column; padding: 20rpx;">
		<view>
			<view class="user-info-card glass-card">
				<view class="user-info-header">
					<view class="avatar-container">
						<!-- 使用 uni-id-pages-avatar 组件显示头像 -->
						<uni-id-pages-avatar width="160rpx" height="160rpx"></uni-id-pages-avatar>
					</view>
					<view class="user-details">
						<text class="nickname">{{ userInfo.nickname || '未设置昵称' }}</text>
						<text class="user-id">UID: {{ userInfo._id }}</text>
					</view>
				</view>
			</view>
		</view>
		<view class="segmented-control-container">
			<uni-segmented-control :values="segmentedValues" :current="segmentedCurrent" style-type="button"
				active-color="#f9cb14" @clickItem="onSegmentChange"></uni-segmented-control>
		</view>
		<view v-if="rechargeItems == 0">
			<view>
				<view class="recharge-info-header">
					<uni-icons type="cart-filled" size="20" color="#FFD700"></uni-icons>
					<text class="recharge-info-title">选择会员充值时间!</text>
				</view>
			</view>
			<view class="tips-container">
				<text class="tips">
					歇脚卡会员可以在🐟窝内免费歇脚！
				</text>
			</view>
			<view>
				<view class="goods-card" @click="makeOrder('member')">
					<view class="goods-content">
						<view class="goods-info">
							<text class="goods-detail">鱼窝歇脚卡</text>
							<uni-icons v-if="types.member" type="cart-filled" size="35"></uni-icons>
							<uni-icons v-else type="cart" size="35"></uni-icons>
						</view>
						<view class="goods-price">
							<view class="price-amount">
								<text>{{priceList.member / 100}}</text>
								<text>元/月</text>
							</view>
						</view>
					</view>

				</view>
			</view>
		</view>
		<view v-else>
			<view>
				<view class="recharge-info-header">
					<uni-icons type="cart-filled" size="20" color="#FFD700"></uni-icons>
					<text class="recharge-info-title">选择周卡/月卡充值时间!</text>
				</view>
				<view class="tips-container">
					<text class="tips">
						大月卡与大周卡用户,可以在30天/7天内免费游玩🐟窝内所有机台!(仍需预约!)
					</text>
				</view>
				<view>
					<view class="goods-card" @click="makeOrder('weekly')">
						<view class="goods-content">
							<view class="goods-info">
								<text class="goods-detail">大周卡</text>
								<uni-icons v-if="types.weekly" type="cart-filled" size="35"></uni-icons>
								<uni-icons v-else type="cart" size="35"></uni-icons>
							</view>
							<view class="goods-price">
								<view class="price-amount">
									<text>{{priceList.weekly / 100}}</text>
									<text>元/周</text>
								</view>
							</view>
						</view>
					</view>

					<view class="goods-card" @click="makeOrder('monthly')">
						<view class="goods-content">
							<view class="goods-info">
								<text class="goods-detail">大月卡</text>
								<uni-icons v-if="types.monthly" type="cart-filled" size="35"></uni-icons>
								<uni-icons v-else type="cart" size="35"></uni-icons>
							</view>
							<view class="goods-price">
								<view class="price-amount">
									<text>{{priceList.monthly / 100}}</text>
									<text>元/月</text>
								</view>
							</view>
						</view>
					</view>
				</view>
			</view>
		</view>

		<!--DEBUG-->
		<uni-group v-if="res.role.includes('admin')" title="debug" class="glass-card">
			<template v-slot:title>
				<view style="display: flex; justify-content: space-between; align-items: center;">
					<uni-section title="Debug" type="line"></uni-section>
					<switch @change="switchChange"></switch>
				</view>
			</template>
			<view v-if="debug">
				<text>
					{{Data}}
					{{orderID}}
				</text>
			</view>
		</uni-group>

		<view class="footer">
			<view class="price-summary">
				<text class="detail">当前价格</text>
				<text class="price-amount">{{totalFee / 100}}¥</text>
			</view>
			<view class="submit-button" @click="submit()">
				<text>确认购买</text>
			</view>
		</view>
	</view>
</template>

<script lang="ts" setup>
	import { reactive, ref, computed, onMounted, toRaw } from 'vue'
	// 引入 uni-id-pages 的 store
	import { store } from '@/uni_modules/uni-id-pages/common/store.js'
	const todo = uniCloud.importObject('todo')
	const orderHandler = uniCloud.importObject('orderHandler')
	const res = uniCloud.getCurrentUserInfo('uni_id_token')
	// 使用计算属性获取用户信息
	const userInfo = computed(() => store.userInfo)
	//Debug
	const debug = ref(false)
	function switchChange(e) {
		console.log('switch1 发生 change 事件，携带值为', e.detail.value)
		debug.value = e.detail.value
	}


	const segmentedValues = ['鱼窝歇脚卡', '周卡/月卡'];
	const segmentedCurrent = ref(0);
	const rechargeItems = ref(0);
	const totalFee = ref(0)
	const types = reactive({
		member: false,
		weekly: false,
		monthly: false
	})
	function initTypes() {
		types.member = false
		types.weekly = false
		types.monthly = false
	}
	const priceList = ref({
		member: 1500,
		weekly: 15800,
		monthly: 35800
	})
	const Data = reactive({
		user_id: res.uid,
		type: "",
		status: -1
	})

	function onSegmentChange(e) {
		if (rechargeItems.value !== e.currentIndex) {
			rechargeItems.value = e.currentIndex
		}
	}
	const orderID = ref("")
	//生成订单
	async function makeOrder(values : String) {
		switch (values) {
			case "member":
				initTypes()
				types.member = true
				Data.type = "member"
				console.log(toRaw(types))
				try {
					const result = await orderHandler.GennerateVipOrder(res.uid, Data)
				} catch (e) { }
				totalFee.value = priceList.value.member
				break;
			case "weekly":
				initTypes()
				types.weekly = true
				Data.type = "weekly"
				console.log(toRaw(types))
				try {
					const result = await orderHandler.GennerateVipOrder(res.uid, Data)
				} catch (e) { }
				totalFee.value = priceList.value.weekly
				break;
			case "monthly":
				initTypes()
				types.monthly = true
				Data.type = "monthly"
				console.log(toRaw(types))
				try {
					const result = await orderHandler.GennerateVipOrder(res.uid, Data)
				} catch (e) { }
				totalFee.value = priceList.value.monthly
				break;
		}
		searchOrder ()
	}
	async function searchOrder (){
		try{
			const result = await orderHandler.SearchVipOrder(res.uid)
			orderID.value = result.data[0]._id
		}catch(e){ }
	} 
	async function submit() {
		if (Data.type != "") {
			try {
				const result = await orderHandler.CalculateVipOder(res.uid)
				if(result){
					let options = {
						total_fee: totalFee.value, // 支付金额，单位分 100 = 1元
						type: "vip", // 支付回调类型
						order_no: orderID.value, // 业务系统订单号
						description: "充值或续费鱼窝会员项目", // 支付描述
					};
					let optionsStr = encodeURI(JSON.stringify(options));
					uni.navigateTo({
						url:`/pages/pay/pay?options=${optionsStr}`
					});
				}
			} catch (e) { }
		}else{
			uni.showToast({
				title : "请选择会员类型",
				icon : "error"
			})
		}
	}
	/* let options = {
		total_fee: 1, // 支付金额，单位分 100 = 1元
		type: "recharge", // 支付回调类型
		order_no: "", // 业务系统订单号
		// 插件支付单号
		description: "会员充值业务", // 支付描述
	};
	function submit() {
		orderHandle()
	}
	function orderHandle() {
		let optionsStr = encodeURI(JSON.stringify(options));
		console.log(options)
		uni.navigateTo({
			url: `/pages/pay/pay?options=${optionsStr}`
		});
	} */
	onMounted(() => {
		initTypes()
	})
</script>

<style scoped>
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

	.glass-card:active {
		transform: translateY(2px);
		box-shadow: 0 4px 16px rgba(31, 38, 135, 0.08);
	}


	/* 用户信息卡片 */
	.user-info-card {
		margin-bottom: 24px;
	}

	.user-info-header {
		display: flex;
		align-items: center;
		padding: 8px;
	}

	.avatar-container {
		width: 160rpx;
		height: 160rpx;
		border-radius: 50%;
		overflow: hidden;
		border: 2px solid #fff;
		box-shadow: 0 4px 12px rgba(255, 193, 7, 0.3);
		margin-right: 16px;
	}

	.user-details {
		display: flex;
		flex-direction: column;
		flex: 1;
	}

	.nickname {
		font-size: 36rpx;
		font-weight: bold;
		margin-bottom: 8px;
		color: #333;
	}

	.user-id {
		font-size: 24rpx;
		color: #6b7280;
		background: rgba(243, 244, 246, 0.7);
		padding: 4px 10px;
		border-radius: 12px;
		align-self: flex-start;
	}

	.segmented-control-container {
		width: 100%;
		margin-bottom: 12px;
	}

	.recharge-info-header {
		display: flex;
		align-items: center;
		margin-bottom: 12px;
		padding-bottom: 8px;
		border-bottom: 1px solid rgba(0, 0, 0, 0.08);
	}

	.recharge-info-title {
		font-size: 16px;
		font-weight: 600;
		color: #333333;
		margin-left: 8px;
	}

	/* 底部区域 */
	.footer {
		position: fixed;
		bottom: 0;
		left: 0;
		width: 100%;
		background: rgba(255, 255, 255, 0.8);
		backdrop-filter: blur(10px);
		padding: 10px 0;
		border-top: 1px solid rgba(229, 231, 235, 0.8);
		box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.05);
		z-index: 100;
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

	.submit-button {
		background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
		border-radius: 8px;
		width: 80%;
		height: 50px !important;
		min-height: 45px;
		line-height: 45px;
		display: flex;
		justify-content: center;
		align-items: center;
		margin: 0 auto;
		font-weight: bold;
		color: white;
		font-size: 15px;
		box-shadow: 0 4px 12px rgba(249, 203, 20, 0.3);
		transition: all 0.3s;
		position: relative;
		overflow: hidden;
		box-sizing: border-box;
		padding: 0;
	}

	.submit-button:active {
		transform: scale(0.98);
		box-shadow: 0 2px 6px rgba(249, 203, 20, 0.3);
	}

	.submit-button::after {
		content: "";
		position: absolute;
		top: 0;
		left: -100%;
		width: 100%;
		height: 100%;
		background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
		transition: 0.5s;
	}

	.submit-button:active::after {
		left: 100%;
	}

	/*说明区域*/
	.tips-container {
		padding: 0 20rpx;
		margin: 20rpx 0;
	}

	.tips {
		font-size: 20rpx;
		color: gray;
	}

	/*商品卡片*/
	.goods-card {
		background: rgba(255, 255, 255, 0.7);
		backdrop-filter: blur(10px);
		border-radius: 20px;
		box-shadow: 0 8px 32px rgba(31, 38, 135, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.18);
		overflow: hidden;
		padding: 16px;
		margin-bottom: 20px;
		transition: transform 0.3s ease, box-shadow 0.3s ease;
		height: 160rpx;
	}

	.goodsgoods-card:active {
		transform: translateY(2px);
		box-shadow: 0 4px 16px rgba(31, 38, 135, 0.08);
	}

	.goods-content {
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		height: 100%;
	}

	.goods-price {
		display: flex;
		justify-content: flex-end;
		padding: 0 20rpx;
	}

	.goods-info {
		display: flex;
		justify-content: space-between;
		padding: 0 10rpx;
	}

	.goods-detail {
		font-size: 40rpx;
		font-weight: bold;
	}

	@media (prefers-color-scheme: dark) {
		.container {
			padding: 20px;
			background: rgb(0, 0, 0);
			min-height: 100vh;
			position: relative;
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

		.footer {
			position: fixed;
			bottom: 0;
			left: 0;
			width: 100%;
			background: rgb(22, 22, 24);
			backdrop-filter: blur(10px);
			padding: 10px 0;
			border-top: 1px solid rgb(51, 49, 50);
			box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.05);
			z-index: 100;
		}

		.nickname {
			font-size: 36rpx;
			font-weight: bold;
			margin-bottom: 8px;
			color: white;
		}

		.recharge-info-title {
			font-size: 16px;
			font-weight: 600;
			color: lightgray;
			margin-left: 8px;
		}

		.user-id {
			font-size: 24rpx;
			color: lightgray;
			background: rgb(59, 59, 61);
			padding: 4px 10px;
			border-radius: 12px;
			align-self: flex-start;
		}

		.tips {
			font-size: 20rpx;
			color: lightgray;
		}

		.goods-card {
			background: rgb(22, 22, 24);
			backdrop-filter: blur(10px);
			border-radius: 20px;
			box-shadow: 0 8px 32px rgba(31, 38, 135, 0.1);
			border: 1px solid rgba(255, 255, 255, 0.18);
			overflow: hidden;
			padding: 16px;
			margin-bottom: 20px;
			transition: transform 0.3s ease, box-shadow 0.3s ease;
			height: 160rpx;
		}

		.goods-content {
			display: flex;
			flex-direction: column;
			justify-content: space-between;
			height: 100%;
		}

		.goods-price {
			display: flex;
			justify-content: flex-end;
			padding: 0 20rpx;
		}

		.goods-info {
			display: flex;
			justify-content: space-between;
			padding: 0 10rpx;
		}

		.goods-detail {
			font-size: 40rpx;
			font-weight: bold;
			color: white
		}
	}
</style>