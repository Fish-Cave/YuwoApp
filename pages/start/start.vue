<template>
	<view class="container">
		<!--这一块是显示当前预约的机台信息的卡片，信息应该是从signIn页面传进来的，我还没弄-->
		<view class="glass-card active-card">
			<view class="card-header">
				<view>
					<text style="font-size: 60rpx; font-weight: bold;">{{showDetail.machineName}}</text>
				</view>
				<view class="status-badge">
					<text>待使用</text>
				</view>
			</view>
			<view class="divider"></view>
			<view class="order-info">
				<view class="info-row">
					<text class="info-label">预约时间:</text>
					<uni-dateformat class="info-value" :date="showDetail.startTime"></uni-dateformat>
				</view>
				<view class="info-row">
					<text class="info-label">订单号:</text>
					<text class="info-value">{{Data.reservationid}}</text>
				</view>
			</view>
		</view>

		<view class="glass-card" v-if="showDetail.isPlay">
			<view class="card-content">
				<view class="card-header">
					<view class="card-title">
						<text>确定还是不玩机台吗?</text>
					</view>
				</view>
				<view class="divider" style="background-color: rgb(235, 238, 245);"></view>
				<view>
					<uni-segmented-control :values="segmentedValues" :current="1" style-type="button"
						active-color="#f9cb14" @clickItem="onclickItem"></uni-segmented-control>
					<view style="padding-top: 20rpx;">
						<text v-if="Data.isPlay == false" class="tips">
							如果中途反悔，想要升舱，需要暂停签到之后重新签到！
						</text>
					</view>
				</view>
			</view>
		</view>

		<view class="glass-card">
			<view class="card-content">
				<view class="card-header">
					<view style="display: flex; justify-content: center;align-items: center;">
						<uni-icons type="info" size="30"></uni-icons>
						<text class="card-title">计费说明</text>
					</view>
					<view>
						<text>详情</text>
					</view>
				</view>
				<view style="display: flex; flex-direction: column;">
					<text class="tips">1、按分钟计费{{singlePrice}}元/半小时,最高{{overnightPrice}}元</text>
					<text class="tips">2、最低计费时长为30分钟/半小时</text>
					<text class="tips">3、使用结束后通过微信结账</text>
					<text class="tips">4、使用过程中可随时结束</text>
				</view>
			</view>
		</view>


		<!--支付授权这边我觉得没问题，可能字体要调一下-->
		<view class="glass-card">
			<view class="card-content">
				<uni-row>
					<uni-col :span="4">
						<view style="margin-top: 20rpx;">
							<uni-icons type="wallet" size="30"></uni-icons>
						</view>
					</uni-col>
					<uni-col :span="20">
						<uni-title type="h3" title="微信支付授权"></uni-title>
						<text class="tips">开始使用前需要获取微信支付授权，结束后将自动完成扣款。</text>
					</uni-col>
				</uni-row>
			</view>
		</view>

		<uni-group title="debug" class="glass-card">
			<template v-slot:title>
				<view style="display: flex; justify-content: space-between; align-items: center;">
					<uni-section title="Debug" type="line"></uni-section>
					<switch @change="switchChange"></switch>
				</view>
			</template>
			<view v-if="debug">
				<text>
					{{Data}}
				</text>
			</view>
		</uni-group>


		<!--按钮看着调吧-->
		<view class="footer">
			<view class="button-container">
				<view class="submit-button " @click="submit">
					<text>确认开始使用</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup lang="ts">
	import dayjs from 'dayjs';
	import { onMounted, reactive, getCurrentInstance, ref } from 'vue';
	const res = uniCloud.getCurrentUserInfo('uni_id_token')
	const todo = uniCloud.importObject('todo')
	//Debug
	const debug = ref(false)
	function switchChange(e) {
		console.log('switch1 发生 change 事件，携带值为', e.detail.value)
		debug.value = e.detail.value
	}

	interface signInData {
		"reservationid" : string,
		"userid" : string,
		"isPlay" : boolean,
		"isOvernight" : boolean,
		"starttime" : number,
	}
	const segmentedValues = ["玩!", "不玩!"]
	const Data : signInData = reactive({
		"reservationid": "",
		"userid": res.uid,
		"isPlay": true,
		"isOvernight": false,
		"starttime": 0,
	})
	const showDetail = reactive({
		machineName: "Test",
		startTime: "",
		isPlay: false,
	})
	//这个数组是计费说明显示的内容
	const listData = reactive([
		"按分钟计费，5元/小时",
		"最低计费时长为30分钟",
		"使用结束后将通过微信自动扣款",
		"使用过程中可随时结束",
	])

	function onclickItem(e) {
		if (e.currentIndex == 0) {
			Data.isPlay = true
		} else (
			Data.isPlay = false
		)
	}

	async function submit() {
		console.log(res.uid)
		try {
			const result = await todo.SignIn_Search(res.uid)
			if (result.data.length == 0) {
				console.log(result.data[0])
				pushData()
			} else if (result.data.length > 0) {
				uni.showToast({
					title: "同时只能签到一次!",
					icon: "error"
				})
			}
		} catch { }
	}

	async function pushData() {
		try {
			Data.starttime = dayjs().unix() * 1000
			console.log(Data.starttime)
			if (Data.reservationid != "") {
				const res = await todo.SignIn_Add(Data)
				console.log(res)
				updateReservation(Data.reservationid, 4)
				uni.redirectTo({
					url: "/pages/using/using"
				})
			} else {
				uni.showToast({
					icon: "error",
					title: "未找到订单"
				})
			}
		} catch { }
	}

	async function updateReservation(content : string, status : number) {
		try {
			const res = await todo.Reservation_Update(content, status)
			console.log(res)
		} catch { }
	}

	const singlePrice = ref(5)
	const overnightPrice = ref(50)
	const membershipType = ref("")
	async function getMembershipStatus() {
		try {
			const userInfo = uniCloud.getCurrentUserInfo();
			if (!userInfo || !userInfo.uid) {
				console.log('未登录或无法获取用户ID');
				membershipType.value = "none";
				return;
			}
	
			// 调用云对象方法获取会员信息
			const result = await todo.getUserMembershipInfo(userInfo.uid);
			console.log("会员信息查询结果:", result);
	
			if (result) {
				// 检查包周/月会员
				if (result.subscriptionPackage && result.subscriptionPackage.length > 0) {
					membershipType.value = "weekly_monthly";
					console.log('用户拥有包周/月会员');
				}
				// 检查音游会员
				else if (result.membership && result.membership.length > 0) {
					membershipType.value = "music_game";
					console.log('用户拥有音游会员');
				}
				// 无会员
				else {
					membershipType.value = "none";
					console.log('用户没有会员');
				}
				setPriceByMembership()
			} else {
				membershipType.value = "none";
				console.log('获取会员信息失败或用户没有会员');
			}
		} catch (error) {
			console.error("获取会员信息失败:", error);
			membershipType.value = "none"; // 错误时默认为非会员
		}
	}
	
	function setPriceByMembership() {
		switch (membershipType.value) {
			case "weekly_monthly":
				singlePrice.value = 0
				overnightPrice.value = 0
				break;
			case "music_game":
				// 当 expression 表达式值 等于 value2 时执行该代码块
				singlePrice.value = 4
				overnightPrice.value = 40
				break;
			default:
				// 如果上面的 case 后的 表达式值 都不匹配 , 则执行该代码块
				singlePrice.value = 5
				overnightPrice.value = 50
				break;
		}
	}
	onMounted(() => {
		const instance = getCurrentInstance().proxy
		const eventChannel = instance.getOpenerEventChannel();
		getMembershipStatus()
		eventChannel.on('acceptDataFromOpenerPage', function (data : any) {
			console.log('acceptDataFromOpenerPage', data)
			Data.reservationid = data.reservationID
			Data.isPlay = data.isPlay
			Data.isOvernight = data.isOvernight
			showDetail.isPlay = data.isPlay
			showDetail.machineName = data.machineName
			showDetail.startTime = data.startTime
		})
	})
</script>

<style>
	/* 全局容器样式 */
	.container {
		padding: 30rpx;
		background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
		min-height: 100vh;
		box-sizing: border-box;
		padding-bottom: 200rpx;
		/* 为底部按钮留出空间 */
	}

	/* 玻璃态卡片 */
	.glass-card {
		background: rgba(255, 255, 255, 0.7);
		backdrop-filter: blur(10px);
		border-radius: 30rpx;
		box-shadow: 0 8rpx 32rpx rgba(31, 38, 135, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.18);
		overflow: hidden;
		margin-bottom: 30rpx;
		transition: transform 0.3s ease, box-shadow 0.3s ease;
		padding: 16rpx;
	}

	.glass-card:active {
		transform: translateY(2rpx);
		box-shadow: 0 4rpx 16rpx rgba(31, 38, 135, 0.08);
	}

	/* 活动卡片样式 - 橙色背景 */
	.active-card {
		background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
		color: white;
		padding: 30rpx;
	}

	.divider {
		height: 2rpx;
		background-color: rgba(255, 255, 255, 0.3);
		margin: 20rpx 0;
	}

	/* 订单信息样式 */
	.order-info {
		margin-top: 20rpx;
	}

	.info-row {
		display: flex;
		justify-content: space-between;
		margin-bottom: 15rpx;
	}

	.info-label {
		font-size: 24rpx;
		opacity: 0.9;
	}

	.info-value {
		font-size: 28rpx;
		font-weight: 500;
	}

	/* 卡片内容样式 */
	.card-content {
		padding: 15rpx;
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20rpx;
	}

	.card-title {
		font-size: 32rpx;
		font-weight: bold;
		color: #333;
	}

	.rate-info {
		font-size: 24rpx;
		color: #666;
		background: rgba(249, 203, 20, 0.1);
		padding: 4rpx 16rpx;
		border-radius: 20rpx;
	}

	/* 价格容器样式 */
	.price-container {
		display: flex;
		align-items: baseline;
	}

	.price-amount {
		font-size: 48rpx;
		font-weight: bold;
		background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		margin-right: 10rpx;
	}

	.price-note {
		font-size: 24rpx;
		color: #4cd964;
	}

	/* 使用记录样式 */
	.usage-record {
		margin-top: 10rpx;
	}

	.record-item {
		display: flex;
		align-items: center;
		margin-bottom: 20rpx;
	}

	.record-icon {
		margin-right: 15rpx;
	}

	.record-info {
		display: flex;
		flex-direction: column;
	}

	.record-label {
		font-size: 28rpx;
		color: #333;
		margin-bottom: 5rpx;
	}

	.record-time {
		font-size: 24rpx;
		color: #666;
	}

	.record-divider {
		height: 1rpx;
		background-color: #eee;
		margin: 15rpx 0;
	}

	/* 机台使用状态样式 */
	.play-status {
		display: flex;
		align-items: center;
		background: rgba(249, 249, 249, 0.5);
		padding: 20rpx;
		border-radius: 15rpx;
		margin-top: 10rpx;
	}

	.play-status-text {
		font-size: 28rpx;
		margin-left: 15rpx;
	}

	/* Debug 样式 */
	.debug-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 20rpx 30rpx;
		border-bottom: 1px solid #eee;
	}

	.debug-content {
		padding: 20rpx 30rpx;
		font-size: 24rpx;
		color: #666;
		display: flex;
		flex-direction: column;
	}

	/* 底部按钮区域 */
	.footer {
		position: fixed;
		bottom: 0;
		left: 0;
		width: 100%;
		background: rgba(255, 255, 255, 0.8);
		backdrop-filter: blur(10px);
		padding: 20rpx 0;
		border-top: 1px solid rgba(229, 231, 235, 0.8);
		box-shadow: 0 -4rpx 12rpx rgba(0, 0, 0, 0.05);
		z-index: 100;
	}

	.button-container {
		padding: 0 30rpx;
	}

	.submit-button {
		background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
		border-radius: 16rpx;
		height: 90rpx;
		display: flex;
		justify-content: center;
		align-items: center;
		font-weight: bold;
		color: white;
		font-size: 30rpx;
		box-shadow: 0 4rpx 12rpx rgba(249, 203, 20, 0.3);
		margin-bottom: 20rpx;
		transition: all 0.3s;
	}

	.submit-button:active {
		transform: scale(0.98);
		box-shadow: 0 2rpx 6rpx rgba(249, 203, 20, 0.3);
	}

	.tips {
		font-size: 30rpx;
		color: gray;
		margin-top: 20rpx;
	}
	
	.status-badge {
		padding: 4px 10px;
		border-radius: 12px;
		font-size: 25rpx;
		font-weight: 600;
		background: rgba(255, 193, 7, 0.1);
		color: #f9cb14;
	}
</style>