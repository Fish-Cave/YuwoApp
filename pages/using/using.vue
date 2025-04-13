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
				<view v-if="(startDay != nowDay) && !isOvernight">
					<view class="divider"></view>
					<view style="display: flex;justify-content: center;">
						<text class="tips">当前签到已经跨日,结算时需要补上包夜费用</text>
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
			<uni-group v-if="res.role.includes('admin')" title="debug" class="glass-card">
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
					<text>是否为闲时: {{isFree}}</text>
					<text>签到开始日期: {{startDay}}</text>
					<text>当前日期: {{nowDay}}</text>
					<text>预约订单号和签到订单号</text>
					<text>{{reservationID}} {{signinID}}</text>
				</view>
			</uni-group>
		</view>
		<view v-else>
			<!--预计修改为签到记录-->
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
				<view v-if="false" class="help-button" @click="askForHelp">遇到问题</view>
			</view>
		</view>
	</view>
</template>


<script setup lang="ts">
	import dayjs from 'dayjs';
	// 引入 onUnmounted 和 computed
	import { onMounted, ref, onUnmounted, computed, toRaw, reactive } from 'vue'
	import isFreeDay from '@/modules/isFreeDay.ts'
	import holiday2025 from '@/static/holiday/2025.json'

	const todo = uniCloud.importObject('todo')
	const siginHandler = uniCloud.importObject('signinHandler')
	const reservationHandler = uniCloud.importObject('reservationHandler')
	const orderHandler = uniCloud.importObject('orderHandler')
	const res = uniCloud.getCurrentUserInfo('uni_id_token')

	const membershipType = ref("none"); // "none", "music_game", "weekly_monthly"
	const isOvernight = ref(false)
	const isPlay = ref(true)

	// 跨日签到相关
	const startDay = ref("")
	const nowDay = ref("")

	//定义要用到的接口
	interface signInData {
		"_id" : string
		"reservationid" : string
		"isPlay" : boolean
		"isOvernight" : boolean
		"starttime" : number
		"endtime" : number
	}
	//新的付费订单逻辑不在该页面生成订单
	//疑似无用
	/*
	interface billInformation {
		"user_id" : string
		"reservation_id" : string
		"total_fee" : number
		"singlePrice" : number
		"status" : number
		"starttime" : number
		"endtime" : number
	}
	*/


	interface priceList {
		"_id" : string;
		"price" : number;
		"noplayprice" : number
	}
	const Data = ref<signInData[]>([])
	const machineName = ref("")

	//价格相关
	const isFree = ref(true)
	const pricelist = ref<priceList[]>([])
	const singlePrice = ref(5)
	const overnightPrice = ref(50)
	const noplayprice = ref(1)
	const totalPrice = ref(0) // 总价,该价格实际为预计价格,具体价格计算在后端进行
	//const today = ref(0)

	// 显示费用信息
	const displayRate = computed(() => {
		if (membershipType.value === "weekly_monthly") {
			return "包周/月会员免费";
		} else if (membershipType.value === "music_game" && isPlay.value == false) {
			return "鱼窝歇脚卡休息免费";
		} else {
			if (isOvernight.value) {
				if (isFree.value) {
					return "闲时通票30元";
				} else {
					return "忙时通票50元";
				}
			}
			if (isPlay.value) {
				if (isFree.value) {
					return "闲时3元/半小时";
				} else {
					return "忙时5元/半小时";
				}
			}
			return "不游玩机台1元/半小时";
		}
	});

	//价格应当依据 签 到 开 始 的时间来确定
	async function getPriceList(startTime : number) {
		try {
			//const timestamp = dayjs().unix() * 1000
			const now = dayjs(startTime + (86400 * 1000)).format('YYYY-MM-DD')
			console.log(now)
			const result = holiday2025.days.find(data => data.date == now)
			console.log(result)
			//判断签到当天的隔一天是否是法定节假日
			if (result?.isOffDay) {
				//如果隔一天是法定节假日按照忙时定价
				isFree.value = false
				const result = await todo.GetPriceInfoByWeekdays(0)
				pricelist.value = result.data
				singlePrice.value = toRaw(pricelist.value[0]).price
				noplayprice.value = toRaw(pricelist.value[0]).noplayprice
				overnightPrice.value = toRaw(pricelist.value[1]).price
			} else if (result?.isOffDay == false) {
				//如果隔一天是调整后的工作日按照闲时定价
				isFree.value = true
				const result = await todo.GetPriceInfoByWeekdays(1)
				pricelist.value = result.data
				singlePrice.value = toRaw(pricelist.value[0]).price
				noplayprice.value = toRaw(pricelist.value[0]).noplayprice
				overnightPrice.value = toRaw(pricelist.value[1]).price
			} else {
				console.log("当前选择星期为" + dayjs().day())
				const now = dayjs().format('YYYY-MM-DD')
				//如果当天放假,按照忙时计费
				if (holiday2025.days.find(data => data.date == now)?.isOffDay) {
					const result = await todo.GetPriceInfoByWeekdays(0)
					pricelist.value = result.data
				} else {
					const weekday = dayjs().day()
					isFree.value = false
					if (0 < weekday && weekday < 5) {
						isFree.value = true
					}
					const result = await todo.GetPriceInfoByWeekdays(weekday)
					pricelist.value = result.data
				}
				//console.log(result.data)
				//console.log(toRaw(pricelist.value[0]))
				singlePrice.value = toRaw(pricelist.value[0]).price
				noplayprice.value = toRaw(pricelist.value[0]).noplayprice
				overnightPrice.value = toRaw(pricelist.value[1]).price
			}
		} catch (error) {
			console.error("获取价格信息失败", error);
		}
	}

	//时间相关
	const startTime = ref<number | null>(null) // 开始时间戳，从 Data 中获取
	const elapsedTime = ref("00:00:00") // 格式化后的已用时间
	//预计结束日期
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

	//付款结算逻辑
	const reservationID = ref("")
	const signinID = ref("")

	//付款订单相关
	const orderID = ref("")
	async function GetUnhandleOrder() {
		try {
			const result = await orderHandler.GetUnhandleOrder(res.uid)
			orderID.value = result.data[0]._id
			console.log("本次签到对应的订单ID为" + orderID.value)
		} catch (e) {

		}
	}

	async function submit() {
		// //const res = await todo.SignIn_Settle(Data.value[0]._id, Data.value[0].reservationid)
		// const result = await todo.Order_Get(res.uid)
		// console.log(result.data)
		// //options.total_fee = orderData.total_fee
		// if (result.data.length) {
		// 	orderHandle()
		// } else {
		// 	//await todo.Order_Add(orderData)
		// 	if (true) {
		// 		await todo.SignIn_Settle(Data.value[0]._id, Data.value[0].reservationid, res.uid)
		// 		uni.showToast({
		// 			title: "感谢使用"
		// 		})
		// 		uni.reLaunch({
		// 			url: "/pages/index/index"
		// 		})
		// 		console.log("success")
		// 		stopTimer();

		// 	} else {
		// 		orderHandle()
		// 	}
		// }
		console.log(membershipType.value)
		switch (membershipType.value) {
			case "weekly_monthly":
				//大月卡大周卡走零元逻辑
				console.log("大月卡大周卡")
				await monthlyOrder()
				break;
			case "music_game":
				console.log("鱼窝歇脚卡会员")
				if (!isPlay.value) {
					await monthlyOrder()
				} else {
					await updateOrder()
				}
				break;
			case "none":
				console.log("并非会员")
				await updateOrder()
				break;
			default:
				console.log("没有会员信息")
				uni.showToast({
					title: "神秘错误",
					icon: "error"
				})
				break;
		}
	}
	//非会员逻辑
	async function updateOrder() {
		try {
			console.log('updateOrder')
			const result = await orderHandler.UpdateOrder(res.uid, isPlay.value, isOvernight.value)
			console.log(typeof(result))
			if (result != null) {
				console.log('test')
				await orderHandle()
			}
		} catch (e) { }
	}
	//会员逻辑
	async function monthlyOrder() {
		try {
			console.log(reservationID.value + " " + signinID.value)
			const result = await orderHandler.SetFreePlayStatus(res.uid, isPlay.value)
			console.log(result)
			if (result) {
				const res = await Promise.all([
					Reservation_Update(reservationID.value, 2),
					SignIn_Update(signinID.value, 3)])
				if (res) {
					uni.switchTab({
						url: '/pages/signIn/signIn'
					})
				} else {
					uni.showToast({
						title: "未知错误,联系管理员",
						icon: "error"
					})
				}
			}

		} catch (e) { }
	}
	//修改预约订单状态 reservationID
	async function Reservation_Update(id : string, status : number) {
		try {
			const result = await reservationHandler.Reservation_Update(id, status)
			console.log(result)
		} catch (e) { }
	}
	//修改签到订单状态 signinID
	async function SignIn_Update(id : string, status : number) {
		try {
			const result = await siginHandler.SignIn_Update(id, status)
			console.log(result)
		} catch (e) { }
	}
	//修改为跳转支付相关
	async function orderHandle() {
		if (orderID.value != "") {
			let options = {
				total_fee: totalPrice.value * 100, // 支付金额，单位分 100 = 1元
				type: "goods", // 支付回调类型
				order_no: orderID.value, // 业务系统订单号
				description: "签到结算", // 描述
			};
			let optionsStr = encodeURI(JSON.stringify(options));
			try {
				const result = await Promise.all([
					Reservation_Update(reservationID.value, 5),
					SignIn_Update(signinID.value, 2)])
				if (result) {
					uni.redirectTo({
						url: `/pages/pay/pay?options=${optionsStr}`
					});
				}
			} catch (e) { }
		} else {
			uni.showToast({
				title : "未找到订单",
				icon : "error"
			})
		}
	}

	// 帮助
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

	//获取会员种类
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
				//setPriceByMembership()
			} else {
				membershipType.value = "none";
				console.log('获取会员信息失败或用户没有会员');
			}
		} catch (error) {
			console.error("获取会员信息失败:", error);
			membershipType.value = "none"; // 错误时默认为非会员
		}
	}
	//按照会员类型来设定价格，现已弃用
	/*
	function setPriceByMembership() {
			switch (membershipType.value) {
				case "weekly_monthly":
					singlePrice.value = 0
					overnightPrice.value = 0
					orderData.singlePrice = singlePrice.value * 100
					break;
				case "music_game":
					// 当 expression 表达式值 等于 value2 时执行该代码块
					singlePrice.value = 0
					if(isPlay.value){
						if(0<today.value&&today.value<5){
							singlePrice.value = 3
							overnightPrice.value = 30
						}else{
							singlePrice.value = 5
							overnightPrice.value = 50
						}	
					}
					orderData.singlePrice = singlePrice.value * 100
					break;
				default:
					// 如果上面的 case 后的 表达式值 都不匹配 , 则执行该代码块
					singlePrice.value = 1
					if(isPlay.value){
						if(0<today.value&&today.value<5){
							singlePrice.value = 3
							overnightPrice.value = 30
						}else{
							singlePrice.value = 5
							overnightPrice.value = 50
						}	
					}
					orderData.singlePrice = singlePrice.value * 100
					break;
			}
		}
	*/
	//查询签到信息,并根据签到信息来初始化数据
	async function searchSignin() {
		try {
			const result = await siginHandler.SignIn_Search(res.uid)
			console.log("签到数据:", result.data)

			if (result.data && result.data.length > 0) {
				//console.log(result.data)
				Data.value = result.data
				isPlay.value = Data.value[0].isPlay//是否游玩机台
				isOvernight.value = Data.value[0].isOvernight//是否过夜
				getReservationData(Data.value[0].reservationid)//获取本次签到对应的预约信息
				startTime.value = result.data[0].starttime; // 从接口获取开始时间
				startDay.value = dayjs(startTime.value).format('YYYY-MM-DD')

				signinID.value = Data.value[0]._id
				reservationID.value = Data.value[0].reservationid
				console.log(signinID.value+" "+reservationID.value)
				//使用新的忙、闲时判断
				//today.value = dayjs(startTime.value).day()
				//新逻辑订单不由该页面生成,故订单相关全部弃用
				//console.log("订单开始于星期" + today.value)
				//setPriceByMembership()
				//orderData.starttime = startTime.value
				//orderData.reservation_id = Data.value[0].reservationid

				if (startTime.value && startTime.value !== 0) {
					startTimer(); // 开始计时
				}
				getPriceList(startTime.value)
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
	//从预约订单获得机台名称和预计结束时间
	const reservationData = reactive({
		"endtime": 0,
		"machineName": "",
	})
	async function getReservationData(content : string) {
		const res = await reservationHandler.SearchReservationInfo(content)
		reservationData.machineName = res.data[0].machineName
		reservationData.endtime = res.data[0].endTime
	}

	//计费相关
	function startTimer() {
		if (startTime.value === null || startTime.value === 0) return; // 确保有开始时间

		timerInterval = setInterval(() => {
			const now = Date.now();
			const elapsedMilliseconds = now - startTime.value;
			const elapsedSeconds = Math.floor(elapsedMilliseconds / 1000);
			// 更新显示的时间
			elapsedTime.value = formatTime(elapsedSeconds);
			// 更新当前日期
			nowDay.value = dayjs().format('YYYY-MM-DD')
			// 计算费用
			calculateFee(elapsedMilliseconds);
		}, 1000); // 每秒更新一次
	}
	// 总价计算
	function calculateFee(elapsedMilliseconds : number) {
		// 如果是周/月卡会员，费用为0
		if (membershipType.value == "weekly_monthly") {
			totalPrice.value = 0;
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
			// 不玩机台按20%收费
		} else {
			//普通预约按游玩时间计算，先确认是否游玩机台
			if (isPlay.value) {
				// 普通预约按时间计费
				const baseRate = singlePrice.value; // 不玩机台每半小时0元
				const calculatedPrice = halfHourUnits * baseRate;
				// 如果玩机台且超过封顶价格，使用封顶价格
				if (calculatedPrice > overnightPrice.value) {
					totalPrice.value = overnightPrice.value;
				} else {
					totalPrice.value = calculatedPrice;
				}
				// 跨日逻辑
				if ((startDay.value != nowDay.value) && !isOvernight.value) {
					if (totalPrice.value != overnightPrice.value) {
						totalPrice.value += (overnightPrice.value - (4 * baseRate))
					} else {
						totalPrice.value += overnightPrice.value
					}
				}
				/* //不再区分音游会员
				else if (membershipType.value == "none") {
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
			}*/
			} else {
				if (membershipType.value == "music_game") {
					const baseRate = 0; // 不玩机台每半小时0元
					const calculatedPrice = halfHourUnits * baseRate;
					totalPrice.value = calculatedPrice;
				} else if (membershipType.value == "none") {
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


	// ?
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
		GetUnhandleOrder()
		//getPriceList()
	})

	onUnmounted(() => {
		stopTimer(); // 组件卸载时停止定时器，避免内存泄漏
	})
</script>

<style scoped>
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

	.tips {
		font-size: 30rpx;
		color: gray;
		margin-top: 0rpx;
	}

	@media (prefers-color-scheme: dark) {

		/* 全局容器样式 */
		.container {
			padding: 30rpx;
			background: rgb(0, 0, 0);
			min-height: 100vh;
			box-sizing: border-box;
			padding-bottom: 200rpx;
			/* 为底部按钮留出空间 */
		}

		.glass-card {
			background: rgb(22, 22, 24);
			backdrop-filter: blur(10px);
			border-radius: 30rpx;
			box-shadow: 0 8rpx 32rpx rgba(31, 38, 135, 0.1);
			border: 1px solid rgba(255, 255, 255, 0.18);
			overflow: hidden;
			margin-bottom: 30rpx;
			transition: transform 0.3s ease, box-shadow 0.3s ease;
			padding: 16rpx;
		}

		.card-title {
			font-size: 32rpx;
			font-weight: bold;
			color: white;
		}

		.rate-info {
			font-size: 24rpx;
			color: lightgray;
			background: rgb(59, 59, 61);
			padding: 4rpx 16rpx;
			border-radius: 20rpx;
		}

		.record-label {
			font-size: 28rpx;
			color: lightgray;
			margin-bottom: 5rpx;
		}

		.record-time {
			font-size: 24rpx;
			color: darkgray;
		}

		.record-divider {
			height: 1rpx;
			background-color: rgb(51, 49, 50);
			margin: 15rpx 0;
		}

		/* 空状态样式 */
		.empty-text {
			font-size: 32rpx;
			color: lightgray;
			margin-top: 30rpx;
		}

		.empty-subtext {
			font-size: 24rpx;
			color: white;
			margin-top: 10rpx;
		}

		.active-card {
			background: rgb(191, 105, 18);
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

		.glass-card {
			background: rgb(22, 22, 24);
			backdrop-filter: blur(10px);
			border-radius: 30rpx;
			box-shadow: 0 8rpx 32rpx rgba(31, 38, 135, 0.1);
			border: 1px solid rgba(255, 255, 255, 0.18);
			overflow: hidden;
			margin-bottom: 30rpx;
			transition: transform 0.3s ease, box-shadow 0.3s ease;
			padding: 16rpx;
		}

		.tips {
			color: lightgray;
		}
	}
</style>