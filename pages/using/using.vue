<template>
	<view>
		<!-- 使用 v-if 来判断 Data 是否有数据，只渲染第一个数据项 -->
		<view v-if="Data && Data.length > 0" v-for="data in Data.slice(0,1)" :key="data._id">
			<!-- 当前预约的机台信息卡片 -->
			<uni-card style="background-color: rgb(254, 155, 0); border-radius: 30rpx;">
				<view style="display: flex; flex-direction: column; padding: 20rpx;">
					<text style="font-size: 32rpx; font-weight: bold; color: #fff;">{{ elapsedTime }}</text> <!-- 显示计时器 -->
					<text style="font-size: 24rpx; color: #fff; margin-top: 10rpx;">预约订单号</text>
					<text style="font-size: 28rpx; color: #fff;">{{data.reservationid || '无'}}</text> <br/> <!-- 使用 || '无' 防止空值显示 -->
					<text style="font-size: 24rpx; color: #fff;">签到订单号</text>
					<text style="font-size: 28rpx; color: #fff;">{{data._id || '无'}}</text> <br/> <!-- 使用 || '无' 防止空值显示 -->
				</view>
			</uni-card>

			<!-- 实时费用 -->
			<uni-card style="border-radius: 30rpx;">
				<view class="content">
					<view style="display: flex; justify-content: space-between; align-items: center;">
						<text class="title">实时费用</text>
						<text>{{singlePrice}}元/半小时</text>
					</view>
					<view style="margin-top: 10rpx;">
						<text style="font-size: 28rpx; font-weight: bold;">{{ totalPrice }} 元</text> <!-- 显示 totalPrice -->
					</view>
				</view>
			</uni-card>

			<!-- 使用记录 -->
			<uni-card style="border-radius: 30rpx;">
				<view class="content">
					<view style="display: flex; align-items: center;">
						<text class="title">使用记录</text>
					</view>
					<!-- 只有 starttime 不为 0 时才显示开始使用时间 -->
					<view v-if="data.starttime != 0" style="display: flex;justify-content: space-between; margin-top: 15rpx;">
						<view style="display: flex; align-items: center;">
							<uni-icons type="checkmarkempty" size="20" color="#4cd964"></uni-icons> <!-- 使用绿色图标 -->
							<text style="margin-left: 5rpx;">开始使用</text>
						</view>
						<view>
							<uni-dateformat :date="data.starttime"></uni-dateformat>
						</view>
					</view>
					<view v-else style="margin-top: 15rpx; color: gray;">
						<text>等待开始使用...</text> <!-- 提示等待开始 -->
					</view>
				</view>
			</uni-card>

			<!-- 按钮 -->
			<view style="display: flex;flex-direction: column;">
				<view class="bt" @click="submit()">结束使用并支付</view>
				<view class="bt" style="background-color: #E0E0E0" @click="askForHelp()">遇到问题</view>
			</view>
		</view>
		<view v-else>
			<uni-card>
				<view style="padding: 20rpx; text-align: center; color: gray;">
					暂无使用信息
				</view>
			</uni-card>
		</view>
	</view>
</template>


<script setup lang="ts">
	import { onMounted, ref, onUnmounted, computed } from 'vue' // 引入 onUnmounted 和 computed
	const todo = uniCloud.importObject('todo')
	const res = uniCloud.getCurrentUserInfo('uni_id_token')

	interface signInData {
		"_id": string
		"reservationid": string
		"isPlay": boolean
		"starttime": number
		"endtime": number
	}
	const Data = ref<signInData[]>([])
	const singlePrice = ref(5) // 单价，可以考虑从后台获取
	const totalPrice = ref(0) // 总价，实时更新
	const startTime = ref<number | null>(null) // 开始时间戳，从 Data 中获取
	const elapsedTime = ref("00:00:00") // 格式化后的已用时间
	let timerInterval: number | null = null // 定时器 interval id

	function submit() {
		uni.showToast({
			title: "结束使用并支付 (功能待完善)",
			icon: 'none'
		})
		// TODO: 调用云函数结束使用，计算总价，跳转支付页面
	}
	function askForHelp() {
		uni.showToast({
			title: "遇到问题 (功能待完善)",
			icon: 'none'
		})
		// TODO: 打开客服/帮助页面或弹窗
	}

	async function searchSignin() {
		try {
			const result = await todo.SignIn_Search(res.uid)
			console.log("签到数据:", result.data)
			if (result.data && result.data.length > 0) {
				Data.value = result.data
				startTime.value = result.data[0].starttime; // 从接口获取开始时间
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

	function startTimer() {
		if (startTime.value === null || startTime.value === 0) return; // 确保有开始时间

		timerInterval = setInterval(() => {
			const now = Date.now();
			const elapsedMilliseconds = now - startTime.value;
			const elapsedSeconds = Math.floor(elapsedMilliseconds / 1000);

			// 计算总价 (假设每半小时 singlePrice 元)
			const elapsedMinutes = elapsedSeconds / 60;
			const priceIntervals = Math.ceil(elapsedMinutes / 30); // 向上取整，不满半小时也算半小时
			totalPrice.value = priceIntervals * singlePrice.value;

			elapsedTime.value = formatTime(elapsedSeconds);
		}, 1000); // 每秒更新一次
	}

	function stopTimer() {
		if (timerInterval) {
			clearInterval(timerInterval);
			timerInterval = null;
		}
	}

	function formatTime(totalSeconds: number): string {
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
		console.log(Data)
	})

	onUnmounted(() => {
		stopTimer(); // 组件卸载时停止定时器，避免内存泄漏
	})

</script>

<style scoped>
	.bt {
		margin: 20rpx 30rpx;
		background-color: rgb(249, 203, 20);
		border-radius: 20rpx;
		height: 120rpx;
		display: flex;
		justify-content: center;
		align-items: center;
		color: #fff; /* 按钮文字颜色 */
		font-size: 36rpx; /* 按钮文字大小 */
		font-weight: bold; /* 按钮文字加粗 */
	}

	.content {
		display: flex;
		flex-direction: column;
		padding: 20rpx; /* 内容区域增加内边距 */
	}

	.title {
		margin-left: 10rpx;
		font-size: 35rpx;
		font-weight: bold;
		color: #333; /* 标题文字颜色 */
	}

	.divider {
		height: 2rpx;
		background-color: gray;
		margin-top: 15rpx;
		margin-bottom: 15rpx;
	}

	.tips {
		font-size: 20rpx;
		color: gray;
	}
</style>
