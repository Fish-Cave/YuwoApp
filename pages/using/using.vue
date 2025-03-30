<template>
	<view class="container">
		<!-- 使用 v-if 来判断 Data 是否有数据，只渲染第一个数据项 -->
		<view v-if="Data && Data.length > 0" v-for="data in Data.slice(0,1)" :key="data._id">
			<!-- 当前预约的机台信息卡片 -->
			<view class="glass-card active-card">
				<view class="timer-container">
					<text class="timer-text">{{ elapsedTime }}</text>
					<text class="timer-label">使用时长</text>
				</view>
				<view class="divider"></view>
				<view class="order-info">
					<view class="info-row">
						<text class="info-label">机台名称</text>
						<text class="info-value">{{ reservationData.machineName ||'未知机台' }}</text>
					</view>
					<view class="info-row">
						<text class="info-label">预约类型</text>
						<text class="info-value">{{ isOvernight ? '过夜预约' : '普通预约' }}</text>
					</view>
					<view class="info-row">
						<text class="info-label">预约订单号</text>
						<text class="info-value">{{ data.reservationid }}</text>
					</view>
					<view class="info-row">
						<text class="info-label">签到订单号</text>
						<text class="info-value">{{ data._id }}</text>
					</view>
				</view>
			</view>

			<!-- 实时费用 -->
			<view class="glass-card">
				<view class="card-content">
					<view class="card-header">
						<text class="card-title">实时费用</text>
						<text class="rate-info">{{ displayRate }}</text>
					</view>
					<view class="price-container">
						<text class="price-amount">¥ {{ totalPrice }}</text>
						<text class="price-note" v-if="membershipType !== 'none'"></text>
					</view>
				</view>
			</view>

			<!-- 使用记录 -->
			<view class="glass-card">
				<view class="card-content">
					<view class="card-header">
						<text class="card-title">使用记录</text>
					</view>
					<view class="usage-record">
						<view class="record-item">
							<view class="record-icon">
								<uni-icons type="checkmarkempty" size="20" color="#4cd964"></uni-icons>
							</view>
							<view class="record-info">
								<text class="record-label">开始使用</text>
								<text class="record-time">{{ formatDate(data.starttime) }}</text>
							</view>
						</view>
						<view class="record-divider"></view>
						<view class="record-item">
							<view class="record-icon">
								<uni-icons type="circle" size="20" color="#f0ad4e"></uni-icons>
							</view>
							<view class="record-info">
								<text class="record-label">预计结束</text>
								<text class="record-time">{{ estimatedEndTime }}</text>
							</view>
						</view>
					</view>
				</view>
			</view>

			<!-- Debug 信息 -->
			<uni-group title="debug" class="glass-card">
				<template v-slot:title>
					<view style="display: flex; justify-content: space-between; align-items: center;">
						<uni-section title="Debug" type="line"></uni-section>
						<switch @change="switchChange"></switch>
					</view>
				</template>
				<view v-if="debug" class="debug-content">
					<text>预约信息</text>
					<text>{{Data}}</text>
					<text>会员类型: {{ membershipType }}</text>
					<text>单价{{singlePrice}}</text>
					<text>最高价格{{overnightPrice}}</text>
					<text>{{totalPrice}}</text>
					<text>isPlay {{isPlay}}</text>
					<text>isOvernight {{isOvernight}}</text>
					<text>endtime {{reservationData.endtime}}</text>
					<text>订单信息</text>
					<text>{{orderData}}</text>
				</view>
			</uni-group>
		</view>
		<view v-else>
			<view class="glass-card empty-card">
				<view class="empty-content">
					<uni-icons type="info" size="50" color="#bbb"></uni-icons>
					<text class="empty-text">暂无使用中的签到信息</text>
					<text class="empty-subtext">您可以返回首页进行预约</text>
				</view>
			</view>
		</view>
		<!-- 按钮 -->
		<view class="footer">
			<view class="button-container">
				<view class="submit-button" @click="submit">结束使用并支付</view>
				<uni-pay ref="pay"></uni-pay>
				<view class="help-button" @click="askForHelp">遇到问题</view>
			</view>
		</view>
	</view>
</template>


<script setup lang="ts">
	import dayjs from 'dayjs';
	import { onMounted, ref, onUnmounted, computed, toRaw, reactive } from 'vue' // 引入 onUnmounted 和 computed
	const todo = uniCloud.importObject('todo')
	const res = uniCloud.getCurrentUserInfo('uni_id_token')
	const membershipType = ref("none"); // "none", "music_game", "weekly_monthly"
	const isOvernight = ref(false)
	const isPlay = ref(true)
	interface signInData {
		"_id" : string
		"reservationid" : string
		"isPlay" : boolean
		"isOvernight" : boolean
		"starttime" : number
		"endtime" : number
	}
	interface billInformation {
		"user_id" : string
		"reservation_id" : string
		"total_fee" : number
		"singlePrice" : number
		"status" : string
		"starttime" : number
		"endtime" : number
	}

	const Data = ref<signInData[]>([])
	const machineName = ref("")
	const orderData : billInformation = reactive({
		"user_id": uniCloud.getCurrentUserInfo('uni_id_token').uid,
		"reservation_id": "",
		"total_fee": 0,
		"singlePrice": 0,
		"status": 0,
		"starttime": 0,
		"endtime": 0
	})

	//价格相关
	const singlePrice = ref(5)
	const totalPrice = ref(0) // 总价，实时更新
	const overnightPrice = ref(50)
	// 计算属性
	const displayRate = computed(() => {
		if (membershipType.value === "weekly_monthly") {
			return "包周/月会员免费";
		} else if (membershipType.value === "music_game") {
			if (isOvernight.value) {
				return "音游会员: 包夜40元";
			}
			if (isPlay.value) {
				return "音游会员: 4元/半小时";
			}
			return "音游会员: 不游玩机台0元/半小时";
		} else {
			if (isOvernight.value) {
				return "普通用户: 包夜50元";
			}
			if (isPlay.value) {
				return "普通用户: 5元/半小时";
			}
			return "普通用户: 不游玩机台1元/半小时";
		}
	});

	//时间相关
	const startTime = ref<number | null>(null) // 开始时间戳，从 Data 中获取
	const elapsedTime = ref("00:00:00") // 格式化后的已用时间
	const estimatedEndTime = computed(() => {
		// 如果是过夜预约，预计结束时间是开始时间+10小时（22:00-08:00）
		if (isOvernight.value) {
			return formatDate(Data.value[0].starttime + 10 * 60 * 60 * 1000);
		} else {
			//如果订单中存在结束时间，就显示预计结束时间
			if (reservationData.endtime != 0) {
				return formatDate(reservationData.endtime + 2 * 60 * 60 * 1000);
			}
			// 默认显示开始时间+2小时
			return formatDate(Data.value[0].starttime + 2 * 60 * 60 * 1000);
		}
	});
	let timerInterval : number | null = null // 定时器 interval id

	//Debug
	const debug = ref(false)
	function switchChange(e) {
		console.log('switch1 发生 change 事件，携带值为', e.detail.value)
		debug.value = e.detail.value
	}
	let options = {
		total_fee: 1, // 支付金额，单位分 100 = 1元
		type: "goods", // 支付回调类型
		order_no: "", // 业务系统订单号
		// 插件支付单号
		description: "签到结算", // 支付描述
	};
	async function submit() {
		//const res = await todo.SignIn_Settle(Data.value[0]._id, Data.value[0].reservationid)
		orderData.endtime = dayjs().unix() * 1000
		//options.total_fee = orderData.total_fee
		await todo.Order_Add(orderData)
		orderHandle()
	}
	async function orderHandle() {
		try {
			const result = await todo.Order_Get(orderData.user_id)
			console.log(result.data[0])
			options.order_no = toRaw(result.data[0]._id)
			let optionsStr = encodeURI(JSON.stringify(options));
			console.log(options)
			uni.navigateTo({
				url: `/pages/pay/pay?options=${optionsStr}`
			});
		} catch (e) { }
	}
	function askForHelp() {
		uni.showToast({
			title: "遇到问题 (功能待完善)",
			icon: 'none'
		})
		// TODO: 打开客服/帮助页面或弹窗
	}
	//日期格式化
	function formatDate(timestamp : number) {
		if (!timestamp) return "未知时间";
		return dayjs(timestamp).format('YYYY-MM-DD HH:mm');
	}
	//通过会员种类获取价格
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
				orderData.singlePrice = singlePrice.value * 100
				break;
			case "music_game":
				// 当 expression 表达式值 等于 value2 时执行该代码块
				singlePrice.value = 4
				overnightPrice.value = 40
				orderData.singlePrice = singlePrice.value * 100
				break;
			default:
				// 如果上面的 case 后的 表达式值 都不匹配 , 则执行该代码块
				singlePrice.value = 5
				overnightPrice.value = 50
				orderData.singlePrice = singlePrice.value * 100
				break;
		}
	}

	async function searchSignin() {
		try {
			const result = await todo.SignIn_Search(res.uid)
			console.log("签到数据:", result.data)
			if (result.data && result.data.length > 0) {
				Data.value = result.data
				isPlay.value = Data.value[0].isPlay
				isOvernight.value = Data.value[0].isOvernight
				getReservationData(Data.value[0].reservationid)
				startTime.value = result.data[0].starttime; // 从接口获取开始时间

				orderData.starttime = startTime.value
				orderData.reservation_id = Data.value[0].reservationid
				if (startTime.value && startTime.value !== 0) {
					startTimer(); // 开始计时
				}
			} else {
				Data.value = []; // 清空数据，显示暂无信息
				stopTimer(); // 停止计时器，防止意外运行
			}
		} catch (e) {
			console.error("获取签到信息失败:", e)
			uni.showToast({
				title: "获取使用信息失败",
				icon: 'none'
			})
			Data.value = []; // 出错时也清空数据
			stopTimer(); // 停止计时器，防止意外运行
		}
	}

	const reservationData = reactive({
		"endtime": 0,
		"machineName": "",
	})
	async function getReservationData(content : string) {
		const res = await todo.SearchReservationInfo(content)
		reservationData.machineName = res.data[0].machineId[0].name
		reservationData.endtime = res.data[0].endTime
	}

	function startTimer() {
		if (startTime.value === null || startTime.value === 0) return; // 确保有开始时间

		timerInterval = setInterval(() => {
			const now = Date.now();
			const elapsedMilliseconds = now - startTime.value;
			const elapsedSeconds = Math.floor(elapsedMilliseconds / 1000);
			// 更新显示的时间
			elapsedTime.value = formatTime(elapsedSeconds);

			// 计算费用
			calculateFee(elapsedMilliseconds);
		}, 1000); // 每秒更新一次
	}

	function calculateFee(elapsedMilliseconds : number) {
		// 如果是周/月卡会员，费用为0
		if (membershipType.value == "weekly_monthly") {
			totalPrice.value = 0;
			orderData.total_fee = totalPrice.value * 100
			return;
		}
		// 计算已用时间（分钟）
		const elapsedMinutes = elapsedMilliseconds / (1000 * 60);
		// 向上取整，不满半小时也算半小时
		const halfHourUnits = Math.ceil(elapsedMinutes / 30);
		// 是否过夜预约
		//const isOvernight = reservationData.value.isOvernight;
		if (isOvernight.value) {
			// 过夜预约使用固定价格
			totalPrice.value = isPlay.value ? overnightPrice.value : (overnightPrice.value * 0.2);
			orderData.total_fee = totalPrice.value * 100
			// 不玩机台按20%收费
		} else {
			//普通预约按游玩时间计算，先确认是否游玩机台
			if (isPlay.value) {
				// 普通预约按时间计费
				if (membershipType.value == "music_game") {
					// 音游会员，每半小时4元，当日封顶40元
					const baseRate = singlePrice.value; // 不玩机台每半小时0元
					const calculatedPrice = halfHourUnits * baseRate;
					// 如果玩机台且超过封顶价格，使用封顶价格
					if (calculatedPrice > overnightPrice.value) {
						totalPrice.value = overnightPrice.value;
						orderData.total_fee = totalPrice.value * 100
					} else {
						totalPrice.value = calculatedPrice;
						orderData.total_fee = totalPrice.value * 100
					}

				} else if (membershipType.value == "none") {
					// 非会员，每半小时5元，当日封顶50元
					const baseRate = singlePrice.value; // 不玩机台每半小时1元
					const calculatedPrice = halfHourUnits * baseRate;
					// 如果玩机台且超过封顶价格，使用封顶价格
					if (calculatedPrice > overnightPrice.value) {
						totalPrice.value = overnightPrice.value;
						orderData.total_fee = totalPrice.value * 100
					} else {
						totalPrice.value = calculatedPrice;
						orderData.total_fee = totalPrice.value * 100
					}
				}

			} else {
				if (membershipType.value == "music_game") {
					// 音游会员，每半小时4元，当日封顶40元
					const baseRate = 0; // 不玩机台每半小时0元
					const calculatedPrice = halfHourUnits * baseRate;
					totalPrice.value = calculatedPrice;
				} else if (membershipType.value == "none") {
					// 非会员，每半小时5元，当日封顶50元
					const baseRate = 1; // 不玩机台每半小时1元
					const calculatedPrice = halfHourUnits * baseRate;
					totalPrice.value = calculatedPrice;
				}
			}
		}
		// 保留两位小数
		totalPrice.value = Math.round(totalPrice.value * 100) / 100;
	}


	function stopTimer() {
		if (timerInterval) {
			clearInterval(timerInterval);
			timerInterval = null;
		}
	}

	function formatTime(totalSeconds : number) : string {
		const hours = Math.floor(totalSeconds / 3600);
		const minutes = Math.floor((totalSeconds % 3600) / 60);
		const seconds = totalSeconds % 60;

		const formattedHours = String(hours).padStart(2, '0');
		const formattedMinutes = String(minutes).padStart(2, '0');
		const formattedSeconds = String(seconds).padStart(2, '0');

		return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
	}

	onMounted(() => {
		searchSignin()
		getMembershipStatus()
		console.log(Data)
	})

	onUnmounted(() => {
		stopTimer(); // 组件卸载时停止定时器，避免内存泄漏
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

	/* 计时器样式 */
	.timer-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		margin-bottom: 20rpx;
	}

	.timer-text {
		font-size: 80rpx;
		font-weight: bold;
		letter-spacing: 2rpx;
		text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.1);
	}

	.timer-label {
		font-size: 28rpx;
		margin-top: 10rpx;
		opacity: 0.9;
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
		padding: 30rpx;
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

	/* 空状态样式 */
	.empty-card {
		padding: 60rpx 30rpx;
	}

	.empty-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}

	.empty-text {
		font-size: 32rpx;
		color: #666;
		margin-top: 30rpx;
	}

	.empty-subtext {
		font-size: 24rpx;
		color: #999;
		margin-top: 10rpx;
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

	.help-button {
		background: #f1f1f1;
		border-radius: 16rpx;
		height: 80rpx;
		display: flex;
		justify-content: center;
		align-items: center;
		color: #666;
		font-size: 28rpx;
		transition: all 0.3s;
	}

	.help-button:active {
		background: #e0e0e0;
	}
</style>